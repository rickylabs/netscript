import { useSignal } from '@preact/signals';
import { formDataToRawValues, normalizeFormValues } from './pipeline.ts';
import { INTENT_FIELD_NAME } from './intent.ts';
import { SUBMISSION_ID_FIELD_NAME } from './idempotency.ts';
import type {
  FormCollectionStrategy,
  FormEnhancementOptions,
  FormEnhancementSnapshot,
  FormEnhancementState,
  FormFieldErrors,
  FormIntent,
  FormValues,
  IntentButtonProps,
  RuntimeFormState,
} from './types.ts';

/** Create a serializable client enhancement snapshot from runtime form state. */
export function createFormEnhancementSnapshot<TValues extends FormValues>(
  state: RuntimeFormState<TValues>,
): FormEnhancementSnapshot<TValues> {
  return {
    id: state.id,
    action: state.action,
    method: state.method,
    values: structuredClone(state.values),
    initialValues: structuredClone(state.initialValues),
    fieldErrors: structuredClone(state.fieldErrors),
    formErrors: [...state.formErrors],
    hasErrors: state.hasErrors,
    submitted: state.submitted,
    intent: state.intent ? structuredClone(state.intent) : null,
    submissionId: state.submissionId,
    csrfToken: state.csrfToken,
    constraints: structuredClone(state.constraints),
    formProps: { ...state.formProps },
    csrfInputProps: { ...state.csrfInputProps },
  };
}

/** Apply collection update navigation metadata to intent button props. */
export function applyCollectionStrategy<TProps extends IntentButtonProps>(
  props: TProps,
  strategy: FormCollectionStrategy | undefined,
): TProps & {
  readonly 'f-client-nav'?: boolean;
  readonly 'f-partial'?: string;
} {
  if (!strategy || strategy.mode === 'client') {
    return props;
  }

  return {
    ...props,
    'f-client-nav': strategy.clientNav ?? true,
    'f-partial': strategy.partial,
  };
}

/** Manage progressive form enhancement state and client-side validation handlers. */
export function useFormEnhancement<TValues extends FormValues>(
  snapshot: FormEnhancementSnapshot<TValues>,
  options: FormEnhancementOptions<TValues> = {},
): FormEnhancementState<TValues> {
  const pending = useSignal(false);
  const fieldErrors = useSignal<FormFieldErrors<TValues>>(structuredClone(snapshot.fieldErrors));
  const formErrors = useSignal<readonly string[]>([...snapshot.formErrors]);
  const formRef = useSignal<HTMLFormElement | null>(null);

  const validateMode = options.validate ?? 'onSubmit';
  const collectionStrategies = options.collections ?? {};

  const validateCurrentForm = (form: HTMLFormElement): boolean => {
    if (!options.schema) {
      return true;
    }

    const values = normalizeFormValues<TValues>(formDataToRawValues(new FormData(form)));
    const result = options.schema.safeParse(values);

    if (result.success) {
      fieldErrors.value = createEmptyFieldErrors(snapshot.fieldErrors);
      formErrors.value = [];
      return true;
    }

    const nextFieldErrors = toClientFieldErrors<TValues>(result.error, snapshot.fieldErrors);
    fieldErrors.value = nextFieldErrors;
    formErrors.value = nextFieldErrors._form;

    if (options.focusOnError ?? true) {
      focusFirstInvalidField(form, nextFieldErrors);
    }

    return false;
  };

  const formProps: FormEnhancementState<TValues>['formProps'] = {
    ...snapshot.formProps,
    'f-client-nav': options.clientNav ?? (options.partial ? true : undefined),
    'f-partial': options.partial,
    ref: (element: HTMLFormElement | null) => {
      formRef.value = element;
    },
    onSubmit: (event) => {
      const form = event.currentTarget;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (!validateCurrentForm(form)) {
        event.preventDefault();
        pending.value = false;
        options.onSubmitEnd?.();
        return;
      }

      pending.value = true;
      options.onSubmitStart?.();
      options.onSubmitEnd?.();
    },
    onBlurCapture: validateMode === 'onBlur'
      ? (event) => {
        const form = event.currentTarget;
        if (form instanceof HTMLFormElement) {
          validateCurrentForm(form);
        }
      }
      : undefined,
    onInputCapture: validateMode === 'onChange'
      ? (event) => {
        const form = event.currentTarget;
        if (form instanceof HTMLFormElement) {
          validateCurrentForm(form);
        }
      }
      : undefined,
  };

  return {
    pending: pending.value,
    formProps,
    fieldErrors: fieldErrors.value,
    formErrors: formErrors.value,
    collectionStrategies,
    submit(intent?: FormIntent): void {
      const form = formRef.value;
      if (!form) {
        return;
      }

      pending.value = true;
      options.onSubmitStart?.();

      if (!intent) {
        form.requestSubmit();
        return;
      }

      const hiddenIntent = globalThis.document.createElement('input');
      hiddenIntent.type = 'hidden';
      hiddenIntent.name = INTENT_FIELD_NAME;
      hiddenIntent.value = JSON.stringify(intent);
      form.appendChild(hiddenIntent);
      form.requestSubmit();
      queueMicrotask(() => hiddenIntent.remove());
    },
  };
}

function createEmptyFieldErrors<TValues extends FormValues>(
  fallback: FormFieldErrors<TValues>,
): FormFieldErrors<TValues> {
  const empty = { _form: [] } as FormFieldErrors<TValues>;

  for (const key of Object.keys(fallback)) {
    if (key !== '_form') {
      empty[key as Extract<keyof TValues, string>] = [] as unknown as FormFieldErrors<TValues>[
        Extract<keyof TValues, string>
      ];
    }
  }

  return empty;
}

function toClientFieldErrors<TValues extends FormValues>(
  error: unknown,
  fallback: FormFieldErrors<TValues>,
): FormFieldErrors<TValues> {
  if (isFlattenableError(error)) {
    const flattened = error.flatten();
    const nextErrors = createEmptyFieldErrors(fallback);

    for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
      if (field === '_form' || !Array.isArray(messages) || messages.length === 0) {
        continue;
      }

      nextErrors[field as Extract<keyof TValues, string>] = [
        ...messages,
      ] as unknown as FormFieldErrors<TValues>[
        Extract<keyof TValues, string>
      ];
    }

    nextErrors._form = [...flattened.formErrors];
    return nextErrors;
  }

  return createEmptyFieldErrors(fallback);
}

function isFlattenableError(
  value: unknown,
): value is {
  flatten(): {
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
  };
} {
  return typeof value === 'object' && value !== null &&
    typeof (value as { flatten?: unknown }).flatten === 'function';
}

function focusFirstInvalidField<TValues extends FormValues>(
  form: HTMLFormElement,
  fieldErrors: FormFieldErrors<TValues>,
): void {
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (field === '_form' || !Array.isArray(messages) || messages.length === 0) {
      continue;
    }

    const control = [...form.elements].find((element) =>
      element instanceof HTMLElement && element.getAttribute('name') === field
    );

    if (control instanceof HTMLElement && typeof control.focus === 'function') {
      control.focus();
      return;
    }
  }
}

/** Return the hidden input props for carrying an idempotent submission id. */
export function getSubmissionHiddenInputProps(submissionId: string): {
  readonly type: 'hidden';
  readonly name: typeof SUBMISSION_ID_FIELD_NAME;
  readonly value: string;
} {
  return {
    type: 'hidden' as const,
    name: SUBMISSION_ID_FIELD_NAME,
    value: submissionId,
  };
}
