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
 * When a companion `action` is supplied (`'keep'`, `'replace'`, `'clear'`, or `'unset'`),
 * the submitted value and action must agree; any conflict, unknown action, or non-text
 * (`File`) entry fails closed with `{ mode: 'invalid', reason }`.
 *
 * Without a companion `action`, servers keep an existing stored secret whenever the field
 * is omitted, empty, or carries `unchangedToken`. Deletion requires `clearToken`, and
 * replacement requires a non-empty string that does not match either sentinel token.
 */
export function resolveSecretFieldSubmission(
  rawValue: FormDataEntryValue | string | null | undefined,
  options: ResolveSecretFieldOptions = {},
): SecretFieldSubmission {
  const unchangedToken = options.unchangedToken ?? SECRET_FIELD_UNCHANGED_TOKEN;
  const clearToken = options.clearToken ?? SECRET_FIELD_CLEAR_TOKEN;
  const hadStoredSecret = options.hadStoredSecret ?? false;

  if (rawValue !== null && rawValue !== undefined && typeof rawValue !== 'string') {
    return { mode: 'invalid', reason: 'Secret field value must be text.' };
  }
  if (
    options.action !== null &&
    options.action !== undefined &&
    typeof options.action !== 'string'
  ) {
    return { mode: 'invalid', reason: 'Secret action must be text.' };
  }

  const value = typeof rawValue === 'string' ? rawValue : undefined;
  const action = typeof options.action === 'string' && options.action.length > 0
    ? options.action
    : undefined;

  if (action !== undefined) {
    switch (action) {
      case 'replace':
        if (value === undefined || value === '') {
          return { mode: 'invalid', reason: 'Replacement secret value is required.' };
        }
        if (value === clearToken || value === unchangedToken) {
          return {
            mode: 'invalid',
            reason: 'Replacement secret value conflicts with a reserved sentinel token.',
          };
        }
        return { mode: 'replace', value };
      case 'clear':
        if (value !== undefined && value !== '' && value !== clearToken) {
          return {
            mode: 'invalid',
            reason: 'Clear action cannot carry a replacement secret value.',
          };
        }
        return { mode: 'clear' };
      case 'keep':
        if (value !== undefined && value !== '' && value !== unchangedToken) {
          return {
            mode: 'invalid',
            reason: 'Keep action cannot carry a replacement or clear value.',
          };
        }
        return hadStoredSecret ? { mode: 'keep' } : { mode: 'unset' };
      case 'unset':
        if (value !== undefined && value !== '') {
          return { mode: 'invalid', reason: 'Unset action cannot carry a secret value.' };
        }
        if (hadStoredSecret) {
          return {
            mode: 'invalid',
            reason: 'Unset action conflicts with an existing stored secret.',
          };
        }
        return { mode: 'unset' };
      default:
        return { mode: 'invalid', reason: `Unknown secret action "${action}".` };
    }
  }

  if (value === clearToken) {
    return { mode: 'clear' };
  }
  if (value === unchangedToken || value === undefined || value === '') {
    return hadStoredSecret ? { mode: 'keep' } : { mode: 'unset' };
  }
  return { mode: 'replace', value };
}
