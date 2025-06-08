import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { MonthlyBudget, BudgetSummary } from "../../types/budget";

export interface GetCurrentBudgetResponse {
  success: boolean;
  budget?: MonthlyBudget;
  summary?: BudgetSummary;
  error?: string;
  isFirstTime?: boolean;
}

export class GetCurrentBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute(): Promise<GetCurrentBudgetResponse> {
    try {
      // Intentar obtener el presupuesto actual
      let budget = await this.budgetRepository.getCurrentBudget();

      // Si no existe, verificar si es primera vez
      if (!budget) {
        const allBudgets = await this.budgetRepository.getBudgets();

        if (allBudgets.length === 0) {
          // Primera vez usando la aplicación
          return {
            success: true,
            isFirstTime: true,
          };
        } else {
          // Existe presupuestos anteriores, intentar crear desde mes anterior
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();

          budget = await this.budgetRepository.createFromPreviousMonth({
            month: currentMonth,
            year: currentYear,
          });

          if (!budget) {
            return {
              success: false,
              error: "No se pudo crear el presupuesto para el mes actual",
            };
          }
        }
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
