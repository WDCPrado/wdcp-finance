import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { getQueryParam } from "@/src/utils/url-helpers";
import { container } from "@/src/di/container";

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    const budgetId = getQueryParam(request, "budgetId");

    if (!budgetId) {
      return NextResponse.json(
        { error: "BudgetId es requerido" },
        { status: 400 }
      );
    }

    const budgetRepository = container.budgetRepository;
    const summary = await budgetRepository.getBudgetSummary({
      userId: user.userId,
      budgetId,
    });

    if (!summary) {
      return NextResponse.json(
        { error: "No se encontró el resumen del presupuesto" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error en GET /api/budget/summary:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
