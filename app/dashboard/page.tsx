"use client";

import { useState, useEffect } from "react";
import { MonthlyBudget } from "@/src/types/budget";
import CreateBudgetForm from "@/components/budget/create-budget-form";
import BudgetDashboard from "@/components/budget/budget-dashboard";
import MonthNavigator from "@/components/budget/month-navigator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    updateLoading = true,
  }: {
    month: number;
    year: number;
    updateLoading?: boolean;
  }) => {
    if (updateLoading) {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await fetch(
        `/api/budget/by-month?month=${month}&year=${year}`
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Error al cargar el presupuesto");
        return;
      }

      if (result.budget) {
        setCurrentBudget(result.budget);
        setIsFirstTime(false);
        setShowCreateForm(false);
      } else {
        setCurrentBudget(null);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error("Error loading budget for month:", error);
      setError("Error inesperado al cargar el presupuesto");
    } finally {
      if (updateLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleMonthChange = async ({
    month,
    year,
  }: {
    month: number;
    year: number;
  }) => {
    setCurrentMonth(month);
    setCurrentYear(year);

    // Cargar el presupuesto del mes
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
      const response = await fetch("/api/budget/create-from-previous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month, year }),
      });

      const result = await response.json();

      if (response.ok && result.budget) {
        setCurrentBudget(result.budget);
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
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/budget/list");
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Error al cargar presupuestos");
        return;
      }

      if (result.budgets.length === 0) {
        // No hay más presupuestos, volver al estado inicial
        setCurrentBudget(null);
        setIsFirstTime(true);
        setShowCreateForm(false);
        // Mantener mes/año actual
      } else {
        // Encontrar el presupuesto más reciente
        const mostRecentBudget = result.budgets.sort(
          (a: MonthlyBudget, b: MonthlyBudget) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          }
        )[0];

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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Primero verificar si hay presupuestos existentes
        const allBudgetsResponse = await fetch("/api/budget/list");
        const allBudgetsResult = await allBudgetsResponse.json();

        if (!allBudgetsResponse.ok) {
          setError(allBudgetsResult.error || "Error al cargar presupuestos");
          return;
        }

        if (allBudgetsResult.budgets.length === 0) {
          // No hay presupuestos, es primera vez
          setIsFirstTime(true);
          setCurrentBudget(null);
          setShowCreateForm(false);
        } else {
          // Hay presupuestos, intentar cargar el del mes actual
          setIsFirstTime(false);
          await loadBudgetForMonth({
            month: currentMonth,
            year: currentYear,
            updateLoading: false,
          });
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        setError("Error al inicializar el dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
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
      <div className="fixed top-5 left-5">
        <Link
          href="https://github.com/WDCPrado/wdcp-finance"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            GitHub
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard Financiero</h1>
      </div>

      <MonthNavigator
        currentMonth={currentMonth}
        currentYear={currentYear}
        onMonthChange={handleMonthChange}
        hasCurrentBudget={!!currentBudget}
        isLoading={isLoading}
      />

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isLoading && isFirstTime && (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">
            ¡Bienvenido a tu Dashboard Financiero!
          </h2>
          <p className="text-gray-600 mb-6">
            Parece que es tu primera vez aquí. Crea tu primer presupuesto
            mensual para comenzar a administrar tus finanzas.
          </p>
          <Button
            onClick={handleShowCreateForm}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Crear Mi Primer Presupuesto
          </Button>
        </div>
      )}

      {!isLoading && !isFirstTime && !currentBudget && (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">
            No hay presupuesto para {currentMonth}/{currentYear}
          </h2>
          <p className="text-gray-600 mb-6">
            ¿Te gustaría crear uno basado en el mes anterior o crear uno nuevo?
          </p>
          <div className="space-x-4">
            <Button
              onClick={() =>
                handleCreateBudgetFromPrevious({
                  month: currentMonth,
                  year: currentYear,
                })
              }
              className="bg-green-500 hover:bg-green-600"
            >
              Crear desde Mes Anterior
            </Button>
            <Button
              onClick={handleShowCreateForm}
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Crear Nuevo Presupuesto
            </Button>
          </div>
        </div>
      )}

      {showCreateForm && <CreateBudgetForm onSuccess={handleBudgetCreated} />}

      {!isLoading && currentBudget && (
        <BudgetDashboard
          budget={currentBudget}
          onBudgetUpdated={handleBudgetUpdated}
          onBudgetDeleted={handleBudgetDeleted}
        />
      )}
    </div>
  );
}
