/** Explicit mounted-browser gate; see README.md for the checked-in npm/Chromium prerequisites. */
import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { createFixture, repository } from '../fixture.ts';

Deno.test('mounted Northwind chat: empty catch-up, first turns, reopen and native replay', async () => {
  const fixture = await createFixture();
  let server: Deno.ChildProcess | undefined;
  try {
    const baseline = Deno.env.get('SHOWCASE_AI_BROWSER_SOURCE_REF');
    if (baseline) {
      if (!/^[a-f0-9]{40}$/.test(baseline)) {
        throw new Error('Browser baseline must be an immutable Git hash');
      }
      const source = await new Deno.Command('git', {
        args: [
          'show',
          `${baseline}:packages/cli/src/kernel/assets/showcase/ai/app/NorthwindChat.tsx.template`,
        ],
        cwd: repository,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(source.code, 0, 'Browser baseline source is unavailable');
      await fixture.write(
        'apps/portal/islands/NorthwindChat.tsx',
        new TextDecoder().decode(source.stdout).replaceAll('{{projectName}}', 'northwind')
          .replaceAll('{{appName}}', 'portal'),
      );
    }
    for (
      const [source, destination] of [['entry.tsx', 'browser-entry.tsx'], [
        'server.ts',
        'browser-server.ts',
      ]] as const
    ) {
      await fixture.write(
        destination,
        await Deno.readTextFile(new URL(`./${source}.template`, import.meta.url)),
      );
    }
    await fixture.write(
      'secret-fixture.ts',
      await Deno.readTextFile(new URL('../secret-fixture.ts.template', import.meta.url)),
    );
    const cssFiles = [
      'registry/theme/tokens.css',
      'registry/theme/theme-bridge.css',
      'registry/styles/layouts.css',
      'registry/components/ui/prompt-input.css',
      'registry/components/ui/markdown.css',
      'registry/components/ui/tool-call-card.css',
    ];
    const css = (await Promise.all(cssFiles.map((path) =>
      Deno.readTextFile(join(repository, 'packages/fresh-ui', path))
    ))).join('\n');
    await fixture.write(
      'browser.css',
      css.replace(/@import\s+[^;]+;/g, '') +
        '\nbody{font-family:sans-serif;margin:2rem} .northwind-ai__workspace{display:grid;grid-template-columns:16rem 1fr;gap:2rem}.northwind-ai__threads nav{display:flex;flex-direction:column}.northwind-ai__message{padding:1rem}',
    );
    const bundle = await new Deno.Command(Deno.execPath(), {
      args: [
        'bundle',
        '--no-lock',
        '--config',
        'deno.json',
        '--platform',
        'browser',
        '--output',
        'browser.js',
        'browser-entry.tsx',
      ],
      cwd: fixture.root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(bundle.code, 0, new TextDecoder().decode(bundle.stderr));
    server = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--node-modules-dir=none',
        '--unstable-kv',
        '--allow-all',
        'browser-server.ts',
      ],
      cwd: fixture.root,
      stdout: 'piped',
      stderr: 'null',
    }).spawn();
    const lines = server.stdout.pipeThrough(new TextDecoderStream()).getReader();
    const deadline = AbortSignal.timeout(20_000);
    let pending = '';
    let origin = '';
    while (!origin) {
      const next = await Promise.race([
        lines.read(),
        new Promise<never>((_, reject) =>
          deadline.addEventListener(
            'abort',
            () =>
              reject(new Error('Browser fixture did not start')),
            { once: true },
          )
        ),
      ]);
      if (next.done) throw new Error('Browser fixture exited before readiness');
      pending += next.value;
      const marker = /SHOWCASE_BROWSER_READY (\{[^\n]+\})/.exec(pending);
      if (marker) origin = JSON.parse(marker[1]).origin;
    }
    // Drain native output privately; no request/credential logs enter the public report.
    void (async () => {
      while (!(await lines.read()).done) { /* drain */ }
    })();
    const output = Deno.env.get('SHOWCASE_AI_BROWSER_OUTPUT') ??
      join(fixture.root, 'browser-artifacts');
    const result = await new Deno.Command('node', {
      args: [
        join(repository, 'packages/cli/tests/showcase-ai/browser/run.mjs'),
        origin,
        output,
        join(repository, 'tools/fresh-ui-browser'),
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  } finally {
    if (server) {
      server.kill('SIGTERM');
      await server.status;
    }
    await fixture.close();
  }
});
