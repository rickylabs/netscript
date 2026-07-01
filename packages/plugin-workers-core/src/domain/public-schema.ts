/**
 * Public structural schemas for worker definitions.
 *
 * @module
 */

import { z } from 'zod';

/** Standard Schema compatible public schema surface. */
export interface PublicStandardSchema<TOutput> {
  /** Standard Schema metadata and validation hooks. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> | undefined },
    ) =>
      | { readonly value: TOutput; readonly issues?: undefined }
      | {
        readonly issues: ReadonlyArray<{
          readonly message: string;
          readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
        }>;
      }
      | Promise<
        | { readonly value: TOutput; readonly issues?: undefined }
        | {
          readonly issues: ReadonlyArray<{
            readonly message: string;
            readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
          }>;
        }
      >;
    readonly types?: { readonly input: unknown; readonly output: TOutput } | undefined;
  };
}

/** Structural object-shape map used by public definition schemas. */
export type PublicDefinitionSchemaShape = Readonly<Record<string, z.ZodTypeAny>>;

/** Package-owned structural schema surface for public definition schemas. */
export interface PublicDefinitionSchema<TOutput> extends PublicStandardSchema<TOutput> {
  /** Object shape exposed for internal schema composition. */
  readonly shape: PublicDefinitionSchemaShape;
  /** Parse an unknown value into the schema output. */
  parse(value: unknown): TOutput;
  /** Return a schema without selected object keys. */
  omit(
    mask: Readonly<Record<string, true>>,
  ): Readonly<{ readonly shape: PublicDefinitionSchemaShape }>;
  /** Return a schema with only selected object keys. */
  pick(
    mask: Readonly<Record<string, true>>,
  ): Readonly<{ readonly shape: PublicDefinitionSchemaShape }>;
  /** Validate an unknown value without throwing. */
  safeParse(value: unknown):
    | { readonly success: true; readonly data: TOutput }
    | {
      readonly success: false;
      readonly error: Readonly<{
        readonly issues: ReadonlyArray<{
          readonly message: string;
          readonly path: readonly (string | number)[];
        }>;
      }>;
    };
}

/** Thin public job definition output. */
export type PublicJobDefinitionOutput = Readonly<{
  id: string;
  entrypoint?: string;
  name?: string;
  schedule?: string;
  topic?: string;
}>;

/** Thin public task definition output. */
export type PublicTaskDefinitionOutput = Readonly<{
  id: string;
  entrypoint?: string;
  name?: string;
  topic?: string;
  type?: string;
}>;

/** Thin public workflow definition output. */
export type PublicWorkflowDefinitionOutput = Readonly<{
  id: string;
  steps?: readonly Record<string, unknown>[];
}>;

/** Internal Zod base for public job definitions. */
const JobDefinitionPublicBaseZodSchema = z.object({
  id: z.string().min(1),
  entrypoint: z.string().optional(),
  name: z.string().optional(),
  schedule: z.string().optional(),
  topic: z.string().optional(),
});
/** Public base schema for thin job definitions. */
export const JobDefinitionPublicBaseSchema: PublicDefinitionSchema<PublicJobDefinitionOutput> =
  JobDefinitionPublicBaseZodSchema as PublicDefinitionSchema<PublicJobDefinitionOutput>;

/** Internal Zod base for public task definitions. */
const TaskDefinitionPublicBaseZodSchema = z.object({
  id: z.string().min(1),
  entrypoint: z.string().optional(),
  name: z.string().optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
});
/** Public base schema for thin task definitions. */
export const TaskDefinitionPublicBaseSchema: PublicDefinitionSchema<PublicTaskDefinitionOutput> =
  TaskDefinitionPublicBaseZodSchema as PublicDefinitionSchema<PublicTaskDefinitionOutput>;

/** Internal Zod base for public workflow definitions. */
const WorkflowDefinitionPublicBaseZodSchema = z.object({
  id: z.string().min(1),
  steps: z.array(z.record(z.string(), z.unknown())).optional(),
});
/** Public base schema for thin workflow definitions. */
export const WorkflowDefinitionPublicBaseSchema: PublicDefinitionSchema<
  PublicWorkflowDefinitionOutput
> = WorkflowDefinitionPublicBaseZodSchema as PublicDefinitionSchema<
  PublicWorkflowDefinitionOutput
>;

/** Thin public job definition schema for root-level quick-start APIs. */
export const PublicJobDefinitionSchema: PublicStandardSchema<PublicJobDefinitionOutput> =
  JobDefinitionPublicBaseSchema as PublicStandardSchema<PublicJobDefinitionOutput>;

/** Thin public task definition schema for root-level quick-start APIs. */
export const PublicTaskDefinitionSchema: PublicStandardSchema<PublicTaskDefinitionOutput> =
  TaskDefinitionPublicBaseSchema as PublicStandardSchema<PublicTaskDefinitionOutput>;

/** Thin public workflow definition schema for root-level quick-start APIs. */
export const PublicWorkflowDefinitionSchema: PublicStandardSchema<PublicWorkflowDefinitionOutput> =
  WorkflowDefinitionPublicBaseSchema as PublicStandardSchema<PublicWorkflowDefinitionOutput>;
