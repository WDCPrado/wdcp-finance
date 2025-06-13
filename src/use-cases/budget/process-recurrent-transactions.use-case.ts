import { IBudgetRepository } from "../../interfaces/budget-repository.interface";
import { ProcessRecurrenceResponse } from "../../types/recurrence";
import { RecurrentTransaction, MonthlyBudget } from "../../types/budget";

export interface ProcessRecurrentTransactionsRequest {
  targetDate?: Date; // Si no se especifica, usa la fecha actual
  targetMonth?: number; // Mes específico a procesar (1-12)
  targetYear?: number; // Año específico a procesar
}

export class ProcessRecurrentTransactionsUseCase {
  constructor(private readonly budgetRepository: IBudgetRepository) {}

  async execute({
    targetDate,
    targetMonth,
    targetYear,
  }: ProcessRecurrentTransactionsRequest = {}): Promise<ProcessRecurrenceResponse> {
    try {
      const warnings: string[] = [];
      let transactionsCreated = 0;
      let budgetsCreated = 0;
      let budgetsUpdated = 0;

      // Determinar la fecha objetivo
      let processDate: Date;

      if (targetMonth && targetYear) {
        // Si se especifica mes/año, usar el primer día de ese mes
        processDate = new Date(targetYear, targetMonth - 1, 1);
      } else if (targetDate) {
        // Si se especifica fecha, usarla
        processDate = new Date(targetDate);
      } else {
        // Por defecto, usar fecha actual
        processDate = new Date();
      }

      processDate.setHours(0, 0, 0, 0);

      // Obtener todas las transacciones recurrentes activas
      const allRecurrentTransactions =
        await this.budgetRepository.getActiveRecurrentTransactions();

      // Filtrar transacciones que deben ejecutarse para el mes/año específico
      const dueRecurrentTransactions = this.filterTransactionsForMonth({
        transactions: allRecurrentTransactions,
        targetMonth: processDate.getMonth() + 1,
        targetYear: processDate.getFullYear(),
        processDate,
      });

      if (dueRecurrentTransactions.length === 0) {
        const monthYear = `${
          processDate.getMonth() + 1
        }/${processDate.getFullYear()}`;
        return {
          success: true,
          transactionsCreated: 0,
          budgetsCreated: 0,
          budgetsUpdated: 0,
          warnings: [
            `No hay transacciones recurrentes que procesar para ${monthYear}`,
          ],
        };
      }

      // Procesar cada transacción recurrente
      for (const recurrentTransaction of dueRecurrentTransactions) {
        try {
          const result = await this.processRecurrentTransaction({
            recurrentTransaction,
            targetDate: processDate,
          });

          transactionsCreated += result.transactionsCreated;
          budgetsCreated += result.budgetsCreated;
          budgetsUpdated += result.budgetsUpdated;

          if (result.warnings) {
            warnings.push(...result.warnings);
          }

          // Actualizar la fecha de próxima ejecución
          await this.updateNextExecutionDate({
            recurrentTransaction,
            processedDate: processDate,
          });
        } catch (error) {
          warnings.push(
            `Error procesando transacción recurrente "${
              recurrentTransaction.description
            }": ${error instanceof Error ? error.message : "Error desconocido"}`
          );
        }
      }

      return {
        success: true,
        transactionsCreated,
        budgetsCreated,
        budgetsUpdated,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        transactionsCreated: 0,
        budgetsCreated: 0,
        budgetsUpdated: 0,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  private async processRecurrentTransaction({
    recurrentTransaction,
    targetDate,
  }: {
    recurrentTransaction: RecurrentTransaction;
    targetDate: Date;
  }): Promise<{
    transactionsCreated: number;
    budgetsCreated: number;
    budgetsUpdated: number;
    warnings?: string[];
  }> {
    const warnings: string[] = [];
    let transactionsCreated = 0;
    let budgetsCreated = 0;
    let budgetsUpdated = 0;

    const targetMonth = targetDate.getMonth() + 1;
    const targetYear = targetDate.getFullYear();

    // Buscar presupuesto para el mes objetivo
    let targetBudget = await this.budgetRepository.getBudgetByMonth({
      month: targetMonth,
      year: targetYear,
    });

    // Si no existe presupuesto, buscar un template del mes anterior
    if (!targetBudget) {
      const templateBudget = await this.findTemplateBudget({
        targetMonth,
        targetYear,
      });

      if (!templateBudget) {
        warnings.push(
          `No se encontró presupuesto template para crear presupuesto de ${targetMonth}/${targetYear}`
        );
        return {
          transactionsCreated,
          budgetsCreated,
          budgetsUpdated,
          warnings,
        };
      }

      // Crear presupuesto basado en el template
      try {
        targetBudget = await this.budgetRepository.createMonthlyBudget({
          name: `Presupuesto ${targetMonth}/${targetYear}`,
          month: targetMonth,
          year: targetYear,
          totalIncome: templateBudget.totalIncome,
          categories: templateBudget.categories.map((cat) => ({
            ...cat,
            id: `${cat.id}_${targetMonth}_${targetYear}`,
          })),
        });
        budgetsCreated++;
      } catch (createError) {
        warnings.push(
          `No se pudo crear presupuesto para ${targetMonth}/${targetYear}: ${
            createError instanceof Error
              ? createError.message
              : "Error desconocido"
          }`
        );
        return {
          transactionsCreated,
          budgetsCreated,
          budgetsUpdated,
          warnings,
        };
      }
    } else {
      budgetsUpdated++;
    }

    // Buscar la categoría correspondiente en el presupuesto objetivo
    const targetCategory = await this.findOrCreateCategory({
      targetBudget,
      recurrentTransaction,
    });

    if (!targetCategory) {
      warnings.push(
        `No se pudo encontrar o crear la categoría para la transacción "${recurrentTransaction.description}" en ${targetMonth}/${targetYear}`
      );
      return { transactionsCreated, budgetsCreated, budgetsUpdated, warnings };
    }

    // Verificar si ya existe una transacción recurrente para este período
    const existingTransaction = targetBudget.transactions.find(
      (t) =>
        t.recurrenceId === recurrentTransaction.id &&
        t.date.getMonth() === targetDate.getMonth() &&
        t.date.getFullYear() === targetDate.getFullYear()
    );

    if (existingTransaction) {
      warnings.push(
        `Ya existe una transacción recurrente para "${recurrentTransaction.description}" en ${targetMonth}/${targetYear}`
      );
      return { transactionsCreated, budgetsCreated, budgetsUpdated, warnings };
    }

    // Crear la transacción
    try {
      await this.budgetRepository.addTransaction({
        budgetId: targetBudget.id,
        transaction: {
          type: recurrentTransaction.type,
          amount: recurrentTransaction.amount,
          description: recurrentTransaction.description,
          categoryId: targetCategory.id,
          date: targetDate,
          isRecurrent: true,
          recurrenceId: recurrentTransaction.id,
        },
      });
      transactionsCreated++;
    } catch (addError) {
      warnings.push(
        `No se pudo crear la transacción para "${
          recurrentTransaction.description
        }" en ${targetMonth}/${targetYear}: ${
          addError instanceof Error ? addError.message : "Error desconocido"
        }`
      );
    }

    return { transactionsCreated, budgetsCreated, budgetsUpdated, warnings };
  }

  private async findTemplateBudget({
    targetMonth,
    targetYear,
  }: {
    targetMonth: number;
    targetYear: number;
  }) {
    // Buscar presupuesto del mes anterior
    let searchMonth = targetMonth - 1;
    let searchYear = targetYear;

    if (searchMonth === 0) {
      searchMonth = 12;
      searchYear = targetYear - 1;
    }

    let templateBudget = await this.budgetRepository.getBudgetByMonth({
      month: searchMonth,
      year: searchYear,
    });

    // Si no existe, buscar en los últimos 6 meses
    if (!templateBudget) {
      for (let i = 2; i <= 6; i++) {
        searchMonth = targetMonth - i;
        searchYear = targetYear;

        while (searchMonth <= 0) {
          searchMonth += 12;
          searchYear--;
        }

        templateBudget = await this.budgetRepository.getBudgetByMonth({
          month: searchMonth,
          year: searchYear,
        });

        if (templateBudget) break;
      }
    }

    return templateBudget;
  }

  private async findOrCreateCategory({
    targetBudget,
    recurrentTransaction,
  }: {
    targetBudget: MonthlyBudget;
    recurrentTransaction: RecurrentTransaction;
  }) {
    // Buscar por ID original de categoría
    let targetCategory = targetBudget.categories.find(
      (c) => c.id === recurrentTransaction.categoryId
    );

    // Si no se encuentra por ID, buscar por nombre y tipo (para casos donde se creó presupuesto nuevo)
    if (!targetCategory) {
      // Primero necesitamos obtener información de la categoría original
      const originalBudgets = await this.budgetRepository.getBudgets();
      let originalCategory = null;

      for (const budget of originalBudgets) {
        originalCategory = budget.categories.find(
          (c) => c.id === recurrentTransaction.categoryId
        );
        if (originalCategory) break;
      }

      if (originalCategory) {
        targetCategory = targetBudget.categories.find(
          (c) =>
            c.name === originalCategory.name && c.type === originalCategory.type
        );
      }
    }

    return targetCategory;
  }

  private filterTransactionsForMonth({
    transactions,
    targetMonth,
    targetYear,
    processDate,
  }: {
    transactions: RecurrentTransaction[];
    targetMonth: number;
    targetYear: number;
    processDate: Date;
  }): RecurrentTransaction[] {
    return transactions.filter((rt) => {
      // Verificar que no haya pasado la fecha de fin
      if (rt.endDate) {
        const endDate = new Date(rt.endDate);
        endDate.setHours(0, 0, 0, 0);
        if (processDate > endDate) {
          return false;
        }
      }

      // Verificar si esta transacción debe ejecutarse en el mes/año objetivo
      return this.shouldExecuteInMonth({
        recurrentTransaction: rt,
        targetMonth,
        targetYear,
      });
    });
  }

  private shouldExecuteInMonth({
    recurrentTransaction,
    targetMonth,
    targetYear,
  }: {
    recurrentTransaction: RecurrentTransaction;
    targetMonth: number;
    targetYear: number;
  }): boolean {
    const startDate = new Date(recurrentTransaction.startDate);
    const startMonth = startDate.getMonth() + 1; // 1-12
    const startYear = startDate.getFullYear();

    // Si la fecha de inicio es posterior al mes objetivo, no debe ejecutarse
    if (
      startYear > targetYear ||
      (startYear === targetYear && startMonth > targetMonth)
    ) {
      return false;
    }

    // Calcular la diferencia en meses desde el inicio hasta el mes objetivo
    const monthsDiff =
      (targetYear - startYear) * 12 + (targetMonth - startMonth);

    // Verificar si es un múltiplo del intervalo (debe ser >= 0 y múltiplo exacto)
    return (
      monthsDiff >= 0 && monthsDiff % recurrentTransaction.intervalValue === 0
    );
  }

  private async updateNextExecutionDate({
    recurrentTransaction,
    processedDate,
  }: {
    recurrentTransaction: RecurrentTransaction;
    processedDate: Date;
  }) {
    // Calcular la siguiente fecha de ejecución
    const nextDate = new Date(processedDate);
    nextDate.setMonth(nextDate.getMonth() + recurrentTransaction.intervalValue);

    // Verificar si excede la fecha de fin
    const shouldContinue =
      !recurrentTransaction.endDate || nextDate <= recurrentTransaction.endDate;

    await this.budgetRepository.updateRecurrentTransaction({
      id: recurrentTransaction.id,
      updates: {
        nextExecutionDate: shouldContinue ? nextDate : undefined,
        lastExecutionDate: processedDate,
        isActive: shouldContinue,
      },
    });
  }

  // Nuevo método para regenerar transacciones eliminadas
  async regenerateDeletedTransaction({
    recurrenceId,
    targetMonth,
    targetYear,
  }: {
    recurrenceId: string;
    targetMonth: number;
    targetYear: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Obtener todas las transacciones recurrentes y buscar por ID
      const allRecurrentTransactions =
        await this.budgetRepository.getRecurrentTransactions();
      const recurrentTransaction = allRecurrentTransactions.find(
        (rt) => rt.id === recurrenceId
      );

      if (!recurrentTransaction) {
        return {
          success: false,
          error: "Transacción recurrente no encontrada",
        };
      }

      // Verificar si debe ejecutarse en este mes
      const shouldExecute = this.shouldExecuteInMonth({
        recurrentTransaction,
        targetMonth,
        targetYear,
      });

      if (!shouldExecute) {
        return {
          success: false,
          error: "Esta transacción no debe ejecutarse en este mes",
        };
      }

      // Procesar la transacción para este mes específico
      const targetDate = new Date(targetYear, targetMonth - 1, 1);
      await this.processRecurrentTransaction({
        recurrentTransaction,
        targetDate,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  // Nuevo método para verificar si una transacción recurrente ya fue ejecutada en un mes
  async isRecurrentTransactionExecutedInMonth({
    recurrenceId,
    targetMonth,
    targetYear,
  }: {
    recurrenceId: string;
    targetMonth: number;
    targetYear: number;
  }): Promise<{
    executed: boolean;
    transactionId?: string;
    budgetId?: string;
  }> {
    try {
      // Buscar presupuesto para el mes objetivo
      const targetBudget = await this.budgetRepository.getBudgetByMonth({
        month: targetMonth,
        year: targetYear,
      });

      if (!targetBudget) {
        return { executed: false };
      }

      // Buscar si existe una transacción con este recurrenceId en el mes
      const existingTransaction = targetBudget.transactions.find(
        (t) =>
          t.recurrenceId === recurrenceId &&
          t.date.getMonth() === targetMonth - 1 && // JavaScript months are 0-based
          t.date.getFullYear() === targetYear
      );

      if (existingTransaction) {
        return {
          executed: true,
          transactionId: existingTransaction.id,
          budgetId: targetBudget.id,
        };
      }

      return { executed: false };
    } catch (error) {
      console.error(
        "Error checking if recurrent transaction was executed:",
        error
      );
      return { executed: false };
    }
  }

  // Nuevo método para desejecutar (eliminar la transacción creada para un mes específico)
  async unexecuteRecurrentTransaction({
    recurrenceId,
    targetMonth,
    targetYear,
  }: {
    recurrenceId: string;
    targetMonth: number;
    targetYear: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si la transacción fue ejecutada
      const executionStatus = await this.isRecurrentTransactionExecutedInMonth({
        recurrenceId,
        targetMonth,
        targetYear,
      });

      if (
        !executionStatus.executed ||
        !executionStatus.transactionId ||
        !executionStatus.budgetId
      ) {
        return {
          success: false,
          error: "No se encontró una transacción ejecutada para este mes",
        };
      }

      // Eliminar la transacción
      const deleted = await this.budgetRepository.deleteTransaction({
        budgetId: executionStatus.budgetId,
        transactionId: executionStatus.transactionId,
      });

      if (deleted) {
        return { success: true };
      } else {
        return {
          success: false,
          error: "No se pudo eliminar la transacción",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
