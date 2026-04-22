import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getQuantityLabel(quantity) {
  if (quantity <= 0) return { label: "Out of Stock", color: "var(--color-accent-peach)", textColor: "#1E1033", level: "out" };
  if (quantity <= 3) return { label: "Almost Gone", color: "var(--color-accent-peach)", textColor: "#1E1033", level: "critical" };
  if (quantity <= 8) return { label: "Running Low", color: "var(--color-accent-yellow)", textColor: "#1E1033", level: "low" };
  return { label: "Plenty", color: "var(--color-accent-mint)", textColor: "#1E1033", level: "good" };
}
