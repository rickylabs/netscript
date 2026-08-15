/** Chrome DevTools transport for the live generated service-client probe. */

const LIST_PATH = '/api/rpc/v1/users/list';
const UPDATE_PATH = '/api/rpc/v1/users/update';
const TIMEOUT_MS = 20_000;
const BROWSER_VERSION_TIMEOUT_MS = 5_000;
const BROWSER_OUTPUT_LIMIT_BYTES = 32 * 1024;
const BASELINE_CONFIRMATION_MS = 500;
const BASELINE_POLL_MS = 50;
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

class CdpClient {
  readonly #socket: WebSocket;
  readonly #pending = new Map<
    number,
    { resolve(value: unknown): void; reject(error: Error): void }
  >();
  readonly #events: CdpEvent[] = [];
  readonly #observers: Array<(event: CdpEvent) => void> = [];
  #nextId = 1;

  private constructor(socket: WebSocket) {
    this.#socket = socket;
    socket.onmessage = (message) => this.#receive(String(message.data));
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error(`failed to connect to ${url}`));
    });
    return new CdpClient(socket);
  }

  observe(observer: (event: CdpEvent) => void): void {
    this.#observers.push(observer);
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = this.#nextId++;
    this.#socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.#pending.set(id, { resolve, reject }));
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
    await client.send('Fetch.enable', {
      patterns: [{ urlPattern: `*${UPDATE_PATH}*`, requestStage: 'Response' }],
    });

    const listRequestIds = new Set<string>();
    const completedListIds = new Set<string>();
    client.observe(({ method, params }) => {
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
    const originalName = await waitForExpression<string>(client, rowNameExpression());
    await evaluate(client, clickRefreshExpression());
    const baseline = await waitForCompletedStableBaseline(() => ({
      requestCount: listRequestIds.size,
      completedCount: completedListIds.size,
    }));
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
    const optimistic = await waitForExpression<boolean>(
      client,
      rowContainsExpression(renamedName),
      (value) => value,
    );
    const mutationStatus = paused.responseStatusCode;
    await client.send('Fetch.continueResponse', { requestId: paused.requestId });
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
