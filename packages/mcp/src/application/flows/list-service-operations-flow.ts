import { describeOpenApiOperation } from '../../domain/openapi/description-ladder.ts';
import { indexOpenApiOperations } from '../../domain/openapi/operation-index.ts';
import type { OperationAccessSummary } from '../../domain/openapi/operation-access.ts';
import type { ServiceEndpointDirectoryPort } from '../../ports/service-endpoint-directory-port.ts';
import type { ToolFlow } from '../../domain/tool-types.ts';

/** Maximum rows retained by this flow, below the central 50-row truncator. */
export const SERVICE_OPERATION_RESULT_LIMIT = 49;

/** One bounded operation row. */
export interface ServiceOperationSummary {
  /** Canonical dotted id or method-path fallback. */ readonly operation: string;
  /** Canonical HTTP method. */ readonly method: string;
  /** Exact OpenAPI path template. */ readonly path: string;
  /** S4 description-ladder result. */ readonly summary: string;
  /** Declared OpenAPI tags. */ readonly tags: readonly string[];
  /** Bounded declared access facts; absent when access is undeclared. */
  readonly access?: OperationAccessSummary;
}

/** Successful operation-list value. */
export interface ListServiceOperationsResult {
  /** Selected service. */ readonly service: string;
  /** Retained operation rows. */ readonly operations: readonly ServiceOperationSummary[];
  /** True exactly when at least one matching row was dropped. */ readonly truncated: boolean;
}

interface ListServiceOperationsInput {
  readonly service: string;
  readonly filter?: string;
  readonly limit?: number;
}

/** Create the operation-list flow from the existing endpoint directory and S4 projection. */
export function createListServiceOperationsFlow(directory: ServiceEndpointDirectoryPort): ToolFlow {
  return async (input) => {
    const parsed = parseInput(input);
    if (!parsed) return invalidInput('service must be a non-empty string');
    const result = await directory.list();
    const row = result.entries.find((candidate) => candidate.name === parsed.service);
    if (!row) {
      return serviceFailure(
        'service_unknown',
        parsed.service,
        result.entries.slice(0, 3).map((candidate) => candidate.name),
      );
    }
    if (row.status !== 'running') return serviceFailure(`service_${row.status}`, parsed.service);

    const needle = parsed.filter?.toLocaleLowerCase('en-US');
    const matching = indexOpenApiOperations(row.spec).operations
      .map((operation): ServiceOperationSummary => ({
        operation: operation.canonicalId,
        method: operation.method,
        path: operation.path,
        summary: describeOpenApiOperation(operation),
        tags: Array.isArray(operation.operation.tags)
          ? operation.operation.tags.filter((tag): tag is string => typeof tag === 'string')
          : [],
      }))
      .filter((operation) => !needle || operationSearchText(operation).includes(needle));
    const limit = Math.min(
      parsed.limit ?? SERVICE_OPERATION_RESULT_LIMIT,
      SERVICE_OPERATION_RESULT_LIMIT,
    );
    return {
      ok: true,
      value: {
        service: parsed.service,
        operations: matching.slice(0, limit),
        truncated: matching.length > limit,
      } satisfies ListServiceOperationsResult,
    };
  };
}

function parseInput(input: unknown): ListServiceOperationsInput | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const record = input as Record<string, unknown>;
  if (typeof record.service !== 'string' || record.service.length === 0) return undefined;
  if (record.filter !== undefined && typeof record.filter !== 'string') return undefined;
  if (
    record.limit !== undefined &&
    (typeof record.limit !== 'number' || !Number.isInteger(record.limit) || record.limit < 1)
  ) {
    return undefined;
  }
  return {
    service: record.service,
    ...(typeof record.filter === 'string' ? { filter: record.filter } : {}),
    ...(typeof record.limit === 'number' ? { limit: record.limit } : {}),
  };
}

function operationSearchText(operation: ServiceOperationSummary): string {
  return [
    operation.operation,
    operation.method,
    operation.path,
    operation.summary,
    ...operation.tags,
  ]
    .join('\n').toLocaleLowerCase('en-US');
}

function invalidInput(message: string): Awaited<ReturnType<ToolFlow>> {
  return { ok: false, error: { code: 'invalid_input', message } };
}

function serviceFailure(
  code: string,
  service: string,
  known?: readonly string[],
): Awaited<ReturnType<ToolFlow>> {
  const suffix = known ? ` Known services: ${known.join(', ') || 'none'}.` : '';
  return { ok: false, error: { code, message: `Service "${service}" is unavailable.${suffix}` } };
}
