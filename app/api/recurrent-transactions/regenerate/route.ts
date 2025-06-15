import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { container } from "@/src/di/container";

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { recurrenceId, targetMonth, targetYear } = body;

    // Validaciones básicas
    if (!recurrenceId || !targetMonth || !targetYear) {
      return NextResponse.json(
        { error: "RecurrenceId, targetMonth y targetYear son requeridos" },
        { status: 400 }
      );
    }

    const processRecurrentTransactionsUseCase =
      container.processRecurrentTransactionsUseCase;
    const result =
      await processRecurrentTransactionsUseCase.regenerateDeletedTransaction({
        userId: user.userId,
        recurrenceId,
        targetMonth,
        targetYear,
      });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al regenerar la transacción" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transacción regenerada exitosamente",
    });
  } catch (error) {
    console.error(
      "Error en POST /api/recurrent-transactions/regenerate:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
