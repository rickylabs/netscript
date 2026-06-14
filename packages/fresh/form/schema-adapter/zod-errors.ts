import type { FormFieldErrors, FormValues } from '../types.ts';

type FlattenedFieldErrors = {
  readonly fieldErrors: Record<string, readonly string[] | undefined>;
  readonly formErrors: readonly string[];
};

export function normalizeZodFieldErrors<TValues extends FormValues>(
  flattened: FlattenedFieldErrors,
): {
  fieldErrors: FormFieldErrors<TValues>;
  formErrors: readonly string[];
} {
  const fieldErrors = createEmptyFieldErrors<TValues>();

  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    if (!Array.isArray(messages) || messages.length === 0) {
      continue;
    }

    fieldErrors[field as Extract<keyof TValues, string>] = [...messages] as FormFieldErrors<
      TValues
    >[Extract<keyof TValues, string>];
  }

  const formErrors = [...flattened.formErrors];
  if (formErrors.length > 0) {
    fieldErrors._form = [...formErrors];
  }

  return {
    fieldErrors,
    formErrors,
  };
}

function createEmptyFieldErrors<TValues extends FormValues>(): FormFieldErrors<TValues> {
  return { _form: [] } as FormFieldErrors<TValues>;
}
