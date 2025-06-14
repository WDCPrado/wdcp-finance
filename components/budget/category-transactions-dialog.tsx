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
import { useCurrency } from "@/src/hooks/useCurrency";
import { formatDate } from "@/src/utils/date";
import { Settings, Edit, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string | Date;
  categoryId: string;
  type: "income" | "expense";
}

interface CategoryTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
}

export default function CategoryTransactionsDialog({
  isOpen,
  onClose,
  categoryName,
  transactions,
  onEditTransaction,
  onDeleteTransaction,
}: CategoryTransactionsDialogProps) {
  const { formatCurrency } = useCurrency();

  // Ordenar transacciones por fecha (más recientes primero)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Settings className="h-5 w-5" />
            Transacciones de {categoryName}
          </DialogTitle>
          <DialogDescription>
            Ver, editar y eliminar transacciones de esta categoría
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
              <p>No hay transacciones registradas para esta categoría</p>
            </div>
          ) : (
            sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{transaction.description}</div>
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
                      onClick={() => onEditTransaction(transaction)}
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteTransaction(transaction.id)}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
