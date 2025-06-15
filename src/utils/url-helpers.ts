import { NextRequest } from "next/server";

/**
 * Extrae los parámetros de búsqueda de una NextRequest de forma segura
 */
export function getSearchParams(request: NextRequest): URLSearchParams {
  try {
    // Intentar usar request.url primero
    if (request.url) {
      return new URL(request.url).searchParams;
    }

    // Fallback a nextUrl si está disponible
    if (request.nextUrl) {
      return request.nextUrl.searchParams;
    }

    // Último recurso: crear URLSearchParams vacío
    return new URLSearchParams();
  } catch (error) {
    console.warn("Error al extraer parámetros de búsqueda:", error);
    return new URLSearchParams();
  }
}

/**
 * Obtiene un parámetro específico de la query string de forma segura
 */
export function getQueryParam(
  request: NextRequest,
  paramName: string
): string | null {
  const searchParams = getSearchParams(request);
  return searchParams.get(paramName);
}

/**
 * Obtiene múltiples parámetros de la query string de forma segura
 */
export function getQueryParams(
  request: NextRequest,
  paramNames: string[]
): Record<string, string | null> {
  const searchParams = getSearchParams(request);
  const result: Record<string, string | null> = {};

  for (const paramName of paramNames) {
    result[paramName] = searchParams.get(paramName);
  }

  return result;
}
