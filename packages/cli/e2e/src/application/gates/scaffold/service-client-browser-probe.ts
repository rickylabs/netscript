/** Chrome DevTools transport for the live generated service-client probe. */

const LIST_PATH = '/api/rpc/v1/users/list';
const UPDATE_PATH = '/api/rpc/v1/users/update';
const TIMEOUT_MS = 20_000;

export interface SettledRefetchEvidence {
  readonly baselineListRequestCount: number;
  readonly finalListRequestCount: number;
  readonly mutationSucceeded: boolean;
  readonly optimisticRowContainedRenamedName: boolean;
  readonly finalRowContainedRenamedName: boolean;
  readonly renamedName: string;
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
  const executable = await findBrowserExecutable();
  const port = reservePort();
  const profile = await Deno.makeTempDir({ prefix: 'netscript-service-client-cdp-' });
  const child = new Deno.Command(executable, {
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
  const drain = child.stderr.pipeTo(new WritableStream({ write: () => undefined })).catch(() => {});
  let client: CdpClient | undefined;
  try {
    const target = await waitForDebugTarget(port);
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
    await delay(750);
    const baseline = listRequestIds.size;
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
    const status = paused.responseStatusCode;
    await client.send('Fetch.continueRequest', { requestId: paused.requestId });
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
      mutationSucceeded: typeof status === 'number' && status >= 200 && status < 300,
      optimisticRowContainedRenamedName: optimistic,
      finalRowContainedRenamedName: finalRow,
      renamedName,
    };
  } finally {
    client?.close();
    child.kill('SIGTERM');
    await child.status.catch(() => undefined);
    await drain;
    await Deno.remove(profile, { recursive: true }).catch(() => undefined);
  }
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

async function findBrowserExecutable(): Promise<string> {
  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  for (const candidate of candidates) {
    try {
      if ((await Deno.stat(candidate)).isFile) return candidate;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  throw new Error(`no supported Chrome/Chromium executable found: ${candidates.join(', ')}`);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
