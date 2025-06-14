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
import { IconSelector } from "@/components/ui/icon-selector";
import { type IconName } from "@/src/constants/categories";

interface AddCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: {
    name: string;
    description: string;
    budgetAmount: number;
    color: string;
    icon: IconName;
    type: "income" | "expense";
  }) => void;
}

export default function AddCategoryDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddCategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budgetAmount: 0,
    color: "#6B7280",
    icon: "DollarSign" as IconName,
    type: "expense" as "income" | "expense",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.budgetAmount <= 0) return;
    onSubmit(formData);
    // Reset form
    setFormData({
      name: "",
      description: "",
      budgetAmount: 0,
      color: "#6B7280",
      icon: "DollarSign" as IconName,
      type: "expense" as "income" | "expense",
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setFormData({
      name: "",
      description: "",
      budgetAmount: 0,
      color: "#6B7280",
      icon: "DollarSign" as IconName,
      type: "expense" as "income" | "expense",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Categoría</DialogTitle>
          <DialogDescription>
            Crea una nueva categoría para organizar tus transacciones
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
                variant={formData.type === "expense" ? "default" : "outline"}
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: "expense",
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
              value={formData.icon}
              onChange={(icon: IconName) =>
                setFormData({
                  ...formData,
                  icon: icon,
                })
              }
              color={formData.color}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-budget">Presupuesto</Label>
            <CurrencyInput
              id="category-budget"
              value={formData.budgetAmount}
              onChange={(value) =>
                setFormData({
                  ...formData,
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
              value={formData.color}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  color: e.target.value,
                })
              }
              className="w-full h-10 rounded border"
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
