import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { toFileUrl } from 'jsr:@std/path@1/to-file-url';
import { createContext, runInContext } from 'node:vm';
import { z } from 'npm:zod@^4.6.5';
import { buildComponentLibraryPlugin } from '../build.ts';
import { defaultLibraryInput } from '../src/default-sources.ts';
import { generateLibrary } from '../src/generate.ts';
import { serializeLibrary } from '../src/validate-library.ts';
import type { ComponentPluginHost } from '../plugin/main.ts';
import { MockFigma } from './mock-figma.ts';

Deno.test('separate bundled sandbox runs without browser globals and validates native operations through iframe hashing', async () => {
  const temp = await Deno.makeTempDir();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  try {
    const output = toFileUrl(`${temp}/`);
    await buildComponentLibraryPlugin(output);
    const manifest = JSON.parse(await Deno.readTextFile(new URL('manifest.json', output)));
    assertEquals(manifest.main, 'main.js');
    assertEquals(manifest.networkAccess.allowedDomains, ['none']);
    const html = await Deno.readTextFile(new URL('ui.html', output));
    assert(html.includes('<script type="module">'));
    assert(!html.includes('<!-- SCRIPT -->'));
    const sources = defaultLibraryInput();
    const api = new MockFigma(sources.collections);
    let outcome: ReturnType<typeof Promise.withResolvers<unknown>> | undefined;
    const ui: ComponentPluginHost['ui'] = {
      onmessage: undefined,
      postMessage: (input) => {
        const message = z.object({ type: z.string() }).passthrough().parse(input);
        if (message.type === 'digest-request') {
          const request = z.object({ request: z.number(), text: z.string() }).parse(message);
          void crypto.subtle.digest('SHA-256', new TextEncoder().encode(request.text)).then(
            (result) => {
              const hash = [...new Uint8Array(result)].map((v) => v.toString(16).padStart(2, '0'))
                .join('');
              ui.onmessage?.({ type: 'digest-result', request: request.request, hash });
            },
          ).catch((error) => outcome?.reject(error));
        } else if (message.type === 'error') {
          outcome?.reject(new Error(z.string().parse(message.message)));
        } else if (message.type === 'result') outcome?.resolve(message);
      },
    };
    let shown = false;
    const host: ComponentPluginHost = Object.assign(api, {
      ui,
      showUI: () => {
        shown = true;
      },
    });
    const sandbox = createContext({
      figma: host,
      __html__: html,
      console,
      setTimeout: (callback: () => void, ms: number) => {
        const timer = setTimeout(callback, ms);
        timers.add(timer);
        return timer;
      },
      clearTimeout: (timer: ReturnType<typeof setTimeout>) => {
        timers.delete(timer);
        clearTimeout(timer);
      },
    });
    assertEquals(
      JSON.stringify(runInContext(
        '[typeof crypto, typeof TextEncoder, typeof Blob, typeof Response, typeof DecompressionStream, typeof AbortController]',
        sandbox,
      )),
      JSON.stringify([
        'undefined',
        'undefined',
        'undefined',
        'undefined',
        'undefined',
        'undefined',
      ]),
    );
    runInContext(await Deno.readTextFile(new URL('main.js', output)), sandbox);
    assert(shown);
    const send = (input: unknown): Promise<unknown> => {
      outcome = Promise.withResolvers<unknown>();
      ui.onmessage?.(input);
      return outcome.promise;
    };
    await assertRejects(
      () => send({ type: 'import', bundle: {}, fileKey: api.fileKey }),
      Error,
      'coverage',
    );
    assertEquals(api.mutations, 0);
    const bundle = generateLibrary(sources, { items: ['button'] });
    const imported = z.object({
      type: z.literal('result'),
      bundle: z.unknown(),
      receipt: z.object({
        provenance: z.literal('figma-editor'),
        components: z.array(
          z.object({ item: z.string(), registryItem: z.string(), nodeId: z.string() }),
        ),
      }).passthrough(),
    }).passthrough().parse(await send({ type: 'import', bundle, fileKey: api.fileKey }));
    assertEquals(imported.receipt.components.map((c) => [c.item, c.registryItem]), [[
      'button',
      'button',
    ]]);
    const count = api.mutations;
    const exported = z.object({ receipt: z.unknown() }).passthrough().parse(
      await send({ type: 'export', bundle, fileKey: api.fileKey }),
    );
    assertEquals(serializeLibrary(exported.receipt), serializeLibrary(imported.receipt));
    assertEquals(api.mutations, count);
    assertEquals(timers.size, 0);
    // This is an isolated compatibility test over a fake host, never live Figma evidence.
  } finally {
    for (const timer of timers) clearTimeout(timer);
    await Deno.remove(temp, { recursive: true });
  }
});
