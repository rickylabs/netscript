/** Chrome DevTools transport for the live generated service-client probe. */

import {
  type BrowserPageEventEvidence,
  createBrowserPageDiagnosticsCollector,
  type FailedNetworkRequestEvidence,
} from './service-client-browser-diagnostics.ts';

const LIST_PATH = '/api/rpc/v1/users/list';
const UPDATE_PATH = '/api/rpc/v1/users/update';
const TIMEOUT_MS = 20_000;
const BROWSER_VERSION_TIMEOUT_MS = 5_000;
const BROWSER_OUTPUT_LIMIT_BYTES = 32 * 1024;
const BASELINE_CONFIRMATION_MS = 500;
const BASELINE_POLL_MS = 50;
const PAGE_BODY_HTML_LIMIT = 600;
const OPTIMISTIC_DIAGNOSTICS_MARKER = '__NETSCRIPT_OPTIMISTIC_RENDER_DIAGNOSTICS__';
const ALREADY_TERMINATED_CHILD_MESSAGE = 'Child process has already terminated';
const BUILT_IN_BROWSER_SOURCE = 'built-in allowlist';
const BROWSER_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
  '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
] as const;

/** Environment variable that selects the exact browser executable for CLI runtime E2E. */
export const BROWSER_EXECUTABLE_ENV = 'NETSCRIPT_E2E_BROWSER_EXECUTABLE';

export interface BrowserExecutableSelection {
  readonly path: string;
  readonly source: typeof BROWSER_EXECUTABLE_ENV | typeof BUILT_IN_BROWSER_SOURCE;
  readonly version: string;
}

export interface BoundedTextCapture {
  readonly drain: Promise<void>;
  text(): string;
}

export interface SettledRefetchEvidence {
  readonly baselineListRequestCount: number;
  readonly finalListRequestCount: number;
  readonly mutationSucceeded: boolean;
  readonly optimisticRowContainedRenamedName: boolean;
  readonly finalRowContainedRenamedName: boolean;
  readonly renamedName: string;
}

export interface RequestCompletionCounts {
  readonly requestCount: number;
  readonly completedCount: number;
}

interface BrowserInstrumentationInstall {
  readonly queryClientFound: boolean;
  readonly queryClientPath: string | null;
}

interface OptimisticRenderDiagnostics {
  readonly renderedRowText: string | null;
  readonly mutationState: string | null;
  readonly renderState: string | null;
  readonly islandHydrated: boolean;
  readonly islandInteractive: boolean;
  readonly hydrationEvidence: string;
  readonly freshIslandElement: string | null;
  readonly queryClientFound: boolean;
  readonly queryClientPath: string | null;
  readonly listQueryKey: unknown;
  readonly listCacheData: unknown;
  readonly listDataUpdatedAt: number | null;
  readonly cacheEvents: readonly unknown[];
  readonly onMutateRan: boolean;
  readonly finalUrl: string | null;
  readonly documentHttpStatus: number | null;
  readonly documentTitle: string | null;
  readonly bodyHtmlSnippet: string | null;
  readonly consoleErrors: readonly string[];
  readonly failedNetworkRequests: readonly FailedNetworkRequestEvidence[];
  readonly captureError?: string;
}

interface StableBaselineOptions {
  readonly confirmationMs?: number;
  readonly pollMs?: number;
  readonly timeoutMs?: number;
  readonly now?: () => number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

interface CdpEvent {
  readonly method: string;
  readonly params: Record<string, unknown>;
}

interface CdpSocket {
  onopen: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  send(data: string): void;
  close(): void;
}

interface CdpConnectOptions {
  readonly timeoutMs?: number;
  readonly createSocket?: (url: string) => CdpSocket;
}

interface PendingCdpCommand {
  readonly resolve: (value: unknown) => void;
  readonly reject: (error: Error) => void;
  readonly timeoutId: ReturnType<typeof setTimeout>;
}

/** Minimal CDP client used only by the CLI runtime E2E probe and its focused tests. */
export class CdpClient {
  readonly #socket: CdpSocket;
  readonly #pending = new Map<
    number,
    PendingCdpCommand
  >();
  readonly #events: CdpEvent[] = [];
  readonly #observers: Array<(event: CdpEvent) => void> = [];
  #nextId = 1;

  private constructor(socket: CdpSocket) {
    this.#socket = socket;
    socket.onmessage = (message) => this.#receive(String(message.data));
  }

