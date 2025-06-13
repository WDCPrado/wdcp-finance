# Transacciones Recurrentes

Esta funcionalidad permite crear transacciones que se repiten automáticamente en intervalos específicos (mensual, trimestral, semestral, anual o personalizado).

## Características Implementadas

### Tipos y Interfaces

- `RecurrentTransaction`: Entidad principal para transacciones recurrentes
- `RecurrenceInterval`: Configuración de intervalos de recurrencia
- Extensión de `Transaction` con campos `isRecurrent` y `recurrenceId`

### Casos de Uso

1. **CreateRecurrentTransactionUseCase**: Crear nueva transacción recurrente
2. **ProcessRecurrentTransactionsUseCase**: Procesar transacciones pendientes
3. **ManageRecurrentTransactionsUseCase**: Gestionar transacciones existentes

### Hook Principal

`useRecurrentTransactions()` - Hook React que expone toda la funcionalidad

## Cómo Usar

```typescript
import { useRecurrentTransactions } from "./hooks/useRecurrentTransactions";
import { RECURRENCE_INTERVALS } from "./types/recurrence";

function MiComponente() {
  const {
    createRecurrentTransaction,
    processRecurrentTransactions,
    getAllRecurrentTransactions,
    loading,
    error,
  } = useRecurrentTransactions();

  // Crear salario mensual
  const crearSalario = async () => {
    const result = await createRecurrentTransaction({
      type: "income",
      amount: 3000,
      description: "Salario mensual",
      categoryId: "categoria-salario-id",
      startDate: new Date(),
      interval: RECURRENCE_INTERVALS.MONTHLY,
      createFutureMonths: 12,
    });
  };

  // Procesar transacciones pendientes
  const procesarPendientes = async () => {
    await processRecurrentTransactions();
  };
}
```

## Intervalos Disponibles

- `MONTHLY`: Cada mes
- `QUARTERLY`: Cada 3 meses
- `SEMI_ANNUAL`: Cada 6 meses
- `ANNUAL`: Cada 12 meses
- Personalizado: Usar `createCustomInterval(meses)`

## Funcionalidades Principales

1. **Crear Transacción Recurrente**: Define una transacción que se repetirá automáticamente
2. **Procesamiento Automático**: Crea presupuestos y transacciones para meses futuros
3. **Gestión Completa**: Pausar, reanudar, actualizar o eliminar recurrencias
4. **Validaciones**: Controla fechas, montos y configuraciones
5. **Template de Presupuestos**: Usa el presupuesto base para crear presupuestos futuros

## Arquitectura

La implementación sigue el patrón Clean Architecture del proyecto:

- **Entities**: Tipos en `src/types/`
- **Use Cases**: Lógica de negocio en `src/use-cases/budget/`
- **Interface Adapters**: Hook en `src/hooks/`
- **Infrastructure**: Repositorio en `src/repositories/`
- **DI Container**: Inyección de dependencias en `src/di/`

## Utilidades

El archivo `src/utils/recurrence.ts` contiene funciones auxiliares para:

- Calcular fechas de ejecución
- Validar configuraciones
- Formatear intervalos
- Gestionar estados de recurrencia
