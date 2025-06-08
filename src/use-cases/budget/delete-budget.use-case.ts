import { IBudgetRepository } from "../../interfaces/budget-repository.interface";

export interface DeleteBudgetRequest {
  budgetId: string;
}

export interface DeleteBudgetResponse {
  success: boolean;
  error?: string;
}

export class DeleteBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    budgetId,
  }: DeleteBudgetRequest): Promise<DeleteBudgetResponse> {
    try {
      // Validaciones básicas
      if (!budgetId || budgetId.trim() === "") {
        return {
          success: false,
          error: "ID del presupuesto es requerido",
        };
      }

      // Verificar que el presupuesto existe antes de eliminarlo
      const allBudgets = await this.budgetRepository.getBudgets();
      const budgetExists = allBudgets.some((budget) => budget.id === budgetId);

      if (!budgetExists) {
        return {
          success: false,
          error: "El presupuesto no existe",
        };
      }

      // Eliminar el presupuesto
      const result = await this.budgetRepository.deleteBudget({ id: budgetId });

      if (!result) {
        return {
          success: false,
          error: "No se pudo eliminar el presupuesto",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al eliminar presupuesto",
      };
    }
  }
}
