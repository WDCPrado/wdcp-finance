"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useRecurrentTransactions } from "@/src/hooks/useRecurrentTransactions";
import { RECURRENCE_INTERVALS } from "@/src/types/recurrence";
import { createCustomInterval } from "@/src/utils/recurrence";
import { MonthlyBudget, RecurrentTransaction } from "@/src/types/budget";
import { formatDateForInput, createDateFromInput } from "@/src/utils/date";
import { toast } from "sonner";
import { Repeat } from "lucide-react";

interface RecurrentTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: MonthlyBudget;
  editingTransaction?: RecurrentTransaction | null;
  onSuccess?: () => void;
}

export default function RecurrentTransactionModal({
  isOpen,
  onClose,
  budget,
  editingTransaction,
  onSuccess,
}: RecurrentTransactionModalProps) {
  const {
    createRecurrentTransaction,
    updateRecurrentTransaction,
    loading,
    error,
    clearError,
  } = useRecurrentTransactions();

  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: 0,
    description: "",
    categoryId: "",
    startDate: formatDateForInput(new Date()),
    endDate: "",
    intervalType: "monthly",
    customIntervalMonths: 1,
    createFutureMonths: 12,
  });

  // Calcular automáticamente los meses futuros basado en el intervalo
  const calculateFutureMonths = (
    intervalType: string,
    customMonths: number
  ) => {
    switch (intervalType) {
      case "monthly":
        return 12; // 12 meses = 12 ocurrencias mensuales
      case "quarterly":
        return 24; // 24 meses = 8 trimestres (2 años)
      case "semi-annual":
        return 36; // 36 meses = 6 semestres (3 años)
      case "annual":
        return 60; // 60 meses = 5 años
      case "custom":
        // Para intervalos personalizados, crear al menos 8 ocurrencias
        const minOccurrences = 8;
        const calculatedMonths = customMonths * minOccurrences;
        return Math.min(Math.max(calculatedMonths, 12), 60); // Entre 12 y 60 meses
      default:
        return 12;
    }
  };

  const [hasEndDate, setHasEndDate] = useState(false);

  // Cargar datos de edición
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        categoryId: editingTransaction.categoryId,
        startDate: formatDateForInput(editingTransaction.startDate),
        endDate: editingTransaction.endDate
          ? formatDateForInput(editingTransaction.endDate)
          : "",
        intervalType: editingTransaction.interval,
        customIntervalMonths: editingTransaction.intervalValue,
        createFutureMonths: calculateFutureMonths(
          editingTransaction.interval,
          editingTransaction.intervalValue
        ),
      });
      setHasEndDate(!!editingTransaction.endDate);
    } else {
      // Reset para nueva transacción
      setFormData({
        type: "expense",
        amount: 0,
        description: "",
        categoryId: "",
        startDate: formatDateForInput(new Date()),
        endDate: "",
        intervalType: "monthly",
        customIntervalMonths: 1,
        createFutureMonths: calculateFutureMonths("monthly", 1),
      });
      setHasEndDate(false);
    }
  }, [editingTransaction, isOpen]);

  // Limpiar error al abrir modal
  useEffect(() => {
    if (isOpen) {
      clearError();
    }
  }, [isOpen, clearError]);

  // Recalcular meses futuros cuando cambie el intervalo
  useEffect(() => {
    if (!editingTransaction) {
      const newFutureMonths = calculateFutureMonths(
        formData.intervalType,
        formData.customIntervalMonths
      );
      if (newFutureMonths !== formData.createFutureMonths) {
        setFormData((prev) => ({
          ...prev,
          createFutureMonths: newFutureMonths,
        }));
      }
    }
  }, [
    formData.intervalType,
    formData.customIntervalMonths,
    editingTransaction,
    formData.createFutureMonths,
  ]);

  const availableCategories = budget.categories.filter(
    (cat) => cat.type === formData.type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || formData.amount <= 0) {
      toast.error("Error", {
        description: "Por favor completa todos los campos requeridos",
      });
      return;
    }

    try {
      // Preparar intervalo
      let interval;
      if (formData.intervalType === "custom") {
        interval = createCustomInterval(formData.customIntervalMonths);
      } else {
        const intervalKey = formData.intervalType.toUpperCase();
        interval =
          RECURRENCE_INTERVALS[
            intervalKey as keyof typeof RECURRENCE_INTERVALS
          ];
      }

      if (!interval) {
        toast.error("Error", {
          description: "Intervalo de recurrencia inválido",
        });
        return;
      }

      if (editingTransaction) {
        // Actualizar transacción existente
        const result = await updateRecurrentTransaction({
          id: editingTransaction.id,
          updates: {
            amount: formData.amount,
            description: formData.description.trim(),
            endDate:
              hasEndDate && formData.endDate
                ? createDateFromInput(formData.endDate)
                : undefined,
            intervalValue: interval.months,
          },
        });

        if (result.success) {
          toast.success("Éxito", {
            description: "Transacción recurrente actualizada correctamente",
          });
          onSuccess?.();
          onClose();
        } else {
          toast.error("Error", {
            description:
              result.error || "Error al actualizar transacción recurrente",
          });
        }
      } else {
        // Crear nueva transacción recurrente
        const result = await createRecurrentTransaction({
          type: formData.type,
          amount: formData.amount,
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          startDate: createDateFromInput(formData.startDate),
          endDate:
            hasEndDate && formData.endDate
              ? createDateFromInput(formData.endDate)
              : undefined,
          interval,
          createFutureMonths: formData.createFutureMonths,
        });

        if (result.success) {
          toast.success("Éxito", {
            description: "Transacción recurrente creada correctamente",
          });

          if (result.warnings && result.warnings.length > 0) {
            toast.warning("Advertencias", {
              description: result.warnings.join("\n"),
            });
          }

          onSuccess?.();
          onClose();
        } else {
          toast.error("Error", {
            description:
              result.error || "Error al crear transacción recurrente",
          });
        }
      }
    } catch (err) {
      console.error("Error in form submission:", err);
      toast.error("Error inesperado", {
        description: "Error al procesar la transacción recurrente",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <Repeat className="h-5 w-5" />
            {editingTransaction ? "Editar" : "Crear"} Plantilla Recurrente
          </DialogTitle>
          <DialogDescription>
            {editingTransaction
              ? "Modifica los datos de la plantilla recurrente"
              : "Crea una plantilla que generará transacciones automáticamente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Transacción */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "income" | "expense") =>
                  setFormData({ ...formData, type: value, categoryId: "" })
                }
                disabled={!!editingTransaction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
                disabled={!!editingTransaction}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <CurrencyInput
                id="amount"
                value={formData.amount}
                onChange={(value) =>
                  setFormData({ ...formData, amount: value })
                }
                min="0"
                step="0.01"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción de la transacción"
                required
              />
            </div>

            {!editingTransaction && (
              <>
                {/* Fecha de Inicio */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Fecha de Fin (Opcional) */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasEndDate"
                      checked={hasEndDate}
                      onChange={(e) => setHasEndDate(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="hasEndDate">Fecha de fin (opcional)</Label>
                  </div>
                  {hasEndDate && (
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      min={formData.startDate}
                    />
                  )}
                </div>

                {/* Intervalo */}
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo de Recurrencia</Label>
                  <Select
                    value={formData.intervalType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, intervalType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">
                        Trimestral (3 meses)
                      </SelectItem>
                      <SelectItem value="semi-annual">
                        Semestral (6 meses)
                      </SelectItem>
                      <SelectItem value="annual">Anual (12 meses)</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Intervalo Personalizado */}
                {formData.intervalType === "custom" && (
                  <div className="space-y-2">
                    <Label htmlFor="customInterval">Cada cuántos meses</Label>
                    <Input
                      id="customInterval"
                      type="number"
                      min="1"
                      max="60"
                      value={formData.customIntervalMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customIntervalMonths: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                )}

                {/* Meses Futuros a Crear */}
                <div className="space-y-2">
                  <Label htmlFor="futureMonths">
                    Presupuestos futuros a crear
                  </Label>
                  <Input
                    id="futureMonths"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.createFutureMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        createFutureMonths: parseInt(e.target.value) || 12,
                      })
                    }
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Meses hacia adelante para crear automáticamente</p>
                    <p className="text-blue-600 font-medium">
                      {(() => {
                        const interval =
                          formData.intervalType === "custom"
                            ? formData.customIntervalMonths
                            : formData.intervalType === "monthly"
                            ? 1
                            : formData.intervalType === "quarterly"
                            ? 3
                            : formData.intervalType === "semi-annual"
                            ? 6
                            : formData.intervalType === "annual"
                            ? 12
                            : 1;

                        const occurrences = Math.floor(
                          formData.createFutureMonths / interval
                        );
                        const intervalLabel =
                          formData.intervalType === "custom"
                            ? `cada ${formData.customIntervalMonths} meses`
                            : formData.intervalType === "monthly"
                            ? "mensualmente"
                            : formData.intervalType === "quarterly"
                            ? "trimestralmente"
                            : formData.intervalType === "semi-annual"
                            ? "semestralmente"
                            : formData.intervalType === "annual"
                            ? "anualmente"
                            : "mensualmente";

                        return `≈ ${occurrences} ocurrencias ${intervalLabel}`;
                      })()}
                    </p>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Botones */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading
                  ? "Procesando..."
                  : editingTransaction
                  ? "Actualizar"
                  : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
