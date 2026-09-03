import type { JobContext } from './job-context.ts';
import type { JobResult } from './job-result.ts';
import type { JobPayloadSchema } from './public-schema.ts';

/** Function that executes a worker job. */
export type JobHandler<TPayload = unknown, TResult = unknown> = (
  context: JobContext<TPayload, TResult>,
) => JobResult<TResult> | Promise<JobResult<TResult>>;

/** Callable worker job handler that carries its payload validator. */
export type JobHandlerDefinition<TPayload = unknown, TResult = unknown> =
  & JobHandler<TPayload, TResult>
  & Readonly<{ payloadSchema: JobPayloadSchema<TPayload> }>;

/** Error raised when a job payload fails its definition's schema. */
export class JobPayloadValidationError extends TypeError {
  /** Job whose payload could not be validated. */
  readonly jobId: string;
  /** Standard Schema issues reported by the payload validator. */
  readonly issues: ReadonlyArray<{
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
  }>;

  /** Create a payload validation failure from Standard Schema issues. */
  constructor(
    jobId: string,
    issues: ReadonlyArray<{
      readonly message: string;
      readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
    }>,
  ) {
    super(`Invalid payload for job "${jobId}": ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'JobPayloadValidationError';
    this.jobId = jobId;
    this.issues = issues;
  }
}

/**
 * Validate an unknown payload with the schema carried by a job definition.
 *
 * @example
 * ```ts
 * import { validateJobPayload } from '@netscript/plugin-workers-core/runtime';
 * import { z } from 'zod';
 *
 * const schema = z.object({ documentId: z.string() });
 * const input: unknown = { documentId: 'doc-123' };
 * const payload = await validateJobPayload(schema, input, 'embed-document');
 * ```
 *
 * @param schema - Standard Schema validator carried by the selected definition.
 * @param payload - Untrusted payload received at a producer or consumer boundary.
 * @param jobId - Selected job identifier used in validation diagnostics.
 * @returns The validated schema output.
 */
export async function validateJobPayload<TPayload>(
  schema: JobPayloadSchema<TPayload>,
  payload: unknown,
  jobId: string,
): Promise<TPayload> {
  const result = await schema['~standard'].validate(payload);
  if (result.issues) {
    throw new JobPayloadValidationError(jobId, result.issues);
  }
  return result.value;
}

/** Wrap a job handler with its payload schema and boundary validation. */
export function createJobHandlerDefinition<TPayload, TResult = unknown>(
  payloadSchema: JobPayloadSchema<TPayload>,
  handler: JobHandler<TPayload, TResult>,
): JobHandlerDefinition<TPayload, TResult> {
  const definition = Object.assign(
    async (context: JobContext<TPayload, TResult>): Promise<JobResult<TResult>> => {
      const payload = await validateJobPayload(
        payloadSchema,
        context.payload,
        context.job?.id ?? context.id,
      );
      return await handler({ ...context, payload });
    },
    { payloadSchema },
  );
  return Object.freeze(definition);
}

/** Return whether a runtime value is a callable schema-backed job handler. */
export function isJobHandlerDefinition(
  value: unknown,
): value is JobHandlerDefinition<never, unknown> {
  return typeof value === 'function' && Object.hasOwn(value, 'payloadSchema');
}

/** Job handler definition accepted by `defineJobHandler`. */
export type JobHandlerSpec<TPayload = unknown, TResult = unknown> = Readonly<{
  name: string;
  execute: JobHandler<TPayload, TResult>;
}>;
