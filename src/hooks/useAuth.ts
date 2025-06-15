import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/src/contexts/auth-context";
import type { LoginCredentials, AuthResponse } from "@/src/types/auth";

interface UseAuthReturn {
  user: ReturnType<typeof useAuthContext>["user"];
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  isLoading: ReturnType<typeof useAuthContext>["isLoading"];
}

export function useAuth(): UseAuthReturn {
  const { user, setUser, isLoading } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error en el login");
        }

        const data: AuthResponse = await response.json();
        setUser(data.user);

        // Redirigir al dashboard después del login exitoso
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [router, setUser]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Error en el logout");
      }

      setUser(null);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [router, setUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isLoading,
  };
}
