"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface MonthNavigatorProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: ({ month, year }: { month: number; year: number }) => void;
  hasCurrentBudget: boolean;
  isLoading?: boolean;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function MonthNavigator({
  currentMonth,
  currentYear,
  onMonthChange,
  hasCurrentBudget,
  isLoading = false,
}: MonthNavigatorProps) {
  const handlePreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;

    if (newMonth === 0) {
      newMonth = 12;
      newYear = currentYear - 1;
    }

    onMonthChange({ month: newMonth, year: newYear });
  };

  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;

    if (newMonth === 13) {
      newMonth = 1;
      newYear = currentYear + 1;
    }

    onMonthChange({ month: newMonth, year: newYear });
  };

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 w-full">
          {/* Flecha Izquierda */}
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousMonth}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Mes en el Centro */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm sm:text-base">
              {MONTHS[currentMonth - 1]} {currentYear}
            </span>
            {/* Indicador de estado compacto */}
            {isLoading ? (
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            ) : hasCurrentBudget ? (
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                title="Presupuesto activo"
              />
            ) : (
              <div
                className="w-2 h-2 bg-gray-400 rounded-full"
                title="Sin presupuesto"
              />
            )}
          </div>

          {/* Flecha Derecha */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextMonth}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
