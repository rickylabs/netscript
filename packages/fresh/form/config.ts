import { z } from 'zod';
import type {
  AnyDefinePageTypeState,
  DefinePageLayerContextBase,
} from '../builders/define-page/types.ts';
import type { FormHandlerContext } from './handler-context.ts';
import type { FormIntent, FormIntentResult, FormValues } from './types.ts';

type MaybePromise<T> = T | Promise<T>;
type FormSchemaInput<TSchema extends z.ZodTypeAny> = z.input<TSchema> & FormValues;

/**
 * Metadata returned from {@link FormConfig.onSuccess} when the form stays on
 * the same page (no redirect). Consumed by the form renderer to display
 * feedback and optionally update field values for the next render cycle.
 */
export interface FormSuccessMeta<TValues extends object> {
  /** User-facing success message displayed after mutation completes. */
  readonly message?: string;
  /**
   * Partial values merged into the form state for the next render.
   * Useful for resetting specific fields while preserving others.
   */
  readonly nextValues?: Partial<TValues>;
}

/**
 * Configuration object for the `withForm()` builder method.
 *
 * Callbacks follow a **two-tier context design**:
 * - **Pre-mutation** (`mutate`, `onIntent`) receive a `FormHandlerContext`
 *   without `TOutput` — the mutation hasn't run yet.
 * - **Post-mutation** (`redirectTo`, `onSuccess`, `invalidate`) receive a
 *   `FormHandlerContext` carrying `NoInfer<TOutput>` so they can consume the
 *   mutation result without widening its inferred type.
 *
 * @typeParam TTypes   - Page type state produced by `definePage()`.
 * @typeParam THasRoute - Whether the page is bound to a parameterised route.
 * @typeParam TSchema  - Zod validation schema, inferred from the `schema` property.
 * @typeParam TOutput  - Mutation result type, inferred from the `mutate` return type.
 */
export interface FormConfig<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
  TSchema extends z.ZodTypeAny,
  TOutput = unknown,
> {
  /**
   * Zod schema used for validation and HTML constraint extraction.
   * Also the sole inference site for `TSchema`.
   */
  readonly schema: TSchema;
  /**
   * Resolves initial form values on GET requests.
   * Returned values are merged with schema defaults before rendering.
   */
  readonly initial?: (
    ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
  ) => MaybePromise<Partial<FormSchemaInput<TSchema>>>;
  /**
   * Executes the mutation with Zod-validated input. The return type is the
   * sole inference site for `TOutput`. Runs in the `{spanName}.mutate` span.
   */
  readonly mutate: (
    input: z.output<TSchema>,
    ctx: FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>>,
  ) => MaybePromise<TOutput>;
  /**
   * Handles non-submit intents (collection add/remove/reorder, custom).
   * Short-circuits before validation; returns updated values and optional
   * field/form errors.
   */
  readonly onIntent?: (
    intent: FormIntent,
    values: FormSchemaInput<TSchema>,
    ctx: FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>>,
  ) => MaybePromise<FormIntentResult<FormSchemaInput<TSchema>>>;
  /**
   * Computes the redirect target after a successful mutation. Takes precedence
   * over `onSuccess`. Return a URL string for a 303 redirect, or a `Response`
   * for a custom status. Runs in the `{spanName}.redirect` span.
   */
  readonly redirectTo?: (
    output: NoInfer<TOutput>,
    ctx: FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, NoInfer<TOutput>>,
  ) => string | Response;
  /**
   * Returns success metadata when staying on the same page (no redirect).
   * Can provide a user-facing message and updated values for the next render.
   */
  readonly onSuccess?: (
    output: NoInfer<TOutput>,
    ctx: FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, NoInfer<TOutput>>,
  ) => MaybePromise<FormSuccessMeta<FormSchemaInput<TSchema>>>;
  /**
   * Runs cache invalidation after mutation, before the redirect/success
   * response is sent. Runs in the `{spanName}.invalidate` span.
   */
  readonly invalidate?: (
    output: NoInfer<TOutput>,
    ctx: FormHandlerContext<TTypes, THasRoute, FormSchemaInput<TSchema>, NoInfer<TOutput>>,
  ) => MaybePromise<void>;
  /** Controls CSRF token generation, cookie setting, and verification. Defaults to `true`. */
  readonly csrf?: boolean;
  /** HTTP method the form submits with; determines which handler slot is registered. Defaults to `'POST'`. */
  readonly method?: 'POST' | 'PUT' | 'PATCH';
  /** Telemetry span name prefix. Defaults to `form.{id}`. */
  readonly spanName?: string;
}
