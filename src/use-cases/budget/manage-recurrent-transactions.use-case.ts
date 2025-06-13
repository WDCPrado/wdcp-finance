import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { RecurrentTransaction } from "../../types/budget";

export interface GetRecurrentTransactionsResponse {
  success: boolean;
  recurrentTransactions: RecurrentTransaction[];
  error?: string;
}

export interface UpdateRecurrentTransactionRequest {
  id: string;
  updates: {
    amount?: number;
    description?: string;
    endDate?: Date;
    isActive?: boolean;
    intervalValue?: number;
  };
}

export interface UpdateRecurrentTransactionResponse {
  success: boolean;
  recurrentTransaction?: RecurrentTransaction;
  error?: string;
}

export interface DeleteRecurrentTransactionRequest {
  id: string;
  deleteFutureTransactions?: boolean; // Si eliminar también las transacciones futuras generadas
}

export interface DeleteRecurrentTransactionResponse {
  success: boolean;
  deletedTransactionsCount: number;
  error?: string;
}

export class ManageRecurrentTransactionsUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async getAllRecurrentTransactions(): Promise<GetRecurrentTransactionsResponse> {
    try {
      const recurrentTransactions =
        await this.budgetRepository.getRecurrentTransactions();
      return {
        success: true,
        recurrentTransactions,
      };
    } catch (error) {
      return {
        success: false,
        recurrentTransactions: [],
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  async getActiveRecurrentTransactions(): Promise<GetRecurrentTransactionsResponse> {
    try {
      const recurrentTransactions =
        await this.budgetRepository.getActiveRecurrentTransactions();
      return {
        success: true,
        recurrentTransactions,
      };
    } catch (error) {
      return {
        success: false,
        recurrentTransactions: [],
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  async updateRecurrentTransaction({
    id,
    updates,
  }: UpdateRecurrentTransactionRequest): Promise<UpdateRecurrentTransactionResponse> {
    try {
      // Validaciones de negocio
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

      if (updates.intervalValue !== undefined && updates.intervalValue <= 0) {
        return {
          success: false,
          error: "El intervalo debe ser mayor que cero",
        };
      }

      const recurrentTransaction =
        await this.budgetRepository.updateRecurrentTransaction({
          id,
          updates: {
            ...updates,
            description: updates.description?.trim(),
            updatedAt: new Date(),
          },
        });

      if (!recurrentTransaction) {
        return {
          success: false,
          error: "Transacción recurrente no encontrada",
        };
      }

      return {
        success: true,
        recurrentTransaction,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  async deleteRecurrentTransaction({
    id,
    deleteFutureTransactions = false,
  }: DeleteRecurrentTransactionRequest): Promise<DeleteRecurrentTransactionResponse> {
    try {
      let deletedTransactionsCount = 0;

      // Si se solicita eliminar transacciones futuras, eliminarlas primero
      if (deleteFutureTransactions) {
        deletedTransactionsCount = await this.deleteFutureTransactions(id);
      }

      // Eliminar la transacción recurrente
      const success = await this.budgetRepository.deleteRecurrentTransaction({
        id,
      });

      if (!success) {
        return {
          success: false,
          deletedTransactionsCount: 0,
          error: "No se pudo eliminar la transacción recurrente",
        };
      }

      return {
        success: true,
        deletedTransactionsCount,
      };
    } catch (error) {
      return {
        success: false,
        deletedTransactionsCount: 0,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  private async deleteFutureTransactions(
    recurrenceId: string
  ): Promise<number> {
    try {
      let deletedCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obtener todos los presupuestos
      const budgets = await this.budgetRepository.getBudgets();

      for (const budget of budgets) {
        // Buscar transacciones relacionadas con la recurrencia que sean futuras
        const futureTransactions = budget.transactions.filter(
          (t) => t.recurrenceId === recurrenceId && t.date >= today
        );

        // Eliminar cada transacción futura
        for (const transaction of futureTransactions) {
          const deleted = await this.budgetRepository.deleteTransaction({
            budgetId: budget.id,
            transactionId: transaction.id,
          });
          if (deleted) {
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("Error eliminando transacciones futuras:", error);
      return 0;
    }
  }

  async pauseRecurrentTransaction(
    id: string
  ): Promise<UpdateRecurrentTransactionResponse> {
    return this.updateRecurrentTransaction({
      id,
      updates: { isActive: false },
    });
  }

  async resumeRecurrentTransaction(
    id: string
  ): Promise<UpdateRecurrentTransactionResponse> {
    return this.updateRecurrentTransaction({
      id,
      updates: { isActive: true },
    });
  }
}
