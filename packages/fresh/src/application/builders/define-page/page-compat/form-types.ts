/** Form compatibility types for page builders.
 *
 * @module
 */

import type { EmptyRecord, PageLayerMap, UnknownRecord } from './shared-types.ts';
import type { PageContext, SchemaInput, SchemaOutput } from './context-types.ts';
import type {
  FormIntent,
  FormIntentResult,
  FormReplyHelpers,
  FormValues,
} from '../../../form/runtime/types.ts';

/** HTTP methods accepted by `withHandler()`. */
export type PageMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/** Handler function accepted by `withHandler()`. */
export type PageMethodHandler<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> = (
  ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) => Response | { data: unknown } | Promise<Response | { data: unknown }>;

/**
 * Extended context exposed to `withForm()` callbacks.
 *
 * Extends the base page context with a `form` namespace that provides access
 * to reply helpers, the parsed intent, raw `FormData`, submission ID, CSRF
 * token, and parsed values.
 *
 * `TOutput` is `unknown` in pre-mutation callbacks (`mutate`, `onIntent`) and
 * fully typed in post-mutation callbacks (`redirectTo`, `onSuccess`,
 * `invalidate`).
 */
export interface PageFormHandlerContext<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TValues extends FormValues = FormValues,
  TOutput = unknown,
  THasRoute extends boolean = false,
> extends PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute> {
  /** Form-specific values and reply helpers available to form callbacks. */
  readonly form: {
    /** Factory helpers for constructing typed form replies. */
    readonly reply: FormReplyHelpers<TValues, TOutput>;
    /** Parsed form intent, when present. */
    readonly intent: FormIntent | null;
    /** Raw submitted form data. */
    readonly formData: FormData;
    /** Stable submission id. */
    readonly submissionId: string;
    /** CSRF token submitted with the form, when present. */
    readonly csrfToken?: string;
    /** Parsed form values before schema validation completes. */
    readonly values: Partial<TValues>;
  };
}

/**
 * Configuration for the `withForm()` builder method (legacy `PageBuilder`
 * interface).
 *
 * Uses a two-tier context design:
 * - **Pre-mutation** callbacks (`mutate`, `onIntent`) receive their context
 *   with `TOutput = unknown`, keeping the inference site open so TypeScript
 *   can infer `TOutput` from `mutate`'s return type.
 * - **Post-mutation** callbacks (`redirectTo`, `onSuccess`, `invalidate`)
 *   receive `NoInfer<TOutput>`, consuming the inferred type without
 *   widening it.
 *
 * `TOutput` is inferred from the return type of `mutate`. Supplying an
 * explicit generic overrides and enforces the type.
 */
export interface PageFormConfig<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TSchema = unknown,
  TOutput = unknown,
  THasRoute extends boolean = false,
> {
  /** Schema used for validation and constraint extraction. Inference site for `TSchema`. */
  readonly schema: TSchema;
  /** Resolves initial form values on GET. Merged with schema defaults. */
  readonly initial?: (
    ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ) =>
    | Partial<SchemaInput<TSchema, FormValues> & FormValues>
    | Promise<Partial<SchemaInput<TSchema, FormValues> & FormValues>>;
  /** Executes the mutation with validated input. Return type is the sole inference site for `TOutput`. */
  readonly mutate: (
    input: SchemaOutput<TSchema, FormValues>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      unknown,
      THasRoute
    >,
  ) => TOutput | Promise<TOutput>;
  /** Handles non-submit intents (e.g. validate, reset). Short-circuits before validation. */
  readonly onIntent?: (
    intent: FormIntent,
    values: SchemaInput<TSchema, FormValues> & FormValues,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      unknown,
      THasRoute
    >,
  ) =>
    | FormIntentResult<SchemaInput<TSchema, FormValues> & FormValues>
    | Promise<
      FormIntentResult<SchemaInput<TSchema, FormValues> & FormValues>
    >;
  /** Redirect target after successful mutation. Takes precedence over `onSuccess`. */
  readonly redirectTo?: (
    output: NoInfer<TOutput>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      NoInfer<TOutput>,
      THasRoute
    >,
  ) => string | Response | Promise<string | Response>;
  /** Success metadata when staying on the same page (message and/or next values). */
  readonly onSuccess?: (
    output: NoInfer<TOutput>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      NoInfer<TOutput>,
      THasRoute
    >,
  ) =>
    | {
      readonly message?: string;
      readonly nextValues?: Partial<SchemaInput<TSchema, FormValues> & FormValues>;
    }
    | Promise<
      {
        readonly message?: string;
        readonly nextValues?: Partial<SchemaInput<TSchema, FormValues> & FormValues>;
      }
    >;
  /** Cache invalidation after mutation, before the response is sent. */
  readonly invalidate?: (
    output: NoInfer<TOutput>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      NoInfer<TOutput>,
      THasRoute
    >,
  ) => void | Promise<void>;
  /** CSRF protection toggle. Defaults to `true`. */
  readonly csrf?: boolean;
  /** HTTP method for the form submission. Defaults to `POST`. */
  readonly method?: 'POST' | 'PUT' | 'PATCH';
  /** Telemetry span prefix. Defaults to `form.{id}`. */
  readonly spanName?: string;
}
