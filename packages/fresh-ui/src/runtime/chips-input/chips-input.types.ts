/** A single committed chip with optional validation status. */
export interface ChipsInputItem {
  /** Committed chip text value. */
  readonly value: string;
  /** Whether this chip failed per-chip validation. */
  readonly invalid?: boolean;
  /** Validation error message when `invalid` is true. */
  readonly error?: string;
}

/** Optional suggestion entry displayed through the Combobox seam. */
export type ChipsInputSuggestion =
  | string
  | {
    /** Committed value when selected. */
    readonly value: string;
    /** Optional human-readable suggestion label. */
    readonly label?: string;
    /** Disables selecting this suggestion. */
    readonly disabled?: boolean;
  };

/** Per-chip validator returning `true`/`null`/`undefined` for valid values or `false`/message for invalid values. */
export type ChipValidator = (value: string) => string | boolean | null | undefined;

/** How invalid chips are handled on commit: mark visually inside the list or reject in the input. */
export type ChipsInputInvalidBehavior = 'mark' | 'reject';

/** How committed chips serialize into hidden form inputs. */
export type ChipsInputSubmitFormat = 'multiple' | 'csv';

/** Rejected token details returned by {@link commitChipTokens}. */
export interface ChipsInputRejection {
  /** Trimmed candidate token that was not committed. */
  readonly value: string;
  /** Human-readable reason for rejection. */
  readonly reason: string;
}

/** Options controlling chip commit, deduplication, and validation. */
export interface CommitChipTokensOptions {
  /** Permit duplicate chip values. Defaults to `false`. */
  readonly allowDuplicates?: boolean;
  /** Compare duplicates case-insensitively. Defaults to `true`. */
  readonly caseInsensitive?: boolean;
  /** Optional upper limit on total committed chips. */
  readonly maxChips?: number;
  /** Optional per-chip validation callback. */
  readonly validate?: ChipValidator;
  /** Whether invalid chips are marked inline (`'mark'`) or rejected (`'reject'`). Defaults to `'mark'`. */
  readonly invalidBehavior?: ChipsInputInvalidBehavior;
}

/** Result returned by {@link commitChipTokens}. */
export interface CommitChipTokensResult {
  /** Resulting ordered chip items. */
  readonly items: readonly ChipsInputItem[];
  /** Newly committed chips in order. */
  readonly added: readonly ChipsInputItem[];
  /** Candidate tokens rejected due to duplicates, max limit, or `'reject'` validation mode. */
  readonly rejected: readonly ChipsInputRejection[];
}
