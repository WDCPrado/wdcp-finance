import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
  RecurrentTransaction,
} from "../types/budget";

export interface IBudgetRepository {
  // Obtener todos los presupuestos mensuales
  getBudgets(): Promise<MonthlyBudget[]>;

  // Obtener presupuesto por mes y año
  getBudgetByMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null>;

  // Crear presupuesto mensual
  createMonthlyBudget({
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
  }): Promise<MonthlyBudget>;

  // Crear presupuesto basado en plantilla del mes anterior
  createFromPreviousMonth({
    month,
    year,
  }: {
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null>;

  // Actualizar presupuesto mensual
  updateMonthlyBudget({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<MonthlyBudget>;
  }): Promise<MonthlyBudget | null>;

  // Agregar transacción
  addTransaction({
    budgetId,
    transaction,
  }: {
    budgetId: string;
    transaction: Omit<Transaction, "id" | "budgetId">;
  }): Promise<Transaction | null>;

  // Obtener resumen del presupuesto
  getBudgetSummary({
    budgetId,
  }: {
    budgetId: string;
  }): Promise<BudgetSummary | null>;

  // Obtener presupuesto actual (mes y año actual)
  getCurrentBudget(): Promise<MonthlyBudget | null>;

  // Eliminar presupuesto
  deleteBudget({ id }: { id: string }): Promise<boolean>;

  // Eliminar transacción
  deleteTransaction({
    budgetId,
    transactionId,
  }: {
    budgetId: string;
    transactionId: string;
  }): Promise<boolean>;

  // Obtener información de una transacción
  getTransactionInfo({
    budgetId,
    transactionId,
  }: {
    budgetId: string;
    transactionId: string;
  }): Promise<{ transaction: Transaction; budget: MonthlyBudget } | null>;

  // Métodos para transacciones recurrentes

  // Crear transacción recurrente
  createRecurrentTransaction({
    recurrentTransaction,
  }: {
    recurrentTransaction: Omit<
      RecurrentTransaction,
      "id" | "createdAt" | "updatedAt"
    >;
  }): Promise<RecurrentTransaction>;

  // Obtener todas las transacciones recurrentes
  getRecurrentTransactions(): Promise<RecurrentTransaction[]>;

  // Obtener transacciones recurrentes activas
  getActiveRecurrentTransactions(): Promise<RecurrentTransaction[]>;

  // Actualizar transacción recurrente
  updateRecurrentTransaction({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<RecurrentTransaction>;
  }): Promise<RecurrentTransaction | null>;

  // Eliminar transacción recurrente
  deleteRecurrentTransaction({ id }: { id: string }): Promise<boolean>;

  // Obtener transacciones recurrentes que deben ejecutarse
  getRecurrentTransactionsDue({
    date,
  }: {
    date: Date;
  }): Promise<RecurrentTransaction[]>;
}
