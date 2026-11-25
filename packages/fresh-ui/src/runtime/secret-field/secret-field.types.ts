/** Supported `data-state` values for write-only secret controls. */
export const SECRET_FIELD_STATES = [
  'unset',
  'set',
  'rotating',
  'invalid',
  'readonly',
] as const;

/** State union emitted on `data-state` by write-only secret controls. */
export type SecretFieldState = (typeof SECRET_FIELD_STATES)[number];

/** Form submission strategy when a stored secret is not modified. */
export type SecretFieldUnchangedMode = 'token' | 'omit';

/** Semantic server-side action derived for a write-only secret submission. */
export type SecretFieldAction = 'keep' | 'replace' | 'clear' | 'unset';

/** Default sentinel token submitted when a stored secret should be preserved unchanged. */
export const SECRET_FIELD_UNCHANGED_TOKEN = '__ns_secret_unchanged__';

/** Default sentinel token submitted when a stored secret is explicitly cleared. */
export const SECRET_FIELD_CLEAR_TOKEN = '__ns_secret_clear__';

/** Discriminated server-side interpretation of a write-only secret submission. */
export type SecretFieldSubmission =
  | { readonly mode: 'keep' }
  | { readonly mode: 'replace'; readonly value: string }
  | { readonly mode: 'clear' }
  | { readonly mode: 'unset' }
  | { readonly mode: 'invalid'; readonly reason: string };

/** Options for resolving a submitted write-only secret form entry on the server. */
export interface ResolveSecretFieldOptions {
  /** Whether a credential is already stored on the server before this submission. */
  readonly hadStoredSecret?: boolean;
  /** Custom unchanged sentinel token matching the client field's `unchangedToken`. */
  readonly unchangedToken?: string;
  /** Custom clear sentinel token matching the client field's `clearToken`. */
  readonly clearToken?: string;
  /** Optional explicit companion action field value (`keep`, `replace`, `clear`, or `unset`). */
  readonly action?: FormDataEntryValue | string | null | undefined;
}

/** Options accepted by the L1 {@link useSecretField} behavior hook. */
export interface UseSecretFieldOptions {
  /** Base identifier used to derive stable label, input, status, and error IDs. */
  readonly id?: string;
  /** Form field name submitted when replacing, preserving, or clearing the secret. */
  readonly name?: string;
  /** Optional companion hidden field name carrying the semantic action (`keep`, `replace`, `clear`, `unset`). */
  readonly actionName?: string;
  /** Whether a secret is already stored on the server. Never accepts the secret value itself. */
  readonly hasValue?: boolean;
  /** Optional explicit state override for controlled error/preview rendering. */
  readonly state?: SecretFieldState;
  /** Renders the field read-only with no replace or clear actions. */
  readonly readOnly?: boolean;
  /** Disables interaction and form submission. */
  readonly disabled?: boolean;
  /** Marks the replacement input required when no secret is currently kept. */
  readonly required?: boolean;
  /** Marks the field invalid. */
  readonly invalid?: boolean;
  /** Optional error text; implies invalid semantics when present. */
  readonly error?: string;
  /** Controls whether an unmodified stored secret submits `unchangedToken` or omits the field. */
  readonly unchangedMode?: SecretFieldUnchangedMode;
  /** Sentinel submitted in `'token'` mode when a stored secret is kept unchanged. */
  readonly unchangedToken?: string;
  /** Sentinel submitted when a stored secret is explicitly cleared. */
  readonly clearToken?: string;
  /** Optional placeholder text for the write-only password input. */
  readonly placeholder?: string;
  /** Called whenever the derived `data-state` changes. */
  readonly onStateChange?: (state: SecretFieldState) => void;
  /** Called with whether a non-empty replacement draft is currently entered. */
  readonly onDraftChange?: (hasDraft: boolean) => void;
  /** Called when the user explicitly requests clearing a stored secret. */
  readonly onClear?: () => void;
  /** Called when the user cancels an in-progress rotation. */
  readonly onCancel?: () => void;
}

/** Element props returned for the write-only password input. */
export interface SecretFieldInputElementProps {
  /** Element identifier. */
  id?: string;
  /** CSS class name. */
  class?: string;
  /** Form field name when submitting directly. */
  name?: string;
  /** Native password input type. */
  type?: 'password';
  /** Disables password manager autofill from previous credentials. */
  autocomplete?: string;
  /** Disables spellchecking on credential entries. */
  spellcheck?: boolean;
  /** Disables auto-capitalization on touch keyboards. */
  autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
  /** Disables auto-correction on touch keyboards. */
  autocorrect?: 'off' | 'on';
  /** Disables the input control. */
  disabled?: boolean;
  /** Marks the input read-only. */
  readOnly?: boolean;
  /** Marks the input required when no secret is preserved. */
  required?: boolean;
  /** Placeholder text shown when empty. */
  placeholder?: string;
  /** Marks the input invalid for assistive technology. */
  'aria-invalid'?: 'true' | 'false';
  /** Associates status and error descriptions with the input. */
  'aria-describedby'?: string;
  /** Accessible name when no visible label is associated. */
  'aria-label'?: string;
  /** Component scope marker. */
  'data-scope'?: string;
  /** Component part marker. */
  'data-part'?: string;
  /** Input event listener. */
  onInput?: (event: Event) => void;
  /** Keydown event listener. */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** Ref callback for attaching the rendered input element. */
  ref?: (node: HTMLInputElement | null) => void;
}

