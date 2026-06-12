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

/** JSDoc for exported type `FormFieldPath`. */
export type FormFieldPath = string;
/** JSDoc for exported type `CollectionKeyMap`. */
export type CollectionKeyMap = Record<string, string>;

/** JSDoc for exported type `FormErrorMessages`. */
export type FormErrorMessages = readonly string[];

/**
 * Canonical field and form error map for submitted values.
 */
export type FormFieldErrors<TValues extends FormValues> =
  & Partial<Record<Extract<keyof TValues, string>, string[]>>
  & {
    _form: string[];
  };

/** JSDoc for exported interface `FieldConstraints`. */
export interface FieldConstraints {
  /** Property `required`. */
  readonly required?: boolean;
  /** Property `minLength`. */
  readonly minLength?: number;
  /** Property `maxLength`. */
  readonly maxLength?: number;
  /** Property `minItems`. */
  readonly minItems?: number;
  /** Property `maxItems`. */
  readonly maxItems?: number;
  /** Property `min`. */
  readonly min?: number | string;
  /** Property `max`. */
  readonly max?: number | string;
  /** Property `pattern`. */
  readonly pattern?: string;
  /** Property `step`. */
  readonly step?: number | string;
  /** Property `multiple`. */
  readonly multiple?: boolean;
}

/** JSDoc for exported interface `FormElementProps`. */
export interface FormElementProps {
  /** Property `id`. */
  readonly id: string;
  /** Property `action`. */
  readonly action: string;
  /** Property `method`. */
  readonly method: string;
  /** Property `noValidate`. */
  readonly noValidate: boolean;
}

/** JSDoc for exported interface `FormCsrfInputProps`. */
export interface FormCsrfInputProps {
  /** Property `type`. */
  readonly type: 'hidden';
  /** Property `name`. */
  readonly name: string;
  /** Property `value`. */
  readonly value: string;
}

/** JSDoc for exported interface `CollectionKeyInputProps`. */
export interface CollectionKeyInputProps {
  /** Property `type`. */
  readonly type: 'hidden';
  /** Property `name`. */
  readonly name: string;
  /** Property `value`. */
  readonly value: string;
  /** Property `form`. */
  readonly form: string;
}

/** JSDoc for exported interface `LabelProps`. */
export interface LabelProps {
  /** Property `for`. */
  readonly for: string;
}

/** JSDoc for exported interface `ErrorProps`. */
export interface ErrorProps {
  /** Property `id`. */
  readonly id: string;
  /** Property `role`. */
  readonly role: 'alert';
  readonly 'aria-live': 'polite';
}

/** JSDoc for exported interface `DescriptionProps`. */
export interface DescriptionProps {
  /** Property `id`. */
  readonly id: string;
}

/** JSDoc for exported interface `ControlProps`. */
export interface ControlProps {
  /** Property `id`. */
  readonly id: string;
  /** Property `name`. */
  readonly name: string;
  /** Property `form`. */
  readonly form: string;
  /** Property `defaultValue`. */
  readonly defaultValue?: string;
  /** Property `defaultChecked`. */
  readonly defaultChecked?: boolean;
  /** Property `value`. */
  readonly value?: string;
  /** Property `checked`. */
  readonly checked?: boolean;
  readonly 'aria-invalid'?: boolean;
  readonly 'aria-describedby'?: string;
  readonly 'aria-required'?: boolean;
  /** Property `required`. */
  readonly required?: boolean;
  /** Property `minLength`. */
  readonly minLength?: number;
  /** Property `maxLength`. */
  readonly maxLength?: number;
  /** Property `min`. */
  readonly min?: number | string;
  /** Property `max`. */
  readonly max?: number | string;
  /** Property `pattern`. */
  readonly pattern?: string;
  /** Property `step`. */
  readonly step?: number | string;
  /** Property `multiple`. */
  readonly multiple?: boolean;
  /** Property `formNoValidate`. */
  readonly formNoValidate?: boolean;
  /** Property `type`. */
  readonly type?: JSX.HTMLInputTypeAttribute;
  /** Property `disabled`. */
  readonly disabled?: boolean;
  /** Property `readOnly`. */
  readonly readOnly?: boolean;
  /** Property `placeholder`. */
  readonly placeholder?: string;
  /** Property `inputMode`. */
  readonly inputMode?: string;
  /** Property `rows`. */
  readonly rows?: number;
  /** Property `cols`. */
  readonly cols?: number;
  /** Property `autocomplete`. */
  readonly autocomplete?: string;
  /** Property `spellCheck`. */
  readonly spellCheck?: boolean;
  /** Property `accept`. */
  readonly accept?: string;
  /** Property `formAction`. */
  readonly formAction?: string;
  /** Property `formMethod`. */
  readonly formMethod?: string;
  /** Property `formTarget`. */
  readonly formTarget?: string;
  /** Property `formEncType`. */
  readonly formEncType?: string;
  /** Property `formNoValidateButton`. */
  readonly formNoValidateButton?: boolean;
  /** Property `list`. */
  readonly list?: string;
  /** Property `role`. */
  readonly role?: string;
  /** Property `tabIndex`. */
  readonly tabIndex?: number;
  readonly 'data-field-path'?: string;
  readonly 'data-field-invalid'?: 'true' | 'false';
  readonly 'data-field-dirty'?: 'true' | 'false';
  readonly 'data-form-id'?: string;
  readonly 'data-intent'?: string;
  readonly 'data-collection-name'?: string;
  readonly 'data-collection-index'?: string;
}

