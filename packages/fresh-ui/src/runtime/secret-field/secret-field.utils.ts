import {
  type ResolveSecretFieldOptions,
  SECRET_FIELD_CLEAR_TOKEN,
  SECRET_FIELD_UNCHANGED_TOKEN,
  type SecretFieldAction,
  type SecretFieldState,
  type SecretFieldSubmission,
  type SecretFieldUnchangedMode,
} from './secret-field.types.ts';

/** Inputs used to derive the semantic `data-state` of a write-only secret field. */
export interface DeriveSecretFieldStateInput {
  /** Optional explicit visual state override. */
  readonly explicitState?: SecretFieldState;
  /** Whether the field is read-only. */
  readonly readOnly?: boolean;
  /** Whether the field is marked invalid. */
  readonly invalid?: boolean;
  /** Whether an error message is active. */
  readonly hasError?: boolean;
  /** Whether a credential is stored on the server. */
  readonly hasStoredValue: boolean;
  /** Whether the user is actively entering a replacement value. */
  readonly isRotating: boolean;
  /** Whether the user explicitly cleared a previously stored value. */
  readonly isCleared: boolean;
  /** Whether the write-only password input currently contains a non-empty draft. */
  readonly hasDraft: boolean;
}

/**
 * Derive the canonical `data-state` for a write-only secret field.
 */
export function deriveSecretFieldState(input: DeriveSecretFieldStateInput): SecretFieldState {
  if (input.readOnly || input.explicitState === 'readonly') return 'readonly';
  if (input.invalid || input.hasError || input.explicitState === 'invalid') return 'invalid';
  if (input.isCleared) return input.hasDraft ? 'rotating' : 'unset';
  if (input.isRotating || input.hasDraft || input.explicitState === 'rotating') return 'rotating';
  if (input.explicitState === 'set') return 'set';
  if (input.explicitState === 'unset') return 'unset';
  return input.hasStoredValue ? 'set' : 'unset';
}

/**
 * Derive the semantic form action (`keep`, `replace`, `clear`, or `unset`) for the current state.
 */
export function deriveSecretFieldAction(input: {
  readonly hasStoredValue: boolean;
  readonly isCleared: boolean;
  readonly hasDraft: boolean;
  readonly readOnly?: boolean;
}): SecretFieldAction {
  if (input.readOnly) return input.hasStoredValue ? 'keep' : 'unset';
  if (input.hasDraft) return 'replace';
  if (input.isCleared) return 'clear';
  return input.hasStoredValue ? 'keep' : 'unset';
}

/**
 * Compute the hidden input value for a write-only secret field when the password input
 * is not actively submitting a non-empty replacement.
 */
export function resolveSecretHiddenValue(input: {
  readonly action: SecretFieldAction;
  readonly unchangedMode: SecretFieldUnchangedMode;
  readonly unchangedToken: string;
  readonly clearToken: string;
}): string | undefined {
  if (input.action === 'replace') return undefined;
  if (input.action === 'clear') return input.clearToken;
  if (input.action === 'keep') {
    return input.unchangedMode === 'token' ? input.unchangedToken : undefined;
  }
  return undefined;
}

/**
 * Safely interpret a write-only secret form field on the server.
 *
 * Servers keep an existing stored secret whenever the field is omitted, empty, or
 * carries `unchangedToken`. Deletion requires the explicit `clearToken` (or
 * companion `action === 'clear'`), and replacement requires a non-empty value that
 * does not match either sentinel token.
 */
export function resolveSecretFieldSubmission(
  rawValue: FormDataEntryValue | string | null | undefined,
  options: ResolveSecretFieldOptions = {},
): SecretFieldSubmission {
  const unchangedToken = options.unchangedToken ?? SECRET_FIELD_UNCHANGED_TOKEN;
  const clearToken = options.clearToken ?? SECRET_FIELD_CLEAR_TOKEN;
  const hadStoredSecret = options.hadStoredSecret ?? false;
  const action = typeof options.action === 'string' ? options.action : undefined;
  const value = typeof rawValue === 'string' ? rawValue : undefined;

  if (action === 'clear' || value === clearToken) {
    return { mode: 'clear' };
  }
  if (
    action === 'keep' ||
    value === unchangedToken ||
    value === undefined ||
    value === ''
  ) {
    return hadStoredSecret ? { mode: 'keep' } : { mode: 'unset' };
  }
  return { mode: 'replace', value };
}
