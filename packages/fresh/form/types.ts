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

/** Dot-path name for a field in nested form values. */
export type FormFieldPath = string;

/** Stable collection item keys by collection field path. */
export type CollectionKeyMap = Record<string, string>;

/** Ordered validation messages for a field or form. */
export type FormErrorMessages = readonly string[];

/**
 * Canonical field and form error map for submitted values.
 */
export type FormFieldErrors<TValues extends FormValues> =
  & Partial<Record<Extract<keyof TValues, string>, string[]>>
  & {
    /** Form-level validation errors not tied to a single field. */
    _form: string[];
  };

/** HTML constraint attributes derived from a schema field. */
export interface FieldConstraints {
  /** Whether the field is required. */
  readonly required?: boolean;
  /** Minimum string length. */
  readonly minLength?: number;
  /** Maximum string length. */
  readonly maxLength?: number;
  /** Minimum collection item count. */
  readonly minItems?: number;
  /** Maximum collection item count. */
  readonly maxItems?: number;
  /** Minimum numeric or date-like value. */
  readonly min?: number | string;
  /** Maximum numeric or date-like value. */
  readonly max?: number | string;
  /** HTML pattern constraint. */
  readonly pattern?: string;
  /** HTML step constraint. */
  readonly step?: number | string;
  /** Whether the control accepts multiple values. */
  readonly multiple?: boolean;
}

/** Props applied to the root form element. */
export interface FormElementProps {
  /** DOM id for the form element. */
  readonly id: string;
  /** Submission URL. */
  readonly action: string;
  /** HTTP method used by the form. */
  readonly method: string;
  /** Disable native browser validation when framework validation owns errors. */
  readonly noValidate: boolean;
}

/** Props for the hidden CSRF token input. */
export interface FormCsrfInputProps {
  /** Hidden input type. */
  readonly type: 'hidden';
  /** CSRF field name. */
  readonly name: string;
  /** CSRF token value. */
  readonly value: string;
}

/** Props for a hidden collection-key input. */
export interface CollectionKeyInputProps {
  /** Hidden input type. */
  readonly type: 'hidden';
  /** Collection key field name. */
  readonly name: string;
  /** Stable collection item key. */
  readonly value: string;
  /** Owning form id. */
  readonly form: string;
}

/** Props applied to a field label. */
export interface LabelProps {
  /** DOM id of the labelled control. */
  readonly for: string;
}

/** Props applied to a field error element. */
export interface ErrorProps {
  /** DOM id for the error element. */
  readonly id: string;
  /** Alert role used by assistive technologies. */
  readonly role: 'alert';
  /** Live-region behavior for updated errors. */
  readonly 'aria-live': 'polite';
}

/** Props applied to a field description element. */
export interface DescriptionProps {
  /** DOM id for the description element. */
  readonly id: string;
}

