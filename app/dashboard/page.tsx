"use client";

import { useState, useEffect } from "react";
import { container } from "@/src/di/container";
import { MonthlyBudget } from "@/src/types/budget";
import CreateBudgetForm from "@/components/budget/create-budget-form";
import BudgetDashboard from "@/components/budget/budget-dashboard";
import MonthNavigator from "@/components/budget/month-navigator";

export default function DashboardPage() {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentBudget, setCurrentBudget] = useState<MonthlyBudget | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [error, setError] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadBudgetForMonth = async ({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await container.getBudgetByMonthUseCase.execute({
        month,
        year,
      });

      if (!result.success) {
        setError(result.error || "Error al cargar el presupuesto");
        return;
      }

      if (result.budget) {
        setCurrentBudget(result.budget);
        setIsFirstTime(false);
        setShowCreateForm(false);
      } else {
        setCurrentBudget(null);
        // Verificar si es primera vez o si hay presupuestos anteriores
        const allBudgets = await container.budgetRepository.getBudgets();
        setIsFirstTime(allBudgets.length === 0);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error loading budget for month:", error);
      setError("Error inesperado al cargar el presupuesto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonthChange = ({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    loadBudgetForMonth({ month, year });
  };

  const handleCreateBudgetFromPrevious = async ({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await container.budgetRepository.createFromPreviousMonth({
        month,
        year,
      });

      if (result) {
        setCurrentBudget(result);
        setShowCreateForm(false);
      } else {
        // No hay presupuesto anterior, mostrar formulario
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error("Error creating budget from previous:", error);
      setError("Error al crear presupuesto desde mes anterior");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleBudgetCreated = () => {
    setShowCreateForm(false);
    loadBudgetForMonth({ month: currentMonth, year: currentYear });
  };

  const handleBudgetUpdated = () => {
    loadBudgetForMonth({ month: currentMonth, year: currentYear });
  };

  const handleBudgetDeleted = async () => {
    // Después de eliminar, buscar otro presupuesto para mostrar
    try {
      const allBudgets = await container.budgetRepository.getBudgets();

      if (allBudgets.length === 0) {
        // No hay más presupuestos, volver al estado inicial
        setCurrentBudget(null);
        setIsFirstTime(true);
        setShowCreateForm(false);
        // Mantener mes/año actual
      } else {
        // Encontrar el presupuesto más reciente
        const mostRecentBudget = allBudgets.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        })[0];

        // Cambiar al mes del presupuesto más reciente
        setCurrentMonth(mostRecentBudget.month);
        setCurrentYear(mostRecentBudget.year);
        setCurrentBudget(mostRecentBudget);
        setIsFirstTime(false);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error after budget deletion:", error);
      setError("Error al cargar presupuesto después de eliminar");
    }
  };

  useEffect(() => {
    loadBudgetForMonth({ month: currentMonth, year: currentYear });
  }, []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() =>
            loadBudgetForMonth({ month: currentMonth, year: currentYear })
          }
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Navegador de meses */}
      <MonthNavigator
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={handleMonthChange}
        hasCurrentBudget={!!currentBudget}
        isLoading={isLoading}
      />

      {/* Contenido principal */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-lg">Cargando...</div>
        </div>
      ) : showCreateForm || (isFirstTime && !currentBudget) ? (
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">
              {isFirstTime
                ? "Control de Gastos Personal"
                : `Presupuesto para ${currentMonth}/${currentYear}`}
            </h1>
            <p className="text-gray-600">
              {isFirstTime
                ? "Bienvenido, comienza creando tu primer presupuesto mensual"
                : "Crea un nuevo presupuesto para este mes"}
            </p>
          </div>
          <CreateBudgetForm onSuccess={handleBudgetCreated} />
        </div>
      ) : currentBudget ? (
        <BudgetDashboard
          budget={currentBudget}
          onBudgetUpdated={handleBudgetUpdated}
          onBudgetDeleted={handleBudgetDeleted}
        />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">
            Sin presupuesto para este mes
          </h2>
          <p className="text-gray-600 mb-6">
            No hay un presupuesto creado para {currentMonth}/{currentYear}
          </p>
          <div className="space-x-4">
            <button
              onClick={() =>
                handleCreateBudgetFromPrevious({
                  month: currentMonth,
                  year: currentYear,
                })
              }
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
              Crear desde mes anterior
            </button>
            <button
              onClick={handleShowCreateForm}
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              Crear nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
