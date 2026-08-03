import { resolve } from '@std/path';
import type { ProcessPort } from '../../ports/process-port.ts';
import type {
  AppHostInspection,
  AppHostInspector,
  AppHostResourceState,
} from '../../../public/features/plugins/doctor/doctor-plugin-use-case.ts';

/** Aspire CLI-backed inspection of the AppHost belonging to one project. */
export class AspireAppHostDoctorInspector implements AppHostInspector {
  constructor(private readonly process: ProcessPort) {}

  /** Return an explicit absent/running snapshot; never infer liveness from `describe` exit code. */
  async inspect(projectRoot: string): Promise<AppHostInspection> {
    try {
      return await this.inspectAvailableCli(projectRoot);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {
          status: 'unavailable',
          reason: `AppHost inspection was skipped because Aspire could not be executed: ${error.message}`,
        };
      }
      throw error;
    }
  }

  private async inspectAvailableCli(projectRoot: string): Promise<AppHostInspection> {
    const appHostPath = resolve(projectRoot, 'aspire/apphost.mts');
    const ps = await this.process.exec('aspire', [
      'ps',
      '--format',
      'Json',
      '--non-interactive',
      '--nologo',
    ], { cwd: resolve(projectRoot, 'aspire') });
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
    ], { cwd: resolve(projectRoot, 'aspire') });
    if (describe.code !== 0) throw commandError('aspire describe', describe.stderr || describe.stdout);

    const document = JSON.parse(describe.stdout) as unknown;
    const rawResources = document && typeof document === 'object'
      ? Reflect.get(document, 'resources')
      : undefined;
    if (!Array.isArray(rawResources)) throw new Error('aspire describe JSON has no resources array');
    return { status: 'running', resources: rawResources.flatMap(readResource) };
  }
}

function readResource(value: unknown): readonly AppHostResourceState[] {
  const name = readString(value, 'displayName') ?? readString(value, 'name');
  if (!name) return [];
  return [{
    name,
    state: readString(value, 'state'),
    healthStatus: readString(value, 'healthStatus'),
    healthReports: readArray(value, 'healthReports'),
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

function readArray(value: unknown, key: string): readonly unknown[] {
  if (!value || typeof value !== 'object') return [];
  const field = Reflect.get(value, key);
  return Array.isArray(field) ? field : [];
}

function commandError(command: string, detail: string): Error {
  return new Error(`${command} failed: ${detail.trim() || 'unknown error'}`);
}
