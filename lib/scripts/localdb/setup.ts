import { exec } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
const unlinkPromise = promisify(fs.unlink);

// Available PostgreSQL versions as a type
type PostgresVersion = "12" | "13" | "14" | "15" | "16" | "17";

// Global configuration
const POSTGRES_VERSION: PostgresVersion = "17";
const CONTAINER_NAME = "pg_local_ecr";
const DUMP_FILE = "db_dump.pg";
const RESTART_POLICY = true; // Set to true to restart container with system (--restart unless-stopped)

// Helper function to ensure dump file is removed
async function cleanupDumpFile() {
  try {
    const dumpPath = path.resolve(process.cwd(), DUMP_FILE);
    if (fs.existsSync(dumpPath)) {
      await unlinkPromise(dumpPath);
      console.log(`Removed dump file: ${dumpPath}`);
    }
  } catch (error) {
    console.warn("Warning: Could not remove dump file", error);
  }
}

// Helper function to execute commands with better error handling
async function runCommand(
  command: string,
  description: string
): Promise<string> {
  try {
    console.log(`STEP: ${description}`);
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes("WARNING")) {
      console.warn(`Warning: ${stderr}`);
    }
    return stdout;
  } catch (error: unknown) {
    console.error(`Error during "${description}": ${error}`);
    if (error instanceof Error && "stderr" in error) {
      console.error(`Error details: ${error.stderr}`);
    }
    throw error;
  }
}

async function setup() {
  // Register cleanup handler for unexpected exits
  process.on("SIGINT", async () => {
    console.log("Process interrupted. Cleaning up...");
    await cleanupDumpFile();
    process.exit(1);
  });

  try {
    // Always clean up any existing dump file at the start
    await cleanupDumpFile();

    // Load environment variables
    dotenv.config();

    const prodUrl = process.env.DATABASE_URL_PRODUCTION;
    const localUrl = process.env.DATABASE_URL_LOCAL;

    if (!prodUrl || !localUrl) {
      throw new Error(
        "DATABASE_URL_PRODUCTION or DATABASE_URL_LOCAL not found in environment variables"
      );
    }

    // Parse PostgreSQL connection strings
    const parsePgUrl = (url: string) => {
      const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = url.match(regex);
      if (!match) throw new Error(`Invalid PostgreSQL URL: ${url}`);
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: match[4],
        dbname: match[5],
      };
    };

    const prod = parsePgUrl(prodUrl);
    const local = parsePgUrl(localUrl);

    // Verify Docker is running
    await runCommand("docker ps", "Verifying Docker is running");

    // Stop and remove existing container if it exists
    await runCommand(
      `docker ps -a --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" | xargs -r docker rm -f`,
      "Removing existing container if it exists"
    );

    // Check if PostgreSQL image exists locally
    try {
      await runCommand(
        `docker image inspect postgres:${POSTGRES_VERSION}`,
        "Checking for PostgreSQL image"
      );
    } catch (error) {
      console.log("Error checking for PostgreSQL image:", error);
      await runCommand(
        `docker pull postgres:${POSTGRES_VERSION}`,
        "Pulling PostgreSQL image"
      );
    }

    // Create a new PostgreSQL container with a temporary database first
    const tempDbName = "postgres";
    const restartFlag = RESTART_POLICY ? "--restart unless-stopped" : "";
    const createContainerCmd = `docker run --name ${CONTAINER_NAME} ${restartFlag} -e POSTGRES_USER=${local.user} -e POSTGRES_PASSWORD=${local.password} -e POSTGRES_DB=${tempDbName} -p ${local.port}:5432 -d postgres:${POSTGRES_VERSION}`;
    await runCommand(createContainerCmd, "Creating PostgreSQL container");

    // Wait for PostgreSQL to start up
    let ready = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!ready && attempts < maxAttempts) {
      attempts++;
      try {
        const logs = await runCommand(
          `docker logs ${CONTAINER_NAME} 2>&1 | grep "database system is ready to accept connections"`,
          `Waiting for PostgreSQL to initialize (${attempts}/${maxAttempts})`
        );

        if (logs.trim()) {
          ready = true;
          console.log("PostgreSQL is ready!");
        }
      } catch (error) {
        console.log("Error waiting for PostgreSQL to initialize:", error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!ready) {
      throw new Error("PostgreSQL initialization timed out");
    }

    // Drop the target database if it exists and create a fresh one
    await runCommand(
      `docker exec ${CONTAINER_NAME} psql -U ${local.user} -c "DROP DATABASE IF EXISTS ${local.dbname}"`,
      "Dropping existing database if it exists"
    );

    await runCommand(
      `docker exec ${CONTAINER_NAME} psql -U ${local.user} -c "CREATE DATABASE ${local.dbname}"`,
      "Creating fresh database"
    );

    // Use docker to run pg_dump inside the container
    await runCommand(
      `docker run --rm -d --name pg_dump_temp postgres:${POSTGRES_VERSION} sleep 300`,
      "Creating temporary container for database dump"
    );

    try {
      // Use the temporary container to run pg_dump with password
      await runCommand(
        `docker exec -e PGPASSWORD="${prod.password}" pg_dump_temp pg_dump -h ${prod.host} -p ${prod.port} -U ${prod.user} -d ${prod.dbname} -F c -f /tmp/${DUMP_FILE} -v`,
        "Dumping production database"
      );

      // Copy dump file from temporary container to host
      await runCommand(
        `docker cp pg_dump_temp:/tmp/${DUMP_FILE} ./${DUMP_FILE}`,
        "Retrieving database dump"
      );
    } catch (error: unknown) {
      console.error("Error during database dump:", error);
      // Cleanup on error
      await execAsync(`docker rm -f pg_dump_temp`).catch(() => {});
      await cleanupDumpFile();
      process.exit(1);
    }

    // Clean up temporary container
    await runCommand(
      `docker rm -f pg_dump_temp`,
      "Cleaning up temporary container"
    );

    // Restore the dump to the local container
    try {
      // Copy dump file into the container
      await runCommand(
        `docker cp ./${DUMP_FILE} ${CONTAINER_NAME}:/tmp/${DUMP_FILE}`,
        "Copying dump file to local container"
      );

      // Restore the database - Remove -c flag since we've already dropped and created the database
      await runCommand(
        `docker exec ${CONTAINER_NAME} pg_restore -U ${local.user} -d ${local.dbname} /tmp/${DUMP_FILE}`,
        "Restoring database to fresh database"
      );

      // Verify restoration by listing tables
      const tables = await runCommand(
        `docker exec ${CONTAINER_NAME} psql -U ${local.user} -d ${local.dbname} -c "\\dt"`,
        "Verifying database restoration"
      );

      console.log("Database tables:");
      console.log(tables);
    } catch (error) {
      console.error("Error restoring database:", error);
      await cleanupDumpFile();
      process.exit(1);
    }

    // Clean up dump files
    await cleanupDumpFile();
    await runCommand(
      `docker exec ${CONTAINER_NAME} rm -f /tmp/${DUMP_FILE}`,
      "Removing dump file from container"
    ).catch((err) =>
      console.warn("Warning: Could not remove dump file from container", err)
    );

    console.log("✅ Database clone completed successfully!");
    console.log(`📊 Local database available at: ${localUrl}`);

    if (RESTART_POLICY) {
      console.log("🔄 Container will automatically restart with your system");
    }
  } catch (error) {
    console.error("❌ Error setting up local database:", error);
    await cleanupDumpFile();
    process.exit(1);
  } finally {
    // Final cleanup to ensure the dump file is gone
    await cleanupDumpFile();
  }
}

setup();
