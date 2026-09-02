import { resolveCanonicalOperation } from '../../domain/openapi/canonical-identity.ts';
import { indexOpenApiOperations } from '../../domain/openapi/operation-index.ts';
import {
  deriveOperationAccessSummary,
  type OperationAccessSummary,
} from '../../domain/openapi/operation-access.ts';
import {
  projectOperationSchemaViews,
  SCHEMA_VIEW_NAMES,
  type SchemaViewName,
} from '../../domain/openapi/schema-views.ts';
import type { ServiceEndpointDirectoryPort } from '../../ports/service-endpoint-directory-port.ts';
import type { ToolExecutionResult, ToolFlow } from '../../domain/tool-types.ts';

/** Explicit warning attached to every unauthenticated curl request template. */
export const OPENAPI_CURL_AUTH_NOTE =
  'Unauthenticated request template only; add authorization explicitly when the service requires it.';

/** Successful operation-schema value. */
export interface GetOperationSchemaResult {
  /** Selected service. */ readonly service: string;
  /** Canonical resolved operation identity. */ readonly operation: string;
  /** Canonical HTTP method. */ readonly method: string;
  /** Exact OpenAPI path template. */ readonly path: string;
  /** Selected projection view. */ readonly view: SchemaViewName;
  /** S4-projected schema view. */ readonly schema: unknown;
  /** Explicitly unauthenticated request template. */ readonly curlExample: string;
  /** Authentication caveat for the request template. */ readonly authNote: string;
  /** Bounded declared access facts; absent when access is undeclared. */
  readonly access?: OperationAccessSummary;
}

interface GetOperationSchemaInput {
  readonly service: string;
  readonly operation: string;
  readonly view: SchemaViewName;
}

/** Create the schema-view flow from the existing endpoint directory and S4 projection. */
export function createGetOperationSchemaFlow(directory: ServiceEndpointDirectoryPort): ToolFlow {
  return async (input) => {
    const parsed = parseInput(input);
    if (!parsed) return failure('invalid_input', 'service and operation must be non-empty strings');
    const result = await directory.list();
    const row = result.entries.find((candidate) => candidate.name === parsed.service);
    if (!row) return failure('service_unknown', `Unknown service "${parsed.service}".`);
    if (row.status !== 'running') {
      return failure(`service_${row.status}`, `Service "${parsed.service}" is ${row.status}.`);
    }
    const index = indexOpenApiOperations(row.spec);
    const resolution = resolveCanonicalOperation(index, parsed.operation);
    if (resolution.status !== 'resolved') {
      const candidates =
        (resolution.status === 'ambiguous' ? resolution.candidates : resolution.suggestions).slice(
          0,
          3,
        );
      return failure(
        resolution.status === 'ambiguous' ? 'operation_ambiguous' : 'operation_unknown',
        `Operation "${parsed.operation}" was not resolved. Candidates: ${
          candidates.map((candidate) => candidate.canonicalId).join(', ') || 'none'
        }.`,
      );
    }
    const operation = resolution.operation;
    const views = projectOperationSchemaViews(index.document, operation);
    const access = deriveOperationAccessSummary(operation.operation);
    const guidance = curlGuidance(row.baseUrl, operation.method, operation.path, access);
    return {
      ok: true,
      value: {
        service: parsed.service,
        operation: operation.canonicalId,
        method: operation.method,
        path: operation.path,
        view: parsed.view,
        schema: views[parsed.view],
        ...guidance,
        ...(access ? { access } : {}),
      } satisfies GetOperationSchemaResult,
    };
  };
}

function parseInput(input: unknown): GetOperationSchemaInput | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const record = input as Record<string, unknown>;
  if (typeof record.service !== 'string' || !record.service) return undefined;
  if (typeof record.operation !== 'string' || !record.operation) return undefined;
  const view = record.view ?? 'all';
  if (typeof view !== 'string' || !SCHEMA_VIEW_NAMES.includes(view as SchemaViewName)) {
    return undefined;
  }
  return { service: record.service, operation: record.operation, view: view as SchemaViewName };
}

interface CurlGuidance {
  readonly curlExample: string;
  readonly authNote: string;
}

function curlGuidance(
  baseUrl: string,
  method: string,
  path: string,
  access: OperationAccessSummary | undefined,
): CurlGuidance {
  const url = `${baseUrl.replace(/\/$/, '')}${path}`;
  const curlExample = `curl -X ${method} '${url}'`;
  switch (access?.authentication) {
    case 'none':
      return {
        curlExample: `${curlExample} # Public operation: no Authorization header required`,
        authNote: 'Public operation; no Authorization header is required.',
      };
    case 'optional':
      return {
        curlExample:
          `${curlExample} # Optional authentication: add an Authorization header if needed`,
        authNote:
          'Authentication is optional; add an Authorization header only when identity is needed.',
      };
    case 'required':
      return {
        curlExample: `curl -X ${method} -H 'Authorization: Bearer <credential>' '${url}'`,
        authNote:
          'Authentication is required; add an Authorization header before sending this request.',
      };
    default:
      return { curlExample, authNote: OPENAPI_CURL_AUTH_NOTE };
  }
}

function failure(code: string, message: string): ToolExecutionResult {
  return { ok: false, error: { code, message } };
}
