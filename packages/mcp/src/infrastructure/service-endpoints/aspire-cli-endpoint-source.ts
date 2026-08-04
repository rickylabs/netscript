import { isAbsolute, join, relative } from '@std/path';
import type {
  EndpointCandidate,
  EndpointSourceContext,
  EndpointSourcePort,
  FailedSourceOutcome,
  SourceFailureCode,
  SourceOutcome,
} from '../../ports/service-endpoint-directory-port.ts';
import { executeAspireCliCommand } from './aspire-cli-command.ts';
import {
  aspireField,
  aspireIdentityField,
  aspireStringField,
  extractAspireJson,
  isAspireRecord,
} from './aspire-cli-output.ts';
import { normalizeDiscoveredEndpointUrl } from './endpoint-url.ts';

/** Captured result of one Aspire CLI invocation. */
export interface AspireCliCommandResult {
  /** Process exit status. */
  readonly code: number;
  /** Captured standard output. */
  readonly stdout: string;
  /** Captured standard error. */
  readonly stderr: string;
}

/** Injectable Aspire command boundary used by the source adapter. */
export type AspireCliCommand = (
  command: string,
  args: readonly string[],
  signal?: AbortSignal,
) => Promise<AspireCliCommandResult>;

/** Options for the Aspire CLI endpoint source. */
export interface AspireCliEndpointSourceOptions {
  /** Aspire executable name or path. */
  readonly command?: string;
  /** Override the process boundary for deterministic tests. */
  readonly execute?: AspireCliCommand;
  /** Override real-path resolution for deterministic identity tests. */
  readonly realPath?: (path: string) => Promise<string>;
}

interface AspireAppHostRun {
  readonly appHostPath: string;
  readonly runId: string;
}

/** Queries the running AppHost through Aspire's machine-readable describe surface. */
export class AspireCliEndpointSource implements EndpointSourcePort {
  readonly #command: string;
  readonly #execute: AspireCliCommand;
  readonly #realPath: (path: string) => Promise<string>;

  /** Create an Aspire source with an injectable command boundary. */
  constructor(options: AspireCliEndpointSourceOptions = {}) {
    this.#command = options.command ?? 'aspire';
    this.#execute = options.execute ?? executeAspireCliCommand;
    this.#realPath = options.realPath ?? Deno.realPath;
  }