/** Props applied to an input, select, textarea, or compatible control. */
export interface ControlProps {
  /** DOM id for the control. */
  readonly id: string;
  /** Submitted field name. */
  readonly name: string;
  /** Owning form id. */
  readonly form: string;
  /** Initial string value. */
  readonly defaultValue?: string;
  /** Initial checked state. */
  readonly defaultChecked?: boolean;
  /** Controlled string value. */
  readonly value?: string;
  /** Controlled checked state. */
  readonly checked?: boolean;
  /** Whether the control currently has validation errors. */
  readonly 'aria-invalid'?: boolean;
  /** Space-separated ids describing the control. */
  readonly 'aria-describedby'?: string;
  /** Whether the field is required for assistive technologies. */
  readonly 'aria-required'?: boolean;
  /** Native required constraint. */
  readonly required?: boolean;
  /** Native minimum string length. */
  readonly minLength?: number;
  /** Native maximum string length. */
  readonly maxLength?: number;
  /** Native minimum value. */
  readonly min?: number | string;
  /** Native maximum value. */
  readonly max?: number | string;
  /** Native pattern constraint. */
  readonly pattern?: string;
  /** Native step constraint. */
  readonly step?: number | string;
  /** Native multiple-value flag. */
  readonly multiple?: boolean;
  /** Override form validation for this control. */
  readonly formNoValidate?: boolean;
  /** Input type when rendered as an input element. */
  readonly type?: string;
  /** Disabled control state. */
  readonly disabled?: boolean;
  /** Read-only control state. */
  readonly readOnly?: boolean;
  /** Placeholder text. */
  readonly placeholder?: string;
  /** Input mode hint. */
  readonly inputMode?: string;
  /** Textarea row count. */
  readonly rows?: number;
  /** Textarea column count. */
  readonly cols?: number;
  /** Autocomplete hint. */
  readonly autocomplete?: string;
  /** Spellcheck hint. */
  readonly spellCheck?: boolean;
  /** Accepted file types for file inputs. */
  readonly accept?: string;
  /** Submitter-specific action URL. */
  readonly formAction?: string;
  /** Submitter-specific method. */
  readonly formMethod?: string;
  /** Submitter-specific target. */
  readonly formTarget?: string;
  /** Submitter-specific encoding. */
  readonly formEncType?: string;
  /** Submitter-specific validation override. */
  readonly formNoValidateButton?: boolean;
  /** Associated datalist id. */
  readonly list?: string;
  /** Optional ARIA role. */
  readonly role?: string;
  /** Optional tab order. */
  readonly tabIndex?: number;
  /** Field path diagnostic marker. */
  readonly 'data-field-path'?: string;
  /** Field validity diagnostic marker. */
  readonly 'data-field-invalid'?: 'true' | 'false';
  /** Field dirtiness diagnostic marker. */
  readonly 'data-field-dirty'?: 'true' | 'false';
  /** Owning form diagnostic marker. */
  readonly 'data-form-id'?: string;
  /** Submit intent diagnostic marker. */
  readonly 'data-intent'?: string;
  /** Collection name diagnostic marker. */
  readonly 'data-collection-name'?: string;
  /** Collection index diagnostic marker. */
  readonly 'data-collection-index'?: string;
}

/** Props for an intent submit button generated by a form field helper. */
export interface IntentButtonProps {
  /** Submit button type. */
  readonly type: 'submit';
  /** Hidden intent field name. */
  readonly name: '__intent__';
  /** Encoded intent value. */
  readonly value: string;
  /** Disable native validation for intent-only operations. */
  readonly formNoValidate: boolean;
  /** Intent diagnostic marker. */
  readonly 'data-intent': string;
  /** Collection name diagnostic marker. */
  readonly 'data-collection-name'?: string;
  /** Collection index diagnostic marker. */
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

/** Result returned after applying an encoded form intent. */
export interface FormIntentResult<TValues extends FormValues> {
  /** Values after the intent operation has been applied. */
  readonly values: TValues;
  /** Optional form-level errors produced by the operation. */
  readonly formErrors?: readonly string[];
  /** Optional field-level errors produced by the operation. */
  readonly fieldErrors?: Partial<Record<Extract<keyof TValues, string>, readonly string[]>>;
}

/** Base input used to construct a form reply state. */
export interface FormReplyInit<TValues extends FormValues> {
  /** Current submitted or initial values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues?: Partial<TValues>;
  /** Parsed form intent, when present. */
  readonly intent?: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token included in the rendered form. */
  readonly csrfToken?: string;
  /** Stable collection item keys by collection path. */
  readonly collectionKeys?: CollectionKeyMap;
}

/** Input used to construct an invalid form reply. */
export interface InvalidFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Optional form-level validation errors. */
  readonly formErrors?: readonly string[];
}

/** Input used to construct a successful form reply. */
export interface SuccessFormReplyInit<TValues extends FormValues, TOutput>
  extends FormReplyInit<TValues> {
  /** Mutation output payload. */
  readonly output: TOutput;
  /** Optional user-facing success message. */
  readonly message?: string;
  /** Optional next values used after success. */
  readonly nextValues?: Partial<TValues>;
}

/** Input used to construct an errored form reply. */
export interface ErrorFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  /** Form-level errors returned by the failed operation. */
  readonly formErrors: readonly string[];
}

