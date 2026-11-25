import { resolveSecretFieldSubmission } from '../secret-field/secret-field.utils.ts';
import type {
  KeyValueFormSubfield,
  KeyValueParsedRow,
  KeyValueRow,
  KeyValueRowError,
  KeyValueValidationOptions,
  ParseKeyValueFormDataOptions,
} from './key-value-editor.types.ts';

/**
 * Format the documented indexed form field name for a key-value editor row.
 *
 * Scheme: `${baseName}[${index}][${field}]` where `field` is `key`, `value`,
 * `secret`, `id`, or `action`.
 */
export function keyValueFieldName(
  baseName: string,
  index: number,
  field: KeyValueFormSubfield,
): string {
  return `${baseName}[${index}][${field}]`;
}

function compilePattern(pattern: RegExp | string | undefined): RegExp | undefined {
  if (pattern === undefined) return undefined;
  if (typeof pattern === 'string') return new RegExp(pattern);
  // Strip stateful flags so repeated `.test()` calls stay deterministic.
  const flags = pattern.flags.replace(/[gy]/g, '');
  return new RegExp(pattern.source, flags);
}

/**
 * Validate key-value rows for empty keys, duplicate keys, and optional key patterns.
 *
 * Returns a map keyed by zero-based row index containing every finding for that row.
 */
export function validateKeyValueRows(
  rows: readonly KeyValueRow[],
  options: KeyValueValidationOptions = {},
): ReadonlyMap<number, readonly KeyValueRowError[]> {
  const {
    keyPattern,
    keyPatternMessage = 'Key contains invalid characters.',
    caseInsensitiveKeys = false,
    allowEmptyKeys = false,
    ignoreBlankRows = false,
    emptyKeyMessage = 'Key is required.',
    duplicateKeyMessage = 'Duplicate key.',
  } = options;

  const compiled = compilePattern(keyPattern);
  const findings = new Map<number, KeyValueRowError[]>();
  const add = (index: number, error: KeyValueRowError) => {
    const existing = findings.get(index);
    if (existing) existing.push(error);
    else findings.set(index, [error]);
  };

  const occurrences = new Map<string, number[]>();

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const trimmed = row.key.trim();
    const isBlank = trimmed.length === 0 &&
      !row.secret &&
      !(row.value && row.value.length > 0);

    if (trimmed.length === 0) {
      if (!allowEmptyKeys && !(ignoreBlankRows && isBlank)) {
        add(index, { code: 'empty-key', message: emptyKeyMessage });
      }
      continue;
    }

    if (compiled && !compiled.test(trimmed)) {
      add(index, { code: 'invalid-key-pattern', message: keyPatternMessage });
    }

    const normalized = caseInsensitiveKeys ? trimmed.toLowerCase() : trimmed;
    const seen = occurrences.get(normalized);
    if (seen) seen.push(index);
    else occurrences.set(normalized, [index]);
  }

  for (const indices of occurrences.values()) {
    if (indices.length > 1) {
      for (const index of indices) {
        add(index, { code: 'duplicate-key', message: duplicateKeyMessage });
      }
    }
  }

  return findings;
}

/**
 * Parse indexed key-value rows from a `FormData` payload produced by `KeyValueEditor`.
 *
 * Enforces canonical non-negative integer indices (`0` or `[1-9]\d*`), rejects duplicate
 * `(index, subfield)` entries, non-text (`File`) entries, and malformed `secret` flags.
 * Secret rows are resolved through {@link resolveSecretFieldSubmission} so servers can
 * implement keep, replace, and clear safely without exposing stored credentials.
 */
export function parseKeyValueFormData(
  formData: FormData,
  baseName: string,
  options: ParseKeyValueFormDataOptions = {},
): readonly KeyValueParsedRow[] {
  const escaped = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const candidateMatcher = new RegExp(
    `^${escaped}\\[([^\\]]+)\\]\\[(key|value|secret|id|action)\\]$`,
  );
  const canonicalIndexPattern = /^(?:0|[1-9]\d*)$/;
  const buckets = new Map<number, Partial<Record<KeyValueFormSubfield, string>>>();

  for (const [fieldName, raw] of formData.entries()) {
    const match = candidateMatcher.exec(fieldName);
    if (!match) continue;
    const indexRaw = match[1];
    if (!canonicalIndexPattern.test(indexRaw)) {
      throw new Error(
        `Invalid key-value field index in "${fieldName}": expected canonical non-negative integer.`,
      );
    }
    if (typeof raw !== 'string') {
      throw new Error(`Invalid key-value field "${fieldName}": expected text value.`);
    }
    const index = Number(indexRaw);
    if (!Number.isSafeInteger(index)) {
      throw new Error(`Invalid key-value field index in "${fieldName}": index out of range.`);
    }
    const subfield = match[2] as KeyValueFormSubfield;
    const bucket = buckets.get(index) ?? {};
    if (Object.prototype.hasOwnProperty.call(bucket, subfield)) {
      throw new Error(`Duplicate key-value field "${fieldName}" for row index ${index}.`);
    }
    bucket[subfield] = raw;
    buckets.set(index, bucket);
  }

  const sortedIndices = [...buckets.keys()].sort((left, right) => left - right);
  const rows: KeyValueParsedRow[] = [];

  for (const index of sortedIndices) {
    const bucket = buckets.get(index)!;
    const key = bucket.key ?? '';
    const id = bucket.id;
    if (
      bucket.secret !== undefined &&
      bucket.secret !== 'true' &&
      bucket.secret !== 'false'
    ) {
      throw new Error(
        `Invalid key-value secret flag for row index ${index}: expected "true" or "false".`,
      );
    }
    const secret = bucket.secret === 'true';

    if (secret) {
      const hadStoredSecret = Boolean(
        (id && options.storedSecretIds?.has(id)) ||
          (key && options.storedSecretIds?.has(key)),
      );
      rows.push({
        index,
        ...(id !== undefined ? { id } : {}),
        key,
        secret: true,
        secretSubmission: resolveSecretFieldSubmission(bucket.value, {
          hadStoredSecret,
          unchangedToken: options.unchangedToken,
          clearToken: options.clearToken,
          action: bucket.action,
        }),
      });
    } else {
      rows.push({
        index,
        ...(id !== undefined ? { id } : {}),
        key,
        secret: false,
        value: bucket.value ?? '',
      });
    }
  }

  return rows;
}
