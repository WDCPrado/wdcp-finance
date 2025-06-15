import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Crear respuesta de logout exitoso
    const res = NextResponse.json({ message: "Logout exitoso" });

    // Limpiar cookies de autenticación
    res.cookies.delete("accessToken");
    res.cookies.delete("refreshToken");

    return res;
  } catch (error) {
    console.error("Error en logout:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
