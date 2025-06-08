export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  position: "before" | "after";
  decimals: number;
}

export type CurrencyCode =
  | "CLP"
  | "USD"
  | "EUR"
  | "GBP"
  | "ARS"
  | "MXN"
  | "COL"
  | "PEN";

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  CLP: {
    code: "CLP",
    symbol: "$",
    name: "Peso Chileno",
    locale: "es-CL",
    position: "before",
    decimals: 0,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "Dólar Estadounidense",
    locale: "en-US",
    position: "before",
    decimals: 2,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "es-ES",
    position: "after",
    decimals: 2,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "Libra Esterlina",
    locale: "en-GB",
    position: "before",
    decimals: 2,
  },
  ARS: {
    code: "ARS",
    symbol: "$",
    name: "Peso Argentino",
    locale: "es-AR",
    position: "before",
    decimals: 2,
  },
  MXN: {
    code: "MXN",
    symbol: "$",
    name: "Peso Mexicano",
    locale: "es-MX",
    position: "before",
    decimals: 2,
  },
  COL: {
    code: "COL",
    symbol: "$",
    name: "Peso Colombiano",
    locale: "es-CO",
    position: "before",
    decimals: 2,
  },
  PEN: {
    code: "PEN",
    symbol: "S/",
    name: "Sol Peruano",
    locale: "es-PE",
    position: "before",
    decimals: 2,
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = "CLP";