/** JSDoc for exported interface `IntentButtonProps`. */
export interface IntentButtonProps {
  /** Property `type`. */
  readonly type: 'submit';
  /** Property `name`. */
  readonly name: '__intent__';
  /** Property `value`. */
  readonly value: string;
  /** Property `formNoValidate`. */
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

/** JSDoc for exported interface `FormIntentResult`. */
export interface FormIntentResult<TValues extends FormValues> {
  /** Property `values`. */
  readonly values: TValues;
  /** Property `formErrors`. */
  readonly formErrors?: readonly string[];
  /** Property `fieldErrors`. */
  readonly fieldErrors?: Partial<Record<Extract<keyof TValues, string>, readonly string[]>>;
}

/** JSDoc for exported interface `FormReplyInit`. */
export interface FormReplyInit<TValues extends FormValues> {
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues?: Partial<TValues>;
  /** Property `intent`. */
  readonly intent?: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken?: string;
  /** Property `collectionKeys`. */
  readonly collectionKeys?: CollectionKeyMap;
}

/** JSDoc for exported interface `InvalidFormReplyInit`. */
export interface InvalidFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors?: readonly string[];
}

/** JSDoc for exported interface `SuccessFormReplyInit`. */
export interface SuccessFormReplyInit<TValues extends FormValues, TOutput>
  extends FormReplyInit<TValues> {
  /** Property `output`. */
  readonly output: TOutput;
  /** Property `message`. */
  readonly message?: string;
  /** Property `nextValues`. */
  readonly nextValues?: Partial<TValues>;
}

/** JSDoc for exported interface `ErrorFormReplyInit`. */
export interface ErrorFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
}

/** JSDoc for exported interface `RedirectFormReplyInit`. */
export interface RedirectFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  /** Property `location`. */
  readonly location: string;
  /** Property `status`. */
  readonly status?: 303 | 307 | 308;
}

/** JSDoc for exported interface `FormSubmissionInitialResult`. */
export interface FormSubmissionInitialResult<TValues extends FormValues> {
  /** Property `status`. */
  readonly status: 'initial';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `collectionKeys`. */
  readonly collectionKeys: CollectionKeyMap;
}

/** JSDoc for exported interface `FormSubmissionInvalidResult`. */
export interface FormSubmissionInvalidResult<TValues extends FormValues> {
  /** Property `status`. */
  readonly status: 'invalid';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `collectionKeys`. */
  readonly collectionKeys: CollectionKeyMap;
}

/** JSDoc for exported interface `FormSubmissionSuccessResult`. */
export interface FormSubmissionSuccessResult<TValues extends FormValues, TOutput = unknown> {
  /** Property `status`. */
  readonly status: 'success';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `collectionKeys`. */
  readonly collectionKeys: CollectionKeyMap;
  /** Property `output`. */
  readonly output: TOutput;
  /** Property `message`. */
  readonly message?: string;
  /** Property `nextValues`. */
  readonly nextValues?: Partial<TValues>;
}

/** JSDoc for exported interface `FormSubmissionErrorResult`. */
export interface FormSubmissionErrorResult<TValues extends FormValues> {
  /** Property `status`. */
  readonly status: 'error';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `collectionKeys`. */
  readonly collectionKeys: CollectionKeyMap;
}

/** JSDoc for exported interface `FormSubmissionRedirectResult`. */
export interface FormSubmissionRedirectResult<TValues extends FormValues> {
  /** Property `status`. */
  readonly status: 'redirect';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `collectionKeys`. */
  readonly collectionKeys: CollectionKeyMap;
  /** Property `location`. */
  readonly location: string;
  /** Property `redirectStatus`. */
  readonly redirectStatus: 303 | 307 | 308;
}

