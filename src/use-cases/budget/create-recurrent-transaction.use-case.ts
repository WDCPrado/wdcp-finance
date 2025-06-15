import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { RecurrentTransaction } from "../../types/budget";
import { CreateRecurrentTransactionRequest } from "../../types/recurrence";

export interface CreateRecurrentTransactionResponse {
  success: boolean;
  recurrentTransaction?: RecurrentTransaction;
  error?: string;
  warnings?: string[];
}

export class CreateRecurrentTransactionUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    userId,
    type,
    amount,
    description,
    categoryId,
    startDate,
    endDate,
    interval,
    createFutureMonths,
  }: CreateRecurrentTransactionRequest): Promise<CreateRecurrentTransactionResponse> {
    try {
      const warnings: string[] = [];

      // Validaciones de negocio
      if (!userId) {
        return {
          success: false,
          error: "UserId es requerido",
        };
      }

      if (amount <= 0) {
        return {
          success: false,
          error: "El monto debe ser mayor que cero",
        };
      }

      if (!description.trim()) {
        return {
          success: false,
          error: "La descripción es requerida",
        };
      }

      if (interval.months <= 0) {
        return {
          success: false,
          error: "El intervalo debe ser mayor que cero",
        };
      }

      if (createFutureMonths < 1 || createFutureMonths > 60) {
        return {
          success: false,
          error: "El rango de meses futuros debe estar entre 1 y 60",
        };
      }

      // Permitir fechas de inicio en el pasado para transacciones recurrentes
      // que deberían haber empezado antes pero se están configurando ahora

      // Validar fecha de fin si se proporciona
      if (endDate && endDate <= startDate) {
        return {
          success: false,
          error: "La fecha de fin debe ser posterior a la fecha de inicio",
        };
      }

      // Calcular la próxima fecha de ejecución
      // Si la fecha de inicio es hoy o en el futuro, la primera ejecución es en la fecha de inicio
      // Si no, calcular la siguiente fecha según el intervalo
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateNormalized = new Date(startDate);
      startDateNormalized.setHours(0, 0, 0, 0);

      let nextExecutionDate: Date;
      if (startDateNormalized >= today) {
        // La primera ejecución es en la fecha de inicio
        nextExecutionDate = new Date(startDate);
      } else {
        // Calcular la siguiente fecha de ejecución desde hoy
        nextExecutionDate = new Date(startDate);
        while (nextExecutionDate < today) {
          nextExecutionDate.setMonth(
            nextExecutionDate.getMonth() + interval.months
          );
        }
      }

      // Crear la transacción recurrente
      const recurrentTransaction =
        await this.budgetRepository.createRecurrentTransaction({
          userId,
          recurrentTransaction: {
            type,
            amount,
            description: description.trim(),
            categoryId,
            startDate,
            endDate,
            isActive: true,
            interval: interval.type,
            intervalValue: interval.months,
            nextExecutionDate,
          },
        });

      // Ya no creamos transacciones automáticamente
      // La transacción recurrente es solo una plantilla que se ejecuta manualmente
      warnings.push(
        `Transacción recurrente creada como plantilla. Usa el modal de transacciones recurrentes para ejecutarla manualmente en los meses que desees.`
      );

      return {
        success: true,
        recurrentTransaction,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  private async processInitialRecurrence({
    recurrentTransaction,
    createFutureMonths,
  }: {
    recurrentTransaction: RecurrentTransaction;
    createFutureMonths: number;
  }): Promise<{ warnings?: string[] }> {
    const warnings: string[] = [];

    try {
      // Obtener el presupuesto del mes de inicio para usar como template
      const startMonth = recurrentTransaction.startDate.getMonth() + 1;
      const startYear = recurrentTransaction.startDate.getFullYear();

      const templateBudget = await this.budgetRepository.getBudgetByMonth({
        userId: recurrentTransaction.userId,
        month: startMonth,
        year: startYear,
      });

      if (!templateBudget) {
        warnings.push(
          `No se encontró presupuesto para ${startMonth}/${startYear}. ` +
            "Se debe crear el presupuesto base antes de procesar las transacciones recurrentes."
        );
        return { warnings };
      }

      // Verificar que la categoría existe en el template
      const category = templateBudget.categories.find(
        (c) => c.id === recurrentTransaction.categoryId
      );
      if (!category) {
        warnings.push(
          `La categoría no existe en el presupuesto base. ` +
            "Se deberá agregar manualmente a los presupuestos futuros."
        );
        return { warnings };
      }

      // Generar fechas para los próximos meses según el intervalo
      // Incluir la fecha de inicio si es hoy o en el futuro
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateNormalized = new Date(recurrentTransaction.startDate);
      startDateNormalized.setHours(0, 0, 0, 0);

      // Generar fechas basadas en el intervalo de recurrencia
      // Siempre incluir el mes de inicio y luego generar los siguientes según el intervalo
      const futureDates = this.generateFutureDates({
        startDate: recurrentTransaction.startDate,
        intervalMonths: recurrentTransaction.intervalValue,
        count: createFutureMonths,
        endDate: recurrentTransaction.endDate,
        includeStartDate: true, // Siempre incluir la fecha de inicio
      });

      for (const futureDate of futureDates) {
        const targetMonth = futureDate.getMonth() + 1;
        const targetYear = futureDate.getFullYear();

        // Verificar si ya existe presupuesto para este mes
        let targetBudget = await this.budgetRepository.getBudgetByMonth({
          userId: recurrentTransaction.userId,
          month: targetMonth,
          year: targetYear,
        });

        // Si no existe, crear uno basado en el template
        if (!targetBudget) {
          try {
            targetBudget = await this.budgetRepository.createMonthlyBudget({
              userId: recurrentTransaction.userId,
              name: `Presupuesto ${targetMonth}/${targetYear}`,
              month: targetMonth,
              year: targetYear,
              totalIncome: templateBudget.totalIncome,
              categories: templateBudget.categories.map((cat) => ({
                ...cat,
                id: crypto.randomUUID(),
                userId: recurrentTransaction.userId,
              })),
            });
          } catch (error) {
            warnings.push(
              `Error al crear presupuesto para ${targetMonth}/${targetYear}: ${
                error instanceof Error ? error.message : "Error desconocido"
              }`
            );
            continue;
          }
        }

        // Crear la transacción en el presupuesto objetivo
        try {
          await this.budgetRepository.addTransaction({
            userId: recurrentTransaction.userId,
            budgetId: targetBudget.id,
            transaction: {
              type: recurrentTransaction.type,
              amount: recurrentTransaction.amount,
              description: recurrentTransaction.description,
              categoryId: recurrentTransaction.categoryId,
              date: futureDate,
              isRecurrent: true,
              recurrenceId: recurrentTransaction.id,
            },
          });
        } catch (error) {
          warnings.push(
            `Error al crear transacción para ${targetMonth}/${targetYear}: ${
              error instanceof Error ? error.message : "Error desconocido"
            }`
          );
        }
      }

      return { warnings: warnings.length > 0 ? warnings : undefined };
    } catch (error) {
      return {
        warnings: [
          `Error procesando recurrencia inicial: ${
            error instanceof Error ? error.message : "Error desconocido"
          }`,
        ],
      };
    }
  }

  private generateFutureDates({
    startDate,
    intervalMonths,
    count,
    endDate,
    includeStartDate = false,
  }: {
    startDate: Date;
    intervalMonths: number;
    count: number;
    endDate?: Date;
    includeStartDate?: boolean;
  }): Date[] {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    let generatedCount = 0;

    // Si includeStartDate es true, agregar la fecha de inicio
    if (includeStartDate) {
      dates.push(new Date(currentDate));
      generatedCount++;
    }

    // Generar fechas futuras según el intervalo
    while (generatedCount < count) {
      // Incrementar por el intervalo de meses
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + intervalMonths);

      // Verificar si excede la fecha de fin
      if (endDate && currentDate > endDate) {
        break;
      }

      dates.push(new Date(currentDate));
      generatedCount++;
    }

    return dates;
  }
}
