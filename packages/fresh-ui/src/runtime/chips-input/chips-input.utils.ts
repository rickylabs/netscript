import type {
  ChipsInputItem,
  ChipsInputRejection,
  ChipsInputSuggestion,
  ChipValidator,
  CommitChipTokensOptions,
  CommitChipTokensResult,
} from './chips-input.types.ts';

const EMAIL_CHIP_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_PASTE_SPLIT_PATTERN = /[,;\r\n]+/;

/**
 * Built-in email validator for `ChipsInput` recipient lists.
 *
 * Returns `null` when valid or an actionable error message when invalid.
 */
export function validateEmailChip(value: string): string | null {
  return EMAIL_CHIP_PATTERN.test(value.trim()) ? null : 'Enter a valid email address.';
}

/**
 * Normalize a {@link ChipValidator} result into `null` (valid) or an error message string.
 */
export function evaluateChipValidation(
  value: string,
  validate?: ChipValidator,
): string | null {
  if (!validate) return null;
  const result = validate(value);
  if (result === true || result === null || result === undefined || result === '') return null;
  if (result === false) return `Invalid value: ${value}`;
  return result;
}

/**
 * Split raw typed or pasted text into trimmed, non-empty chip tokens.
 */
export function splitChipText(
  raw: string,
  delimiters: readonly string[] = [','],
  pasteSplitPattern: RegExp = DEFAULT_PASTE_SPLIT_PATTERN,
): readonly string[] {
  const escaped = delimiters
    .filter((delimiter) => delimiter.length > 0)
    .map((delimiter) => delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const splitter = escaped.length > 0
    ? new RegExp(`${pasteSplitPattern.source}|${escaped.join('|')}`)
    : pasteSplitPattern;

  return raw
    .split(splitter)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

/**
 * Normalize string or object suggestion entries into a consistent record shape.
 */
export function normalizeChipSuggestions(
  suggestions: readonly ChipsInputSuggestion[],
): readonly { readonly value: string; readonly label: string; readonly disabled: boolean }[] {
  return suggestions.map((entry) =>
    typeof entry === 'string'
      ? { value: entry, label: entry, disabled: false }
      : { value: entry.value, label: entry.label ?? entry.value, disabled: Boolean(entry.disabled) }
  );
}

/**
 * Commit one or more candidate tokens into an immutable chip list, applying
 * deduplication, `maxChips` limits, and optional per-chip validation.
 */
export function commitChipTokens(
  current: readonly ChipsInputItem[],
  tokens: readonly string[],
  options: CommitChipTokensOptions = {},
): CommitChipTokensResult {
  const {
    allowDuplicates = false,
    caseInsensitive = true,
    maxChips,
    validate,
    invalidBehavior = 'mark',
  } = options;

  const normalizeKey = (value: string) => caseInsensitive ? value.toLowerCase() : value;
  const seen = new Set(current.map((item) => normalizeKey(item.value)));
  const items: ChipsInputItem[] = [...current];
  const added: ChipsInputItem[] = [];
  const rejected: ChipsInputRejection[] = [];

  for (const raw of tokens) {
    const value = raw.trim();
    if (value.length === 0) continue;

    const key = normalizeKey(value);
    if (!allowDuplicates && seen.has(key)) {
      rejected.push({ value, reason: `${value} is already added.` });
      continue;
    }

    if (maxChips !== undefined && items.length >= maxChips) {
      rejected.push({ value, reason: `Maximum of ${maxChips} items reached.` });
      continue;
    }

    const error = evaluateChipValidation(value, validate);
    if (error && invalidBehavior === 'reject') {
      rejected.push({ value, reason: error });
      continue;
    }

    const item: ChipsInputItem = error ? { value, invalid: true, error } : { value };
    items.push(item);
    added.push(item);
    seen.add(key);
  }

  return { items, added, rejected };
}
