/**
 * Shared form type definitions for `@netscript/fresh`.
 *
 * This module is the public type manifest for the framework-owned forms
 * subsystem. Definitions live in focused internal files so the exported
 * contract stays navigable without changing consumer import paths.
 *
 * @module
 */

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
  FormElementOverrideProps,
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
} from '../_internal/types.ts';
