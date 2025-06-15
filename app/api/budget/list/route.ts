import { NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";

export const GET = withAuth(async (user) => {
  try {
    const budgetRepository = container.budgetRepository;
    const budgets = await budgetRepository.getBudgets({ userId: user.userId });

    return NextResponse.json({
      success: true,
      budgets,
    });
  } catch (error) {
    console.error("Error en GET /api/budget/list:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
