/**
 * Internal aggregation point for the public form type manifest.
 *
 * This is not a public subpath; `../types.ts` is the stable export surface.
 */

export type {
  CollectionKeyMap,
  FieldConstraints,
  FormErrorMessages,
  FormFieldErrors,
  FormFieldPath,
  FormPageMode,
  FormValues,
} from './value-types.ts';
export type {
  CollectionKeyInputProps,
  ControlProps,
  DescriptionProps,
  EnhancedFormProps,
  ErrorProps,
  FormCsrfInputProps,
  FormElementProps,
  IntentButtonProps,
  LabelProps,
} from './prop-types.ts';
export type {
  ErrorFormReplyInit,
  FormIntent,
  FormIntentResult,
  FormReplyHelpers,
  FormReplyInit,
  FormSubmissionErrorResult,
  FormSubmissionInitialResult,
  FormSubmissionInvalidResult,
  FormSubmissionRedirectResult,
  FormSubmissionResult,
  FormSubmissionSuccessResult,
  InvalidFormReplyInit,
  RedirectFormReplyInit,
  SuccessFormReplyInit,
} from './intent-reply-types.ts';
export type {
  CollectionDescriptor,
  CollectionItem,
  FieldDescriptor,
  FieldDescriptorMap,
} from './descriptor-types.ts';
export type {
  FormCollectionStrategy,
  FormCollectionStrategyMode,
  FormEnhancementOptions,
  FormEnhancementSnapshot,
  FormEnhancementState,
  RuntimeFormState,
} from './runtime-types.ts';
export type { FormPageInvalidateContext, FormPageProps } from './page-types.ts';
