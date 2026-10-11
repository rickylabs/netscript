import { readChildHealth } from './child-health-reader.ts';
import { resolve } from '@std/path';
import type { ProcessPort } from '../../ports/process-port.ts';
import type {
  AppHostInspection,
  AppHostInspector,
  AppHostResourceState,
} from '../../../public/features/plugins/doctor/doctor-plugin-use-case.ts';

const PROCESS_TIMEOUT_MS = 5000;

/** Aspire CLI-backed inspection of the AppHost belonging to one project. */
export class AspireAppHostDoctorInspector implements AppHostInspector {
  constructor(
    private readonly process: ProcessPort,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  /** Return an explicit absent/running snapshot; never infer liveness from `describe` exit code. */
  async inspect(
    projectRoot: string,
    childResources: readonly string[] = [],
  ): Promise<AppHostInspection> {
    try {
      return await this.inspectAvailableCli(projectRoot, childResources);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {
          status: 'unavailable',
          reason:
            `AppHost inspection was skipped because Aspire could not be executed: ${error.message}`,
        };
      }
      throw error;
    }
  }

  private async inspectAvailableCli(
    projectRoot: string,
    childResources: readonly string[],
  ): Promise<AppHostInspection> {
    const appHostPath = resolve(projectRoot, 'aspire/apphost.mts');
    const ps = await this.process.exec('aspire', [
      'ps',
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
    ], { cwd: resolve(projectRoot, 'aspire'), timeoutMs: PROCESS_TIMEOUT_MS });
    if (ps.timedOut) throw new Error(`aspire ps timed out after ${PROCESS_TIMEOUT_MS}ms`);
    if (ps.code !== 0) throw commandError('aspire ps', ps.stderr || ps.stdout);

    const appHosts = parseJsonArray(ps.stdout, 'aspire ps');
    const running = appHosts.some((entry) =>
      readString(entry, 'appHostPath') === appHostPath &&
      readString(entry, 'status')?.toLowerCase() === 'running'
    );
    if (!running) return { status: 'not-running' };

    const describe = await this.process.exec('aspire', [
      'describe',
      '--apphost',
      appHostPath,
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
    ], { cwd: resolve(projectRoot, 'aspire'), timeoutMs: PROCESS_TIMEOUT_MS });
    if (describe.timedOut) {
      throw new Error(`aspire describe timed out after ${PROCESS_TIMEOUT_MS}ms`);
    }
    if (describe.code !== 0) {
      throw commandError('aspire describe', describe.stderr || describe.stdout);
    }

    const document = JSON.parse(describe.stdout) as unknown;
    const rawResources = document && typeof document === 'object'
      ? Reflect.get(document, 'resources')
      : undefined;
    if (!Array.isArray(rawResources)) {
      throw new Error('aspire describe JSON has no resources array');
    }
    const resources = rawResources.flatMap(readResource);
    const rawByName = new Map(
      rawResources.map((raw) => [readString(raw, 'displayName') ?? readString(raw, 'name'), raw]),
    );
    const declared = new Set(childResources);
    const pending = resources.filter((resource) => declared.has(resource.name));
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(4, pending.length) }, async () => {
      while (next < pending.length) {
        const resource = pending[next++];
        if (!resource) continue;
        const url = childEndpoint(rawByName.get(resource.name));
        const health = url ? await readChildHealth(url, this.fetchFn) : undefined;
        Object.assign(
          resource,
          health ? { childHealth: health } : { childHealthUnavailable: true },
        );
      }
    }));
    return { status: 'running', resources };
  }
}

function readResource(value: unknown): readonly AppHostResourceState[] {
  const instanceName = readString(value, 'name');
  const name = readString(value, 'displayName') ?? instanceName;
  if (!name) return [];
  const resourceType = readString(value, 'resourceType');
  return [{
    name,
    ...(instanceName ? { instanceName } : {}),
    ...(resourceType ? { resourceType } : {}),
    state: readString(value, 'state'),
    healthStatus: readString(value, 'healthStatus'),
    healthReports: readHealthReports(value),
  }];
}

function parseJsonArray(source: string, command: string): readonly unknown[] {
  const value = JSON.parse(source) as unknown;
  if (!Array.isArray(value)) throw new Error(`${command} JSON was not an array`);
  return value;
}

function readString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const field = Reflect.get(value, key);
  return typeof field === 'string' ? field : undefined;
}

function readHealthReports(
  value: unknown,
): readonly unknown[] | Readonly<Record<string, unknown>> {
  if (!value || typeof value !== 'object') return {};
  const field = Reflect.get(value, 'healthReports');
  if (Array.isArray(field)) return field;
  return field && typeof field === 'object' ? field as Readonly<Record<string, unknown>> : {};
}

function commandError(command: string, detail: string): Error {
  return new Error(`${command} failed: ${detail.trim() || 'unknown error'}`);
}

function childEndpoint(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const urls: unknown = Reflect.get(value, 'urls');
  if (!Array.isArray(urls)) return undefined;
  for (const entry of urls) {
    const url = readString(entry, 'url');
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
    } catch { /* Invalid endpoint evidence is unavailable. */ }
  }
  return undefined;
}