/** Input used to construct a redirect form reply. */
export interface RedirectFormReplyInit<TValues extends FormValues> extends FormReplyInit<TValues> {
  /** Redirect location. */
  readonly location: string;
  /** Redirect status. */
  readonly status?: 303 | 307 | 308;
}

/** Initial form submission state. */
export interface FormSubmissionInitialResult<TValues extends FormValues> {
  /** Submission status discriminator. */
  readonly status: 'initial';
  /** Current form values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** Stable collection item keys by collection path. */
  readonly collectionKeys: CollectionKeyMap;
}

/** Invalid form submission state. */
export interface FormSubmissionInvalidResult<TValues extends FormValues> {
  /** Submission status discriminator. */
  readonly status: 'invalid';
  /** Current form values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** Stable collection item keys by collection path. */
  readonly collectionKeys: CollectionKeyMap;
}

/** Successful form submission state. */
export interface FormSubmissionSuccessResult<TValues extends FormValues, TOutput = unknown> {
  /** Submission status discriminator. */
  readonly status: 'success';
  /** Current form values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** Stable collection item keys by collection path. */
  readonly collectionKeys: CollectionKeyMap;
  /** Mutation output payload. */
  readonly output: TOutput;
  /** Optional user-facing success message. */
  readonly message?: string;
  /** Optional next values used after success. */
  readonly nextValues?: Partial<TValues>;
}

/** Errored form submission state. */
export interface FormSubmissionErrorResult<TValues extends FormValues> {
  /** Submission status discriminator. */
  readonly status: 'error';
  /** Current form values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** Stable collection item keys by collection path. */
  readonly collectionKeys: CollectionKeyMap;
}

/** Redirect form submission state. */
export interface FormSubmissionRedirectResult<TValues extends FormValues> {
  /** Submission status discriminator. */
  readonly status: 'redirect';
  /** Current form values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** Stable collection item keys by collection path. */
  readonly collectionKeys: CollectionKeyMap;
  /** Redirect location. */
  readonly location: string;
  /** Redirect status. */
  readonly redirectStatus: 303 | 307 | 308;
}

/** Union of all form submission result states. */
export type FormSubmissionResult<TValues extends FormValues, TOutput = unknown> =
  | FormSubmissionInitialResult<TValues>
  | FormSubmissionInvalidResult<TValues>
  | FormSubmissionSuccessResult<TValues, TOutput>
  | FormSubmissionErrorResult<TValues>
  | FormSubmissionRedirectResult<TValues>;

/** Descriptor for one form field and its generated props. */
export interface FieldDescriptor<TValue = unknown> {
  /** Submitted field name. */
  readonly name: FormFieldPath;
  /** DOM id for the field control. */
  readonly id: string;
  /** Stable render key for repeated fields. */
  readonly key: string;
  /** Owning form id. */
  readonly formId: string;
  /** Current field value. */
  readonly value: TValue | undefined;
  /** Initial field value. */
  readonly initialValue: TValue | undefined;
  /** Default field value. */
  readonly defaultValue: TValue | undefined;
  /** Validation errors for this field. */
  readonly errors: readonly string[];
  /** First validation error for this field. */
  readonly error: string | undefined;
  /** Whether the field is invalid. */
  readonly invalid: boolean;
  /** Whether the field is valid. */
  readonly valid: boolean;
  /** Whether the field is required. */
  readonly required: boolean;
  /** Whether the current value differs from the initial value. */
  readonly dirty: boolean;
  /** HTML constraints derived from schema metadata. */
  readonly constraints: FieldConstraints;
  /** DOM id for the error element. */
  readonly errorId: string;
  /** DOM id for the description element. */
  readonly descriptionId: string;
  /** Build control props with optional overrides. */
  controlProps<TOverrides extends Record<string, unknown> = Record<string, never>>(
    overrides?: TOverrides,
  ): ControlProps & TOverrides;
  /** Props for the field label. */
  readonly labelProps: LabelProps;
  /** Props for the field error element. */
  readonly errorProps: ErrorProps;
  /** Props for the field description element. */
  readonly descriptionProps: DescriptionProps;
}

