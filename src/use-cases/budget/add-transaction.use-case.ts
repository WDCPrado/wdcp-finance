import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { Transaction } from "../../types/budget";

export interface AddTransactionRequest {
  budgetId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
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
    budgetId,
    type,
    amount,
    description,
    categoryId,
    date,
  }: AddTransactionRequest): Promise<AddTransactionResponse> {
    try {
      const warnings: string[] = [];

      // Validaciones de negocio
      if (amount <= 0) {
        return {
          success: false,
          error: "El monto debe ser mayor que cero",
        };
      }

      if (!description.trim()) {
        return {
          success: false,
          error: "La descripción es requerida",
        };
      }

      // Verificar que el presupuesto existe
      const budget = await this.budgetRepository.getBudgets();
      const targetBudget = budget.find((b) => b.id === budgetId);

      if (!targetBudget) {
        return {
          success: false,
          error: "Presupuesto no encontrado",
        };
      }

      // Verificar que la categoría existe en el presupuesto
      const category = targetBudget.categories.find((c) => c.id === categoryId);
      if (!category) {
        return {
          success: false,
          error: "Categoría no encontrada en este presupuesto",
        };
      }

      // Validaciones específicas para gastos
      if (type === "expense") {
        // Calcular gasto actual en la categoría
        const currentSpent = targetBudget.transactions
          .filter((t) => t.type === "expense" && t.categoryId === categoryId)
          .reduce((sum, t) => sum + t.amount, 0);

        const newTotal = currentSpent + amount;

        // Advertir si excede el presupuesto de la categoría
        if (newTotal > category.budgetAmount) {
          warnings.push(
            `Esta transacción excederá el presupuesto de ${
              category.name
            } en $${(newTotal - category.budgetAmount).toFixed(2)}`
          );
        }

        // Calcular gastos totales
        const totalExpenses =
          targetBudget.transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0) + amount;

        const totalIncome = targetBudget.transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        // Advertir si excede el balance
        if (totalExpenses > totalIncome && totalIncome > 0) {
          warnings.push(
            "Esta transacción hará que los gastos excedan los ingresos reales"
          );
        }
      }

      // Agregar la transacción
      const transaction = await this.budgetRepository.addTransaction({
        budgetId,
        transaction: {
          type,
          amount,
          description: description.trim(),
          categoryId,
          date,
        },
      });

      if (!transaction) {
        return {
          success: false,
          error: "Error al agregar la transacción",
        };
      }

      return {
        success: true,
        transaction,
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
