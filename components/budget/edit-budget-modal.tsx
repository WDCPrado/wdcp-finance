"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { IconSelector, ICON_COMPONENTS } from "@/components/ui/icon-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { container } from "@/src/di/container";
import { MonthlyBudget, Category } from "@/src/types/budget";
import {
  ALL_DEFAULT_CATEGORIES,
  isIncomeCategory,
  type IconName,
} from "@/src/constants/categories";
import { useCurrency } from "@/src/hooks/useCurrency";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  DollarSign,
  Sparkles,
} from "lucide-react";

interface EditBudgetModalProps {
  budget: MonthlyBudget;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBudgetModal({
  budget,
  isOpen,
  onClose,
  onSuccess,
}: EditBudgetModalProps) {
  const [budgetName, setBudgetName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    budgetAmount: 0,
    color: "#6B7280",
    icon: "DollarSign" as IconName,
    type: "expense" as "income" | "expense",
  });
  const [completingIncome, setCompletingIncome] = useState<string>("");

  // Use currency hook
  const { formatCurrency } = useCurrency();

  // Initialize form data when budget changes
  useEffect(() => {
    if (budget) {
      setBudgetName(budget.name);
      setCategories([...budget.categories]);
    }
  }, [budget]);

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

  const handleCategoryChange = ({
    categoryId,
    field,
    value,
  }: {
    categoryId: string;
    field: keyof Category;
    value: string | number;
  }) => {
    setCategories(
      categories.map((cat) =>
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    );
  };

  const handleCompleteIncome = async (categoryId: string) => {
    setCompletingIncome(categoryId);

    const category = categories.find((c) => c.id === categoryId);
    if (!category || category.budgetAmount === 0) {
      setCompletingIncome("");
      return;
    }

    try {
      // Crear transacción de ingreso por el monto completo de la categoría
      const result = await container.addTransactionUseCase.execute({
        budgetId: budget.id,
        type: "income",
        amount: category.budgetAmount,
        description: `Ingreso completo - ${category.name}`,
        categoryId: categoryId,
        date: new Date(),
      });

      if (result.success) {
        onSuccess(); // Recargar el presupuesto
        if (result.warnings && result.warnings.length > 0) {
          alert("Advertencias:\n" + result.warnings.join("\n"));
        }
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error completing income:", error);
      alert("Error inesperado al completar el ingreso");
    } finally {
      setTimeout(() => setCompletingIncome(""), 1000); // Animación
    }
  };

  const addCategory = () => {
    if (!newCategory.name.trim() || newCategory.budgetAmount < 0) return;

    const category: Category = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      color: newCategory.color,
      icon: newCategory.icon,
      budgetAmount: newCategory.budgetAmount,
      type: newCategory.type,
    };

    setCategories([...categories, category]);
    setNewCategory({
      name: "",
      description: "",
      budgetAmount: 0,
      color: "#6B7280",
      icon: "DollarSign" as IconName,
      type: "expense" as "income" | "expense",
    });
    setShowAddCategory(false);
  };

  const addPredefinedCategory = () => {
    // Find categories that are not already in the budget
    const existingCategoryNames = categories.map((cat) => cat.name);
    const availableCategories = ALL_DEFAULT_CATEGORIES.filter(
      (cat) => !existingCategoryNames.includes(cat.name)
    );

    if (availableCategories.length === 0) return;

    // Add the first available category
    const categoryToAdd = availableCategories[0];
    const newCategory: Category = {
      ...categoryToAdd,
      id: Math.random().toString(36).substring(7),
      budgetAmount: 0,
    };

    setCategories([...categories, newCategory]);
  };

  const removeCategory = ({ categoryId }: { categoryId: string }) => {
    // No permitir eliminar si es la única categoría
    if (categories.length <= 1) {
      setError("Debe haber al menos una categoría");
      return;
    }

    setCategories(categories.filter((cat) => cat.id !== categoryId));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validations
      if (categories.length === 0) {
        setError("Debe tener al menos una categoría");
        return;
      }

      const result = await container.editBudgetUseCase.execute({
        budgetId: budget.id,
        name: budgetName,
        totalIncome: totalIncomeFromCategories,
        categories: categories.filter((cat) => cat.budgetAmount >= 0), // Allow 0 budget amounts
      });

      if (!result.success) {
        setError(result.error || "Error desconocido");
        return;
      }

      if (result.budget) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error editing budget:", error);
      setError("Error inesperado al editar el presupuesto");
    } finally {
      setIsLoading(false);
    }
  };