/** Descriptor for one item in a collection field. */
export interface CollectionItem<TItem> {
  /** Stable item key. */
  readonly key: string;
  /** Current item index. */
  readonly index: number;
  /** Props for the hidden item key input. */
  readonly keyInputProps: CollectionKeyInputProps;
  /** Field descriptors for the collection item. */
  readonly fields: TItem extends object ? FieldDescriptorMap<TItem>
    : FieldDescriptor<TItem>;
}

/** Descriptor for a collection field and its item intent buttons. */
export interface CollectionDescriptor<TItem> {
  /** Collection field name. */
  readonly name: string;
  /** Ordered collection items. */
  readonly list: ReadonlyArray<CollectionItem<TItem>>;
  /** Current collection length. */
  readonly length: number;
  /** Collection-level errors. */
  readonly errors: readonly string[];
  /** First collection-level error. */
  readonly error: string | undefined;
  /** Minimum item count constraint. */
  readonly minItems?: number;
  /** Maximum item count constraint. */
  readonly maxItems?: number;
  /** DOM id for the collection error element. */
  readonly errorId: string;
  /** DOM id for the collection description element. */
  readonly descriptionId: string;
  /** Props for the collection error element. */
  readonly errorProps: ErrorProps;
  /** Props for the collection description element. */
  readonly descriptionProps: DescriptionProps;
  /** Build props for an add-item intent button. */
  addButtonProps(opts?: { defaultValue?: Partial<TItem> }): IntentButtonProps;
  /** Build props for a remove-item intent button. */
  removeButtonProps(index: number): IntentButtonProps;
  /** Build props for a reorder-item intent button. */
  reorderButtonProps(from: number, to: number): IntentButtonProps;
  /** Build props for a duplicate-item intent button. */
  duplicateButtonProps(index: number): IntentButtonProps;
}

/** Field descriptors keyed by form value path. */
export type FieldDescriptorMap<T> = {
  [K in keyof T & string]: T[K] extends Array<infer U>
    ? CollectionDescriptor<U> & FieldDescriptor<T[K]>
    : T[K] extends object ? FieldDescriptorMap<T[K]> & FieldDescriptor<T[K]>
    : FieldDescriptor<T[K]>;
};

/** Runtime state passed to a form layer component. */
export interface RuntimeFormState<TValues extends FormValues> {
  /** Stable form id. */
  readonly id: string;
  /** Submission URL. */
  readonly action: string;
  /** HTTP method used by the form. */
  readonly method: 'POST' | 'PUT' | 'PATCH';
  /** Current form values. */
  readonly values: TValues;
  /** Initial form values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Whether the form currently has any errors. */
  readonly hasErrors: boolean;
  /** Whether a submission has been processed. */
  readonly submitted: boolean;
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** Field descriptors keyed by form value path. */
  readonly fields: FieldDescriptorMap<TValues>;
  /** HTML constraints keyed by field path. */
  readonly constraints: Record<string, FieldConstraints>;
  /** Props for the root form element. */
  readonly formProps: FormElementProps;
  /** Props for the hidden CSRF input. */
  readonly csrfInputProps: FormCsrfInputProps;
}

/** Snapshot consumed by progressive enhancement code for one form. */
export interface FormEnhancementSnapshot<TValues extends FormValues> {
  /** Stable form id. */
  readonly id: string;
  /** Submission URL. */
  readonly action: string;
  /** HTTP method used by the form. */
  readonly method: 'POST' | 'PUT' | 'PATCH';
  /** Current form values. */
  readonly values: TValues;
  /** Initial values used to compute dirty state. */
  readonly initialValues: Partial<TValues>;
  /** Field-level validation errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation errors. */
  readonly formErrors: readonly string[];
  /** Whether the form currently has any errors. */
  readonly hasErrors: boolean;
  /** Whether a submission has been processed. */
  readonly submitted: boolean;
  /** Parsed submit intent, when present. */
  readonly intent: FormIntent | null;
  /** Stable submission id. */
  readonly submissionId: string;
  /** CSRF token for the rendered form. */
  readonly csrfToken: string;
  /** HTML constraints keyed by field path. */
  readonly constraints: Record<string, FieldConstraints>;
  /** Props for the root form element. */
  readonly formProps: FormElementProps;
  /** Props for the hidden CSRF input. */
  readonly csrfInputProps: FormCsrfInputProps;
}

