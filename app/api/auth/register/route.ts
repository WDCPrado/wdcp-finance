import { NextRequest, NextResponse } from "next/server";
import { signJWT, signRefreshToken } from "@/src/utils/auth";
import { container } from "@/src/di/container";
import type { RegisterCredentials, AuthResponse } from "@/src/types/auth";

export async function POST(request: NextRequest) {
  try {
    const body: RegisterCredentials = await request.json();
    const { name, email, password } = body;

    // Validar campos requeridos
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Usar el caso de uso para registro
    const registerUseCase = container.registerUserUseCase;
    const result = await registerUseCase.execute({ name, email, password });

    if (!result.success || !result.user) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Generar tokens
    const tokenPayload = { userId: result.user.id, email: result.user.email };
    const accessToken = await signJWT(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    const response: AuthResponse = {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name || "Usuario",
        role: "user",
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };

    // Crear respuesta con cookies
    const res = NextResponse.json(response);

    // Configurar cookies seguras
    res.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60, // 15 minutos
      path: "/",
    });

    res.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