  // Separar categorías por tipo
  const incomeCategories = categories.filter((cat) => isIncomeCategory(cat));
  const expenseCategories = categories.filter((cat) => !isIncomeCategory(cat));

  // Calcular totales separados
  const totalIncomeFromCategories = incomeCategories.reduce(
    (sum, cat) => sum + (cat.budgetAmount || 0),
    0
  );
  const totalExpensesBudgeted = expenseCategories.reduce(
    (sum, cat) => sum + (cat.budgetAmount || 0),
    0
  );
  const totalBudgeted = totalExpensesBudgeted; // Solo gastos para el resumen
  const remaining = totalIncomeFromCategories - totalExpensesBudgeted;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[70vw] max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Editar Presupuesto
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles de tu presupuesto mensual
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded animate-pulse">
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
              className="text-lg font-medium"
            />
          </div>

          {/* Resumen */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency({ amount: totalIncomeFromCategories })}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Ingreso total
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency({ amount: totalBudgeted })}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Gastos presupuestados
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    className={`text-2xl font-bold ${
                      remaining >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency({ amount: remaining })}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Disponible
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorías de Ingresos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Categorías de Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {incomeCategories.map((category) => {
                const IconComponent =
                  ICON_COMPONENTS[
                    category.icon as keyof typeof ICON_COMPONENTS
                  ] || DollarSign;
                const isCompleting = completingIncome === category.id;

                return (
                  <div
                    key={category.id}
                    className="grid grid-cols-12 gap-3 p-4 border-2 border-green-200 rounded-lg bg-green-50 transition-all duration-300 hover:shadow-md"
                  >
                    {/* Icono */}
                    <div className="col-span-1 flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
                        style={{ backgroundColor: category.color }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="col-span-3">
                      <Label className="text-xs text-green-700 font-medium">
                        Nombre
                      </Label>
                      <Input
                        value={category.name}
                        onChange={(e) =>
                          handleCategoryChange({
                            categoryId: category.id,
                            field: "name",
                            value: e.target.value,
                          })
                        }
                        placeholder="Nombre categoría"
                        className="text-sm font-medium"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="col-span-3">
                      <Label className="text-xs text-green-700 font-medium">
                        Descripción
                      </Label>
                      <Input
                        value={category.description}
                        onChange={(e) =>
                          handleCategoryChange({
                            categoryId: category.id,
                            field: "description",
                            value: e.target.value,
                          })
                        }
                        placeholder="Descripción"
                        className="text-sm"
                      />
                    </div>

                    {/* Presupuesto */}
                    <div className="col-span-2">
                      <Label className="text-xs text-green-700 font-medium">
                        Presupuesto
                      </Label>
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

                    {/* Icono Selector */}
                    <div className="col-span-2">
                      <Label className="text-xs text-green-700 font-medium">
                        Icono
                      </Label>
                      <IconSelector
                        value={category.icon as IconName}
                        onChange={(icon: IconName) =>
                          handleCategoryChange({
                            categoryId: category.id,
                            field: "icon",
                            value: icon,
                          })
                        }
                        color={category.color}
                      />
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1 flex flex-col gap-1">
                      <Label className="text-xs text-green-700 font-medium">
                        Acciones
                      </Label>
                      {category.budgetAmount > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleCompleteIncome(category.id)}
                          disabled={isCompleting}
                          className={`bg-green-600 hover:bg-green-700 transition-all duration-300 ${
                            isCompleting ? "animate-pulse scale-105" : ""
                          }`}
                        >
                          {isCompleting ? (
                            <Sparkles className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeCategory({ categoryId: category.id })
                        }
                        disabled={categories.length <= 1}
                        className="hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Categorías de Gastos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Categorías de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {expenseCategories.map((category) => {
                const IconComponent =
                  ICON_COMPONENTS[
                    category.icon as keyof typeof ICON_COMPONENTS
                  ] || DollarSign;

                return (
                  <div
                    key={category.id}
                    className="grid grid-cols-12 gap-3 p-4 border rounded-lg transition-all duration-300 hover:shadow-md hover:border-gray-300"
                  >
                    {/* Icono */}
                    <div className="col-span-1 flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105"
                        style={{ backgroundColor: category.color }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Nombre */}
                    <div className="col-span-3">
                      <Label className="text-xs text-red-700 font-medium">
                        Nombre
                      </Label>
                      <Input
                        value={category.name}
                        onChange={(e) =>
                          handleCategoryChange({
                            categoryId: category.id,
                            field: "name",
                            value: e.target.value,
                          })
                        }
                        placeholder="Nombre categoría"
                        className="text-sm font-medium"
                      />
                    </div>

                    {/* Descripción */}
                    <div className="col-span-3">
                      <Label className="text-xs text-red-700 font-medium">
                        Descripción
                      </Label>
                      <Input
                        value={category.description}
                        onChange={(e) =>
                          handleCategoryChange({
                            categoryId: category.id,
                            field: "description",
                            value: e.target.value,
                          })
                        }
                        placeholder="Descripción"
                        className="text-sm"
                      />
                    </div>

                    {/* Presupuesto */}
                    <div className="col-span-2">
                      <Label className="text-xs text-red-700 font-medium">
                        Presupuesto
                      </Label>
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

                    {/* Icono Selector */}
                    <div className="col-span-2">
                      <Label className="text-xs text-red-700 font-medium">
                        Icono
                      </Label>
                      <IconSelector
                        value={category.icon as IconName}
                        onChange={(icon: IconName) =>
                          handleCategoryChange({
                            categoryId: category.id,
                            field: "icon",
                            value: icon,
                          })
                        }
                        color={category.color}
                      />
                    </div>

                    {/* Acciones */}
                    <div className="col-span-1">
                      <Label className="text-xs text-red-700 font-medium">
                        Acciones
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeCategory({ categoryId: category.id })
                        }
                        disabled={categories.length <= 1}
                        className="w-full hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Agregar nueva categoría */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-blue-600">
                  Agregar Categoría
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPredefinedCategory}
                    disabled={ALL_DEFAULT_CATEGORIES.every((cat) =>
                      categories.some((existing) => existing.name === cat.name)
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Predefinida
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Personalizada
                  </Button>
                </div>
              </div>
            </CardHeader>

            {showAddCategory && (
              <CardContent className="space-y-4 border-t bg-gray-50">
                <div className="grid grid-cols-12 gap-3 p-4">
                  {/* Nombre */}
                  <div className="col-span-3">
                    <Label>Nombre</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          name: e.target.value,
                        })
                      }
                      placeholder="Ej: Educación"
                    />
                  </div>

                  {/* Descripción */}
                  <div className="col-span-3">
                    <Label>Descripción</Label>
                    <Input
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                      placeholder="Ej: Cursos, libros"
                    />
                  </div>

                  {/* Tipo */}
                  <div className="col-span-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newCategory.type}
                      onValueChange={(value: "income" | "expense") =>
                        setNewCategory({
                          ...newCategory,
                          type: value,
                        })
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

                  {/* Presupuesto */}
                  <div className="col-span-2">
                    <Label>Presupuesto</Label>
                    <CurrencyInput
                      value={newCategory.budgetAmount}
                      onChange={(value) =>
                        setNewCategory({
                          ...newCategory,
                          budgetAmount: value,
                        })
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Icono */}
                  <div className="col-span-2">
                    <Label>Icono</Label>
                    <IconSelector
                      value={newCategory.icon}
                      onChange={(icon: IconName) =>
                        setNewCategory({
                          ...newCategory,
                          icon: icon,
                        })
                      }
                      color={newCategory.color}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end px-4 pb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCategory(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={addCategory}
                    disabled={!newCategory.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Botones finales */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                budgetName.trim() === "" ||
                totalIncomeFromCategories === 0 ||
                categories.length === 0
              }
              className="min-w-32 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
