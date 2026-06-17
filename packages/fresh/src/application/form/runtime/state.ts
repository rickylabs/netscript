import { CSRF_FIELD_NAME } from '../validation/csrf.ts';
import { createEmptyFormErrors, type FormErrors } from '../validation/errors.ts';
import { createFieldDescriptors } from '../field-descriptors/mod.ts';
import { generateSubmissionId } from './idempotency.ts';
import type { FormValues } from './types.ts';
import type {
  FieldConstraints,
  FormFieldErrors,
  FormPageProps,
  FormSubmissionResult,
  RuntimeFormState,
} from './types.ts';

/**
 * Lightweight form state used by the currently shipped helper surface.
 *
 * This remains intentionally small so existing playground routes and components
 * can keep using `resolveFormState()` while the richer RFC-15 form state model
 * is introduced in later slices.
 */
export interface FormState<TValues extends FormValues> {
  /** Current form values. */
  values: Partial<TValues>;
  /** Canonical field and form errors. */
  errors: FormErrors<TValues>;
}

/**
 * Resolve form state from route handler data.
 *
 * If the supplied `data` value structurally matches a `FormState<TValues>`, the
 * returned state preserves the submitted values and errors. Otherwise, a fresh
 * state is created from the provided initial values.
 */
export function resolveFormState<TValues extends FormValues>(
  data: unknown,
  initialValues: Partial<TValues> = {},
): FormState<TValues> {
  if (isFormState<TValues>(data)) {
    return {
      values: data.values ?? initialValues,
      errors: data.errors ?? createEmptyFormErrors<TValues>(),
    };
  }

  return createFormState(initialValues);
}

/**
 * Create a fresh form state with the supplied initial values and no errors.
 */
export function createFormState<TValues extends FormValues>(
  values: Partial<TValues> = {},
  errors: FormErrors<TValues> = createEmptyFormErrors<TValues>(),
): FormState<TValues> {
  return {
    values,
    errors,
  };
}

/**
 * Create the transitional page-form props consumed by current playground
 * components while `withForm()` lands before field-descriptor work.
 */
export function createFormPageProps<TValues extends FormValues>(
  options: {
    action: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    values?: Partial<TValues>;
    errors?: FormFieldErrors<TValues>;
    submissionId?: string;
    csrfToken?: string;
  },
): Omit<FormPageProps<TValues>, 'mode'> {
  return {
    action: options.action,
    method: options.method ?? 'POST',
    values: options.values ?? {},
    errors: options.errors ?? createEmptyFormErrors<TValues>(),
    submissionId: options.submissionId ?? generateSubmissionId(),
    csrfToken: options.csrfToken,
  };
}

/**
 * Resolve the current form-page props from a `withForm()` result or from the
 * supplied initial values when no submission result is present yet.
 */
export function resolveFormPageProps<TValues extends FormValues>(
  data: unknown,
  options: {
    action: string;
    initialValues?: Partial<TValues>;
    method?: 'POST' | 'PUT' | 'PATCH';
    csrfToken?: string;
  },
): Omit<FormPageProps<TValues>, 'mode'> {
  if (isFormSubmissionResult<TValues>(data) && data.status !== 'redirect') {
    return createFormPageProps({
      action: options.action,
      method: options.method,
      values: data.status === 'success' && data.nextValues ? data.nextValues : data.values,
      errors: cloneFormSubmissionErrors(data),
      csrfToken: data.csrfToken || options.csrfToken,
    });
  }

  const state = resolveFormState<TValues>(data, options.initialValues);
  return createFormPageProps({
    action: options.action,
    method: options.method,
    values: state.values,
    errors: state.errors,
    csrfToken: options.csrfToken,
  });
}

/**
 * Resolve the richer RFC-15 runtime form state consumed by `withForm()` layers.
 */
