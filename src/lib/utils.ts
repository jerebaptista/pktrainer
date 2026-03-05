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
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