/** Element props returned for hidden form contract inputs. */
export interface SecretFieldHiddenInputProps {
  /** Native hidden input type. */
  readonly type: 'hidden';
  /** Form field name. */
  readonly name: string;
  /** Sentinel token or action string. */
  readonly value: string;
}

/** Element props returned for action buttons (`Replace`, `Cancel`, `Clear`, `Keep`). */
export interface SecretFieldButtonElementProps {
  /** Element identifier. */
  id?: string;
  /** CSS class name. */
  class?: string;
  /** Native button type. */
  type?: 'button';
  /** Disables the action button. */
  disabled?: boolean;
  /** Accessible label override. */
  'aria-label'?: string;
  /** Component scope marker. */
  'data-scope'?: string;
  /** Component part marker. */
  'data-part'?: string;
  /** Semantic action marker. */
  'data-action'?: string;
  /** Click event handler. */
  onClick?: (event: MouseEvent) => void;
  /** Ref callback for attaching the rendered button element. */
  ref?: (node: HTMLButtonElement | null) => void;
}

/** Return surface of the L1 {@link useSecretField} hook. */
export interface UseSecretFieldReturn {
  /** Current semantic state for `data-state`. */
  readonly state: SecretFieldState;
  /** Whether a stored secret exists (before any clear). */
  readonly hasStoredValue: boolean;
  /** Whether the native write-only password input is currently mounted and editable. */
  readonly isEditable: boolean;
  /** Whether the user explicitly cleared a previously stored secret. */
  readonly isCleared: boolean;
  /** Whether the user has typed a non-empty replacement draft. */
  readonly hasDraft: boolean;
  /** Semantic form action that will be sent on submit. */
  readonly action: SecretFieldAction;
  /** Hidden input value submitted when the live password input is not carrying a replacement. */
  readonly hiddenValue: string | undefined;
  /** Stable identifier for the password input element. */
  readonly inputId: string;
  /** Stable identifier for the label element. */
  readonly labelId: string;
  /** Stable identifier for the status badge element. */
  readonly statusId: string;
  /** Stable identifier for the error element. */
  readonly errorId: string;
  /** Polite screen-reader announcement for the latest state transition. */
  readonly announcement: string;
  /** Attach to the root element so form `submit` and `reset` events automatically scrub drafts. */
  readonly attachRoot: (node: HTMLElement | null) => void;
  /** Enter replacement mode and focus the password input. */
  readonly startRotate: () => void;
  /** Cancel replacement mode, scrub any entered draft, and restore focus. */
  readonly cancelRotate: () => void;
  /** Explicitly clear a stored secret and scrub any entered draft. */
  readonly clear: () => void;
  /** Undo a pending clear before form submission. */
  readonly restoreStored: () => void;
  /** Scrub any draft value from DOM and memory immediately. */
  readonly scrub: (nextHasStoredValue?: boolean) => void;
  /** Prop getter for the write-only native `<input type="password">`. */
  readonly getInputProps: (
    overrides?: SecretFieldInputElementProps,
  ) => SecretFieldInputElementProps;
  /** Prop getter for the hidden form-contract input, or `null` when not needed. */
  readonly getHiddenInputProps: () => SecretFieldHiddenInputProps | null;
  /** Prop getter for the optional companion action hidden input, or `null` when `actionName` is unset. */
  readonly getActionInputProps: () => SecretFieldHiddenInputProps | null;
  /** Prop getter for the Replace action button. */
  readonly getReplaceButtonProps: (
    overrides?: SecretFieldButtonElementProps,
  ) => SecretFieldButtonElementProps;
  /** Prop getter for the Cancel action button. */
  readonly getCancelButtonProps: (
    overrides?: SecretFieldButtonElementProps,
  ) => SecretFieldButtonElementProps;
  /** Prop getter for the Clear action button. */
  readonly getClearButtonProps: (
    overrides?: SecretFieldButtonElementProps,
  ) => SecretFieldButtonElementProps;
  /** Prop getter for the Keep/Undo action button after clearing a stored secret. */
  readonly getRestoreButtonProps: (
    overrides?: SecretFieldButtonElementProps,
  ) => SecretFieldButtonElementProps;
}
