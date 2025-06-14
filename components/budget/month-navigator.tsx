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
      {/* Navbar Flotante Sticky */}
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

      {/* Botón de Configuración Flotante */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          onClick={() => setShowSettings(true)}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          size="lg"
          title="Configuración"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Modal de Configuración */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-background border border-border shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    ×
                  </Button>
                </div>

                {/* Configuración de Moneda */}
                <div className="space-y-3">
                  <CurrencySelector showCard={false} />
                </div>

                {/* Configuración de Tema */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Apariencia
                  </label>
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

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettings(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowSettings(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
