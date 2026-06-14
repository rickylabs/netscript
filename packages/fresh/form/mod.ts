/**
 * Public form surface for `@netscript/fresh`.
 *
 * This entrypoint is intentionally narrow. It exposes the shipped helper
 * surface used by playground consumers while keeping deeper RFC-15 form
 * internals out of the public package contract.
 *
 * @module
 */

export {
  CSRF_COOKIE_NAME,
  CSRF_FIELD_NAME,
  generateCsrfToken,
  readCsrfToken,
  setCsrfCookie,
  verifyCsrfToken,
} from './csrf.ts';
export {
  createEmptyFormErrors,
  firstFieldError,
  type FormErrors,
  type FormSchemaValidationError,
  toFormErrors,
} from './errors.ts';
export {
  applyCollectionStrategy,
  createFormEnhancementSnapshot,
  getSubmissionHiddenInputProps,
  useFormEnhancement,
} from './enhancement.tsx';
export { Form, type FormContent, type FormProps, type FormStateLike } from './form.tsx';
export { FormRegion, type FormRegionProps } from './form-region.tsx';
export { generateSubmissionId, SUBMISSION_ID_FIELD_NAME } from './idempotency.ts';
export {
  applyIntentOperation,
  collectionIntent,
  INTENT_FIELD_NAME,
  parseFormIntent,
  submitIntent,
} from './intent.ts';
export { formDataToRawValues, normalizeFormValues } from './pipeline.ts';
export {
  buildPaginationState,
  type PaginationInput,
  type PaginationState,
  resolvePagination,
} from './pagination.ts';
export {
  createStandardSchemaAdapter,
  type FormSchemaAdapter,
  type FormSchemaParseFailure,
  type FormSchemaParseResult,
  type FormSchemaParseSuccess,
  type SchemaIntrospector,
  type StandardSchemaInput,
  type StandardSchemaIssue,
  type StandardSchemaOutput,
  type StandardSchemaPathSegment,
  type StandardSchemaResult,
  type StandardSchemaV1,
} from './schema-adapter.ts';
export { type FormState, resolveFormState } from './state.ts';
export type {
  CollectionDescriptor,
  CollectionItem,
  CollectionKeyInputProps,
  CollectionKeyMap,
  ControlProps,
  DescriptionProps,
  EnhancedFormProps,
  ErrorFormReplyInit,
  ErrorProps,
  FieldConstraints,
  FieldDescriptor,
  FieldDescriptorMap,
  FormCollectionStrategy,
  FormCollectionStrategyMode,
  FormCsrfInputProps,
  FormElementProps,
  FormEnhancementOptions,
  FormEnhancementSnapshot,
  FormEnhancementState,
  FormErrorMessages,
  FormFieldErrors,
  FormFieldPath,
  FormIntent,
  FormIntentResult,
  FormPageInvalidateContext,
  FormPageMode,
  FormPageProps,
  FormReplyHelpers,
  FormReplyInit,
  FormSubmissionErrorResult,
  FormSubmissionInitialResult,
  FormSubmissionInvalidResult,
  FormSubmissionRedirectResult,
  FormSubmissionResult,
  FormSubmissionSuccessResult,
  FormValues,
  IntentButtonProps,
  InvalidFormReplyInit,
  LabelProps,
  RedirectFormReplyInit,
  RuntimeFormState,
  SuccessFormReplyInit,
} from './types.ts';
