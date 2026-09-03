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
import { watchResourceUpdates } from './runtime/resource-state-stream.ts';

/** Test-failure ceiling for missing endpoint events; it is not an allocation-time assumption. */
const ENDPOINT_EVENT_FAILURE_CEILING_MS = 120_000;

/** The single field of `appsettings.json` this module reads. */
interface AppSettingsAppsShape {
  readonly NetScript?: {
    readonly Apps?: Record<
      string,
      { readonly HostPort?: unknown; readonly Port?: unknown } | undefined
    >;
  };
}

/** A live AppHost has not registered the requested resource endpoint yet. */
export class AppEndpointPendingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppEndpointPendingError';
  }
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

/**
 * Matches a resource entry by the two names it actually publishes.
 *
 * `name` is DCP's suffixed instance id (`dashboard-sayhwbds`); `displayName` is the name the
 * AppHost gave it (`dashboard`). Gates pass the latter. `resourceName` is deliberately NOT
 * accepted here — that is the spelling used inside `relationships[]` entries, and matching it
 * would return a relationship stub that carries no `urls[]` at all.
 */
function resourceNameMatches(value: Record<string, unknown>, name: string): boolean {
  for (const key of ['displayName', 'name']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.toLowerCase() === name.toLowerCase()) {
      return true;
    }
  }
  return false;
}

/**
 * Finds the resource entry for `name`.
 *
 * Anchored to the top-level `resources[]` array that `aspire describe --format Json` emits,
 * rather than a free depth-first walk: an unanchored search can surface a nested
 * `relationships[]` stub whose `resourceName` matches but which holds no endpoint. The
 * recursive fallback is kept only for an output shape that has no `resources[]` key.
 */
