import type { JSX } from 'preact';

/**
 * Shared form type definitions for `@netscript/fresh`.
 *
 * This module defines the canonical type surface for the framework-owned
 * forms subsystem. It intentionally separates:
 *
 * - low-level value/error shapes
 * - schema validation result contracts
 * - canonical submission result states
 * - field/collection metadata contracts
 * - form element and accessibility prop contracts
 *
 * The implementation remains server-first and HTML-native. Progressive
 * enhancement layers must consume these types rather than redefining them.
 *
 * @module
 */

/**
 * Generic constraint for form value objects.
 *
 * Uses `object` rather than `Record<string, unknown>` so concrete interfaces
 * (which lack an explicit index signature) satisfy the constraint without
 * needing `[key: string]: unknown` or `any`. All downstream generics use
 * `Extract<keyof TValues, string>` to access field names, which works
 * correctly with both `object` and narrower interface types.
 */
export type FormValues = object;

/** Mode used by page-owned create/edit forms in the playground consumer. */
export type FormPageMode = 'create' | 'edit';

export type FormFieldPath = string;
export type CollectionKeyMap = Record<string, string>;

export type FormErrorMessages = readonly string[];

/**
 * Canonical field and form error map for submitted values.
 */
export type FormFieldErrors<TValues extends FormValues> =
  & Partial<Record<Extract<keyof TValues, string>, string[]>>
  & {
    _form: string[];
  };

export interface FieldConstraints {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly pattern?: string;
  readonly step?: number | string;
  readonly multiple?: boolean;
}

export interface FormElementProps {
  readonly id: string;
  readonly action: string;
  readonly method: string;
  readonly noValidate: boolean;
}

export interface FormCsrfInputProps {
  readonly type: 'hidden';
  readonly name: string;
  readonly value: string;
}

export interface CollectionKeyInputProps {
  readonly type: 'hidden';
  readonly name: string;
  readonly value: string;
  readonly form: string;
}

export interface LabelProps {
  readonly for: string;
}

export interface ErrorProps {
  readonly id: string;
  readonly role: 'alert';
  readonly 'aria-live': 'polite';
}

export interface DescriptionProps {
  readonly id: string;
}

export interface ControlProps {
  readonly id: string;
  readonly name: string;
  readonly form: string;
  readonly defaultValue?: string;
  readonly defaultChecked?: boolean;
  readonly value?: string;
  readonly checked?: boolean;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-required'?: boolean;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly min?: number | string;
  readonly max?: number | string;
  readonly pattern?: string;
  readonly step?: number | string;
  readonly multiple?: boolean;
  readonly formNoValidate?: boolean;
  readonly type?: JSX.HTMLInputTypeAttribute;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly placeholder?: string;
  readonly inputMode?: string;
  readonly rows?: number;
  readonly cols?: number;
  readonly autocomplete?: string;
  readonly spellCheck?: boolean;
  readonly accept?: string;
  readonly formAction?: string;
  readonly formMethod?: string;
  readonly formTarget?: string;
  readonly formEncType?: string;
  readonly formNoValidateButton?: boolean;
  readonly list?: string;
  readonly role?: string;
  readonly tabIndex?: number;
  readonly 'data-field-path'?: string;
  readonly 'data-field-invalid'?: 'true' | 'false';
  readonly 'data-field-dirty'?: 'true' | 'false';
  readonly 'data-form-id'?: string;
  readonly 'data-intent'?: string;
  readonly 'data-collection-name'?: string;
  readonly 'data-collection-index'?: string;
}

export interface IntentButtonProps {
  readonly type: 'submit';
  readonly name: '__intent__';
  readonly value: string;
  readonly formNoValidate: boolean;
  readonly 'data-intent': string;
  readonly 'data-collection-name'?: string;
  readonly 'data-collection-index'?: string;
}

/**
 * Structured representation of an encoded form intent.
 *
 * Collection operations use the `collection:*` namespace and carry payload
 * metadata such as a collection name, indexes, or default values.
 */
export interface FormIntent {
  /** Intent discriminator understood by the forms pipeline. */
  readonly type: string;
  /** Optional structured metadata carried with the intent. */
  readonly payload?: Record<string, unknown>;
}

export interface FormIntentResult<TValues extends FormValues> {
  readonly values: TValues;
  readonly formErrors?: readonly string[];
  readonly fieldErrors?: Partial<Record<Extract<keyof TValues, string>, readonly string[]>>;
}

