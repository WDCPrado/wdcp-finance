import { NextRequest } from "next/server";
import { verifyJWT, extractTokenFromCookie } from "./auth";

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/**
 * Extrae y verifica el usuario autenticado desde los headers de la request
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const cookieHeader = request.headers.get("cookie") || "";
  const accessToken = extractTokenFromCookie(cookieHeader);

  if (!accessToken) {
    throw new Error("Token de acceso no encontrado");
  }

  try {
    const payload = await verifyJWT(accessToken);
    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch {
    throw new Error("Token de acceso inválido");
  }
}

/**
 * Wrapper para APIs protegidas que requieren autenticación
 */
export function withAuth<T extends unknown[]>(
  handler: (
    user: AuthenticatedUser,
    request: NextRequest,
    ...args: T
  ) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await getAuthenticatedUser(request);
      return await handler(user, request, ...args);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error de autenticación";
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
