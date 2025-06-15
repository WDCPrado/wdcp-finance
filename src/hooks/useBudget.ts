import { Category } from "@/src/types/budget";
import { useCallback, useState } from "react";

export function useBudget() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const getCurrentBudget = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/budget/current");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Error al obtener el presupuesto actual"
        );
      }

      return {
        success: true,
        budget: result.budget,
        summary: result.summary,
        isFirstTime: result.isFirstTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getBudgetByMonth = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/budget/by-month?month=${month}&year=${year}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener el presupuesto");
      }

      return {
        success: true,
        budget: result.budget,
        summary: result.summary,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllBudgets = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/budget/list");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener los presupuestos");
      }

      return {
        success: true,
        budgets: result.budgets,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getBudgetSummary = useCallback(async (budgetId: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/budget/summary?budgetId=${budgetId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener el resumen");
      }

      return {
        success: true,
        summary: result.summary,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateBudget = useCallback(
    async (
      budgetId: string,
      updates: {
        name?: string;
        totalIncome?: number;
        categories?: Category[];
      }
    ) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/budget/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            budgetId,
            ...updates,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al actualizar el presupuesto");
        }

        return {
          success: true,
          budget: result.budget,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createFromPrevious = useCallback(
    async (month: number, year: number) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/budget/create-from-previous", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ month, year }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Error al crear presupuesto desde mes anterior"
          );
        }

        return {
          success: true,
          budget: result.budget,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteBudget = useCallback(async (budgetId: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/budget/delete?budgetId=${budgetId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al eliminar el presupuesto");
      }

      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTransaction = useCallback(
    async (
      budgetId: string,
      transaction: {
        type: "income" | "expense";
        amount: number;
        description: string;
        categoryId: string;
        date: Date | string;
      }
    ) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/budget/transaction", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ budgetId, transaction }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al agregar la transacción");
        }

        return {
          success: true,
          transaction: result.transaction,
          warnings: result.warnings,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteTransaction = useCallback(
    async (budgetId: string, transactionId: string) => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/budget/transaction?budgetId=${budgetId}&transactionId=${transactionId}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al eliminar la transacción");
        }

        return {
          success: true,
          message: result.message,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    getCurrentBudget,
    getBudgetByMonth,
    getAllBudgets,
    getBudgetSummary,
    updateBudget,
    createFromPrevious,
    deleteBudget,
    addTransaction,
    deleteTransaction,
  };
}
