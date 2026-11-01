import { assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';

const SOURCE = new URL('../../../packages/fresh-ui/tests/publish-size.test.ts', import.meta.url);

/** Exercise the real package budget test with matching authored and embedded fixture bytes. */
async function runBudgetFixture(
  checkoutName: string,
  options: { stale?: boolean; extraSource?: boolean; oversized?: boolean } = {},
): Promise<{ code: number; output: string }> {
  const temporary = await Deno.makeTempDir({ prefix: 'css-budget-location-' });
  try {
    const root = join(temporary, checkoutName, 'checkout');
    await Deno.mkdir(join(root, 'tests'), { recursive: true });
    await Deno.mkdir(join(root, 'registry/components/ui'), { recursive: true });
    await Deno.mkdir(join(root, 'registry/theme/presets'), { recursive: true });
    const source = options.oversized
      ? Array.from({ length: 6000 }, (_, i) => `.sample-${i}{--id:${i * 7919};padding:${i}px}\n`)
        .join('')
      : '.sample{color:red}\n';
    const theme = '/*' + 'theme bytes excluded '.repeat(20_000) + '*/';
    await Deno.writeTextFile(join(root, 'registry/components/ui/sample.css'), source);
    await Deno.writeTextFile(join(root, 'registry/theme/presets/ignored.css'), theme);
    if (options.extraSource) {
      await Deno.writeTextFile(join(root, 'registry/components/ui/unshipped.css'), '.unshipped{}');
    }
    await Deno.writeTextFile(
      join(root, 'tests/publish-size.test.ts'),
      await Deno.readTextFile(SOURCE),
    );
    await Deno.writeTextFile(
      join(root, 'registry.generated.ts'),
      'export const FRESH_UI_REGISTRY_CONTENT: Record<string,string> = ' + JSON.stringify({
        'registry/components/ui/sample.css': options.stale ? '.old{}' : source,
        'registry/theme/presets/ignored.css': theme,
      }) + ';\n',
    );
    // Independent config avoids inherited scratch exclusions; dependencies match the real test.
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        imports: { '@std/assert': 'jsr:@std/assert@^1', '@std/path': 'jsr:@std/path@1' },
      }),
    );
    const child = await new Deno.Command(Deno.execPath(), {
      args: [
        'test',
        '--allow-read',
        '--no-lock',
        '--config',
        join(root, 'deno.json'),
        '--filter',
        'shipped component CSS',
        join(root, 'tests/publish-size.test.ts'),
      ],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      code: child.code,
      output: new TextDecoder().decode(child.stdout) + new TextDecoder().decode(child.stderr),
    };
  } finally {
    await Deno.remove(temporary, { recursive: true });
  }
}

Deno.test('CSS inventory is independent of a checkout ancestor named theme', async () => {
  for (const checkout of ['ordinary', 'theme']) {
    const result = await runBudgetFixture(checkout);
    assertEquals(result.code, 0, result.output);
    assertStringIncludes(result.output, '"files":1');
  }
});

Deno.test('theme-named checkout still rejects stale and unshipped component CSS', async () => {
  for (const options of [{ stale: true }, { extraSource: true }]) {
    const result = await runBudgetFixture('theme', options);
    assertEquals(result.code, 1, result.output);
    assertStringIncludes(
      result.output,
      options.stale ? 'Stale shipped CSS' : 'Budget must cover every',
    );
  }
});

Deno.test('planned growth ceiling still rejects excessive raw and gzip bytes independently', async () => {
  const result = await runBudgetFixture('theme', { oversized: true });
  assertEquals(result.code, 1, result.output);
  assertStringIncludes(result.output, 'Component CSS raw payload');
  assertStringIncludes(result.output, 'Component CSS gzip payload');
});
