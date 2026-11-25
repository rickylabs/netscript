/**
 * @component KeyValueEditor
 * @layer 2
 * @depends theme-seed
 * @description Structured key-value table with per-row write-only secret toggle, key validation, and indexed form submission.
 */
import type { JSX, VNode } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import {
  keyValueFieldName,
  type KeyValueRow,
  type KeyValueRowError,
  type KeyValueValidationOptions,
  SECRET_FIELD_CLEAR_TOKEN,
  SECRET_FIELD_UNCHANGED_TOKEN,
  type SecretFieldUnchangedMode,
  useSecretField,
  validateKeyValueRows,
} from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Internal row state holding a stable client key for reconciliation and focus management. */
interface ManagedRow extends KeyValueRow {
  readonly _uid: string;
  readonly _touched?: boolean;
}

/** Props for the {@link KeyValueEditor} component. */
export interface KeyValueEditorProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'id' | 'onChange'> {
  /** Optional base identifier for accessible headings and row errors. */
  id?: string;
  /** Accessible label for the key-value table region. */
  label: string;
  /** Base form field name; rows submit as `${name}[i][key|value|secret|id|action]`. */
  name?: string;
  /** Controlled rows list. */
  rows?: readonly KeyValueRow[];
  /** Initial rows list when uncontrolled. */
  defaultRows?: readonly KeyValueRow[];
  /** Called whenever rows are added, edited, toggled, or removed. */
  onRowsChange?: (rows: readonly KeyValueRow[]) => void;
  /** Optional key pattern (for example `HTTP_HEADER_NAME_PATTERN`). */
  keyPattern?: RegExp | string;
  /** Error message when a key violates `keyPattern`. */
  keyPatternMessage?: string;
  /** Compare duplicate keys case-insensitively. Defaults to `false`. */
  caseInsensitiveKeys?: boolean;
  /** Permit empty keys without reporting an error. Defaults to `false`. */
  allowEmptyKeys?: boolean;
  /** Validate freshly added blank rows immediately. Defaults to `false`. */
  validateEmptyRows?: boolean;
  /** Custom error message for empty keys. */
  emptyKeyMessage?: string;
  /** Custom error message for duplicate keys. */
  duplicateKeyMessage?: string;
  /** Form contract mode for unchanged stored secret rows (`'token'` or `'omit'`). */
  unchangedMode?: SecretFieldUnchangedMode;
  /** Sentinel token submitted when a stored secret row is kept unchanged. */
  unchangedToken?: string;
  /** Sentinel token submitted when a stored secret row is explicitly cleared. */
  clearToken?: string;
  /** Column heading for keys. Defaults to `'Key'`. */
  keyLabel?: string;
  /** Column heading for values. Defaults to `'Value'`. */
  valueLabel?: string;
  /** Column heading for row actions. Defaults to `'Actions'`. */
  actionsLabel?: string;
  /** Placeholder text for key inputs. Defaults to `'Name'`. */
  keyPlaceholder?: string;
  /** Placeholder text for plain value inputs. Defaults to `'Value'`. */
  valuePlaceholder?: string;
  /** Placeholder text for secret value inputs. Defaults to `'Enter secret'`. */
  secretPlaceholder?: string;
  /** Label for the Add row button. Defaults to `'Add row'`. */
  addLabel?: string;
  /** Disables adding, editing, toggling, and removing rows. */
  readOnly?: boolean;
  /** Disables all controls and form submission. */
  disabled?: boolean;
  /** Additional classes merged onto the root element. */
  class?: string;
}

interface SecretRowValueCellProps {
  readonly baseId: string;
  readonly rowIndex: number;
  readonly rowKey: string;
  readonly name?: string;
  readonly row: ManagedRow;
  readonly valueLabel: string;
  readonly secretPlaceholder: string;
  readonly readOnly: boolean;
  readonly disabled: boolean;
  readonly unchangedMode: SecretFieldUnchangedMode;
  readonly unchangedToken: string;
  readonly clearToken: string;
}

/**
 * Secret row value cell composed directly on the L1 {@link useSecretField} behavior
 * so secret rows inherit the exact write-only, no-reveal, and form-contract semantics
 * without any L2-to-L2 import.
 */
