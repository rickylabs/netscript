import type { IndexedOpenApiOperation, OpenApiOperationIndex } from './operation-index.ts';

/** The exact identity tier that resolved an OpenAPI operation. */
export type OperationIdentityKind = 'operationId' | 'methodPath';

/** Successful exact canonical lookup. */
export interface ResolvedOperation {
  /** Resolution discriminator. */
  readonly status: 'resolved';
  /** Exact identity tier that matched. */
  readonly matchedBy: OperationIdentityKind;
  /** The single matched operation. */
  readonly operation: IndexedOpenApiOperation;
}

/** Refusal result when one exact identity names multiple operations. */
export interface AmbiguousOperation {
  /** Resolution discriminator. */
  readonly status: 'ambiguous';
  /** Unmodified caller input. */
  readonly input: string;
  /** All exact candidates in deterministic source order. */
  readonly candidates: readonly IndexedOpenApiOperation[];
}

/** Refusal result when no exact identity matches. */
export interface UnknownOperation {
  /** Resolution discriminator. */
  readonly status: 'unknown';
  /** Unmodified caller input. */
  readonly input: string;
  /** Case-insensitive or substring hints that were not executed as aliases. */
  readonly suggestions: readonly IndexedOpenApiOperation[];
}

/** Refusal-first result of resolving one operation identity. */
export type OperationResolution = ResolvedOperation | AmbiguousOperation | UnknownOperation;

function exactResult(
  input: string,
  matchedBy: OperationIdentityKind,
  candidates: readonly IndexedOpenApiOperation[],
): OperationResolution | undefined {
  if (candidates.length === 1) {
    return Object.freeze({ status: 'resolved', matchedBy, operation: candidates[0]! });
  }
  if (candidates.length > 1) {
    return Object.freeze({
      status: 'ambiguous',
      input,
      candidates: Object.freeze([...candidates]),
    });
  }
  return undefined;
}

function fuzzyMatch(operation: IndexedOpenApiOperation, input: string): boolean {
  if (!input) return false;
  const needle = input.toLocaleLowerCase('en-US');
  return [operation.operationId, operation.methodPath].some((identity) => {
    if (!identity) return false;
    const candidate = identity.toLocaleLowerCase('en-US');
    return candidate.includes(needle) || needle.includes(candidate);
  });
}

/**
 * Resolve one exact case-sensitive operation identity or return a refusal with hints.
 *
 * Declared operation ids have precedence over exact `METHOD /path` identities. Fuzzy matches are
 * suggestions only and never select an operation.
 */
export function resolveCanonicalOperation(
  index: OpenApiOperationIndex,
  input: string,
): OperationResolution {
  const operationIdMatches = index.operations.filter((candidate) =>
    candidate.operationId === input
  );
  const byOperationId = exactResult(input, 'operationId', operationIdMatches);
  if (byOperationId) return byOperationId;

  const methodPathMatches = index.operations.filter((candidate) => candidate.methodPath === input);
  const byMethodPath = exactResult(input, 'methodPath', methodPathMatches);
  if (byMethodPath) return byMethodPath;

  return Object.freeze({
    status: 'unknown',
    input,
    suggestions: Object.freeze(
      index.operations.filter((candidate) => fuzzyMatch(candidate, input)),
    ),
  });
}
