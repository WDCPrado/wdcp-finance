import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-here"
);

export interface JWTPayload {
  userId: string;
  email: string;
  exp: number;
  iat: number;
}

export async function signJWT(
  payload: Omit<JWTPayload, "exp" | "iat">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m") // Access token expires in 15 minutes
    .sign(JWT_SECRET);
}

export async function signRefreshToken(
  payload: Omit<JWTPayload, "exp" | "iat">
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Refresh token expires in 7 days
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    throw new Error("Invalid token");
  }
}

export function extractTokenFromCookie(cookies: string): string | null {
  const match = cookies.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

export function extractRefreshTokenFromCookie(cookies: string): string | null {
  const match = cookies.match(/refreshToken=([^;]+)/);
  return match ? match[1] : null;
}
