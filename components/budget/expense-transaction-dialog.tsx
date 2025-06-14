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
import { useCurrency } from "@/src/hooks/useCurrency";
import { Plus } from "lucide-react";

interface ExpenseTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    description: string;
    isComplete: boolean;
  }) => void;
  categoryName: string;
  categoryBudgetAmount: number;
}

export default function ExpenseTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  categoryName,
  categoryBudgetAmount,
}: ExpenseTransactionDialogProps) {
  const { formatCurrency } = useCurrency();
  const [formData, setFormData] = useState({
    amount: 0,
    description: "",
    isComplete: false,
  });

  // Actualizar amount cuando se selecciona "completo"
  useEffect(() => {
    if (formData.isComplete) {
      setFormData((prev) => ({
        ...prev,
        amount: categoryBudgetAmount,
      }));
    }
  }, [formData.isComplete, categoryBudgetAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description.trim()) return;
    onSubmit(formData);
    // Reset form
    setFormData({
      amount: 0,
      description: "",
      isComplete: false,
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      amount: 0,
      description: "",
      isComplete: false,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Plus className="h-5 w-5" />
            Registrar Gasto
          </DialogTitle>
          <DialogDescription>{categoryName}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Gasto</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.isComplete ? "default" : "outline"}
                onClick={() =>
                  setFormData({
                    ...formData,
                    isComplete: true,
                    amount: categoryBudgetAmount,
                  })
                }
                className="flex-1"
              >
                Completo
              </Button>
              <Button
                type="button"
                variant={!formData.isComplete ? "default" : "outline"}
                onClick={() =>
                  setFormData({
                    ...formData,
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
              value={formData.amount}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  amount: value,
                })
              }
              min="0"
              step="0.01"
              required
              disabled={formData.isComplete}
            />
            {formData.isComplete && (
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
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder="Ej: Compra en supermercado, pago de servicio..."
              required
            />
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Resumen:</div>
            <div className="font-medium">
              {formData.isComplete ? "Gasto Completo" : "Gasto Parcial"}:{" "}
              {formatCurrency({ amount: formData.amount })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/80">
              Registrar Gasto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
