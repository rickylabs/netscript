/**
 * Shared SDK data contracts.
 *
 * @module
 */

/**
 * Service metadata.
 */
export interface ServiceMetadata {
  /** Service identifier. */
  name: string;
  /** Service version string. */
  version: string;
  /** Human-readable service description. */
  description: string;
  /** Runtime hosting the service. */
  runtime: 'deno' | 'bun' | 'dotnet';
  /** Optional named endpoint map exposed by the service. */
  endpoints?: Record<string, string>;
}

/**
 * Paginated response contract.
 *
 * @typeParam TItem - Page item type.
 */
export interface PaginatedResponse<TItem> {
  /** Page items for the current slice. */
  items: TItem[];
  /** Total number of matching records. */
  total: number;
  /** Page size applied to the query. */
  limit: number;
  /** Zero-based offset used for the query. */
  offset: number;
  /** Whether another page exists after the current slice. */
  hasMore: boolean;
}

/**
 * Health-check response contract.
 */
export interface HealthCheckResponse {
  /** Overall health classification. */
  status: 'healthy' | 'unhealthy' | 'degraded';
  /** Name of the service that produced the health response. */
  service: string;
  /** ISO timestamp when the health check was generated. */
  timestamp: string;
  /** Optional per-check pass/fail results. */
  checks?: Record<string, boolean>;
}
