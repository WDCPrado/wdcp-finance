import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { getQueryParams } from "@/src/utils/url-helpers";
import { container } from "@/src/di/container";

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { budgetId, transaction } = body;

    // Validaciones básicas
    if (!budgetId || !transaction) {
      return NextResponse.json(
        { error: "BudgetId y datos de transacción son requeridos" },
        { status: 400 }
      );
    }

    const addTransactionUseCase = container.addTransactionUseCase;
    const result = await addTransactionUseCase.execute({
      userId: user.userId,
      budgetId,
      transaction,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al agregar la transacción" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error en POST /api/budget/transaction:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (user, request: NextRequest) => {
  try {
    const { budgetId, transactionId } = getQueryParams(request, [
      "budgetId",
      "transactionId",
    ]);

    if (!budgetId || !transactionId) {
      return NextResponse.json(
        { error: "BudgetId y transactionId son requeridos" },
        { status: 400 }
      );
    }

    const budgetRepository = container.budgetRepository;
    const success = await budgetRepository.deleteTransaction({
      userId: user.userId,
      budgetId,
      transactionId,
    });

    if (!success) {
      return NextResponse.json(
        { error: "No se pudo eliminar la transacción" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transacción eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/budget/transaction:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