  static async connect(url: string, options: CdpConnectOptions = {}): Promise<CdpClient> {
    const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
    const socket = (options.createSocket ?? ((candidate) => new WebSocket(candidate)))(url);
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        socket.onopen = null;
        socket.onerror = null;
        const timeoutMessage = `CDP WebSocket connection to ${url} timed out after ${timeoutMs} ms`;
        try {
          socket.close();
          reject(new Error(timeoutMessage));
        } catch (error) {
          reject(
            new Error(`${timeoutMessage}; socket close failed: ${errorMessage(error)}`, {
              cause: error,
            }),
          );
        }
      }, timeoutMs);
      const settle = (action: () => void) => {
        clearTimeout(timeoutId);
        socket.onopen = null;
        socket.onerror = null;
        action();
      };
      socket.onopen = () => settle(resolve);
      socket.onerror = () => settle(() => reject(new Error(`failed to connect to ${url}`)));
    });
    return new CdpClient(socket);
  }

  observe(observer: (event: CdpEvent) => void): void {
    this.#observers.push(observer);
  }

  send(
    method: string,
    params: Record<string, unknown> = {},
    timeoutMs = TIMEOUT_MS,
  ): Promise<unknown> {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (!this.#pending.delete(id)) return;
        reject(new Error(`CDP response to ${method} timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      this.#pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        timeoutId,
      });
    });
  }

  /** Expose pending transport state only to the focused same-module E2E tests. */
  get pendingCommandCountForTest(): number {
    return this.#pending.size;
  }

  async waitFor(
    method: string,
    predicate: (params: Record<string, unknown>) => boolean = () => true,
    timeoutMs = TIMEOUT_MS,
  ): Promise<Record<string, unknown>> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const index = this.#events.findIndex((event) =>
        event.method === method && predicate(event.params)
      );
      if (index >= 0) return this.#events.splice(index, 1)[0].params;
      await delay(25);
    }
    throw new Error(`timed out waiting for CDP event ${method}`);
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
      clearTimeout(pending.timeoutId);
      if (message.error) pending.reject(new Error(message.error.message ?? 'CDP command failed'));
      else pending.resolve(message.result);
      return;
    }
    if (!message.method) return;
    const event = { method: message.method, params: message.params ?? {} };
    this.#events.push(event);
    for (const observer of this.#observers) observer(event);
  }
}

/** Collect the mutation/refetch evidence from one live generated app URL. */
export async function collectBrowserRefetchEvidence(url: string): Promise<SettledRefetchEvidence> {
  const selection = await selectBrowserExecutable();
  const port = reservePort();
  const profile = await Deno.makeTempDir({ prefix: 'netscript-service-client-cdp-' });
  let child: Deno.ChildProcess;
  try {
    child = new Deno.Command(selection.path, {
      args: [
        '--headless=new',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-background-networking',
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${profile}`,
        'about:blank',
      ],
      stdout: 'null',
      stderr: 'piped',
    }).spawn();
  } catch (error) {
    await Deno.remove(profile, { recursive: true }).catch(() => undefined);
    throw new Error(
      `${selectionLabel(selection)} failed to start headless: ${errorMessage(error)}`,
      { cause: error },
    );
  }
  const stderr = captureBoundedText(child.stderr);
  const childStatus = child.status;
  let client: CdpClient | undefined;
  try {
    const target = await awaitBrowserStartup(
      selection,
      waitForDebugTarget(port),
      childStatus,
      stderr,
    );
    client = await CdpClient.connect(target.webSocketDebuggerUrl);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');
    await client.send('Log.enable');
    await client.send('Fetch.enable', {
      patterns: [{ urlPattern: `*${UPDATE_PATH}*`, requestStage: 'Response' }],
    });

    const listRequestIds = new Set<string>();
    const completedListIds = new Set<string>();
    const pageDiagnostics = createBrowserPageDiagnosticsCollector();
    client.observe((event) => {
      pageDiagnostics.observe(event);
      const { method, params } = event;
      if (method === 'Network.requestWillBeSent') {
        const request = params.request as { url?: string } | undefined;
        const requestId = params.requestId;
        if (typeof requestId === 'string' && isRpcPath(request?.url, LIST_PATH)) {
          listRequestIds.add(requestId);
        }
      } else if (method === 'Network.loadingFinished' && typeof params.requestId === 'string') {
        if (listRequestIds.has(params.requestId)) completedListIds.add(params.requestId);
      }
    });

    await client.send('Page.navigate', { url });
    await client.waitFor('Page.loadEventFired');
    const instrumentation = await evaluate<BrowserInstrumentationInstall>(
      client,
      installOptimisticInstrumentationExpression(),
    );
    try {
      await waitForExpression<string>(client, rowNameExpression());
    } catch (error) {
      const diagnostics = await captureOptimisticRenderDiagnostics(
        client,
        undefined,
        instrumentation,
        false,
        pageDiagnostics.snapshot(),
      );
      throw diagnosticsError('initial Rename row assertion failed', diagnostics, error);
    }
    await evaluate(client, clickRefreshExpression());
    const baseline = await waitForCompletedStableBaseline(() => ({
      requestCount: listRequestIds.size,
      completedCount: completedListIds.size,
    }));
    let originalName: string;
    try {
      originalName = await waitForExpression<string>(client, rowNameExpression());
    } catch (error) {
      const diagnostics = await captureOptimisticRenderDiagnostics(
        client,
        undefined,
        instrumentation,
        false,
        pageDiagnostics.snapshot(),
      );
      throw diagnosticsError('refreshed Rename row assertion failed', diagnostics, error);
    }
    const renamedName = `${originalName}*`;

    await evaluate(client, clickRenameExpression());
    const paused = await client.waitFor(
      'Fetch.requestPaused',
      (params) => {
        const request = params.request as { url?: string } | undefined;
        return isRpcPath(request?.url, UPDATE_PATH) &&
          typeof params.responseStatusCode === 'number';
      },
    );
    let optimistic: boolean;
    try {
      optimistic = await waitForExpression<boolean>(
        client,
        rowContainsExpression(renamedName),
        (value) => value,
      );
    } catch (error) {
      const diagnostics = await captureOptimisticRenderDiagnostics(
        client,
        renamedName,
        instrumentation,
        true,
        pageDiagnostics.snapshot(),
      );
      throw diagnosticsError('optimistic row assertion failed', diagnostics, error);
    }
    const mutationStatus = paused.responseStatusCode;
    await client.send('Fetch.continueResponse', { requestId: paused.requestId });
    await client.send('Fetch.disable');
    if (typeof paused.networkId === 'string') {
      await client.waitFor(
        'Network.loadingFinished',
        (params) => params.requestId === paused.networkId,
      );
    }

    await waitUntil(
      () => listRequestIds.size === baseline + 1 && completedListIds.size >= baseline + 1,
      'one settled users.list refetch',
    );
    const finalRow = await waitForExpression<boolean>(
      client,
      rowContainsExpression(renamedName),
      (value) => value,
    );
    await delay(500);
    return {
      baselineListRequestCount: baseline,
      finalListRequestCount: listRequestIds.size,
      mutationSucceeded: typeof mutationStatus === 'number' && mutationStatus >= 200 &&
        mutationStatus < 300,
      optimisticRowContainedRenamedName: optimistic,
      finalRowContainedRenamedName: finalRow,
      renamedName,
    };
  } finally {
    client?.close();
    try {
      await terminateBrowserProcess(child, stderr.drain);
    } finally {
      await Deno.remove(profile, { recursive: true }).catch(() => undefined);
    }
  }
}

