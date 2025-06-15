import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { getQueryParam } from "@/src/utils/url-helpers";
import { container } from "@/src/di/container";

export const GET = withAuth(async (user) => {
  try {
    const repository = container.budgetRepository;
    const recurrentTransactions = await repository.getRecurrentTransactions({
      userId: user.userId,
    });

    return NextResponse.json({
      success: true,
      recurrentTransactions,
    });
  } catch (error) {
    console.error("Error en GET /api/recurrent-transactions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { recurrentTransaction } = body;

    if (!recurrentTransaction) {
      return NextResponse.json(
        { error: "Datos de transacción recurrente son requeridos" },
        { status: 400 }
      );
    }

    const createRecurrentTransactionUseCase =
      container.createRecurrentTransactionUseCase;
    const result = await createRecurrentTransactionUseCase.execute({
      userId: user.userId,
      ...recurrentTransaction,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al crear la transacción recurrente" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recurrentTransaction: result.recurrentTransaction,
    });
  } catch (error) {
    console.error("Error en POST /api/recurrent-transactions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (user, request: NextRequest) => {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { error: "ID y actualizaciones son requeridos" },
        { status: 400 }
      );
    }

    const repository = container.budgetRepository;
    const result = await repository.updateRecurrentTransaction({
      userId: user.userId,
      id,
      updates,
    });

    if (!result) {
      return NextResponse.json(
        { error: "No se pudo actualizar la transacción recurrente" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      recurrentTransaction: result,
    });
  } catch (error) {
    console.error("Error en PUT /api/recurrent-transactions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (user, request: NextRequest) => {
  try {
    const id = getQueryParam(request, "id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const repository = container.budgetRepository;
    const success = await repository.deleteRecurrentTransaction({
      userId: user.userId,
      id,
    });

    if (!success) {
      return NextResponse.json(
        { error: "No se pudo eliminar la transacción recurrente" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transacción recurrente eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/recurrent-transactions:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
