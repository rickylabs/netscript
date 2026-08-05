/** Bounded contract for explicit OpenRouter work delegated by native Claude. */

import {
  HYBRID_DELEGATION_DEFAULT_MODEL,
  HYBRID_DELEGATION_MODEL_IDS,
  type HybridDelegationModelId,
} from '../config/models.ts';
import { type Effort, EFFORTS } from '../runtime/contract.ts';

export interface HybridDelegationLimits {
  readonly taskBytes: number;
  readonly contextBytes: number;
  readonly resultBytes: number;
  readonly stderrBytes: number;
  readonly defaultTimeoutMs: number;
  readonly maximumTimeoutMs: number;
  readonly concurrency: number;
  readonly terminationGraceMs: number;
}

export const HYBRID_DELEGATION_LIMITS: HybridDelegationLimits = {
  taskBytes: 32 * 1024,
  contextBytes: 128 * 1024,
  resultBytes: 256 * 1024,
  stderrBytes: 16 * 1024,
  defaultTimeoutMs: 2 * 60 * 1000,
  maximumTimeoutMs: 10 * 60 * 1000,
  concurrency: 2,
  terminationGraceMs: 250,
} as const;

export interface HybridDelegationRequest {
  readonly task: string;
  readonly context?: string;
  readonly model?: string;
  readonly effort?: string;
  readonly timeoutMs?: number;
}

export interface ValidatedHybridDelegationRequest {
  readonly task: string;
  readonly context?: string;
  readonly model: HybridDelegationModelId;
  readonly effort: Effort;
  readonly timeoutMs: number;
}

export interface HybridDelegationIdentity {
  readonly provider: 'openrouter';
  readonly model: HybridDelegationModelId;
  readonly effort: Effort;
}

export interface HybridDelegationResult {
  readonly output: string;
  readonly requested: HybridDelegationIdentity;
  readonly observed: HybridDelegationIdentity & { readonly source: 'opencode_argv' };
  readonly durationMs: number;
}

export class HybridDelegationError extends Error {
  constructor(
    readonly code:
      | 'invalid_request'
      | 'cancelled'
      | 'timed_out'
      | 'result_too_large'
      | 'worker_failed',
    message: string,
  ) {
    super(message);
    this.name = 'HybridDelegationError';
  }
}

const encoder = new TextEncoder();

function boundedText(
  value: unknown,
  name: string,
  maximumBytes: number,
  required: boolean,
): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || (required && !value.trim())) {
    throw new HybridDelegationError('invalid_request', `${name} must be a non-empty string`);
  }
  if (encoder.encode(value).byteLength > maximumBytes) {
    throw new HybridDelegationError('invalid_request', `${name} exceeds ${maximumBytes} bytes`);
  }
  return value;
}

/** Validates untrusted MCP input and applies the centralized worker defaults. */
export function validateHybridDelegationRequest(
  request: HybridDelegationRequest,
): ValidatedHybridDelegationRequest {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new HybridDelegationError('invalid_request', 'request must be an object');
  }
  const task = boundedText(request.task, 'task', HYBRID_DELEGATION_LIMITS.taskBytes, true)!;
  const context = boundedText(
    request.context,
    'context',
    HYBRID_DELEGATION_LIMITS.contextBytes,
    false,
  );
  const model = request.model ?? HYBRID_DELEGATION_DEFAULT_MODEL;
  if (!HYBRID_DELEGATION_MODEL_IDS.includes(model as HybridDelegationModelId)) {
    throw new HybridDelegationError(
      'invalid_request',
      'model is not approved for hybrid delegation',
    );
  }
  const effort = request.effort ?? 'high';
  if (!EFFORTS.includes(effort as Effort)) {
    throw new HybridDelegationError('invalid_request', 'effort is not supported');
  }
  const timeoutMs = request.timeoutMs ?? HYBRID_DELEGATION_LIMITS.defaultTimeoutMs;
  if (
    !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 ||
    timeoutMs > HYBRID_DELEGATION_LIMITS.maximumTimeoutMs
  ) {
    throw new HybridDelegationError(
      'invalid_request',
      `timeoutMs must be an integer from 1 to ${HYBRID_DELEGATION_LIMITS.maximumTimeoutMs}`,
    );
  }
  return {
    task,
    ...(context === undefined ? {} : { context }),
    model: model as HybridDelegationModelId,
    effort: effort as Effort,
    timeoutMs,
  };
}

/** Renders the only prompt content passed to the isolated worker. */
export function hybridDelegationPrompt(request: ValidatedHybridDelegationRequest): string {
  return request.context === undefined
    ? request.task
    : `Task:\n${request.task}\n\nCaller-provided context:\n${request.context}`;
}
