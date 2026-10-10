/**
 * @module kernel/domain/docker-topology
 *
 * Docker daemon topology contract for the generated Aspire AppHost.
 *
 * A TypeScript AppHost is a host service: it reaches Aspire-provisioned containers through the
 * ports the Docker daemon publishes, addressed as `localhost` on the AppHost machine. When the
 * daemon runs on another machine, those ports land on the daemon host's interfaces instead, and
 * every health wait against them hangs. This module classifies the daemon endpoint and compares
 * observed published bindings with that loopback expectation. It is pure: the adapter supplies
 * recorded `DOCKER_CONTEXT` / `DOCKER_HOST`, `docker context inspect`, and `docker inspect` facts.
 *
 * A verdict is `local` only when the evidence proves it; anything undeterminable is
 * `inconclusive`, never a pass.
 */

/**
 * Where the daemon endpoint was read from. Docker's own precedence is `DOCKER_CONTEXT`, then
 * `DOCKER_HOST`, then the current context from the CLI configuration (`docker-context`).
 */
export type DockerEndpointSource = 'DOCKER_CONTEXT' | 'DOCKER_HOST' | 'docker-context';

/** Locality of the Docker daemon relative to the machine running the AppHost. */
export type DockerEndpointLocality = 'local' | 'remote' | 'unknown';

/** Classified Docker daemon endpoint. */
export interface DockerEndpoint {
  /** Locality derived from the endpoint URL. */
  readonly locality: DockerEndpointLocality;
  /** Raw endpoint URL, when one was observed. */
  readonly host?: string;
  /** Endpoint source, when one was observed. */
  readonly source?: DockerEndpointSource;
  /** Context the endpoint belongs to; later Docker calls pin it so they reach the same daemon. */
  readonly context?: string;
  /** Daemon hostname for `remote` endpoints. */
  readonly daemonHost?: string;
  /** Why the locality could not be determined, for `unknown` endpoints. */
  readonly reason?: string;
}

/** One container port the daemon published on its host. */
export interface PublishedBinding {
  /** Container name without Docker's leading slash. */
  readonly container: string;
  /** Container-side port and protocol, e.g. `5432/tcp`. */
  readonly containerPort: string;
  /** Daemon-host interface the port is bound to (never empty); `0.0.0.0`/`::` mean all. */
  readonly hostIp: string;
  /** Daemon-host port. */
  readonly hostPort: string;
}

/** Published-binding observation for the AppHost's containers. */
export type PublishedBindingsObservation =
  | { readonly status: 'observed'; readonly bindings: readonly PublishedBinding[] }
  | { readonly status: 'unavailable'; readonly reason: string };

/** Comparison outcome: provably consistent, positively mismatched, or undeterminable. */
export type DockerTopologyVerdict = 'local' | 'mismatch' | 'inconclusive';

/** One assessed aspect of the topology. */
export interface DockerTopologyFinding {
  /** Outcome of this aspect. */
  readonly verdict: DockerTopologyVerdict;
  /** Operator-facing explanation. */
  readonly message: string;
}

/** Endpoint and published-binding findings for one doctor run. */
export interface DockerTopologyAssessment {
  /** Daemon endpoint locality. */
  readonly endpoint: DockerTopologyFinding;
  /** Published bindings compared with the AppHost's loopback addressing. */
  readonly bindings: DockerTopologyFinding;
}

/** Observation port for the Docker daemon the AppHost provisions containers on. */
export interface DockerTopologyInspector {
  /** Resolve and classify the active daemon endpoint. */
  inspectEndpoint(): Promise<DockerEndpoint>;
  /**
   * Read published bindings of the named containers on the daemon `endpoint` selects.
   *
   * `containers` are the unique instance names the running AppHost reports for its container
   * resources; a container that is absent or whose record is incomplete makes the observation
   * `unavailable`, never a partial `observed`.
   */
  inspectPublishedBindings(
    endpoint: DockerEndpoint,
    containers: readonly string[],
  ): Promise<PublishedBindingsObservation>;
}

const LOCAL_SCHEMES = new Set(['unix:', 'npipe:']);
const NETWORK_SCHEMES = new Set(['tcp:', 'http:', 'https:', 'ssh:']);

/**
 * Classify a Docker endpoint URL (`DOCKER_HOST` or a context's `Endpoints.docker.Host`).
 *
 * Socket and named-pipe endpoints and network endpoints addressed to loopback are local; network
 * endpoints addressed to any other host are remote; anything else is unknown.
 */
export function classifyDockerEndpoint(
  host: string | undefined,
  source: DockerEndpointSource,
  context?: string,
): DockerEndpoint {
  const located = classifyHost(host, source);
  return context ? { ...located, context } : located;
}

