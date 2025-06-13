import { useBudgetStore } from "../../stores/budget.store";
import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
  RecurrentTransaction,
} from "../types/budget";
import { IBudgetRepository } from "../interfaces/budget-repository.interface";

// Extensión temporal del store para incluir transacciones recurrentes
interface ExtendedBudgetStore {
  recurrentTransactions?: RecurrentTransaction[];
}

export class BudgetRepository implements IBudgetRepository {
  private getStore() {
    return useBudgetStore.getState();
  }

  private getExtendedStore() {
    return useBudgetStore.getState() as unknown as ExtendedBudgetStore;
  }

  // Obtener todos los presupuestos mensuales
  async getBudgets(): Promise<MonthlyBudget[]> {
    return this.getStore().budgets;
  }

  // Obtener presupuesto por mes y año
  async getBudgetByMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null> {
    return this.getStore().getBudgetByMonth({ month, year });
  }

  // Crear presupuesto mensual
  async createMonthlyBudget({
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
  }): Promise<MonthlyBudget> {
    return this.getStore().createMonthlyBudget({
      name,
      month,
      year,
      totalIncome,
      categories,
    });
  }

  // Crear o actualizar presupuesto basado en plantilla del mes anterior
  async createFromPreviousMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null> {
    return this.getStore().createFromPreviousMonth({ month, year });
  }

  // Actualizar presupuesto mensual
  async updateMonthlyBudget({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<MonthlyBudget>;
  }): Promise<MonthlyBudget | null> {
    return this.getStore().updateMonthlyBudget({ id, updates });
  }

  // Eliminar presupuesto
  async deleteBudget({ id }: { id: string }): Promise<boolean> {
    return this.getStore().deleteBudget({ id });
  }

  // Agregar transacción
  async addTransaction({
    budgetId,
    transaction,
  }: {
    budgetId: string;
    transaction: Omit<Transaction, "id" | "budgetId">;
  }): Promise<Transaction | null> {
    return this.getStore().addTransaction({ budgetId, transaction });
  }

  // Eliminar transacción
  async deleteTransaction({
    budgetId,
    transactionId,
  }: {
    budgetId: string;
    transactionId: string;
  }): Promise<boolean> {
    return this.getStore().deleteTransaction({ budgetId, transactionId });
  }

  // Obtener resumen del presupuesto
  async getBudgetSummary({
    budgetId,
  }: {
    budgetId: string;
  }): Promise<BudgetSummary | null> {
    return this.getStore().getBudgetSummary({ budgetId });
  }

  // Obtener presupuesto actual (mes y año actual)
  async getCurrentBudget(): Promise<MonthlyBudget | null> {
    return this.getStore().getCurrentBudget();
  }

  // Métodos para transacciones recurrentes

  // Crear transacción recurrente
  async createRecurrentTransaction({
    recurrentTransaction,
  }: {
    recurrentTransaction: Omit<
      RecurrentTransaction,
      "id" | "createdAt" | "updatedAt"
    >;
  }): Promise<RecurrentTransaction> {
    const id = crypto.randomUUID();
    const now = new Date();

    const newRecurrentTransaction: RecurrentTransaction = {
      ...recurrentTransaction,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Simular almacenamiento en memoria (en un proyecto real iría a base de datos)
    const store = this.getExtendedStore();
    if (!store.recurrentTransactions) {
      store.recurrentTransactions = [];
    }
    store.recurrentTransactions.push(newRecurrentTransaction);

    return newRecurrentTransaction;
  }

  // Obtener todas las transacciones recurrentes
  async getRecurrentTransactions(): Promise<RecurrentTransaction[]> {
    const store = this.getExtendedStore();
    return store.recurrentTransactions || [];
  }

  // Obtener transacciones recurrentes activas
  async getActiveRecurrentTransactions(): Promise<RecurrentTransaction[]> {
    const all = await this.getRecurrentTransactions();
    return all.filter((rt) => rt.isActive);
  }

  // Actualizar transacción recurrente
  async updateRecurrentTransaction({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<RecurrentTransaction>;
  }): Promise<RecurrentTransaction | null> {
    const store = this.getExtendedStore();
    const recurrentTransactions = store.recurrentTransactions || [];

    const index = recurrentTransactions.findIndex(
      (rt: RecurrentTransaction) => rt.id === id
    );
    if (index === -1) {
      return null;
    }

    const updated = {
      ...recurrentTransactions[index],
      ...updates,
      updatedAt: new Date(),
    };

    recurrentTransactions[index] = updated;
    return updated;
  }

  // Eliminar transacción recurrente
  async deleteRecurrentTransaction({ id }: { id: string }): Promise<boolean> {
    const store = this.getExtendedStore();
    const recurrentTransactions = store.recurrentTransactions || [];

    const index = recurrentTransactions.findIndex(
      (rt: RecurrentTransaction) => rt.id === id
    );
    if (index === -1) {
      return false;
    }

    recurrentTransactions.splice(index, 1);
    return true;
  }

  // Obtener transacciones recurrentes que deben ejecutarse
  async getRecurrentTransactionsDue({
    date,
  }: {
    date: Date;
  }): Promise<RecurrentTransaction[]> {
    const active = await this.getActiveRecurrentTransactions();
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return active.filter((rt) => {
      // Verificar si es momento de ejecutar
      const nextExecution = new Date(rt.nextExecutionDate);
      nextExecution.setHours(0, 0, 0, 0);

      // Verificar que no haya pasado la fecha de fin
      if (rt.endDate) {
        const endDate = new Date(rt.endDate);
        endDate.setHours(0, 0, 0, 0);
        if (targetDate > endDate) {
          return false;
        }
      }

      return targetDate >= nextExecution;
    });
  }
}

// Instancia singleton del repositorio
export const budgetRepository = new BudgetRepository();
