"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRecurrentTransactions } from "@/src/hooks/useRecurrentTransactions";
import { RecurrentTransaction } from "@/src/types/budget";
import { RECURRENCE_INTERVALS } from "@/src/types/recurrence";
import { useCurrency } from "@/src/hooks/useCurrency";
import { formatDate } from "@/src/utils/date";
import { toast } from "sonner";
import {
  Repeat,
  Edit,
  Trash2,
  X,
  Clock,
  Calendar,
  PlayCircle,
  Info,
} from "lucide-react";

interface RecurrentTransactionsListProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTransaction: (transaction: RecurrentTransaction) => void;
  currentMonth?: number;
  currentYear?: number;
  onTransactionChange?: () => void;
}

export default function RecurrentTransactionsList({
  isOpen,
  onClose,
  onEditTransaction,
  currentMonth,
  currentYear,
  onTransactionChange,
}: RecurrentTransactionsListProps) {
  const {
    getAllRecurrentTransactions,
    deleteRecurrentTransaction,
    processRecurrentTransactions,
    processIndividualRecurrentTransaction,
    checkRecurrentTransactionExecution,
    unexecuteRecurrentTransaction,
    loading,
    error,
  } = useRecurrentTransactions();

  const { formatCurrency } = useCurrency();

  const [transactions, setTransactions] = useState<RecurrentTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    RecurrentTransaction[]
  >([]);
  const [executionStatus, setExecutionStatus] = useState<
    Record<
      string,
      { executed: boolean; transactionId?: string; budgetId?: string }
    >
  >({});
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [processingIndividual, setProcessingIndividual] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  useEffect(() => {
    // Filtrar transacciones para el mes actual
    if (currentMonth && currentYear) {
      const filtered = transactions.filter((transaction) => {
        return shouldExecuteInMonth(transaction, currentMonth, currentYear);
      });
      setFilteredTransactions(filtered);

      // Verificar estado de ejecución para cada transacción filtrada
      checkExecutionStatusForTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [transactions, currentMonth, currentYear]);

  const checkExecutionStatusForTransactions = async (
    transactionsToCheck: RecurrentTransaction[]
  ) => {
    if (!currentMonth || !currentYear) return;

    const statusMap: Record<
      string,
      { executed: boolean; transactionId?: string; budgetId?: string }
    > = {};

    for (const transaction of transactionsToCheck) {
      try {
        const status = await checkRecurrentTransactionExecution({
          recurrenceId: transaction.id,
          targetMonth: currentMonth,
          targetYear: currentYear,
        });
        statusMap[transaction.id] = status;
      } catch (error) {
        console.error(
          `Error checking execution status for ${transaction.id}:`,
          error
        );
        statusMap[transaction.id] = { executed: false };
      }
    }

    setExecutionStatus(statusMap);
  };

  // Función para determinar si una transacción debe ejecutarse en un mes específico
  const shouldExecuteInMonth = (
    transaction: RecurrentTransaction,
    targetMonth: number,
    targetYear: number
  ): boolean => {
    const startDate = new Date(transaction.startDate); // OK: Usando Date almacenado en DB
    const startMonth = startDate.getMonth() + 1; // 1-12
    const startYear = startDate.getFullYear();

    // Si la fecha de inicio es posterior al mes objetivo, no debe ejecutarse
    if (
      startYear > targetYear ||
      (startYear === targetYear && startMonth > targetMonth)
    ) {
      return false;
    }

    // Si hay fecha de fin y ya pasó, no debe ejecutarse
    if (transaction.endDate) {
      const endDate = new Date(transaction.endDate); // OK: Usando Date almacenado en DB
      const endMonth = endDate.getMonth() + 1;
      const endYear = endDate.getFullYear();
      if (
        endYear < targetYear ||
        (endYear === targetYear && endMonth < targetMonth)
      ) {
        return false;
      }
    }

    // Calcular la diferencia en meses desde el inicio hasta el mes objetivo
    const monthsDiff =
      (targetYear - startYear) * 12 + (targetMonth - startMonth);

    // Verificar si es un múltiplo del intervalo (debe ser >= 0 y múltiplo exacto)
    return monthsDiff >= 0 && monthsDiff % transaction.intervalValue === 0;
  };

  const loadTransactions = async () => {
    setIsLoadingList(true);
    try {
      const result = await getAllRecurrentTransactions();
      if (result.success) {
        setTransactions(result.recurrentTransactions);
      } else {
        toast.error("Error", {
          description:
            result.error || "Error al cargar transacciones recurrentes",
        });
      }
    } catch (err) {
      console.error("Error loading recurrent transactions:", err);
      toast.error("Error inesperado", {
        description: "Error al cargar transacciones recurrentes",
      });
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDelete = async (transaction: RecurrentTransaction) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la transacción recurrente "${transaction.description}"?`
      )
    ) {
      return;
    }

    try {
      const result = await deleteRecurrentTransaction({
        id: transaction.id,
        deleteFutureTransactions: true,
      });

      if (result.success) {
        toast.success(`🗑️ Plantilla "${transaction.description}" eliminada`, {
          description: `${result.deletedTransactionsCount} transacciones futuras también se eliminaron.`,
        });
        loadTransactions();
      } else {
        toast.error("Error al eliminar plantilla");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toast.error("Error inesperado");
    }
  };

  const handleProcessIndividual = async (transaction: RecurrentTransaction) => {
    if (!currentMonth || !currentYear) {
      toast.error("Error", {
        description: "No se puede determinar el mes actual",
      });
      return;
    }

    setProcessingIndividual(transaction.id);
    try {
      const result = await processIndividualRecurrentTransaction({
        recurrenceId: transaction.id,
        targetMonth: currentMonth,
        targetYear: currentYear,
      });

      if (result.success) {
        toast.success(
          `✅ Transacción creada desde plantilla "${transaction.description}"`,
          {
            description: `Se creó la transacción para ${currentMonth}/${currentYear} basada en la plantilla recurrente`,
          }
        );
        // Recargar para actualizar el estado
        loadTransactions();
        // Actualizar estado de ejecución
        checkExecutionStatusForTransactions(filteredTransactions);
        // Notificar cambio al dashboard
        onTransactionChange?.();
      } else {
        toast.error("Error al crear transacción desde plantilla", {
          description: result.error,
        });
      }
    } catch (err) {
      console.error("Error processing individual transaction:", err);
      toast.error("Error inesperado");
    } finally {
      setProcessingIndividual(null);
    }
  };

  const handleUnexecuteIndividual = async (
    transaction: RecurrentTransaction
  ) => {
    if (!currentMonth || !currentYear) {
      toast.error("Error", {
        description: "No se puede determinar el mes actual",
      });
      return;
    }

    setProcessingIndividual(transaction.id);
    try {
      const result = await unexecuteRecurrentTransaction({
        recurrenceId: transaction.id,
        targetMonth: currentMonth,
        targetYear: currentYear,
      });

      if (result.success) {
        toast.success(
          `🗑️ Transacción eliminada: "${transaction.description}"`,
          {
            description: `Se eliminó la transacción de ${currentMonth}/${currentYear}. La plantilla sigue activa.`,
          }
        );
        // Recargar para actualizar el estado
        loadTransactions();
        // Actualizar estado de ejecución
        checkExecutionStatusForTransactions(filteredTransactions);
        // Notificar cambio al dashboard
        onTransactionChange?.();
      } else {
        toast.error("Error al eliminar transacción", {
          description: result.error,
        });
      }
    } catch (err) {
      console.error("Error unexecuting individual transaction:", err);
      toast.error("Error inesperado");
    } finally {
      setProcessingIndividual(null);
    }
  };

  const handleProcessAll = async () => {
    if (!currentMonth || !currentYear) {
      toast.error("Error", {
        description: "No se puede determinar el mes actual",
      });
      return;
    }

    try {
      const result = await processRecurrentTransactions({
        targetMonth: currentMonth,
        targetYear: currentYear,
      });

      if (result.success) {
        const monthInfo = `${currentMonth}/${currentYear}`;
        toast.success(`🚀 Plantillas ejecutadas para ${monthInfo}`, {
          description: `${result.transactionsCreated} transacciones creadas desde plantillas, ${result.budgetsCreated} presupuestos creados, ${result.budgetsUpdated} presupuestos actualizados`,
        });

        if (result.warnings && result.warnings.length > 0) {
          toast.warning("Advertencias durante la ejecución", {
            description: result.warnings.join("\n"),
          });
        }

        // Recargar para actualizar el estado
        loadTransactions();
        // Notificar cambio al dashboard
        onTransactionChange?.();
      } else {
        toast.error("Error al ejecutar plantillas", {
          description: result.error,
        });
      }
    } catch (err) {
      console.error("Error processing recurrences:", err);
      toast.error("Error inesperado");
    }
  };

  const getIntervalLabel = (transaction: RecurrentTransaction) => {
    // Buscar en intervalos predefinidos
    const predefinedInterval = Object.values(RECURRENCE_INTERVALS).find(
      (interval) => interval.months === transaction.intervalValue
    );

    if (predefinedInterval) {
      return predefinedInterval.label;
    }

    // Intervalo personalizado
    return `Cada ${transaction.intervalValue} meses`;
  };

  const getMonthName = (month: number): string => {
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
    return monthNames[month - 1] || "Mes desconocido";
  };

  if (!isOpen) return null;

  const displayTransactions =
    currentMonth && currentYear ? filteredTransactions : transactions;
  const monthYearText =
    currentMonth && currentYear
      ? `${getMonthName(currentMonth)} ${currentYear}`
      : "Todas";

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Repeat className="h-5 w-5" />
              Plantillas de Transacciones Recurrentes - {monthYearText}
            </CardTitle>
            <div className="flex items-center gap-2">
              {currentMonth &&
                currentYear &&
                displayTransactions.length > 0 && (
                  <Button
                    onClick={handleProcessAll}
                    disabled={loading || isLoadingList}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                    title={`Ejecutar todas las plantillas para crear transacciones en ${currentMonth}/${currentYear}`}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Ejecutar Todas
                  </Button>
                )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  ¿Cómo funcionan las transacciones recurrentes?
                </p>
                <p className="text-muted-foreground mt-1">
                  Estas son <strong>plantillas</strong> que generan
                  transacciones reales cuando las ejecutas. Una plantilla puede
                  crear múltiples transacciones (1:N).
                  {currentMonth && currentYear
                    ? ` Aquí puedes ejecutar las plantillas que corresponden a ${getMonthName(
                        currentMonth
                      )} ${currentYear}.`
                    : " Crea plantillas que se ejecutarán automáticamente en sus fechas programadas."}
                </p>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">
                Cargando plantillas...
              </div>
            </div>
          ) : displayTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {currentMonth && currentYear
                  ? `No hay plantillas para ejecutar en ${getMonthName(
                      currentMonth
                    )} ${currentYear}`
                  : "No hay plantillas recurrentes"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentMonth && currentYear
                  ? "Las plantillas se ejecutan según su intervalo configurado"
                  : "Crea tu primera plantilla recurrente usando el botón flotante"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayTransactions.map((transaction) => {
                const isExecuted = executionStatus[transaction.id]?.executed;
                return (
                  <Card key={transaction.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">
                              {transaction.description}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                transaction.type === "income"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              }`}
                            >
                              {transaction.type === "income"
                                ? "Ingreso"
                                : "Gasto"}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              📋 Plantilla
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Monto:
                              </span>
                              <div className="font-medium">
                                {formatCurrency({ amount: transaction.amount })}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Intervalo:
                              </span>
                              <div className="font-medium">
                                {getIntervalLabel(transaction)}
                              </div>
                            </div>

                            <div>
                              <span className="text-muted-foreground">
                                Próxima ejecución:
                              </span>
                              <div className="font-medium">
                                {transaction.nextExecutionDate
                                  ? formatDate(transaction.nextExecutionDate)
                                  : "N/A"}
                              </div>
                            </div>

                            {currentMonth && currentYear && (
                              <div>
                                <span className="text-muted-foreground">
                                  Estado en {getMonthName(currentMonth)}{" "}
                                  {currentYear}:
                                </span>
                                <div
                                  className={`font-medium flex items-center gap-1 ${
                                    isExecuted
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {isExecuted ? (
                                    <>
                                      <span className="text-green-500">✓</span>
                                      Transacción creada
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-gray-400">○</span>
                                      Sin ejecutar
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {transaction.endDate && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Finaliza el {formatDate(transaction.endDate)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          {/* Botón para ejecutar/desejecutar transacción individual */}
                          {currentMonth &&
                            currentYear &&
                            transaction.isActive && (
                              <>
                                {isExecuted ? (
                                  // Botón para eliminar la transacción creada
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleUnexecuteIndividual(transaction)
                                    }
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                                    disabled={
                                      loading ||
                                      processingIndividual === transaction.id
                                    }
                                    title={`Eliminar transacción creada para ${currentMonth}/${currentYear}`}
                                  >
                                    {processingIndividual === transaction.id ? (
                                      <Clock className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  // Botón para crear transacción desde plantilla
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleProcessIndividual(transaction)
                                    }
                                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                    disabled={
                                      loading ||
                                      processingIndividual === transaction.id
                                    }
                                    title={`Crear transacción desde plantilla para ${currentMonth}/${currentYear}`}
                                  >
                                    {processingIndividual === transaction.id ? (
                                      <Clock className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <PlayCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                              </>
                            )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditTransaction(transaction)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title="Editar plantilla"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(transaction)}
                            className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={loading}
                            title="Eliminar plantilla (y todas las transacciones futuras)"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
