import type { CollectionKeyMap, FormFieldErrors, FormValues } from './value-types.ts';

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
