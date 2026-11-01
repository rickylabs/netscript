import { z } from 'zod';

/** Backoff strategies supported by worker jobs. */
export const JOB_RETRY_BACKOFFS = ['fixed', 'linear', 'exponential'] as const;
/** Largest supported number of retries after the initial attempt. */
export const MAX_JOB_RETRIES = 100;
/** Default number of additional attempts for worker jobs. */
export const DEFAULT_JOB_MAX_RETRIES = 3;
/** Default delay before a job retry, in milliseconds. */
export const DEFAULT_JOB_RETRY_DELAY_MS = 1000;
/** Default ceiling for retry delays, in milliseconds. */
export const DEFAULT_JOB_RETRY_MAX_DELAY_MS = 300_000;

/** Retry behavior attached to a job builder or handler. */
export type JobRetryOptions = Readonly<{
  backoff?: typeof JOB_RETRY_BACKOFFS[number];
  delayMs?: number;
  maxDelayMs?: number;
}>;

/** Retry declaration carried by a discovered job handler. */
export type JobHandlerRetryPolicy = JobRetryOptions & Readonly<{ maxRetries?: number }>;

/** Validated, fully resolved retry policy for a worker job. */
export type JobRetryPolicy = Readonly<{
  maxRetries: number;
  backoff: typeof JOB_RETRY_BACKOFFS[number];
  delayMs: number;
  maxDelayMs: number;
}>;

/** Canonical validation for bounded worker job retries and delays. */
export const JobRetryPolicySchema: z.ZodType<JobRetryPolicy> = z.object({
  maxRetries: z.number().int().min(0).max(MAX_JOB_RETRIES),
  backoff: z.enum(JOB_RETRY_BACKOFFS),
  delayMs: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  maxDelayMs: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
}).refine((policy) => policy.maxDelayMs >= policy.delayMs, {
  message: 'maxDelayMs must be at least delayMs',
  path: ['maxDelayMs'],
});

/** Definition fields used when resolving legacy and handler-declared retry settings. */
export type JobRetryDefinition = Readonly<{
  maxRetries?: number;
  retryDelay?: number;
  metadata?: Readonly<Record<string, unknown>>;
}>;

const retryDeclarationSchema = z.object({
  maxRetries: z.number().int().min(0).max(MAX_JOB_RETRIES).optional(),
  backoff: z.enum(JOB_RETRY_BACKOFFS).optional(),
  delayMs: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  maxDelayMs: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
});

const retryDefinitionSchema = z.object({
  maxRetries: z.number().int().min(0).max(MAX_JOB_RETRIES).optional(),
  retryDelay: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Resolve each retry field from handler, metadata, legacy definition, then defaults. */
export function resolveJobRetryPolicy(
  input: unknown,
  handler?: unknown,
): JobRetryPolicy {
  const definition = retryDefinitionSchema.parse(input);
  const declared = handlerRetry(handler);
  const legacy = retryDeclarationSchema.parse(definition.metadata?.retry ?? {});
  const delayMs = declared.delayMs ?? legacy.delayMs ?? definition.retryDelay ??
    DEFAULT_JOB_RETRY_DELAY_MS;
  return JobRetryPolicySchema.parse({
    maxRetries: declared.maxRetries ?? legacy.maxRetries ?? definition.maxRetries ??
      DEFAULT_JOB_MAX_RETRIES,
    backoff: declared.backoff ?? legacy.backoff ?? 'fixed',
    delayMs,
    maxDelayMs: declared.maxDelayMs ?? legacy.maxDelayMs ??
      Math.max(DEFAULT_JOB_RETRY_MAX_DELAY_MS, delayMs),
  });
}

/** Persist handler retry fields through generated registries without serializing the handler. */
export function jobRetryRegistration(
  input: unknown,
  handler: unknown,
): Partial<JobRetryDefinition> {
  const definition = retryDefinitionSchema.parse(input);
  const policy = resolveJobRetryPolicy(definition, handler);
  if (!hasHandlerRetry(handler)) return {};
  return {
    maxRetries: policy.maxRetries,
    retryDelay: policy.delayMs,
    metadata: { ...definition.metadata, retry: policy },
  };
}

function hasHandlerRetry(handler: unknown): handler is { retry: unknown } {
  return (typeof handler === 'function' || typeof handler === 'object' && handler !== null) &&
    'retry' in handler && handler.retry !== undefined;
}

function handlerRetry(handler: unknown): JobHandlerRetryPolicy {
  return retryDeclarationSchema.parse(hasHandlerRetry(handler) ? handler.retry : {});
}

/** Compute the capped delay before a retry numbered from one. */
export function jobRetryDelay(policy: JobRetryPolicy, retry: number): number {
  const multiplier = policy.backoff === 'linear'
    ? retry
    : policy.backoff === 'exponential'
    ? 2 ** Math.min(retry - 1, 53)
    : 1;
  return Math.min(policy.maxDelayMs, policy.delayMs * multiplier);
}
