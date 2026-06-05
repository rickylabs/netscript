/**
 * Normalize thrown errors into canonical form submission results.
 *
 * This keeps the higher-level forms pipeline small by centralizing the logic
 * that distinguishes validation failures from operational failures.
 *
 * @module
 */

import { type FormSchemaValidationError, toFormErrors } from './errors.ts';
import { replyFor } from './reply.ts';
import type {
  CollectionKeyMap,
  FormIntent,
  FormSubmissionErrorResult,
  FormSubmissionInvalidResult,
  FormValues,
} from './types.ts';

/** Fallback message used when a thrown value is not an `Error` instance. */
export const UNKNOWN_FORM_ERROR_MESSAGE = 'Something went wrong while submitting the form.';

/** Optional metadata preserved while normalizing a thrown form error. */
export interface NormalizeFormErrorOptions<TValues extends FormValues> {
  /** Current CSRF token that should survive the normalized result. */
  readonly csrfToken?: string;
  /** Initial values used to rebuild the next rendered form state. */
  readonly initialValues?: Partial<TValues>;
  /** Parsed intent that should survive the normalized result. */
  readonly intent?: FormIntent | null;
  /** Stable collection-item keys that should survive the normalized result. */
  readonly collectionKeys?: CollectionKeyMap;
}

/** Normalize a thrown error into the canonical forms result union. */
export function normalizeFormError<TValues extends FormValues>(
  error: unknown,
  values: TValues,
  submissionId: string,
  options: NormalizeFormErrorOptions<TValues> = {},
): FormSubmissionInvalidResult<TValues> | FormSubmissionErrorResult<TValues> {
  const reply = replyFor<TValues>();

  if (isFormSchemaValidationError<TValues>(error)) {
    const fieldErrors = toFormErrors(error);
    return reply.invalid({
      values,
      initialValues: options.initialValues,
      intent: options.intent,
      submissionId,
      csrfToken: options.csrfToken,
      collectionKeys: options.collectionKeys,
      fieldErrors,
      formErrors: fieldErrors._form,
    });
  }

  if (error instanceof Error) {
    return reply.error({
      values,
      initialValues: options.initialValues,
      intent: options.intent,
      submissionId,
      csrfToken: options.csrfToken,
      collectionKeys: options.collectionKeys,
      formErrors: [error.message],
    });
  }

  return reply.error({
    values,
    initialValues: options.initialValues,
    intent: options.intent,
    submissionId,
    csrfToken: options.csrfToken,
    collectionKeys: options.collectionKeys,
    formErrors: [UNKNOWN_FORM_ERROR_MESSAGE],
  });
}

function isFormSchemaValidationError<TValues extends FormValues>(
  value: unknown,
): value is FormSchemaValidationError<TValues> {
  return typeof value === 'object' &&
    value !== null &&
    'flatten' in value &&
    typeof (value as { flatten?: unknown }).flatten === 'function';
}
