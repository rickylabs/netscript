/** Headless-browser acceptance probe for generated route-local island hydration. */

import { dirname } from '@std/path';
import type { IslandHydrationReceipt } from './island-receipts.ts';
import { findBrowserExecutable, resolveProjectAppUrls } from './probe-app-reference.ts';

const ISLAND_PATH = '/people';
const LIST_PATH = '/api/rpc/v1/users/list';
const QUERY_MODULE_PATH = '/@id/@netscript/fresh/query';
const TIMEOUT_MS = 20_000;
const BASELINE_CONFIRMATION_MS = 500;
export interface IslandHydrationObservation {
  readonly queryClientFound: boolean;
  readonly listQueryFound: boolean;
  readonly freshIslandElement: string | null;
}

export interface ResourceQueryRefetchObservation {
  readonly queryClientFound: boolean;
  readonly listQueryFound: boolean;
  readonly baselineListRequestCount: number;
  readonly finalListRequestCount: number;
  readonly refetchStatus: number | null;
}

export interface ProbeIslandHydrationOptions {
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly interact?: (url: string) => Promise<IslandHydrationObservation>;
  readonly persist?: (receipt: IslandHydrationReceipt) => Promise<void>;
  readonly receiptPath?: string;
}

export interface ProbeResourceQueryRefetchOptions {
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly interact?: (url: string) => Promise<ResourceQueryRefetchObservation>;
}

/** Convert browser observations into the strict hydration receipt. */
export function receiptFromIslandInteraction(
  observation: IslandHydrationObservation,
): IslandHydrationReceipt {
  if (!observation.freshIslandElement) {
    throw new Error('generated resource island surface was not rendered');
  }
  if (!observation.queryClientFound) {
    throw new Error(
      'generated resource QueryClient was not reachable from the hydrated Preact tree',
    );
  }
  if (!observation.listQueryFound) {
    throw new Error('generated users.list query was not present after island hydration');
  }
  return { islandHydrated: true, freshIslandElement: observation.freshIslandElement };
}

