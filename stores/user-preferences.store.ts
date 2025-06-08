import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CurrencyCode, DEFAULT_CURRENCY } from "../src/types/currency";

interface UserPreferencesState {
  currency: CurrencyCode;

  // Actions
  setCurrency: ({ currency }: { currency: CurrencyCode }) => void;
  resetPreferences: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()(
  persist(
    (set) => ({
      // Default values
      currency: DEFAULT_CURRENCY,

      // Actions
      setCurrency: ({ currency }) => set({ currency }),

      resetPreferences: () =>
        set({
          currency: DEFAULT_CURRENCY,
        }),
    }),
    {
      name: "wdcp-finance-user-preferences",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
