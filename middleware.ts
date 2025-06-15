import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifyJWT,
  extractTokenFromCookie,
  extractRefreshTokenFromCookie,
} from "@/src/utils/auth";

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard"];

// Rutas de autenticación que no deberían ser accesibles si ya está logueado
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Obtener tokens de las cookies
  const cookieHeader = request.headers.get("cookie") || "";
  const accessToken = extractTokenFromCookie(cookieHeader);
  const refreshToken = extractRefreshTokenFromCookie(cookieHeader);

  let isValidToken = false;
  let needsRefresh = false;

  // Verificar access token
  if (accessToken) {
    try {
      await verifyJWT(accessToken);
      isValidToken = true;
    } catch {
      // Access token inválido o expirado
      needsRefresh = true;
    }
  } else {
    needsRefresh = true;
  }

  // Si el access token no es válido, intentar refresh
  if (needsRefresh && refreshToken) {
    try {
      await verifyJWT(refreshToken);
      // Refresh token válido, redirigir a endpoint de refresh
      const refreshUrl = new URL("/api/auth/refresh", request.url);
      refreshUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(refreshUrl);
    } catch {
      // Refresh token también inválido
      isValidToken = false;
    }
  }

  // Lógica de redirección
  if (isProtectedRoute && !isValidToken) {
    // Usuario no autenticado intentando acceder a ruta protegida
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isValidToken) {
    // Usuario autenticado intentando acceder a rutas de auth
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
