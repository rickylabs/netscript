import { useCallback, useEffect, useId, useRef, useState } from 'preact/hooks';
import { composeEventHandlers } from '../_internal/compose-event-handlers.ts';
import { composeRefs } from '../_internal/compose-refs.ts';
import {
  SECRET_FIELD_CLEAR_TOKEN,
  SECRET_FIELD_UNCHANGED_TOKEN,
  type SecretFieldButtonElementProps,
  type SecretFieldHiddenInputProps,
  type SecretFieldInputElementProps,
  type SecretFieldState,
  type UseSecretFieldOptions,
  type UseSecretFieldReturn,
} from './secret-field.types.ts';
import {
  deriveSecretFieldAction,
  deriveSecretFieldState,
  resolveSecretHiddenValue,
} from './secret-field.utils.ts';

/**
 * L1 headless behavior and prop getters for write-only secret controls.
 *
 * Guarantees write-only hygiene: never accepts or displays a stored value,
 * enforces `type="password"`, `autocomplete="new-password"`, and `spellcheck={false}`,
 * keeps values out of `data-*` and `aria-*` attributes, and scrubs any entered draft
 * immediately after form submission or reset.
 */
export function useSecretField({
  id,
  name,
  actionName,
  hasValue = false,
  state: explicitState,
  readOnly = false,
  disabled = false,
  required = false,
  invalid = false,
  error,
  unchangedMode = 'token',
  unchangedToken = SECRET_FIELD_UNCHANGED_TOKEN,
  clearToken = SECRET_FIELD_CLEAR_TOKEN,
  placeholder,
  onStateChange,
  onDraftChange,
  onClear,
  onCancel,
}: UseSecretFieldOptions = {}): UseSecretFieldReturn {
  const generatedId = useId();
  const baseId = id ?? `ns-secret-${generatedId}`;
  const inputId = `${baseId}-input`;
  const labelId = `${baseId}-label`;
  const statusId = `${baseId}-status`;
  const errorId = `${baseId}-error`;

  const [storedFlag, setStoredFlag] = useState(
    hasValue || explicitState === 'set',
  );
  const [isRotating, setIsRotating] = useState(
    explicitState === 'rotating' || explicitState === 'invalid',
  );
  const [isCleared, setIsCleared] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const rootNodeRef = useRef<HTMLElement | null>(null);
  const inputNodeRef = useRef<HTMLInputElement | null>(null);
  const replaceButtonRef = useRef<HTMLButtonElement | null>(null);
  const focusTargetRef = useRef<'input' | 'replace' | null>(null);
  const stateRef = useRef<SecretFieldState>('unset');
  const actionRef = useRef<'keep' | 'replace' | 'clear' | 'unset'>('unset');

  useEffect(() => {
    setStoredFlag(hasValue || explicitState === 'set');
    if (explicitState === 'rotating' || explicitState === 'invalid') {
      setIsRotating(true);
    } else if (explicitState === 'set' || explicitState === 'readonly') {
      setIsRotating(false);
      setIsCleared(false);
    }
  }, [hasValue, explicitState]);

  const effectiveStored = storedFlag;
  const state = deriveSecretFieldState({
    explicitState,
    readOnly,
    invalid,
    hasError: Boolean(error),
    hasStoredValue: effectiveStored,
    isRotating,
    isCleared,
    hasDraft,
  });
  const isEditable = !readOnly &&
    (state === 'unset' || state === 'rotating' || state === 'invalid');
  const action = deriveSecretFieldAction({
    hasStoredValue: effectiveStored,
    isCleared,
    hasDraft,
    readOnly,
  });
  const hiddenValue = resolveSecretHiddenValue({
    action,
    unchangedMode,
    unchangedToken,
    clearToken,
  });

  stateRef.current = state;
  actionRef.current = action;

  const previousStateRef = useRef<SecretFieldState>(state);
  useEffect(() => {
    if (previousStateRef.current !== state) {
      previousStateRef.current = state;
      onStateChange?.(state);
    }
  }, [state, onStateChange]);

  useEffect(() => {
    const target = focusTargetRef.current;
    if (!target) return;
    focusTargetRef.current = null;
    if (target === 'input') {
      inputNodeRef.current?.focus();
    } else if (target === 'replace') {
      replaceButtonRef.current?.focus();
    }
  }, [state, isEditable]);

  const scrub = useCallback((nextHasStoredValue?: boolean) => {
    if (inputNodeRef.current) {
      inputNodeRef.current.value = '';
    }
    setHasDraft(false);
    setIsRotating(false);
    if (nextHasStoredValue !== undefined) {
      setStoredFlag(nextHasStoredValue);
      setIsCleared(false);
    }
    onDraftChange?.(false);
  }, [onDraftChange]);

  const startRotate = useCallback(() => {
    if (readOnly || disabled) return;
    setIsCleared(false);
    setIsRotating(true);
    setAnnouncement('Entering replacement secret');
    focusTargetRef.current = 'input';
    inputNodeRef.current?.focus();
  }, [readOnly, disabled]);

  const cancelRotate = useCallback(() => {
    if (readOnly || disabled) return;
    if (inputNodeRef.current) {
      inputNodeRef.current.value = '';
    }
    setHasDraft(false);
    setIsRotating(false);
    setIsCleared(false);
    onDraftChange?.(false);
    setAnnouncement(
      effectiveStored ? 'Secret replacement cancelled, stored secret kept' : 'Entry cleared',
    );
    focusTargetRef.current = effectiveStored ? 'replace' : 'input';
    onCancel?.();
  }, [readOnly, disabled, effectiveStored, onDraftChange, onCancel]);

  const clear = useCallback(() => {
    if (readOnly || disabled) return;
    if (inputNodeRef.current) {
      inputNodeRef.current.value = '';
    }
    setHasDraft(false);
    setIsRotating(false);
    setIsCleared(true);
    onDraftChange?.(false);
    setAnnouncement('Stored secret marked for removal');
    focusTargetRef.current = 'input';
    onClear?.();
  }, [readOnly, disabled, onDraftChange, onClear]);

  const restoreStored = useCallback(() => {
    if (readOnly || disabled || !effectiveStored) return;
    if (inputNodeRef.current) {
      inputNodeRef.current.value = '';
    }
    setHasDraft(false);
    setIsRotating(false);
    setIsCleared(false);
    onDraftChange?.(false);
    setAnnouncement('Keeping stored secret');
    focusTargetRef.current = 'replace';
  }, [readOnly, disabled, effectiveStored, onDraftChange]);

  const attachFormListeners = useCallback((node: HTMLElement | null) => {
    rootNodeRef.current = node;
  }, []);

  useEffect(() => {
    const root = rootNodeRef.current;
    const form = root?.closest('form');
    if (!form) return;

    const handleFormSubmit = () => {
      if (stateRef.current === 'invalid') return;
      const submittedAction = actionRef.current;
      // Run after synchronous submit listeners have constructed FormData(form).
      queueMicrotask(() => {
        if (submittedAction === 'replace') {
          scrub(true);
          setAnnouncement('Secret submitted');
        } else if (submittedAction === 'clear') {
          scrub(false);
          setAnnouncement('Secret cleared');
        } else {
          if (inputNodeRef.current) inputNodeRef.current.value = '';
          setHasDraft(false);
        }
      });
    };

    const handleFormReset = () => {
      scrub(hasValue || explicitState === 'set');
      setAnnouncement('Secret field reset');
    };

    form.addEventListener('submit', handleFormSubmit);
    form.addEventListener('reset', handleFormReset);
    return () => {
      form.removeEventListener('submit', handleFormSubmit);
      form.removeEventListener('reset', handleFormReset);
    };
  }, [scrub, hasValue, explicitState, state]);

  const getInputProps = useCallback(
    (overrides: SecretFieldInputElementProps = {}): SecretFieldInputElementProps => {
      const describedByParts = [
        statusId,
        error ? errorId : undefined,
        typeof overrides['aria-describedby'] === 'string'
          ? overrides['aria-describedby']
          : undefined,
      ].filter((part): part is string => Boolean(part));

      // Name the live password input only when it submits a replacement or fresh value.
      const submitDirectly = Boolean(name) &&
        (hasDraft || (!effectiveStored && !isCleared && unchangedMode === 'token'));

      return {
        ...overrides,
        id: overrides.id ?? inputId,
        name: submitDirectly ? name : undefined,
        type: 'password',
        autocomplete: 'new-password',
        spellcheck: false,
        autocapitalize: 'off',
        autocorrect: 'off',
        disabled: disabled || Boolean(overrides.disabled),
        readOnly: readOnly || Boolean(overrides.readOnly),
        required: required && action !== 'keep',
        placeholder: overrides.placeholder ?? placeholder,
        'aria-invalid': state === 'invalid' ? 'true' : undefined,
        'aria-describedby': describedByParts.length > 0 ? describedByParts.join(' ') : undefined,
        onInput: composeEventHandlers(
          overrides.onInput,
          (event: Event) => {
            const target = event.currentTarget as HTMLInputElement | null;
            const nextHasDraft = (target?.value.length ?? 0) > 0;
            if (nextHasDraft !== hasDraft) {
              setHasDraft(nextHasDraft);
              onDraftChange?.(nextHasDraft);
            }
            if (nextHasDraft && !isRotating) {
              setIsRotating(true);
            }
          },
        ),
        onKeyDown: composeEventHandlers(
          overrides.onKeyDown,
          (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isRotating && effectiveStored) {
              event.preventDefault();
              cancelRotate();
            }
          },
        ),
        ref: composeRefs(overrides.ref, (node: HTMLInputElement | null) => {
          inputNodeRef.current = node;
        }),
      };
    },
    [
      action,
      cancelRotate,
      disabled,
      effectiveStored,
      error,
      errorId,
      hasDraft,
      inputId,
      isCleared,
      isRotating,
      name,
      onDraftChange,
      placeholder,
      readOnly,
      required,
      state,
      statusId,
      unchangedMode,
    ],
  );

  const getHiddenInputProps = useCallback((): SecretFieldHiddenInputProps | null => {
    if (!name || disabled || hiddenValue === undefined) return null;
    return {
      type: 'hidden',
      name,
      value: hiddenValue,
    };
  }, [name, disabled, hiddenValue]);

  const getActionInputProps = useCallback((): SecretFieldHiddenInputProps | null => {
    if (!actionName || disabled) return null;
    return {
      type: 'hidden',
      name: actionName,
      value: action,
    };
  }, [actionName, disabled, action]);

  const getReplaceButtonProps = useCallback(
    (overrides: SecretFieldButtonElementProps = {}): SecretFieldButtonElementProps => ({
      ...overrides,
      type: 'button',
      disabled: disabled || readOnly || Boolean(overrides.disabled),
      onClick: composeEventHandlers(overrides.onClick, () => startRotate()),
      ref: composeRefs(overrides.ref, (node: HTMLButtonElement | null) => {
        replaceButtonRef.current = node;
      }),
    }),
    [disabled, readOnly, startRotate],
  );

  const getCancelButtonProps = useCallback(
    (overrides: SecretFieldButtonElementProps = {}): SecretFieldButtonElementProps => ({
      ...overrides,
      type: 'button',
      disabled: disabled || readOnly || Boolean(overrides.disabled),
      onClick: composeEventHandlers(overrides.onClick, () => cancelRotate()),
    }),
    [disabled, readOnly, cancelRotate],
  );

  const getClearButtonProps = useCallback(
    (overrides: SecretFieldButtonElementProps = {}): SecretFieldButtonElementProps => ({
      ...overrides,
      type: 'button',
      disabled: disabled || readOnly || Boolean(overrides.disabled),
      onClick: composeEventHandlers(overrides.onClick, () => clear()),
    }),
    [disabled, readOnly, clear],
  );

  const getRestoreButtonProps = useCallback(
    (overrides: SecretFieldButtonElementProps = {}): SecretFieldButtonElementProps => ({
      ...overrides,
      type: 'button',
      disabled: disabled || readOnly || Boolean(overrides.disabled),
      onClick: composeEventHandlers(overrides.onClick, () => restoreStored()),
    }),
    [disabled, readOnly, restoreStored],
  );

  return {
    state,
    hasStoredValue: effectiveStored,
    isEditable,
    isCleared,
    hasDraft,
    action,
    hiddenValue,
    inputId,
    labelId,
    statusId,
    errorId,
    announcement,
    attachRoot: attachFormListeners,
    startRotate,
    cancelRotate,
    clear,
    restoreStored,
    scrub,
    getInputProps,
    getHiddenInputProps,
    getActionInputProps,
    getReplaceButtonProps,
    getCancelButtonProps,
    getClearButtonProps,
    getRestoreButtonProps,
  };
}
