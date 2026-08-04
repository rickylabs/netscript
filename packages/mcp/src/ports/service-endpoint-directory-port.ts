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
  'run_id_mismatch',
  'source_failed',
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
  /** Source adapter that completed successfully. */
  readonly source: EndpointSource;
  /** Successful source-read discriminator. */
  readonly outcome: 'used';
  /** Endpoint facts emitted by the source, possibly empty. */
  readonly candidates: readonly EndpointCandidate[];
  /** Service names excluded by this source's configuration. */
  readonly excludedServices: readonly string[];
}

/** A source carrier was not present. */
export interface AbsentSourceOutcome {
  /** Source adapter whose carrier was absent. */
  readonly source: EndpointSource;
  /** Missing-carrier discriminator. */
  readonly outcome: 'absent';
  /** No candidates are available from an absent source. */
  readonly candidates: readonly [];
  /** No exclusions are available from an absent source. */
  readonly excludedServices: readonly [];
}

/** A present or required source could not produce trustworthy facts. */
export interface FailedSourceOutcome {
  /** Source adapter that could not produce trustworthy facts. */
  readonly source: EndpointSource;
  /** Failed source-read discriminator. */
  readonly outcome: 'failed';
  /** Machine-readable failure classification. */
  readonly code: SourceFailureCode;
  /** Human-readable bounded failure detail. */
  readonly reason: string;
  /** Failed sources never contribute candidates. */
  readonly candidates: readonly [];
  /** Failed sources never contribute exclusions. */
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
  /** Lower-precedence source that supplied a different URL. */
  readonly source: EndpointSource;
  /** Discarded lower-precedence base URL. */
  readonly baseUrl: string;
}

/** Successful spec and service-identity probe. */
export interface RunningServiceEndpointProbeResult {
  /** Successful probe discriminator. */
  readonly outcome: 'running';
  /** Parsed OpenAPI document retained opaquely for the later projection slice. */
  readonly spec: unknown;
}

/** Expected degraded probe result converted to one directory row. */
export interface FailedServiceEndpointProbeResult {
  /** Degraded probe classification. */
  readonly outcome: Exclude<ServiceEndpointStatus, 'running' | 'excluded'>;
  /** Human-readable bounded failure detail. */
  readonly reason: string;
  /** Response status when an HTTP response caused the failure. */
  readonly httpStatus?: number;
  /** Operator remediation when the failure has ratified guidance. */
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

/** Identity and arbitration facts shared by every service endpoint row. */
export interface ServiceEndpointRowBase {
  /** Stable service name. */
  readonly name: string;
  /** Source selected by precedence for this service. */
  readonly source: EndpointSource;
  /** Lower-precedence URLs that disagreed with the selected candidate. */
  readonly conflicts: readonly EndpointConflict[];
}

/** A verified service endpoint with an opaque parsed OpenAPI document. */
export interface RunningServiceEndpointRow extends ServiceEndpointRowBase {
  /** Verified-running row discriminator. */
  readonly status: 'running';
  /** Selected and verified service base URL. */
  readonly baseUrl: string;
  /** Parsed OpenAPI document retained opaquely for later consumers. */
  readonly spec: unknown;
}

/** A configured service for which no listener could be reached. */
export interface NotRunningServiceEndpointRow extends ServiceEndpointRowBase {
  /** Not-running row discriminator. */
  readonly status: 'not_running';
  /** Selected URL when discovery found one but no listener was reachable. */
  readonly baseUrl?: string;
  /** Human-readable bounded failure detail. */
  readonly reason: string;
}

/** A listening service whose OpenAPI document could not be consumed. */
export interface SpecUnavailableServiceEndpointRow extends ServiceEndpointRowBase {
  /** Unavailable-spec row discriminator. */
  readonly status: 'spec_unavailable';
  /** Selected service base URL. */
  readonly baseUrl: string;
  /** Human-readable bounded failure detail. */
  readonly reason: string;
  /** Response status when an HTTP response caused the failure. */
  readonly httpStatus?: number;
  /** Operator remediation for an unavailable spec. */
  readonly guidance?: string;
}

/** An endpoint that did not identify as the selected service. */
export interface IdentityMismatchServiceEndpointRow extends ServiceEndpointRowBase {
  /** Identity-mismatch row discriminator. */
  readonly status: 'identity_mismatch';
  /** Selected URL that identified as another service. */
  readonly baseUrl: string;
  /** Human-readable bounded mismatch detail. */
  readonly reason: string;
}

/** A service deliberately excluded before any network request. */
export interface ExcludedServiceEndpointRow extends ServiceEndpointRowBase {
  /** Excluded row discriminator. */
  readonly status: 'excluded';
  /** Selected URL when discovery produced one before exclusion. */
  readonly baseUrl?: string;
  /** Human-readable exclusion detail. */
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
  /** Stable service rows sorted by service name. */
  readonly entries: readonly ServiceEndpointRow[];
  /** Outcome from every source in precedence order. */
  readonly sources: readonly SourceOutcome[];
}

/** Application-facing directory consumed by later MCP tool slices. */
export interface ServiceEndpointDirectoryPort {
  /** List stable service rows and every source outcome. */
  list(signal?: AbortSignal): Promise<ServiceEndpointDirectoryResult>;
}
