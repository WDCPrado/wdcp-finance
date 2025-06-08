import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { MonthlyBudget, Category } from "../../types/budget";
import { isIncomeCategory } from "../../constants/categories";

export interface CreateBudgetRequest {
  name: string;
  month: number;
  year: number;
  totalIncome: number;
  categories: Category[];
}

export interface CreateBudgetResponse {
  success: boolean;
  budget?: MonthlyBudget;
  error?: string;
}

export class CreateBudgetUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    name,
    month,
    year,
    totalIncome,
    categories,
  }: CreateBudgetRequest): Promise<CreateBudgetResponse> {
    try {
      // Validaciones de negocio
      if (totalIncome <= 0) {
        return {
          success: false,
          error: "El ingreso total debe ser mayor que cero",
        };
      }

      if (categories.length === 0) {
        return {
          success: false,
          error: "Debe definir al menos una categoría",
        };
      }

      // Separar categorías de gastos e ingresos
      const expenseCategories = categories.filter(
        (cat) => !isIncomeCategory(cat.name)
      );
      const totalExpensesBudgeted = expenseCategories.reduce(
        (sum, cat) => sum + cat.budgetAmount,
        0
      );

      if (totalExpensesBudgeted > totalIncome) {
        return {
          success: false,
          error: "Los gastos presupuestados no pueden exceder el ingreso total",
        };
      }

      // Verificar si ya existe un presupuesto para este mes/año
      const existingBudget = await this.budgetRepository.getBudgetByMonth({
        month,
        year,
      });
      if (existingBudget) {
        return {
          success: false,
          error: `Ya existe un presupuesto para ${month}/${year}`,
        };
      }

      // Crear el presupuesto
      const budget = await this.budgetRepository.createMonthlyBudget({
        name: name || `Presupuesto ${month}/${year}`,
        month,
        year,
        totalIncome,
        categories,
      });

      return {
        success: true,
        budget,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
