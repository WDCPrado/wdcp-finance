"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  ChevronDown,
  Settings,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import CurrencySelector from "../currency/currency-selector";

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function UserMenu() {
  const { user, logout, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!user) {
    return null;
  }

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 px-3 py-2 h-auto rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50 hover:border-border transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {/* Avatar con iniciales */}
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-inner">
            {getInitials(user.name)}
          </div>

          {/* Información del usuario */}
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {user.email}
            </span>
          </div>

          {/* Icono de chevron */}
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3 bg-muted/30 rounded-lg mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm shadow-lg">
              {getInitials(user.name)}
            </div>
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
              {user.role && (
                <p className="text-xs leading-none text-blue-600 dark:text-blue-400 font-medium">
                  {user.role}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Configuración */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem
              className="cursor-pointer p-3 rounded-lg transition-colors"
              onSelect={(e) => e.preventDefault()}
            >
              <Settings className="mr-3 h-4 w-4" />
              <span className="font-medium">Configuración</span>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSettingsOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={() => setSettingsOpen(false)}>Aplicar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          disabled={loading}
          className="cursor-pointer p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
