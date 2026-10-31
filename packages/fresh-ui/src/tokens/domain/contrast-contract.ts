import type { TokenScheme, TokenValue } from './token-contract.ts';

/** WCAG AA thresholds used by the approved pair registry. */
export const TEXT_CONTRAST_MINIMUM = 4.5;
/** Input, control and focus boundaries need non-text contrast. */
export const CONTROL_CONTRAST_MINIMUM = 3;

/** One intentional foreground/background use; layers paint from bottom to top. */
export interface TokenContrastPair {
  /** Stable pair identity used by exact exclusions and READY reports. */
  readonly id: string;
  /** Exported foreground role without the --ns- prefix. */
  readonly foreground: string;
  /** Background roles composited over the preset ground in paint order. */
  readonly background: readonly string[];
  /** Text or non-text AA requirement. */
  readonly minimum: typeof TEXT_CONTRAST_MINIMUM | typeof CONTROL_CONTRAST_MINIMUM;
  /** Omit for all presets; language packs name their actual consumers. */
  readonly presets?: readonly string[];
  /** Explicit l/d source roles are measured only in their matching scheme. */
  readonly schemes?: readonly TokenScheme[];
}

/** Pair coverage and narrowly explained color roles whose names describe decoration. */
export interface TokenContrastCoverage {
  /** Every intentional text, boundary and focus use. */
  readonly pairs: readonly TokenContrastPair[];
  /** Exact non-text roles matching the foreground-name heuristic, with their actual use. */
  readonly decorativeRoles: Readonly<Record<string, string>>;
}

/** Upstream color math returns the rendered opaque colors and WCAG 2.1 ratio. */
export interface TokenContrastMeasurement {
  /** Measured ratio, without rounding before the AA decision. */
  readonly ratio: number;
  /** Rendered foreground color after alpha compositing. */
  readonly foreground: string;
  /** Rendered background color after alpha compositing. */
  readonly background: string;
}

/** Color conversion, compositing and contrast stay behind this pure calculation port. */
export interface TokenContrastPort {
  /** Composite the background layers over an opaque preset ground, then the foreground. */
  measure(
    foreground: TokenValue,
    background: readonly TokenValue[],
    ground: TokenValue,
  ): TokenContrastMeasurement;
}

/** A single measured source failure; no preset-wide or rule-wide allowances. */
export interface TokenContrastExclusion extends TokenContrastMeasurement {
  /** Exact preset identity. */
  readonly preset: string;
  /** Exact scheme identity. */
  readonly scheme: TokenScheme;
  /** Exact pair ID from the coverage registry. */
  readonly pair: string;
  /** Threshold at which the recorded pair fails. */
  readonly minimum: number;
  /** Approved Figma variable/node or immutable S0 baseline provenance. */
  readonly source: string;
  /** Why the source value is retained pending correction. */
  readonly reason: string;
}

/** One measured pair retains enough identity to match an exclusion exactly. */
export interface TokenContrastResult extends TokenContrastMeasurement {
  /** Preset identity. */
  readonly preset: string;
  /** Scheme identity. */
  readonly scheme: TokenScheme;
  /** Coverage-registry pair ID. */
  readonly pair: string;
  /** AA threshold for this use. */
  readonly minimum: number;
}

/** Complete report; exclusions do not remove checks from the denominator. */
export interface TokenContrastReport {
  /** Number of measured pairs across all effective contexts. */
  readonly checks: number;
  /** Explicit, still-failing source pairs accepted by exact data. */
  readonly excluded: readonly TokenContrastResult[];
  /** Unapproved AA violations. */
  readonly failures: readonly TokenContrastResult[];
}
