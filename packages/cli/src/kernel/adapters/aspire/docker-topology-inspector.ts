import {
  classifyDockerEndpoint,
  type DockerEndpoint,
  type DockerEndpointSource,
  type DockerTopologyInspector,
  type PublishedBinding,
  type PublishedBindingsObservation,
} from '../../domain/docker-topology.ts';
import type { ProcessPort, ProcessResult } from '../../ports/process-port.ts';

/** Label DCP stamps on every container it provisions for an Aspire AppHost. */
const ASPIRE_CONTAINER_LABEL = 'com.microsoft.developer.usvc-dev.creatorProcessId';
const DOCKER_TIMEOUT_MS = 15_000;

/** Construction options for {@link DockerCliTopologyInspector}. */
export interface DockerCliTopologyInspectorOptions {
  /** Environment reader; defaults to `Deno.env.get`. */
  readonly readEnv?: (name: string) => string | undefined;
  /** Per-command timeout for Docker CLI calls. */
  readonly timeoutMs?: number;
}

/**
 * Docker CLI-backed topology observation. The endpoint follows Docker's own precedence
 * (`DOCKER_CONTEXT`, then `DOCKER_HOST`, then the current context), and binding reads pin the
 * resolved context so classification and bindings describe the same daemon.
 */
export class DockerCliTopologyInspector implements DockerTopologyInspector {
  private readonly readEnv: (name: string) => string | undefined;
  private readonly timeoutMs: number;

  constructor(
    private readonly process: ProcessPort,
    options: DockerCliTopologyInspectorOptions = {},
  ) {
    this.readEnv = options.readEnv ?? ((name) => Deno.env.get(name));
    this.timeoutMs = options.timeoutMs ?? DOCKER_TIMEOUT_MS;
  }

  /** Classify the endpoint the Docker CLI would use for this environment. */
  async inspectEndpoint(): Promise<DockerEndpoint> {
    let dockerContext: string | undefined;
    let dockerHost: string | undefined;
    try {
      dockerContext = this.readEnv('DOCKER_CONTEXT')?.trim();
      dockerHost = this.readEnv('DOCKER_HOST')?.trim();
    } catch (error) {
      return unknownEndpoint(`Docker environment could not be read: ${errorMessage(error)}`);
    }
    if (dockerContext) return await this.inspectContext(dockerContext, 'DOCKER_CONTEXT');
    if (dockerHost) return classifyDockerEndpoint(dockerHost, 'DOCKER_HOST');
    return await this.inspectContext(undefined, 'docker-context');
  }

  /** Read published ports of exactly the named Aspire containers on the endpoint's daemon. */
  async inspectPublishedBindings(
    endpoint: DockerEndpoint,
    containers: readonly string[],
  ): Promise<PublishedBindingsObservation> {
    if (containers.length === 0) return { status: 'observed', bindings: [] };
    const target = endpoint.context ? ['--context', endpoint.context] : [];
    const listed = await this.docker('docker ps', [
      ...target,
      'ps',
      '--filter',
      `label=${ASPIRE_CONTAINER_LABEL}`,
      '--format',
      '{{.ID}}',
    ]);
    if (typeof listed === 'string') return { status: 'unavailable', reason: listed };
    const ids = listed.stdout.split(/\r?\n/).map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) return missingContainers(containers);

    const inspected = await this.docker('docker inspect', [...target, 'inspect', ...ids]);
    if (typeof inspected === 'string') return { status: 'unavailable', reason: inspected };
    let document: unknown;
    try {
      document = JSON.parse(inspected.stdout);
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `docker inspect returned unreadable JSON: ${errorMessage(error)}`,
      };
    }
    return readPublishedBindings(document, containers);
  }

  private async inspectContext(
    name: string | undefined,
    source: DockerEndpointSource,
  ): Promise<DockerEndpoint> {
    const result = await this.docker('docker context inspect', [
      'context',
      'inspect',
      ...(name ? [name] : []),
    ]);
    if (typeof result === 'string') return unknownEndpoint(result);
    try {
      const context = readContext(JSON.parse(result.stdout));
      return classifyDockerEndpoint(context.host, source, context.name ?? name);
    } catch (error) {
      return unknownEndpoint(
        `docker context inspect returned unreadable JSON: ${errorMessage(error)}`,
      );
    }
  }

  /** Run one Docker CLI command; a string result is the reason it produced no usable output. */
  private async docker(
    command: string,
    args: readonly string[],
  ): Promise<ProcessResult | string> {
    let result: ProcessResult;
    try {
      result = await this.process.exec('docker', args, { timeoutMs: this.timeoutMs });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return `${command} could not run because the Docker CLI was not found.`;
      }
      return `${command} could not run: ${errorMessage(error)}`;
    }
    if (result.timedOut) return `${command} timed out after ${this.timeoutMs}ms.`;
    if (result.code !== 0) {
      return `${command} failed (${result.code}): ${
        (result.stderr || result.stdout).trim() || 'unknown error'
      }`;
    }
    return result;
  }
}

