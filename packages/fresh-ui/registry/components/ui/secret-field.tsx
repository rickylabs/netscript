/**
 * @component SecretField
 * @layer 2
 * @depends theme-seed
 * @description Write-only credential input with no reveal control and safe keep, replace, and clear form semantics.
 */
import type { JSX, VNode } from 'preact';
import {
  SECRET_FIELD_CLEAR_TOKEN,
  SECRET_FIELD_UNCHANGED_TOKEN,
  type SecretFieldState,
  type SecretFieldUnchangedMode,
  useSecretField,
} from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Custom status labels rendered in the status pill for each `data-state`. */
export type SecretFieldStatusLabels = Partial<Record<SecretFieldState, string>>;

/**
 * Props for the write-only {@link SecretField} component.
 *
 * Stored secret values are intentionally omitted from the prop contract:
 * pass `hasValue` to indicate that a credential is already stored on the server.
 */
export interface SecretFieldProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'id' | 'value' | 'defaultValue'> {
  /** Optional base identifier for label, input, status, and error association. */
  id?: string;
  /** Visible accessible label associated with the secret control. */
  label: string;
  /** Form field name used to submit a replacement value or keep/clear sentinel. */
  name?: string;
  /** Optional companion hidden field name carrying the semantic action (`keep`, `replace`, `clear`, `unset`). */
  actionName?: string;
  /** Whether a credential is already stored on the server. */
  hasValue?: boolean;
  /** Explicit state snapshot for server validation errors or visual previews. */
  state?: SecretFieldState;
  /** Disables editing and hides replacement and clear actions. */
  readOnly?: boolean;
  /** Disables all interaction and form submission. */
  disabled?: boolean;
  /** Marks the field required when no stored secret is preserved. */
  required?: boolean;
  /** Marks the field invalid. */
  invalid?: boolean;
  /** Validation error text displayed below the control and referenced via `aria-describedby`. */
  error?: string;
  /** Helper text displayed below the control when no error is active. */
  helpText?: string;
  /** Placeholder shown when the write-only input is empty. */
  placeholder?: string;
  /** Controls whether an unmodified stored secret submits `unchangedToken` or omits the field. */
  unchangedMode?: SecretFieldUnchangedMode;
  /** Sentinel value submitted in `'token'` mode when a stored secret is kept unchanged. */
  unchangedToken?: string;
  /** Sentinel value submitted when a stored secret is explicitly cleared. */
  clearToken?: string;
  /** Shows the Replace action when a stored secret exists. Defaults to `true`. */
  allowReplace?: boolean;
  /** Shows the explicit Clear action when a stored secret exists. Defaults to `!required`. */
  clearable?: boolean;
  /** Label for the Replace button. Defaults to `'Replace'`. */
  replaceLabel?: string;
  /** Label for the Clear button. Defaults to `'Clear'`. */
  clearLabel?: string;
  /** Label for the Cancel button during rotation. Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /** Label for the undo button after clearing a stored secret. Defaults to `'Keep'`. */
  keepLabel?: string;
  /** Optional overrides for the status pill copy per `data-state`. */
  statusLabels?: SecretFieldStatusLabels;
  /** Called whenever the derived `data-state` changes. */
  onStateChange?: (state: SecretFieldState) => void;
  /** Called with whether a non-empty replacement draft is currently entered. */
  onDraftChange?: (hasDraft: boolean) => void;
  /** Called when the user explicitly clears a stored secret. */
  onClear?: () => void;
  /** Called when the user cancels a replacement attempt. */
  onCancel?: () => void;
  /** Disallowed by design: stored secrets must never be passed into the browser. */
  value?: never;
  /** Disallowed by design: stored secrets must never be passed into the browser. */
  defaultValue?: never;
  /** Additional classes merged onto the root element. */
  class?: string;
}

const DEFAULT_STATUS_LABELS: Readonly<Record<SecretFieldState, string>> = {
  unset: 'Not set',
  set: 'Set',
  rotating: 'Rotating',
  invalid: 'Invalid',
  readonly: 'Read-only',
};

/**
 * Write-only credential input that never displays a stored value and provides no reveal control.
 *
 * Hydrate inside a Fresh island for interactive replace, cancel, clear, and post-submit scrubbing.
 */
