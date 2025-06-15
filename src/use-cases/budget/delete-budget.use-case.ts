import { IBudgetRepository } from "../../interfaces/budget-repository.interface";

export interface DeleteBudgetRequest {
  userId: string;
  budgetId: string;
}

export interface DeleteBudgetResponse {
  success: boolean;
  error?: string;
}

export class DeleteBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    userId,
    budgetId,
  }: DeleteBudgetRequest): Promise<DeleteBudgetResponse> {
    try {
      // Validaciones básicas
      if (!userId) {
        return {
          success: false,
          error: "UserId es requerido",
        };
      }

      if (!budgetId || budgetId.trim() === "") {
        return {
          success: false,
          error: "ID del presupuesto es requerido",
        };
      }

      // Verificar que el presupuesto existe y pertenece al usuario
      const userBudgets = await this.budgetRepository.getBudgets({ userId });
      const budgetExists = userBudgets.some((budget) => budget.id === budgetId);

      if (!budgetExists) {
        return {
          success: false,
          error: "El presupuesto no existe o no tiene permisos para eliminarlo",
        };
      }

      // Eliminar el presupuesto
      const result = await this.budgetRepository.deleteBudget({
        userId,
        id: budgetId,
      });

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
