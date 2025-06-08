"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import CurrencySelector from "../currency/currency-selector";
import { useTheme } from "next-themes";

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

const YEARS = Array.from(
  { length: 10 },
  (_, i) => new Date().getFullYear() - 2 + i
);

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export default function MonthNavigator({
  currentMonth,
  currentYear,
  onMonthChange,
  hasCurrentBudget,
  isLoading = false,
}: MonthNavigatorProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <>
      <Card className="w-full">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Navegación con flechas */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                disabled={isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 px-4">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-lg font-semibold min-w-[140px] text-center">
                  {MONTHS[currentMonth - 1]} {currentYear}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Selectores directos */}
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth}
                onValueChange={(value) => {
                  setSelectedMonth(value);
                  const month = parseInt(value);
                  const year = parseInt(selectedYear);
                  onMonthChange({ month, year });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear}
                onValueChange={(value) => {
                  setSelectedYear(value);
                  const month = parseInt(selectedMonth);
                  const year = parseInt(value);
                  onMonthChange({ month, year });
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2 fixed top-5 right-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </div>

          {/* Indicador de estado */}
          <div className="mt-3 text-center">
            {isLoading ? (
              <span className="text-sm text-gray-500">Cargando...</span>
            ) : hasCurrentBudget ? (
              <span className="text-sm text-green-600">
                ✓ Presupuesto activo
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                Sin presupuesto para este mes
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configuración */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Configuración</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    ×
                  </Button>
                </div>

                {/* Configuración de Moneda */}
                <CurrencySelector showCard={false} />

                {/* Configuración de Tema */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Tema</label>
                  <Select
                    value={mounted ? theme : "system"}
                    onValueChange={setTheme}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setShowSettings(false)}>Cerrar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
