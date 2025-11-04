import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize any human-readable issue type into our canonical ids used across the app.
// Canonical ids: danger, potholes, traffic, garbage, streetlight, water, trees, other
export function normalizeReportType(input: string | null | undefined): string {
  if (!input) return 'other';
  const s = String(input).trim().toLowerCase();
  const map: Record<string, string> = {
    // direct ids
    danger: 'danger',
    potholes: 'potholes',
    traffic: 'traffic',
    garbage: 'garbage',
    streetlight: 'streetlight',
    water: 'water',
    trees: 'trees',
    other: 'other',

    // citizen-facing labels
    'road damage': 'potholes',
    'water supply': 'water',
    electricity: 'streetlight',
    healthcare: 'other',
    flooding: 'water',
  };
  return map[s] || 'other';
}
