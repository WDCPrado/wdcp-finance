import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { Transaction } from "../../types/budget";

export interface AddTransactionRequest {
  userId: string;
  budgetId: string;
  transaction: {
    type: "income" | "expense";
    amount: number;
    description: string;
    categoryId: string;
    date: Date;
  };
}

export interface AddTransactionResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
  warnings?: string[];
}

export class AddTransactionUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    userId,
    budgetId,
    transaction,
  }: AddTransactionRequest): Promise<AddTransactionResponse> {
    try {
      const warnings: string[] = [];

      // Validaciones de negocio
      if (!userId) {
        return {
          success: false,
          error: "UserId es requerido",
        };
      }

      if (transaction.amount <= 0) {
        return {
          success: false,
          error: "El monto debe ser mayor que cero",
        };
      }

      if (!transaction.description.trim()) {
        return {
          success: false,
          error: "La descripción es requerida",
        };
      }

      // Verificar que el presupuesto existe y pertenece al usuario
      const budget = await this.budgetRepository.getBudgetByMonth({
        userId,
        month: new Date().getMonth() + 1, // Temporalmente, idealmente deberíamos obtener por ID
        year: new Date().getFullYear(),
      });

      if (!budget || budget.id !== budgetId) {
        return {
          success: false,
          error: "Presupuesto no encontrado o no tiene permisos para acceder",
        };
      }

      // Verificar que la categoría existe en el presupuesto
      const category = budget.categories.find(
        (c) => c.id === transaction.categoryId
      );
      if (!category) {
        return {
          success: false,
          error: "Categoría no encontrada en este presupuesto",
        };
      }

      // Validaciones específicas para gastos
      if (transaction.type === "expense") {
        // Calcular gasto actual en la categoría
        const currentSpent = budget.transactions
          .filter(
            (t) =>
              t.type === "expense" && t.categoryId === transaction.categoryId
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const newTotal = currentSpent + transaction.amount;

        // Advertir si excede el presupuesto de la categoría
        if (newTotal > category.budgetAmount) {
          warnings.push(
            `Esta transacción excederá el presupuesto de ${
              category.name
            } en $${(newTotal - category.budgetAmount).toFixed(2)}`
          );
        }
      }

      // Agregar la transacción
      const addedTransaction = await this.budgetRepository.addTransaction({
        userId,
        budgetId,
        transaction,
      });

      if (!addedTransaction) {
        return {
          success: false,
          error: "Error al agregar la transacción",
        };
      }

      return {
        success: true,
        transaction: addedTransaction,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
