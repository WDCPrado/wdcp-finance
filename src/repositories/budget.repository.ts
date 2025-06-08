import { useBudgetStore } from "../../stores/budget.store";
import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
} from "../types/budget";
import { IBudgetRepository } from "../interfaces/budget-repository.interface";

export class BudgetRepository implements IBudgetRepository {
  private store = useBudgetStore.getState();

  // Obtener todos los presupuestos mensuales
  async getBudgets(): Promise<MonthlyBudget[]> {
    return this.store.budgets;
  }

  // Obtener presupuesto por mes y año
  async getBudgetByMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null> {
    return this.store.getBudgetByMonth({ month, year });
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
    return this.store.createMonthlyBudget({
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
    return this.store.createFromPreviousMonth({ month, year });
  }

  // Actualizar presupuesto mensual
  async updateMonthlyBudget({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<MonthlyBudget>;
  }): Promise<MonthlyBudget | null> {
    return this.store.updateMonthlyBudget({ id, updates });
  }

  // Eliminar presupuesto
  async deleteBudget({ id }: { id: string }): Promise<boolean> {
    return this.store.deleteBudget({ id });
  }

  // Agregar transacción
  async addTransaction({
    budgetId,
    transaction,
  }: {
    budgetId: string;
    transaction: Omit<Transaction, "id" | "budgetId">;
  }): Promise<Transaction | null> {
    return this.store.addTransaction({ budgetId, transaction });
  }

  // Eliminar transacción
  async deleteTransaction({
    budgetId,
    transactionId,
  }: {
    budgetId: string;
    transactionId: string;
  }): Promise<boolean> {
    return this.store.deleteTransaction({ budgetId, transactionId });
  }

  // Obtener resumen del presupuesto
  async getBudgetSummary({
    budgetId,
  }: {
    budgetId: string;
  }): Promise<BudgetSummary | null> {
    return this.store.getBudgetSummary({ budgetId });
  }

  // Obtener presupuesto actual (mes y año actual)
  async getCurrentBudget(): Promise<MonthlyBudget | null> {
    return this.store.getCurrentBudget();
  }
}

// Instancia singleton del repositorio
export const budgetRepository = new BudgetRepository();