/** Progressive enhancement strategy for collection fields. */
export type FormCollectionStrategyMode = 'server' | 'client' | 'hybrid';

/** Client/server ownership policy for a collection field. */
export interface FormCollectionStrategy {
  /** Strategy mode. */
  readonly mode: FormCollectionStrategyMode;
  /** Partial route used for collection updates. */
  readonly partial?: string;
  /** Whether client navigation is enabled for collection updates. */
  readonly clientNav?: boolean;
}

/** Options used to progressively enhance a rendered form. */
export interface FormEnhancementOptions<TValues extends FormValues> {
  /** Partial route used for enhanced submissions. */
  readonly partial?: string;
  /** Whether Fresh client navigation handles enhanced submissions. */
  readonly clientNav?: boolean;
  /** Client validation timing. */
  readonly validate?: 'onSubmit' | 'onBlur' | 'onChange';
  /** Optional schema-like validator used before submission. */
  readonly schema?: {
    /** Validate the given input. */
    safeParse(
      input: unknown,
    ):
      | { readonly success: true; readonly data: unknown }
      | { readonly success: false; readonly error: unknown };
  };
  /** Whether invalid submission should focus the first errored control. */
  readonly focusOnError?: boolean;
  /** Callback invoked before an enhanced submission starts. */
  readonly onSubmitStart?: () => void;
  /** Callback invoked after an enhanced submission settles. */
  readonly onSubmitEnd?: () => void;
  /** Collection-field enhancement strategies keyed by field name. */
  readonly collections?: Partial<Record<Extract<keyof TValues, string>, FormCollectionStrategy>>;
}

/** Form element props after progressive enhancement handlers are attached. */
export interface EnhancedFormProps extends FormElementProps {
  /** Fresh client-navigation flag. */
  readonly 'f-client-nav'?: boolean;
  /** Fresh partial route name. */
  readonly 'f-partial'?: string;
  /** Enhanced submit handler. */
  readonly onSubmit?: (event: Event) => void;
  /** Enhanced blur-capture handler. */
  readonly onBlurCapture?: (event: FocusEvent) => void;
  /** Enhanced input-capture handler. */
  readonly onInputCapture?: (event: Event) => void;
  /** Form element ref callback. */
  readonly ref?: (element: HTMLFormElement | null) => void;
}

/** Runtime state returned by the progressive form enhancement hook. */
export interface FormEnhancementState<TValues extends FormValues> {
  /** Whether an enhanced submission is pending. */
  readonly pending: boolean;
  /** Enhanced props for the form element. */
  readonly formProps: EnhancedFormProps;
  /** Current client-side field errors. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Current client-side form errors. */
  readonly formErrors: readonly string[];
  /** Collection strategies keyed by field name. */
  readonly collectionStrategies: Partial<
    Record<Extract<keyof TValues, string>, FormCollectionStrategy>
  >;
  /** Submit the form with an optional intent. */
  submit(intent?: FormIntent): void;
}

/** Factory helpers for constructing typed form submission results. */
export interface FormReplyHelpers<TValues extends FormValues, TOutput = unknown> {
  /** Create an initial form state. */
  initial(
    init: FormReplyInit<TValues> & { readonly initialValues?: Partial<TValues> },
  ): FormSubmissionInitialResult<TValues>;
  /** Create an invalid form state. */
  invalid(init: InvalidFormReplyInit<TValues>): FormSubmissionInvalidResult<TValues>;
  /** Create a successful form state. */
  success(
    init: SuccessFormReplyInit<TValues, TOutput>,
  ): FormSubmissionSuccessResult<TValues, TOutput>;
  /** Create an errored form state. */
  error(init: ErrorFormReplyInit<TValues>): FormSubmissionErrorResult<TValues>;
  /** Create a redirect form state. */
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
