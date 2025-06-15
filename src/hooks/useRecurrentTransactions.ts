import { useState, useCallback } from "react";
import { RecurrentTransaction } from "../types/budget";
import { CreateRecurrentTransactionRequest } from "../types/recurrence";

export const useRecurrentTransactions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Obtener todas las transacciones recurrentes
  const getAllRecurrentTransactions = useCallback(async (): Promise<
    RecurrentTransaction[]
  > => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recurrent-transactions");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al obtener transacciones recurrentes"
        );
      }

      const data = await response.json();
      return data.recurrentTransactions || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener transacciones recurrentes activas
  const getActiveRecurrentTransactions = useCallback(async (): Promise<
    RecurrentTransaction[]
  > => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recurrent-transactions?active=true");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            "Error al obtener transacciones recurrentes activas"
        );
      }

      const data = await response.json();
      return data.recurrentTransactions || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear transacción recurrente
  const createRecurrentTransaction = useCallback(
    async (
      recurrentTransaction: Omit<CreateRecurrentTransactionRequest, "userId">
    ): Promise<RecurrentTransaction> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/recurrent-transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(recurrentTransaction),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al crear transacción recurrente"
          );
        }

        const data = await response.json();
        return data.recurrentTransaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Actualizar transacción recurrente
  const updateRecurrentTransaction = useCallback(
    async (
      id: string,
      updates: {
        amount?: number;
        description?: string;
        endDate?: Date;
        isActive?: boolean;
        intervalValue?: number;
      }
    ): Promise<RecurrentTransaction> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recurrent-transactions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al actualizar transacción recurrente"
          );
        }

        const data = await response.json();
        return data.recurrentTransaction;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Eliminar transacción recurrente
  const deleteRecurrentTransaction = useCallback(
    async (
      id: string,
      deleteFutureTransactions: boolean = false
    ): Promise<{ deletedTransactionsCount: number }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/recurrent-transactions/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deleteFutureTransactions }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al eliminar transacción recurrente"
          );
        }

        const data = await response.json();
        return { deletedTransactionsCount: data.deletedTransactionsCount };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Procesar transacciones recurrentes
  const processRecurrentTransactions = useCallback(
    async (params?: {
      targetDate?: Date;
      targetMonth?: number;
      targetYear?: number;
    }): Promise<{
      transactionsCreated: number;
      budgetsCreated: number;
      budgetsUpdated: number;
      warnings?: string[];
    }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/recurrent-transactions/process", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params || {}),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Error al procesar transacciones recurrentes"
          );
        }

        const data = await response.json();
        return {
          transactionsCreated: data.transactionsCreated,
          budgetsCreated: data.budgetsCreated,
          budgetsUpdated: data.budgetsUpdated,
          warnings: data.warnings,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Regenerar transacción eliminada
  const regenerateDeletedTransaction = useCallback(
    async (
      recurrenceId: string,
      targetMonth: number,
      targetYear: number
    ): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/recurrent-transactions/regenerate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recurrenceId,
            targetMonth,
            targetYear,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al regenerar transacción");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Pausar transacción recurrente
  const pauseRecurrentTransaction = useCallback(
    async (id: string): Promise<RecurrentTransaction> => {
      return updateRecurrentTransaction(id, { isActive: false });
    },
    [updateRecurrentTransaction]
  );

  // Reanudar transacción recurrente
  const resumeRecurrentTransaction = useCallback(
    async (id: string): Promise<RecurrentTransaction> => {
      return updateRecurrentTransaction(id, { isActive: true });
    },
    [updateRecurrentTransaction]
  );

  return {
    loading,
    error,
    clearError,
    getAllRecurrentTransactions,
    getActiveRecurrentTransactions,
    createRecurrentTransaction,
    updateRecurrentTransaction,
    deleteRecurrentTransaction,
    processRecurrentTransactions,
    regenerateDeletedTransaction,
    pauseRecurrentTransaction,
    resumeRecurrentTransaction,
  };
};
