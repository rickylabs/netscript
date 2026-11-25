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

function assertNoSecretValueOverrides(overrides: object): void {
  if (
    Reflect.get(overrides, 'value') !== undefined ||
    Reflect.get(overrides, 'defaultValue') !== undefined
  ) {
    throw new TypeError(
      'useSecretField.getInputProps is write-only and forbids passing "value" or "defaultValue". Pass "hasValue" instead.',
    );
  }
}

/**
 * L1 headless behavior and prop getters for write-only secret controls.
 *
 * Guarantees write-only hygiene: never accepts or displays a stored value,
 * enforces `type="password"`, `autocomplete="new-password"`, and `spellcheck={false}`,
 * keeps values out of `data-*` and `aria-*` attributes, and scrubs any entered draft
 * after form serialization (`formdata`) or `reset` without optimistically mutating
 * server-owned stored status.
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
  const [focusSeq, setFocusSeq] = useState(0);
  const [rootNode, setRootNode] = useState<HTMLElement | null>(null);

  const rootNodeRef = useRef<HTMLElement | null>(null);
  const inputNodeRef = useRef<HTMLInputElement | null>(null);
  const replaceButtonRef = useRef<HTMLButtonElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const focusTargetRef = useRef<'input' | 'replace' | null>(null);
  const scrubTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hasDraftRef = useRef(false);

  const cancelPendingScrub = useCallback(() => {
    if (scrubTimerRef.current !== undefined) {
      clearTimeout(scrubTimerRef.current);
      scrubTimerRef.current = undefined;
    }
  }, []);

  const requestFocus = useCallback((target: 'input' | 'replace') => {
    focusTargetRef.current = target;
    setFocusSeq((seq) => seq + 1);
  }, []);

  useEffect(() => {
    setStoredFlag(hasValue || explicitState === 'set');
    setIsCleared(false);
    if (explicitState === 'rotating' || explicitState === 'invalid') {
      setIsRotating(true);
    } else if (explicitState === 'set' || explicitState === 'readonly' || hasValue) {
      setIsRotating(false);
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

  hasDraftRef.current = hasDraft;

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
    } else {
      (replaceButtonRef.current ?? clearButtonRef.current ?? inputNodeRef.current)?.focus();
    }
  }, [focusSeq, state, isEditable]);

  const scrub = useCallback((nextHasStoredValue?: boolean) => {
    cancelPendingScrub();
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
  }, [cancelPendingScrub, onDraftChange]);

  const startRotate = useCallback(() => {
    if (readOnly || disabled) return;
    cancelPendingScrub();
    setIsCleared(false);
    setIsRotating(true);
    setAnnouncement('Entering replacement secret');
    requestFocus('input');
    inputNodeRef.current?.focus();
  }, [cancelPendingScrub, disabled, readOnly, requestFocus]);

  const cancelRotate = useCallback(() => {
    if (readOnly || disabled) return;
    cancelPendingScrub();
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
    requestFocus(effectiveStored ? 'replace' : 'input');
    onCancel?.();
  }, [
    cancelPendingScrub,
    disabled,
    effectiveStored,
    onCancel,
    onDraftChange,
    readOnly,
    requestFocus,
  ]);

  const clear = useCallback(() => {
    if (readOnly || disabled) return;
    cancelPendingScrub();
    if (inputNodeRef.current) {
      inputNodeRef.current.value = '';
    }
    setHasDraft(false);
    setIsRotating(false);
    setIsCleared(true);
    onDraftChange?.(false);
    setAnnouncement('Stored secret marked for removal');
    requestFocus('input');
    onClear?.();
  }, [cancelPendingScrub, disabled, onClear, onDraftChange, readOnly, requestFocus]);

  const restoreStored = useCallback(() => {
    if (readOnly || disabled || !effectiveStored) return;
    cancelPendingScrub();
    if (inputNodeRef.current) {
      inputNodeRef.current.value = '';
    }
    setHasDraft(false);
    setIsRotating(false);
    setIsCleared(false);
    onDraftChange?.(false);
    setAnnouncement('Keeping stored secret');
    requestFocus('replace');
  }, [cancelPendingScrub, disabled, effectiveStored, onDraftChange, readOnly, requestFocus]);

  const attachFormListeners = useCallback((node: HTMLElement | null) => {
    if (rootNodeRef.current === node) return;
    rootNodeRef.current = node;
    setRootNode(node);
  }, []);

  useEffect(() => {
    const form = rootNode?.closest('form');
    if (!form) return;

    const handleFormData = () => {
      // `formdata` fires synchronously after native POST or `new FormData(form)` has
      // captured the control value. Schedule a macrotask to scrub only the local draft
      // (including invalid retries) without racing form serialization or optimistically
      // flipping server-owned stored status.
      const hadDraftAtSerialize = hasDraftRef.current ||
        (inputNodeRef.current?.value.length ?? 0) > 0;
      cancelPendingScrub();
      scrubTimerRef.current = setTimeout(() => {
        scrubTimerRef.current = undefined;
        if (inputNodeRef.current) {
          inputNodeRef.current.value = '';
        }
        setHasDraft(false);
        setIsRotating(false);
        onDraftChange?.(false);
        if (hadDraftAtSerialize) {
          setAnnouncement('Secret draft cleared after submission');
        }
      }, 0);
    };

    const handleFormReset = () => {
      scrub(hasValue || explicitState === 'set');
      setAnnouncement('Secret field reset');
    };

    form.addEventListener('formdata', handleFormData);
    form.addEventListener('reset', handleFormReset);
    return () => {
      cancelPendingScrub();
      form.removeEventListener('formdata', handleFormData);
      form.removeEventListener('reset', handleFormReset);
    };
  }, [cancelPendingScrub, explicitState, hasValue, onDraftChange, rootNode, scrub]);

  const getInputProps = useCallback(
    (overrides: SecretFieldInputElementProps = {}): SecretFieldInputElementProps => {
      assertNoSecretValueOverrides(overrides);
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
        id: overrides.id ?? inputId,
        class: overrides.class,
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
        'aria-label': overrides['aria-label'],
        'data-scope': overrides['data-scope'],
        'data-part': overrides['data-part'],
        onInput: composeEventHandlers(
          overrides.onInput,
          (event: Event) => {
            cancelPendingScrub();
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
      cancelPendingScrub,
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
      ref: composeRefs(overrides.ref, (node: HTMLButtonElement | null) => {
        clearButtonRef.current = node;
      }),
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
