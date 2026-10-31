import { FRESH_UI_RUNTIME_DEPENDENCY, POST_V1_COMPONENTS } from './post-v1-items.ts';
import { freshUiRegistryManifest } from '../../registry.manifest.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join, toFileUrl } from '@std/path';

const repo = fromFileUrl(new URL('../../../../', import.meta.url));

Deno.test('Phase-two registry gaps preserve installed source and consumer APIs', async () => {
  const names = freshUiRegistryManifest.items.filter((item) =>
    item.kind === 'component' && item.tags.includes('contract')
  ).map((item) => item.name);
  assertEquals(
    [...names].sort(),
    [...POST_V1_COMPONENTS].sort(),
    'Every reviewed gap must be exercised; an empty projection cannot pass.',
  );
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-gaps-' });
  const run = async (cwd: string, args: string[]) => {
    const result = await new Deno.Command(Deno.execPath(), {
      cwd,
      args,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
    return new TextDecoder().decode(result.stdout);
  };
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        catalog: JSON.parse(await Deno.readTextFile(join(repo, 'deno.json'))).catalog,
        name: '@netscript/actions-contract-test',
        version: '0.0.0',
        imports: {
          preact: 'npm:preact@^10.29.2',
          '@preact/signals': 'npm:@preact/signals@2.11.3',
        },
        compilerOptions: {
          jsx: 'precompile',
          jsxImportSource: 'preact',
          lib: ['dom', 'dom.iterable', 'deno.ns'],
        },
      }),
    );
    for (const name of [...names, 'code-block']) {
      await run(repo, [
        'run',
        '-A',
        '--frozen',
        join(repo, 'packages/cli/bin/netscript-dev.ts'),
        'ui:add',
        name,
        '--project-root',
        root,
        '--registry-root',
        join(repo, 'packages/fresh-ui'),
        '--force',
      ]);
    }
    const installedConfig = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    assertEquals(
      installedConfig.imports['@netscript/fresh-ui'],
      FRESH_UI_RUNTIME_DEPENDENCY,
      'The installer must contribute its runtime package mapping; local subpath aliases cannot prove that.',
    );
    // Compile the unreleased local API only after proving the production root mapping was installed.
    installedConfig.imports['@netscript/fresh-ui/interactive'] =
      toFileUrl(join(repo, 'packages/fresh-ui/interactive.ts')).href;
    installedConfig.imports['@netscript/fresh-ui/primitives'] =
      toFileUrl(join(repo, 'packages/fresh-ui/primitives.tsx')).href;
    await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify(installedConfig));
    for (const name of [...names, 'code-block']) {
      const installed = await Deno.readTextFile(join(root, 'components/ui', name + '.tsx'));
      const source = await Deno.readTextFile(
        join(repo, 'packages/fresh-ui/registry/components/ui', name + '.tsx'),
      );
      // The copy installer relocates only the canonical lib/ui imports.
      assertEquals(installed.replaceAll('@/lib/cn.ts', '../../lib/cn.ts'), source);
      assertStringIncludes(installed, `data-scope='${name}'`);
    }
    await run(root, [
      'check',
      '--unstable-kv',
      ...[...names, 'code-block'].map((name) => `components/ui/${name}.tsx`),
    ]);
    await run(root, [
      'lint',
      '--rules-include=jsx-curly-braces',
      ...[...names, 'code-block'].map((name) => `components/ui/${name}.tsx`),
    ]);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
