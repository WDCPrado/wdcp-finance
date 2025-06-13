import { RecurrenceInterval, RECURRENCE_INTERVALS } from "../types/recurrence";

/**
 * Calcula la próxima fecha de ejecución basada en una fecha base y un intervalo
 */
export function calculateNextExecutionDate({
  baseDate,
  intervalMonths,
}: {
  baseDate: Date;
  intervalMonths: number;
}): Date {
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  return nextDate;
}

/**
 * Genera una lista de fechas futuras basada en un intervalo de recurrencia
 */
export function generateRecurrenceDates({
  startDate,
  intervalMonths,
  count,
  endDate,
}: {
  startDate: Date;
  intervalMonths: number;
  count: number;
  endDate?: Date;
}): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    // Incrementar por el intervalo de meses
    currentDate = new Date(currentDate);
    currentDate.setMonth(currentDate.getMonth() + intervalMonths);

    // Verificar si excede la fecha de fin
    if (endDate && currentDate > endDate) {
      break;
    }

    dates.push(new Date(currentDate));
  }

  return dates;
}

/**
 * Verifica si una transacción recurrente debe ejecutarse en una fecha dada
 */
export function shouldExecuteRecurrence({
  recurrentTransaction,
  targetDate,
}: {
  recurrentTransaction: {
    startDate: Date;
    nextExecutionDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
  targetDate: Date;
}): boolean {
  // Verificar si la transacción está activa
  if (!recurrentTransaction.isActive) {
    return false;
  }

  // Verificar si la fecha objetivo es posterior al inicio
  if (targetDate < recurrentTransaction.startDate) {
    return false;
  }

  // Verificar si excede la fecha de fin
  if (
    recurrentTransaction.endDate &&
    targetDate > recurrentTransaction.endDate
  ) {
    return false;
  }

  // Verificar si es el momento de ejecutar
  const targetDateOnly = new Date(targetDate);
  targetDateOnly.setHours(0, 0, 0, 0);

  const nextExecutionDateOnly = new Date(
    recurrentTransaction.nextExecutionDate
  );
  nextExecutionDateOnly.setHours(0, 0, 0, 0);

  return targetDateOnly >= nextExecutionDateOnly;
}

/**
 * Obtiene el intervalo de recurrencia por su clave
 */
export function getRecurrenceInterval(key: string): RecurrenceInterval | null {
  return RECURRENCE_INTERVALS[key] || null;
}

/**
 * Crea un intervalo personalizado
 */
export function createCustomInterval(months: number): RecurrenceInterval {
  const labels: Record<number, string> = {
    1: "Mensual",
    2: "Bimestral",
    3: "Trimestral",
    4: "Cuatrimestral",
    6: "Semestral",
    12: "Anual",
    24: "Bianual",
  };

  const label = labels[months] || `Cada ${months} meses`;

  return {
    type: "custom",
    months,
    label,
  };
}

/**
 * Formatea un intervalo de recurrencia para mostrar al usuario
 */
export function formatRecurrenceInterval(interval: RecurrenceInterval): string {
  return interval.label;
}

/**
 * Calcula cuántas ejecuciones habrá entre dos fechas
 */
export function countExecutionsBetweenDates({
  startDate,
  endDate,
  intervalMonths,
}: {
  startDate: Date;
  endDate: Date;
  intervalMonths: number;
}): number {
  if (endDate <= startDate) {
    return 0;
  }

  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    currentDate = new Date(currentDate);
    currentDate.setMonth(currentDate.getMonth() + intervalMonths);
    count++;
  }

  // Restar 1 porque incluimos la fecha de inicio en el conteo
  return Math.max(0, count - 1);
}

/**
 * Valida que una configuración de recurrencia sea válida
 */
export function validateRecurrenceConfig({
  startDate,
  endDate,
  intervalMonths,
}: {
  startDate: Date;
  endDate?: Date;
  intervalMonths: number;
}): { isValid: boolean; error?: string } {
  if (intervalMonths <= 0) {
    return {
      isValid: false,
      error: "El intervalo debe ser mayor que cero",
    };
  }

  if (intervalMonths > 120) {
    return {
      isValid: false,
      error: "El intervalo no puede ser mayor a 120 meses (10 años)",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return {
      isValid: false,
      error: "La fecha de inicio no puede ser anterior a hoy",
    };
  }

  if (endDate && endDate <= startDate) {
    return {
      isValid: false,
      error: "La fecha de fin debe ser posterior a la fecha de inicio",
    };
  }

  // Validar que no sea una configuración muy lejana en el futuro
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);

  if (endDate && endDate > maxFutureDate) {
    return {
      isValid: false,
      error: "La fecha de fin no puede ser mayor a 10 años en el futuro",
    };
  }

  return { isValid: true };
}

/**
 * Obtiene la descripción del estado de una transacción recurrente
 */
export function getRecurrenceStatus({
  isActive,
  nextExecutionDate,
  endDate,
}: {
  isActive: boolean;
  nextExecutionDate?: Date;
  endDate?: Date;
}): {
  status: "active" | "paused" | "completed" | "scheduled";
  description: string;
} {
  if (!isActive) {
    return {
      status: "paused",
      description: "Pausada",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate && today > endDate) {
    return {
      status: "completed",
      description: "Completada",
    };
  }

  if (nextExecutionDate && nextExecutionDate > today) {
    return {
      status: "scheduled",
      description: `Próxima ejecución: ${nextExecutionDate.toLocaleDateString()}`,
    };
  }

  return {
    status: "active",
    description: "Activa - Lista para ejecutar",
  };
}
