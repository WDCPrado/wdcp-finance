"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ICON_COMPONENTS } from "@/components/ui/icon-selector";

import {
  BudgetSummary,
  MonthlyBudget,
  Category,
  RecurrentTransaction,
} from "@/src/types/budget";
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
  CheckCircle,
  Repeat,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCurrency } from "@/src/hooks/useCurrency";
import EditBudgetModal from "./edit-budget-modal";
import {
  formatDate,
  formatDateForInput,
  createDateFromInput,
} from "@/src/utils/date";
import { toast } from "sonner";
import RecurrentTransactionModal from "./recurrent-transaction-modal";
import RecurrentTransactionsList from "./recurrent-transactions-list";
import DeleteBudgetDialog from "./delete-budget-dialog";
import AddTransactionDialog from "./add-transaction-dialog";
import AddCategoryDialog from "./add-category-dialog";
import EditTransactionDialog from "./edit-transaction-dialog";
import DeleteTransactionDialog from "./delete-transaction-dialog";
import ExpenseTransactionDialog from "./expense-transaction-dialog";
import CategoryTransactionsDialog from "./category-transactions-dialog";

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

  const [showExpenseTransaction, setShowExpenseTransaction] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] =
    useState<string>("");

  const [showCategoryTransactions, setShowCategoryTransactions] =
    useState(false);
  const [selectedTransactionCategory, setSelectedTransactionCategory] =
    useState<string>("");
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    amount: number;
    description: string;
    date: string | Date;
    categoryId: string;
    type: "income" | "expense";
  } | null>(null);

  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
    useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string>("");

  // Estados para transacciones recurrentes
  const [showRecurrentModal, setShowRecurrentModal] = useState(false);
  const [showRecurrentList, setShowRecurrentList] = useState(false);
  const [editingRecurrentTransaction, setEditingRecurrentTransaction] =
    useState<RecurrentTransaction | null>(null);

  // Estado para mostrar todas las transacciones
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const { formatCurrency } = useCurrency();

  const loadSummary = async () => {
    try {
      const response = await fetch(`/api/budget/summary?budgetId=${budget.id}`);
      const result = await response.json();

      if (response.ok && result.summary) {
        setSummary(result.summary);
      }
    } catch (error) {
      console.error("Error loading budget summary:", error);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [budget.id]);

  const handleAddTransaction = async (transaction: {
    type: "income" | "expense";
    amount: number;
    description: string;
    categoryId: string;
    date: string;
  }) => {
    try {
      const response = await fetch("/api/budget/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          transaction: {
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            categoryId: transaction.categoryId,
            date: createDateFromInput(transaction.date),
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowAddTransaction(false);
        onBudgetUpdated();
        loadSummary();
        toast.success("Transacción agregada exitosamente");

        if (result.warnings && result.warnings.length > 0) {
          toast.warning("Advertencias", {
            description: result.warnings.join("\n"),
          });
        }
      } else {
        toast.error("Error al agregar transacción", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Error inesperado", {
        description: "Error al agregar la transacción",
      });
    }
  };

  const handleAddCategory = async (categoryData: {
    name: string;
    description: string;
    budgetAmount: number;
    color: string;
    icon: IconName;
    type: "income" | "expense";
  }) => {
    try {
      const category: Omit<Category, "userId"> = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: categoryData.name.trim(),
        description: categoryData.description.trim(),
        color: categoryData.color,
        icon: categoryData.icon,
        budgetAmount: categoryData.budgetAmount,
        type: categoryData.type,
      };

      const updatedCategories = [...budget.categories, category as Category];

      const response = await fetch("/api/budget/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          categories: updatedCategories,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowAddCategory(false);
        onBudgetUpdated();
        loadSummary();
        toast.success("Categoría agregada exitosamente");
      } else {
        toast.error("Error al agregar categoría", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Error inesperado", {
        description: "Error al agregar la categoría",
      });
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

      await fetch("/api/budget/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          categories: updatedCategories,
        }),
      });

      onBudgetUpdated();
      loadSummary();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Error al actualizar la categoría");
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
      toast.info("Ingreso ya registrado", {
        description: "Ya se registró el ingreso completo para esta categoría",
      });
      return;
    }

    try {
      // Crear transacción de ingreso por el monto completo de la categoría
      await fetch("/api/budget/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          transaction: {
            type: "income",
            amount: category.budgetAmount,
            description: `Ingreso completo - ${category.name}`,
            categoryId: categoryId,
            date: new Date().toISOString(),
          },
        }),
      });

      onBudgetUpdated();
      loadSummary();

      // Mostrar mensaje de éxito
      toast.success("¡Ingreso registrado exitosamente!");
    } catch (error) {
      console.error("Error completing income payment:", error);
      toast.error("Error inesperado", {
        description: "Error al completar el ingreso",
      });
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
      toast.error("No se encontró el ingreso completo para eliminar");
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

      await fetch("/api/budget/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          transactions: updatedTransactions,
        }),
      });

      onBudgetUpdated();
      loadSummary();

      toast.success("Ingreso completo eliminado exitosamente");
    } catch (error) {
      console.error("Error removing complete income:", error);
      toast.error("Error inesperado", {
        description: "Error al eliminar el ingreso",
      });
    }
  };

  const handleOpenExpenseTransaction = (categoryId: string) => {
    setSelectedExpenseCategory(categoryId);
    setShowExpenseTransaction(true);
  };

  const handleExpenseTransactionSubmit = async (data: {
    amount: number;
    description: string;
    isComplete: boolean;
  }) => {
    try {
      const response = await fetch("/api/budget/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          transaction: {
            type: "expense",
            amount: data.amount,
            description: data.description.trim(),
            categoryId: selectedExpenseCategory,
            date: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onBudgetUpdated();
        loadSummary();
        setShowExpenseTransaction(false);
        setSelectedExpenseCategory("");

        toast.success("¡Gasto registrado exitosamente!");

        if (result.warnings && result.warnings.length > 0) {
          toast.warning("Advertencias", {
            description: result.warnings.join("\n"),
          });
        }
      } else {
        toast.error("Error al registrar gasto", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error adding expense transaction:", error);
      toast.error("Error inesperado", {
        description: "Error al agregar el gasto",
      });
    }
  };

  const handleViewCategoryTransactions = (categoryId: string) => {
    setSelectedTransactionCategory(categoryId);
    setShowCategoryTransactions(true);
  };

  const handleEditTransaction = (transaction: {
    id: string;
    amount: number;
    description: string;
    date: string | Date;
    categoryId: string;
    type: "income" | "expense";
  }) => {
    const transactionWithStringDate = {
      ...transaction,
      date:
        typeof transaction.date === "string"
          ? transaction.date
          : formatDateForInput(transaction.date),
    };
    setEditingTransaction(transactionWithStringDate);
  };

  const handleUpdateTransaction = async (data: {
    amount: number;
    description: string;
    date: string;
  }) => {
    if (!editingTransaction) return;

    try {
      const response = await fetch("/api/budget/transaction", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          budgetId: budget.id,
          transactionId: editingTransaction.id,
          updates: {
            amount: data.amount,
            description: data.description.trim(),
            date: data.date,
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onBudgetUpdated();
        loadSummary();
        setEditingTransaction(null);
        toast.success("Transacción actualizada exitosamente");
      } else {
        toast.error("Error al actualizar transacción", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Error inesperado", {
        description: "Error al actualizar la transacción",
      });
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setShowDeleteTransactionDialog(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await fetch(
        `/api/budget/transaction?budgetId=${budget.id}&transactionId=${transactionToDelete}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setShowDeleteTransactionDialog(false);
        setTransactionToDelete("");
        onBudgetUpdated();
        loadSummary();
        toast.success("Transacción eliminada exitosamente");
      } else {
        toast.error("Error al eliminar transacción", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Error inesperado", {
        description: "Error al eliminar la transacción",
      });
    }
  };

  const handleDeleteBudget = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/budget/delete?budgetId=${budget.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setShowDeleteConfirm(false);
        onBudgetDeleted?.();
        toast.success("Presupuesto eliminado exitosamente");
      } else {
        toast.error("Error al eliminar presupuesto", {
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Error inesperado", {
        description: "Error al eliminar el presupuesto",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Funciones para transacciones recurrentes
  const handleOpenRecurrentModal = () => {
    setEditingRecurrentTransaction(null);
    setShowRecurrentModal(true);
  };

  const handleEditRecurrentTransaction = (
    transaction: RecurrentTransaction
  ) => {
    setEditingRecurrentTransaction(transaction);
    setShowRecurrentModal(true);
    setShowRecurrentList(false);
  };

  const handleRecurrentSuccess = () => {
    setShowRecurrentModal(false);
    setEditingRecurrentTransaction(null);
    // Recargar datos del dashboard
    onBudgetUpdated();
    loadSummary();
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
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
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
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                summary.balance >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
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
          <CardTitle className="text-green-600 dark:text-green-400">
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
                    className="space-y-3 p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/30"
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
                                    ? "text-green-600 dark:text-green-400 font-medium"
                                    : "text-green-600 dark:text-green-400"
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {formatCurrency({
                                amount: categoryData?.spent || 0,
                              })}{" "}
                              /{" "}
                              {formatCurrency({
                                amount: category.budgetAmount,
                              })}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewCategoryTransactions(category.id)
                                }
                                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                              {category.budgetAmount > 0 &&
                                (categoryData?.remaining ||
                                  category.budgetAmount) > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleOpenExpenseTransaction(category.id)
                                    }
                                    className="bg-orange-600 hover:bg-orange-700 transition-all duration-300 hover:scale-105"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Registrar
                                  </Button>
                                )}
                            </div>
                          </div>
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
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {(() => {
                          const remaining =
                            categoryData?.remaining ?? category.budgetAmount;
                          const absoluteAmount = Math.abs(remaining);

                          if (remaining > 0) {
                            return `${formatCurrency({
                              amount: absoluteAmount,
                            })} restante`;
                          } else if (remaining < 0) {
                            return `${formatCurrency({
                              amount: absoluteAmount,
                            })} sobrepasado`;
                          } else {
                            return "Completado";
                          }
                        })()}
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
          <div className="flex items-center justify-between">
            <CardTitle>Transacciones Recientes</CardTitle>
            {budget.transactions.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="flex items-center gap-2"
              >
                {showAllTransactions ? "Ver menos" : "Ver todas"}
                {showAllTransactions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
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
                .slice(0, showAllTransactions ? undefined : 5)
                .map((transaction) => {
                  const category = budget.categories.find(
                    (c) => c.id === transaction.categoryId
                  );
                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {transaction.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {category?.name} • {formatDate(transaction.date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`font-semibold ${
                            transaction.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency({ amount: transaction.amount })}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTransaction(transaction)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                            title="Editar transacción"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDeleteTransaction(transaction.id)
                            }
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Eliminar transacción"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Mostrar contador de transacciones */}
              {budget.transactions.length > 0 && (
                <div className="flex justify-between items-center pt-3 border-t text-sm text-muted-foreground">
                  <span>
                    {showAllTransactions
                      ? `Mostrando todas las ${budget.transactions.length} transacciones`
                      : `Mostrando ${Math.min(
                          5,
                          budget.transactions.length
                        )} de ${budget.transactions.length} transacciones`}
                  </span>
                  {!showAllTransactions && budget.transactions.length > 5 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowAllTransactions(true)}
                      className="p-0 h-auto text-primary"
                    >
                      Ver {budget.transactions.length - 5} más
                    </Button>
                  )}
                </div>
              )}
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

      {/* Delete Budget Dialog */}
      <DeleteBudgetDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteBudget}
        budgetName={budget.name}
        isDeleting={isDeleting}
      />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onSubmit={handleAddTransaction}
        budget={budget}
      />

      {/* Add Category Dialog */}
      <AddCategoryDialog
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSubmit={handleAddCategory}
      />

      {/* Expense Transaction Dialog */}
      <ExpenseTransactionDialog
        isOpen={showExpenseTransaction && !!selectedExpenseCategory}
        onClose={() => {
          setShowExpenseTransaction(false);
          setSelectedExpenseCategory("");
        }}
        onSubmit={handleExpenseTransactionSubmit}
        categoryName={
          budget.categories.find((c) => c.id === selectedExpenseCategory)
            ?.name || ""
        }
        categoryBudgetAmount={
          budget.categories.find((c) => c.id === selectedExpenseCategory)
            ?.budgetAmount || 0
        }
      />

      {/* Category Transactions Dialog */}
      <CategoryTransactionsDialog
        isOpen={showCategoryTransactions && !!selectedTransactionCategory}
        onClose={() => {
          setShowCategoryTransactions(false);
          setSelectedTransactionCategory("");
        }}
        categoryName={
          budget.categories.find((c) => c.id === selectedTransactionCategory)
            ?.name || ""
        }
        transactions={budget.transactions.filter(
          (t) => t.categoryId === selectedTransactionCategory
        )}
        onEditTransaction={handleEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {/* Edit Transaction Dialog */}
      <EditTransactionDialog
        isOpen={!!editingTransaction}
        onClose={() => {
          setEditingTransaction(null);
        }}
        onSubmit={handleUpdateTransaction}
        transaction={editingTransaction}
      />

      {/* Delete Transaction Confirmation Dialog */}
      <DeleteTransactionDialog
        isOpen={showDeleteTransactionDialog}
        onClose={() => {
          setShowDeleteTransactionDialog(false);
          setTransactionToDelete("");
        }}
        onConfirm={confirmDeleteTransaction}
      />

      {/* Floating Buttons Group */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Recurrent Transactions List Button */}
        <Button
          onClick={() => setShowRecurrentList(true)}
          className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          size="lg"
          title="Ver transacciones recurrentes"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        {/* Add Recurrent Transaction Button */}
        <Button
          onClick={handleOpenRecurrentModal}
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          size="lg"
          title="Crear transacción recurrente"
        >
          <Repeat className="h-5 w-5" />
        </Button>

        {/* Add Regular Transaction Button */}
        <Button
          onClick={() => setShowAddTransaction(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          size="lg"
          title="Agregar transacción"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Recurrent Transaction Modal */}
      <RecurrentTransactionModal
        isOpen={showRecurrentModal}
        onClose={() => setShowRecurrentModal(false)}
        budget={budget}
        editingTransaction={editingRecurrentTransaction}
        onSuccess={handleRecurrentSuccess}
      />

      {/* Recurrent Transactions List */}
      <RecurrentTransactionsList
        isOpen={showRecurrentList}
        onClose={() => setShowRecurrentList(false)}
        onEditTransaction={handleEditRecurrentTransaction}
        currentMonth={budget.month}
        currentYear={budget.year}
        onTransactionChange={() => {
          onBudgetUpdated();
          loadSummary();
        }}
      />
    </div>
  );
}
