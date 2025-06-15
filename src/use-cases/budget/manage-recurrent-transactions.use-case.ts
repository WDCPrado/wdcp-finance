import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { RecurrentTransaction } from "../../types/budget";

export interface GetRecurrentTransactionsRequest {
  userId: string;
}

export interface GetRecurrentTransactionsResponse {
  success: boolean;
  recurrentTransactions: RecurrentTransaction[];
  error?: string;
}

export interface UpdateRecurrentTransactionRequest {
  userId: string;
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
  userId: string;
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

  async getAllRecurrentTransactions({
    userId,
  }: GetRecurrentTransactionsRequest): Promise<GetRecurrentTransactionsResponse> {
    try {
      if (!userId) {
        return {
          success: false,
          recurrentTransactions: [],
          error: "UserId es requerido",
        };
      }

      const recurrentTransactions =
        await this.budgetRepository.getRecurrentTransactions({ userId });
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

  async getActiveRecurrentTransactions({
    userId,
  }: GetRecurrentTransactionsRequest): Promise<GetRecurrentTransactionsResponse> {
    try {
      if (!userId) {
        return {
          success: false,
          recurrentTransactions: [],
          error: "UserId es requerido",
        };
      }

      const recurrentTransactions =
        await this.budgetRepository.getActiveRecurrentTransactions({ userId });
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
    userId,
    id,
    updates,
  }: UpdateRecurrentTransactionRequest): Promise<UpdateRecurrentTransactionResponse> {
    try {
      if (!userId) {
        return {
          success: false,
          error: "UserId es requerido",
        };
      }

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
          userId,
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
    userId,
    id,
    deleteFutureTransactions = false,
  }: DeleteRecurrentTransactionRequest): Promise<DeleteRecurrentTransactionResponse> {
    try {
      if (!userId) {
        return {
          success: false,
          deletedTransactionsCount: 0,
          error: "UserId es requerido",
        };
      }

      let deletedTransactionsCount = 0;

      // Si se solicita eliminar transacciones futuras, eliminarlas primero
      if (deleteFutureTransactions) {
        deletedTransactionsCount = await this.deleteFutureTransactions(
          userId,
          id
        );
      }

      // Eliminar la transacción recurrente
      const success = await this.budgetRepository.deleteRecurrentTransaction({
        userId,
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
    userId: string,
    recurrenceId: string
  ): Promise<number> {
    try {
      let deletedCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obtener todos los presupuestos del usuario
      const budgets = await this.budgetRepository.getBudgets({ userId });

      for (const budget of budgets) {
        // Buscar transacciones relacionadas con la recurrencia que sean futuras
        const futureTransactions = budget.transactions.filter(
          (t) => t.recurrenceId === recurrenceId && t.date >= today
        );

        // Eliminar cada transacción futura
        for (const transaction of futureTransactions) {
          const deleted = await this.budgetRepository.deleteTransaction({
            userId,
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

  // Métodos de conveniencia para pausar/reanudar
  async pauseRecurrentTransaction({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<UpdateRecurrentTransactionResponse> {
    return this.updateRecurrentTransaction({
      userId,
      id,
      updates: { isActive: false },
    });
  }

  async resumeRecurrentTransaction({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<UpdateRecurrentTransactionResponse> {
    return this.updateRecurrentTransaction({
      userId,
      id,
      updates: { isActive: true },
    });
  }
}
