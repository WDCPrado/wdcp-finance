import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Verificando autenticación...
        </p>
      </div>
    </div>
  );
}
