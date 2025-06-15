import { useBudgetStore } from "../../stores/budget.store";
import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
  RecurrentTransaction,
  User,
} from "../types/budget";
import { IBudgetRepository } from "../interfaces/budget-repository.interface";

// Extensión temporal del store para incluir transacciones recurrentes y usuarios
interface ExtendedBudgetStore {
  recurrentTransactions?: RecurrentTransaction[];
  users?: User[];
}

export class BudgetRepository implements IBudgetRepository {
  private getStore() {
    return useBudgetStore.getState();
  }

  private getExtendedStore() {
    return useBudgetStore.getState() as unknown as ExtendedBudgetStore;
  }

  // Métodos de usuario
  async createUser({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const id = crypto.randomUUID();
    const now = new Date();

    const newUser: User = {
      id,
      email,
      password,
      name,
      createdAt: now,
      updatedAt: now,
    };

    const store = this.getExtendedStore();
    if (!store.users) {
      store.users = [];
    }
    store.users.push(newUser);

    return newUser;
  }

  async getUserById({ id }: { id: string }): Promise<User | null> {
    const store = this.getExtendedStore();
    const users = store.users || [];
    return users.find((user) => user.id === id) || null;
  }

  async getUserByEmail({ email }: { email: string }): Promise<User | null> {
    const store = this.getExtendedStore();
    const users = store.users || [];
    return users.find((user) => user.email === email) || null;
  }

  async updateUser({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<User>;
  }): Promise<User | null> {
    const store = this.getExtendedStore();
    const users = store.users || [];
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return null;
    }

    const updatedUser = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date(),
    };

