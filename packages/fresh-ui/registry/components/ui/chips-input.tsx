/**
 * @component ChipsInput
 * @layer 2
 * @depends theme-seed
 * @description Wrapping native text input that commits chips on Enter, comma, or paste, with optional validation and Combobox suggestions.
 */
import type { JSX, VNode } from 'preact';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import {
  type ChipsInputInvalidBehavior,
  type ChipsInputItem,
  type ChipsInputSubmitFormat,
  type ChipsInputSuggestion,
  type ChipValidator,
  Combobox,
  commitChipTokens,
  evaluateChipValidation,
  normalizeChipSuggestions,
  splitChipText,
} from '@netscript/fresh-ui/interactive';
import { Icon } from '@netscript/fresh-ui/primitives';
import { cn } from '../../lib/cn.ts';

/** Props for the {@link ChipsInput} component. */
export interface ChipsInputProps extends
  Omit<
    JSX.HTMLAttributes<HTMLDivElement>,
    'class' | 'id' | 'value' | 'defaultValue' | 'onChange'
  > {
  /** Optional base identifier for label, input, and error association. */
  id?: string;
  /** Visible accessible label associated with the text input. */
  label: string;
  /** Form field name; submits committed values as repeated hidden inputs or CSV. */
  name?: string;
  /** Controlled list of chip strings. */
  value?: readonly string[];
  /** Initial list of chip strings when uncontrolled. */
  defaultValue?: readonly string[];
  /** Called whenever committed chips are added or removed. */
  onValueChange?: (values: readonly string[]) => void;
  /** Optional per-chip validator (for example `validateEmailChip`). */
  validate?: ChipValidator;
  /** How invalid tokens are handled on commit: `'mark'` inline or `'reject'`. Defaults to `'mark'`. */
  invalidBehavior?: ChipsInputInvalidBehavior;
  /** Single-key commit delimiters in addition to Enter. Defaults to `[',']`. */
  delimiters?: readonly string[];
  /** Optional paste split regular expression. Defaults to comma, semicolon, and newline splits. */
  pasteSplitPattern?: RegExp;
  /** Optional suggestions rendered through the package-owned L1 `Combobox` seam. */
  suggestions?: readonly ChipsInputSuggestion[];
  /** Empty-state text shown when no suggestions match the current query. */
  emptySuggestionsText?: string;
  /** Permit duplicate chip values. Defaults to `false`. */
  allowDuplicates?: boolean;
  /** Compare duplicates case-insensitively. Defaults to `true`. */
  caseInsensitive?: boolean;
  /** Optional maximum number of committed chips. */
  maxChips?: number;
  /** Commit pending input text when focus leaves the input. Defaults to `false`. */
  commitOnBlur?: boolean;
  /** Hidden input serialization format: `'multiple'` (default) or `'csv'`. */
  submitFormat?: ChipsInputSubmitFormat;
  /** Placeholder text shown inside the native text input. */
  placeholder?: string;
  /** Accessible label for the committed chips list. */
  listLabel?: string;
  /** Validation error message displayed below the control. */
  error?: string;
  /** Helper text displayed below the control when no error is active. */
  helpText?: string;
  /** Explicit visual state override (`'rest' | 'focus' | 'invalid' | 'disabled' | 'readonly'`). */
  state?: 'rest' | 'focus' | 'invalid' | 'disabled' | 'readonly';
  /** Prevents adding or removing chips while remaining readable. */
  readOnly?: boolean;
  /** Disables interaction and form submission. */
  disabled?: boolean;
  /** Additional classes merged onto the root element. */
  class?: string;
}

function toChipItems(
  values: readonly string[],
  validate?: ChipValidator,
): readonly ChipsInputItem[] {
  return values.map((value) => {
    const error = evaluateChipValidation(value, validate);
    return error ? { value, invalid: true, error } : { value };
  });
}

/**
 * Wrapping text input for tags and recipient lists with keyboard chip management,
 * optional per-chip validation, and optional Combobox suggestions.
 *
 * Hydrate inside a Fresh island for interactive chip commit, removal, and suggestions.
 */
