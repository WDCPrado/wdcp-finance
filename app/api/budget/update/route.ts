import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";
import { Category } from "@/src/types/budget";

export const PUT = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { budgetId, name, totalIncome, categories } = body;

    console.log("PUT /api/budget/update - Request:", {
      userId: user.userId,
      budgetId,
      name,
      totalIncome,
      categoriesCount: categories?.length,
      categories: categories?.map((c: Category) => ({
        id: c.id,
        name: c.name,
        type: c.type,
      })),
    });

    // Validaciones básicas
    if (!budgetId) {
      return NextResponse.json(
        { error: "BudgetId es requerido" },
        { status: 400 }
      );
    }

    const editBudgetUseCase = container.editBudgetUseCase;
    const result = await editBudgetUseCase.execute({
      userId: user.userId,
      budgetId,
      name,
      totalIncome,
      categories,
    });

    console.log("PUT /api/budget/update - Result:", {
      success: result.success,
      error: result.error,
      budgetId: result.budget?.id,
      categoriesCount: result.budget?.categories?.length,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al actualizar el presupuesto" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      budget: result.budget,
    });
  } catch (error) {
    console.error("Error en PUT /api/budget/update:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
