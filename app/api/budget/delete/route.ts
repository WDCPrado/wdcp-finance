import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { getQueryParam } from "@/src/utils/url-helpers";
import { container } from "@/src/di/container";

export const DELETE = withAuth(async (user, request: NextRequest) => {
  try {
    const budgetId = getQueryParam(request, "budgetId");

    if (!budgetId) {
      return NextResponse.json(
        { error: "BudgetId es requerido" },
        { status: 400 }
      );
    }

    const deleteBudgetUseCase = container.deleteBudgetUseCase;
    const result = await deleteBudgetUseCase.execute({
      userId: user.userId,
      budgetId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al eliminar el presupuesto" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Presupuesto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/budget/delete:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
