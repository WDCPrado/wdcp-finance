import { NextRequest, NextResponse } from "next/server";
import {
  verifyJWT,
  signJWT,
  extractRefreshTokenFromCookie,
} from "@/src/utils/auth";
import type { RefreshTokenResponse } from "@/src/types/auth";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshToken = extractRefreshTokenFromCookie(cookieHeader);

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token no encontrado" },
        { status: 401 }
      );
    }

    // Verificar refresh token
    const payload = await verifyJWT(refreshToken);

    // Generar nuevo access token
    const newAccessToken = await signJWT({
      userId: payload.userId,
      email: payload.email,
    });

    const response: RefreshTokenResponse = {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Reutilizar el mismo refresh token
    };

    // Obtener URL de redirección si existe
    const redirectUrl = request.nextUrl.searchParams.get("redirect");

    let res: NextResponse;

    if (redirectUrl) {
      // Redirigir al usuario a la página que intentaba acceder
      res = NextResponse.redirect(new URL(redirectUrl, request.url));
    } else {
      // Solo devolver el nuevo token
      res = NextResponse.json(response);
    }

    // Configurar cookie con nuevo access token
    res.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutos
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Error en refresh:", error);

    // Si el refresh token es inválido, limpiar cookies y redirigir al login
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");

    return res;
  }
}
