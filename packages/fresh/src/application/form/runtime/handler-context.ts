import type {
  AnyDefinePageTypeState,
  DefinePageLayerContextBase,
} from '../../builders/define-page/types.ts';
import type { FormIntent, FormReplyHelpers, FormValues } from './types.ts';

/**
 * Extended handler context exposed to `withForm()` callbacks.
 *
 * Intersects the base page layer context with a `form` namespace containing
 * submission-specific data and helpers. Available in both pre-mutation and
 * post-mutation callback positions.
 *
 * @typeParam TTypes - Page type state produced by `definePage()` builders.
 * @typeParam THasRoute - Whether the page is bound to a route (`true`) or is a layout/partial (`false`).
 * @typeParam TValues - Form values shape derived from the Zod schema's **input** type.
 * @typeParam TOutput - Mutation result type. Defaults to `unknown` in pre-mutation
 *   callbacks; narrowed to the actual return type in post-mutation callbacks.
 */
export type FormHandlerContext<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
  TValues extends FormValues,
  TOutput = unknown,
> =
  & DefinePageLayerContextBase<TTypes, THasRoute>
  & {
    /** Form-specific submission data and helpers. */
    readonly form: {
      /**
       * Factory for `FormSubmissionResult` discriminated-union members.
       * Used internally by the framework; exposed for advanced short-circuit patterns.
       */
      readonly reply: FormReplyHelpers<TValues, TOutput>;

      /** Parsed form intent from the submission, or `null` for a standard submit. */
      readonly intent: FormIntent | null;

      /** Raw `FormData` from the request, before Zod parsing. */
      readonly formData: FormData;

      /** Unique identifier for the submission, used for idempotency and telemetry tracing. */
      readonly submissionId: string;

      /** CSRF token for the current submission. `undefined` when CSRF is disabled via `csrf: false`. */
      readonly csrfToken?: string;

      /** Parsed form values before Zod validation (partial — may contain invalid data). */
      readonly values: Partial<TValues>;
    };
  };
