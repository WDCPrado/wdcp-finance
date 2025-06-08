"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { BudgetSummary, MonthlyBudget, Category } from "@/src/types/budget";
import { isIncomeCategory, type IconName } from "@/src/constants/categories";
import {
  Calendar,
  DollarSign,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Settings,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { container } from "@/src/di/container";
import { useCurrency } from "@/src/hooks/useCurrency";
import EditBudgetModal from "./edit-budget-modal";

interface BudgetDashboardProps {
  budget: MonthlyBudget;
  onBudgetUpdated: () => void;
  onBudgetDeleted?: () => void;
}

export default function BudgetDashboard({
  budget,
  onBudgetUpdated,
  onBudgetDeleted,
}: BudgetDashboardProps) {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showEditBudget, setShowEditBudget] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as "income" | "expense",
    amount: 0,
    description: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    budgetAmount: 0,
    color: "#6B7280",
    icon: "DollarSign" as IconName,
    type: "expense" as "income" | "expense",
  });

  const { formatCurrency } = useCurrency();

  const loadSummary = async () => {
    try {
      const budgetSummary = await container.budgetRepository.getBudgetSummary({
        budgetId: budget.id,
      });
      setSummary(budgetSummary);
    } catch (error) {
      console.error("Error loading budget summary:", error);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [budget.id]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTransaction.categoryId || newTransaction.amount <= 0) return;

    try {
      const result = await container.addTransactionUseCase.execute({
        budgetId: budget.id,
        type: newTransaction.type,
        amount: newTransaction.amount,
        description: newTransaction.description,
        categoryId: newTransaction.categoryId,
        date: new Date(newTransaction.date),
      });

      if (result.success) {
        setNewTransaction({
          type: "expense",
          amount: 0,
          description: "",
          categoryId: "",
          date: new Date().toISOString().split("T")[0],
        });

        setShowAddTransaction(false);
        onBudgetUpdated();
        loadSummary();

        if (result.warnings && result.warnings.length > 0) {
          alert("Advertencias:\n" + result.warnings.join("\n"));
        }
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error inesperado al agregar la transacción");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategory.name.trim() || newCategory.budgetAmount <= 0) return;

    try {
      const category: Category = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        color: newCategory.color,
        icon: newCategory.icon,
        budgetAmount: newCategory.budgetAmount,
        type: newCategory.type,
      };

      const updatedCategories = [...budget.categories, category];

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { categories: updatedCategories },
      });

      setNewCategory({
        name: "",
        description: "",
        budgetAmount: 0,
        color: "#6B7280",
        icon: "DollarSign" as IconName,
        type: "expense" as "income" | "expense",
      });

      setShowAddCategory(false);
      onBudgetUpdated();
      loadSummary();
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Error inesperado al agregar la categoría");
    }
  };

  const handleEditSuccess = () => {
    onBudgetUpdated();
    loadSummary();
  };

  const handleCompleteIncome = async (categoryId: string) => {
    const category = budget.categories.find((c) => c.id === categoryId);
    if (!category) return;

    const amount = prompt(
      `Ingresa el monto presupuestado para ${category.name}:`
    );
    if (!amount || isNaN(Number(amount))) return;

    try {
      const updatedCategories = budget.categories.map((c) =>
        c.id === categoryId ? { ...c, budgetAmount: Number(amount) } : c
      );

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { categories: updatedCategories },
      });

      onBudgetUpdated();
      loadSummary();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Error al actualizar la categoría");
    }
  };

  const handleCompleteIncomePayment = async (categoryId: string) => {
    const category = budget.categories.find((c) => c.id === categoryId);
    if (!category || category.budgetAmount === 0) return;

    // Verificar si ya existe un ingreso completo para esta categoría
    const existingCompleteIncome = budget.transactions.find(
      (t) =>
        t.categoryId === categoryId &&
        t.type === "income" &&
        t.amount === category.budgetAmount &&
        t.description.includes("Ingreso completo")
    );

    if (existingCompleteIncome) {
      alert("Ya se registró el ingreso completo para esta categoría");
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
        onBudgetUpdated();
        loadSummary();

        // Mostrar mensaje de éxito
        alert("¡Ingreso registrado exitosamente!");

        if (result.warnings && result.warnings.length > 0) {
          alert("Advertencias:\n" + result.warnings.join("\n"));
        }
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error completing income payment:", error);
      alert("Error inesperado al completar el ingreso");
    }
  };

  const handleRemoveCompleteIncome = async (categoryId: string) => {
    const category = budget.categories.find((c) => c.id === categoryId);
    if (!category) return;

    // Encontrar la transacción de ingreso completo
    const completeIncomeTransaction = budget.transactions.find(
      (t) =>
        t.categoryId === categoryId &&
        t.type === "income" &&
        t.amount === category.budgetAmount &&
        t.description.includes("Ingreso completo")
    );

    if (!completeIncomeTransaction) {
      alert("No se encontró el ingreso completo para eliminar");
      return;
    }

    const confirmDelete = confirm(
      `¿Estás seguro de quitar el ingreso completo de ${category.name}?`
    );

    if (!confirmDelete) return;

    try {
      // Eliminar la transacción del presupuesto
      const updatedTransactions = budget.transactions.filter(
        (t) => t.id !== completeIncomeTransaction.id
      );

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { transactions: updatedTransactions },
      });

      onBudgetUpdated();
      loadSummary();

      alert("Ingreso completo eliminado exitosamente");
    } catch (error) {
      console.error("Error removing complete income:", error);
      alert("Error inesperado al eliminar el ingreso");
    }
  };

  const handleDeleteBudget = async () => {
    setIsDeleting(true);

    try {
      const result = await container.deleteBudgetUseCase.execute({
        budgetId: budget.id,
      });

      if (result.success) {
        setShowDeleteConfirm(false);
        onBudgetDeleted?.();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Error inesperado al eliminar el presupuesto");
    } finally {
      setIsDeleting(false);
    }
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Cargando resumen...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{budget.name}</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {monthNames[budget.month - 1]} {budget.year}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <Button variant="outline" onClick={() => setShowAddCategory(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Agregar Categoría
          </Button>
          <Button variant="outline" onClick={() => setShowEditBudget(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Presupuesto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingreso Planificado
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency({ amount: summary.totalIncome })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Real</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency({ amount: summary.actualIncome })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency({ amount: summary.totalExpenses })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency({ amount: summary.balance })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">
            Categorías de Ingresos
          </CardTitle>
          <CardDescription>Gestión de fuentes de ingreso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budget.categories
              .filter((cat) => isIncomeCategory(cat))
              .map((category) => {
                const categoryData = summary?.categoryBreakdown[category.id];
                const progress =
                  category.budgetAmount > 0
                    ? ((categoryData?.spent || 0) / category.budgetAmount) * 100
                    : 0;

                const IconComponent =
                  ICON_COMPONENTS[
                    category.icon as keyof typeof ICON_COMPONENTS
                  ] || DollarSign;

                return (
                  <div
                    key={category.id}
                    className="space-y-3 p-4 border-2 border-green-200 rounded-lg bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <div className="flex items-center gap-2">
                            {category.budgetAmount === 0 ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCompleteIncome(category.id)
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Configurar
                              </Button>
                            ) : (
                              <>
                                <span className="text-sm text-gray-600">
                                  {formatCurrency({
                                    amount: categoryData?.spent || 0,
                                  })}{" "}
                                  /{" "}
                                  {formatCurrency({
                                    amount: category.budgetAmount,
                                  })}
                                </span>
                                {(() => {
                                  // Verificar si existe un ingreso completo registrado
                                  const hasCompleteIncome =
                                    budget.transactions.some(
                                      (t) =>
                                        t.categoryId === category.id &&
                                        t.type === "income" &&
                                        t.amount === category.budgetAmount &&
                                        t.description.includes(
                                          "Ingreso completo"
                                        )
                                    );

                                  if (hasCompleteIncome) {
                                    return (
                                      <div className="flex items-center gap-2 ml-2">
                                        <span className="text-green-600 font-medium animate-in fade-in-0 duration-500">
                                          ✓ Ingreso Completo
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleRemoveCompleteIncome(
                                              category.id
                                            )
                                          }
                                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
                                        >
                                          Quitar
                                        </Button>
                                      </div>
                                    );
                                  } else if (
                                    (categoryData?.spent || 0) <
                                    category.budgetAmount
                                  ) {
                                    return (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleCompleteIncomePayment(
                                            category.id
                                          )
                                        }
                                        className="bg-green-600 hover:bg-green-700 ml-2 animate-pulse transition-all duration-300 hover:scale-105"
                                        data-category-id={category.id}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Completar Ingreso
                                      </Button>
                                    );
                                  } else {
                                    return (
                                      <span className="text-green-600 font-medium ml-2 animate-in fade-in-0 duration-500">
                                        ✓ Ingreso Completo
                                      </span>
                                    );
                                  }
                                })()}
                              </>
                            )}
                          </div>
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-600">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {category.budgetAmount > 0 &&
                      (() => {
                        // Verificar si hay un ingreso completo registrado
                        const hasCompleteIncome = budget.transactions.some(
                          (t) =>
                            t.categoryId === category.id &&
                            t.type === "income" &&
                            t.amount === category.budgetAmount &&
                            t.description.includes("Ingreso completo")
                        );

                        const pendingAmount = hasCompleteIncome
                          ? 0
                          : category.budgetAmount - (categoryData?.spent || 0);
                        const actualProgress = hasCompleteIncome
                          ? 100
                          : progress;

                        return (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500 transition-all"
                                style={{
                                  width: `${Math.min(actualProgress, 100)}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{actualProgress.toFixed(1)}% recibido</span>
                              <span
                                className={
                                  hasCompleteIncome
                                    ? "text-green-600 font-medium"
                                    : "text-green-600"
                                }
                              >
                                {hasCompleteIncome ? (
                                  "✓ Completado"
                                ) : (
                                  <>
                                    {formatCurrency({
                                      amount: Math.max(pendingAmount, 0),
                                    })}{" "}
                                    pendiente
                                  </>
                                )}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Categorías de Gastos</CardTitle>
          <CardDescription>Seguimiento de gastos por categoría</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budget.categories
              .filter((cat) => !isIncomeCategory(cat))
              .map((category) => {
                const categoryData = summary?.categoryBreakdown[category.id];
                const progress =
                  category.budgetAmount > 0
                    ? ((categoryData?.spent || 0) / category.budgetAmount) * 100
                    : 0;

                const IconComponent =
                  ICON_COMPONENTS[
                    category.icon as keyof typeof ICON_COMPONENTS
                  ] || DollarSign;

                return (
                  <div
                    key={category.id}
                    className="space-y-3 p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-gray-600">
                            {formatCurrency({
                              amount: categoryData?.spent || 0,
                            })}{" "}
                            /{" "}
                            {formatCurrency({ amount: category.budgetAmount })}
                          </span>
                        </div>
                        {category.description && (
                          <div className="text-sm text-gray-600">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress > 100
                            ? "bg-red-500"
                            : progress > 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{progress.toFixed(1)}% usado</span>
                      <span
                        className={
                          (categoryData?.remaining || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {formatCurrency({
                          amount:
                            categoryData?.remaining || category.budgetAmount,
                        })}{" "}
                        restante
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {budget.transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay transacciones registradas
            </p>
          ) : (
            <div className="space-y-2">
              {budget.transactions
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .slice(0, 10)
                .map((transaction) => {
                  const category = budget.categories.find(
                    (c) => c.id === transaction.categoryId
                  );
                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          {category?.name} •{" "}
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency({ amount: transaction.amount })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Modal */}
      <EditBudgetModal
        budget={budget}
        isOpen={showEditBudget}
        onClose={() => setShowEditBudget(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                ¿Estás seguro de que quieres eliminar el presupuesto{" "}
                <strong>&ldquo;{budget.name}&rdquo;</strong>?
              </p>
              <p className="text-sm text-gray-600">
                Esta acción no se puede deshacer. Se eliminarán todas las
                transacciones y datos asociados.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBudget}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Agregar Transacción</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        newTransaction.type === "expense"
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        setNewTransaction({
                          ...newTransaction,
                          type: "expense",
                        })
                      }
                      className="flex-1"
                    >
                      Gasto
                    </Button>
                    <Button
                      type="button"
                      variant={
                        newTransaction.type === "income" ? "default" : "outline"
                      }
                      onClick={() =>
                        setNewTransaction({ ...newTransaction, type: "income" })
                      }
                      className="flex-1"
                    >
                      Ingreso
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto</Label>
                  <CurrencyInput
                    id="amount"
                    value={newTransaction.amount}
                    onChange={(value) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: value,
                      })
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    value={newTransaction.description}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ej: Compra supermercado"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newTransaction.categoryId}
                    onValueChange={(value) =>
                      setNewTransaction({
                        ...newTransaction,
                        categoryId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {budget.categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddTransaction(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Agregar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Agregar Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nombre</Label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        name: e.target.value,
                      })
                    }
                    placeholder="Ej: Educación"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-description">Descripción</Label>
                  <Input
                    id="category-description"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ej: Cursos, libros, materiales"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        newCategory.type === "expense" ? "default" : "outline"
                      }
                      onClick={() =>
                        setNewCategory({
                          ...newCategory,
                          type: "expense",
                        })
                      }
                      className="flex-1"
                    >
                      Gasto
                    </Button>
                    <Button
                      type="button"
                      variant={
                        newCategory.type === "income" ? "default" : "outline"
                      }
                      onClick={() =>
                        setNewCategory({
                          ...newCategory,
                          type: "income",
                        })
                      }
                      className="flex-1"
                    >
                      Ingreso
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="category-budget">Presupuesto</Label>
                  <CurrencyInput
                    id="category-budget"
                    value={newCategory.budgetAmount}
                    onChange={(value) =>
                      setNewCategory({
                        ...newCategory,
                        budgetAmount: value,
                      })
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-color">Color</Label>
                  <input
                    id="category-color"
                    type="color"
                    value={newCategory.color}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        color: e.target.value,
                      })
                    }
                    className="w-full h-10 rounded border"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCategory(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Agregar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Add Transaction Button */}
      <Button
        onClick={() => setShowAddTransaction(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
        size="lg"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}
