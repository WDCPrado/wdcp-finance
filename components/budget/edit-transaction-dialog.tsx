"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Calendar, Edit, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    description: string;
    date: string;
  }) => void;
  transaction?: {
    id: string;
    amount: number;
    description: string;
    date: string | Date;
    categoryId: string;
    type: "income" | "expense";
  } | null;
}

// Helper function to format date for input
const formatDateForInput = (date: string | Date): string => {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) return "";

  // Format as YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export default function EditTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  transaction,
}: EditTransactionDialogProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    description: "",
    date: "",
  });
  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    date?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar form cuando cambia la transacción
  useEffect(() => {
    if (transaction && isOpen) {
      setFormData({
        amount: transaction.amount,
        description: transaction.description,
        date: formatDateForInput(transaction.date),
      });
      setErrors({});
    }
  }, [transaction, isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        amount: 0,
        description: "",
        date: "",
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (formData.amount <= 0) {
      newErrors.amount = "El monto debe ser mayor que cero";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida";
    }

    if (!formData.date) {
      newErrors.date = "La fecha es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        amount: formData.amount,
        description: formData.description.trim(),
        date: formData.date,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Edit className="h-5 w-5" />
            Editar Transacción
          </DialogTitle>
          <DialogDescription>
            Modifica los datos de la transacción seleccionada
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">
              Monto <span className="text-red-500">*</span>
            </Label>
            <CurrencyInput
              id="edit-amount"
              value={formData.amount}
              onChange={(value) => {
                setFormData({
                  ...formData,
                  amount: value,
                });
                if (errors.amount) {
                  setErrors({ ...errors, amount: undefined });
                }
              }}
              min="0"
              step="0.01"
              required
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.amount}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-description"
              value={formData.description}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  description: e.target.value,
                });
                if (errors.description) {
                  setErrors({ ...errors, description: undefined });
                }
              }}
              placeholder="Descripción de la transacción"
              required
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.description}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  date: e.target.value,
                });
                if (errors.date) {
                  setErrors({ ...errors, date: undefined });
                }
              }}
              required
              className={errors.date ? "border-red-500" : ""}
            />
            {errors.date && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {errors.date}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
