import { Category } from "../types/budget";

export const DEFAULT_INCOME_CATEGORIES: Omit<
  Category,
  "id" | "budgetAmount"
>[] = [
  {
    name: "Sueldo",
    description: "Salario principal mensual",
    color: "#10B981",
    icon: "DollarSign",
    type: "income" as const,
  },
  {
    name: "Freelance",
    description: "Trabajos independientes",
    color: "#8B5CF6",
    icon: "Briefcase",
    type: "income" as const,
  },
  {
    name: "Inversiones",
    description: "Retornos de inversiones",
    color: "#F59E0B",
    icon: "PiggyBank",
    type: "income" as const,
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: Omit<
  Category,
  "id" | "budgetAmount"
>[] = [
  {
    name: "Alimentación",
    description: "Supermercado, restaurantes",
    color: "#EF4444",
    icon: "Utensils",
    type: "expense" as const,
  },
  {
    name: "Transporte",
    description: "Combustible, transporte público",
    color: "#3B82F6",
    icon: "Car",
    type: "expense" as const,
  },
  {
    name: "Vivienda",
    description: "Arriendo, servicios básicos",
    color: "#6B7280",
    icon: "Home",
    type: "expense" as const,
  },
  {
    name: "Entretenimiento",
    description: "Cine, juegos, suscripciones",
    color: "#EC4899",
    icon: "Gamepad2",
    type: "expense" as const,
  },
  {
    name: "Salud",
    description: "Medicina, consultas médicas",
    color: "#10B981",
    icon: "Heart",
    type: "expense" as const,
  },
  {
    name: "Compras",
    description: "Ropa, artículos personales",
    color: "#F59E0B",
    icon: "ShoppingBag",
    type: "expense" as const,
  },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];

// Nombres de categorías que se consideran ingresos
export const INCOME_CATEGORY_NAMES = ["Sueldo", "Freelance", "Inversiones"];

// Iconos disponibles de Lucide React
export const AVAILABLE_ICONS = [
  "DollarSign",
  "Home",
  "Car",
  "Utensils",
  "ShoppingBag",
  "Heart",
  "Gamepad2",
  "GraduationCap",
  "Coffee",
  "Phone",
  "Zap",
  "Music",
  "Camera",
  "Plane",
  "Gift",
  "CreditCard",
  "Fuel",
  "ShoppingCart",
  "Briefcase",
  "PiggyBank",
] as const;

export type IconName = (typeof AVAILABLE_ICONS)[number];

// Función para verificar si una categoría es de ingreso
export const isIncomeCategory = (category: Category | string): boolean => {
  if (typeof category === "string") {
    return INCOME_CATEGORY_NAMES.includes(category);
  }
  return category.type === "income";
};
