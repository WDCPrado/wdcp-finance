# Plantillas de Transacciones Recurrentes

## Concepto Principal

Las **transacciones recurrentes** son **PLANTILLAS** que te permiten crear transacciones reales de forma automática en intervalos específicos.

### Relación Plantilla → Transacciones (1:N)

```
Plantilla "Salario"          →  Transacción "Salario - Enero"
(Intervalo: Mensual)         →  Transacción "Salario - Febrero"
                             →  Transacción "Salario - Marzo"
                             →  ...
```

### ¿Cómo Funciona?

1. **Crear Plantilla**: Defines una plantilla con monto, descripción, categoría e intervalo
2. **Ejecutar Plantilla**: Cuando llegue el momento, ejecutas la plantilla para crear la transacción real
3. **Transacción Creada**: Se crea una transacción real en tu presupuesto
4. **Eliminar si es Necesario**: Puedes eliminar la transacción creada sin afectar la plantilla

## Flujo de Trabajo

### 1. Crear Plantilla

```typescript
// Ejemplo: Crear plantilla de salario mensual
const plantilla = {
  type: "income",
  amount: 3000,
  description: "Salario mensual",
  categoryId: "salarios",
  interval: "monthly", // Cada mes
  startDate: new Date("2024-01-01"),
};
```

### 2. Ejecutar Plantilla

```typescript
// Cuando llegue el momento (manualmente o automáticamente)
processIndividualRecurrentTransaction({
  recurrenceId: plantilla.id,
  targetMonth: 1,
  targetYear: 2024,
});
```

### 3. Resultado

- ✅ Se crea una transacción real: "Salario mensual - Enero 2024"
- ✅ La plantilla sigue activa para próximos meses
- ✅ Puedes eliminar la transacción sin afectar la plantilla

## Estados de una Plantilla

### 🟢 Activa

- La plantilla está funcionando
- Puede generar nuevas transacciones

### 🔴 Inactiva

- La plantilla está pausada
- No generará transacciones hasta reactivarla

### ⏰ Próxima Ejecución

- Fecha calculada automáticamente según el intervalo
- Puedes ejecutar manualmente antes de la fecha

## Intervalos Disponibles

- **Mensual**: Cada mes (1 mes)
- **Trimestral**: Cada 3 meses
- **Semestral**: Cada 6 meses
- **Anual**: Cada 12 meses
- **Personalizado**: Cada X meses (que tú defines)

## Funcionalidades Principales

### ✅ Crear Plantillas

- Define monto, descripción, categoría
- Establece intervalo de recurrencia
- Configura fecha de inicio y fin (opcional)

### ✅ Ejecutar Plantillas

- **Manual**: Ejecuta una plantilla específica para un mes
- **Automático**: Ejecuta todas las plantillas pendientes para un mes
- **Verificación**: Revisa si una plantilla ya fue ejecutada

### ✅ Gestionar Transacciones Creadas

- **Ver Estado**: Saber si una plantilla ya creó su transacción
- **Eliminar**: Borrar una transacción creada (sin afectar la plantilla)
- **Regenerar**: Volver a crear una transacción eliminada

### ✅ Administrar Plantillas

- **Editar**: Modificar monto, descripción, etc.
- **Eliminar**: Borrar plantilla y todas sus transacciones futuras
- **Activar/Desactivar**: Pausar o reanudar una plantilla

## Casos de Uso Comunes

### 💰 Ingresos Recurrentes

- Salario mensual
- Freelance quincenal
- Renta de propiedades
- Dividendos trimestrales

### 💸 Gastos Recurrentes

- Renta mensual
- Servicios (luz, agua, internet)
- Suscripciones
- Seguros anuales

### 💡 Ejemplo Práctico

```typescript
// 1. Crear plantilla de renta
const plantillaRenta = {
  type: "expense",
  amount: 1500,
  description: "Renta del apartamento",
  categoryId: "vivienda",
  interval: "monthly",
};

// 2. Al inicio de cada mes, ejecutar:
// - Automáticamente: processRecurrentTransactions()
// - Manualmente: processIndividualRecurrentTransaction()

// 3. Resultado: Transacción "Renta del apartamento - Enero 2024"

// 4. Si necesitas eliminar la transacción:
// unexecuteRecurrentTransaction() // Solo elimina la transacción, no la plantilla
```

## Componentes Principales

### `<RecurrentTransactionsList>`

- Lista todas las plantillas
- Muestra estado de ejecución por mes
- Botones para ejecutar/eliminar transacciones

### `<RecurrentTransactionModal>`

- Crear nuevas plantillas
- Editar plantillas existentes
- Configurar intervalos y fechas

### `useRecurrentTransactions()`

- Hook principal para toda la funcionalidad
- Métodos para crear, ejecutar, eliminar plantillas
- Estado de carga y errores

## Arquitectura Técnica

### Casos de Uso

1. **CreateRecurrentTransactionUseCase**: Crear plantillas
2. **ProcessRecurrentTransactionsUseCase**: Ejecutar plantillas
3. **ManageRecurrentTransactionsUseCase**: Administrar plantillas

### Repositorio

- **BudgetRepository**: Almacena plantillas y transacciones
- Relación clara entre plantillas y transacciones generadas

### Tipos

- **RecurrentTransaction**: Estructura de la plantilla
- **Transaction**: Transacción real generada (tiene `recurrenceId`)

## Preguntas Frecuentes

### ❓ ¿Qué pasa si ejecuto una plantilla dos veces?

- La segunda ejecución detecta que ya existe y muestra una advertencia
- No se crean transacciones duplicadas

### ❓ ¿Puedo modificar una transacción creada?

- Las transacciones creadas son normales, puedes editarlas o eliminarlas
- Los cambios no afectan la plantilla original

### ❓ ¿Qué pasa si elimino una plantilla?

- Se elimina la plantilla
- Se eliminan todas las transacciones futuras generadas por esa plantilla
- Las transacciones pasadas permanecen

### ❓ ¿Puedo pausar una plantilla?

- Sí, marca `isActive: false`
- La plantilla no generará nuevas transacciones hasta reactivarla

## Beneficios

✅ **Automatización**: No olvides transacciones recurrentes
✅ **Flexibilidad**: Ejecuta cuando quieras, no solo automáticamente
✅ **Control**: Elimina transacciones sin afectar plantillas
✅ **Organización**: Separa plantillas de transacciones reales
✅ **Escalabilidad**: Una plantilla genera múltiples transacciones
