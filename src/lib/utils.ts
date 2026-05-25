import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidDate(date: any): boolean {
  if (date === null || date === undefined || date === "") return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

export function safeFormat(date: any, formatStr: string, options?: any) {
  if (!isValidDate(date)) return "---";
  try {
    return format(new Date(date), formatStr, options);
  } catch (e) {
    return "---";
  }
}
