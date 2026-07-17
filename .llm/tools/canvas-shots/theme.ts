import type { Theme } from './args.ts';

export const LIGHT_THEME_SCRIPT = "document.documentElement.removeAttribute('data-theme');";
export const DARK_THEME_SCRIPT = "document.documentElement.setAttribute('data-theme','dark');";

/** Returns the NS One document-theme initialization script. */
export function themeApplyScript(theme: Theme): string {
  return theme === 'dark' ? DARK_THEME_SCRIPT : LIGHT_THEME_SCRIPT;
}