export interface FormReplyInit<TValues extends FormValues> {
  readonly values: TValues;
  readonly initialValues?: Partial<TValues>;
  readonly intent?: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken?: string;
  readonly collectionKeys?: CollectionKeyMap;
}

export interface InvalidFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors?: readonly string[];
}

export interface SuccessFormReplyInit<TValues extends FormValues, TOutput>
  extends FormReplyInit<TValues> {
  readonly output: TOutput;
  readonly message?: string;
  readonly nextValues?: Partial<TValues>;
}

export interface ErrorFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  readonly formErrors: readonly string[];
}

export interface RedirectFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  readonly location: string;
  readonly status?: 303 | 307 | 308;
}

export interface FormSubmissionInitialResult<TValues extends FormValues> {
  readonly status: 'initial';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly collectionKeys: CollectionKeyMap;
}

export interface FormSubmissionInvalidResult<TValues extends FormValues> {
  readonly status: 'invalid';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly collectionKeys: CollectionKeyMap;
}

export interface FormSubmissionSuccessResult<TValues extends FormValues, TOutput = unknown> {
  readonly status: 'success';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly collectionKeys: CollectionKeyMap;
  readonly output: TOutput;
  readonly message?: string;
  readonly nextValues?: Partial<TValues>;
}

export interface FormSubmissionErrorResult<TValues extends FormValues> {
  readonly status: 'error';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly collectionKeys: CollectionKeyMap;
}

export interface FormSubmissionRedirectResult<TValues extends FormValues> {
  readonly status: 'redirect';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly collectionKeys: CollectionKeyMap;
  readonly location: string;
  readonly redirectStatus: 303 | 307 | 308;
}

export type FormSubmissionResult<TValues extends FormValues, TOutput = unknown> =
  | FormSubmissionInitialResult<TValues>
  | FormSubmissionInvalidResult<TValues>
  | FormSubmissionSuccessResult<TValues, TOutput>
  | FormSubmissionErrorResult<TValues>
  | FormSubmissionRedirectResult<TValues>;

export interface FieldDescriptor<TValue = unknown> {
  readonly name: FormFieldPath;
  readonly id: string;
  readonly key: string;
  readonly formId: string;
  readonly value: TValue | undefined;
  readonly initialValue: TValue | undefined;
  readonly defaultValue: TValue | undefined;
  readonly errors: readonly string[];
  readonly error: string | undefined;
  readonly invalid: boolean;
  readonly valid: boolean;
  readonly required: boolean;
  readonly dirty: boolean;
  readonly constraints: FieldConstraints;
  readonly errorId: string;
  readonly descriptionId: string;
  controlProps<TOverrides extends Record<string, unknown> = Record<string, never>>(
    overrides?: TOverrides,
  ): ControlProps & TOverrides;
  readonly labelProps: LabelProps;
  readonly errorProps: ErrorProps;
  readonly descriptionProps: DescriptionProps;
}

export interface CollectionItem<TItem> {
  readonly key: string;
  readonly index: number;
  readonly keyInputProps: CollectionKeyInputProps;
  readonly fields: TItem extends object ? FieldDescriptorMap<TItem>
    : FieldDescriptor<TItem>;
}

export interface CollectionDescriptor<TItem> {
  readonly name: string;
  readonly list: ReadonlyArray<CollectionItem<TItem>>;
  readonly length: number;
  readonly errors: readonly string[];
  readonly error: string | undefined;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly errorId: string;
  readonly descriptionId: string;
  readonly errorProps: ErrorProps;
  readonly descriptionProps: DescriptionProps;
  addButtonProps(opts?: { defaultValue?: Partial<TItem> }): IntentButtonProps;
  removeButtonProps(index: number): IntentButtonProps;
  reorderButtonProps(from: number, to: number): IntentButtonProps;
  duplicateButtonProps(index: number): IntentButtonProps;
}

export type FieldDescriptorMap<T> = {
  [K in keyof T & string]: T[K] extends Array<infer U>
    ? CollectionDescriptor<U> & FieldDescriptor<T[K]>
    : T[K] extends object ? FieldDescriptorMap<T[K]> & FieldDescriptor<T[K]>
    : FieldDescriptor<T[K]>;
};

export interface RuntimeFormState<TValues extends FormValues> {
  readonly id: string;
  readonly action: string;
  readonly method: 'POST' | 'PUT' | 'PATCH';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly hasErrors: boolean;
  readonly submitted: boolean;
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly fields: FieldDescriptorMap<TValues>;
  readonly constraints: Record<string, FieldConstraints>;
  readonly formProps: FormElementProps;
  readonly csrfInputProps: FormCsrfInputProps;
}

