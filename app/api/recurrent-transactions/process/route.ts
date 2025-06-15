import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { targetDate, targetMonth, targetYear } = body;

    const processRecurrentTransactionsUseCase =
      container.processRecurrentTransactionsUseCase;
    const result = await processRecurrentTransactionsUseCase.execute({
      userId: user.userId,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      targetMonth,
      targetYear,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Error al procesar transacciones recurrentes",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionsCreated: result.transactionsCreated,
      budgetsCreated: result.budgetsCreated,
      budgetsUpdated: result.budgetsUpdated,
      warnings: result.warnings,
    });
  } catch (error) {
    console.error("Error en POST /api/recurrent-transactions/process:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