function SecretRowValueCell({
  baseId,
  rowIndex,
  rowKey,
  name,
  row,
  valueLabel,
  secretPlaceholder,
  readOnly,
  disabled,
  unchangedMode,
  unchangedToken,
  clearToken,
}: SecretRowValueCellProps): VNode {
  const fieldName = name ? keyValueFieldName(name, rowIndex, 'value') : undefined;
  const actionName = name ? keyValueFieldName(name, rowIndex, 'action') : undefined;
  const effectiveReadOnly = readOnly || Boolean(row.readOnly);
  const field = useSecretField({
    id: `${baseId}-secret-${row._uid}`,
    name: fieldName,
    actionName,
    hasValue: Boolean(row.hasValue),
    state: row.secretState,
    readOnly: effectiveReadOnly,
    disabled,
    unchangedMode,
    unchangedToken,
    clearToken,
    placeholder: secretPlaceholder,
  });

  const hiddenProps = field.getHiddenInputProps();
  const actionInputProps = field.getActionInputProps();
  const rowDescriptor = rowKey.trim() || `row ${rowIndex + 1}`;
  const statusLabel = field.state === 'set'
    ? 'Set'
    : field.state === 'rotating'
    ? 'Rotating'
    : field.state === 'invalid'
    ? 'Invalid'
    : field.state === 'readonly'
    ? (field.hasStoredValue ? 'Set' : 'Not set')
    : field.isCleared
    ? 'Cleared'
    : 'Not set';

  return (
    <div
      ref={field.attachRoot}
      class='ns-kv-editor__secret'
      data-scope='key-value-editor'
      data-part='secret-value'
      data-secret-state={field.state}
    >
      <span class='ns-kv-editor__secret-main'>
        {field.isEditable
          ? (
            <input
              {...field.getInputProps({
                class: 'ns-kv-editor__input ns-kv-editor__input--secret',
                'aria-label': `Row ${rowIndex + 1} ${valueLabel} (secret)`,
                'data-scope': 'key-value-editor',
                'data-part': 'value-input',
              })}
            />
          )
          : field.hasStoredValue && !field.isCleared
          ? (
            <span
              class='ns-kv-editor__mask'
              data-scope='key-value-editor'
              data-part='secret-mask'
              aria-hidden='true'
            />
          )
          : (
            <span class='ns-kv-editor__placeholder' data-part='secret-placeholder'>
              No value stored
            </span>
          )}
      </span>

      <span
        id={field.statusId}
        class='ns-kv-editor__status'
        data-scope='key-value-editor'
        data-part='secret-status'
        data-secret-state={field.state}
      >
        <span class='ns-kv-editor__status-dot' aria-hidden='true' />
        <span>{statusLabel}</span>
      </span>

      {!effectiveReadOnly && (
        <span class='ns-kv-editor__secret-actions'>
          {field.state === 'set' && (
            <>
              <button
                {...field.getReplaceButtonProps({
                  class: 'ns-kv-editor__mini-btn',
                  'aria-label': `Replace secret for ${rowDescriptor}`,
                  'data-scope': 'key-value-editor',
                  'data-part': 'secret-replace',
                })}
              >
                Replace
              </button>
              <button
                {...field.getClearButtonProps({
                  class: 'ns-kv-editor__mini-btn',
                  'aria-label': `Clear secret for ${rowDescriptor}`,
                  'data-scope': 'key-value-editor',
                  'data-part': 'secret-clear',
                })}
              >
                Clear
              </button>
            </>
          )}
          {(field.state === 'rotating' || field.state === 'invalid') &&
            (field.hasStoredValue || field.hasDraft) && (
            <button
              {...field.getCancelButtonProps({
                class: 'ns-kv-editor__mini-btn',
                'aria-label': `Cancel secret replacement for ${rowDescriptor}`,
                'data-scope': 'key-value-editor',
                'data-part': 'secret-cancel',
              })}
            >
              Cancel
            </button>
          )}
          {field.state === 'unset' && field.isCleared && field.hasStoredValue && (
            <button
              {...field.getRestoreButtonProps({
                class: 'ns-kv-editor__mini-btn',
                'aria-label': `Keep stored secret for ${rowDescriptor}`,
                'data-scope': 'key-value-editor',
                'data-part': 'secret-keep',
              })}
            >
              Keep
            </button>
          )}
        </span>
      )}

      {hiddenProps && <input {...hiddenProps} />}
      {actionInputProps && <input {...actionInputProps} />}
    </div>
  );
}