export interface FormEnhancementSnapshot<TValues extends FormValues> {
  readonly id: string;
  readonly action: string;
  readonly method: 'POST' | 'PUT' | 'PATCH';
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly hasErrors: boolean;
  readonly submitted: boolean;
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly constraints: Record<string, FieldConstraints>;
  readonly formProps: FormElementProps;
  readonly csrfInputProps: FormCsrfInputProps;
}

export type FormCollectionStrategyMode = 'server' | 'client' | 'hybrid';

export interface FormCollectionStrategy {
  readonly mode: FormCollectionStrategyMode;
  readonly partial?: string;
  readonly clientNav?: boolean;
}

export interface FormEnhancementOptions<TValues extends FormValues> {
  readonly partial?: string;
  readonly clientNav?: boolean;
  readonly validate?: 'onSubmit' | 'onBlur' | 'onChange';
  readonly schema?: {
    safeParse(
      input: unknown,
    ):
      | { readonly success: true; readonly data: unknown }
      | { readonly success: false; readonly error: unknown };
  };
  readonly focusOnError?: boolean;
  readonly onSubmitStart?: () => void;
  readonly onSubmitEnd?: () => void;
  readonly collections?: Partial<Record<Extract<keyof TValues, string>, FormCollectionStrategy>>;
}

export interface EnhancedFormProps extends FormElementProps {
  readonly 'f-client-nav'?: boolean;
  readonly 'f-partial'?: string;
  readonly onSubmit?: JSX.GenericEventHandler<HTMLFormElement>;
  readonly onBlurCapture?: JSX.FocusEventHandler<HTMLFormElement>;
  readonly onInputCapture?: JSX.GenericEventHandler<HTMLFormElement>;
  readonly ref?: (element: HTMLFormElement | null) => void;
}

export interface FormEnhancementState<TValues extends FormValues> {
  readonly pending: boolean;
  readonly formProps: EnhancedFormProps;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly collectionStrategies: Partial<
    Record<Extract<keyof TValues, string>, FormCollectionStrategy>
  >;
  submit(intent?: FormIntent): void;
}

export interface FormReplyHelpers<TValues extends FormValues, TOutput = unknown> {
  initial(
    init: FormReplyInit<TValues> & { readonly initialValues?: Partial<TValues> },
  ): FormSubmissionInitialResult<TValues>;
  invalid(init: InvalidFormReplyInit<TValues>): FormSubmissionInvalidResult<TValues>;
  success(
    init: SuccessFormReplyInit<TValues, TOutput>,
  ): FormSubmissionSuccessResult<TValues, TOutput>;
  error(init: ErrorFormReplyInit<TValues>): FormSubmissionErrorResult<TValues>;
  redirect(init: RedirectFormReplyInit<TValues>): FormSubmissionRedirectResult<TValues>;
}

/**
 * Transitional page-form props still consumed by the playground routes while
 * they migrate from legacy page builders to the framework-owned forms API.
 */
export interface FormPageProps<TValues extends FormValues> {
  /** Action URL submitted by the form. */
  readonly action: string;
  /** HTTP method used by the form action. */
  readonly method: 'POST' | 'PUT' | 'PATCH';
  /** Whether the page is creating or editing an entity. */
  readonly mode: FormPageMode;
  /** Optional entity identifier used by edit forms. */
  readonly id?: string;
  /** Current form values rendered by the page. */
  readonly values: Partial<TValues>;
  /** Canonical field and form errors. */
  readonly errors: FormFieldErrors<TValues>;
  /** Hidden submission identifier used for idempotency and tracing. */
  readonly submissionId: string;
  /** Hidden CSRF token for the current rendered form. */
  readonly csrfToken?: string;
}

/**
 * Invalidation context passed to app-owned cache invalidators after a
 * successful form mutation.
 */
export interface FormPageInvalidateContext<
  TResult,
  TValues extends FormValues,
> {
  /** Submitted form input. */
  readonly input: TValues;
  /** Successful mutation result returned by the app. */
  readonly result: TResult;
  /** Request metadata for the completed mutation. */
  readonly mutation: {
    /** Original request object. */
    readonly request: Request;
    /** Fresh route params available during the mutation. */
    readonly params: Record<string, string | undefined>;
    /** Request URL for the mutation. */
    readonly url: URL;
    /** Whether the page was in create or edit mode. */
    readonly mode: FormPageMode;
    /** Optional entity identifier used by edit forms. */
    readonly id?: string;
  };
}