  /** Report command absence, non-zero exits, and parse failures as distinct failed outcomes. */
  async read(context: EndpointSourceContext, signal?: AbortSignal): Promise<SourceOutcome> {
    signal?.throwIfAborted();
    const appHostPath = context.appHostPath ?? join(context.projectRoot, 'aspire', 'apphost.mts');
    let projectIdentity: { readonly root: string; readonly appHost: string };
    try {
      projectIdentity = {
        root: await this.#realPath(context.projectRoot),
        appHost: await this.#realPath(appHostPath),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      return failed(
        'project_root_mismatch',
        `Aspire project identity could not be resolved: ${describe(error)}`,
      );
    }
    if (!isWithin(projectIdentity.root, projectIdentity.appHost)) {
      return failed(
        'project_root_mismatch',
        `AppHost path is outside the requested project root: ${projectIdentity.appHost}`,
      );
    }

    const before = await this.#readRun(projectIdentity.appHost, signal);
    if (before.outcome === 'failed') return before;

    let result: AspireCliCommandResult;
    try {
      result = await this.#execute(this.#command, [
        'describe',
        '--apphost',
        appHostPath,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ], signal);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return failed('command_not_found', `Aspire CLI executable was not found: ${this.#command}`);
      }
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      return failed('command_failed', describe(error));
    }
    if (result.code !== 0) {
      const detail = (result.stderr || result.stdout).trim();
      return failed(
        'command_failed',
        `aspire describe exited ${result.code}${detail ? `: ${detail}` : ''}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractAspireJson(result.stdout));
    } catch (error) {
      return failed('parse_failed', `aspire describe JSON could not be parsed: ${describe(error)}`);
    }
    const resources = aspireField(parsed, 'resources');
    if (!Array.isArray(resources)) {
      return failed(
        'parse_failed',
        'aspire describe output did not contain top-level resources[]',
      );
    }

    const candidates: EndpointCandidate[] = [];
    for (const rawResource of resources) {
      if (!isAspireRecord(rawResource)) continue;
      const name = resourceName(rawResource);
      const baseUrl = resourceHttpUrl(rawResource);
      if (!name || !baseUrl) continue;
      const workDir = resourceWorkDir(rawResource);
      if (workDir) {
        let realWorkDir: string;
        try {
          realWorkDir = await this.#realPath(workDir);
        } catch (error) {
          return failed(
            'project_root_mismatch',
            `Resource ${name} working directory could not be resolved: ${describe(error)}`,
          );
        }
        if (!isWithin(projectIdentity.root, realWorkDir)) {
          return failed(
            'project_root_mismatch',
            `Resource ${name} belongs to a foreign project root: ${realWorkDir}`,
          );
        }
      }
      candidates.push({ name, baseUrl, source: 'aspire-cli', operatorTrusted: false });
    }

    const after = await this.#readRun(projectIdentity.appHost, signal);
    if (after.outcome === 'failed') return after;
    if (after.run.runId !== before.run.runId) {
      return failed(
        'run_id_mismatch',
        `AppHost restarted while aspire describe was read (${before.run.runId} -> ${after.run.runId})`,
      );
    }
    candidates.sort((left, right) => left.name.localeCompare(right.name));
    return { source: 'aspire-cli', outcome: 'used', candidates, excludedServices: [] };
  }

  async #readRun(
    appHostPath: string,
    signal?: AbortSignal,
  ): Promise<
    { readonly outcome: 'current'; readonly run: AspireAppHostRun } | FailedSourceOutcome
  > {
    let result: AspireCliCommandResult;
    try {
      result = await this.#execute(this.#command, [
        'ps',
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ], signal);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return failed('command_not_found', `Aspire CLI executable was not found: ${this.#command}`);
      }
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      return failed('command_failed', describe(error));
    }
    if (result.code !== 0) {
      return failed('command_failed', commandFailure('aspire ps', result));
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractAspireJson(result.stdout));
    } catch (error) {
      return failed('parse_failed', `aspire ps JSON could not be parsed: ${describe(error)}`);
    }
    const rawRuns = Array.isArray(parsed) ? parsed : aspireField(parsed, 'appHosts', 'items');
    if (!Array.isArray(rawRuns)) {
      return failed('parse_failed', 'aspire ps output did not contain an AppHost array');
    }

    const runs: AspireAppHostRun[] = [];
    for (const rawRun of rawRuns) {
      if (!isAspireRecord(rawRun)) continue;
      const rawPath = aspireStringField(rawRun, 'appHostPath');
      const rawPid = aspireIdentityField(rawRun, 'appHostPid');
      if (!rawPath || rawPid === undefined) continue;
      let realRunPath: string;
      try {
        realRunPath = await this.#realPath(rawPath);
      } catch {
        continue;
      }
      if (realRunPath === appHostPath) {
        runs.push({ appHostPath: realRunPath, runId: String(rawPid) });
      }
    }
    if (runs.length !== 1) {
      return failed(
        'run_id_mismatch',
        `aspire ps identified ${runs.length} current runs for AppHost ${appHostPath}`,
      );
    }
    return { outcome: 'current', run: runs[0]! };
  }
}

function resourceName(resource: Record<string, unknown>): string | undefined {
  const displayName = aspireStringField(resource, 'displayName');
  if (displayName) return displayName;
  const name = aspireStringField(resource, 'name');
  if (!name) return undefined;
  return name.replace(/-[a-z0-9]{8}$/i, '');
}

function resourceHttpUrl(resource: Record<string, unknown>): string | undefined {
  const value = aspireField(resource, 'urls', 'endpoints');
  if (!Array.isArray(value)) return undefined;
  const urls: string[] = [];
  for (const entry of value) {
    const rawUrl = isAspireRecord(entry) ? aspireField(entry, 'url') : entry;
    const normalized = normalizeDiscoveredEndpointUrl(rawUrl, false);
    if (normalized) urls.push(normalized);
  }
  const declared = urls.find((url) => url.startsWith('http://')) ?? urls[0];
  if (!declared) return undefined;

  const environment = aspireField(resource, 'environment');
  const rawTargetPort = isAspireRecord(environment) ? aspireField(environment, 'PORT') : undefined;
  const targetPort = typeof rawTargetPort === 'string' || typeof rawTargetPort === 'number'
    ? Number(rawTargetPort)
    : Number.NaN;
  if (!Number.isInteger(targetPort) || targetPort < 1 || targetPort > 65_535) return declared;
  const target = new URL(declared);
  target.protocol = 'http:';
  target.port = String(targetPort);
  return normalizeDiscoveredEndpointUrl(target.toString(), false) ?? declared;
}

function resourceWorkDir(resource: Record<string, unknown>): string | undefined {
  const properties = aspireField(resource, 'properties');
  if (!isAspireRecord(properties)) return undefined;
  return aspireStringField(properties, 'executable.workDir', 'workDir');
}

function isWithin(root: string, target: string): boolean {
  const path = relative(root, target);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

function commandFailure(command: string, result: AspireCliCommandResult): string {
  const detail = (result.stderr || result.stdout).trim().slice(0, 500);
  return `${command} exited ${result.code}${detail ? `: ${detail}` : ''}`;
}

function failed(code: SourceFailureCode, reason: string): FailedSourceOutcome {
  return {
    source: 'aspire-cli',
    outcome: 'failed',
    code,
    reason,
    candidates: [],
    excludedServices: [],
  };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
