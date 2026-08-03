/** Finite endpoint sources consulted by the service directory. */
export const ENDPOINT_SOURCES = [
  'override',
  'aspire-cli',
  'run-manifest',
  'appsettings',
] as const;

/** Endpoint discovery source identifier. */
export type EndpointSource = (typeof ENDPOINT_SOURCES)[number];

/** Current per-service arbitration order, highest priority first. */
export const ENDPOINT_SOURCE_PRECEDENCE: readonly EndpointSource[] = Object.freeze([
  'override',
  'aspire-cli',
  'run-manifest',
  'appsettings',
]);

/** Stable source failure classifications exposed to directory consumers. */
export const SOURCE_FAILURE_CODES = [
  'unreadable',
  'invalid',
  'project_root_mismatch',
  'expected_run_id_missing',
  'run_id_mismatch',
  'command_not_found',
  'command_failed',
  'parse_failed',
] as const;

/** Machine-readable endpoint source failure classification. */
export type SourceFailureCode = (typeof SOURCE_FAILURE_CODES)[number];

/** One service endpoint fact emitted by a source adapter. */
export interface EndpointCandidate {
  /** Service identity expected from the running process. */
  readonly name: string;
  /** Candidate base URL, absent when a configured service has no running endpoint. */
  readonly baseUrl?: string;
  /** Adapter that produced this fact. */
  readonly source: EndpointSource;
  /** Whether the URL came from an explicit human-written override. */
  readonly operatorTrusted: boolean;
}

/** A source was read successfully, including a valid empty result. */
export interface UsedSourceOutcome {
  readonly source: EndpointSource;
  readonly outcome: 'used';
  readonly candidates: readonly EndpointCandidate[];
  /** Service names excluded by this source's configuration. */
  readonly excludedServices: readonly string[];
}

/** A source carrier was not present. */
export interface AbsentSourceOutcome {
  readonly source: EndpointSource;
  readonly outcome: 'absent';
  readonly candidates: readonly [];
  readonly excludedServices: readonly [];
}

/** A present or required source could not produce trustworthy facts. */
export interface FailedSourceOutcome {
  readonly source: EndpointSource;
  readonly outcome: 'failed';
  readonly code: SourceFailureCode;
  readonly reason: string;
  readonly candidates: readonly [];
  readonly excludedServices: readonly [];
}

/** Honest outcome of consulting one endpoint source. */
export type SourceOutcome = UsedSourceOutcome | AbsentSourceOutcome | FailedSourceOutcome;

/** Read context shared by endpoint source adapters. */
export interface EndpointSourceContext {
  /** Project root supplied to the MCP process. */
  readonly projectRoot: string;
  /** Current AppHost run token expected in a run manifest. */
  readonly expectedRunId?: string;
  /** Exact AppHost path used to disambiguate the Aspire query. */
  readonly appHostPath?: string;
}

/** Supplies endpoint candidates from one external discovery carrier. */
export interface EndpointSourcePort {
  /** Read one source without hiding absence or failure. */
  read(context: EndpointSourceContext, signal?: AbortSignal): Promise<SourceOutcome>;
}

/** Finite service states returned by the endpoint directory. */
export const SERVICE_ENDPOINT_STATUSES = [
  'running',
  'not_running',
  'spec_unavailable',
  'identity_mismatch',
  'excluded',
] as const;

/** Service endpoint status after bounded probing. */
export type ServiceEndpointStatus = (typeof SERVICE_ENDPOINT_STATUSES)[number];

/** One lower-precedence endpoint value that disagreed with the selected candidate. */
export interface EndpointConflict {
  readonly source: EndpointSource;
  readonly baseUrl: string;
}

/** Successful spec and service-identity probe. */
export interface RunningServiceEndpointProbeResult {
  readonly outcome: 'running';
  /** Parsed OpenAPI document retained opaquely for the later projection slice. */
  readonly spec: unknown;
}

/** Expected degraded probe result converted to one directory row. */
export interface FailedServiceEndpointProbeResult {
  readonly outcome: Exclude<ServiceEndpointStatus, 'running' | 'excluded'>;
  readonly reason: string;
  readonly httpStatus?: number;
  readonly guidance?: string;
}

/** Result of probing one endpoint candidate. */
export type ServiceEndpointProbeResult =
  | RunningServiceEndpointProbeResult
  | FailedServiceEndpointProbeResult;

/** Performs bounded OpenAPI and service-identity checks for one candidate. */
export interface ServiceEndpointProbePort {
  /** Probe one candidate while honoring caller cancellation. */
  probe(candidate: EndpointCandidate, signal: AbortSignal): Promise<ServiceEndpointProbeResult>;
}

interface ServiceEndpointRowBase {
  readonly name: string;
  readonly source: EndpointSource;
  readonly conflicts: readonly EndpointConflict[];
}

/** A verified service endpoint with an opaque parsed OpenAPI document. */
export interface RunningServiceEndpointRow extends ServiceEndpointRowBase {
  readonly status: 'running';
  readonly baseUrl: string;
  readonly spec: unknown;
}

/** A configured service for which no listener could be reached. */
export interface NotRunningServiceEndpointRow extends ServiceEndpointRowBase {
  readonly status: 'not_running';
  readonly baseUrl?: string;
  readonly reason: string;
}

/** A listening service whose OpenAPI document could not be consumed. */
export interface SpecUnavailableServiceEndpointRow extends ServiceEndpointRowBase {
  readonly status: 'spec_unavailable';
  readonly baseUrl: string;
  readonly reason: string;
  readonly httpStatus?: number;
  readonly guidance?: string;
}

/** An endpoint that did not identify as the selected service. */
export interface IdentityMismatchServiceEndpointRow extends ServiceEndpointRowBase {
  readonly status: 'identity_mismatch';
  readonly baseUrl: string;
  readonly reason: string;
}

/** A service deliberately excluded before any network request. */
export interface ExcludedServiceEndpointRow extends ServiceEndpointRowBase {
  readonly status: 'excluded';
  readonly baseUrl?: string;
  readonly reason: string;
}

/** One stable service row returned by the directory. */
export type ServiceEndpointRow =
  | RunningServiceEndpointRow
  | NotRunningServiceEndpointRow
  | SpecUnavailableServiceEndpointRow
  | IdentityMismatchServiceEndpointRow
  | ExcludedServiceEndpointRow;

/** Complete service directory result, including all consulted source outcomes. */
export interface ServiceEndpointDirectoryResult {
  readonly entries: readonly ServiceEndpointRow[];
  readonly sources: readonly SourceOutcome[];
}

/** Application-facing directory consumed by later MCP tool slices. */
export interface ServiceEndpointDirectoryPort {
  /** List stable service rows and every source outcome. */
  list(signal?: AbortSignal): Promise<ServiceEndpointDirectoryResult>;
}
