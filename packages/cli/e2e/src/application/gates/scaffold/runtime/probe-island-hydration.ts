/** Headless-browser acceptance probe for generated route-local island hydration. */

import { dirname } from '@std/path';
import type { IslandHydrationReceipt } from './island-receipts.ts';
import { findBrowserExecutable, resolveProjectAppUrls } from './probe-app-reference.ts';

const ISLAND_PATH = '/examples/users';
const TIMEOUT_MS = 20_000;

export interface IslandInteractionObservation {
  readonly initialRow: string | null;
  readonly rowAfterRename: string | null;
  readonly dataState: string | null;
  readonly freshIslandElement: string | null;
}

export interface ProbeIslandHydrationOptions {
  readonly resolveLiveUrls?: (appHost: string, appName: string) => Promise<string[]>;
  readonly interact?: (url: string) => Promise<IslandInteractionObservation>;
  readonly persist?: (receipt: IslandHydrationReceipt) => Promise<void>;
  readonly receiptPath?: string;
}

/** Convert browser observations into the strict hydration receipt. */
export function receiptFromIslandInteraction(
  observation: IslandInteractionObservation,
): IslandHydrationReceipt {
  if (!observation.dataState || !observation.freshIslandElement) {
    throw new Error('generated island data-state element was not rendered');
  }
  if (!observation.initialRow) throw new Error('generated island rendered no Rename row');
  const expected = `${observation.initialRow}*`;
  if (observation.rowAfterRename !== expected) {
    throw new Error(
      `Rename click did not change ${JSON.stringify(observation.initialRow)} to ${
        JSON.stringify(expected)
      }; observed ${JSON.stringify(observation.rowAfterRename)}`,
    );
  }
  return { islandHydrated: true, freshIslandElement: observation.freshIslandElement };
}

/** Resolve the live generated app and prove its scaffold data island is interactive. */
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

async function interactWithHeadlessChrome(url: string): Promise<IslandInteractionObservation> {
  const executable = await findBrowserExecutable();
  const port = reservePort();
  const profile = await Deno.makeTempDir({ prefix: 'netscript-island-hydration-' });
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
    await client.send('Page.navigate', { url });
    await client.waitFor('Page.loadEventFired');

    const initial = await waitForEvaluation<IslandInteractionObservation>(
      client,
      islandObservationExpression(),
      (value) => value?.initialRow !== null && value?.freshIslandElement !== null,
    );
    await client.evaluate(clickRenameExpression());
    const renamed = await waitForEvaluation<IslandInteractionObservation>(
      client,
      islandObservationExpression(),
      (value) => value?.rowAfterRename === `${initial.initialRow}*`,
    );
    return { ...renamed, initialRow: initial.initialRow };
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
    if (message.method) this.#events.push({ method: message.method, params: message.params ?? {} });
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
  while (Date.now() - started < TIMEOUT_MS) {
    const value = await client.evaluate<T>(expression);
    if (predicate(value)) return value as T;
    await delay(50);
  }
  throw new Error('timed out waiting for generated island DOM state');
}

function islandObservationExpression(): string {
  return `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Rename');
    const row = button?.closest('li') ?? null;
    const surface = row?.closest('ul[data-state]') ?? null;
    const dataState = surface?.getAttribute('data-state') ?? null;
    const name = row?.querySelector('p')?.textContent?.trim() ?? null;
    return {
      initialRow: name,
      rowAfterRename: name,
      dataState,
      freshIslandElement: surface && dataState
        ? surface.tagName.toLowerCase() + '[data-state="' + dataState + '"]'
        : null,
    };
  })()`;
}

function clickRenameExpression(): string {
  return `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((entry) => entry.textContent?.trim() === 'Rename');
    if (!button) throw new Error('Rename control was not rendered');
    button.click();
    return true;
  })()`;
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