/** Resolve the live generated app and prove its resource QueryIsland hydrated. */
export async function probeIslandHydration(
  projectRoot: string,
  appName: string,
  appHost: string | undefined,
  options: ProbeIslandHydrationOptions = {},
): Promise<IslandHydrationReceipt> {
  const baseUrls = options.resolveLiveUrls
    ? appHost === undefined ? [] : await options.resolveLiveUrls(appHost, appName)
    : await resolveProjectAppUrls(projectRoot, appName, appHost);
  if (baseUrls.length === 0) throw new Error(`No live URL resolved for generated app ${appName}.`);
  const interact = options.interact ?? interactWithHeadlessChrome;
  const persist = options.persist ??
    (options.receiptPath
      ? (receipt: IslandHydrationReceipt) => writeReceipt(options.receiptPath!, receipt)
      : () => Promise.resolve());
  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      const observation = await interact(new URL(ISLAND_PATH, baseUrl).toString());
      const receipt = receiptFromIslandInteraction(observation);
      await persist(receipt);
      return receipt;
    } catch (error) {
      lastError = error;
    }
  }
  await persist({ islandHydrated: false, freshIslandElement: null });
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Resolve the live generated app and prove its active resource query refetches exactly once. */
export async function probeResourceQueryRefetch(
  projectRoot: string,
  appName: string,
  appHost: string | undefined,
  options: ProbeResourceQueryRefetchOptions = {},
): Promise<ResourceQueryRefetchObservation> {
  const baseUrls = options.resolveLiveUrls
    ? appHost === undefined ? [] : await options.resolveLiveUrls(appHost, appName)
    : await resolveProjectAppUrls(projectRoot, appName, appHost);
  if (baseUrls.length === 0) throw new Error(`No live URL resolved for generated app ${appName}.`);
  const interact = options.interact ?? interactWithHeadlessChromeForRefetch;
  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      const observation = await interact(new URL(ISLAND_PATH, baseUrl).toString());
      requireResourceQueryRefetch(observation);
      return observation;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function requireResourceQueryRefetch(observation: ResourceQueryRefetchObservation): void {
  if (!observation.queryClientFound) throw new Error('resource QueryClient was not reachable');
  if (!observation.listQueryFound) throw new Error('users.list query was not present');
  const expected = observation.baselineListRequestCount + 1;
  if (observation.finalListRequestCount !== expected) {
    throw new Error(
      `users.list request count was ${observation.finalListRequestCount}; expected ${expected}`,
    );
  }
  const status = observation.refetchStatus;
  if (status === null || status < 200 || status >= 300) {
    throw new Error(`users.list refetch returned ${status ?? 'no HTTP response'}`);
  }
}

async function interactWithHeadlessChrome(url: string): Promise<IslandHydrationObservation> {
  return await withHeadlessChrome('island-hydration', async (client) => {
    await client.send('Page.navigate', { url });
    await client.waitFor('Page.loadEventFired');
    return await waitForEvaluation<IslandHydrationObservation>(
      client,
      islandHydrationObservationExpression(),
      (value) =>
        value?.freshIslandElement !== null && value?.queryClientFound === true &&
        value.listQueryFound === true,
    );
  });
}

async function interactWithHeadlessChromeForRefetch(
  url: string,
): Promise<ResourceQueryRefetchObservation> {
  return await withHeadlessChrome('resource-refetch', async (client) => {
    await client.send('Network.enable');
    const requestIds = new Set<string>();
    const completedIds = new Set<string>();
    const responseStatuses = new Map<string, number>();
    client.observe(({ method, params }) => {
      const requestId = typeof params.requestId === 'string' ? params.requestId : undefined;
      if (
        method === 'Network.requestWillBeSent' && requestId &&
        isUsersListUrl((params.request as { url?: unknown } | undefined)?.url)
      ) requestIds.add(requestId);
      else if (method === 'Network.responseReceived' && requestId && requestIds.has(requestId)) {
        const status = (params.response as { status?: unknown } | undefined)?.status;
        if (typeof status === 'number') responseStatuses.set(requestId, status);
      } else if (method === 'Network.loadingFinished' && requestId && requestIds.has(requestId)) {
        completedIds.add(requestId);
      }
    });
    await client.send('Page.navigate', { url });
    await client.waitFor('Page.loadEventFired');
    const discovery = await waitForEvaluation<QueryClientDiscoveryObservation>(
      client,
      resourceQueryExpression(false),
      (value) => value?.queryClientFound === true && value?.listQueryFound === true,
    );
    const counts = () => ({ requestCount: requestIds.size, completedCount: completedIds.size });
    const baseline = await waitForStableRequestCount(counts);
    const invalidation = await client.evaluate<QueryClientDiscoveryObservation>(
      resourceQueryExpression(true),
    );
    if (!invalidation?.queryClientFound || !invalidation.listQueryFound) {
      throw new Error('generated users.list query disappeared before invalidation');
    }
    await waitForRequestCount(counts, baseline + 1);
    const refetchId = [...requestIds].at(-1);
    return {
      ...discovery,
      baselineListRequestCount: baseline,
      finalListRequestCount: requestIds.size,
      refetchStatus: refetchId ? responseStatuses.get(refetchId) ?? null : null,
    };
  });
}

async function withHeadlessChrome<T>(
  profileName: string,
  interact: (client: CdpClient) => Promise<T>,
): Promise<T> {
  const executable = await findBrowserExecutable();
  const port = reservePort();
  const profile = await Deno.makeTempDir({ prefix: `netscript-${profileName}-` });
  const child = new Deno.Command(executable, {
    args: [
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--no-sandbox',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    stdout: 'null',
    stderr: 'null',
  }).spawn();
  let client: CdpClient | undefined;
  try {
    client = await CdpClient.connect(await waitForPageTarget(port));
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    return await interact(client);
  } finally {
    client?.close();
    try {
      child.kill('SIGTERM');
    } catch {
      // The browser already terminated; its status below still completes cleanup.
    }
    await child.status;
    await Deno.remove(profile, { recursive: true }).catch(() => undefined);
  }
}

class CdpClient {
  readonly #socket: WebSocket;
  readonly #pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>();
  readonly #events: Array<{ method: string; params: Record<string, unknown> }> = [];
  readonly #observers: Array<
    (event: { method: string; params: Record<string, unknown> }) => void
  > = [];
  #nextId = 1;

  private constructor(socket: WebSocket) {
    this.#socket = socket;
    socket.onmessage = (event) => this.#receive(String(event.data));
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`CDP connection timed out: ${url}`)), 5000);
      socket.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      socket.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`CDP connection failed: ${url}`));
      };
    });
    return new CdpClient(socket);
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
  }

  observe(observer: (event: { method: string; params: Record<string, unknown> }) => void): void {
    this.#observers.push(observer);
  }

  async evaluate<T>(expression: string): Promise<T | undefined> {
    const response = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }) as {
      result?: { value?: T };
      exceptionDetails?: { text?: string; exception?: { description?: string } };
    };
    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description ??
          response.exceptionDetails.text ??
          'browser evaluation failed',
      );
    }
    return response.result?.value;
  }

  async waitFor(method: string): Promise<void> {
    const started = Date.now();
    while (Date.now() - started < TIMEOUT_MS) {
      const index = this.#events.findIndex((event) => event.method === method);
      if (index >= 0) {
        this.#events.splice(index, 1);
        return;
      }
      await delay(25);
    }
    throw new Error(`timed out waiting for browser event ${method}`);
  }

  close(): void {
    this.#socket.close();
  }

  #receive(raw: string): void {
    const message = JSON.parse(raw) as {
      id?: number;
      result?: unknown;
      error?: { message?: string };
      method?: string;
      params?: Record<string, unknown>;
    };
    if (message.id !== undefined) {
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message ?? 'CDP command failed'));
      else pending.resolve(message.result);
      return;
    }
    if (message.method) {
      const event = { method: message.method, params: message.params ?? {} };
      this.#events.push(event);
      for (const observer of this.#observers) observer(event);
    }
  }
}

