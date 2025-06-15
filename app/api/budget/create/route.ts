import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { name, month, year, totalIncome, categories } = body;

    // Validaciones básicas
    if (!name || !month || !year || !totalIncome || !categories) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const createBudgetUseCase = container.createBudgetUseCase;
    const result = await createBudgetUseCase.execute({
      userId: user.userId,
      name,
      month,
      year,
      totalIncome: parseFloat(totalIncome),
      categories,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al crear el presupuesto" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      budget: result.budget,
    });
  } catch (error) {
    console.error("Error en POST /api/budget/create:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
