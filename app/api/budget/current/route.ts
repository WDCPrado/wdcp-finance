import { NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";

export const GET = withAuth(async (user) => {
  try {
    const getCurrentBudgetUseCase = container.getCurrentBudgetUseCase;

    // El caso de uso actual no recibe userId, necesito adaptarlo
    const result = await getCurrentBudgetUseCase.execute({
      userId: user.userId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al obtener el presupuesto actual" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      budget: result.budget,
    });
  } catch (error) {
    console.error("Error en GET /api/budget/current:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