/** JSDoc for exported type `FormSubmissionResult`. */
export type FormSubmissionResult<TValues extends FormValues, TOutput = unknown> =
  | FormSubmissionInitialResult<TValues>
  | FormSubmissionInvalidResult<TValues>
  | FormSubmissionSuccessResult<TValues, TOutput>
  | FormSubmissionErrorResult<TValues>
  | FormSubmissionRedirectResult<TValues>;

/** JSDoc for exported interface `FieldDescriptor`. */
export interface FieldDescriptor<TValue = unknown> {
  /** Property `name`. */
  readonly name: FormFieldPath;
  /** Property `id`. */
  readonly id: string;
  /** Property `key`. */
  readonly key: string;
  /** Property `formId`. */
  readonly formId: string;
  /** Property `value`. */
  readonly value: TValue | undefined;
  /** Property `initialValue`. */
  readonly initialValue: TValue | undefined;
  /** Property `defaultValue`. */
  readonly defaultValue: TValue | undefined;
  /** Property `errors`. */
  readonly errors: readonly string[];
  /** Property `error`. */
  readonly error: string | undefined;
  /** Property `invalid`. */
  readonly invalid: boolean;
  /** Property `valid`. */
  readonly valid: boolean;
  /** Property `required`. */
  readonly required: boolean;
  /** Property `dirty`. */
  readonly dirty: boolean;
  /** Property `constraints`. */
  readonly constraints: FieldConstraints;
  /** Property `errorId`. */
  readonly errorId: string;
  /** Property `descriptionId`. */
  readonly descriptionId: string;
  controlProps<TOverrides extends Record<string, unknown> = Record<string, never>>(
    /** Property `overrides`. */
    overrides?: TOverrides,
  ): ControlProps & TOverrides;
  /** Property `labelProps`. */
  readonly labelProps: LabelProps;
  /** Property `errorProps`. */
  readonly errorProps: ErrorProps;
  /** Property `descriptionProps`. */
  readonly descriptionProps: DescriptionProps;
}

/** JSDoc for exported interface `CollectionItem`. */
export interface CollectionItem<TItem> {
  /** Property `key`. */
  readonly key: string;
  /** Property `index`. */
  readonly index: number;
  /** Property `keyInputProps`. */
  readonly keyInputProps: CollectionKeyInputProps;
  /** Property `fields`. */
  readonly fields: TItem extends object ? FieldDescriptorMap<TItem>
    : FieldDescriptor<TItem>;
}

/** JSDoc for exported interface `CollectionDescriptor`. */
export interface CollectionDescriptor<TItem> {
  /** Property `name`. */
  readonly name: string;
  /** Property `list`. */
  readonly list: ReadonlyArray<CollectionItem<TItem>>;
  /** Property `length`. */
  readonly length: number;
  /** Property `errors`. */
  readonly errors: readonly string[];
  /** Property `error`. */
  readonly error: string | undefined;
  /** Property `minItems`. */
  readonly minItems?: number;
  /** Property `maxItems`. */
  readonly maxItems?: number;
  /** Property `errorId`. */
  readonly errorId: string;
  /** Property `descriptionId`. */
  readonly descriptionId: string;
  /** Property `errorProps`. */
  readonly errorProps: ErrorProps;
  /** Property `descriptionProps`. */
  readonly descriptionProps: DescriptionProps;
  addButtonProps(opts?: { defaultValue?: Partial<TItem> }): IntentButtonProps;
  removeButtonProps(index: number): IntentButtonProps;
  reorderButtonProps(from: number, to: number): IntentButtonProps;
  duplicateButtonProps(index: number): IntentButtonProps;
}

/** JSDoc for exported type `FieldDescriptorMap`. */
export type FieldDescriptorMap<T> = {
  [K in keyof T & string]: T[K] extends Array<infer U>
    ? CollectionDescriptor<U> & FieldDescriptor<T[K]>
    : T[K] extends object ? FieldDescriptorMap<T[K]> & FieldDescriptor<T[K]>
    : FieldDescriptor<T[K]>;
};

/** JSDoc for exported interface `RuntimeFormState`. */
export interface RuntimeFormState<TValues extends FormValues> {
  /** Property `id`. */
  readonly id: string;
  /** Property `action`. */
  readonly action: string;
  /** Property `method`. */
  readonly method: 'POST' | 'PUT' | 'PATCH';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `hasErrors`. */
  readonly hasErrors: boolean;
  /** Property `submitted`. */
  readonly submitted: boolean;
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `fields`. */
  readonly fields: FieldDescriptorMap<TValues>;
  /** Property `constraints`. */
  readonly constraints: Record<string, FieldConstraints>;
  /** Property `formProps`. */
  readonly formProps: FormElementProps;
  /** Property `csrfInputProps`. */
  readonly csrfInputProps: FormCsrfInputProps;
}

