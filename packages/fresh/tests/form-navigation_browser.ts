import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

const PLAYWRIGHT_SESSION = 'netscript-fresh-form-navigation';
const FIXTURE_ROOT = fromFileUrl(
  new URL('./fixtures/form-navigation-browser/', import.meta.url),
);

Deno.test({
  name: 'browser: document form redirect beats inherited body client nav without runtime errors',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const port = reservePort();
    const url = `http://127.0.0.1:${port}/`;
    const playwrightOutput = await Deno.makeTempDir({ prefix: 'netscript-form-browser-' });
    const vite = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '-A',
        'npm:vite@7.2.2',
        '--config',
        'vite.config.ts',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      cwd: FIXTURE_ROOT,
      stdout: 'null',
      stderr: 'null',
    }).spawn();

    try {
      await waitForServer(url, vite);
      await runPlaywright(['-s', PLAYWRIGHT_SESSION, 'open', url], playwrightOutput);
      const result = await runPlaywright([
        '--raw',
        '-s',
        PLAYWRIGHT_SESSION,
        'run-code',
        `async page => {
          const runtimeErrors = [];
          page.on('pageerror', error => runtimeErrors.push(String(error)));
          page.on('console', message => {
            if (message.type() === 'error') runtimeErrors.push(message.text());
          });
          await page.goto(${JSON.stringify(url)});
          await page.waitForFunction(() => history.state?.fClientNav === true);

          const documentForm = page.locator('#document-form');
          const clientForm = page.locator('#client-form');
          const documentAttr = await documentForm.getAttribute('f-client-nav');
          const clientAttr = await clientForm.getAttribute('f-client-nav');

          await page.evaluate(() => globalThis.__formNavigationSentinel = 'preserved');
          await page.getByRole('button', { name: 'Validate client' }).click();
          await page.getByRole('alert').waitFor();
          const sentinel = await page.evaluate(() => globalThis.__formNavigationSentinel);

          await page.getByRole('button', { name: 'Create redirect' }).click();
          await page.waitForURL('**/success');
          await page.getByRole('heading', { name: 'Redirect completed' }).waitFor();

          return {
            documentAttr,
            clientAttr,
            sentinel,
            runtimeErrors,
            finalUrl: page.url(),
          };
        }`,
      ], playwrightOutput);
      const evidence = JSON.parse(result.trim()) as {
        readonly documentAttr: string | null;
        readonly clientAttr: string | null;
        readonly sentinel: string | null;
        readonly runtimeErrors: readonly string[];
        readonly finalUrl: string;
      };

      assertEquals(evidence.documentAttr, 'false');
      assertEquals(evidence.clientAttr, null);
      assertEquals(evidence.sentinel, 'preserved');
      assertEquals(evidence.runtimeErrors, []);
      assertEquals(evidence.finalUrl, `http://127.0.0.1:${port}/success`);
    } finally {
      await runPlaywright(['-s', PLAYWRIGHT_SESSION, 'close'], playwrightOutput, false);
      try {
        vite.kill('SIGTERM');
      } catch {
        // The fixture process already stopped; cleanup can continue.
      }
      await vite.status;
      await Deno.remove(playwrightOutput, { recursive: true });
    }
  },
});

async function runPlaywright(
  args: readonly string[],
  cwd: string,
  check = true,
): Promise<string> {
  const output = await new Deno.Command('playwright-cli', {
    args: [...args],
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);

  if (check && !output.success) {
    throw new Error(
      `playwright-cli ${args.join(' ')} failed (${output.code})\n${stdout}\n${stderr}`,
    );
  }

  return stdout;
}

function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

async function waitForServer(url: string, child: Deno.ChildProcess): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const status = await Promise.race([
      child.status,
      new Promise<undefined>((resolve) => setTimeout(resolve, 50)),
    ]);
    if (status) {
      throw new Error(`Vite browser fixture exited before startup (${status.code})`);
    }

    try {
      const response = await fetch(url);
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The server has not bound its port yet.
    }
  }

  throw new Error('Timed out waiting for the Vite browser fixture');
}
