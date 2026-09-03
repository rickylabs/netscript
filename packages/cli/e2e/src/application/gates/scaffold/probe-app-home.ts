/**
 * @module
 *
 * Probe for `behavior.app-home`: asks the running generated app for its home page and
 * requires a 2xx that is actually an HTML document. Asserting the status alone would not
 * do — a Fresh error overlay is `text/html` too.
 *
 * `runtime.wait.<app>` proves Aspire *calls* the app healthy. This probe proves the claim
 * is true. It never assumes the port: it reads one the project pins, and otherwise asks the
 * running AppHost which port Aspire allocated (the pristine scaffold pins nothing so that
 * `aspire start --isolated` works — see `generated-app-endpoint.ts`). Guessing would make a
 * failure unreadable, because a refused connection and a broken render are indistinguishable
 * from the outside: both look like "the home page never arrived".
 *
 * Usage: `deno run --allow-read --allow-net=127.0.0.1 --allow-run=aspire probe-app-home.ts
 * <projectRoot> <appName> [appHost]`
 */

import {
  AppEndpointPendingError,
  generatedAppHomeUrlsFromAppHost,
  readPinnedAppPort,
} from './generated-app-endpoint.ts';

/** Application-render attempts after endpoint allocation; they do not infer Aspire health. */
const ATTEMPTS = 60;
/** Delay between application HTML probes, not an Aspire resource-state polling interval. */
const RETRY_DELAY_MS = 1_000;
const MAX_DIAGNOSTIC_CHARS = 24_000;
const MAX_DIAGNOSTIC_LINES = 300;

export interface ProbeAppHomeOptions {
  readonly attempts?: number;
  readonly retryDelayMs?: number;
  readonly fetchUrl?: typeof fetch;
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly delay?: (milliseconds: number) => Promise<void>;
  readonly log?: (message: string) => void;
  readonly collectResourceLogs?: (appHost: string, appName: string) => Promise<string>;
}

interface FreshOverlayError {
  readonly message?: unknown;
  readonly stack?: unknown;
  readonly frame?: unknown;
}

/** Formats an HTTP response body for a bounded, actionable failure report. */
export function diagnosticBody(body: string): string {
  const overlay = freshOverlayError(body);
  if (overlay) {
    return boundDiagnostic(
      [
        typeof overlay.message === 'string' ? `Fresh error: ${overlay.message}` : undefined,
        typeof overlay.stack === 'string' && overlay.stack ? overlay.stack : undefined,
        typeof overlay.frame === 'string' && overlay.frame ? overlay.frame : undefined,
      ].filter((part): part is string => part !== undefined).join('\n'),
    );
  }
  return boundDiagnostic(body);
}

function freshOverlayError(body: string): FreshOverlayError | undefined {
  const marker = /\bconst\s+error\s*=\s*/g.exec(body);
  if (!marker) return undefined;
  const start = marker.index + marker[0].length;
  if (body[start] !== '{') return undefined;

  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < body.length; index++) {
    const character = body[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0) {
      try {
        return JSON.parse(body.slice(start, index + 1)) as FreshOverlayError;
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

function boundDiagnostic(value: string): string {
  const lines = value.split(/\r?\n/).slice(0, MAX_DIAGNOSTIC_LINES).join('\n');
  const bounded = lines.slice(0, MAX_DIAGNOSTIC_CHARS);
  return bounded.length < value.length ? `${bounded}\n… diagnostic truncated …` : bounded;
}

async function aspireResourceLogs(appHost: string, appName: string): Promise<string> {
  const output = await new Deno.Command('aspire', {
    args: [
      'logs',
      appName,
      '--apphost',
      appHost,
      '--tail',
      String(MAX_DIAGNOSTIC_LINES),
      '--timestamps',
      '--non-interactive',
      '--nologo',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout).trim();
  const stderr = new TextDecoder().decode(output.stderr).trim();
  if (!output.success) {
    return boundDiagnostic(
      `unable to collect Aspire logs (exit ${output.code}): ${stderr || stdout}`,
    );
  }
  return boundDiagnostic(stdout || '(Aspire returned no resource logs)');
}

/** Probes a generated app until it renders or its bounded retry budget is exhausted. */
export async function probeAppHome(
  projectRoot: string,
  appName: string,
  appHost?: string,
  options: ProbeAppHomeOptions = {},
): Promise<void> {
  const attempts = options.attempts ?? ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? RETRY_DELAY_MS;
  const fetchUrl = options.fetchUrl ?? fetch;
  const resolveLiveUrls = options.resolveLiveUrls ?? generatedAppHomeUrlsFromAppHost;
  const delay = options.delay ??
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  const log = options.log ?? console.info;
  const collectResourceLogs = options.collectResourceLogs ?? aspireResourceLogs;
  const pinned = readPinnedAppPort(projectRoot, appName);
  const fixedUrls = pinned === undefined ? undefined : [`http://127.0.0.1:${pinned}/`];

  if (!fixedUrls && !appHost) {
    throw new Error(
      `Cannot resolve the "${appName}" app URL: the project pins no host port (the pristine ` +
        'scaffold lets Aspire allocate one), so the running AppHost must be queried — but no ' +
        'apphost path was supplied.',
    );
  }

  const lastFailure = new Map<string, string>();
  let lastPending: string | undefined;
  let lastUrls: string[] = fixedUrls ?? [];

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (!fixedUrls) {
      try {
        lastUrls = await resolveLiveUrls(appHost!, appName);
        lastPending = undefined;
      } catch (error) {
        if (!(error instanceof AppEndpointPendingError)) throw error;
        lastUrls = [];
        lastPending = error.message;
      }
    }

    if (lastUrls.length > 0) log(`probing ${appName} home page at: ${lastUrls.join(', ')}`);
    for (const url of lastUrls) {
      try {
        const response = await fetchUrl(url, { headers: { accept: 'text/html' } });
        const contentType = response.headers.get('content-type') ?? '';
        const body = await response.text();
        if (response.ok && contentType.includes('text/html') && body.includes('<html')) {
          log(`app home page rendered at ${url}: HTTP ${response.status} (${body.length} bytes)`);
          return;
        }
        lastFailure.set(url, `HTTP ${response.status} (${contentType}):\n${diagnosticBody(body)}`);
      } catch (error) {
        lastFailure.set(url, error instanceof Error ? error.message : String(error));
      }
    }
    if (attempt < attempts) await delay(retryDelayMs);
  }

  if (lastUrls.length === 0 && lastPending) {
    throw new Error(`${lastPending} after ${attempts} attempts`);
  }
  const resourceLogs = appHost
    ? await collectResourceLogs(appHost, appName)
    : '(resource logs unavailable: no AppHost path was supplied)';
  throw new Error(
    `app home page did not render after ${attempts} attempts; last resolved candidates: ` +
      `${lastUrls.join(', ')}\n` +
      [...lastFailure].map(([url, reason]) => `  ${url} -> ${reason}`).join('\n') +
      `\n\nLast ${appName} resource logs:\n${resourceLogs}`,
  );
}

if (import.meta.main) {
  const projectRoot = Deno.args[0];
  const appName = Deno.args[1];
  const appHost = Deno.args[2];
  if (!projectRoot) throw new Error('project root argument is required');
  if (!appName) throw new Error('app name argument is required');
  await probeAppHome(projectRoot, appName, appHost);
}