async function waitForPageTarget(port: number): Promise<string> {
  const endpoint = `http://127.0.0.1:${port}/json/list`;
  const started = Date.now();
  while (Date.now() - started < TIMEOUT_MS) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const targets = await response.json() as Array<{
          type?: string;
          webSocketDebuggerUrl?: string;
        }>;
        const page = targets.find((target) =>
          target.type === 'page' && typeof target.webSocketDebuggerUrl === 'string'
        );
        if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome has not opened its debugging endpoint yet.
    }
    await delay(50);
  }
  throw new Error(`headless Chromium did not expose a page target at ${endpoint}`);
}

async function waitForEvaluation<T>(
  client: CdpClient,
  expression: string,
  predicate: (value: T | undefined) => boolean,
): Promise<T> {
  const started = Date.now();
  let lastValue: T | undefined;
  while (Date.now() - started < TIMEOUT_MS) {
    lastValue = await client.evaluate<T>(expression);
    if (predicate(lastValue)) return lastValue as T;
    await delay(50);
  }
  throw new Error(
    `timed out waiting for generated island DOM state; last observation ${
      JSON.stringify(lastValue)
    }`,
  );
}

function islandHydrationObservationExpression(): string {
  return `(async () => {
    const surface = document.querySelector('main output');
    const { getIslandQueryClient } = await import(${JSON.stringify(QUERY_MODULE_PATH)});
    const queryClient = getIslandQueryClient();
    const queries = queryClient.getQueryCache().getAll();
    const listQuery = queries.find((query) =>
      Array.isArray(query.queryKey) && query.queryKey[0] === 'users' && query.queryKey[1] === 'list'
    );
    return {
      queryClientFound: queryClient !== null,
      listQueryFound: listQuery !== undefined,
      freshIslandElement: surface?.tagName.toLowerCase() ?? null,
    };
  })()`;
}

interface QueryClientDiscoveryObservation {
  readonly queryClientFound: boolean;
  readonly listQueryFound: boolean;
}

type RequestCounts = Readonly<{ requestCount: number; completedCount: number }>;

function resourceQueryExpression(invalidate: boolean): string {
  return `(async () => {
    const { getIslandQueryClient } = await import(${JSON.stringify(QUERY_MODULE_PATH)});
    const queryClient = getIslandQueryClient();
    const queries = queryClient.getQueryCache().getAll();
    const listQuery = queries.find((query) =>
      Array.isArray(query.queryKey) && query.queryKey[0] === 'users' && query.queryKey[1] === 'list'
    );
    if (${JSON.stringify(invalidate)} && listQuery) {
      await queryClient.invalidateQueries({ queryKey: listQuery.queryKey, exact: true });
    }
    return {
      queryClientFound: queryClient !== null,
      listQueryFound: listQuery !== undefined,
    };
  })()`;
}

async function waitForStableRequestCount(observe: () => RequestCounts): Promise<number> {
  const started = Date.now();
  let candidate: number | undefined;
  let stableSince: number | undefined;
  while (Date.now() - started < TIMEOUT_MS) {
    const counts = observe();
    if (counts.requestCount !== counts.completedCount) {
      candidate = undefined;
      stableSince = undefined;
    } else if (candidate !== counts.requestCount) {
      candidate = counts.requestCount;
      stableSince = Date.now();
    } else if (stableSince !== undefined && Date.now() - stableSince >= BASELINE_CONFIRMATION_MS) {
      return counts.requestCount;
    }
    await delay(50);
  }
  throw new Error('timed out waiting for a stable users.list request baseline');
}

async function waitForRequestCount(observe: () => RequestCounts, expected: number): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < TIMEOUT_MS) {
    const counts = observe();
    if (counts.requestCount === expected && counts.completedCount === expected) return;
    if (counts.requestCount > expected) {
      throw new Error(`users.list request count exceeded ${expected}`);
    }
    await delay(50);
  }
  throw new Error(`timed out waiting for users.list request count ${expected}`);
}

function isUsersListUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).pathname === LIST_PATH;
  } catch {
    return false;
  }
}

function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  return port;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function writeReceipt(path: string, receipt: IslandHydrationReceipt): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(receipt, null, 2)}\n`);
}

if (import.meta.main) {
  const [projectRoot, appName, appHost, receiptPath] = Deno.args;
  if (!projectRoot || !appName || !receiptPath) {
    throw new Error('project root, app name, app host, and receipt path are required');
  }
  await probeIslandHydration(projectRoot, appName, appHost, { receiptPath });
}
