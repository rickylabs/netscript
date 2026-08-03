import {
  ENDPOINT_SOURCE_PRECEDENCE,
  type EndpointCandidate,
  type EndpointConflict,
  type EndpointSource,
  type EndpointSourceContext,
  type EndpointSourcePort,
  type FailedSourceOutcome,
  type ServiceEndpointDirectoryPort,
  type ServiceEndpointDirectoryResult,
  type ServiceEndpointProbePort,
  type ServiceEndpointProbeResult,
  type ServiceEndpointRow,
  type SourceOutcome,
} from '../ports/service-endpoint-directory-port.ts';
import { AppsettingsEndpointSource } from '../infrastructure/service-endpoints/appsettings-endpoint-source.ts';
import { AspireCliEndpointSource } from '../infrastructure/service-endpoints/aspire-cli-endpoint-source.ts';
import { FetchServiceEndpointProbe } from '../infrastructure/service-endpoints/fetch-service-endpoint-probe.ts';
import { OverrideEndpointSource } from '../infrastructure/service-endpoints/override-endpoint-source.ts';
import { RunManifestEndpointSource } from '../infrastructure/service-endpoints/run-manifest-endpoint-source.ts';

/** Default deadline for one service spec and identity probe. */
export const DEFAULT_SERVICE_ENDPOINT_TIMEOUT_MS = 3_000;
/** Default maximum number of service probes in flight. */
export const DEFAULT_SERVICE_ENDPOINT_CONCURRENCY = 4;

/** Options for composing the service endpoint directory. */
export interface ServiceEndpointDirectoryOptions {
  /** Project root supplied to the MCP process. */
  readonly projectRoot: string;
  /** Current AppHost run token required to trust the optional run manifest. */
  readonly expectedRunId?: string;
  /** Exact AppHost path supplied to the Aspire CLI adapter. */
  readonly appHostPath?: string;
  /** Override all four source adapters, keyed by the finite source axis. */
  readonly sourceAdapters?: Readonly<Record<EndpointSource, EndpointSourcePort>>;
  /** Override the network probe adapter. */
  readonly probe?: ServiceEndpointProbePort;
  /** Per-service deadline in milliseconds. */
  readonly timeoutMs?: number;
  /** Maximum number of probes in flight. */
  readonly concurrency?: number;
  /** Maximum response bytes retained by the default fetch probe. */
  readonly responseByteLimit?: number;
  /** Override the Web Platform fetch boundary used by the default probe. */
  readonly fetch?: typeof fetch;
}

/** Compose the four endpoint sources with bounded service probing. */
export function createServiceEndpointDirectory(
  options: ServiceEndpointDirectoryOptions,
): ServiceEndpointDirectoryPort {
  const sourceAdapters = options.sourceAdapters ?? {
    override: new OverrideEndpointSource(),
    'aspire-cli': new AspireCliEndpointSource(),
    'run-manifest': new RunManifestEndpointSource(),
    appsettings: new AppsettingsEndpointSource(),
  };
  const probe = options.probe ?? new FetchServiceEndpointProbe({
    ...(options.responseByteLimit === undefined
      ? {}
      : { responseByteLimit: options.responseByteLimit }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
  });
  return new ComposedServiceEndpointDirectory(
    {
      projectRoot: options.projectRoot,
      ...(options.expectedRunId === undefined ? {} : { expectedRunId: options.expectedRunId }),
      ...(options.appHostPath === undefined ? {} : { appHostPath: options.appHostPath }),
    },
    sourceAdapters,
    probe,
    positiveInteger(options.timeoutMs ?? DEFAULT_SERVICE_ENDPOINT_TIMEOUT_MS, 'timeoutMs'),
    positiveInteger(options.concurrency ?? DEFAULT_SERVICE_ENDPOINT_CONCURRENCY, 'concurrency'),
  );
}

class ComposedServiceEndpointDirectory implements ServiceEndpointDirectoryPort {
  constructor(
    private readonly context: EndpointSourceContext,
    private readonly sourceAdapters: Readonly<Record<EndpointSource, EndpointSourcePort>>,
    private readonly probe: ServiceEndpointProbePort,
    private readonly timeoutMs: number,
    private readonly concurrency: number,
  ) {}

  async list(signal?: AbortSignal): Promise<ServiceEndpointDirectoryResult> {
    signal?.throwIfAborted();
    const sources = await Promise.all(
      ENDPOINT_SOURCE_PRECEDENCE.map((source) => this.#readSource(source, signal)),
    );
    signal?.throwIfAborted();
    const candidates = collectCandidates(sources);
    const exclusions = collectExclusions(sources);
    const names = [...new Set([...candidates.keys(), ...exclusions])].sort();
    const entries = new Array<ServiceEndpointRow>(names.length);
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const index = nextIndex++;
        if (index >= names.length) return;
        const name = names[index]!;
        const selected = selectCandidate(candidates.get(name) ?? []);
        entries[index] = await this.#row(name, selected, exclusions.has(name), signal);
      }
    };
    const workerCount = Math.min(this.concurrency, Math.max(1, names.length));
    await Promise.all(Array.from({ length: workerCount }, worker));
    signal?.throwIfAborted();
    return { entries, sources };
  }

  async #readSource(source: EndpointSource, signal?: AbortSignal): Promise<SourceOutcome> {
    try {
      const outcome = await this.sourceAdapters[source].read(this.context, signal);
      if (outcome.source !== source) {
        return sourceFailure(source, `source adapter returned outcome for ${outcome.source}`);
      }
      return outcome;
    } catch (error) {
      if (signal?.aborted) signal.throwIfAborted();
      return sourceFailure(source, describe(error));
    }
  }

  async #row(
    name: string,
    selected: SelectedCandidate | undefined,
    excluded: boolean,
    signal?: AbortSignal,
  ): Promise<ServiceEndpointRow> {
    const candidate = selected?.candidate;
    const source = candidate?.source ?? 'override';
    const conflicts = selected?.conflicts ?? [];
    if (excluded) {
      return {
        name,
        status: 'excluded',
        source,
        conflicts,
        ...(candidate?.baseUrl === undefined ? {} : { baseUrl: candidate.baseUrl }),
        reason: 'Service is excluded by introspection.excludeServices.',
      };
    }
    if (!candidate?.baseUrl) {
      return {
        name,
        status: 'not_running',
        source,
        conflicts,
        reason: 'Service is configured without a currently discovered endpoint.',
      };
    }

    const result = await probeWithDeadline(this.probe, candidate, this.timeoutMs, signal);
    return rowFromProbe({ ...candidate, baseUrl: candidate.baseUrl }, conflicts, result);
  }
}