function stripInternal(rows: readonly ManagedRow[]): readonly KeyValueRow[] {
  return rows.map(({ _uid: _u, _touched: _t, ...row }) => row);
}

/**
 * Editable key-value table with per-row write-only secret toggle, key validation,
 * managed add/remove focus, and documented indexed form submission.
 *
 * Hydrate inside a Fresh island for interactive row editing and validation.
 */
export function KeyValueEditor({
  id,
  label,
  name,
  rows: controlledRows,
  defaultRows = [],
  onRowsChange,
  keyPattern,
  keyPatternMessage,
  caseInsensitiveKeys = false,
  allowEmptyKeys = false,
  validateEmptyRows = false,
  emptyKeyMessage,
  duplicateKeyMessage,
  unchangedMode = 'token',
  unchangedToken = SECRET_FIELD_UNCHANGED_TOKEN,
  clearToken = SECRET_FIELD_CLEAR_TOKEN,
  keyLabel = 'Key',
  valueLabel = 'Value',
  actionsLabel = 'Actions',
  keyPlaceholder = 'Name',
  valuePlaceholder = 'Value',
  secretPlaceholder = 'Enter secret',
  addLabel = 'Add row',
  readOnly = false,
  disabled = false,
  class: className,
  ...props
}: KeyValueEditorProps): VNode {
  const generatedId = useId();
  const baseId = id ?? `ns-kv-${generatedId}`;
  const labelId = `${baseId}-label`;
  const uidCounter = useRef(0);
  const nextUid = () => `r${++uidCounter.current}`;

  const [localRows, setLocalRows] = useState<readonly ManagedRow[]>(() =>
    defaultRows.map((row, index) => ({
      ...row,
      _uid: row.id ?? `init-${index}`,
    }))
  );
  const [announcement, setAnnouncement] = useState('');

  const keyInputRefs = useRef(new Map<string, HTMLInputElement | null>());
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const pendingFocus = useRef<{ type: 'row'; uid: string } | { type: 'add' } | null>(null);

  const managedRows: readonly ManagedRow[] = controlledRows
    ? controlledRows.map((row, index) => ({
      ...row,
      _uid: row.id ?? `ctrl-${index}`,
      _touched: true,
    }))
    : localRows;

  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.type === 'row') {
      keyInputRefs.current.get(target.uid)?.focus();
    } else {
      addButtonRef.current?.focus();
    }
  }, [managedRows.length]);

  const commitRows = (next: readonly ManagedRow[]) => {
    if (controlledRows === undefined) setLocalRows(next);
    onRowsChange?.(stripInternal(next));
  };

  const validationOptions: KeyValueValidationOptions = {
    keyPattern,
    keyPatternMessage,
    caseInsensitiveKeys,
    allowEmptyKeys,
    ignoreBlankRows: !validateEmptyRows,
    emptyKeyMessage,
    duplicateKeyMessage,
  };
  const validationErrors = validateKeyValueRows(managedRows, validationOptions);

  const errorsForRow = (index: number, row: ManagedRow): readonly KeyValueRowError[] => {
    const list: KeyValueRowError[] = [...(validationErrors.get(index) ?? [])];
    if (
      !allowEmptyKeys &&
      !validateEmptyRows &&
      row._touched &&
      row.key.trim().length === 0 &&
      !list.some((item) => item.code === 'empty-key')
    ) {
      list.push({ code: 'empty-key', message: emptyKeyMessage ?? 'Key is required.' });
    }
    if (row.error) {
      list.push({ code: 'invalid-key-pattern', message: row.error });
    }
    return list;
  };

  const rowErrorLists = managedRows.map((row, index) => errorsForRow(index, row));
  const hasAnyError = rowErrorLists.some((errors) => errors.length > 0);
  const rootState = disabled
    ? 'disabled'
    : readOnly
    ? 'readonly'
    : hasAnyError
    ? 'invalid'
    : 'rest';

  const handleAddRow = () => {
    if (readOnly || disabled) return;
    const uid = nextUid();
    const next: readonly ManagedRow[] = [
      ...managedRows,
      { key: '', value: '', secret: false, _uid: uid, _touched: false },
    ];
    pendingFocus.current = { type: 'row', uid };
    setAnnouncement(`Added row ${next.length}`);
    commitRows(next);
  };

  const handleRemoveRow = (index: number) => {
    if (readOnly || disabled) return;
    const removed = managedRows[index];
    const next = managedRows.filter((_, i) => i !== index);
    const focusCandidate = next[index] ?? next[index - 1];
    pendingFocus.current = focusCandidate
      ? { type: 'row', uid: focusCandidate._uid }
      : { type: 'add' };
    setAnnouncement(
      removed?.key.trim() ? `Removed row ${removed.key.trim()}` : `Removed row ${index + 1}`,
    );
    commitRows(next);
  };

  const handleKeyInput = (index: number, nextKey: string) => {
    const next = managedRows.map((row, i) =>
      i === index ? { ...row, key: nextKey, _touched: true } : row
    );
    commitRows(next);
  };

  const handleKeyBlur = (index: number) => {
    if (controlledRows !== undefined) return;
    const target = managedRows[index];
    if (!target || target._touched) return;
    setLocalRows(
      managedRows.map((row, i) => i === index ? { ...row, _touched: true } : row),
    );
  };

  const handlePlainValueInput = (index: number, nextValue: string) => {
    const next = managedRows.map((row, i) =>
      i === index ? { ...row, value: nextValue, _touched: true } : row
    );
    commitRows(next);
  };

  const handleToggleSecret = (index: number) => {
    if (readOnly || disabled) return;
    const target = managedRows[index];
    if (!target || target.readOnly) return;
    const nextSecret = !target.secret;
    // Security invariant: switching away from secret never exposes a stored secret;
    // switching into secret clears plain text so no clear-text value lingers.
    const next = managedRows.map((row, i) =>
      i === index
        ? {
          ...row,
          secret: nextSecret,
          value: '',
          hasValue: false,
          secretState: undefined,
          _touched: true,
        }
        : row
    );
    const descriptor = target.key.trim() || `row ${index + 1}`;
    setAnnouncement(
      nextSecret ? `${descriptor} marked as secret` : `${descriptor} changed to plain value`,
    );
    commitRows(next);
  };

  return (
    <div
      {...props}
      id={id}
      class={cn('ns-kv-editor', className)}
      data-scope='key-value-editor'
      data-part='root'
      data-state={rootState}
    >
      <div class='ns-kv-editor__header' data-scope='key-value-editor' data-part='header'>
        <span
          id={labelId}
          class='ns-kv-editor__label'
          data-scope='key-value-editor'
          data-part='label'
        >
          {label}
        </span>
      </div>

      <div class='ns-kv-editor__scroll' data-scope='key-value-editor' data-part='scroll'>
        <table
          class='ns-kv-editor__table'
          aria-labelledby={labelId}
          data-scope='key-value-editor'
          data-part='table'
        >
          <thead>
            <tr>
              <th scope='col' class='ns-kv-editor__col-key'>{keyLabel}</th>
              <th scope='col' class='ns-kv-editor__col-value'>{valueLabel}</th>
              <th scope='col' class='ns-kv-editor__col-actions'>{actionsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {managedRows.length === 0
              ? (
                <tr class='ns-kv-editor__empty-row' data-part='empty'>
                  <td colSpan={3}>No entries yet.</td>
                </tr>
              )
              : managedRows.map((row, index) => {
                const errors = rowErrorLists[index];
                const isRowInvalid = errors.length > 0;
                const rowErrorId = isRowInvalid ? `${baseId}-row-err-${row._uid}` : undefined;
                const rowReadOnly = readOnly || Boolean(row.readOnly);
                const rowDescriptor = row.key.trim() || `row ${index + 1}`;

                return (
                  <tr
                    key={row._uid}
                    class='ns-kv-editor__row'
                    data-scope='key-value-editor'
                    data-part='row'
                    data-secret={row.secret ? 'true' : 'false'}
                    data-invalid={isRowInvalid ? 'true' : undefined}
                  >
                    <td class='ns-kv-editor__cell-key'>
                      <input
                        ref={(node) => {
                          if (node) keyInputRefs.current.set(row._uid, node);
                          else keyInputRefs.current.delete(row._uid);
                        }}
                        type='text'
                        class='ns-kv-editor__input ns-kv-editor__input--key'
                        name={name ? keyValueFieldName(name, index, 'key') : undefined}
                        value={row.key}
                        placeholder={keyPlaceholder}
                        disabled={disabled}
                        readOnly={rowReadOnly}
                        spellcheck={false}
                        aria-label={`Row ${index + 1} ${keyLabel}`}
                        aria-invalid={isRowInvalid ? 'true' : undefined}
                        aria-describedby={rowErrorId}
                        data-scope='key-value-editor'
                        data-part='key-input'
                        onInput={(event) => handleKeyInput(index, event.currentTarget.value)}
                        onBlur={() => handleKeyBlur(index)}
                      />
                      {isRowInvalid && (
                        <p
                          id={rowErrorId}
                          class='ns-kv-editor__row-error'
                          data-scope='key-value-editor'
                          data-part='row-error'
                          role='alert'
                        >
                          {errors[0].message}
                        </p>
                      )}
                    </td>

                    <td class='ns-kv-editor__cell-value'>
                      {row.secret
                        ? (
                          <SecretRowValueCell
                            baseId={baseId}
                            rowIndex={index}
                            rowKey={row.key}
                            name={name}
                            row={row}
                            valueLabel={valueLabel}
                            secretPlaceholder={secretPlaceholder}
                            readOnly={readOnly}
                            disabled={disabled}
                            unchangedMode={unchangedMode}
                            unchangedToken={unchangedToken}
                            clearToken={clearToken}
                          />
                        )
                        : (
                          <input
                            type='text'
                            class='ns-kv-editor__input'
                            name={name ? keyValueFieldName(name, index, 'value') : undefined}
                            value={row.value ?? ''}
                            placeholder={valuePlaceholder}
                            disabled={disabled}
                            readOnly={rowReadOnly}
                            aria-label={`Row ${index + 1} ${valueLabel}`}
                            data-scope='key-value-editor'
                            data-part='value-input'
                            onInput={(event) =>
                              handlePlainValueInput(index, event.currentTarget.value)}
                          />
                        )}
                      {name && (
                        <>
                          <input
                            type='hidden'
                            name={keyValueFieldName(name, index, 'secret')}
                            value={row.secret ? 'true' : 'false'}
                            disabled={disabled}
                          />
                          {row.id !== undefined && (
                            <input
                              type='hidden'
                              name={keyValueFieldName(name, index, 'id')}
                              value={row.id}
                              disabled={disabled}
                            />
                          )}
                        </>
                      )}
                    </td>

                    <td class='ns-kv-editor__cell-actions'>
                      <div class='ns-kv-editor__row-actions'>
                        <button
                          type='button'
                          class='ns-kv-editor__icon-btn'
                          aria-pressed={row.secret ? 'true' : 'false'}
                          aria-label={row.secret
                            ? `Disable secret mode for ${rowDescriptor}`
                            : `Enable secret mode for ${rowDescriptor}`}
                          disabled={disabled || rowReadOnly}
                          data-scope='key-value-editor'
                          data-part='secret-toggle'
                          data-pressed={row.secret ? 'true' : 'false'}
                          onClick={() => handleToggleSecret(index)}
                        >
                          <Icon name={row.secret ? 'lock' : 'lock-open'} size='1em' />
                        </button>
                        <button
                          type='button'
                          class='ns-kv-editor__icon-btn ns-kv-editor__icon-btn--remove'
                          aria-label={`Remove ${rowDescriptor}`}
                          disabled={disabled || rowReadOnly}
                          data-scope='key-value-editor'
                          data-part='remove'
                          onClick={() => handleRemoveRow(index)}
                        >
                          <Icon name='trash' size='1em' />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div class='ns-kv-editor__footer' data-scope='key-value-editor' data-part='footer'>
        {!readOnly && (
          <button
            ref={addButtonRef}
            type='button'
            class='ns-kv-editor__add'
            disabled={disabled}
            data-scope='key-value-editor'
            data-part='add'
            onClick={handleAddRow}
          >
            <Icon name='plus' size='1em' />
            <span>{addLabel}</span>
          </button>
        )}
        <span class='ns-kv-editor__summary' data-scope='key-value-editor' data-part='summary'>
          {managedRows.length === 1 ? '1 row' : `${managedRows.length} rows`}
        </span>
      </div>

      <span
        class='ns-kv-editor__sr'
        role='status'
        aria-live='polite'
        aria-atomic='true'
        data-scope='key-value-editor'
        data-part='live'
      >
        {announcement}
      </span>
    </div>
  );
}
