import type { FieldConstraints, FormFieldErrors, FormValues } from '../types.ts';

/**
 * Successful schema parse result.
 */
export interface FormSchemaParseSuccess<TOutput> {
  /** Whether parsing succeeded. */
  readonly success: true;
  /** Parsed and coerced output value. */
  readonly data: TOutput;
}

/**
 * Failed schema parse result normalized for the form runtime.
 */
export interface FormSchemaParseFailure<TValues extends FormValues> {
  /** Whether parsing failed. */
  readonly success: false;
  /** Field-keyed validation messages normalized for form rendering. */
  readonly fieldErrors: FormFieldErrors<TValues>;
  /** Form-level validation messages not associated with one field. */
  readonly formErrors: readonly string[];
}

/**
 * Adapter-safe parse result used by the canonical form runtime.
 */
export type FormSchemaParseResult<TValues extends FormValues, TOutput> =
  | FormSchemaParseSuccess<TOutput>
  | FormSchemaParseFailure<TValues>;

/**
 * Vendor-specific schema metadata extractor.
 *
 * Standard Schema covers validation only. Schema libraries that expose stable
 * metadata can provide an introspector to keep HTML constraints and default
 * values available without changing the validation adapter contract.
 */
export interface SchemaIntrospector<TSchema, TValues extends FormValues = FormValues> {
  /**
   * Extract conservative HTML constraint metadata for a schema.
   */
  getConstraints(schema: TSchema): Partial<Record<string, FieldConstraints>>;

  /**
   * Extract best-effort default values for a schema.
   */
  getDefaults(schema: TSchema): Partial<TValues>;
}

/**
 * Validation boundary abstraction for forms.
 *
 * `TValues` represents the submitted/raw form values shape used by the page and
 * field metadata layers.
 *
 * `TOutput` represents the validated/coerced output shape produced by the
 * schema. For Zod this commonly maps to `z.output<TSchema>`.
 */
export interface FormSchemaAdapter<TValues extends FormValues, TOutput = TValues> {
  /**
   * Parse and validate unknown input, throwing on failure.
   */
  parse(input: unknown): Promise<TOutput>;

  /**
   * Parse and validate unknown input, returning a normalized success/failure
   * result that the form runtime can consume directly.
   */
  safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>>;

  /**
   * Extract safe HTML constraint metadata from the schema.
   *
   * This intentionally returns a plain keyed record so downstream field
   * descriptor builders can decide how to materialize nested field paths later.
   */
  getConstraints(): Partial<Record<string, FieldConstraints>>;

  /**
   * Best-effort default values derived from schema defaults.
   *
   * If the schema cannot be evaluated into defaults, this returns an empty
   * object rather than throwing.
   */
  getDefaults(): Partial<TValues>;
}
