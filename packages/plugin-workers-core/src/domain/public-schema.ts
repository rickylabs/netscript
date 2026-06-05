import { z } from 'zod';
import type { ZodArray, ZodObject, ZodOptional, ZodRecord, ZodString, ZodUnknown } from 'zod';

export type { ZodArray, ZodObject, ZodOptional, ZodRecord, ZodString, ZodUnknown } from 'zod';

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

/** Thin public job definition output. */
export type PublicJobDefinitionOutput = Readonly<{
  id: string;
  entrypoint?: string;
  name?: string;
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
export const JobDefinitionPublicBaseSchema: ZodObject<{
  id: ZodString;
  entrypoint: ZodOptional<ZodString>;
  name: ZodOptional<ZodString>;
  schedule: ZodOptional<ZodString>;
  topic: ZodOptional<ZodString>;
}> = z.object({
  id: z.string().min(1),
  entrypoint: z.string().optional(),
  name: z.string().optional(),
  schedule: z.string().optional(),
  topic: z.string().optional(),
});

/** Internal Zod base for public task definitions. */
export const TaskDefinitionPublicBaseSchema: ZodObject<{
  id: ZodString;
  entrypoint: ZodOptional<ZodString>;
  name: ZodOptional<ZodString>;
  topic: ZodOptional<ZodString>;
  type: ZodOptional<ZodString>;
}> = z.object({
  id: z.string().min(1),
  entrypoint: z.string().optional(),
  name: z.string().optional(),
  topic: z.string().optional(),
  type: z.string().optional(),
});

/** Internal Zod base for public workflow definitions. */
export const WorkflowDefinitionPublicBaseSchema: ZodObject<{
  id: ZodString;
  steps: ZodOptional<ZodArray<ZodRecord<ZodString, ZodUnknown>>>;
}> = z.object({
  id: z.string().min(1),
  steps: z.array(z.record(z.string(), z.unknown())).optional(),
});

/** Thin public job definition schema for root-level quick-start APIs. */
export const PublicJobDefinitionSchema: PublicStandardSchema<PublicJobDefinitionOutput> =
  JobDefinitionPublicBaseSchema as PublicStandardSchema<PublicJobDefinitionOutput>;

/** Thin public task definition schema for root-level quick-start APIs. */
export const PublicTaskDefinitionSchema: PublicStandardSchema<PublicTaskDefinitionOutput> =
  TaskDefinitionPublicBaseSchema as PublicStandardSchema<PublicTaskDefinitionOutput>;

/** Thin public workflow definition schema for root-level quick-start APIs. */
export const PublicWorkflowDefinitionSchema: PublicStandardSchema<PublicWorkflowDefinitionOutput> =
  WorkflowDefinitionPublicBaseSchema as PublicStandardSchema<PublicWorkflowDefinitionOutput>;
