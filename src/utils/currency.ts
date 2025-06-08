import { CurrencyCode, SUPPORTED_CURRENCIES } from "../types/currency";

export function formatCurrency({
  amount,
  currencyCode,
}: {
  amount: number;
  currencyCode: CurrencyCode;
}): string {
  const config = SUPPORTED_CURRENCIES[currencyCode];

  if (!config) {
    // Fallback to CLP if currency not found
    return formatCurrency({ amount, currencyCode: "CLP" });
  }

  try {
    // Format number according to locale
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(Math.abs(amount));

    // Handle negative numbers
    const sign = amount < 0 ? "-" : "";

    // Position symbol before or after based on config
    if (config.position === "before") {
      return `${sign}${config.symbol}${formatted}`;
    } else {
      return `${sign}${formatted}${config.symbol}`;
    }
  } catch {
    // Fallback formatting if Intl fails
    const rounded =
      config.decimals === 0
        ? Math.round(Math.abs(amount))
        : Math.abs(amount).toFixed(config.decimals);

    const sign = amount < 0 ? "-" : "";

    if (config.position === "before") {
      return `${sign}${config.symbol}${rounded}`;
    } else {
      return `${sign}${rounded}${config.symbol}`;
    }
  }
}

export function getCurrencySymbol({
  currencyCode,
}: {
  currencyCode: CurrencyCode;
}): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || "$";
}

export function getCurrencyName({
  currencyCode,
}: {
  currencyCode: CurrencyCode;
}): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.name || "Moneda Desconocida";
}
