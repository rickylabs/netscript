/**
 * @module templates/aspire/helpers/installation-secret-sdk-compile_test
 *
 * Compile the emitted credential carrier against unmodified, restored Aspire SDK files.
 * The gzip fixture contains aspire.mts, base.mts and transport.mts from `aspire restore`
 * in a CLI scaffold: SDK/PostgreSQL/Redis 13.5.3 and the scaffold's pinned Browsers package.
 * It is the complete generated surface, rather than a handwritten builder declaration.
 */

import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { join } from '@std/path';
import { readTemplateAssetSync } from '../../../../adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';

const SDK_FILES = ['aspire.mts', 'base.mts', 'transport.mts'] as const;
const CHECK_FILES = [...SDK_FILES, 'installation-secret.mts', 'proof.mts'];

function assertChecked(code: number, diagnostics: string): void {
  assertEquals(code, 0, diagnostics);
  for (const file of CHECK_FILES) {
    assert(
      diagnostics.split('\n').some((line) => line.startsWith('Check ') && line.endsWith(file)),
      `Deno must report checking ${file}; a successful empty selection is not proof`,
    );
  }
}

async function restoreRecordedSdk(root: string): Promise<void> {
  const compressed = await Deno.readFile(
    new URL('./fixtures/aspire-sdk-13.5.3.json.gz', import.meta.url),
  );
  const text = await new Response(
    new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),
  ).text();
  const source: unknown = JSON.parse(text);
  if (
    !source || typeof source !== 'object' ||
    !('aspire.mts' in source) || typeof source['aspire.mts'] !== 'string' ||
    !('base.mts' in source) || typeof source['base.mts'] !== 'string' ||
    !('transport.mts' in source) || typeof source['transport.mts'] !== 'string'
  ) throw new Error('Recorded Aspire SDK must contain all three complete generated modules.');
  const modules = {
    'aspire.mts': source['aspire.mts'],
    'base.mts': source['base.mts'],
    'transport.mts': source['transport.mts'],
  };
  for (const file of SDK_FILES) await Deno.writeTextFile(join(root, file), modules[file]);
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    JSON.stringify({
      imports: {
        './transport.mjs': './transport.mts',
        './base.mjs': './base.mts',
        net: 'node:net',
        'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
      },
    }),
  );
}

async function check(root: string): Promise<{ code: number; diagnostics: string }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['check', '--no-lock', '--config', 'deno.json', ...CHECK_FILES],
    cwd: root,
    env: { NO_COLOR: '1' },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    diagnostics: new TextDecoder().decode(output.stdout) + new TextDecoder().decode(output.stderr),
  };
}

Deno.test('emitted installation helper accepts the real Aspire SDK builder and rejects a native-Promise regression', async () => {
  const root = await Deno.makeTempDir({ prefix: 'installation-sdk-compile-' });
  try {
    await restoreRecordedSdk(root);
    const source = readTemplateAssetSync(TEMPLATE_KEYS.aspireHelpersInstallationSecret);
    const helper = join(root, 'installation-secret.mts');
    await Deno.writeTextFile(helper, source);
    await Deno.writeTextFile(
      join(root, 'proof.mts'),
      `import type { DistributedApplicationBuilder } from './aspire.mts';
import { registerInstallationSecret } from './installation-secret.mts';
export function provision(builder: DistributedApplicationBuilder) {
  return registerInstallationSecret(builder, '.');
}
`,
    );
    const positive = await check(root);
    assertChecked(positive.code, positive.diagnostics);

    const regression = source.replace('PromiseLike<unknown>', 'Promise<unknown>');
    assert(source !== regression, 'the negative control must change the helper contract');
    await Deno.writeTextFile(helper, regression);
    const negative = await check(root);
    assert(negative.code !== 0, 'the real SDK must reject the previous native-Promise contract');
    assertStringIncludes(negative.diagnostics, 'TS2345');
    assertStringIncludes(negative.diagnostics, 'ParameterResourcePromise');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('installation SDK compile proof fails closed when the checker selected no files', () => {
  assertThrows(() => assertChecked(0, 'No matching files found.'));
  assertThrows(() => assertChecked(0, 'Check proof.mts\n'));
});
