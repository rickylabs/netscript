import {
  classifyDockerEndpoint,
  type DockerEndpoint,
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
 * Docker CLI-backed topology observation, using the same endpoint resolution the AppHost's
 * Docker client uses: `DOCKER_HOST` first, then the active context.
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

  /** Classify `DOCKER_HOST`, or the active context's endpoint when it is unset. */
  async inspectEndpoint(): Promise<DockerEndpoint> {
    let dockerHost: string | undefined;
    try {
      dockerHost = this.readEnv('DOCKER_HOST')?.trim();
    } catch (error) {
      return unknownEndpoint(`DOCKER_HOST could not be read: ${errorMessage(error)}`);
    }
    if (dockerHost) return classifyDockerEndpoint(dockerHost, 'DOCKER_HOST');

    const result = await this.docker(['context', 'inspect']);
    if (typeof result === 'string') return unknownEndpoint(result);
    try {
      return classifyDockerEndpoint(readContextHost(JSON.parse(result.stdout)), 'docker-context');
    } catch (error) {
      return unknownEndpoint(
        `docker context inspect returned unreadable JSON: ${errorMessage(error)}`,
      );
    }
  }

  /** Read published ports of Aspire-labelled containers named after the given resources. */
  async inspectPublishedBindings(
    resourceNames: readonly string[],
  ): Promise<PublishedBindingsObservation> {
    const listed = await this.docker([
      'ps',
      '--filter',
      `label=${ASPIRE_CONTAINER_LABEL}`,
      '--format',
      '{{.ID}}',
    ]);
    if (typeof listed === 'string') return { status: 'unavailable', reason: listed };
    const ids = listed.stdout.split(/\r?\n/).map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) return { status: 'observed', bindings: [] };

    const inspected = await this.docker(['inspect', ...ids]);
    if (typeof inspected === 'string') return { status: 'unavailable', reason: inspected };
    try {
      return {
        status: 'observed',
        bindings: readPublishedBindings(JSON.parse(inspected.stdout), resourceNames),
      };
    } catch (error) {
      return {
        status: 'unavailable',
        reason: `docker inspect returned unreadable JSON: ${errorMessage(error)}`,
      };
    }
  }

  /** Run one Docker CLI command; a string result is the reason it produced no usable output. */
  private async docker(args: readonly string[]): Promise<ProcessResult | string> {
    const command = `docker ${args[0]}${args[1] && !args[1].startsWith('-') ? ` ${args[1]}` : ''}`;
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

/** Read `Endpoints.docker.Host` from `docker context inspect` output (an array of one context). */
export function readContextHost(document: unknown): string | undefined {
  const context = Array.isArray(document) ? document[0] : document;
  const endpoints = readRecord(context, 'Endpoints');
  const docker = readRecord(endpoints, 'docker');
  const host = docker ? Reflect.get(docker, 'Host') : undefined;
  return typeof host === 'string' ? host : undefined;
}

/**
 * Flatten `docker inspect` `NetworkSettings.Ports` for containers whose name is a resource name
 * or DCP's `<resource>-<suffix>` instance name.
 */
export function readPublishedBindings(
  document: unknown,
  resourceNames: readonly string[],
): readonly PublishedBinding[] {
  if (!Array.isArray(document)) throw new Error('docker inspect JSON was not an array');
  return document.flatMap((row): PublishedBinding[] => {
    const rawName = row && typeof row === 'object' ? Reflect.get(row, 'Name') : undefined;
    if (typeof rawName !== 'string') return [];
    const container = rawName.replace(/^\//, '');
    if (!resourceNames.some((name) => container === name || container.startsWith(`${name}-`))) {
      return [];
    }
    const ports = readRecord(readRecord(row, 'NetworkSettings'), 'Ports');
    if (!ports) return [];
    return Object.entries(ports).flatMap(([containerPort, hostBindings]) =>
      Array.isArray(hostBindings)
        ? hostBindings.flatMap((binding): PublishedBinding[] => {
          const hostPort = readString(binding, 'HostPort');
          return hostPort
            ? [{ container, containerPort, hostIp: readString(binding, 'HostIp') ?? '', hostPort }]
            : [];
        })
        : []
    );
  });
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
