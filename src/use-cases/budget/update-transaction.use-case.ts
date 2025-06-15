import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { Transaction } from "../../types/budget";

export interface UpdateTransactionRequest {
  userId: string;
  budgetId: string;
  transactionId: string;
  updates: {
    amount?: number;
    description?: string;
    date?: Date;
  };
}

export interface UpdateTransactionResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export class UpdateTransactionUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    userId,
    budgetId,
    transactionId,
    updates,
  }: UpdateTransactionRequest): Promise<UpdateTransactionResponse> {
    try {
      // Validaciones básicas
      if (!userId) {
        return {
          success: false,
          error: "UserId es requerido",
        };
      }

      if (!budgetId || !transactionId) {
        return {
          success: false,
          error: "BudgetId y transactionId son requeridos",
        };
      }

      if (!updates || Object.keys(updates).length === 0) {
        return {
          success: false,
          error: "Se requiere al menos un campo para actualizar",
        };
      }

      // Validar datos de actualización
      if (updates.amount !== undefined && updates.amount <= 0) {
        return {
          success: false,
          error: "El monto debe ser mayor que cero",
        };
      }

      if (updates.description !== undefined && !updates.description.trim()) {
        return {
          success: false,
          error: "La descripción no puede estar vacía",
        };
      }

      // Obtener información de la transacción actual
      const transactionInfo = await this.budgetRepository.getTransactionInfo({
        userId,
        budgetId,
        transactionId,
      });

      if (!transactionInfo) {
        return {
          success: false,
          error: "Transacción no encontrada o no tiene permisos para acceder",
        };
      }

      const { transaction: currentTransaction, budget } = transactionInfo;

      // Verificar que el presupuesto pertenece al usuario
      if (budget.userId !== userId) {
        return {
          success: false,
          error: "No tiene permisos para modificar esta transacción",
        };
      }

      // Crear la transacción actualizada
      const updatedTransaction: Transaction = {
        ...currentTransaction,
        amount: updates.amount ?? currentTransaction.amount,
        description:
          updates.description?.trim() ?? currentTransaction.description,
        date: updates.date ?? currentTransaction.date,
      };

      // Eliminar la transacción actual
      const deleteSuccess = await this.budgetRepository.deleteTransaction({
        userId,
        budgetId,
        transactionId,
      });

      if (!deleteSuccess) {
        return {
          success: false,
          error: "Error al actualizar la transacción",
        };
      }

      // Agregar la transacción actualizada
      const newTransaction = await this.budgetRepository.addTransaction({
        userId,
        budgetId,
        transaction: {
          type: updatedTransaction.type,
          amount: updatedTransaction.amount,
          description: updatedTransaction.description,
          categoryId: updatedTransaction.categoryId,
          date: updatedTransaction.date,
          isRecurrent: updatedTransaction.isRecurrent,
          recurrenceId: updatedTransaction.recurrenceId,
        },
      });

      if (!newTransaction) {
        return {
          success: false,
          error: "Error al actualizar la transacción",
        };
      }

      return {
        success: true,
        transaction: newTransaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
