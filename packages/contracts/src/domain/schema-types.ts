import type { z } from 'zod';

/** Parse result returned by contract schema values. */
export type ContractParseResult<TOutput> = z.ZodSafeParseResult<TOutput>;

/** Infer the accepted input value type from a contract schema. */
export type ContractSchemaInput<TSchema extends z.ZodType> = z.input<TSchema>;

/** Infer the parsed output value type from a contract schema. */
export type ContractSchemaOutput<TSchema extends z.ZodType> = z.output<TSchema>;

/** Zod-backed contract schema retaining both parsed output and accepted input. */
export type ContractSchema<TOutput = unknown, TInput = unknown> = z.ZodType<TOutput, TInput>;

/** Contract schema value that supports a default output. */
export type ContractDefaultableSchema<TOutput, TInput = unknown> = z.ZodType<TOutput, TInput>;

/**
 * Zod-backed object schema retaining parsed output and accepted input.
 *
 * The object operations intentionally use Zod's own signatures so callers do
 * not need to cast a contract schema back into a Zod object before composing
 * it. Generic factories that need exact shape inference accept `z.ZodObject`
 * directly and preserve the concrete schema type.
 */
export type ContractObjectSchema<TOutput = unknown, TInput = unknown> =
  & z.ZodType<TOutput, TInput>
  & Pick<z.ZodObject, 'shape' | 'extend' | 'merge'>;

/** Contract number schema returned by the numeric helper factories. */
export type ContractNumberSchema = z.ZodNumber | z.ZodDefault<z.ZodNumber>;

/** Contract string schema returned by the string helper factories. */
export type ContractStringSchema = z.ZodString;