export function ChipsInput({
  id,
  label,
  name,
  value: controlledValue,
  defaultValue = [],
  onValueChange,
  validate,
  invalidBehavior = 'mark',
  delimiters = [','],
  pasteSplitPattern,
  suggestions,
  emptySuggestionsText = 'No matching suggestions',
  allowDuplicates = false,
  caseInsensitive = true,
  maxChips,
  commitOnBlur = false,
  submitFormat = 'multiple',
  placeholder = 'Add item',
  listLabel,
  error,
  helpText,
  state: explicitState,
  readOnly = false,
  disabled = false,
  class: className,
  ...props
}: ChipsInputProps): VNode {
  const generatedId = useId();
  const baseId = id ?? `ns-chips-${generatedId}`;
  const inputId = `${baseId}-input`;
  const labelId = `${baseId}-label`;
  const errorId = `${baseId}-error`;
  const helpId = `${baseId}-help`;

  const [localValues, setLocalValues] = useState<readonly string[]>(() => [...defaultValue]);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  const [announcement, setAnnouncement] = useState('');

  const inputRef = useRef<HTMLInputElement | null>(null);
  const chipRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const pendingFocusIndex = useRef<number | 'input' | null>(null);

  const values = controlledValue ?? localValues;
  const items = toChipItems(values, validate);
  const interactive = !disabled && !readOnly && explicitState !== 'disabled' &&
    explicitState !== 'readonly';

  useEffect(() => {
    const target = pendingFocusIndex.current;
    if (target === null) return;
    pendingFocusIndex.current = null;
    if (target === 'input') {
      inputRef.current?.focus();
    } else {
      chipRefs.current[target]?.focus();
    }
  }, [items.length]);

  const invalidChipError = items.find((item) => item.invalid)?.error;
  const activeError = error ?? localError ?? invalidChipError;
  const rootState = disabled || explicitState === 'disabled'
    ? 'disabled'
    : readOnly || explicitState === 'readonly'
    ? 'readonly'
    : activeError || explicitState === 'invalid'
    ? 'invalid'
    : focused || explicitState === 'focus'
    ? 'focus'
    : 'rest';

  const commitTokens = (tokens: readonly string[]): boolean => {
    if (!interactive || tokens.length === 0) return false;
    const result = commitChipTokens(items, tokens, {
      allowDuplicates,
      caseInsensitive,
      maxChips,
      validate,
      invalidBehavior,
    });
    if (result.added.length > 0) {
      const nextValues = result.items.map((item) => item.value);
      if (controlledValue === undefined) setLocalValues(nextValues);
      onValueChange?.(nextValues);
      const invalidAdded = result.added.find((item) => item.invalid);
      setLocalError(invalidAdded?.error);
      setAnnouncement(
        result.added.length === 1
          ? `Added ${result.added[0].value}`
          : `Added ${result.added.length} items`,
      );
      return true;
    }
    if (result.rejected.length > 0) {
      setLocalError(result.rejected[0].reason);
      setAnnouncement(result.rejected[0].reason);
    }
    return false;
  };

  const removeChipAt = (index: number, focusMode: 'input' | 'neighbor') => {
    if (!interactive) return;
    const removed = items[index];
    if (!removed) return;
    const nextValues = values.filter((_, i) => i !== index);
    if (controlledValue === undefined) setLocalValues(nextValues);
    onValueChange?.(nextValues);
    setLocalError(undefined);
    setAnnouncement(`Removed ${removed.value}`);
    if (focusMode === 'input') {
      pendingFocusIndex.current = 'input';
    } else if (nextValues.length === 0) {
      pendingFocusIndex.current = 'input';
    } else {
      pendingFocusIndex.current = Math.min(index, nextValues.length - 1);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent) => {
    if (event.isComposing || !interactive) return;
    const target = event.currentTarget as HTMLInputElement;
    const hasHighlightedSuggestion = Boolean(target.getAttribute('aria-activedescendant'));

    if (event.key === 'Enter') {
      if (hasHighlightedSuggestion) return;
      if (draft.trim().length > 0) {
        event.preventDefault();
        const committed = commitTokens([draft]);
        if (committed) {
          setDraft('');
          setComboOpen(false);
        }
      }
      return;
    }

    if (delimiters.includes(event.key)) {
      event.preventDefault();
      if (draft.trim().length > 0) {
        const committed = commitTokens(splitChipText(draft, delimiters, pasteSplitPattern));
        if (committed) {
          setDraft('');
          setComboOpen(false);
        }
      }
      return;
    }

    if (event.key === 'Backspace' && draft.length === 0 && items.length > 0) {
      event.preventDefault();
      removeChipAt(items.length - 1, 'input');
      return;
    }

    if (
      event.key === 'ArrowLeft' &&
      target.selectionStart === 0 &&
      target.selectionEnd === 0 &&
      items.length > 0
    ) {
      event.preventDefault();
      chipRefs.current[items.length - 1]?.focus();
    }
  };

  const handleInputText = (nextValue: string) => {
    if (!interactive) return;
    setLocalError(undefined);
    const matchedDelimiter = delimiters.find((delimiter) =>
      delimiter.length > 0 && nextValue.includes(delimiter)
    );
    if (matchedDelimiter) {
      const parts = splitChipText(nextValue, delimiters, pasteSplitPattern);
      const endsWithDelimiter = delimiters.some((delimiter) => nextValue.endsWith(delimiter));
      if (endsWithDelimiter) {
        const committed = commitTokens(parts);
        if (committed) setDraft('');
      } else if (parts.length > 1) {
        const tail = parts[parts.length - 1];
        const committed = commitTokens(parts.slice(0, -1));
        if (committed) setDraft(tail);
      } else {
        setDraft(nextValue);
      }
      return;
    }
    setDraft(nextValue);
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (!interactive) return;
    const pasted = event.clipboardData?.getData('text');
    if (!pasted) return;
    const tokens = splitChipText(pasted, delimiters, pasteSplitPattern);
    const hasSplitChars = tokens.length > 1 ||
      delimiters.some((delimiter) => pasted.includes(delimiter)) ||
      /[\r\n;]/.test(pasted);
    if (!hasSplitChars) return;
    event.preventDefault();
    const combined = draft.trim().length > 0 ? [draft.trim(), ...tokens] : tokens;
    const committed = commitTokens(combined);
    if (committed) {
      setDraft('');
      setComboOpen(false);
    }
  };

  const handleChipKeyDown = (index: number, event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      removeChipAt(index, 'neighbor');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) chipRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < items.length - 1) chipRefs.current[index + 1]?.focus();
      else inputRef.current?.focus();
    }
  };

  const normalizedSuggestions = suggestions ? normalizeChipSuggestions(suggestions) : [];
  const committedKeys = new Set(
    items.map((item) => caseInsensitive ? item.value.toLowerCase() : item.value),
  );
  const queryLower = draft.trim().toLowerCase();
  const filteredSuggestions = normalizedSuggestions.filter((entry) => {
    if (entry.disabled) return false;
    const key = caseInsensitive ? entry.value.toLowerCase() : entry.value;
    if (!allowDuplicates && committedKeys.has(key)) return false;
    if (!queryLower) return true;
    return entry.label.toLowerCase().includes(queryLower) ||
      entry.value.toLowerCase().includes(queryLower);
  });

  const describedBy = activeError ? errorId : helpText ? helpId : undefined;
  const controlContent = (
    <div
      class='ns-chips-input__control'
      data-scope='chips-input'
      data-part='control'
      onClick={(event) => {
        if (interactive && event.target === event.currentTarget) {
          inputRef.current?.focus();
        }
      }}
    >
      {items.length > 0 && (
        <div
          role='list'
          aria-label={listLabel ?? `${label} items`}
          class='ns-chips-input__list'
          data-scope='chips-input'
          data-part='list'
        >
          {items.map((item, index) => (
            <span
              key={`${item.value}-${index}`}
              ref={(node) => {
                chipRefs.current[index] = node;
              }}
              role='listitem'
              tabIndex={interactive ? -1 : undefined}
              class='ns-chips-input__chip'
              data-scope='chips-input'
              data-part='chip'
              data-invalid={item.invalid ? 'true' : undefined}
              onKeyDown={(event) => handleChipKeyDown(index, event)}
            >
              <span
                class='ns-chips-input__chip-label'
                data-scope='chips-input'
                data-part='chip-label'
              >
                {item.value}
              </span>
              {interactive && (
                <button
                  type='button'
                  class='ns-chips-input__chip-remove'
                  data-scope='chips-input'
                  data-part='chip-remove'
                  aria-label={`Remove ${item.value}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeChipAt(index, 'neighbor');
                  }}
                >
                  <Icon name='x' size='0.875em' />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {interactive &&
        (suggestions !== undefined
          ? (
            <Combobox.Input
              id={inputId}
              ref={(node: HTMLInputElement | null) => {
                inputRef.current = node;
              }}
              class='ns-chips-input__input'
              type='text'
              value={draft}
              placeholder={items.length === 0 ? placeholder : undefined}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={activeError ? 'true' : undefined}
              aria-describedby={describedBy}
              data-scope='chips-input'
              data-part='input'
              onInput={(event) => handleInputText(event.currentTarget.value)}
              onKeyDown={handleInputKeyDown}
              onPaste={handlePaste}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                if (commitOnBlur && draft.trim().length > 0) {
                  const committed = commitTokens(
                    splitChipText(draft, delimiters, pasteSplitPattern),
                  );
                  if (committed) setDraft('');
                }
              }}
            />
          )
          : (
            <input
              id={inputId}
              ref={inputRef}
              class='ns-chips-input__input'
              type='text'
              value={draft}
              placeholder={items.length === 0 ? placeholder : undefined}
              disabled={disabled}
              readOnly={readOnly}
              aria-invalid={activeError ? 'true' : undefined}
              aria-describedby={describedBy}
              data-scope='chips-input'
              data-part='input'
              onInput={(event) => handleInputText(event.currentTarget.value)}
              onKeyDown={handleInputKeyDown}
              onPaste={handlePaste}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                if (commitOnBlur && draft.trim().length > 0) {
                  const committed = commitTokens(
                    splitChipText(draft, delimiters, pasteSplitPattern),
                  );
                  if (committed) setDraft('');
                }
              }}
            />
          ))}
    </div>
  );

  return (
    <div
      {...props}
      id={id}
      class={cn('ns-chips-input', className)}
      data-scope='chips-input'
      data-part='root'
      data-state={rootState}
    >
      {interactive
        ? (
          <label
            id={labelId}
            htmlFor={inputId}
            class='ns-chips-input__label'
            data-scope='chips-input'
            data-part='label'
          >
            {label}
          </label>
        )
        : (
          <span
            id={labelId}
            class='ns-chips-input__label'
            data-scope='chips-input'
            data-part='label'
          >
            {label}
          </span>
        )}

      {suggestions !== undefined && interactive
        ? (
          <Combobox.Root
            id={`${baseId}-combo`}
            open={comboOpen}
            onOpenChange={setComboOpen}
            inputValue={draft}
            onInputValueChange={setDraft}
            value=''
            onValueChange={(selected) => {
              if (!selected) return;
              const committed = commitTokens([selected]);
              if (committed) {
                setDraft('');
                setComboOpen(false);
                inputRef.current?.focus();
              }
            }}
          >
            {controlContent}
            <Combobox.Content
              class='ns-chips-input__suggestions'
              data-scope='chips-input'
              data-part='suggestions'
            >
              {filteredSuggestions.length > 0
                ? filteredSuggestions.map((entry) => (
                  <Combobox.Item
                    key={entry.value}
                    value={entry.value}
                    class='ns-chips-input__suggestion'
                    data-scope='chips-input'
                    data-part='suggestion'
                  >
                    {entry.label}
                  </Combobox.Item>
                ))
                : (
                  <Combobox.Empty
                    class='ns-chips-input__empty'
                    data-scope='chips-input'
                    data-part='empty'
                  >
                    {emptySuggestionsText}
                  </Combobox.Empty>
                )}
            </Combobox.Content>
          </Combobox.Root>
        )
        : controlContent}

      {name && !disabled &&
        (submitFormat === 'csv'
          ? <input type='hidden' name={name} value={values.join(',')} />
          : values.map((chipValue, index) => (
            <input key={`${chipValue}-${index}`} type='hidden' name={name} value={chipValue} />
          )))}

      {activeError
        ? (
          <p
            id={errorId}
            class='ns-chips-input__error'
            data-scope='chips-input'
            data-part='error'
            role='alert'
          >
            {activeError}
          </p>
        )
        : helpText
        ? (
          <p
            id={helpId}
            class='ns-chips-input__help'
            data-scope='chips-input'
            data-part='description'
          >
            {helpText}
          </p>
        )
        : null}

      <span
        class='ns-chips-input__sr'
        role='status'
        aria-live='polite'
        aria-atomic='true'
        data-scope='chips-input'
        data-part='live'
      >
        {announcement}
      </span>
    </div>
  );
}
