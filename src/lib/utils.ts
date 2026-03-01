import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata nomes vindos da API: primeira letra maiúscula em cada palavra.
 * Ex: "overgrow" → "Overgrow", "cerulean-city-area" → "Cerulean City Area".
 */
export function formatApiName(value: string): string {
  if (!value.trim()) return value;
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
