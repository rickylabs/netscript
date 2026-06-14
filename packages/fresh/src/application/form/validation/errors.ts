/**
 * Error helper types and utilities for `@netscript/fresh/form`.
 *
 * This module owns the baseline field-error model used by the form runtime.
 * It intentionally stays framework-level and transport-agnostic:
 * - field errors are keyed by the submitted values shape
 * - `_form` stores non-field/global errors
 * - Zod-like validation errors can be flattened into the canonical shape
 */

import type { FormValues } from '../runtime/types.ts';

/**
 * Field-level error map produced by validation or error normalization.
 *
 * Each top-level key maps to an array of error messages for that field.
 * The `_form` key stores form-wide errors that are not tied to one field.
 */
export type FormErrors<TValues extends FormValues> =
  & Partial<Record<Extract<keyof TValues, string>, string[]>>
  & {
    _form: string[];
  };

/**
 * Minimal contract for a validation error that can be flattened into
 * field-level and form-level messages.
 *
 * This matches the shape exposed by Zod's `flatten()` result closely enough
 * to keep the form pipeline adapter-friendly.
 */
export interface FormSchemaValidationError<TValues extends FormValues> {
  /** Flatten validation issues into field and form buckets. */
  flatten(): {
    fieldErrors: Partial<Record<Extract<keyof TValues, string>, string[] | undefined>>;
    formErrors: string[];
  };
}

/**
 * Create an empty form error map.
 */
export function createEmptyFormErrors<TValues extends FormValues>(): FormErrors<TValues> {
  return { _form: [] } as FormErrors<TValues>;
}

/**
 * Convert a Zod-like validation error into the canonical `FormErrors<T>` shape.
 */
export function toFormErrors<TValues extends FormValues>(
  error: FormSchemaValidationError<TValues>,
): FormErrors<TValues> {
  const flattened = error.flatten();
  const errors = createEmptyFormErrors<TValues>();

  for (
    const [field, messages] of Object.entries(flattened.fieldErrors) as Array<
      [Extract<keyof TValues, string>, string[] | undefined]
    >
  ) {
    if (messages && messages.length > 0) {
      errors[field] = [...messages] as FormErrors<TValues>[Extract<keyof TValues, string>];
    }
  }

  if (flattened.formErrors.length > 0) {
    errors._form = [...flattened.formErrors];
  }

  return errors;
}

/**
 * Return the first error message for a field, if present.
 */
export function firstFieldError<TValues extends Record<string, unknown>>(
  errors: FormErrors<TValues>,
  field: Extract<keyof TValues, string>,
): string | undefined {
  return errors[field]?.[0];
}

/**
 * Type guard for checking whether an unknown value already looks like
 * a canonical form error map.
 */
export function isFormErrors<TValues extends FormValues>(
  value: unknown,
): value is FormErrors<TValues> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('_form' in value)) {
    return false;
  }

  const candidate = value as { _form?: unknown };
  return Array.isArray(candidate._form) &&
    candidate._form.every((entry) => typeof entry === 'string');
}
