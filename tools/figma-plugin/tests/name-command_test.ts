import { assertEquals, assertStringIncludes } from '@std/assert';
import { collections } from '../../../packages/fresh-ui/src/tokens/assets/figma.generated.ts';
import { exportFigmaTokenBundle } from '../../../packages/fresh-ui/src/tokens/adapters/figma/figma-round-trip.ts';

Deno.test('CI name command checks actual exported files and rejects unknown WEB names with origin', async () => {
  const file = await Deno.makeTempFile({ suffix: '.json' });
  const run = async (args: string[]) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--frozen',
        '--allow-read',
        '--allow-env=NODE_ENV',
        'tools/figma-plugin/check-names.ts',
        ...args,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      code: result.code,
      text: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr),
    };
  };
  try {
    const bundle = exportFigmaTokenBundle(collections);
    const item = {
      type: 'registry:theme',
      meta: { netscript: { version: 1, preset: 'studio-utility', figma: bundle } },
    };
    await Deno.writeTextFile(file, JSON.stringify(item));
    const positive = await run(['--theme', file]);
    assertEquals(positive.code, 0, positive.text);
    assertStringIncludes(positive.text, 'pinned variables=2186 portable items=1');
    const unknown = {
      ...bundle,
      collections: bundle.collections.map((collection) =>
        collection.collection === 'Scheme'
          ? {
            ...collection,
            variables: collection.variables.map((variable, index) =>
              index === 0 ? { ...variable, codeSyntax: 'var(--ns-rejected-by-ci)' } : variable
            ),
          }
          : collection
      ),
    };
    await Deno.writeTextFile(
      file,
      JSON.stringify({ ...item, meta: { netscript: { ...item.meta.netscript, figma: unknown } } }),
    );
    const negative = await run(['--theme', file]);
    assertEquals(negative.code, 1);
    assertStringIncludes(negative.text, 'Scheme/accent/border');
    assertStringIncludes(negative.text, 'var(--ns-rejected-by-ci)');
    const control = await run(['--negative-control']);
    assertEquals(control.code, 1);
    assertStringIncludes(
      control.text,
      'Unknown exported token name: Scheme/accent/border (var(--ns-unknown-export))',
    );
  } finally {
    await Deno.remove(file);
  }
});
