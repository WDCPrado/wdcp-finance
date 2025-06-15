import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { MonthlyBudget, BudgetSummary } from "../../types/budget";

export interface GetBudgetByMonthRequest {
  userId: string;
  month: number;
  year: number;
}

export interface GetBudgetByMonthResponse {
  success: boolean;
  budget?: MonthlyBudget;
  summary?: BudgetSummary;
  error?: string;
}

export class GetBudgetByMonthUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(
    request: GetBudgetByMonthRequest
  ): Promise<GetBudgetByMonthResponse> {
    try {
      const { userId, month, year } = request;

      // Validar datos de entrada
      if (!userId || !month || !year) {
        return {
          success: false,
          error: "UserId, mes y año son requeridos",
        };
      }

      if (month < 1 || month > 12) {
        return {
          success: false,
          error: "El mes debe estar entre 1 y 12",
        };
      }

      // Obtener el presupuesto del mes específico
      const budget = await this.budgetRepository.getBudgetByMonth({
        userId,
        month,
        year,
      });

      if (!budget) {
        return {
          success: true,
          budget: undefined,
        };
      }

      // Obtener resumen del presupuesto
      const summary = await this.budgetRepository.getBudgetSummary({
        userId,
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
