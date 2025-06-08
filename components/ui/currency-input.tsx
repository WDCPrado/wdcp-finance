"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/src/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  > {
  value: number;
  onChange: (value: number) => void;
  allowNegative?: boolean;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, allowNegative = false, className, ...props }, ref) => {
    const { currency, getSymbol } = useCurrency();
    const [displayValue, setDisplayValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Update display value when value prop changes
    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatForDisplay(value));
      }
    }, [value, isFocused, currency]);

    const formatForDisplay = (num: number): string => {
      if (num === 0) return "";
      return num.toString();
    };

    const parseInputValue = (inputValue: string): number => {
      // Remove all non-numeric characters except decimal point and minus
      const cleaned = inputValue.replace(/[^\d.,-]/g, "");

      // Handle different decimal separators
      const normalized = cleaned.replace(",", ".");

      // Parse to number
      const parsed = parseFloat(normalized);

      // Return 0 if invalid, otherwise return the parsed number
      if (isNaN(parsed)) return 0;

      // Check if negative values are allowed
      if (!allowNegative && parsed < 0) return 0;

      return parsed;
    };

    const formatWithCurrency = (num: number): string => {
      if (num === 0) return "";

      // Get symbol and basic formatting
      const symbol = getSymbol();

      // For display during editing, we want a simpler format
      return `${symbol}${num.toLocaleString()}`;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      const numericValue = parseInputValue(inputValue);
      onChange(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setDisplayValue(value === 0 ? "" : value.toString());
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setDisplayValue(formatForDisplay(value));
      props.onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter
      if (
        [8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)
      ) {
        return;
      }

      // Ensure that it is a number or decimal point
      if (
        (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
        (e.keyCode < 96 || e.keyCode > 105) &&
        e.keyCode !== 190 &&
        e.keyCode !== 188
      ) {
        e.preventDefault();
      }

      props.onKeyDown?.(e);
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={isFocused ? displayValue : formatWithCurrency(value)}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn("pr-12", className)}
          placeholder={`${getSymbol()}0`}
          {...props}
        />
        {!isFocused && value > 0 && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 text-sm">{currency}</span>
          </div>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
