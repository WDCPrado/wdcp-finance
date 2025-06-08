import { useUserPreferencesStore } from "../../stores/user-preferences.store";
import {
  formatCurrency as formatCurrencyUtil,
  getCurrencySymbol,
  getCurrencyName,
} from "../utils/currency";
import { CurrencyCode } from "../types/currency";

export function useCurrency() {
  const { currency, setCurrency } = useUserPreferencesStore();

  const formatCurrency = ({ amount }: { amount: number }): string => {
    return formatCurrencyUtil({ amount, currencyCode: currency });
  };

  const getSymbol = (): string => {
    return getCurrencySymbol({ currencyCode: currency });
  };

  const getName = (): string => {
    return getCurrencyName({ currencyCode: currency });
  };

  const changeCurrency = ({
    newCurrency,
  }: {
    newCurrency: CurrencyCode;
  }): void => {
    setCurrency({ currency: newCurrency });
  };

  return {
    currency,
    formatCurrency,
    getSymbol,
    getName,
    changeCurrency,
  };
}
