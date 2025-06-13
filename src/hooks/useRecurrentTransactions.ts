import { useState } from "react";
import {
  CreateRecurrentTransactionRequest,
  ProcessRecurrenceResponse,
  RECURRENCE_INTERVALS,
} from "../types/recurrence";
import { CreateRecurrentTransactionResponse } from "../use-cases/budget/create-recurrent-transaction.use-case";
import {
  GetRecurrentTransactionsResponse,
  UpdateRecurrentTransactionRequest,
  UpdateRecurrentTransactionResponse,
  DeleteRecurrentTransactionRequest,
  DeleteRecurrentTransactionResponse,
} from "../use-cases/budget/manage-recurrent-transactions.use-case";
import { container } from "../di/container";

export function useRecurrentTransactions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener instancias de casos de uso del contenedor DI
  const createRecurrentTransactionUseCase =
    container.createRecurrentTransactionUseCase;
  const processRecurrentTransactionsUseCase =
    container.processRecurrentTransactionsUseCase;
  const manageRecurrentTransactionsUseCase =
    container.manageRecurrentTransactionsUseCase;

  const createRecurrentTransaction = async (
    request: CreateRecurrentTransactionRequest
  ): Promise<CreateRecurrentTransactionResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await createRecurrentTransactionUseCase.execute(request);

      if (!response.success) {
        setError(response.error || "Error desconocido");
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const processRecurrentTransactions = async (params?: {
    targetDate?: Date;
    targetMonth?: number;
    targetYear?: number;
  }): Promise<ProcessRecurrenceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await processRecurrentTransactionsUseCase.execute({
        targetDate: params?.targetDate,
        targetMonth: params?.targetMonth,
        targetYear: params?.targetYear,
      });

      if (!response.success) {
        setError(response.error || "Error desconocido");
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        transactionsCreated: 0,
        budgetsCreated: 0,
        budgetsUpdated: 0,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const processIndividualRecurrentTransaction = async (params: {
    recurrenceId: string;
    targetMonth: number;
    targetYear: number;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await processRecurrentTransactionsUseCase.regenerateDeletedTransaction({
          recurrenceId: params.recurrenceId,
          targetMonth: params.targetMonth,
          targetYear: params.targetYear,
        });

      if (!response.success) {
        setError(response.error || "Error desconocido");
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const checkRecurrentTransactionExecution = async (params: {
    recurrenceId: string;
    targetMonth: number;
    targetYear: number;
  }): Promise<{
    executed: boolean;
    transactionId?: string;
    budgetId?: string;
  }> => {
    try {
      const response =
        await processRecurrentTransactionsUseCase.isRecurrentTransactionExecutedInMonth(
          {
            recurrenceId: params.recurrenceId,
            targetMonth: params.targetMonth,
            targetYear: params.targetYear,
          }
        );

      return response;
    } catch (err) {
      console.error("Error checking recurrent transaction execution:", err);
      return { executed: false };
    }
  };

  const unexecuteRecurrentTransaction = async (params: {
    recurrenceId: string;
    targetMonth: number;
    targetYear: number;
  }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await processRecurrentTransactionsUseCase.unexecuteRecurrentTransaction(
          {
            recurrenceId: params.recurrenceId,
            targetMonth: params.targetMonth,
            targetYear: params.targetYear,
          }
        );

      if (!response.success) {
        setError(response.error || "Error desconocido");
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const getAllRecurrentTransactions =
    async (): Promise<GetRecurrentTransactionsResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await manageRecurrentTransactionsUseCase.getAllRecurrentTransactions();

        if (!response.success) {
          setError(response.error || "Error desconocido");
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return {
          success: false,
          recurrentTransactions: [],
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    };

  const getActiveRecurrentTransactions =
    async (): Promise<GetRecurrentTransactionsResponse> => {
      setLoading(true);
      setError(null);

      try {
        const response =
          await manageRecurrentTransactionsUseCase.getActiveRecurrentTransactions();

        if (!response.success) {
          setError(response.error || "Error desconocido");
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        return {
          success: false,
          recurrentTransactions: [],
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    };

  const updateRecurrentTransaction = async (
    request: UpdateRecurrentTransactionRequest
  ): Promise<UpdateRecurrentTransactionResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await manageRecurrentTransactionsUseCase.updateRecurrentTransaction(
          request
        );

      if (!response.success) {
        setError(response.error || "Error desconocido");
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurrentTransaction = async (
    request: DeleteRecurrentTransactionRequest
  ): Promise<DeleteRecurrentTransactionResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response =
        await manageRecurrentTransactionsUseCase.deleteRecurrentTransaction(
          request
        );

      if (!response.success) {
        setError(response.error || "Error desconocido");
      }

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        deletedTransactionsCount: 0,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Utilidades para intervalos de recurrencia
  const getAvailableIntervals = () => {
    return Object.values(RECURRENCE_INTERVALS);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    // Estado
    loading,
    error,

    // Acciones principales
    createRecurrentTransaction,
    processRecurrentTransactions,
    processIndividualRecurrentTransaction,
    getAllRecurrentTransactions,
    getActiveRecurrentTransactions,
    updateRecurrentTransaction,
    deleteRecurrentTransaction,

    // Acciones de conveniencia
    checkRecurrentTransactionExecution,
    unexecuteRecurrentTransaction,

    // Utilidades
    getAvailableIntervals,
    clearError,
  };
}
