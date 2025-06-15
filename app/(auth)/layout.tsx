import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20" />
      <div className="relative z-10">
        <div className="flex min-h-screen flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                WDCP Finance
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Sistema de Gestión Financiera
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
