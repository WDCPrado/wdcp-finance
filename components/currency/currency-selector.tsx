"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/src/hooks/useCurrency";
import { SUPPORTED_CURRENCIES, CurrencyCode } from "@/src/types/currency";
import { DollarSign } from "lucide-react";

interface CurrencySelectorProps {
  showCard?: boolean;
  className?: string;
}

export default function CurrencySelector({
  showCard = true,
  className = "",
}: CurrencySelectorProps) {
  const { currency, changeCurrency, formatCurrency } = useCurrency();

  const handleCurrencyChange = (value: string) => {
    changeCurrency({ newCurrency: value as CurrencyCode });
  };

  const selectorComponent = (
    <div className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Moneda</label>
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-full bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
              <SelectItem key={code} value={code} className="text-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.symbol}</span>
                  <span>{config.name}</span>
                  <span className="text-muted-foreground">({config.code})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-sm text-muted-foreground">
        <span className="font-medium">Formato de ejemplo:</span>
        <div className="mt-1 p-2 bg-muted rounded border border-border text-foreground">
          {formatCurrency({ amount: 1234567.89 })}
        </div>
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Configuración de Moneda
          </CardTitle>
        </CardHeader>
        <CardContent>{selectorComponent}</CardContent>
      </Card>
    );
  }

  return selectorComponent;
}
