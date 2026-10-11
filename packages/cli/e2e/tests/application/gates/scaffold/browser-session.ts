import { delay } from '@std/async';
import { join } from '@std/path';
import {
  awaitBrowserStartup,
  captureBoundedText,
  CdpClient,
  type DebugTarget,
  selectBrowserExecutable,
  selectPageDebugTarget,
  terminateBrowserProcess,
} from '../../../../src/application/gates/scaffold/service-client-browser-probe.ts';

/** One isolated real-browser profile, using the runtime gate's existing CDP transport. */
// A usable Chrome/Chromium is required locally and in CI. An explicit
// NETSCRIPT_E2E_BROWSER_EXECUTABLE is exclusive; missing/broken browsers fail, never skip.
export async function withBrowser(
  probe: (client: CdpClient) => Promise<void>,
): Promise<void> {
  const selection = await selectBrowserExecutable();
  const profile = await Deno.makeTempDir();
  let child: Deno.ChildProcess | undefined;
  let client: CdpClient | undefined;
  let drain = Promise.resolve();
  const startup = new AbortController();
  let discovery: Promise<string> | undefined;
  try {
    child = new Deno.Command(selection.path, {
      args: [
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--remote-debugging-port=0',
        `--user-data-dir=${profile}`,
        'about:blank',
      ],
      stdout: 'null',
      stderr: 'piped',
    }).spawn();
    const stderr = captureBoundedText(child.stderr);
    drain = stderr.drain;
    discovery = findTarget(profile, { signal: startup.signal });
    let target: string;
    try {
      target = await awaitBrowserStartup(selection, discovery, child.status, stderr);
    } catch (error) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)}; ` +
          `browser version: ${selection.version}; stderr tail: ${stderr.text() || '<empty>'}`,
        { cause: error },
      );
    }
    client = await CdpClient.connect(target);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');
    await probe(client);
  } finally {
    startup.abort();
    await discovery?.catch(() => undefined);
    client?.close();
    try {
      if (child) await terminateBrowserProcess(child, drain);
    } finally {
      await Deno.remove(profile, { recursive: true });
    }
  }
}

interface TargetDiscoveryOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly requestTimeoutMs?: number;
}

// Internal test seam: request timeouts are retryable; the unchanged overall budget
// bounds port-file discovery, response headers, response bodies, and retry delays.
export async function findTarget(
  profile: string,
  options: TargetDiscoveryOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([deadline.signal, options.signal])
    : deadline.signal;
  let stage = 'waiting for DevToolsActivePort';
  let attempts = 0;
  let lastFailure = '<none>';
  try {
    while (true) {
      signal.throwIfAborted();
      try {
        stage = 'waiting for DevToolsActivePort';
        const portText =
          (await Deno.readTextFile(join(profile, 'DevToolsActivePort'))).split('\n')[0];
        const port = Number(portText);
        if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1 || port > 65535) {
          lastFailure = 'DevToolsActivePort is incomplete or has an invalid port';
        } else {
          stage = 'requesting /json/list';
          attempts++;
          const request = new AbortController();
          const requestTimer = setTimeout(
            () => request.abort(new DOMException('DevTools request timed out', 'TimeoutError')),
            options.requestTimeoutMs ?? 1000,
          );
          try {
            const response = await fetch(`http://127.0.0.1:${port}/json/list`, {
              signal: AbortSignal.any([signal, request.signal]),
            });
            if (!response.ok) {
              lastFailure = `/json/list returned HTTP ${response.status}`;
              await response.body?.cancel();
            } else {
              const target = selectPageDebugTarget(await response.json() as DebugTarget[]);
              if (target) return target.webSocketDebuggerUrl;
              stage = 'waiting for page target';
              lastFailure = '/json/list has no page target with a WebSocket debugger URL';
            }
          } finally {
            clearTimeout(requestTimer);
          }
        }
      } catch (error) {
        signal.throwIfAborted();
        const transient = error instanceof Deno.errors.NotFound || error instanceof TypeError ||
          error instanceof SyntaxError ||
          (error instanceof DOMException && error.name === 'TimeoutError');
        if (!transient) throw error;
        lastFailure = `${error instanceof Error ? error.name : 'Error'}: ${String(error)}`.slice(
          0,
          300,
        );
      }
      await delay(50, { signal });
    }
  } catch (error) {
    if (options.signal?.aborted) throw options.signal.reason;
    if (!deadline.signal.aborted) throw error;
    throw new Error(
      `DevTools startup deadline exceeded after ${timeoutMs} ms; stage: ${stage}; ` +
        `requests: ${attempts}; last failure: ${lastFailure}. ` +
        'Check browser stderr, executable dependencies, and available CPU/memory.',
      { cause: error },
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Evaluate in the page; exceptions fail the probe instead of becoming missing evidence. */
export async function browserValue<T>(client: CdpClient, expression: string): Promise<T> {
  const result = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }) as { result: { value: T }; exceptionDetails?: { text: string } };
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

/** Wait for the whole navigation, including provider and callback redirects. */
export async function navigate(client: CdpClient, url: string): Promise<void> {
  await client.send('Page.navigate', { url });
  await client.waitFor('Page.loadEventFired');
}