    users[userIndex] = updatedUser;
    return updatedUser;
  }

  // Obtener todos los presupuestos mensuales de un usuario
  async getBudgets({ userId }: { userId: string }): Promise<MonthlyBudget[]> {
    const allBudgets = this.getStore().budgets;
    return allBudgets.filter((budget) => budget.userId === userId);
  }

  // Obtener presupuesto por mes y año de un usuario
  async getBudgetByMonth({
    userId,
    month,
    year,
  }: {
    userId: string;
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null> {
    const budgets = await this.getBudgets({ userId });
    return budgets.find((b) => b.month === month && b.year === year) || null;
  }

  // Crear presupuesto mensual
  async createMonthlyBudget({
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
  }): Promise<MonthlyBudget> {
    // Agregar userId a las categorías
    const categoriesWithUserId = categories.map((cat) => ({
      ...cat,
      userId,
    }));

    // Crear el presupuesto usando el store (que no incluye userId aún)
    const budget = this.getStore().createMonthlyBudget({
      name,
      month,
      year,
      totalIncome,
      categories: categoriesWithUserId,
    });

    // Agregar el userId al presupuesto creado para cumplir con el dominio
    const budgetWithUserId: MonthlyBudget = {
      ...budget,
      userId,
    };

    // Actualizar el presupuesto en el store con el userId
    this.getStore().updateMonthlyBudget({
      id: budget.id,
      updates: { userId },
    });

    return budgetWithUserId;
  }

  // Crear o actualizar presupuesto basado en plantilla del mes anterior
  async createFromPreviousMonth({
    userId,
    month,
    year,
  }: {
    userId: string;
    month: number;
    year: number;
  }): Promise<MonthlyBudget | null> {
    // Obtener el mes anterior
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousYear = month === 1 ? year - 1 : year;

    const previousBudget = await this.getBudgetByMonth({
      userId,
      month: previousMonth,
      year: previousYear,
    });

    if (!previousBudget) {
      return null;
    }

    return this.createMonthlyBudget({
      userId,
      name: `Presupuesto ${month}/${year}`,
      month,
      year,
      totalIncome: previousBudget.totalIncome,
      categories: previousBudget.categories.map((cat) => ({
        ...cat,
        id: crypto.randomUUID(), // Nuevo ID para evitar conflictos
        userId,
      })),
    });
  }

  // Actualizar presupuesto mensual
  async updateMonthlyBudget({
    userId,
    id,
    updates,
  }: {
    userId: string;
    id: string;
    updates: Partial<MonthlyBudget>;
  }): Promise<MonthlyBudget | null> {
    // Verificar que el presupuesto pertenece al usuario
    const budget = await this.getBudgets({ userId });
    const targetBudget = budget.find((b) => b.id === id);

    if (!targetBudget) {
      return null;
    }

    return this.getStore().updateMonthlyBudget({ id, updates });
  }

  // Eliminar presupuesto
  async deleteBudget({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<boolean> {
    // Verificar que el presupuesto pertenece al usuario
    const budgets = await this.getBudgets({ userId });
    const targetBudget = budgets.find((b) => b.id === id);

    if (!targetBudget) {
      return false;
    }

    return this.getStore().deleteBudget({ id });
  }

  // Agregar transacción
  async addTransaction({
    userId,
    budgetId,
    transaction,
  }: {
    userId: string;
    budgetId: string;
    transaction: Omit<Transaction, "id" | "budgetId" | "userId">;
  }): Promise<Transaction | null> {
    // Verificar que el presupuesto pertenece al usuario
    const budgets = await this.getBudgets({ userId });
    const targetBudget = budgets.find((b) => b.id === budgetId);

    if (!targetBudget) {
      return null;
    }

    const transactionWithUserId = {
      ...transaction,
      userId,
    };

    return this.getStore().addTransaction({
      budgetId,
      transaction: transactionWithUserId,
    });
  }

  // Eliminar transacción
  async deleteTransaction({
    userId,
    budgetId,
    transactionId,
  }: {
    userId: string;
    budgetId: string;
    transactionId: string;
  }): Promise<boolean> {
    // Verificar que el presupuesto pertenece al usuario
    const budgets = await this.getBudgets({ userId });
    const targetBudget = budgets.find((b) => b.id === budgetId);

    if (!targetBudget) {
      return false;
    }

    // Verificar que la transacción pertenece al usuario
    const transaction = targetBudget.transactions.find(
      (t) => t.id === transactionId
    );
    if (!transaction || transaction.userId !== userId) {
      return false;
    }

    return this.getStore().deleteTransaction({ budgetId, transactionId });
  }

  // Obtener información de una transacción antes de eliminarla
  async getTransactionInfo({
    userId,
    budgetId,
    transactionId,
  }: {
    userId: string;
    budgetId: string;
    transactionId: string;
  }): Promise<{ transaction: Transaction; budget: MonthlyBudget } | null> {
    const budgets = await this.getBudgets({ userId });
    const targetBudget = budgets.find((b) => b.id === budgetId);

    if (!targetBudget) return null;

    const transaction = targetBudget.transactions.find(
      (t) => t.id === transactionId && t.userId === userId
    );
    if (!transaction) return null;

    return { transaction, budget: targetBudget };
  }

  // Obtener resumen del presupuesto
  async getBudgetSummary({
    userId,
    budgetId,
  }: {
    userId: string;
    budgetId: string;
  }): Promise<BudgetSummary | null> {
    // Verificar que el presupuesto pertenece al usuario
    const budgets = await this.getBudgets({ userId });
    const targetBudget = budgets.find((b) => b.id === budgetId);

    if (!targetBudget) {
      return null;
    }

    return this.getStore().getBudgetSummary({ budgetId });
  }

  // Obtener presupuesto actual (mes y año actual) de un usuario
  async getCurrentBudget({
    userId,
  }: {
    userId: string;
  }): Promise<MonthlyBudget | null> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    return this.getBudgetByMonth({
      userId,
      month: currentMonth,
      year: currentYear,
    });
  }

  // Métodos para transacciones recurrentes

  // Crear transacción recurrente
  async createRecurrentTransaction({
    userId,
    recurrentTransaction,
  }: {
    userId: string;
    recurrentTransaction: Omit<
      RecurrentTransaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >;
  }): Promise<RecurrentTransaction> {
    const id = crypto.randomUUID();
    const now = new Date();

    const newRecurrentTransaction: RecurrentTransaction = {
      ...recurrentTransaction,
      id,
      userId,
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

  // Obtener todas las transacciones recurrentes de un usuario
  async getRecurrentTransactions({
    userId,
  }: {
    userId: string;
  }): Promise<RecurrentTransaction[]> {
    const store = this.getExtendedStore();
    const allRecurrent = store.recurrentTransactions || [];
    return allRecurrent.filter((rt) => rt.userId === userId);
  }

  // Obtener transacciones recurrentes activas de un usuario
  async getActiveRecurrentTransactions({
    userId,
  }: {
    userId: string;
  }): Promise<RecurrentTransaction[]> {
    const userRecurrent = await this.getRecurrentTransactions({ userId });
    return userRecurrent.filter((rt) => rt.isActive);
  }

  // Actualizar transacción recurrente
  async updateRecurrentTransaction({
    userId,
    id,
    updates,
  }: {
    userId: string;
    id: string;
    updates: Partial<RecurrentTransaction>;
  }): Promise<RecurrentTransaction | null> {
    const store = this.getExtendedStore();
    const recurrentTransactions = store.recurrentTransactions || [];

    const index = recurrentTransactions.findIndex(
      (rt: RecurrentTransaction) => rt.id === id && rt.userId === userId
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
  async deleteRecurrentTransaction({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<boolean> {
    const store = this.getExtendedStore();
    const recurrentTransactions = store.recurrentTransactions || [];

    const index = recurrentTransactions.findIndex(
      (rt: RecurrentTransaction) => rt.id === id && rt.userId === userId
    );
    if (index === -1) {
      return false;
    }

    recurrentTransactions.splice(index, 1);
    return true;
  }

  // Obtener transacciones recurrentes que deben ejecutarse para un usuario
  async getRecurrentTransactionsDue({
    userId,
    date,
  }: {
    userId: string;
    date: Date;
  }): Promise<RecurrentTransaction[]> {
    const active = await this.getActiveRecurrentTransactions({ userId });
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    console.log(
      `[DEBUG] Buscando transacciones pendientes para usuario ${userId} en: ${targetDate.toDateString()}`
    );
    console.log(`[DEBUG] Transacciones activas del usuario: ${active.length}`);

    const dueTransactions = active.filter((rt) => {
      // Verificar si es momento de ejecutar
      const nextExecution = new Date(rt.nextExecutionDate);
      nextExecution.setHours(0, 0, 0, 0);

      console.log(
        `[DEBUG] Evaluando "${
          rt.description
        }": próxima ejecución ${nextExecution.toDateString()}`
      );

      // Verificar que no haya pasado la fecha de fin
      if (rt.endDate) {
        const endDate = new Date(rt.endDate);
        endDate.setHours(0, 0, 0, 0);
        if (targetDate > endDate) {
          console.log(
            `[DEBUG] - Rechazada: pasó fecha de fin (${endDate.toDateString()})`
          );
          return false;
        }
      }

      const isDue = targetDate >= nextExecution;
      console.log(
        `[DEBUG] - ${
          isDue ? "PENDIENTE" : "No pendiente"
        }: ${targetDate.toDateString()} >= ${nextExecution.toDateString()}`
      );

      return isDue;
    });

    console.log(
      `[DEBUG] Transacciones pendientes encontradas para usuario ${userId}: ${dueTransactions.length}`
    );
    return dueTransactions;
  }
}

// Instancia singleton del repositorio
export const budgetRepository = new BudgetRepository();
