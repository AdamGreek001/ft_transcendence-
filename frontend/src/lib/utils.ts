import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

/**
 * cn (Class Names) function:
 * 1. clsx: handles conditional classes (true/false/null).
 * 2. twMerge: fixes Tailwind CSS conflicts (e.g., 'px-2 px-4' becomes 'px-4').
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
});