import { AiRateLimitError } from '../contracts/errors.ts';
import type {
  ChatClientCallOptions,
  ChatClientEvent,
  ChatClientPort,
  ChatClientRequest,
} from '../ports/chat-client.ts';
import type {
  EmbeddingCallOptions,
  EmbeddingProviderPort,
  EmbeddingResponse,
} from '../ports/embedding.ts';
import { abortableDelay } from './backoff.ts';

const DEFAULT_INITIAL_DELAY_MS = 100;
const DEFAULT_MAX_DELAY_MS = 5_000;
const DEFAULT_FACTOR = 2;

/** Opt-in bounded retry policy for AI provider calls. */
export interface AiRetryPolicy {
  /** Total attempts, including the initial call. Must be at least one. */
  readonly maxAttempts: number;
  /** Base exponential delay in milliseconds. Defaults to 100. */
  readonly initialDelayMs?: number;
  /** Maximum delay in milliseconds. Defaults to 5,000. */
  readonly maxDelayMs?: number;
  /** Exponential multiplier. Defaults to 2. */
  readonly factor?: number;
  /** Random source used for full jitter. Defaults to `Math.random`. */
  readonly random?: () => number;
  /** Injectable abort-aware delay, primarily for deterministic tests. */
  readonly sleep?: (delayMs: number, signal: AbortSignal) => Promise<void>;
  /** Optional provider-specific rate-limit classifier. */
  readonly isRateLimitError?: (error: unknown) => boolean;
}

/** Wrap a chat client with opt-in, pre-output rate-limit retries. */
export function withRetryingChatClient(
  client: ChatClientPort,
  policy: AiRetryPolicy,
): ChatClientPort {
  validatePolicy(policy);
  return {
    kind: client.kind,
    name: client.name,
    async *stream(
      request: ChatClientRequest,
      options?: ChatClientCallOptions,
    ): AsyncIterable<ChatClientEvent> {
      const signal = options?.signal ?? new AbortController().signal;
      for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
        signal.throwIfAborted();
        let emitted = false;
        try {
          for await (const event of client.stream(request, options)) {
            emitted = true;
            yield event;
          }
          return;
        } catch (error) {
          if (emitted) throw error;
          await retryOrThrow(error, attempt, policy, signal);
        }
      }
    },
  };
}

/** Wrap an embedding provider with opt-in rate-limit retries. */
export function withRetryingEmbeddingProvider(
  provider: EmbeddingProviderPort,
  policy: AiRetryPolicy,
): EmbeddingProviderPort {
  validatePolicy(policy);
  return {
    async embed(
      input: string | readonly string[],
      options?: EmbeddingCallOptions,
    ): Promise<EmbeddingResponse> {
      const signal = options?.signal ?? new AbortController().signal;
      for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
        signal.throwIfAborted();
        try {
          return await provider.embed(input, options);
        } catch (error) {
          await retryOrThrow(error, attempt, policy, signal);
        }
      }
      throw new Error('Unreachable retry state.');
    },
  };
}

async function retryOrThrow(
  error: unknown,
  attempt: number,
  policy: AiRetryPolicy,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if (!isRateLimit(error, policy)) throw error;

  const retryAfterMs = readRetryAfterMs(error);
  if (attempt >= policy.maxAttempts) {
    throw new AiRateLimitError('AI provider rate limit retries exhausted.', {
      cause: error,
      attempts: attempt,
      retryAfterMs,
    });
  }

  const maxDelayMs = policy.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const delayMs = retryAfterMs === undefined
    ? jitteredDelay(attempt, policy, maxDelayMs)
    : Math.min(maxDelayMs, retryAfterMs);
  await (policy.sleep ?? abortableDelay)(delayMs, signal);
}

function jitteredDelay(attempt: number, policy: AiRetryPolicy, maxDelayMs: number): number {
  const initial = policy.initialDelayMs ?? DEFAULT_INITIAL_DELAY_MS;
  const factor = policy.factor ?? DEFAULT_FACTOR;
  const cap = Math.min(maxDelayMs, initial * factor ** Math.max(0, attempt - 1));
  const random = Math.min(1, Math.max(0, (policy.random ?? Math.random)()));
  return cap * random;
}

function isRateLimit(error: unknown, policy: AiRetryPolicy): boolean {
  if (error instanceof AiRateLimitError) return true;
  if (policy.isRateLimitError?.(error)) return true;
  return isRecord(error) && error.status === 429;
}

function readRetryAfterMs(error: unknown): number | undefined {
  if (error instanceof AiRateLimitError) return error.retryAfterMs;
  if (!isRecord(error)) return undefined;
  const direct = error.retryAfterMs;
  if (typeof direct === 'number' && Number.isFinite(direct) && direct >= 0) return direct;
  const headers = error.headers;
  if (!(headers instanceof Headers) && !isRecord(headers)) return undefined;
  const value = headers instanceof Headers
    ? headers.get('retry-after')
    : findHeader(headers, 'retry-after');
  if (typeof value !== 'string') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

function findHeader(headers: Record<string, unknown>, name: string): unknown {
  const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name);
  return key ? headers[key] : undefined;
}

function validatePolicy(policy: AiRetryPolicy): void {
  if (!Number.isInteger(policy.maxAttempts) || policy.maxAttempts < 1) {
    throw new RangeError('AiRetryPolicy.maxAttempts must be a positive integer.');
  }
  for (
    const [name, value] of [
      ['initialDelayMs', policy.initialDelayMs],
      ['maxDelayMs', policy.maxDelayMs],
      ['factor', policy.factor],
    ] as const
  ) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new RangeError(`AiRetryPolicy.${name} must be a non-negative finite number.`);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
