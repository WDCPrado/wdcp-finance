"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthlyBudget } from "@/src/types/budget";
import { isIncomeCategory } from "@/src/constants/categories";
import { formatDateForInput } from "@/src/utils/date";

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: {
    type: "income" | "expense";
    amount: number;
    description: string;
    categoryId: string;
    date: string;
  }) => void;
  budget: MonthlyBudget;
}

export default function AddTransactionDialog({
  isOpen,
  onClose,
  onSubmit,
  budget,
}: AddTransactionDialogProps) {
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: 0,
    description: "",
    categoryId: "",
    date: formatDateForInput(new Date()),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || formData.amount <= 0) return;
    onSubmit(formData);
    // Reset form
    setFormData({
      type: "expense",
      amount: 0,
      description: "",
      categoryId: "",
      date: formatDateForInput(new Date()),
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      type: "expense",
      amount: 0,
      description: "",
      categoryId: "",
      date: formatDateForInput(new Date()),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Transacción</DialogTitle>
          <DialogDescription>
            Agrega una nueva transacción a tu presupuesto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === "expense" ? "default" : "outline"}
                onClick={() =>
                  setFormData({
                    ...formData,
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
                variant={formData.type === "income" ? "default" : "outline"}
                onClick={() =>
                  setFormData({
                    ...formData,
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
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
                    if (formData.type === "income") {
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
              value={formData.date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  date: e.target.value,
                })
              }
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
