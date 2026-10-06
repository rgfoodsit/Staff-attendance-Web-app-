import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeStr?: string | null): string {
  if (!timeStr) return "--:--";
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) {
    // If it's pure HH:MM or HH:MM:SS
    return timeStr.substring(0, 5);
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "--/--/----";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDuration(minutes?: number | null): string {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return "0h 0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

/**
 * Returns the local date in YYYY-MM-DD format (respecting the user's local timezone, unlike toISOString which is UTC)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
