import { assert, assertEquals } from '@std/assert';
import { collections } from '../../../packages/fresh-ui/src/tokens/assets/figma.generated.ts';
import { fixtureFigma } from './mock-figma.ts';

Deno.test('production main bundle runs with only the Plugin API and no DOM/decompression globals', async () => {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'tools/figma-plugin/build.ts'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assert(result.success, new TextDecoder().decode(result.stderr));
  const main = await Deno.readTextFile('.llm/tmp/figma-plugin/main.js');
  let onmessage: (message: unknown) => void = () => {};
  const output = Promise.withResolvers<unknown>();
  const host = {
    variables: fixtureFigma(collections),
    fileKey: 'fixture',
    showUI: (_html: string, _options: unknown) => {},
    notify: (_message: string) => {},
    ui: {
      get onmessage() {
        return onmessage;
      },
      set onmessage(value: (message: unknown) => void) {
        onmessage = value;
      },
      postMessage: (message: unknown) => output.resolve(message),
    },
  };
  const execute = new Function(
    '__html__',
    'figma',
    'window',
    'document',
    'Response',
    'Blob',
    'DecompressionStream',
    'atob',
    main,
  );
  execute('<html></html>', host, undefined, undefined, undefined, undefined, undefined, undefined);
  let timer: number | undefined;
  try {
    onmessage({ type: 'export' });
    const value = await Promise.race([
      output.promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Plugin API export timed out')), 2000);
      }),
    ]);
    assert(typeof value === 'object' && value !== null && 'type' in value);
    assertEquals(value.type, 'snapshot');
  } finally {
    clearTimeout(timer);
  }
});
