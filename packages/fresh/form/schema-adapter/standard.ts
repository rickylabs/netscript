import type { FormFieldErrors, FormValues } from '../types.ts';
import type { FormSchemaAdapter, FormSchemaParseResult } from './contract.ts';

/** Path segment shape accepted by Standard Schema issues. */
export type StandardSchemaPathSegment =
  | PropertyKey
  | {
    /** Segment key reported by a schema library for nested validation issues. */
    readonly key: PropertyKey;
  };

/** Validation issue reported by a Standard Schema compatible library. */
export interface StandardSchemaIssue {
  /** Human-readable validation message. */
  readonly message: string;
  /** Optional nested field path associated with the validation message. */
  readonly path?: readonly StandardSchemaPathSegment[];
}

/** Validation result returned by a Standard Schema compatible schema. */
export type StandardSchemaResult<TOutput> =
  | {
    /** Parsed and coerced output value. */
    readonly value: TOutput;
  }
  | {
    /** Validation issues reported by the schema library. */
    readonly issues: readonly StandardSchemaIssue[];
  };

/** Structural Standard Schema v1 contract consumed by the form adapter. */
export interface StandardSchemaV1<TInput = unknown, TOutput = TInput> {
  /** Standard Schema metadata and validation entry point. */
  readonly '~standard': {
    /** Standard Schema major version. */
    readonly version: 1;
    /** Schema library vendor name. */
    readonly vendor: string;
    /** Validate unknown input and return a Standard Schema result. */
    validate(input: TInput): StandardSchemaResult<TOutput> | Promise<StandardSchemaResult<TOutput>>;
    /** Optional static input/output metadata exposed by the schema library. */
    readonly types?: {
      /** Schema input type. */
      readonly input: TInput;
      /** Schema output type. */
      readonly output: TOutput;
    };
  };
}

/** Infer the input value type from a Standard Schema. */
export type StandardSchemaInput<TSchema> = TSchema extends StandardSchemaV1<infer TInput, unknown>
  ? TInput
  : unknown;

/** Infer the output value type from a Standard Schema. */
export type StandardSchemaOutput<TSchema> = TSchema extends StandardSchemaV1<unknown, infer TOutput>
  ? TOutput
  : unknown;

/**
 * Create a form schema adapter from any Standard Schema v1 compatible schema.
 *
 * Standard Schema provides validation only, so generic adapters return empty
 * constraint/default metadata. Use vendor-specific adapters when forms need
 * HTML constraint or default-value introspection.
 */
export function createStandardSchemaAdapter<
  TSchema extends StandardSchemaV1,
  TValues extends FormValues = StandardSchemaInput<TSchema> & FormValues,
  TOutput = StandardSchemaOutput<TSchema>,
>(schema: TSchema): FormSchemaAdapter<TValues, TOutput> {
  return {
    async parse(input: unknown): Promise<TOutput> {
      const result = await schema['~standard'].validate(input);

      if ('issues' in result) {
        throw createStandardSchemaAggregateError(result.issues);
      }

      return result.value as TOutput;
    },

    async safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>> {
      const result = await schema['~standard'].validate(input);

      if ('value' in result) {
        return {
          success: true,
          data: result.value as TOutput,
        };
      }

      return {
        success: false,
        ...normalizeStandardSchemaIssues<TValues>(result.issues),
      };
    },

    getConstraints() {
      return {};
    },

    getDefaults() {
      return {};
    },
  };
}

function normalizeStandardSchemaIssues<TValues extends FormValues>(
  issues: readonly StandardSchemaIssue[],
): {
  fieldErrors: FormFieldErrors<TValues>;
  formErrors: readonly string[];
} {
  const fieldErrors = { _form: [] } as FormFieldErrors<TValues>;
  const formErrors: string[] = [];

  for (const issue of issues) {
    const fieldPath = formatStandardSchemaPath(issue.path);

    if (!fieldPath) {
      formErrors.push(issue.message);
      continue;
    }

    const field = fieldPath as Extract<keyof TValues, string>;
    const messages = fieldErrors[field] ?? [];
    fieldErrors[field] = [...messages, issue.message] as FormFieldErrors<TValues>[typeof field];
  }

  if (formErrors.length > 0) {
    fieldErrors._form = [...formErrors];
  }

  return {
    fieldErrors,
    formErrors,
  };
}

function createStandardSchemaAggregateError(
  issues: readonly StandardSchemaIssue[],
): AggregateError {
  return new AggregateError(
    issues.map((issue) => new Error(issue.message)),
    'Standard Schema validation failed',
  );
}

function formatStandardSchemaPath(path: readonly StandardSchemaPathSegment[] | undefined): string {
  if (!path || path.length === 0) {
    return '';
  }

  return path.reduce<string>((fieldPath, segment) => {
    const key = normalizeStandardSchemaPathSegment(segment);

    if (typeof key === 'number') {
      return `${fieldPath}[${key}]`;
    }

    return fieldPath ? `${fieldPath}.${String(key)}` : String(key);
  }, '');
}

function normalizeStandardSchemaPathSegment(segment: StandardSchemaPathSegment): PropertyKey {
  return typeof segment === 'object' && segment !== null && 'key' in segment
    ? segment.key
    : segment;
}
