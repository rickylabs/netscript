import { assert, assertEquals, assertFalse, assertMatch } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { FRESH_UI_RUNTIME_DEPENDENCY } from './post-v1-items.ts';

const repo = fromFileUrl(new URL('../../../../', import.meta.url));
const cli = join(repo, 'packages/cli/bin/netscript-dev.ts');
const TARGET_COMPONENTS = ['secret-field', 'key-value-editor', 'chips-input'] as const;

Deno.test('netscript ui:add installs secret-field, key-value-editor, and chips-input with valid lockfile and zero L2-to-L2 imports', async () => {
  const root = await Deno.makeTempDir({ prefix: 'fresh-ui-secret-kv-lock-' });
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({
        name: '@netscript/secret-kv-lock-test',
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

    for (const name of TARGET_COMPONENTS) {
      const result = await new Deno.Command(Deno.execPath(), {
        cwd: repo,
        args: [
          'run',
          '-A',
          '--frozen',
          cli,
          'ui:add',
          name,
          '--project-root',
          root,
          '--force',
        ],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(result.code, 0, `${name}: ${new TextDecoder().decode(result.stderr)}`);
    }

    const denoConfig = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    assertEquals(denoConfig.imports['@netscript/fresh-ui'], FRESH_UI_RUNTIME_DEPENDENCY);

    const lock = JSON.parse(await Deno.readTextFile(join(root, 'fresh-ui.lock.json')));
    const styles = await Deno.readTextFile(join(root, 'assets/styles.css'));

    for (const name of TARGET_COMPONENTS) {
      const entry = lock.items[name];
      assert(entry, `fresh-ui.lock.json must record ${name}`);
      assertMatch(entry.sourceHash, /^[a-f0-9]{64}$/);
      assert(
        entry.files.some((file: { target: string }) => file.target === `components/ui/${name}.tsx`),
        `lock entry for ${name} must include components/ui/${name}.tsx`,
      );
      assert(
        entry.files.some((file: { target: string }) => file.target === `assets/ui/${name}.css`),
        `lock entry for ${name} must include assets/ui/${name}.css`,
      );
      assert(
        styles.includes(`@import './ui/${name}.css';`),
        `assets/styles.css must import ./ui/${name}.css`,
      );

      // Verify zero L2-to-L2 imports (only L0/L1 package imports + cn helper).
      const installedSource = await Deno.readTextFile(join(root, 'components/ui', `${name}.tsx`));
      assertFalse(
        /from\s+['"]\.\/[^'"]+\.tsx['"]/.test(installedSource),
        `${name}.tsx must not import sibling L2 components`,
      );
      assertFalse(
        /from\s+['"]@\/components\/ui\//.test(installedSource),
        `${name}.tsx must not import @/components/ui/* L2 components`,
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