/** Select a runnable Chrome-family executable, honoring a strict explicit override. */
export async function selectBrowserExecutable(
  override: string | undefined = Deno.env.get(BROWSER_EXECUTABLE_ENV),
  probe: (path: string) => Promise<string> = probeBrowserVersion,
): Promise<BrowserExecutableSelection> {
  if (override !== undefined) {
    const displayPath = override.length === 0 ? '<empty>' : override;
    if (override.length === 0) {
      throw new Error(`${BROWSER_EXECUTABLE_ENV} browser executable <empty>: value is empty`);
    }
    try {
      return {
        path: override,
        source: BROWSER_EXECUTABLE_ENV,
        version: await probe(override),
      };
    } catch (error) {
      throw new Error(
        `${BROWSER_EXECUTABLE_ENV} browser executable ${JSON.stringify(displayPath)}: ${
          errorMessage(error)
        }`,
        { cause: error },
      );
    }
  }

  const failures: string[] = [];
  for (const candidate of BROWSER_CANDIDATES) {
    try {
      return {
        path: candidate,
        source: BUILT_IN_BROWSER_SOURCE,
        version: await probe(candidate),
      };
    } catch (error) {
      failures.push(`${JSON.stringify(candidate)}: ${errorMessage(error)}`);
    }
  }
  throw new Error(
    `no runnable Chrome-family executable found; ${failures.join('; ')}. ` +
      `Set ${BROWSER_EXECUTABLE_ENV} to an executable browser path.`,
  );
}

