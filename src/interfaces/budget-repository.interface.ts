import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
  RecurrentTransaction,
  User,
} from "../types/budget";

export interface IBudgetRepository {
  // Métodos de usuario
  createUser({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User>;

  getUserById({ id }: { id: string }): Promise<User | null>;

  getUserByEmail({ email }: { email: string }): Promise<User | null>;

  updateUser({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<User>;
  }): Promise<User | null>;

  // Obtener todos los presupuestos mensuales de un usuario
  getBudgets({ userId }: { userId: string }): Promise<MonthlyBudget[]>;

  // Obtener presupuesto por mes y año de un usuario
  getBudgetByMonth({
    userId,
    month,
    year,
  }: {
    userId: string;
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null>;

  // Crear presupuesto mensual
  createMonthlyBudget({
    userId,
    name,
    month,
    year,
    totalIncome,
    categories,
  }: {
    userId: string;
    name: string;
    month: number;
    year: number;
    totalIncome: number;
    categories: Category[];
  }): Promise<MonthlyBudget>;

  // Crear presupuesto basado en plantilla del mes anterior
  createFromPreviousMonth({
    userId,
    month,
    year,
  }: {
    userId: string;
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null>;

  // Actualizar presupuesto mensual
  updateMonthlyBudget({
    userId,
    id,
    updates,
  }: {
    userId: string;
    id: string;
    updates: Partial<MonthlyBudget>;
  }): Promise<MonthlyBudget | null>;

  // Agregar transacción
  addTransaction({
    userId,
    budgetId,
    transaction,
  }: {
    userId: string;
    budgetId: string;
    transaction: Omit<Transaction, "id" | "budgetId" | "userId">;
  }): Promise<Transaction | null>;

  // Obtener resumen del presupuesto
  getBudgetSummary({
    userId,
    budgetId,
  }: {
    userId: string;
    budgetId: string;
  }): Promise<BudgetSummary | null>;

  // Obtener presupuesto actual (mes y año actual) de un usuario
  getCurrentBudget({
    userId,
  }: {
    userId: string;
  }): Promise<MonthlyBudget | null>;

  // Eliminar presupuesto
  deleteBudget({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<boolean>;

  // Eliminar transacción
  deleteTransaction({
    userId,
    budgetId,
    transactionId,
  }: {
    userId: string;
    budgetId: string;
    transactionId: string;
  }): Promise<boolean>;

  // Obtener información de una transacción
  getTransactionInfo({
    userId,
    budgetId,
    transactionId,
  }: {
    userId: string;
    budgetId: string;
    transactionId: string;
  }): Promise<{ transaction: Transaction; budget: MonthlyBudget } | null>;

  // Métodos para transacciones recurrentes

  // Crear transacción recurrente
  createRecurrentTransaction({
    userId,
    recurrentTransaction,
  }: {
    userId: string;
    recurrentTransaction: Omit<
      RecurrentTransaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >;
  }): Promise<RecurrentTransaction>;

  // Obtener todas las transacciones recurrentes de un usuario
  getRecurrentTransactions({
    userId,
  }: {
    userId: string;
  }): Promise<RecurrentTransaction[]>;

  // Obtener transacciones recurrentes activas de un usuario
  getActiveRecurrentTransactions({
    userId,
  }: {
    userId: string;
  }): Promise<RecurrentTransaction[]>;

  // Actualizar transacción recurrente
  updateRecurrentTransaction({
    userId,
    id,
    updates,
  }: {
    userId: string;
    id: string;
    updates: Partial<RecurrentTransaction>;
  }): Promise<RecurrentTransaction | null>;

  // Eliminar transacción recurrente
  deleteRecurrentTransaction({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<boolean>;

  // Obtener transacciones recurrentes que deben ejecutarse para un usuario
  getRecurrentTransactionsDue({
    userId,
    date,
  }: {
    userId: string;
    date: Date;
  }): Promise<RecurrentTransaction[]>;
}