export function SecretField({
  label,
  name,
  actionName,
  id,
  hasValue = false,
  state: explicitState,
  readOnly = false,
  disabled = false,
  required = false,
  invalid = false,
  error,
  helpText,
  placeholder,
  unchangedMode = 'token',
  unchangedToken = SECRET_FIELD_UNCHANGED_TOKEN,
  clearToken = SECRET_FIELD_CLEAR_TOKEN,
  allowReplace = true,
  clearable,
  replaceLabel = 'Replace',
  clearLabel = 'Clear',
  cancelLabel = 'Cancel',
  keepLabel = 'Keep',
  statusLabels,
  onStateChange,
  onDraftChange,
  onClear,
  onCancel,
  class: className,
  ...props
}: SecretFieldProps): VNode {
  const field = useSecretField({
    id,
    name,
    actionName,
    hasValue,
    state: explicitState,
    readOnly,
    disabled,
    required,
    invalid,
    error,
    unchangedMode,
    unchangedToken,
    clearToken,
    placeholder,
    onStateChange,
    onDraftChange,
    onClear,
    onCancel,
  });

  const showClear = clearable ?? !required;
  const hiddenProps = field.getHiddenInputProps();
  const actionInputProps = field.getActionInputProps();
  const helpId = helpText && !error ? `${field.inputId}-help` : undefined;
  const describedBy = [field.statusId, error ? field.errorId : helpId]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  const statusText = statusLabels?.[field.state] ??
    (field.state === 'readonly'
      ? (field.hasStoredValue ? 'Read-only' : 'Not set (read-only)')
      : field.isCleared && field.state === 'unset'
      ? 'Cleared'
      : DEFAULT_STATUS_LABELS[field.state]);

  return (
    <div
      {...props}
      id={id}
      ref={field.attachRoot}
      class={cn('ns-secret-field', className)}
      data-scope='secret-field'
      data-part='root'
      data-state={field.state}
      data-disabled={disabled ? 'true' : undefined}
    >
      {field.isEditable
        ? (
          <label
            id={field.labelId}
            htmlFor={field.inputId}
            class='ns-secret-field__label'
            data-scope='secret-field'
            data-part='label'
          >
            <span>{label}</span>
            {required && <span class='ns-secret-field__required' aria-hidden='true'>*</span>}
          </label>
        )
        : (
          <span
            id={field.labelId}
            class='ns-secret-field__label'
            data-scope='secret-field'
            data-part='label'
          >
            <span>{label}</span>
          </span>
        )}

      <div
        class='ns-secret-field__control'
        data-scope='secret-field'
        data-part='control'
        role={field.isEditable ? undefined : 'group'}
        aria-labelledby={field.isEditable ? undefined : field.labelId}
        aria-describedby={field.isEditable ? undefined : describedBy}
      >
        <span
          class='ns-secret-field__icon'
          data-scope='secret-field'
          data-part='icon'
          aria-hidden='true'
        >
          <Icon name={field.state === 'readonly' ? 'lock' : 'key-round'} size='1em' />
        </span>

        <span
          class='ns-secret-field__value'
          data-scope='secret-field'
          data-part='value'
        >
          {field.isEditable
            ? (
              <input
                {...field.getInputProps({
                  class: 'ns-secret-field__input',
                  placeholder: placeholder ??
                    (field.state === 'rotating' || field.state === 'invalid'
                      ? 'Enter new secret'
                      : 'No value stored'),
                  'aria-describedby': helpId,
                  'data-scope': 'secret-field',
                  'data-part': 'input',
                })}
              />
            )
            : field.hasStoredValue && !field.isCleared
            ? (
              <span
                class='ns-secret-field__mask'
                data-scope='secret-field'
                data-part='mask'
                aria-hidden='true'
              />
            )
            : (
              <span
                class='ns-secret-field__placeholder'
                data-scope='secret-field'
                data-part='placeholder'
              >
                {placeholder ?? 'No value stored'}
              </span>
            )}
        </span>

        <span
          id={field.statusId}
          class='ns-secret-field__status'
          data-scope='secret-field'
          data-part='status'
          data-state={field.state}
        >
          <span
            class='ns-secret-field__status-dot'
            data-scope='secret-field'
            data-part='status-dot'
            aria-hidden='true'
          />
          <span>{statusText}</span>
        </span>

        {field.state !== 'readonly' && (
          <span
            class='ns-secret-field__actions'
            data-scope='secret-field'
            data-part='actions'
          >
            {field.state === 'set' && allowReplace && (
              <button
                {...field.getReplaceButtonProps({
                  class: 'ns-secret-field__action',
                  'aria-label': `${replaceLabel} ${label}`,
                  'data-scope': 'secret-field',
                  'data-part': 'action',
                  'data-action': 'replace',
                })}
              >
                {replaceLabel}
              </button>
            )}
            {(field.state === 'rotating' || field.state === 'invalid') &&
              (field.hasStoredValue || field.hasDraft) && (
              <button
                {...field.getCancelButtonProps({
                  class: 'ns-secret-field__action',
                  'aria-label': `${cancelLabel} ${label}`,
                  'data-scope': 'secret-field',
                  'data-part': 'action',
                  'data-action': 'cancel',
                })}
              >
                {cancelLabel}
              </button>
            )}
            {field.state === 'unset' && field.isCleared && field.hasStoredValue && (
              <button
                {...field.getRestoreButtonProps({
                  class: 'ns-secret-field__action',
                  'aria-label': `${keepLabel} ${label}`,
                  'data-scope': 'secret-field',
                  'data-part': 'action',
                  'data-action': 'keep',
                })}
              >
                {keepLabel}
              </button>
            )}
            {showClear &&
              (field.state === 'set' ||
                ((field.state === 'rotating' || field.state === 'invalid') &&
                  field.hasStoredValue)) &&
              (
                <button
                  {...field.getClearButtonProps({
                    class: 'ns-secret-field__action',
                    'aria-label': `${clearLabel} ${label}`,
                    'data-scope': 'secret-field',
                    'data-part': 'action',
                    'data-action': 'clear',
                  })}
                >
                  {clearLabel}
                </button>
              )}
          </span>
        )}
      </div>

      {hiddenProps && <input {...hiddenProps} />}
      {actionInputProps && <input {...actionInputProps} />}

      {error
        ? (
          <p
            id={field.errorId}
            class='ns-secret-field__error'
            data-scope='secret-field'
            data-part='error'
            role='alert'
          >
            {error}
          </p>
        )
        : helpText
        ? (
          <p
            id={helpId}
            class='ns-secret-field__help'
            data-scope='secret-field'
            data-part='description'
          >
            {helpText}
          </p>
        )
        : null}

      <span
        class='ns-secret-field__sr'
        role='status'
        aria-live='polite'
        aria-atomic='true'
        data-scope='secret-field'
        data-part='live'
      >
        {field.announcement}
      </span>
    </div>
  );
}
