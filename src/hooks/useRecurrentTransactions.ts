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

  const processRecurrentTransactions = async (
    targetDate?: Date
  ): Promise<ProcessRecurrenceResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await processRecurrentTransactionsUseCase.execute({
        targetDate,
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

  const pauseRecurrentTransaction = async (
    id: string
  ): Promise<UpdateRecurrentTransactionResponse> => {
    return updateRecurrentTransaction({
      id,
      updates: { isActive: false },
    });
  };

  const resumeRecurrentTransaction = async (
    id: string
  ): Promise<UpdateRecurrentTransactionResponse> => {
    return updateRecurrentTransaction({
      id,
      updates: { isActive: true },
    });
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
    getAllRecurrentTransactions,
    getActiveRecurrentTransactions,
    updateRecurrentTransaction,
    deleteRecurrentTransaction,

    // Acciones de conveniencia
    pauseRecurrentTransaction,
    resumeRecurrentTransaction,

    // Utilidades
    getAvailableIntervals,
    clearError,
  };
}
