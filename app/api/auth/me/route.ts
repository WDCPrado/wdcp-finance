import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, extractTokenFromCookie } from "@/src/utils/auth";
import { container } from "@/src/di/container";

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const accessToken = extractTokenFromCookie(cookieHeader);

    if (!accessToken) {
      return NextResponse.json(
        { error: "Token no encontrado" },
        { status: 401 }
      );
    }

    // Verificar el token
    const payload = await verifyJWT(accessToken);

    // Obtener información del usuario desde el repositorio
    const userRepository = container.userRepository;
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Devolver información del usuario con formato compatible
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name || "Usuario",
      role: "user",
    };

    return NextResponse.json(userResponse);
  } catch (error) {
    console.error("Error obteniendo usuario:", error);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
