/**
 * NetScript "Studio Utility" tokens (Neutral gray, Ink accent), expressed as data
 * so both renderers consume them: GPUIX gets style objects, the DOM baseline gets
 * the same objects as inline styles. fresh-ui ships these as CSS custom
 * properties; a GPUIX target needs them as values, which is the portable part of
 * the design system.
 *
 * Rules kept from the theme: sharp geometry (radii 0-2), soft hairlines, mono
 * voice for data, red only for the logo and errors, dark mode designed rather
 * than inverted (no large light surfaces in dark).
 */
import { signal } from '@preact/signals';

export type Scheme = 'light' | 'dark';

export interface Tokens {
  readonly bg: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly hover: string;
  readonly pressed: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly text: string;
  readonly textMuted: string;
  readonly textSubtle: string;
  /** Ink: links, focus, selection, primary action. */
  readonly ink: string;
  readonly inkText: string;
  readonly success: string;
  readonly warning: string;
  readonly info: string;
  /** Swiss red: logo and errors only. */
  readonly danger: string;
  readonly chart: string;
  readonly chartMuted: string;
}

export const THEMES: Record<Scheme, Tokens> = {
  light: {
    bg: '#ffffff',
    surface: '#fbfbfb',
    surfaceMuted: '#f4f4f5',
    hover: '#f0f0f1',
    pressed: '#e7e7e9',
    border: '#e6e6e8',
    borderStrong: '#d1d1d6',
    text: '#17171a',
    textMuted: '#6b6b74',
    textSubtle: '#9d9da6',
    ink: '#17171a',
    inkText: '#ffffff',
    success: '#1f7a3d',
    warning: '#9a5b00',
    info: '#2f4fb5',
    danger: '#d52b1e',
    chart: '#17171a',
    chartMuted: '#c9c9cf',
  },
  dark: {
    bg: '#0c0c0e',
    surface: '#121215',
    surfaceMuted: '#18181c',
    hover: '#1d1d22',
    pressed: '#24242a',
    border: '#24242a',
    borderStrong: '#34343c',
    text: '#ececf0',
    textMuted: '#9a9aa5',
    textSubtle: '#6c6c76',
    // Ink stays a raised dark surface in dark mode; only its text is light.
    ink: '#2c2c33',
    inkText: '#f4f4f6',
    success: '#4cc27a',
    warning: '#e0a43a',
    info: '#8aa2ff',
    danger: '#ff5a4d',
    chart: '#c9c9d1',
    chartMuted: '#3a3a42',
  },
};

export const FONT = { sans: 'Inter', mono: 'JetBrains Mono' } as const;
export const SIZE = { xs: 11, sm: 12, md: 13, lg: 15, xl: 20, xxl: 26, numeral: 28 } as const;
export const LINE = { sm: 16, md: 18, lg: 22, xl: 28 } as const;
export const RADIUS = 2;

/** Active scheme; components read `tokens()` during render so a flip re-renders. */
export const scheme = signal<Scheme>('light');

export function tokens(): Tokens {
  return THEMES[scheme.value];
}
