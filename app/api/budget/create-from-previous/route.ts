import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { month, year } = body;

    // Validaciones básicas
    if (!month || !year) {
      return NextResponse.json(
        { error: "Mes y año son requeridos" },
        { status: 400 }
      );
    }

    const budgetRepository = container.budgetRepository;
    const budget = await budgetRepository.createFromPreviousMonth({
      userId: user.userId,
      month,
      year,
    });

    if (!budget) {
      return NextResponse.json(
        { error: "No se pudo crear el presupuesto desde el mes anterior" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      budget,
    });
  } catch (error) {
    console.error("Error en POST /api/budget/create-from-previous:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
