export type RecurrenceInterval = {
  type: "monthly" | "quarterly" | "semi-annual" | "annual" | "custom";
  months: number; // 1, 3, 6, 12 o valor personalizado
  label: string;
};

export const RECURRENCE_INTERVALS: Record<string, RecurrenceInterval> = {
  MONTHLY: { type: "monthly", months: 1, label: "Mensual" },
  QUARTERLY: { type: "quarterly", months: 3, label: "Trimestral" },
  SEMI_ANNUAL: { type: "semi-annual", months: 6, label: "Semestral" },
  ANNUAL: { type: "annual", months: 12, label: "Anual" },
};

export interface CreateRecurrentTransactionRequest {
  userId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: string;
  startDate: Date;
  endDate?: Date;
  interval: RecurrenceInterval;
  createFutureMonths: number; // Cuántos meses hacia adelante crear presupuestos
}

export interface ProcessRecurrenceRequest {
  recurrentTransactionId: string;
  targetDate: Date;
}

export interface ProcessRecurrenceResponse {
  success: boolean;
  transactionsCreated: number;
  budgetsCreated: number;
  budgetsUpdated: number;
  error?: string;
  warnings?: string[];
}
