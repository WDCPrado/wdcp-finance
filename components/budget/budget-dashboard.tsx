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
  AlertTriangle,
  CheckCircle,
  Repeat,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { container } from "@/src/di/container";
import { useCurrency } from "@/src/hooks/useCurrency";
import EditBudgetModal from "./edit-budget-modal";
import { formatDate, formatDateForInput } from "@/src/utils/date";
import { toast } from "sonner";
import RecurrentTransactionModal from "./recurrent-transaction-modal";
import RecurrentTransactionsList from "./recurrent-transactions-list";

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
    date: formatDateForInput(new Date()),
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    budgetAmount: 0,
    color: "#6B7280",
    icon: "DollarSign" as IconName,
    type: "expense" as "income" | "expense",
  });
  const [showExpenseTransaction, setShowExpenseTransaction] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] =
    useState<string>("");
  const [expenseTransaction, setExpenseTransaction] = useState({
    amount: 0,
    description: "",
    isComplete: false,
  });
  const [showCategoryTransactions, setShowCategoryTransactions] =
    useState(false);
  const [selectedTransactionCategory, setSelectedTransactionCategory] =
    useState<string>("");
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    amount: number;
    description: string;
    date: string;
    categoryId: string;
    type: "income" | "expense";
  } | null>(null);
  const [editTransactionData, setEditTransactionData] = useState({
    amount: 0,
    description: "",
    date: "",
  });
  const [showDeleteTransactionDialog, setShowDeleteTransactionDialog] =
    useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string>("");

  // Estados para transacciones recurrentes
  const [showRecurrentModal, setShowRecurrentModal] = useState(false);
  const [showRecurrentList, setShowRecurrentList] = useState(false);
  const [editingRecurrentTransaction, setEditingRecurrentTransaction] =
    useState<RecurrentTransaction | null>(null);

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
          date: formatDateForInput(new Date()),
        });

        setShowAddTransaction(false);
        onBudgetUpdated();
        loadSummary();

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

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { categories: updatedCategories },
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
        toast.success("¡Ingreso registrado exitosamente!");

        if (result.warnings && result.warnings.length > 0) {
          toast.warning("Advertencias", {
            description: result.warnings.join("\n"),
          });
        }
      } else {
        toast.error("Error al registrar ingreso", {
          description: result.error,
        });
      }
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

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { transactions: updatedTransactions },
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
    const category = budget.categories.find((c) => c.id === categoryId);
    if (!category) return;

    setSelectedExpenseCategory(categoryId);
    setExpenseTransaction({
      amount: category.budgetAmount,
      description: "",
      isComplete: true,
    });
    setShowExpenseTransaction(true);
  };

  const handleExpenseTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const category = budget.categories.find(
      (c) => c.id === selectedExpenseCategory
    );
    if (!category) return;

    if (expenseTransaction.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (!expenseTransaction.description.trim()) {
      toast.error("Debe agregar una descripción");
      return;
    }

    try {
      const result = await container.addTransactionUseCase.execute({
        budgetId: budget.id,
        type: "expense",
        amount: expenseTransaction.amount,
        description: expenseTransaction.description.trim(),
        categoryId: selectedExpenseCategory,
        date: new Date(),
      });

      if (result.success) {
        onBudgetUpdated();
        loadSummary();
        setShowExpenseTransaction(false);
        setExpenseTransaction({
          amount: 0,
          description: "",
          isComplete: false,
        });
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
          : transaction.date.toISOString(),
    };
    setEditingTransaction(transactionWithStringDate);
    setEditTransactionData({
      amount: transaction.amount,
      description: transaction.description,
      date: formatDateForInput(transaction.date),
    });
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    if (editTransactionData.amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    if (!editTransactionData.description.trim()) {
      toast.error("Debe agregar una descripción");
      return;
    }

    try {
      const updatedTransactions = budget.transactions.map((t) =>
        t.id === editingTransaction.id
          ? {
              ...t,
              amount: editTransactionData.amount,
              description: editTransactionData.description.trim(),
              date: new Date(editTransactionData.date),
            }
          : t
      );

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { transactions: updatedTransactions },
      });

      onBudgetUpdated();
      loadSummary();
      setEditingTransaction(null);
      toast.success("Transacción actualizada exitosamente");
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
      // Obtener información de la transacción antes de eliminarla
      const transactionInfo =
        await container.budgetRepository.getTransactionInfo({
          budgetId: budget.id,
          transactionId: transactionToDelete,
        });

      const updatedTransactions = budget.transactions.filter(
        (t) => t.id !== transactionToDelete
      );

      await container.budgetRepository.updateMonthlyBudget({
        id: budget.id,
        updates: { transactions: updatedTransactions },
      });

      // Si era una transacción recurrente, ofrecer regenerarla
      if (
        transactionInfo?.transaction.isRecurrent &&
        transactionInfo.transaction.recurrenceId
      ) {
        toast.success("Transacción eliminada", {
          description:
            "Era una transacción recurrente. Se puede regenerar automáticamente.",
          action: {
            label: "Regenerar",
            onClick: async () => {
              try {
                const result =
                  await container.processRecurrentTransactionsUseCase.regenerateDeletedTransaction(
                    {
                      recurrenceId: transactionInfo.transaction.recurrenceId!,
                      targetMonth: budget.month,
                      targetYear: budget.year,
                    }
                  );

                if (result.success) {
                  onBudgetUpdated();
                  loadSummary();
                  toast.success("Transacción regenerada exitosamente");
                } else {
                  toast.error("Error al regenerar", {
                    description: result.error,
                  });
                }
              } catch (error) {
                console.error("Error regenerating transaction:", error);
                toast.error("Error al regenerar la transacción");
              }
            },
          },
        });
      } else {
        toast.success("Transacción eliminada exitosamente");
      }

      onBudgetUpdated();
      loadSummary();
      setShowDeleteTransactionDialog(false);
      setTransactionToDelete("");
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
      const result = await container.deleteBudgetUseCase.execute({
        budgetId: budget.id,
      });

      if (result.success) {
        setShowDeleteConfirm(false);
        onBudgetDeleted?.();
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
                          {category?.name} • {formatDate(transaction.date)}
                        </div>
                      </div>
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md bg-background border border-border shadow-xl rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-foreground">Confirmar Eliminación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                ¿Estás seguro de que quieres eliminar el presupuesto{" "}
                <strong>&ldquo;{budget.name}&rdquo;</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer. Se eliminarán todas las
                transacciones y datos asociados.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBudget}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md">
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
                          categoryId: "", // Limpiar categoría al cambiar tipo
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
                        setNewTransaction({
                          ...newTransaction,
                          type: "income",
                          categoryId: "", // Limpiar categoría al cambiar tipo
                        })
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
                      {budget.categories
                        .filter((category) => {
                          if (newTransaction.type === "income") {
                            return isIncomeCategory(category);
                          } else {
                            return !isIncomeCategory(category);
                          }
                        })
                        .map((category) => (
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md">
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

      {/* Expense Transaction Modal */}
      {showExpenseTransaction && selectedExpenseCategory && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Plus className="h-5 w-5" />
                Registrar Gasto
              </CardTitle>
              <CardDescription>
                {
                  budget.categories.find(
                    (c) => c.id === selectedExpenseCategory
                  )?.name
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleExpenseTransactionSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Tipo de Gasto</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        expenseTransaction.isComplete ? "default" : "outline"
                      }
                      onClick={() => {
                        const category = budget.categories.find(
                          (c) => c.id === selectedExpenseCategory
                        );
                        setExpenseTransaction({
                          ...expenseTransaction,
                          isComplete: true,
                          amount: category?.budgetAmount || 0,
                        });
                      }}
                      className="flex-1"
                    >
                      Completo
                    </Button>
                    <Button
                      type="button"
                      variant={
                        !expenseTransaction.isComplete ? "default" : "outline"
                      }
                      onClick={() =>
                        setExpenseTransaction({
                          ...expenseTransaction,
                          isComplete: false,
                          amount: 0,
                        })
                      }
                      className="flex-1"
                    >
                      Parcial
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Monto</Label>
                  <CurrencyInput
                    id="expense-amount"
                    value={expenseTransaction.amount}
                    onChange={(value) =>
                      setExpenseTransaction({
                        ...expenseTransaction,
                        amount: value,
                      })
                    }
                    min="0"
                    step="0.01"
                    required
                    disabled={expenseTransaction.isComplete}
                  />
                  {expenseTransaction.isComplete && (
                    <p className="text-sm text-muted-foreground">
                      Monto completo de la categoría
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expense-description">
                    Descripción / Comentario
                  </Label>
                  <Input
                    id="expense-description"
                    value={expenseTransaction.description}
                    onChange={(e) =>
                      setExpenseTransaction({
                        ...expenseTransaction,
                        description: e.target.value,
                      })
                    }
                    placeholder="Ej: Compra en supermercado, pago de servicio..."
                    required
                  />
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    Resumen:
                  </div>
                  <div className="font-medium">
                    {expenseTransaction.isComplete
                      ? "Gasto Completo"
                      : "Gasto Parcial"}
                    : {formatCurrency({ amount: expenseTransaction.amount })}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowExpenseTransaction(false);
                      setSelectedExpenseCategory("");
                      setExpenseTransaction({
                        amount: 0,
                        description: "",
                        isComplete: false,
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/80"
                  >
                    Registrar Gasto
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Transactions Modal */}
      {showCategoryTransactions && selectedTransactionCategory && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Settings className="h-5 w-5" />
                Transacciones de{" "}
                {
                  budget.categories.find(
                    (c) => c.id === selectedTransactionCategory
                  )?.name
                }
              </CardTitle>
              <CardDescription>
                Ver, editar y eliminar transacciones de esta categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              {budget.transactions.filter(
                (t) => t.categoryId === selectedTransactionCategory
              ).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                  <p>No hay transacciones registradas para esta categoría</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {budget.transactions
                    .filter((t) => t.categoryId === selectedTransactionCategory)
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {transaction.description}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(transaction.date)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-destructive">
                            -{formatCurrency({ amount: transaction.amount })}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTransaction(transaction)}
                              className="border-primary text-primary hover:bg-primary/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDeleteTransaction(transaction.id)
                              }
                              className="border-destructive text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCategoryTransactions(false);
                    setSelectedTransactionCategory("");
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Edit className="h-5 w-5" />
                Editar Transacción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount">Monto</Label>
                  <CurrencyInput
                    id="edit-amount"
                    value={editTransactionData.amount}
                    onChange={(value) =>
                      setEditTransactionData({
                        ...editTransactionData,
                        amount: value,
                      })
                    }
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Input
                    id="edit-description"
                    value={editTransactionData.description}
                    onChange={(e) =>
                      setEditTransactionData({
                        ...editTransactionData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Descripción de la transacción"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-date">Fecha</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editTransactionData.date}
                    onChange={(e) =>
                      setEditTransactionData({
                        ...editTransactionData,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTransaction(null);
                      setEditTransactionData({
                        amount: 0,
                        description: "",
                        date: "",
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateTransaction}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Transaction Confirmation Dialog */}
      {showDeleteTransactionDialog && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xs sm:max-w-md bg-background border border-border shadow-xl rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-foreground">Confirmar Eliminación</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                ¿Estás seguro de que quieres eliminar esta transacción?
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteTransactionDialog(false);
                    setTransactionToDelete("");
                  }}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteTransaction}
                  className="w-full sm:w-auto"
                >
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
