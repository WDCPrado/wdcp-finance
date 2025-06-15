import {
  PrismaClient,
  User as PrismaUser,
  MonthlyBudget as PrismaBudget,
  Category as PrismaCategory,
  Transaction as PrismaTransaction,
  RecurrentTransaction as PrismaRecurrentTransaction,
} from "@prisma/client";
import {
  MonthlyBudget,
  Transaction,
  BudgetSummary,
  Category,
  RecurrentTransaction,
  User,
} from "../types/budget";
import { IBudgetRepository } from "../interfaces/budget-repository.interface";

// Tipos que incluyen relaciones
type PrismaBudgetWithRelations = PrismaBudget & {
  categories: PrismaCategory[];
  transactions: PrismaTransaction[];
};

export class PrismaBudgetRepository implements IBudgetRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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
    const user = await this.prisma.user.create({
      data: {
        email,
        password,
        name,
      },
    });

    return this.transformPrismaUser(user);
  }

  async getUserById({ id }: { id: string }): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.transformPrismaUser(user) : null;
  }

  async getUserByEmail({ email }: { email: string }): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.transformPrismaUser(user) : null;
  }

  async updateUser({
    id,
    updates,
  }: {
    id: string;
    updates: Partial<User>;
  }): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          email: updates.email,
          password: updates.password,
          name: updates.name,
        },
      });

      return this.transformPrismaUser(user);
    } catch {
      return null;
    }
  }

  // Obtener todos los presupuestos mensuales de un usuario
  async getBudgets({ userId }: { userId: string }): Promise<MonthlyBudget[]> {
    const budgets = await this.prisma.monthlyBudget.findMany({
      where: { userId },
      include: {
        categories: true,
        transactions: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return budgets.map((budget: PrismaBudgetWithRelations) =>
      this.transformPrismaBudget(budget)
    );
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
    const budget = await this.prisma.monthlyBudget.findUnique({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      include: {
        categories: true,
        transactions: true,
      },
    });

    return budget
      ? this.transformPrismaBudget(budget as PrismaBudgetWithRelations)
      : null;
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
    const budget = await this.prisma.monthlyBudget.create({
      data: {
        name,
        month,
        year,
        totalIncome,
        userId,
        categories: {
          create: categories.map((cat) => ({
            name: cat.name,
            description: cat.description,
            color: cat.color,
            icon: cat.icon,
            budgetAmount: cat.budgetAmount,
            type: cat.type === "income" ? "income" : "expense",
            userId,
          })),
        },
      },
      include: {
        categories: true,
        transactions: true,
      },
    });

    return this.transformPrismaBudget(budget as PrismaBudgetWithRelations);
  }

  // Crear presupuesto basado en plantilla del mes anterior
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
    try {
      const budget = await this.prisma.monthlyBudget.update({
        where: {
          id,
          userId, // Asegurar que pertenece al usuario
        },
        data: {
          name: updates.name,
          totalIncome: updates.totalIncome,
          isTemplate: updates.isTemplate,
        },
        include: {
          categories: true,
          transactions: true,
        },
      });

      return this.transformPrismaBudget(budget as PrismaBudgetWithRelations);
    } catch {
      return null;
    }
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
    try {
      const newTransaction = await this.prisma.transaction.create({
        data: {
          type: transaction.type === "income" ? "income" : "expense",
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date,
          isRecurrent: transaction.isRecurrent || false,
          recurrenceId: transaction.recurrenceId,
          userId,
          budgetId,
          categoryId: transaction.categoryId,
        },
      });

      return this.transformPrismaTransaction(newTransaction);
    } catch {
      return null;
    }
  }

  // Obtener resumen del presupuesto
  async getBudgetSummary({
    userId,
    budgetId,
  }: {
    userId: string;
    budgetId: string;
  }): Promise<BudgetSummary | null> {
    const budget = await this.prisma.monthlyBudget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
      include: {
        categories: true,
        transactions: true,
      },
    });

    if (!budget) {
      return null;
    }

    const totalIncome = Number(budget.totalIncome);
    const actualIncome = budget.transactions
      .filter((t: PrismaTransaction) => t.type === "income")
      .reduce((sum: number, t: PrismaTransaction) => sum + Number(t.amount), 0);

    const totalBudgeted = budget.categories
      .filter((c: PrismaCategory) => c.type === "expense")
      .reduce(
        (sum: number, c: PrismaCategory) => sum + Number(c.budgetAmount),
        0
      );

    const totalExpenses = budget.transactions
      .filter((t: PrismaTransaction) => t.type === "expense")
      .reduce((sum: number, t: PrismaTransaction) => sum + Number(t.amount), 0);

    const balance = actualIncome - totalExpenses;
    const remaining = totalIncome - totalBudgeted;

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

    budget.categories.forEach((category: PrismaCategory) => {
      const categoryTransactions = budget.transactions.filter(
        (t: PrismaTransaction) => t.categoryId === category.id
      );
      const spent = categoryTransactions.reduce(
        (sum: number, t: PrismaTransaction) => sum + Number(t.amount),
        0
      );

      categoryBreakdown[category.id] = {
        budgeted: Number(category.budgetAmount),
        spent,
        remaining: Number(category.budgetAmount) - spent,
        categoryName: category.name,
        color: category.color,
      };
    });

    return {
      totalIncome,
      actualIncome,
      totalBudgeted,
      totalExpenses,
      balance,
      remaining,
      categoryBreakdown,
    };
  }

  // Obtener presupuesto actual de un usuario
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

  // Eliminar presupuesto
  async deleteBudget({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<boolean> {
    try {
      await this.prisma.monthlyBudget.delete({
        where: {
          id,
          userId,
        },
      });
      return true;
    } catch {
      return false;
    }
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
    try {
      await this.prisma.transaction.delete({
        where: {
          id: transactionId,
          userId,
          budgetId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Obtener información de una transacción
  async getTransactionInfo({
    userId,
    budgetId,
    transactionId,
  }: {
    userId: string;
    budgetId: string;
    transactionId: string;
  }): Promise<{ transaction: Transaction; budget: MonthlyBudget } | null> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        budgetId,
      },
    });

    if (!transaction) {
      return null;
    }

    const budget = await this.getBudgetByMonth({
      userId,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    });

    if (!budget) {
      return null;
    }

    return {
      transaction: this.transformPrismaTransaction(transaction),
      budget,
    };
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
    const newRecurrent = await this.prisma.recurrentTransaction.create({
      data: {
        type: recurrentTransaction.type === "income" ? "income" : "expense",
        amount: recurrentTransaction.amount,
        description: recurrentTransaction.description,
        startDate: recurrentTransaction.startDate,
        endDate: recurrentTransaction.endDate,
        isActive: recurrentTransaction.isActive,
        interval: this.mapIntervalToPrisma(recurrentTransaction.interval),
        intervalValue: recurrentTransaction.intervalValue,
        nextExecutionDate: recurrentTransaction.nextExecutionDate,
        lastExecutionDate: recurrentTransaction.lastExecutionDate,
        userId,
        categoryId: recurrentTransaction.categoryId,
      },
    });

    return this.transformPrismaRecurrentTransaction(newRecurrent);
  }

  // Obtener todas las transacciones recurrentes de un usuario
  async getRecurrentTransactions({
    userId,
  }: {
    userId: string;
  }): Promise<RecurrentTransaction[]> {
    const recurrents = await this.prisma.recurrentTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return recurrents.map((r: PrismaRecurrentTransaction) =>
      this.transformPrismaRecurrentTransaction(r)
    );
  }

  // Obtener transacciones recurrentes activas de un usuario
  async getActiveRecurrentTransactions({
    userId,
  }: {
    userId: string;
  }): Promise<RecurrentTransaction[]> {
    const recurrents = await this.prisma.recurrentTransaction.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { nextExecutionDate: "asc" },
    });

    return recurrents.map((r: PrismaRecurrentTransaction) =>
      this.transformPrismaRecurrentTransaction(r)
    );
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
    try {
      const updated = await this.prisma.recurrentTransaction.update({
        where: {
          id,
          userId,
        },
        data: {
          type: updates.type
            ? updates.type === "income"
              ? "income"
              : "expense"
            : undefined,
          amount: updates.amount,
          description: updates.description,
          startDate: updates.startDate,
          endDate: updates.endDate,
          isActive: updates.isActive,
          interval: updates.interval
            ? this.mapIntervalToPrisma(updates.interval)
            : undefined,
          intervalValue: updates.intervalValue,
          nextExecutionDate: updates.nextExecutionDate,
          lastExecutionDate: updates.lastExecutionDate,
          categoryId: updates.categoryId,
        },
      });

      return this.transformPrismaRecurrentTransaction(updated);
    } catch {
      return null;
    }
  }

  // Eliminar transacción recurrente
  async deleteRecurrentTransaction({
    userId,
    id,
  }: {
    userId: string;
    id: string;
  }): Promise<boolean> {
    try {
      await this.prisma.recurrentTransaction.delete({
        where: {
          id,
          userId,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Obtener transacciones recurrentes que deben ejecutarse para un usuario
  async getRecurrentTransactionsDue({
    userId,
    date,
  }: {
    userId: string;
    date: Date;
  }): Promise<RecurrentTransaction[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const recurrents = await this.prisma.recurrentTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextExecutionDate: {
          lte: targetDate,
        },
        OR: [
          { endDate: null },
          {
            endDate: {
              gte: targetDate,
            },
          },
        ],
      },
    });

    return recurrents.map((r: PrismaRecurrentTransaction) =>
      this.transformPrismaRecurrentTransaction(r)
    );
  }

  // Métodos de transformación privados
  private transformPrismaUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      name: prismaUser.name || undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }

  private transformPrismaBudget(
    prismaBudget: PrismaBudgetWithRelations
  ): MonthlyBudget {
    return {
      id: prismaBudget.id,
      name: prismaBudget.name,
      month: prismaBudget.month,
      year: prismaBudget.year,
      totalIncome: Number(prismaBudget.totalIncome),
      userId: prismaBudget.userId,
      categories:
        prismaBudget.categories?.map((cat: PrismaCategory) =>
          this.transformPrismaCategory(cat)
        ) || [],
      transactions:
        prismaBudget.transactions?.map((trans: PrismaTransaction) =>
          this.transformPrismaTransaction(trans)
        ) || [],
      createdAt: prismaBudget.createdAt,
      updatedAt: prismaBudget.updatedAt,
      isTemplate: prismaBudget.isTemplate,
    };
  }

  private transformPrismaCategory(prismaCategory: PrismaCategory): Category {
    return {
      id: prismaCategory.id,
      name: prismaCategory.name,
      description: prismaCategory.description || undefined,
      color: prismaCategory.color,
      icon: prismaCategory.icon,
      budgetAmount: Number(prismaCategory.budgetAmount),
      type: prismaCategory.type as "income" | "expense",
      userId: prismaCategory.userId,
    };
  }

  private transformPrismaTransaction(
    prismaTransaction: PrismaTransaction
  ): Transaction {
    return {
      id: prismaTransaction.id,
      type: prismaTransaction.type as "income" | "expense",
      amount: Number(prismaTransaction.amount),
      description: prismaTransaction.description,
      categoryId: prismaTransaction.categoryId,
      date: prismaTransaction.date,
      budgetId: prismaTransaction.budgetId,
      userId: prismaTransaction.userId,
      isRecurrent: prismaTransaction.isRecurrent,
      recurrenceId: prismaTransaction.recurrenceId || undefined,
    };
  }

  private transformPrismaRecurrentTransaction(
    prismaRecurrent: PrismaRecurrentTransaction
  ): RecurrentTransaction {
    return {
      id: prismaRecurrent.id,
      type: prismaRecurrent.type as "income" | "expense",
      amount: Number(prismaRecurrent.amount),
      description: prismaRecurrent.description,
      categoryId: prismaRecurrent.categoryId,
      userId: prismaRecurrent.userId,
      startDate: prismaRecurrent.startDate,
      endDate: prismaRecurrent.endDate || undefined,
      isActive: prismaRecurrent.isActive,
      interval: this.mapIntervalFromPrisma(prismaRecurrent.interval),
      intervalValue: prismaRecurrent.intervalValue,
      nextExecutionDate: prismaRecurrent.nextExecutionDate,
      lastExecutionDate: prismaRecurrent.lastExecutionDate || undefined,
      createdAt: prismaRecurrent.createdAt,
      updatedAt: prismaRecurrent.updatedAt,
    };
  }

  private mapIntervalToPrisma(
    interval: "monthly" | "quarterly" | "semi-annual" | "annual" | "custom"
  ): "monthly" | "quarterly" | "semi_annual" | "annual" | "custom" {
    return interval === "semi-annual" ? "semi_annual" : interval;
  }

  private mapIntervalFromPrisma(
    interval: string
  ): "monthly" | "quarterly" | "semi-annual" | "annual" | "custom" {
    return interval === "semi_annual"
      ? "semi-annual"
      : (interval as
          | "monthly"
          | "quarterly"
          | "semi-annual"
          | "annual"
          | "custom");
  }
}