/** Read the name and `Endpoints.docker.Host` of the one context `docker context inspect` prints. */
export function readContext(
  document: unknown,
): { readonly name?: string; readonly host?: string } {
  const context = Array.isArray(document) ? document[0] : document;
  const docker = readRecord(readRecord(context, 'Endpoints'), 'docker');
  return { name: readString(context, 'Name'), host: readString(docker, 'Host') };
}

/**
 * Flatten `docker inspect` `NetworkSettings.Ports` for exactly the named containers.
 *
 * Containers are matched by their full name only, so a same-named resource of another AppHost
 * (a different instance suffix) is never evidence. A missing container, a record without a port
 * map, or a binding without a host address or port makes the whole observation unavailable.
 * Ports mapped to `null` are exposed but unpublished and carry no host traffic.
 */
export function readPublishedBindings(
  document: unknown,
  containers: readonly string[],
): PublishedBindingsObservation {
  if (!Array.isArray(document)) {
    return { status: 'unavailable', reason: 'docker inspect JSON was not an array.' };
  }
  const wanted = new Set(containers);
  const rows = new Map<string, unknown>();
  for (const row of document) {
    const name = readString(row, 'Name')?.replace(/^\//, '');
    if (name === undefined) {
      return {
        status: 'unavailable',
        reason: 'docker inspect returned a container without a name.',
      };
    }
    if (wanted.has(name)) rows.set(name, row);
  }
  const absent = containers.filter((name) => !rows.has(name));
  if (absent.length > 0) return missingContainers(absent);

  const bindings: PublishedBinding[] = [];
  for (const [container, row] of rows) {
    const ports = readRecord(readRecord(row, 'NetworkSettings'), 'Ports');
    if (!ports) return incomplete(container, 'has no NetworkSettings.Ports map');
    for (const [containerPort, hostBindings] of Object.entries(ports)) {
      if (hostBindings === null) continue;
      if (!Array.isArray(hostBindings)) {
        return incomplete(container, `reports ${containerPort} with an unreadable binding list`);
      }
      for (const binding of hostBindings) {
        const hostIp = readString(binding, 'HostIp')?.trim();
        const hostPort = readString(binding, 'HostPort')?.trim();
        if (!hostIp || !hostPort) {
          return incomplete(
            container,
            `publishes ${containerPort} without a host address and port`,
          );
        }
        bindings.push({ container, containerPort, hostIp, hostPort });
      }
    }
  }
  return { status: 'observed', bindings };
}

function missingContainers(containers: readonly string[]): PublishedBindingsObservation {
  return {
    status: 'unavailable',
    reason: `the AppHost's container(s) ${
      containers.join(', ')
    } were not found among Aspire containers on the inspected daemon.`,
  };
}

function incomplete(container: string, detail: string): PublishedBindingsObservation {
  return { status: 'unavailable', reason: `docker inspect for ${container} ${detail}.` };
}

function unknownEndpoint(reason: string): DockerEndpoint {
  return { locality: 'unknown', reason };
}

function readRecord(value: unknown, key: string): Readonly<Record<string, unknown>> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const field = Reflect.get(value, key);
  return field && typeof field === 'object' && !Array.isArray(field)
    ? field as Readonly<Record<string, unknown>>
    : undefined;
}

function readString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const field = Reflect.get(value, key);
  return typeof field === 'string' ? field : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