function classifyHost(host: string | undefined, source: DockerEndpointSource): DockerEndpoint {
  const trimmed = host?.trim();
  if (!trimmed) {
    return { locality: 'unknown', source, reason: `${source} reported no daemon endpoint.` };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      locality: 'unknown',
      host: trimmed,
      source,
      reason: `${source} endpoint "${trimmed}" is not a URL.`,
    };
  }
  if (LOCAL_SCHEMES.has(url.protocol)) return { locality: 'local', host: trimmed, source };
  if (!NETWORK_SCHEMES.has(url.protocol) || !url.hostname) {
    return {
      locality: 'unknown',
      host: trimmed,
      source,
      reason: `${source} endpoint scheme "${url.protocol}" has no known locality.`,
    };
  }
  const hostname = stripBrackets(url.hostname);
  return isLoopbackHost(hostname)
    ? { locality: 'local', host: trimmed, source }
    : { locality: 'remote', host: trimmed, source, daemonHost: hostname };
}

/**
 * Compare the daemon endpoint and published bindings with how the AppHost addresses containers.
 *
 * `bindings` is `undefined` when the AppHost is not running, so its containers were not inspected.
 */
export function assessDockerTopology(
  endpoint: DockerEndpoint,
  bindings: PublishedBindingsObservation | undefined,
): DockerTopologyAssessment {
  return { endpoint: assessEndpoint(endpoint), bindings: assessBindings(endpoint, bindings) };
}

function assessEndpoint(endpoint: DockerEndpoint): DockerTopologyFinding {
  const context = endpoint.context ? `, context "${endpoint.context}"` : '';
  const origin = `${endpoint.host} (from ${endpoint.source}${context})`;
  switch (endpoint.locality) {
    case 'local':
      return { verdict: 'local', message: `Docker daemon is local: ${origin}.` };
    case 'remote':
      return {
        verdict: 'mismatch',
        message: `Docker daemon is remote: ${origin}. Aspire publishes container ports on ` +
          `${endpoint.daemonHost}, but the AppHost on this machine connects to them through ` +
          'localhost, so services waiting on those containers never become ready unless a relay ' +
          'forwards each published port to this machine.',
      };
    case 'unknown':
      return {
        verdict: 'inconclusive',
        message: `Inconclusive: Docker daemon locality could not be determined. ${endpoint.reason}`,
      };
  }
}

function assessBindings(
  endpoint: DockerEndpoint,
  observation: PublishedBindingsObservation | undefined,
): DockerTopologyFinding {
  if (!observation) {
    return {
      verdict: 'inconclusive',
      message: 'Inconclusive: no AppHost is running, so published container bindings were not ' +
        'compared. Start it and rerun plugin doctor.',
    };
  }
  if (observation.status === 'unavailable') {
    return { verdict: 'inconclusive', message: `Inconclusive: ${observation.reason}` };
  }
  if (observation.bindings.length === 0) {
    return {
      verdict: 'inconclusive',
      message: 'Inconclusive: no published ports were found for Aspire containers backing ' +
        'this AppHost.',
    };
  }
  if (endpoint.locality === 'unknown') {
    return {
      verdict: 'inconclusive',
      message: `Inconclusive: ${observation.bindings.length} published port(s) observed, but ` +
        'the daemon locality is unknown, so their reachability from this machine is unknown.',
    };
  }
  if (endpoint.locality === 'remote') {
    return {
      verdict: 'mismatch',
      message: `Mismatch: the AppHost uses localhost, but these ports are published on ` +
        `${endpoint.daemonHost}: ${observation.bindings.map(describeBinding).join('; ')}.`,
    };
  }
  const foreign = observation.bindings.filter((binding) => !reachableViaLoopback(binding.hostIp));
  if (foreign.length > 0) {
    return {
      verdict: 'mismatch',
      message: 'Mismatch: the AppHost uses localhost, but these ports are bound to a ' +
        `non-loopback interface: ${foreign.map(describeBinding).join('; ')}.`,
    };
  }
  return {
    verdict: 'local',
    message: `${observation.bindings.length} published port(s) are reachable through localhost ` +
      'on this machine.',
  };
}

function describeBinding(binding: PublishedBinding): string {
  const scope = isLoopbackHost(binding.hostIp)
    ? "daemon host's loopback"
    : isWildcardHost(binding.hostIp)
    ? 'all daemon-host interfaces'
    : 'daemon-host interface';
  return `${binding.container} ${binding.containerPort} -> ${
    formatHostPort(binding.hostIp, binding.hostPort)
  } (${scope})`;
}

function formatHostPort(hostIp: string, hostPort: string): string {
  return hostIp.includes(':') ? `[${hostIp}]:${hostPort}` : `${hostIp}:${hostPort}`;
}

function reachableViaLoopback(hostIp: string): boolean {
  return isLoopbackHost(hostIp) || isWildcardHost(hostIp);
}

function isWildcardHost(hostIp: string): boolean {
  return hostIp === '0.0.0.0' || hostIp === '::';
}

function isLoopbackHost(hostname: string): boolean {
  const host = stripBrackets(hostname).toLowerCase();
  return host === 'localhost' || host.endsWith('.localhost') || host === '::1' ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function stripBrackets(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}
