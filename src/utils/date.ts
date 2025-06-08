/**
 * Utilidad para formateo de fechas con locale del navegador
 */

/**
 * Formatea una fecha al formato local del navegador (fecha corta)
 * @param date - Fecha a formatear
 * @returns Fecha formateada en locale local
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString();
};

/**
 * Formatea una fecha al formato local del navegador (fecha y hora)
 * @param date - Fecha a formatear
 * @returns Fecha y hora formateadas en locale local
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString();
};

/**
 * Formatea una fecha para usar en inputs tipo date (YYYY-MM-DD)
 * @param date - Fecha a formatear
 * @returns Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString().split("T")[0];
};

/**
 * Formatea una fecha de manera relativa (ej: "hace 2 días", "hoy", "ayer")
 * @param date - Fecha a formatear
 * @returns Fecha formateada de manera relativa
 */
export const formatRelativeDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Hoy";
  } else if (diffDays === 1) {
    return "Ayer";
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} semana${weeks > 1 ? "s" : ""}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} mes${months > 1 ? "es" : ""}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `Hace ${years} año${years > 1 ? "s" : ""}`;
  }
};
