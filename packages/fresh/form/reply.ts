import { createEmptyFormErrors } from './errors.ts';
import type {
  CollectionKeyMap,
  ErrorFormReplyInit,
  FormFieldErrors,
  FormIntent,
  FormReplyHelpers,
  FormSubmissionErrorResult,
  FormSubmissionInitialResult,
  FormSubmissionInvalidResult,
  FormSubmissionRedirectResult,
  FormSubmissionSuccessResult,
  FormValues,
  InvalidFormReplyInit,
  RedirectFormReplyInit,
  SuccessFormReplyInit,
} from './types.ts';

const DEFAULT_CSRF_TOKEN = '';
const DEFAULT_REDIRECT_STATUS = 303;

interface InitialFormReplyInit<TValues extends FormValues> {
  readonly values: TValues;
  readonly initialValues?: Partial<TValues>;
  readonly intent?: {
    readonly type: string;
    readonly payload?: Record<string, unknown>;
  } | null;
  readonly submissionId: string;
  readonly csrfToken?: string;
  readonly collectionKeys?: CollectionKeyMap;
}

function cloneFieldErrors<TValues extends FormValues>(
  fieldErrors: FormFieldErrors<TValues>,
): FormFieldErrors<TValues> {
  const cloned = createEmptyFormErrors<TValues>();

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (field === '_form') {
      continue;
    }

    if (Array.isArray(messages)) {
      cloned[field as Extract<keyof TValues, string>] = [...messages] as FormFieldErrors<TValues>[
        Extract<keyof TValues, string>
      ];
    }
  }

  cloned._form = Array.isArray(fieldErrors._form) ? [...fieldErrors._form] : [];
  return cloned;
}

function cloneValues<TValues extends FormValues>(values: TValues): TValues {
  return structuredClone(values);
}

function cloneInitialValues<TValues extends FormValues>(
  initialValues: Partial<TValues> | undefined,
): Partial<TValues> {
  if (!initialValues) {
    return {};
  }

  return structuredClone(initialValues);
}

function cloneIntent<TValues extends FormValues>(
  intent: InitialFormReplyInit<TValues>['intent'],
): FormIntent | null {
  if (!intent) {
    return null;
  }

  return structuredClone({
    type: intent.type,
    payload: intent.payload,
  });
}

function normalizeCsrfToken(csrfToken: string | undefined): string {
  return csrfToken ?? DEFAULT_CSRF_TOKEN;
}

function cloneCollectionKeys(collectionKeys: CollectionKeyMap | undefined): CollectionKeyMap {
  return collectionKeys ? structuredClone(collectionKeys) : {};
}

function createBaseReply<TValues extends FormValues>(
  init: InitialFormReplyInit<TValues>,
): {
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
  readonly intent: FormIntent | null;
  readonly submissionId: string;
  readonly csrfToken: string;
  readonly collectionKeys: CollectionKeyMap;
} {
  return {
    values: cloneValues(init.values),
    initialValues: cloneInitialValues(init.initialValues),
    fieldErrors: createEmptyFormErrors<TValues>(),
    formErrors: [],
    intent: cloneIntent(init.intent),
    submissionId: init.submissionId,
    csrfToken: normalizeCsrfToken(init.csrfToken),
    collectionKeys: cloneCollectionKeys(init.collectionKeys),
  };
}

/**
 * Create canonical form-submission reply helpers.
 *
 * These helpers normalize the framework-owned discriminated result union and
 * defensively clone mutable array-based inputs so route handlers can safely
 * construct results without leaking shared references.
 */
export function replyFor<TValues extends FormValues, TOutput = unknown>(): FormReplyHelpers<
  TValues,
  TOutput
> {
  return {
    initial(init): FormSubmissionInitialResult<TValues> {
      const base = createBaseReply(init);

      return {
        status: 'initial',
        values: base.values,
        initialValues: base.initialValues,
        fieldErrors: base.fieldErrors,
        formErrors: base.formErrors,
        intent: base.intent,
        submissionId: base.submissionId,
        csrfToken: base.csrfToken,
        collectionKeys: base.collectionKeys,
      };
    },

    invalid(init: InvalidFormReplyInit<TValues>): FormSubmissionInvalidResult<TValues> {
      const base = createBaseReply(init);
      const fieldErrors = cloneFieldErrors(init.fieldErrors);
      const formErrors = init.formErrors ? [...init.formErrors] : [...fieldErrors._form];

      return {
        status: 'invalid',
        values: base.values,
        initialValues: base.initialValues,
        fieldErrors,
        formErrors,
        intent: base.intent,
        submissionId: base.submissionId,
        csrfToken: base.csrfToken,
        collectionKeys: base.collectionKeys,
      };
    },

    success(
      init: SuccessFormReplyInit<TValues, TOutput>,
    ): FormSubmissionSuccessResult<TValues, TOutput> {
      const base = createBaseReply(init);

      return {
        status: 'success',
        values: base.values,
        initialValues: base.initialValues,
        fieldErrors: base.fieldErrors,
        formErrors: base.formErrors,
        intent: base.intent,
        submissionId: base.submissionId,
        csrfToken: base.csrfToken,
        collectionKeys: base.collectionKeys,
        output: init.output,
        message: init.message,
        nextValues: cloneInitialValues(init.nextValues),
      };
    },

    error(init: ErrorFormReplyInit<TValues>): FormSubmissionErrorResult<TValues> {
      const base = createBaseReply(init);

      return {
        status: 'error',
        values: base.values,
        initialValues: base.initialValues,
        fieldErrors: base.fieldErrors,
        formErrors: [...init.formErrors],
        intent: base.intent,
        submissionId: base.submissionId,
        csrfToken: base.csrfToken,
        collectionKeys: base.collectionKeys,
      };
    },

    redirect(init: RedirectFormReplyInit<TValues>): FormSubmissionRedirectResult<TValues> {
      const base = createBaseReply(init);

      return {
        status: 'redirect',
        values: base.values,
        initialValues: base.initialValues,
        fieldErrors: base.fieldErrors,
        formErrors: base.formErrors,
        intent: base.intent,
        submissionId: base.submissionId,
        csrfToken: base.csrfToken,
        collectionKeys: base.collectionKeys,
        location: init.location,
        redirectStatus: init.status ?? DEFAULT_REDIRECT_STATUS,
      };
    },
  };
}
