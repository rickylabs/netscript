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
export async function withBrowser(
  probe: (client: CdpClient) => Promise<void>,
): Promise<void> {
  const selection = await selectBrowserExecutable();
  const profile = await Deno.makeTempDir();
  let child: Deno.ChildProcess | undefined;
  let client: CdpClient | undefined;
  let drain = Promise.resolve();
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
    const target = await awaitBrowserStartup(selection, findTarget(profile), child.status, stderr);
    client = await CdpClient.connect(target);
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');
    await probe(client);
  } finally {
    client?.close();
    try {
      if (child) await terminateBrowserProcess(child, drain);
    } finally {
      await Deno.remove(profile, { recursive: true });
    }
  }
}

async function findTarget(profile: string): Promise<string> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const port = (await Deno.readTextFile(join(profile, 'DevToolsActivePort'))).split('\n')[0];
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(1000),
      });
      const target = selectPageDebugTarget(await response.json() as DebugTarget[]);
      if (target) return target.webSocketDebuggerUrl;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound) && !(error instanceof TypeError)) throw error;
    }
    await delay(50);
  }
  throw new Error('Browser did not expose a page target');
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
