import { clsx, type ClassValue } from "clsx";

/**
 * Merge class names conditionally.
 */
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}

/**
 * Format a date for display.
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

/**
 * Truncate a string to a maximum length.
 */
export function truncate(str: string, max: number): string {
    if (str.length <= max) return str;
    return str.slice(0, max).trimEnd() + "…";
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number,
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