/** Validate a browser executable with a bounded, observable `--version` probe. */
export async function probeBrowserVersion(
  path: string,
  timeoutMs = BROWSER_VERSION_TIMEOUT_MS,
): Promise<string> {
  let info: Deno.FileInfo;
  try {
    info = await Deno.stat(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) throw new Error('path does not exist');
    throw new Error(`path could not be inspected: ${errorMessage(error)}`, { cause: error });
  }
  if (!info.isFile) throw new Error('path is not a file');
  if (info.mode !== null && Deno.build.os !== 'windows' && (info.mode & 0o111) === 0) {
    throw new Error('path is not executable');
  }

  let child: Deno.ChildProcess;
  try {
    child = new Deno.Command(path, {
      args: ['--version'],
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
  } catch (error) {
    throw new Error(`failed to start version probe: ${errorMessage(error)}`, { cause: error });
  }

  const stdout = captureBoundedText(child.stdout);
  const stderr = captureBoundedText(child.stderr);
  const drain = Promise.all([stdout.drain, stderr.drain]).then(() => undefined);
  const timeout = Promise.withResolvers<'timeout'>();
  const timeoutId = setTimeout(() => timeout.resolve('timeout'), timeoutMs);
  const result = await Promise.race([
    child.status.then((status) => ({ kind: 'status' as const, status })),
    timeout.promise.then(() => ({ kind: 'timeout' as const })),
  ]);
  clearTimeout(timeoutId);

  if (result.kind === 'timeout') {
    await terminateBrowserProcess(child, drain);
    throw new Error(`version probe timed out after ${timeoutMs} ms`);
  }
  await drain;
  if (!result.status.success) {
    throw new Error(
      `version probe exited with code ${result.status.code}, signal ${
        result.status.signal ?? 'none'
      }; ` +
        `stderr: ${stderr.text() || '<empty>'}`,
    );
  }

  const output = [stdout.text(), stderr.text()].filter((entry) => entry.length > 0).join('\n');
  const version = output.split(/\r?\n/).find((line) =>
    /(?:Google Chrome(?: for Testing)?|Chromium|Microsoft Edge)/i.test(line)
  )?.trim();
  if (!version) {
    throw new Error(`unrecognized browser version output: ${output || '<empty>'}`);
  }
  return version;
}

/** Drain a byte stream while retaining only a bounded tail for diagnostics. */
export function captureBoundedText(
  stream: ReadableStream<Uint8Array>,
  maxBytes = BROWSER_OUTPUT_LIMIT_BYTES,
): BoundedTextCapture {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError('maxBytes must be a positive safe integer');
  }
  let retained = new Uint8Array(0);
  let observedBytes = 0;
  const drain = stream.pipeTo(
    new WritableStream<Uint8Array>({
      write(chunk) {
        observedBytes += chunk.byteLength;
        if (chunk.byteLength >= maxBytes) {
          retained = chunk.slice(chunk.byteLength - maxBytes);
          return;
        }
        const keepFromRetained = Math.min(retained.byteLength, maxBytes - chunk.byteLength);
        const next = new Uint8Array(keepFromRetained + chunk.byteLength);
        next.set(retained.subarray(retained.byteLength - keepFromRetained));
        next.set(chunk, keepFromRetained);
        retained = next;
      },
    }),
  );
  return {
    drain,
    text() {
      const tail = new TextDecoder().decode(retained);
      return observedBytes > maxBytes ? `[truncated to final ${maxBytes} bytes]\n${tail}` : tail;
    },
  };
}

/** Return a DevTools target or surface an early browser exit with bounded diagnostics. */
export async function awaitBrowserStartup<TTarget>(
  selection: BrowserExecutableSelection,
  target: Promise<TTarget>,
  status: Promise<Deno.CommandStatus>,
  stderr: BoundedTextCapture,
): Promise<TTarget> {
  const result = await Promise.race([
    target.then(
      (value) => ({ kind: 'target' as const, value }),
      (error) => ({ kind: 'target-error' as const, error }),
    ),
    status.then((value) => ({ kind: 'status' as const, value })),
  ]);

  if (result.kind === 'target') return result.value;
  if (result.kind === 'target-error') {
    throw new Error(
      `${selectionLabel(selection)} did not expose a DevTools target: ${
        errorMessage(result.error)
      }`,
      { cause: result.error },
    );
  }

  await stderr.drain;
  throw new Error(
    `${selectionLabel(selection)} exited before exposing a DevTools target: ` +
      `code ${result.value.code}, signal ${result.value.signal ?? 'none'}; ` +
      `stderr: ${stderr.text() || '<empty>'}`,
  );
}

/** Terminate the browser child while preserving unrelated cleanup failures. */
export async function terminateBrowserProcess(
  child: Pick<Deno.ChildProcess, 'kill' | 'status'>,
  drain: Promise<void>,
): Promise<Deno.CommandStatus> {
  try {
    child.kill('SIGTERM');
  } catch (error) {
    const alreadyTerminated = error instanceof TypeError &&
      error.message === ALREADY_TERMINATED_CHILD_MESSAGE;
    if (!alreadyTerminated) throw error;
  }
  const status = await child.status;
  await drain;
  return status;
}

/** Wait until at least one request is complete and the completed count remains quiet. */
export async function waitForCompletedStableBaseline(
  observe: () => RequestCompletionCounts,
  options: StableBaselineOptions = {},
): Promise<number> {
  const confirmationMs = options.confirmationMs ?? BASELINE_CONFIRMATION_MS;
  const pollMs = options.pollMs ?? BASELINE_POLL_MS;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? delay;
  const started = now();
  let candidateCount: number | undefined;
  let stableSince: number | undefined;

  while (now() - started < timeoutMs) {
    const { requestCount, completedCount } = observe();
    const allObservedRequestsCompleted = requestCount > 0 && completedCount === requestCount;
    if (!allObservedRequestsCompleted) {
      candidateCount = undefined;
      stableSince = undefined;
    } else if (candidateCount !== requestCount) {
      candidateCount = requestCount;
      stableSince = now();
    } else if (stableSince !== undefined && now() - stableSince >= confirmationMs) {
      return requestCount;
    }
    await sleep(pollMs);
  }

  throw new Error(
    'timed out waiting for a completed users.list baseline to remain stable',
  );
}

function rowNameExpression(): string {
  return `(() => {
    const button = [...document.querySelectorAll('button')].find((entry) => entry.textContent?.trim() === 'Rename');
    return button?.closest('li')?.querySelector('p')?.textContent?.trim();
  })()`;
}

const QUERY_CLIENT_DISCOVERY_SOURCE = `
  const findQueryClient = () => {
    const seen = new WeakSet();
    const queue = [];
    for (const element of document.querySelectorAll('*')) {
      for (const key of Object.getOwnPropertyNames(element)) {
        if (key.startsWith('__') || key.toLowerCase().includes('preact')) {
          let value;
          try { value = element[key]; } catch { continue; }
          queue.push({ value, path: element.tagName.toLowerCase() + '.' + key, depth: 0 });
        }
      }
    }
    let visited = 0;
    while (queue.length > 0 && visited < 5000) {
      const entry = queue.shift();
      const value = entry.value;
      if ((typeof value !== 'object' && typeof value !== 'function') || value === null) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      visited += 1;
      if (
        typeof value.getQueryCache === 'function' &&
        typeof value.getQueryData === 'function' &&
        typeof value.getQueryState === 'function'
      ) return { client: value, path: entry.path };
      if (entry.depth >= 12 || value instanceof Node) continue;
      let descriptors;
      try { descriptors = Object.getOwnPropertyDescriptors(value); } catch { continue; }
      for (const [key, descriptor] of Object.entries(descriptors).slice(0, 80)) {
        if (!('value' in descriptor)) continue;
        queue.push({ value: descriptor.value, path: entry.path + '.' + key, depth: entry.depth + 1 });
      }
    }
    return { client: null, path: null };
  };
`;

function installOptimisticInstrumentationExpression(): string {
  return `(() => {
    ${QUERY_CLIENT_DISCOVERY_SOURCE}
    const discovery = findQueryClient();
    const state = {
      queryClient: discovery.client,
      queryClientPath: discovery.path,
      cacheEvents: [],
    };
    globalThis.__netscriptOptimisticRenderDiagnostics = state;
    if (discovery.client) {
      discovery.client.getQueryCache().subscribe((event) => {
        const query = event?.query;
        if (!query || !Array.isArray(query.queryKey)) return;
        if (query.queryKey[0] !== 'users' || query.queryKey[1] !== 'list') return;
        const data = query.state?.data;
        state.cacheEvents.push({
          type: event.type ?? null,
          queryKey: query.queryKey,
          data,
          dataUpdatedAt: query.state?.dataUpdatedAt ?? null,
        });
        if (state.cacheEvents.length > 20) state.cacheEvents.shift();
      });
    }
    return { queryClientFound: discovery.client !== null, queryClientPath: discovery.path };
  })()`;
}

function optimisticDiagnosticsExpression(
  renamedName: string | undefined,
  interactionObserved: boolean,
): string {
  return `(() => {
    ${QUERY_CLIENT_DISCOVERY_SOURCE}
    const button = [...document.querySelectorAll('button')].find((entry) => entry.textContent?.trim() === 'Rename');
    const row = button?.closest('li') ?? null;
    const state = globalThis.__netscriptOptimisticRenderDiagnostics;
    const discovery = state?.queryClient
      ? { client: state.queryClient, path: state.queryClientPath }
      : findQueryClient();
    const queries = discovery.client?.getQueryCache().getAll() ?? [];
    const listQuery = queries.find((query) =>
      Array.isArray(query.queryKey) && query.queryKey[0] === 'users' && query.queryKey[1] === 'list'
    );
    const cacheEvents = state?.cacheEvents ?? [];
    const renamedName = ${renamedName === undefined ? 'null' : JSON.stringify(renamedName)};
    const onMutateRan = renamedName !== null && cacheEvents.some((event) => {
      const records = event?.data?.data;
      return Array.isArray(records) && records.some((record) => record?.name === renamedName);
    });
    const mutationMessage = document.querySelector('[data-mutation-state]');
    const list = row?.closest('ul[data-state]') ?? document.querySelector('ul[data-state]');
    const interactionObserved = ${JSON.stringify(interactionObserved)};
    const freshIslandElement = list
      ? list.tagName.toLowerCase() + '[data-state="' + (list.getAttribute('data-state') ?? '') + '"]'
      : null;
    const islandHydrated = interactionObserved || discovery.client !== null;
    return {
      renderedRowText: row?.querySelector('p')?.textContent?.trim() ?? null,
      mutationState: mutationMessage?.getAttribute('data-mutation-state') ?? null,
      renderState: list?.getAttribute('data-state') ?? null,
      islandHydrated,
      islandInteractive: interactionObserved,
      hydrationEvidence: interactionObserved
        ? 'Rename click produced a paused users.update response in CDP'
        : discovery.client !== null
        ? 'Browser QueryClient was reachable from the hydrated Preact tree, but Rename was not rendered'
        : list !== null
        ? 'Fresh island list markup rendered, but no QueryClient or interactive Rename control was discoverable'
        : 'No browser QueryClient or interactive Rename control was discoverable after Page.loadEventFired',
      freshIslandElement,
      queryClientFound: discovery.client !== null,
      queryClientPath: discovery.path,
      listQueryKey: listQuery?.queryKey ?? null,
      listCacheData: listQuery?.state?.data ?? null,
      listDataUpdatedAt: listQuery?.state?.dataUpdatedAt ?? null,
      cacheEvents,
      onMutateRan,
      finalUrl: document.location.href,
      documentTitle: document.title,
      bodyHtmlSnippet: document.body?.innerHTML.slice(0, ${PAGE_BODY_HTML_LIMIT}) ?? null,
    };
  })()`;
}

async function captureOptimisticRenderDiagnostics(
  client: CdpClient,
  renamedName: string | undefined,
  instrumentation: BrowserInstrumentationInstall | undefined,
  interactionObserved: boolean,
  pageEvents: BrowserPageEventEvidence,
): Promise<OptimisticRenderDiagnostics> {
  try {
    const diagnostics = await evaluate<OptimisticRenderDiagnostics>(
      client,
      optimisticDiagnosticsExpression(renamedName, interactionObserved),
    );
    if (diagnostics) {
      return {
        ...diagnostics,
        documentHttpStatus: pageEvents.documentHttpStatus,
        consoleErrors: pageEvents.consoleErrors,
        failedNetworkRequests: pageEvents.failedNetworkRequests,
      };
    }
    throw new Error('browser diagnostics returned no value');
  } catch (error) {
    return {
      renderedRowText: null,
      mutationState: null,
      renderState: null,
      islandHydrated: instrumentation?.queryClientFound ?? false,
      islandInteractive: interactionObserved,
      hydrationEvidence: interactionObserved
        ? 'Rename click produced a paused users.update response in CDP'
        : 'Initial Rename row was not rendered; diagnostic snapshot capture failed',
      freshIslandElement: null,
      queryClientFound: instrumentation?.queryClientFound ?? false,
      queryClientPath: instrumentation?.queryClientPath ?? null,
      listQueryKey: null,
      listCacheData: null,
      listDataUpdatedAt: null,
      cacheEvents: [],
      onMutateRan: false,
      finalUrl: pageEvents.documentUrl,
      documentHttpStatus: pageEvents.documentHttpStatus,
      documentTitle: null,
      bodyHtmlSnippet: null,
      consoleErrors: pageEvents.consoleErrors,
      failedNetworkRequests: pageEvents.failedNetworkRequests,
      captureError: errorMessage(error),
    };
  }
}

function diagnosticsError(
  message: string,
  diagnostics: OptimisticRenderDiagnostics,
  cause: unknown,
): Error {
  return new Error(
    `${message}\n${OPTIMISTIC_DIAGNOSTICS_MARKER}${JSON.stringify(diagnostics)}`,
    { cause },
  );
}

function rowContainsExpression(name: string): string {
  return `(() => {
    const button = [...document.querySelectorAll('button')].find((entry) => entry.textContent?.trim() === 'Rename');
    return button?.closest('li')?.querySelector('p')?.textContent?.trim() === ${
    JSON.stringify(name)
  };
  })()`;
}

function clickRenameExpression(): string {
  return `(() => {
    const button = [...document.querySelectorAll('button')].find((entry) => entry.textContent?.trim() === 'Rename');
    if (!button) throw new Error('Rename control was not rendered');
    button.click();
    return true;
  })()`;
}

function clickRefreshExpression(): string {
  return `(() => {
    const button = [...document.querySelectorAll('button')].find((entry) => entry.textContent?.trim().startsWith('Refresh'));
    if (!button) throw new Error('Refresh control was not rendered');
    button.click();
    return true;
  })()`;
}

async function evaluate<T>(client: CdpClient, expression: string): Promise<T | undefined> {
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  }) as {
    result?: { value?: T };
    exceptionDetails?: { text?: string };
  };
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'browser expression failed');
  }
  return result.result?.value;
}

