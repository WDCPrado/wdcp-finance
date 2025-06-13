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
import { getRecurrenceStatus } from "@/src/utils/recurrence";
import { RECURRENCE_INTERVALS } from "@/src/types/recurrence";
import { useCurrency } from "@/src/hooks/useCurrency";
import { formatDate } from "@/src/utils/date";
import { toast } from "sonner";
import {
  Repeat,
  Play,
  Pause,
  Edit,
  Trash2,
  X,
  Clock,
  Calendar,
} from "lucide-react";

interface RecurrentTransactionsListProps {
  isOpen: boolean;
  onClose: () => void;
  onEditTransaction: (transaction: RecurrentTransaction) => void;
}

export default function RecurrentTransactionsList({
  isOpen,
  onClose,
  onEditTransaction,
}: RecurrentTransactionsListProps) {
  const {
    getAllRecurrentTransactions,
    deleteRecurrentTransaction,
    pauseRecurrentTransaction,
    resumeRecurrentTransaction,
    processRecurrentTransactions,
    loading,
    error,
  } = useRecurrentTransactions();

  const { formatCurrency } = useCurrency();

  const [transactions, setTransactions] = useState<RecurrentTransaction[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

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

  const handleTogglePause = async (transaction: RecurrentTransaction) => {
    try {
      if (transaction.isActive) {
        const result = await pauseRecurrentTransaction(transaction.id);
        if (result.success) {
          toast.success("Transacción pausada correctamente");
          loadTransactions();
        } else {
          toast.error("Error al pausar transacción");
        }
      } else {
        const result = await resumeRecurrentTransaction(transaction.id);
        if (result.success) {
          toast.success("Transacción reanudada correctamente");
          loadTransactions();
        } else {
          toast.error("Error al reanudar transacción");
        }
      }
    } catch (err) {
      console.error("Error toggling transaction:", err);
      toast.error("Error inesperado");
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
        toast.success(
          `Transacción eliminada. ${result.deletedTransactionsCount} transacciones futuras también eliminadas.`
        );
        loadTransactions();
      } else {
        toast.error("Error al eliminar transacción");
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      toast.error("Error inesperado");
    }
  };

  const handleProcessNow = async () => {
    try {
      const result = await processRecurrentTransactions();
      if (result.success) {
        toast.success(`Procesamiento completado:
          - ${result.transactionsCreated} transacciones creadas
          - ${result.budgetsCreated} presupuestos creados
          - ${result.budgetsUpdated} presupuestos actualizados`);

        if (result.warnings && result.warnings.length > 0) {
          toast.warning("Advertencias", {
            description: result.warnings.join("\n"),
          });
        }
      } else {
        toast.error("Error en procesamiento", {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Repeat className="h-5 w-5" />
              Transacciones Recurrentes
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleProcessNow}
                disabled={loading || isLoadingList}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Clock className="h-4 w-4 mr-1" />
                Procesar Ahora
              </Button>
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
          <CardDescription>
            Gestiona tus transacciones que se repiten automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">
                Cargando transacciones...
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No hay transacciones recurrentes
              </h3>
              <p className="text-sm text-muted-foreground">
                Crea tu primera transacción recurrente usando el botón flotante
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const status = getRecurrenceStatus({
                  isActive: transaction.isActive,
                  nextExecutionDate: transaction.nextExecutionDate,
                  endDate: transaction.endDate,
                });

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
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {transaction.type === "income"
                                ? "Ingreso"
                                : "Gasto"}
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

                            <div>
                              <span className="text-muted-foreground">
                                Estado:
                              </span>
                              <div
                                className={`font-medium ${
                                  status.status === "active"
                                    ? "text-green-600"
                                    : status.status === "paused"
                                    ? "text-yellow-600"
                                    : status.status === "completed"
                                    ? "text-gray-600"
                                    : "text-blue-600"
                                }`}
                              >
                                {status.description}
                              </div>
                            </div>
                          </div>

                          {transaction.endDate && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Finaliza el {formatDate(transaction.endDate)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTogglePause(transaction)}
                            className={`${
                              transaction.isActive
                                ? "border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                                : "border-green-500 text-green-600 hover:bg-green-50"
                            }`}
                            disabled={loading}
                          >
                            {transaction.isActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditTransaction(transaction)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(transaction)}
                            className="border-red-500 text-red-600 hover:bg-red-50"
                            disabled={loading}
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
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
