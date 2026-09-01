import { generatedAppHomeUrlsFromAppHost, readPinnedAppPort } from '../generated-app-endpoint.ts';

/** HTTP-semantic evidence returned by one generated dynamic-route request. */
export interface DynamicRouteResponseEvidence {
  readonly mode: 'plain' | 'partial';
  readonly nonce: string;
  readonly status: number;
  readonly body: string;
}

/** Stable semantic rejection classes used by the probe and its focused tests. */
export type DynamicRouteResponseFailure =
  | 'status'
  | 'path-marker'
  | 'href-marker';

/** Result of checking one response without performing network I/O. */
export type DynamicRouteResponseValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly failure: DynamicRouteResponseFailure; readonly message: string };

export interface ProbeAppDynamicRouteOptions {
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly fetchUrl?: typeof fetch;
  readonly createNonce?: () => string;
  readonly log?: (message: string) => void;
}

/** Validate one generated dynamic-route response with element/attribute-scoped markers. */
export function validateDynamicRouteResponse(
  evidence: DynamicRouteResponseEvidence,
): DynamicRouteResponseValidation {
  if (evidence.status !== 200) {
    return {
      ok: false,
      failure: 'status',
      message: `${evidence.mode} dynamic route returned HTTP ${evidence.status}`,
    };
  }

  const pathMarker = `data-order-id="${evidence.nonce}"`;
  if (!evidence.body.includes(pathMarker)) {
    return {
      ok: false,
      failure: 'path-marker',
      message: `${evidence.mode} dynamic route did not render ${pathMarker}`,
    };
  }

  const hrefMarker = `href="/examples/orders/${evidence.nonce}"`;
  if (!evidence.body.includes(hrefMarker)) {
    return {
      ok: false,
      failure: 'href-marker',
      message: `${evidence.mode} dynamic route did not render ${hrefMarker}`,
    };
  }

  return { ok: true };
}

function createDynamicRouteNonce(): string {
  return `order-${crypto.randomUUID()}`;
}

async function resolveProjectAppUrls(
  projectRoot: string,
  appName: string,
  appHost?: string,
): Promise<string[]> {
  const pinned = readPinnedAppPort(projectRoot, appName);
  if (pinned !== undefined) return [`http://127.0.0.1:${pinned}/`];
  return appHost === undefined ? [] : await generatedAppHomeUrlsFromAppHost(appHost, appName);
}

/** Probe plain and Fresh-partial requests for one generated dynamic-route nonce. */
export async function probeAppDynamicRoute(
  projectRoot: string,
  appName: string,
  appHost?: string,
  options: ProbeAppDynamicRouteOptions = {},
): Promise<void> {
  const baseUrls = options.resolveLiveUrls
    ? appHost === undefined ? [] : await options.resolveLiveUrls(appHost, appName)
    : await resolveProjectAppUrls(projectRoot, appName, appHost);
  if (baseUrls.length === 0) {
    throw new Error(`No live URL resolved for generated app ${appName}.`);
  }

  const nonce = (options.createNonce ?? createDynamicRouteNonce)();
  if (nonce === 'order-42') {
    throw new Error('Dynamic route probe nonce must differ from the seeded examples-page id.');
  }

  const fetchUrl = options.fetchUrl ?? fetch;
  const log = options.log ?? console.info;
  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      for (const mode of ['plain', 'partial'] as const) {
        const url = new URL(`/examples/orders/${nonce}`, baseUrl);
        if (mode === 'partial') url.searchParams.set('fresh-partial', 'true');
        const response = await fetchUrl(url, { headers: { accept: 'text/html' } });
        const result = validateDynamicRouteResponse({
          mode,
          nonce,
          status: response.status,
          body: await response.text(),
        });
        if (!result.ok) throw new Error(result.message);
        log(`${mode} dynamic route rendered at ${url}: HTTP ${response.status}`);
      }
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

if (import.meta.main) {
  const projectRoot = Deno.args[0];
  const appName = Deno.args[1];
  const appHost = Deno.args[2];
  if (!projectRoot) throw new Error('project root argument is required');
  if (!appName) throw new Error('app name argument is required');
  await probeAppDynamicRoute(projectRoot, appName, appHost);
}
