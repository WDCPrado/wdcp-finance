"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSelector, ICON_COMPONENTS } from "@/components/ui/icon-selector";
import { container } from "@/src/di/container";
import { Category } from "@/src/types/budget";
import {
  ALL_DEFAULT_CATEGORIES,
  isIncomeCategory,
  type IconName,
} from "@/src/constants/categories";
import { useCurrency } from "@/src/hooks/useCurrency";
import { Plus, Trash2, DollarSign } from "lucide-react";

// Usar ICON_COMPONENTS del IconSelector

interface CreateBudgetFormProps {
  onSuccess?: () => void;
}

export default function CreateBudgetForm({ onSuccess }: CreateBudgetFormProps) {
  const [budgetName, setBudgetName] = useState("");
  const [categories, setCategories] = useState<Category[]>(
    ALL_DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: Math.random().toString(36).substring(7),
      budgetAmount: 0,
    }))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryType, setCustomCategoryType] = useState<
    "income" | "expense"
  >("expense");
  const [customCategoryIcon, setCustomCategoryIcon] =
    useState<IconName>("DollarSign");
  const [customCategoryColor, setCustomCategoryColor] = useState("#6B7280");
  const [error, setError] = useState<string>("");

  // Use currency hook
  const { formatCurrency } = useCurrency();

  const handleCategoryBudgetChange = ({
    categoryId,
    amount,
  }: {
    categoryId: string;
    amount: number;
  }) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, budgetAmount: amount } : cat
      )
    );
  };

  const addCustomCategory = () => {
    if (!customCategoryName.trim()) return;

    const newCategory: Category = {
      id: Math.random().toString(36).substring(7),
      name: customCategoryName.trim(),
      description: "",
      color: customCategoryColor,
      icon: customCategoryIcon,
      budgetAmount: 0,
      type: customCategoryType,
    };

    setCategories([...categories, newCategory]);
    setCustomCategoryName("");
    setCustomCategoryType("expense");
    setCustomCategoryIcon("DollarSign");
    setCustomCategoryColor("#6B7280");
  };

  const removeCategory = ({ categoryId }: { categoryId: string }) => {
    setCategories(categories.filter((cat) => cat.id !== categoryId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const result = await container.createBudgetUseCase.execute({
        name: budgetName || `Presupuesto ${currentMonth}/${currentYear}`,
        month: currentMonth,
        year: currentYear,
        totalIncome: totalIncome,
        categories: categories.filter((cat) => cat.budgetAmount > 0),
      });

      if (!result.success) {
        setError(result.error || "Error desconocido");
        return;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error creating budget:", error);
      setError("Error inesperado al crear el presupuesto");
    } finally {
      setIsLoading(false);
    }
  };

  // Separar categorías por tipo
  const incomeCategories = categories.filter((cat) => isIncomeCategory(cat));
  const expenseCategories = categories.filter((cat) => !isIncomeCategory(cat));

  // Calcular totales separados
  const totalIncome = incomeCategories.reduce(
    (sum, cat) => sum + cat.budgetAmount,
    0
  );
  const totalExpensesBudgeted = expenseCategories.reduce(
    (sum, cat) => sum + cat.budgetAmount,
    0
  );
  const totalBudgeted = totalExpensesBudgeted; // Solo para mostrar en el resumen
  const remaining = totalIncome - totalExpensesBudgeted;

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          Crear Presupuesto Mensual
        </CardTitle>
        <CardDescription>
          Define tu ingreso mensual y distribuye el dinero en diferentes
          categorías
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Información básica */}
          <div className="space-y-2">
            <Label htmlFor="budget-name">Nombre del presupuesto</Label>
            <Input
              id="budget-name"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              placeholder="Ej: Presupuesto Diciembre 2024"
            />
          </div>

          {/* Resumen */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency({ amount: totalIncome })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ingreso total
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-destructive">
                  {formatCurrency({ amount: totalBudgeted })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Gastos presupuestados
                </div>
              </div>
              <div>
                <div
                  className={`text-lg font-semibold ${
                    remaining >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {formatCurrency({ amount: remaining })}
                </div>
                <div className="text-sm text-muted-foreground">Disponible</div>
              </div>
            </div>
          </div>

          {/* Categorías de Ingreso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              Categorías de Ingresos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomeCategories.map((category) => {
                const IconComponent =
                  ICON_COMPONENTS[
                    category.icon as keyof typeof ICON_COMPONENTS
                  ] || DollarSign;

                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 border-2 border-primary rounded-lg bg-primary/5"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground">
                          {category.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <CurrencyInput
                          value={category.budgetAmount}
                          onChange={(amount) =>
                            handleCategoryBudgetChange({
                              categoryId: category.id,
                              amount,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeCategory({ categoryId: category.id })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categorías de Gastos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-destructive">
              Categorías de Gastos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expenseCategories.map((category) => {
                const IconComponent =
                  ICON_COMPONENTS[
                    category.icon as keyof typeof ICON_COMPONENTS
                  ] || DollarSign;

                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground">
                          {category.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <CurrencyInput
                          value={category.budgetAmount}
                          onChange={(amount) =>
                            handleCategoryBudgetChange({
                              categoryId: category.id,
                              amount,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeCategory({ categoryId: category.id })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Agregar categoría personalizada */}
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5">
              <h4 className="font-medium">Agregar Nueva Categoría</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="Nombre de nueva categoría"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={customCategoryType}
                    onValueChange={(value: "income" | "expense") =>
                      setCustomCategoryType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Gasto</SelectItem>
                      <SelectItem value="income">Ingreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icono y Color</Label>
                  <IconSelector
                    value={customCategoryIcon}
                    onChange={setCustomCategoryIcon}
                    color={customCategoryColor}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <input
                    type="color"
                    value={customCategoryColor}
                    onChange={(e) => setCustomCategoryColor(e.target.value)}
                    className="w-full h-10 rounded border"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={addCustomCategory}
                disabled={!customCategoryName.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Categoría
              </Button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end">
            <Button
              type="submit"
              disabled={isLoading || totalIncome === 0}
              className="min-w-32"
            >
              {isLoading ? "Creando..." : "Crear Presupuesto"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
