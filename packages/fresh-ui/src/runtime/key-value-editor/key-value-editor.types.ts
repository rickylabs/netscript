import type {
  SecretFieldState,
  SecretFieldSubmission,
} from '../secret-field/secret-field.types.ts';

/** RFC 9110 HTTP header field-name token grammar. */
export const HTTP_HEADER_NAME_PATTERN: RegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/** Validation error codes emitted for key-value editor rows. */
export type KeyValueRowErrorCode = 'empty-key' | 'duplicate-key' | 'invalid-key-pattern';

/** Structured validation finding for a single key-value row. */
export interface KeyValueRowError {
  /** Machine-readable validation error code. */
  readonly code: KeyValueRowErrorCode;
  /** Human-readable error message. */
  readonly message: string;
}

/** Form field suffix names emitted for each indexed key-value row. */
export type KeyValueFormSubfield = 'key' | 'value' | 'secret' | 'id' | 'action';

/** Shared fields for both plain-text and write-only secret key-value rows. */
export interface KeyValueRowBase {
  /** Stable row identifier preserved across reorders and form submissions. */
  readonly id?: string;
  /** Row key name (for example an HTTP header or environment variable name). */
  readonly key: string;
  /** Marks the row read-only. */
  readonly readOnly?: boolean;
  /** Optional caller-supplied error message for this row. */
  readonly error?: string;
}

/** Plain-text key-value row. */
export interface KeyValuePlainRow extends KeyValueRowBase {
  /** Marks this row as plain text (`false` or omitted). */
  readonly secret?: false;
  /** Plain-text value for non-secret rows. */
  readonly value?: string;
  /** Disallowed on plain-text rows; applies only to `secret: true` rows. */
  readonly hasValue?: never;
  /** Disallowed on plain-text rows; applies only to `secret: true` rows. */
  readonly secretState?: never;
}

/** Write-only secret key-value row that never accepts a stored plaintext value. */
export interface KeyValueSecretRow extends KeyValueRowBase {
  /** Marks this row as a write-only secret row. */
  readonly secret: true;
  /** Whether a secret row already has a stored value on the server. */
  readonly hasValue?: boolean;
  /** Optional explicit secret state snapshot for preview or server-invalid rendering. */
  readonly secretState?: SecretFieldState;
  /** Disallowed by design: stored secrets must never be passed into the browser. */
  readonly value?: never;
}

/** Declarative row data passed to key-value editors and validators. */
export type KeyValueRow = KeyValuePlainRow | KeyValueSecretRow;

/** Validation rules for {@link validateKeyValueRows}. */
export interface KeyValueValidationOptions {
  /** Optional key pattern (RegExp or source string, e.g. {@link HTTP_HEADER_NAME_PATTERN}). */
  readonly keyPattern?: RegExp | string;
  /** Custom error message when a key does not match `keyPattern`. */
  readonly keyPatternMessage?: string;
  /** Compare duplicate keys case-insensitively (for example HTTP headers). */
  readonly caseInsensitiveKeys?: boolean;
  /** Permit empty keys without reporting `empty-key`. Defaults to `false`. */
  readonly allowEmptyKeys?: boolean;
  /** Ignore completely blank untouched rows (`key === ''`, no value, no stored secret). */
  readonly ignoreBlankRows?: boolean;
  /** Custom error message for empty keys. */
  readonly emptyKeyMessage?: string;
  /** Custom error message for duplicate keys. */
  readonly duplicateKeyMessage?: string;
}

/** Options for parsing indexed key-value rows from submitted `FormData`. */
export interface ParseKeyValueFormDataOptions {
  /** Existing stored secret identifiers or keys used to determine `keep` vs `unset`. */
  readonly storedSecretIds?: ReadonlySet<string>;
  /** Custom unchanged sentinel matching the client editor's `unchangedToken`. */
  readonly unchangedToken?: string;
  /** Custom clear sentinel matching the client editor's `clearToken`. */
  readonly clearToken?: string;
}

/** Server-parsed row reconstructed from indexed `FormData` entries. */
export interface KeyValueParsedRow {
  /** Zero-based row index from the submitted field name. */
  readonly index: number;
  /** Optional stable row identifier when present in form data. */
  readonly id?: string;
  /** Submitted row key. */
  readonly key: string;
  /** Whether the row was submitted as a secret row. */
  readonly secret: boolean;
  /** Plain value for non-secret rows. */
  readonly value?: string;
  /** Resolved write-only secret submission for secret rows. */
  readonly secretSubmission?: SecretFieldSubmission;
}
