/**
 * Form submission-id helpers.
 *
 * The forms runtime uses a stable hidden field name for per-submission IDs so
 * later phases can add idempotency storage without changing page contracts.
 *
 * @module
 */

/** Hidden field used to round-trip a submission identifier through form POSTs. */
export const SUBMISSION_ID_FIELD_NAME = '__submission_id__';

/** Create a new form submission identifier. */
export function generateSubmissionId(): string {
  return crypto.randomUUID();
}
