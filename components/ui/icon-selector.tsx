"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_ICONS, type IconName } from "@/src/constants/categories";
import {
  DollarSign,
  Home,
  Car,
  Utensils,
  ShoppingBag,
  Heart,
  Gamepad2,
  GraduationCap,
  Coffee,
  Phone,
  Zap,
  Music,
  Camera,
  Plane,
  Gift,
  CreditCard,
  Fuel,
  ShoppingCart,
  Briefcase,
  PiggyBank,
} from "lucide-react";

const ICON_COMPONENTS = {
  DollarSign,
  Home,
  Car,
  Utensils,
  ShoppingBag,
  Heart,
  Gamepad2,
  GraduationCap,
  Coffee,
  Phone,
  Zap,
  Music,
  Camera,
  Plane,
  Gift,
  CreditCard,
  Fuel,
  ShoppingCart,
  Briefcase,
  PiggyBank,
} as const;

interface IconSelectorProps {
  value: IconName;
  onChange: (icon: IconName) => void;
  color?: string;
}

export function IconSelector({
  value,
  onChange,
  color = "#6B7280",
}: IconSelectorProps) {
  const IconComponent = ICON_COMPONENTS[value] || DollarSign;

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <IconComponent className="h-5 w-5" />
      </div>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_ICONS.map((iconName) => {
            const Icon = ICON_COMPONENTS[iconName];
            return (
              <SelectItem key={iconName} value={iconName}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{iconName}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export { ICON_COMPONENTS };
