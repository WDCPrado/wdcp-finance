import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { MonthlyBudget, BudgetSummary } from "../../types/budget";

export interface GetBudgetByMonthRequest {
  month: number;
  year: number;
}

export interface GetBudgetByMonthResponse {
  success: boolean;
  budget?: MonthlyBudget;
  summary?: BudgetSummary;
  error?: string;
  shouldCreateFromPrevious?: boolean;
}

export class GetBudgetByMonthUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    month,
    year,
  }: GetBudgetByMonthRequest): Promise<GetBudgetByMonthResponse> {
    try {
      // Validaciones básicas
      if (month < 1 || month > 12) {
        return {
          success: false,
          error: "El mes debe estar entre 1 y 12",
        };
      }

      if (year < 2020 || year > 2050) {
        return {
          success: false,
          error: "El año debe estar entre 2020 y 2050",
        };
      }

      // Intentar obtener el presupuesto para el mes/año específico
      const budget = await this.budgetRepository.getBudgetByMonth({
        month,
        year,
      });

      if (!budget) {
        // Verificar si existe algún presupuesto anterior para sugerir creación
        const allBudgets = await this.budgetRepository.getBudgets();

        const hasPreviousBudgets = allBudgets.some(
          (b) => b.year < year || (b.year === year && b.month < month)
        );

        return {
          success: true,
          shouldCreateFromPrevious: hasPreviousBudgets,
        };
      }

      // Obtener resumen del presupuesto
      const summary = await this.budgetRepository.getBudgetSummary({
        budgetId: budget.id,
      });

      return {
        success: true,
        budget,
        summary: summary || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
