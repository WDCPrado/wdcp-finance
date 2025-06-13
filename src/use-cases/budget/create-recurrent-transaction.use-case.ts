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

      // Validar que la fecha de inicio no sea anterior a hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        return {
          success: false,
          error: "La fecha de inicio no puede ser anterior a hoy",
        };
      }

      // Validar fecha de fin si se proporciona
      if (endDate && endDate <= startDate) {
        return {
          success: false,
          error: "La fecha de fin debe ser posterior a la fecha de inicio",
        };
      }

      // Calcular la próxima fecha de ejecución
      const nextExecutionDate = new Date(startDate);

      // Crear la transacción recurrente
      const recurrentTransaction =
        await this.budgetRepository.createRecurrentTransaction({
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

      // Procesar la creación inicial de transacciones para los meses futuros
      const processingResult = await this.processInitialRecurrence({
        recurrentTransaction,
        createFutureMonths,
      });

      if (processingResult.warnings) {
        warnings.push(...processingResult.warnings);
      }

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
      const futureDates = this.generateFutureDates({
        startDate: recurrentTransaction.startDate,
        intervalMonths: recurrentTransaction.intervalValue,
        count: createFutureMonths,
        endDate: recurrentTransaction.endDate,
      });

      for (const futureDate of futureDates) {
        const targetMonth = futureDate.getMonth() + 1;
        const targetYear = futureDate.getFullYear();

        // Verificar si ya existe presupuesto para este mes
        let targetBudget = await this.budgetRepository.getBudgetByMonth({
          month: targetMonth,
          year: targetYear,
        });

        // Si no existe, crear uno basado en el template
        if (!targetBudget) {
          try {
            targetBudget = await this.budgetRepository.createMonthlyBudget({
              name: `Presupuesto ${targetMonth}/${targetYear}`,
              month: targetMonth,
              year: targetYear,
              totalIncome: templateBudget.totalIncome,
              categories: templateBudget.categories.map((cat) => ({
                ...cat,
                id: `${cat.id}_${targetMonth}_${targetYear}`, // Generar nuevo ID
              })),
            });
          } catch (createError) {
            warnings.push(
              `No se pudo crear presupuesto para ${targetMonth}/${targetYear}: ` +
                (createError instanceof Error
                  ? createError.message
                  : "Error desconocido")
            );
            continue;
          }
        }

        // Verificar que la categoría existe en el presupuesto destino
        const targetCategory = targetBudget.categories.find(
          (c) => c.name === category.name && c.type === category.type
        );

        if (!targetCategory) {
          warnings.push(
            `La categoría "${category.name}" no existe en el presupuesto de ${targetMonth}/${targetYear}. ` +
              "La transacción recurrente se omitirá para este mes."
          );
          continue;
        }

        // Verificar si ya existe una transacción recurrente similar
        const existingRecurrentTransaction = targetBudget.transactions.find(
          (t) =>
            t.recurrenceId === recurrentTransaction.id &&
            t.description === recurrentTransaction.description
        );

        if (existingRecurrentTransaction) {
          warnings.push(
            `Ya existe una transacción recurrente para ${targetMonth}/${targetYear}. Se omitirá.`
          );
          continue;
        }

        // Agregar la transacción al presupuesto
        try {
          await this.budgetRepository.addTransaction({
            budgetId: targetBudget.id,
            transaction: {
              type: recurrentTransaction.type,
              amount: recurrentTransaction.amount,
              description: recurrentTransaction.description,
              categoryId: targetCategory.id,
              date: futureDate,
              isRecurrent: true,
              recurrenceId: recurrentTransaction.id,
            },
          });
        } catch (addError) {
          warnings.push(
            `No se pudo agregar transacción para ${targetMonth}/${targetYear}: ` +
              (addError instanceof Error
                ? addError.message
                : "Error desconocido")
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
}