function findResource(value: unknown, name: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;

  const resources = value['resources'];
  if (Array.isArray(resources)) {
    const exact = resources.filter(isRecord).find((entry) => resourceNameMatches(entry, name));
    if (exact) return exact;
    // DCP suffixes instance ids (`dashboard-sayhwbds`); accept that when nothing matched exactly.
    return resources
      .filter(isRecord)
      .find((entry) =>
        typeof entry['name'] === 'string' &&
        (entry['name'] as string).toLowerCase().startsWith(`${name.toLowerCase()}-`)
      );
  }

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

/**
 * The endpoints a resource *declares*, from its `urls[]` array — `http` before `https`.
 *
 * Deliberately **not** a recursive scrape of the resource node. A node carries far more than
 * its own endpoint: a `dashboardUrl` deep-link into the Aspire dashboard, and an `environment`
 * block holding every service it references (`services__pulse__http__0`, `VITE_PROBE_URL`, the
 * OTLP exporter endpoint...). Probing one of those would not merely be wrong, it could
 * **falsely pass** — a sibling service's page is `text/html` containing `<html` too, which is
 * the entire assertion `probe-app-home.ts` makes. `urls[]` is the resource's own contract.
 */
export function declaredHttpUrls(resource: Record<string, unknown>): string[] {
  const declared = declaredResourceUrls(resource);
  const http: string[] = [];
  const https: string[] = [];
  for (const url of declared) {
    if (/^http:\/\//i.test(url)) http.push(url);
    else if (/^https:\/\//i.test(url)) https.push(url);
  }
  return [...http, ...https];
}

/** Every endpoint URL explicitly declared by a resource, independent of transport. */
export function declaredResourceUrls(resource: Record<string, unknown>): string[] {
  const declared = resource['urls'];
  if (!Array.isArray(declared)) return [];
  return declared.flatMap((entry) => {
    const url = isRecord(entry) ? entry['url'] : entry;
    return typeof url === 'string' ? [url] : [];
  });
}

/**
 * Extracts the app's candidate base URLs from `aspire describe --format Json` output.
 *
 * Returns **every** HTTP URL on the resource, not the first: a resource node can carry more
 * than one (an endpoint plus a health or telemetry URL), and which one is listed first is not
 * a contract. `PROBE_SERVICE_HEALTH_SCRIPT` — the resolver already green in CI — tries them in
 * turn for exactly this reason, and this module follows it rather than inventing a shortcut.
 *
 * Split out from {@link resolveAppUrlsFromAppHost} so the parse is testable without a running
 * AppHost.
 *
 * @param describeOutput - Raw stdout of `aspire describe`.
 * @param appName - Aspire resource name of the app.
 * @throws {@link AppEndpointPendingError} if the resource is absent or exposes no HTTP endpoint.
 * Other parse errors are terminal and are reported unchanged.
 */
export function resourceUrlsFromDescribeOutput(
  describeOutput: string,
  resourceName: string,
): string[] {
  const resource = findResource(JSON.parse(extractJson(describeOutput)), resourceName);
  if (!resource) {
    throw new AppEndpointPendingError(
      `resource ${resourceName} was not present in aspire describe output`,
    );
  }
  const urls = declaredHttpUrls(resource);
  if (urls.length === 0) {
    throw new AppEndpointPendingError(
      `resource ${resourceName} still declared no HTTP endpoint in its aspire describe urls[]`,
    );
  }
  return urls;
}

/** Backward-compatible app-specific spelling for the generic resource URL parser. */
export function appUrlsFromDescribeOutput(describeOutput: string, appName: string): string[] {
  return resourceUrlsFromDescribeOutput(describeOutput, appName);
}

/**
 * Observes the running AppHost until the resource publishes one or more endpoint URLs.
 *
 * @param appHost - Path to the generated AppHost, as passed to `aspire --apphost`.
 * @param resourceName - Aspire resource name.
 * Malformed follow lines are terminal. A stream that exits or reaches its failure ceiling before
 * allocation is reported as a missing observation rather than an observed-but-wrong value.
 */
export async function resolveDeclaredResourceUrlsFromAppHost(
  appHost: string,
  resourceName: string,
  watch: typeof watchResourceUpdates = watchResourceUpdates,
): Promise<string[]> {
  const subscription = await watch(appHost, resourceName);
  try {
    const update = await subscription.waitFor(
      (candidate) => declaredResourceUrls(candidate.resource).length > 0,
      ENDPOINT_EVENT_FAILURE_CEILING_MS,
    );
    return declaredResourceUrls(update.resource);
  } catch (cause) {
    if (
      cause instanceof Error &&
      cause.message.startsWith('Unrecognized Aspire resource update line; raw line:')
    ) {
      throw cause;
    }
    throw new Error(
      `Aspire did not observe endpoint allocation for ${resourceName}: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
      { cause },
    );
  } finally {
    await subscription.close();
  }
}

/** Observe a resource endpoint allocation and return only its HTTP candidates. */
export async function resolveResourceUrlsFromAppHost(
  appHost: string,
  resourceName: string,
  watch: typeof watchResourceUpdates = watchResourceUpdates,
): Promise<string[]> {
  const declared = await resolveDeclaredResourceUrlsFromAppHost(appHost, resourceName, watch);
  const urls = declared.filter((url) => /^https?:\/\//i.test(url));
  if (urls.length === 0) {
    throw new Error(
      `Aspire observed endpoint allocation for ${resourceName}, but the update declared no HTTP URL: ` +
        JSON.stringify(declared),
    );
  }
  return urls;
}

/** Backward-compatible app-specific spelling for generic live resource URL resolution. */
export async function resolveAppUrlsFromAppHost(
  appHost: string,
  appName: string,
): Promise<string[]> {
  return await resolveResourceUrlsFromAppHost(appHost, appName);
}

/**
 * Every home-page URL worth trying for a generated app, most likely first.
 *
 * A pinned port yields exactly one. An unpinned one yields whatever the running AppHost
 * reports — plus, for each, a `127.0.0.1` twin when Aspire named the loopback host
 * `localhost`. That twin is not cosmetic: Deno's `--allow-net` allowlist matches on the host
 * *string*, so a gate granted `127.0.0.1` cannot fetch `localhost` at all, and the failure
 * surfaces as a permission error indistinguishable from a refused connection.
 *
 * @param projectRoot - Root of the generated project.
 * @param appName - App key under `NetScript.Apps`, and the Aspire resource name.
 * @param appHost - Path to the generated AppHost. Required to resolve an unpinned port.
 */
export async function generatedAppHomeUrls(
  projectRoot: string,
  appName: string,
  appHost?: string,
): Promise<string[]> {
  const pinned = readPinnedAppPort(projectRoot, appName);
  if (pinned !== undefined) return [`http://127.0.0.1:${pinned}/`];

  if (!appHost) {
    throw new Error(
      `Cannot resolve the "${appName}" app URL: the project pins no host port (the pristine ` +
        'scaffold lets Aspire allocate one), so the running AppHost must be queried — but no ' +
        'apphost path was supplied.',
    );
  }

  return await generatedAppHomeUrlsFromAppHost(appHost, appName);
}

/** Resolves and normalizes the current live AppHost URLs for an unpinned app. */
export async function generatedAppHomeUrlsFromAppHost(
  appHost: string,
  appName: string,
): Promise<string[]> {
  const candidates: string[] = [];
  for (const base of await resolveAppUrlsFromAppHost(appHost, appName)) {
    const home = new URL('/', base);
    candidates.push(home.toString());
    if (home.hostname === 'localhost') {
      const twin = new URL(home);
      twin.hostname = '127.0.0.1';
      candidates.push(twin.toString());
    }
  }
  return [...new Set(candidates)];
}
