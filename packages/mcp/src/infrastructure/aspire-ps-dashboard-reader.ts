import type { AspirePsDashboardPort } from '../domain/telemetry-endpoint.ts';
import {
  aspireStringField,
  extractAspireJson,
  isAspireRecord,
} from './service-endpoints/aspire-cli-output.ts';

/** Result returned by the injected Aspire command runner. */
export interface AspirePsCommandResult {
  /** Child-process exit code. */
  readonly code: number;
  /** Decoded standard output. */
  readonly stdout: string;
  /** Decoded standard error. */
  readonly stderr: string;
}

/** Synchronous command edge used by telemetry endpoint discovery. */
export type AspirePsCommand = (
  command: string,
  args: readonly string[],
) => AspirePsCommandResult;

/** Runtime-edge options for running and selecting an Aspire AppHost. */
export interface AspirePsDashboardReaderOptions {
  /** Exact AppHost path to select when more than one run is reported. */
  readonly appHostPath?: string;
  /** Injected command edge for tests and custom hosts. */
  readonly execute?: AspirePsCommand;
  /** Injected path canonicalizer for tests and alternate filesystems. */
  readonly realPath?: (path: string) => string;
}

const ASPIRE_PS_ARGS = [
  'ps',
  '--format',
  'Json',
  '--nologo',
  '--non-interactive',
] as const;

/** Read the dashboard URL for a running AppHost using machine-readable `aspire ps`. */
export class AspirePsDashboardReader implements AspirePsDashboardPort {
  readonly #appHostPath: string | undefined;
  readonly #execute: AspirePsCommand;
  readonly #realPath: (path: string) => string;

  /** Create a reader with optional injected command and filesystem edges. */
  constructor(options: AspirePsDashboardReaderOptions = {}) {
    this.#appHostPath = options.appHostPath;
    this.#execute = options.execute ?? executeAspirePs;
    this.#realPath = options.realPath ?? Deno.realPathSync;
  }

  /** Return the selected running AppHost dashboard URL, failing closed when Aspire is unavailable. */
  readDashboardUrl(): string | undefined {
    try {
      const result = this.#execute('aspire', ASPIRE_PS_ARGS);
      if (result.code !== 0) return undefined;
      const parsed: unknown = JSON.parse(extractAspireJson(result.stdout));
      if (!Array.isArray(parsed)) return undefined;
      const expectedPath = this.#canonicalPath(this.#appHostPath);
      for (const value of parsed) {
        if (!isAspireRecord(value)) continue;
        if (aspireStringField(value, 'status')?.toLowerCase() !== 'running') continue;
        const reportedPath = aspireStringField(value, 'appHostPath');
        if (expectedPath && this.#canonicalPath(reportedPath) !== expectedPath) continue;
        const dashboardUrl = aspireStringField(value, 'dashboardUrl');
        if (dashboardUrl) return dashboardUrl;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  #canonicalPath(path: string | undefined): string | undefined {
    if (!path) return undefined;
    try {
      return this.#realPath(path);
    } catch {
      return path;
    }
  }
}

function executeAspirePs(command: string, args: readonly string[]): AspirePsCommandResult {
  const output = new Deno.Command(command, { args: [...args] }).outputSync();
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}
