"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budgetName: string;
  isDeleting: boolean;
}

export default function DeleteBudgetDialog({
  isOpen,
  onClose,
  onConfirm,
  budgetName,
  isDeleting,
}: DeleteBudgetDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar el presupuesto{" "}
            <strong>&ldquo;{budgetName}&rdquo;</strong>?
            <br />
            <br />
            Esta acción no se puede deshacer. Se eliminarán todas las
            transacciones y datos asociados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
