import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
} from "../src/types/budget";
import { INCOME_CATEGORY_NAMES } from "../src/constants/categories";

interface BudgetState {
  budgets: MonthlyBudget[];
  currentBudget: MonthlyBudget | null;
  isLoading: boolean;

  // Actions
  setBudgets: ({ budgets }: { budgets: MonthlyBudget[] }) => void;
  setCurrentBudget: ({ budget }: { budget: MonthlyBudget | null }) => void;
  setLoading: ({ loading }: { loading: boolean }) => void;

  // Budget operations
  addBudget: ({ budget }: { budget: MonthlyBudget }) => void;

  createMonthlyBudget: ({
    name,
    month,
    year,
    totalIncome,
    categories,
  }: {
    name: string;
    month: number;
    year: number;
    totalIncome: number;
    categories: Category[];
  }) => MonthlyBudget;

  getBudgetByMonth: ({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) => MonthlyBudget | null;

  updateMonthlyBudget: ({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<MonthlyBudget>;
  }) => MonthlyBudget | null;

  deleteBudget: ({ id }: { id: string }) => boolean;

  addTransaction: ({
    budgetId,
    transaction,
  }: {
    budgetId: string;
    transaction: Omit<Transaction, "id" | "budgetId">;
  }) => Transaction | null;

  deleteTransaction: ({
    budgetId,
    transactionId,
  }: {
    budgetId: string;
    transactionId: string;
  }) => boolean;

  getBudgetSummary: ({
    budgetId,
  }: {
    budgetId: string;
  }) => BudgetSummary | null;

  getCurrentBudget: () => MonthlyBudget | null;

  createFromPreviousMonth: ({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) => MonthlyBudget | null;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Función para migrar categorías sin el campo type
const migrateCategoriesWithType = (
  categories: Partial<Category>[]
): Category[] => {
  return categories.map((cat) => {
    if (!cat.type) {
      // Si no tiene type, inferir basado en el nombre
      const type = INCOME_CATEGORY_NAMES.includes(cat.name || "")
        ? "income"
        : "expense";
      return { ...cat, type } as Category;
    }
    return cat as Category;
  });
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: [],
      currentBudget: null,
      isLoading: false,

      // Basic setters
      setBudgets: ({ budgets }) => set({ budgets }),
      setCurrentBudget: ({ budget }) => set({ currentBudget: budget }),
      setLoading: ({ loading }) => set({ isLoading: loading }),

      // Add budget
      addBudget: ({ budget }) =>
        set((state) => ({
          budgets: [...state.budgets, budget],
        })),

      // Create monthly budget
      createMonthlyBudget: ({ name, month, year, totalIncome, categories }) => {
        const newBudget: MonthlyBudget = {
          id: generateId(),
          name,
          month,
          year,
          totalIncome,
          categories,
          transactions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isTemplate: false,
          userId: "", // Será establecido por el repositorio
        };

        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));

        return newBudget;
      },

      // Get budget by month and year
      getBudgetByMonth: ({ month, year }) => {
        const { budgets } = get();
        return (
          budgets.find(
            (budget) => budget.month === month && budget.year === year
          ) || null
        );
      },

      // Update monthly budget
      updateMonthlyBudget: ({ id, updates }) => {
        const { budgets } = get();
        const index = budgets.findIndex((budget) => budget.id === id);

        console.log("Store.updateMonthlyBudget - Input:", {
          id,
          index,
          updatesKeys: Object.keys(updates),
          categoriesCount: updates.categories?.length,
          categories: updates.categories?.map((c) => ({
            id: c.id,
            name: c.name,
            userId: c.userId || "",
          })),
        });

        if (index === -1) {
          console.log("Store.updateMonthlyBudget - Budget not found in store");
          return null;
        }

        const currentBudget = budgets[index];
        console.log("Store.updateMonthlyBudget - Current budget:", {
          budgetId: currentBudget.id,
          currentCategoriesCount: currentBudget.categories.length,
          currentCategories: currentBudget.categories.map((c) => ({
            id: c.id,
            name: c.name,
            userId: c.userId,
          })),
        });

        const updatedBudget = {
          ...budgets[index],
          ...updates,
          updatedAt: new Date(),
        };

        console.log("Store.updateMonthlyBudget - Updated budget:", {
          budgetId: updatedBudget.id,
          newCategoriesCount: updatedBudget.categories.length,
          newCategories: updatedBudget.categories.map((c) => ({
            id: c.id,
            name: c.name,
            userId: c.userId,
          })),
        });

        const newBudgets = [...budgets];
        newBudgets[index] = updatedBudget;

        set({ budgets: newBudgets });
        return updatedBudget;
      },

      // Delete budget
      deleteBudget: ({ id }) => {
        const { budgets } = get();
        const filteredBudgets = budgets.filter((budget) => budget.id !== id);

        if (filteredBudgets.length === budgets.length) return false;

        set({ budgets: filteredBudgets });
        return true;
      },

      // Add transaction
      addTransaction: ({ budgetId, transaction }) => {
        const { budgets } = get();
        const budgetIndex = budgets.findIndex((b) => b.id === budgetId);

        if (budgetIndex === -1) return null;

        const newTransaction: Transaction = {
          ...transaction,
          id: generateId(),
          budgetId,
        };

        const updatedBudgets = [...budgets];
        updatedBudgets[budgetIndex] = {
          ...updatedBudgets[budgetIndex],
          transactions: [
            ...updatedBudgets[budgetIndex].transactions,
            newTransaction,
          ],
        };

        set({ budgets: updatedBudgets });
        return newTransaction;
      },

      // Delete transaction
      deleteTransaction: ({ budgetId, transactionId }) => {
        const { budgets } = get();
        const budgetIndex = budgets.findIndex((b) => b.id === budgetId);

        if (budgetIndex === -1) return false;

        const budget = budgets[budgetIndex];
        const filteredTransactions = budget.transactions.filter(
          (t) => t.id !== transactionId
        );

        if (filteredTransactions.length === budget.transactions.length)
          return false;

        const updatedBudgets = [...budgets];
        updatedBudgets[budgetIndex] = {
          ...budget,
          transactions: filteredTransactions,
        };

        set({ budgets: updatedBudgets });
        return true;
      },

      // Get budget summary
      getBudgetSummary: ({ budgetId }) => {
        const { budgets } = get();
        const budget = budgets.find((b) => b.id === budgetId);

        if (!budget) return null;

        const actualIncome = budget.transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = budget.transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        const totalBudgeted = budget.categories.reduce(
          (sum, cat) => sum + cat.budgetAmount,
          0
        );

        const categoryBreakdown: Record<
          string,
          {
            budgeted: number;
            spent: number;
            remaining: number;
            categoryName: string;
            color: string;
          }
        > = {};

        budget.categories.forEach((category) => {
          const spent = budget.transactions
            .filter((t) => t.type === "expense" && t.categoryId === category.id)
            .reduce((sum, t) => sum + t.amount, 0);

          categoryBreakdown[category.id] = {
            budgeted: category.budgetAmount,
            spent,
            remaining: category.budgetAmount - spent,
            categoryName: category.name,
            color: category.color,
          };
        });

        return {
          totalIncome: budget.totalIncome,
          actualIncome,
          totalBudgeted,
          totalExpenses,
          balance: actualIncome - totalExpenses,
          remaining: budget.totalIncome - totalBudgeted,
          categoryBreakdown,
        };
      },

      // Get current budget (current month/year)
      getCurrentBudget: () => {
        const { getBudgetByMonth, createFromPreviousMonth } = get();
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        let budget = getBudgetByMonth({
          month: currentMonth,
          year: currentYear,
        });

        // Si no existe, intentar crear desde el mes anterior
        if (!budget) {
          budget = createFromPreviousMonth({
            month: currentMonth,
            year: currentYear,
          });
        }

        return budget;
      },

      // Create from previous month
      createFromPreviousMonth: ({ month, year }) => {
        const { getBudgetByMonth, createMonthlyBudget } = get();

        // Calcular mes anterior
        let prevMonth = month - 1;
        let prevYear = year;
        if (prevMonth === 0) {
          prevMonth = 12;
          prevYear = year - 1;
        }

        const previousBudget = getBudgetByMonth({
          month: prevMonth,
          year: prevYear,
        });
        if (!previousBudget) return null;

        // Crear nuevo presupuesto basado en el anterior
        return createMonthlyBudget({
          name: previousBudget.name,
          month,
          year,
          totalIncome: previousBudget.totalIncome,
          categories: previousBudget.categories.map((cat) => ({ ...cat })),
        });
      },
    }),
    {
      name: "wdcp-finance-budget-storage",
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        const state = persistedState as { budgets?: Partial<MonthlyBudget>[] };
        if (state?.budgets) {
          state.budgets = state.budgets.map((budget) => ({
            ...budget,
            categories: migrateCategoriesWithType(budget.categories || []),
          }));
        }
        return state;
      },
    }
  )
);
