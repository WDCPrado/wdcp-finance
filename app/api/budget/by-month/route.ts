import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/utils/auth-server";
import { getQueryParams } from "@/src/utils/url-helpers";
import { container } from "@/src/di/container";

export const GET = withAuth(async (user, request: NextRequest) => {
  try {
    const { month: monthStr, year: yearStr } = getQueryParams(request, [
      "month",
      "year",
    ]);
    const month = parseInt(monthStr || "0");
    const year = parseInt(yearStr || "0");

    if (!month || !year) {
      return NextResponse.json(
        { error: "Los parámetros month y year son requeridos" },
        { status: 400 }
      );
    }

    const getBudgetByMonthUseCase = container.getBudgetByMonthUseCase;
    const result = await getBudgetByMonthUseCase.execute({
      userId: user.userId,
      month,
      year,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al obtener el presupuesto" },
        { status: 400 }
      );
    }

    // Si no existe presupuesto, devolver success: true con budget: null
    // El frontend manejará esta situación mostrando opciones para crear
    return NextResponse.json({
      success: true,
      budget: result.budget || null,
      summary: result.summary || null,
    });
  } catch (error) {
    console.error("Error en GET /api/budget/by-month:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
});
