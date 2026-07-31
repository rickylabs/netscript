/**
 * @module
 *
 * Resolves the HTTP endpoint a generated project publishes for one of its apps.
 *
 * The suite must never guess this port. There are two cases, and the difference between
 * them is the whole point of #952:
 *
 * 1. **The project pins a host port** (`NetScript.Apps.<name>.HostPort`, or `Port` from a
 *    workspace scaffolded before the rename). Then `appsettings.json` is the same input the
 *    Aspire helper generator reads when it emits `withHttpEndpoint({ port })`, so reading it
 *    here keeps the probe and the AppHost on one number by construction.
 * 2. **The project pins nothing** — the pristine scaffold since #952, so that two workspaces
 *    on one machine, and `aspire start --isolated`, do not collide. Aspire allocates the host
 *    port at run time and *no file on disk contains it*. The only source of truth is the
 *    running AppHost, so we ask it — exactly as the service-health gate already does.
 *
 * Guessing in case 2 is what makes a failure unreadable: from the outside, a refused
 * connection and a broken render both look like "the home page never arrived".
 */

import { join } from '@std/path';
import { SCAFFOLD_FILES } from '../../../../../src/kernel/constants/scaffold/scaffold-files.ts';

/** The single field of `appsettings.json` this module reads. */
interface AppSettingsAppsShape {
  readonly NetScript?: {
    readonly Apps?: Record<
      string,
      { readonly HostPort?: unknown; readonly Port?: unknown } | undefined
    >;
  };
}

/**
 * Reads the host port a generated project **pins** for `appName`, if it pins one.
 *
 * `HostPort` is the current spelling; `Port` is still honoured so a workspace scaffolded
 * before the rename resolves identically.
 *
 * @param projectRoot - Root of the generated project.
 * @param appName - App key under `NetScript.Apps`.
 * @returns The pinned port, or `undefined` when the project lets Aspire allocate one.
 * @throws If `appsettings.json` is unreadable, is not valid JSON, or pins a non-port value.
 */
export function readPinnedAppPort(projectRoot: string, appName: string): number | undefined {
  const settingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  let raw: string;
  try {
    raw = Deno.readTextFileSync(settingsPath);
  } catch (error) {
    throw new Error(
      `Cannot resolve the "${appName}" app port: ${settingsPath} is unreadable (${
        error instanceof Error ? error.message : String(error)
      }).`,
    );
  }

  let parsed: AppSettingsAppsShape;
  try {
    parsed = JSON.parse(raw) as AppSettingsAppsShape;
  } catch (error) {
    throw new Error(
      `Cannot resolve the "${appName}" app port: ${settingsPath} is not valid JSON (${
        error instanceof Error ? error.message : String(error)
      }).`,
    );
  }

  const entry = parsed.NetScript?.Apps?.[appName];
  const pinned = entry?.HostPort ?? entry?.Port;
  if (pinned === undefined || pinned === null) return undefined;
  if (typeof pinned !== 'number' || !Number.isInteger(pinned) || pinned <= 0) {
    throw new Error(
      `Cannot resolve the "${appName}" app port: ${settingsPath} declares NetScript.Apps.${appName} ` +
        `host port as ${JSON.stringify(pinned)}.`,
    );
  }
  return pinned;
}

/** Narrows `unknown` to a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `aspire describe` may print a banner before its JSON; slice from the first brace/bracket. */
function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('aspire describe did not emit JSON');
  return trimmed.slice(Math.min(...indexes));
}

/** Aspire spells the resource name differently across shapes; accept any of them. */
function resourceNameMatches(value: Record<string, unknown>, name: string): boolean {
  for (const key of ['name', 'displayName', 'resourceName']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }
  return false;
}

/** Depth-first search for the resource node, whatever nesting `describe` emitted. */
function findResource(value: unknown, name: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  if (resourceNameMatches(value, name)) return value;
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const match = findResource(item, name);
        if (match) return match;
      }
      continue;
    }
    const match = findResource(child, name);
    if (match) return match;
  }
  return undefined;
}

/** Every absolute http(s) URL anywhere under the resource node. */
export function collectHttpUrls(value: unknown): string[] {
  const urls = new Set<string>();
  const collect = (node: unknown): void => {
    if (typeof node === 'string') {
      if (/^https?:\/\//i.test(node)) urls.add(node);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) collect(item);
      return;
    }
    if (!isRecord(node)) return;
    for (const child of Object.values(node)) collect(child);
  };
  collect(value);
  return [...urls];
}

/**
 * Extracts the app's base URL from `aspire describe --format Json` output.
 *
 * Split out from {@link resolveAppUrlFromAppHost} so the parse is testable without a
 * running AppHost.
 *
 * @param describeOutput - Raw stdout of `aspire describe`.
 * @param appName - Aspire resource name of the app.
 * @throws If the resource is absent, or exposes no HTTP endpoint.
 */
export function appUrlFromDescribeOutput(describeOutput: string, appName: string): string {
  const resource = findResource(JSON.parse(extractJson(describeOutput)), appName);
  if (!resource) {
    throw new Error(`resource ${appName} was not present in aspire describe output`);
  }
  const urls = collectHttpUrls(resource);
  if (urls.length === 0) {
    throw new Error(
      `resource ${appName} did not expose an HTTP endpoint in aspire describe output`,
    );
  }
  return urls[0];
}

/**
 * Asks the running AppHost which host port it allocated for `appName`.
 *
 * @param appHost - Path to the generated AppHost, as passed to `aspire --apphost`.
 * @param appName - Aspire resource name of the app.
 * @throws If `aspire describe` fails, or the resource exposes no HTTP endpoint.
 */
export async function resolveAppUrlFromAppHost(
  appHost: string,
  appName: string,
): Promise<string> {
  const output = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`aspire describe failed with code ${output.code}: ${stderr || stdout}`);
  }
  return appUrlFromDescribeOutput(stdout, appName);
}

/**
 * Builds the home-page URL of a generated app.
 *
 * Prefers a port the project pins; falls back to asking the running AppHost when the
 * project lets Aspire allocate one.
 *
 * @param projectRoot - Root of the generated project.
 * @param appName - App key under `NetScript.Apps`, and the Aspire resource name.
 * @param appHost - Path to the generated AppHost. Required to resolve an unpinned port.
 */
export async function generatedAppHomeUrl(
  projectRoot: string,
  appName: string,
  appHost?: string,
): Promise<string> {
  const pinned = readPinnedAppPort(projectRoot, appName);
  if (pinned !== undefined) return `http://127.0.0.1:${pinned}/`;

  if (!appHost) {
    throw new Error(
      `Cannot resolve the "${appName}" app URL: the project pins no host port (the pristine ` +
        'scaffold lets Aspire allocate one), so the running AppHost must be queried — but no ' +
        'apphost path was supplied.',
    );
  }
  return new URL('/', await resolveAppUrlFromAppHost(appHost, appName)).toString();
}
