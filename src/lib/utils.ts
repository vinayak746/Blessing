import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Logos that need `dark:invert` because they are pure-black SVGs
 * invisible against a dark background.
 */
const LOGOS_NEEDING_DARK_INVERT = new Set(["/logos/openai.svg", "/logos/github.svg"]);

/** Returns true when the logo src should receive the `dark:invert` class. */
export function needsDarkInvert(src: string): boolean {
  return LOGOS_NEEDING_DARK_INVERT.has(src);
}
