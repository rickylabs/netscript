import { indexOpenApiOperations } from '../../domain/openapi/operation-index.ts';
import type {
  ServiceEndpointDirectoryPort,
  ServiceEndpointRow,
  SourceOutcome,
} from '../../ports/service-endpoint-directory-port.ts';
import type { ToolFlow } from '../../domain/tool-types.ts';

/** Maximum service rows retained by this flow, below the central 50-row truncator. */
export const API_SERVICE_RESULT_LIMIT = 49;

/** One service rendered for OpenAPI introspection. */
export interface ApiServiceSummary {
  /** Stable service name. */ readonly name: string;
  /** Current directory status. */ readonly status: ServiceEndpointRow['status'];
  /** Selected discovery source. */ readonly source: ServiceEndpointRow['source'];
  /** Lower-priority endpoint disagreements. */ readonly conflicts: ServiceEndpointRow['conflicts'];
  /** Selected live base URL when one is known. */ readonly baseUrl?: string;
  /** OpenAPI document URL derived from the selected base URL. */ readonly specUrl?: string;
  /** Scalar documentation URL derived from the selected base URL. */ readonly docsUrl?: string;
  /** Operation count, present only when a parsed spec was fetched. */ readonly operationCount?:
    number;
  /** Bounded degraded-state detail. */ readonly reason?: string;
  /** HTTP status associated with an unavailable spec. */ readonly httpStatus?: number;
  /** Operator remediation associated with an unavailable spec. */ readonly guidance?: string;
}

/** Complete service-list value, including the exact S5 source outcomes. */
export interface ListApiServicesResult {
  /** Stable service summaries. */ readonly services: readonly ApiServiceSummary[];
  /** S5 source outcomes, forwarded without transformation. */ readonly sources:
    readonly SourceOutcome[];
  /** True exactly when at least one service row was dropped. */ readonly truncated: boolean;
}

/** Create the service-list flow from the existing endpoint directory. */
export function createListApiServicesFlow(directory: ServiceEndpointDirectoryPort): ToolFlow {
  return async () => {
    const result = await directory.list();
    return {
      ok: true,
      value: {
        services: result.entries.slice(0, API_SERVICE_RESULT_LIMIT).map(serviceSummary),
        sources: result.sources,
        truncated: result.entries.length > API_SERVICE_RESULT_LIMIT,
      } satisfies ListApiServicesResult,
    };
  };
}

function serviceSummary(row: ServiceEndpointRow): ApiServiceSummary {
  const base = 'baseUrl' in row ? row.baseUrl : undefined;
  const reason = 'reason' in row ? row.reason : undefined;
  return {
    name: row.name,
    status: row.status,
    source: row.source,
    conflicts: row.conflicts,
    ...(base === undefined ? {} : {
      baseUrl: base,
      specUrl: endpointUrl(base, '/api/openapi.json'),
      docsUrl: endpointUrl(base, '/api/docs'),
    }),
    ...(row.status === 'running'
      ? { operationCount: indexOpenApiOperations(row.spec).operations.length }
      : {}),
    ...(reason === undefined ? {} : { reason }),
    ...(row.status === 'spec_unavailable' && row.httpStatus !== undefined
      ? { httpStatus: row.httpStatus }
      : {}),
    ...(row.status === 'spec_unavailable' && row.guidance !== undefined
      ? { guidance: row.guidance }
      : {}),
  };
}

function endpointUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}
