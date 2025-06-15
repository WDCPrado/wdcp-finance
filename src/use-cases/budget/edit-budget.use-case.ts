import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { MonthlyBudget, Category } from "../../types/budget";

export interface EditBudgetRequest {
  userId: string;
  budgetId: string;
  name?: string;
  totalIncome?: number;
  categories?: Category[];
}

export interface EditBudgetResponse {
  success: boolean;
  budget?: MonthlyBudget;
  error?: string;
}

export class EditBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    userId,
    budgetId,
    name,
    totalIncome,
    categories,
  }: EditBudgetRequest): Promise<EditBudgetResponse> {
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
      const existingBudget = userBudgets.find(
        (budget) => budget.id === budgetId
      );

      if (!existingBudget) {
        return {
          success: false,
          error: "El presupuesto no existe o no tiene permisos para editarlo",
        };
      }

      // Validar datos si se proporcionan
      if (name !== undefined && name.trim() === "") {
        return {
          success: false,
          error: "El nombre del presupuesto no puede estar vacío",
        };
      }

      if (totalIncome !== undefined && totalIncome < 0) {
        return {
          success: false,
          error: "El ingreso total no puede ser negativo",
        };
      }

      if (categories !== undefined) {
        // Validar categorías
        for (const category of categories) {
          if (!category.name || category.name.trim() === "") {
            return {
              success: false,
              error: "Todas las categorías deben tener un nombre",
            };
          }

          if (category.budgetAmount < 0) {
            return {
              success: false,
              error: "Los montos presupuestados no pueden ser negativos",
            };
          }
        }

        // Verificar nombres únicos de categorías
        const categoryNames = categories.map((cat) =>
          cat.name.toLowerCase().trim()
        );
        const uniqueNames = new Set(categoryNames);

        if (categoryNames.length !== uniqueNames.size) {
          return {
            success: false,
            error: "No puede haber categorías con nombres duplicados",
          };
        }
      }

      // Preparar actualizaciones
      const updates: Partial<MonthlyBudget> = {};

      if (name !== undefined) {
        updates.name = name.trim();
      }

      if (totalIncome !== undefined) {
        updates.totalIncome = totalIncome;
      }

      if (categories !== undefined) {
        updates.categories = categories;
      }

      // Actualizar el presupuesto
      const updatedBudget = await this.budgetRepository.updateMonthlyBudget({
        userId,
        id: budgetId,
        updates,
      });

      if (!updatedBudget) {
        return {
          success: false,
          error: "No se pudo actualizar el presupuesto",
        };
      }

      return {
        success: true,
        budget: updatedBudget,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido al editar presupuesto",
      };
    }
  }
}