/** JSDoc for exported interface `FormEnhancementSnapshot`. */
export interface FormEnhancementSnapshot<TValues extends FormValues> {
  /** Property `id`. */
  readonly id: string;
  /** Property `action`. */
  readonly action: string;
  /** Property `method`. */
  readonly method: 'POST' | 'PUT' | 'PATCH';
  /** Property `values`. */
  readonly values: TValues;
  /** Property `initialValues`. */
  readonly initialValues: Partial<TValues>;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `hasErrors`. */
  readonly hasErrors: boolean;
  /** Property `submitted`. */
  readonly submitted: boolean;
  /** Property `intent`. */
  readonly intent: FormIntent | null;
  /** Property `submissionId`. */
  readonly submissionId: string;
  /** Property `csrfToken`. */
  readonly csrfToken: string;
  /** Property `constraints`. */
  readonly constraints: Record<string, FieldConstraints>;
  /** Property `formProps`. */
  readonly formProps: FormElementProps;
  /** Property `csrfInputProps`. */
  readonly csrfInputProps: FormCsrfInputProps;
}

/** JSDoc for exported type `FormCollectionStrategyMode`. */
export type FormCollectionStrategyMode = 'server' | 'client' | 'hybrid';

/** JSDoc for exported interface `FormCollectionStrategy`. */
export interface FormCollectionStrategy {
  /** Property `mode`. */
  readonly mode: FormCollectionStrategyMode;
  /** Property `partial`. */
  readonly partial?: string;
  /** Property `clientNav`. */
  readonly clientNav?: boolean;
}

/** JSDoc for exported interface `FormEnhancementOptions`. */
export interface FormEnhancementOptions<TValues extends FormValues> {
  /** Property `partial`. */
  readonly partial?: string;
  /** Property `clientNav`. */
  readonly clientNav?: boolean;
  /** Property `validate`. */
  readonly validate?: 'onSubmit' | 'onBlur' | 'onChange';
  /** Property `schema`. */
  readonly schema?: {
    safeParse(
      /** Property `input`. */
      input: unknown,
    ):
      | { readonly success: true; readonly data: unknown }
      | { readonly success: false; readonly error: unknown };
  };
  /** Property `focusOnError`. */
  readonly focusOnError?: boolean;
  /** Property `onSubmitStart`. */
  readonly onSubmitStart?: () => void;
  /** Property `onSubmitEnd`. */
  readonly onSubmitEnd?: () => void;
  /** Property `collections`. */
  readonly collections?: Partial<Record<Extract<keyof TValues, string>, FormCollectionStrategy>>;
}

/** JSDoc for exported interface `EnhancedFormProps`. */
export interface EnhancedFormProps extends FormElementProps {
  readonly 'f-client-nav'?: boolean;
  readonly 'f-partial'?: string;
  /** Property `onSubmit`. */
  readonly onSubmit?: JSX.GenericEventHandler<HTMLFormElement>;
  /** Property `onBlurCapture`. */
  readonly onBlurCapture?: JSX.FocusEventHandler<HTMLFormElement>;
  /** Property `onInputCapture`. */
  readonly onInputCapture?: JSX.GenericEventHandler<HTMLFormElement>;
  /** Property `ref`. */
  readonly ref?: (element: HTMLFormElement | null) => void;
}

/** JSDoc for exported interface `FormEnhancementState`. */
export interface FormEnhancementState<TValues extends FormValues> {
  /** Property `pending`. */
  readonly pending: boolean;
  /** Property `formProps`. */
  readonly formProps: EnhancedFormProps;
  /** Property `fieldErrors`. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Property `formErrors`. */
  readonly formErrors: readonly string[];
  /** Property `collectionStrategies`. */
  readonly collectionStrategies: Partial<
    Record<Extract<keyof TValues, string>, FormCollectionStrategy>
  >;
  submit(intent?: FormIntent): void;
}

/** JSDoc for exported interface `FormReplyHelpers`. */
export interface FormReplyHelpers<TValues extends FormValues, TOutput = unknown> {
  initial(
    /** Property `init`. */
    init: FormReplyInit<TValues> & { readonly initialValues?: Partial<TValues> },
  ): FormSubmissionInitialResult<TValues>;
  invalid(init: InvalidFormReplyInit<TValues>): FormSubmissionInvalidResult<TValues>;
  success(
    /** Property `init`. */
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