export function resolveRuntimeFormState<TValues extends FormValues, TOutput = unknown>(
  data: Exclude<FormSubmissionResult<TValues, TOutput>, { status: 'redirect' }> | undefined,
  options: {
    id: string;
    action: string;
    method?: 'POST' | 'PUT' | 'PATCH';
    initialValues?: Partial<TValues>;
    defaultValues?: Partial<TValues>;
    constraints?: Partial<Record<string, FieldConstraints>>;
    csrfToken?: string;
  },
): RuntimeFormState<TValues> {
  const method = options.method ?? 'POST';
  const defaultValues = cloneRecord(options.defaultValues ?? {});
  const constraints = cloneConstraintMap(options.constraints ?? {});
  const baseInitialValues = mergeFormValues<TValues>(
    defaultValues,
    options.initialValues,
    data?.initialValues,
  );
  const resolvedValues = data
    ? mergeFormValues<TValues>(
      baseInitialValues,
      data.values,
      data.status === 'success' ? data.nextValues : undefined,
    )
    : cloneRecord(baseInitialValues);
  const initialValues = data?.status === 'success'
    ? cloneRecord(resolvedValues)
    : cloneRecord(baseInitialValues);
  const fieldErrors = data ? cloneFieldErrors(data.fieldErrors) : createEmptyFormErrors<TValues>();
  const formErrors = data ? cloneFormErrors(data.formErrors, data.fieldErrors._form) : [];
  const csrfToken = data?.csrfToken ?? options.csrfToken ?? '';

  return {
    id: options.id,
    action: options.action,
    method,
    values: resolvedValues,
    initialValues,
    fieldErrors,
    formErrors,
    hasErrors: formErrors.length > 0 || hasFieldErrors(fieldErrors),
    submitted: data !== undefined,
    intent: data?.intent ?? null,
    submissionId: data?.submissionId ?? generateSubmissionId(),
    csrfToken,
    fields: createFieldDescriptors({
      formId: options.id,
      values: resolvedValues,
      initialValues,
      defaultValues,
      fieldErrors,
      constraints,
      collectionKeys: data?.collectionKeys ?? {},
    }),
    constraints,
    formProps: {
      id: options.id,
      action: options.action,
      method,
      noValidate: true,
    },
    csrfInputProps: {
      type: 'hidden',
      name: CSRF_FIELD_NAME,
      value: csrfToken,
    },
  };
}

function isFormState<TValues extends FormValues>(
  value: unknown,
): value is Partial<FormState<TValues>> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'values' in value && 'errors' in value;
}

function isFormSubmissionResult<TValues extends FormValues>(
  value: unknown,
): value is FormSubmissionResult<TValues> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { status?: unknown; values?: unknown; submissionId?: unknown };
  return typeof candidate.status === 'string' &&
    typeof candidate.submissionId === 'string' &&
    typeof candidate.values === 'object' &&
    candidate.values !== null;
}

function cloneFormSubmissionErrors<TValues extends FormValues>(
  result: Exclude<FormSubmissionResult<TValues>, { status: 'redirect' }>,
): FormFieldErrors<TValues> {
  return cloneFieldErrors({
    ...result.fieldErrors,
    _form: result.formErrors.length > 0
      ? [...result.formErrors]
      : Array.isArray(result.fieldErrors._form)
      ? [...result.fieldErrors._form]
      : [],
  });
}

function cloneFieldErrors<TValues extends FormValues>(
  fieldErrors: FormFieldErrors<TValues>,
): FormFieldErrors<TValues> {
  const errors = createEmptyFormErrors<TValues>();

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!Array.isArray(messages) || messages.length === 0) {
      continue;
    }

    if (field === '_form') {
      errors._form = [...messages];
      continue;
    }

    errors[field as Extract<keyof TValues, string>] = [...messages] as FormFieldErrors<TValues>[
      Extract<keyof TValues, string>
    ];
  }

  return errors;
}

function cloneFormErrors(
  formErrors: readonly string[],
  fallbackFormErrors: readonly string[] | undefined,
): readonly string[] {
  if (formErrors.length > 0) {
    return [...formErrors];
  }

  return Array.isArray(fallbackFormErrors) ? [...fallbackFormErrors] : [];
}

function hasFieldErrors<TValues extends FormValues>(
  fieldErrors: FormFieldErrors<TValues>,
): boolean {
  return Object.entries(fieldErrors).some(([field, messages]) =>
    field !== '_form' && Array.isArray(messages) && messages.length > 0
  );
}

function mergeFormValues<TValues extends FormValues>(
  ...values: Array<Partial<TValues> | undefined>
): TValues {
  let result: Record<string, unknown> = {};

  for (const value of values) {
    if (!isRecord(value)) {
      continue;
    }

    result = mergeRecords(result, value);
  }

  return result as TValues;
}

function mergeRecords(
  base: Record<string, unknown>,
  next: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = cloneRecord(base);

  for (const [key, nextValue] of Object.entries(next)) {
    const currentValue = result[key];

    if (isRecord(currentValue) && isRecord(nextValue)) {
      result[key] = mergeRecords(currentValue, nextValue);
      continue;
    }

    result[key] = cloneUnknown(nextValue);
  }

  return result;
}

function cloneConstraintMap(
  constraints: Partial<Record<string, FieldConstraints>>,
): Record<string, FieldConstraints> {
  return Object.fromEntries(
    Object.entries(constraints).map(([path, value]) => [path, { ...(value ?? {}) }]),
  );
}

function cloneRecord<T>(value: T): T {
  return cloneUnknown(value) as T;
}

function cloneUnknown(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  return structuredClone(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
