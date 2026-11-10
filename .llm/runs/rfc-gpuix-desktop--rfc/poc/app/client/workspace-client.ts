/**
 * Typed workspace client through the real NetScript SDK, plus the durable
 * activity stream through the DOM-free consumer that the Expo work shipped.
 */
import { createServiceClient, defineSdkClientContribution } from '@netscript/sdk/client';
import { bindStreamEventSourceV1, createFetchStreamEventSourceV1 } from '@netscript/sdk/streams/consumer';
import { ACTIVITY_STREAM_PATH, SERVICE_NAME, workspaceContract } from '../contract.ts';
import type { HostServices } from './host.ts';

export function createWorkspaceClient(host: HostServices) {
  // The SDK owns transport; a contribution may own declared headers but never
  // `cookie` (reserved). A native host therefore sends its session as a bearer
  // token; a browser host sends nothing and lets the cookie jar do it.
  const session = defineSdkClientContribution()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'desktop:session-bearer',
    context: {},
    headerKeys: ['authorization'] as const,
    responseCache: { mode: 'direct-only' },
    prepare() {
      const headers = host.authHeaders();
      return headers.authorization ? { headers: { authorization: headers.authorization } } : {};
    },
  });
  return createServiceClient({
    contract: workspaceContract,
    serviceName: SERVICE_NAME,
    resolveServiceUrl: () => host.baseUrl,
    contributions: [session] as const,
  });
}

export type WorkspaceClient = ReturnType<typeof createWorkspaceClient>;

export interface StreamChange {
  readonly type: string;
  readonly key: string;
  readonly value?: unknown;
}

export interface ActivitySubscription {
  close(): Promise<void>;
}

/** Follow the activity stream from `offset`; resumes on reconnect without gaps. */
export function followActivity(
  host: HostServices,
  handlers: { onChanges(changes: readonly StreamChange[]): void; onState(state: 'live' | 'reconnecting'): void },
  offset = '-1',
): ActivitySubscription {
  const abort = new AbortController();
  const source = createFetchStreamEventSourceV1({
    url: `${host.baseUrl}${ACTIVITY_STREAM_PATH}?offset=${encodeURIComponent(offset)}`,
    fetch: (url, init) => host.fetch(url, init),
    signal: abort.signal,
    authHeaders: (): HeadersInit => host.authHeaders(),
    heartbeatTimeoutMs: 25_000,
  });
  const binding = bindStreamEventSourceV1({
    source,
    onEvent(event) {
      if (event.event === 'data') handlers.onChanges(event.payload);
      else if (event.event === 'control' || event.event === 'heartbeat') handlers.onState('live');
      else if (event.event === 'error') handlers.onState('reconnecting');
    },
  });
  return {
    async close() {
      binding.dispose();
      abort.abort();
      await source.done.catch(() => {});
    },
  };
}
