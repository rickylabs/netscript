import type { FormFieldErrors, FormPageMode, FormValues } from './value-types.ts';

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