interface SelectedCandidate {
  readonly candidate: EndpointCandidate;
  readonly conflicts: readonly EndpointConflict[];
}

function collectCandidates(sources: readonly SourceOutcome[]): Map<string, EndpointCandidate[]> {
  const candidates = new Map<string, EndpointCandidate[]>();
  for (const source of sources) {
    if (source.outcome !== 'used') continue;
    for (const candidate of source.candidates) {
      const existing = candidates.get(candidate.name) ?? [];
      existing.push(candidate);
      candidates.set(candidate.name, existing);
    }
  }
  return candidates;
}

function collectExclusions(sources: readonly SourceOutcome[]): Set<string> {
  const exclusions = new Set<string>();
  for (const source of sources) {
    if (source.outcome !== 'used') continue;
    for (const name of source.excludedServices) exclusions.add(name);
  }
  return exclusions;
}

function selectCandidate(candidates: readonly EndpointCandidate[]): SelectedCandidate | undefined {
  const ordered = [...candidates].sort((left, right) =>
    ENDPOINT_SOURCE_PRECEDENCE.indexOf(left.source) -
    ENDPOINT_SOURCE_PRECEDENCE.indexOf(right.source)
  );
  const candidate = ordered[0];
  if (!candidate) return undefined;
  const conflicts: EndpointConflict[] = [];
  const seen = new Set<string>();
  for (const lower of ordered.slice(1)) {
    if (!candidate.baseUrl || !lower.baseUrl || candidate.baseUrl === lower.baseUrl) continue;
    const key = `${lower.source}\n${lower.baseUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    conflicts.push({ source: lower.source, baseUrl: lower.baseUrl });
  }
  return { candidate, conflicts };
}

async function probeWithDeadline(
  probe: ServiceEndpointProbePort,
  candidate: EndpointCandidate,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<ServiceEndpointProbeResult> {
  signal?.throwIfAborted();
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const aborted = new Promise<{ kind: 'aborted' }>((resolve) => {
    combined.addEventListener('abort', () => resolve({ kind: 'aborted' }), { once: true });
  });
  const operation = Promise.resolve()
    .then(() => probe.probe(candidate, combined))
    .then(
      (result): { kind: 'result'; result: ServiceEndpointProbeResult } => ({
        kind: 'result',
        result,
      }),
      (error): { kind: 'error'; error: unknown } => ({ kind: 'error', error }),
    );
  const settled = await Promise.race([operation, aborted]);
  if (settled.kind === 'result') return settled.result;
  if (settled.kind === 'error') {
    if (signal?.aborted) signal.throwIfAborted();
    return {
      outcome: 'spec_unavailable',
      reason: `Endpoint probe failed: ${describe(settled.error)}`,
    };
  }
  if (signal?.aborted) signal.throwIfAborted();
  return {
    outcome: 'spec_unavailable',
    reason: `OpenAPI probe timed out after ${timeoutMs}ms.`,
  };
}

function rowFromProbe(
  candidate: EndpointCandidate & { readonly baseUrl: string },
  conflicts: readonly EndpointConflict[],
  result: ServiceEndpointProbeResult,
): ServiceEndpointRow {
  const base = {
    name: candidate.name,
    baseUrl: candidate.baseUrl,
    source: candidate.source,
    conflicts,
  };
  if (result.outcome === 'running') {
    return { ...base, status: 'running', spec: result.spec };
  }
  return {
    ...base,
    status: result.outcome,
    reason: result.reason,
    ...(result.httpStatus === undefined ? {} : { httpStatus: result.httpStatus }),
    ...(result.guidance === undefined ? {} : { guidance: result.guidance }),
  };
}

function sourceFailure(source: EndpointSource, reason: string): FailedSourceOutcome {
  return {
    source,
    outcome: 'failed',
    code: 'source_failed',
    reason,
    candidates: [],
    excludedServices: [],
  };
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
  return value;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
