import { KV_BACKGROUND_RUNTIME_RESOURCES } from '../../../../domain/cli-surface.ts';
import { judgeHttpResponse, readBoundedBody } from '../../../../domain/http-contract.ts';
import { resolveResourceUrlsFromAppHost } from '../generated-app-endpoint.ts';

/** Effects used by the child gate; production observes endpoints from the running AppHost. */
export interface BackgroundHealthEffects {
  readonly resolveUrls: typeof resolveResourceUrlsFromAppHost;
  readonly fetch: typeof fetch;
}

const EFFECTS: BackgroundHealthEffects = {
  resolveUrls: resolveResourceUrlsFromAppHost,
  fetch: (input, init) => fetch(input, init),
};

/**
 * Probe every first-party child after Aspire convergence. A served non-ready response fails
 * immediately; another endpoint or a healthy API must never hide a crash-looping child.
 */
export async function probeBackgroundChildren(
  appHost: string,
  effects: BackgroundHealthEffects = EFFECTS,
): Promise<void> {
  for (const resource of KV_BACKGROUND_RUNTIME_RESOURCES) {
    const urls = await effects.resolveUrls(appHost, resource);
    await probeChildHealth(resource, urls, effects.fetch);
  }
}

async function probeChildHealth(
  resource: string,
  urls: readonly string[],
  fetchHealth: typeof fetch,
): Promise<void> {
  let lastFailure = 'no HTTP endpoint';
  for (const base of urls) {
    let response: Response;
    try {
      response = await fetchHealth(new URL('/health', base), {
        redirect: 'manual',
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      lastFailure = 'health endpoint transport failed';
      continue;
    }
    if (response.status !== 200) {
      const verdict = await judgeHttpResponse({ method: 'GET', expectStatus: 200 }, response);
      throw new Error(
        `${resource} child readiness failed: ${
          verdict.kind === 'mismatch' ? verdict.reason : 'unexpected status'
        }`,
      );
    }
    const { body, bodyTruncated } = await readBoundedBody(response);
    if (bodyTruncated) throw new Error(`${resource} child health payload exceeds its bound`);
    let health: unknown;
    try {
      health = JSON.parse(body);
    } catch {
      throw new Error(`${resource} child health payload is not JSON`);
    }
    if (
      typeof health !== 'object' || health === null ||
      !('state' in health) || health.state !== 'ready' ||
      !('registryReady' in health) || health.registryReady !== true ||
      !('dependencyReady' in health) || health.dependencyReady !== true
    ) {
      throw new Error(
        `${resource} child health requires ready with registryReady and dependencyReady`,
      );
    }
    return;
  }
  throw new Error(`${resource} child readiness failed: ${lastFailure}`);
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  if (!appHost) throw new Error('AppHost argument is required');
  await probeBackgroundChildren(appHost);
  console.info('Background children health passed: workers, sagas, triggers');
}