async function waitForExpression<T>(
  client: CdpClient,
  expression: string,
  predicate: (value: T) => boolean = (value) => value !== undefined && value !== null,
): Promise<T> {
  let observed: T | undefined;
  await waitUntil(async () => {
    observed = await evaluate<T>(client, expression);
    return observed !== undefined && predicate(observed);
  }, `browser expression ${expression}`);
  return observed as T;
}

async function waitUntil(check: () => boolean | Promise<boolean>, label: string): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < TIMEOUT_MS) {
    if (await check()) return;
    await delay(50);
  }
  throw new Error(`timed out waiting for ${label}`);
}

function isRpcPath(url: string | undefined, path: string): boolean {
  if (!url) return false;
  try {
    return new URL(url).pathname.includes(path);
  } catch {
    return false;
  }
}

interface DebugTarget {
  readonly webSocketDebuggerUrl: string;
}

async function waitForDebugTarget(port: number): Promise<DebugTarget> {
  let target: DebugTarget | undefined;
  await waitUntil(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json() as DebugTarget[];
      target = targets.find((entry) => typeof entry.webSocketDebuggerUrl === 'string');
      return target !== undefined;
    } catch {
      return false;
    }
  }, 'Chrome DevTools target');
  return target as DebugTarget;
}

function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  return port;
}

function selectionLabel(selection: BrowserExecutableSelection): string {
  return `browser executable selected from ${selection.source} at ${
    JSON.stringify(selection.path)
  }`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
