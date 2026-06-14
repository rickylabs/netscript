import type { FieldDescriptorMap } from './descriptor-types.ts';
import type { FormIntent } from './intent-reply-types.ts';
import type { EnhancedFormProps, FormCsrfInputProps, FormElementProps } from './prop-types.ts';
import type { FieldConstraints, FormFieldErrors, FormValues } from './value-types.ts';

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
