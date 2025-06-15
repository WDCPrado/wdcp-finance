import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type {
  IUserRepository,
  CreateUserData,
  UserWithProfile,
} from "../interfaces/user-repository.interface";
import type { User } from "@prisma/client";

export class UserRepository implements IUserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(data: CreateUserData): Promise<UserWithProfile> {
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: Partial<CreateUserData>
  ): Promise<UserWithProfile> {
    const updateData: Partial<CreateUserData> & { password?: string } = {
      ...data,
    };

    // Si se actualiza la contraseña, hashearla
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  // Método auxiliar para verificar contraseñas
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Método para desconectar Prisma (útil para testing)
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
