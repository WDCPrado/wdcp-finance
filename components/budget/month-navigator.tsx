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
      <Card className="w-full">
        <CardContent className="py-4">
          <div className="w-full">
            <div className="flex items-center w-full gap-2 sm:gap-4">
              {/* Flecha Izquierda */}
              <div className="flex-1 flex justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                  disabled={isLoading}
                  className="sm:w-12 w-10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              {/* Mes/Año */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 px-2 sm:px-4">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-lg font-semibold min-w-[100px] text-center">
                    {MONTHS[currentMonth - 1]} {currentYear}
                  </span>
                </div>
              </div>
              {/* Flecha Derecha */}
              <div className="flex-1 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                  disabled={isLoading}
                  className="sm:w-12 w-10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-background border border-border">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground">
                    Configuración
                  </h2>
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
                  <label className="text-sm font-medium text-foreground">
                    Tema
                  </label>
                  <Select
                    value={mounted ? theme : "system"}
                    onValueChange={setTheme}
                  >
                    <SelectTrigger className="w-full bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {THEME_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-foreground"
                          >
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
