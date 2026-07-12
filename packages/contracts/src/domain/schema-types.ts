import type { z } from 'zod';

/** Parse result returned by contract schema values. */
export type ContractParseResult<TOutput> = z.ZodSafeParseResult<TOutput>;

/** Infer the accepted input value type from a Zod-compatible schema. */
export type ContractSchemaInput<TSchema> = TSchema extends { readonly _input: infer TInput }
  ? TInput
  : unknown;

/** Infer the parsed output value type from a Zod-compatible schema. */
export type ContractSchemaOutput<TSchema> = TSchema extends { readonly _output: infer TOutput }
  ? TOutput
  : unknown;

/** Zod-backed contract schema retaining both parsed output and accepted input. */
export type ContractSchema<TOutput = unknown, TInput = unknown> = z.ZodType<TOutput, TInput>;

/**
 * Cross-resolution schema constraint used at consumer-supplied boundaries.
 *
 * Generated workspaces can resolve the same Zod version through npm while
 * this package resolves it through JSR. The `_input`/`_output` markers are the
 * stable structural contract shared by both copies; Zod implementation members
 * such as `toJSONSchema` are intentionally excluded.
 */
export type ContractSchemaLike<TOutput = unknown, TInput = unknown> = Readonly<{
  _output: TOutput;
  _input: TInput;
  parse(value: unknown): TOutput;
}>;

/** Cross-resolution object-schema constraint for consumer-supplied shapes. */
export type ContractObjectSchemaLike<TOutput = unknown, TInput = unknown> =
  & ContractSchemaLike<TOutput, TInput>
  & Readonly<{ shape: Readonly<Record<string, unknown>> }>;

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
