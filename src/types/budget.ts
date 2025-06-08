export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  budgetAmount: number;
  type: "income" | "expense";
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  budgetId: string;
}

export interface MonthlyBudget {
  id: string;
  name: string;
  month: number;
  year: number;
  totalIncome: number;
  categories: Category[];
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
  isTemplate: boolean;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  totalIncome: number;
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetSummary {
  totalIncome: number;
  actualIncome: number;
  totalBudgeted: number;
  totalExpenses: number;
  balance: number;
  remaining: number;
  categoryBreakdown: Record<
    string,
    {
      budgeted: number;
      spent: number;
      remaining: number;
      categoryName: string;
      color: string;
    }
  >;
}
