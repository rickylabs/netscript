import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { encodeUiPreset } from '../../../../kernel/domain/ui/ui-preset.ts';

Deno.test('native init/apply presets compile real tokens, install exact docs and keep edited component code', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  const cli = fromFileUrl(new URL('../../../../../bin/netscript-dev.ts', import.meta.url));
  const run = async (args: string[], success = true) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--frozen', '--unstable-kv', '-A', cli, ...args, '--project-root', root],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const error = new TextDecoder().decode(result.stderr);
    assertEquals(result.code === 0, success, error);
    return new TextDecoder().decode(result.stdout) + error;
  };
  const snapshot = async () => {
    const result: Record<string, string> = {};
    for await (const file of fs.walk(root)) {
      if (file.isFile) result[file.path] = await fs.readFile(file.path);
    }
    return result;
  };
  try {
    await fs.writeFile(join(root, 'deno.json'), '{}');
    await fs.createDir(join(root, 'routes'));
    const before = await snapshot();
    await run(['ui:init', '--preset', 'unknown-preset'], false);
    assertEquals(await snapshot(), before);
    await run(['ui:init']);
    assertEquals(
      JSON.parse(await fs.readFile(join(root, 'assets/theme-preset.json'))).id,
      'studio-utility',
    );
    for (const name of ['DESIGN.md', 'SKILL.md']) {
      const expected = await Deno.readTextFile(
        new URL(
          `../../../../../../../docs/design-system/themes/studio/${name}`,
          import.meta.url,
        ),
      );
      assertEquals(
        await fs.readFile(join(root, `.agents/skills/fresh-ui-theme-studio-utility/${name}`)),
        expected,
      );
    }
    await run(['ui:add', 'button']);
    const button = join(root, 'components/ui/button.tsx');
    await fs.writeFile(button, (await fs.readFile(button)) + '\n// app customization\n');
    const components = Object.fromEntries(
      Object.entries(await snapshot()).filter(([path]) => /\.(tsx?|jsx?)$/.test(path)),
    );
    const fonts = await fs.readFile(join(root, 'assets/fonts.json'));
    const onlyTheme = encodeUiPreset({
      version: 1,
      theme: 'ns-one',
      style: 'not-a-style',
      font: 'not-a-font',
    });
    await run(['ui:apply', '--preset', onlyTheme, '--only', 'theme']);
    assertEquals(await fs.readFile(join(root, 'assets/fonts.json')), fonts);
    assertEquals(
      Object.fromEntries(
        Object.entries(await snapshot()).filter(([path]) => /\.(tsx?|jsx?)$/.test(path)),
      ),
      components,
    );
    assertEquals(
      JSON.parse(await fs.readFile(join(root, 'assets/theme-preset.json'))).id,
      'ns-one',
    );
    await run(['tokens', 'build']);
    assertEquals(
      JSON.parse(await fs.readFile(join(root, 'assets/theme-preset.json'))).id,
      'ns-one',
    );
    const tokens = await fs.readFile(join(root, 'assets/tokens.css'));
    const config = await fs.readFile(join(root, 'tokens.config.json'));
    await run(['ui:apply', '--preset', 'studio-utility', '--only', 'font']);
    assertEquals(await fs.readFile(join(root, 'assets/tokens.css')), tokens);
    assertEquals(await fs.readFile(join(root, 'tokens.config.json')), config);
    await fs.writeFile(
      join(root, '.agents/skills/fresh-ui-theme-ns-one/SKILL.md'),
      'app edited skill',
    );
    const beforeFailure = await snapshot();
    const output = await run(['ui:apply', '--preset', 'ns-one'], false);
    assertStringIncludes(output, 'SKILL.md');
    assertEquals(await snapshot(), beforeFailure);
    assert((await fs.readFile(button)).includes('app customization'));
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('ui:init preserves an existing legacy NS One preset', async () => {
  const root = await Deno.makeTempDir();
  const cli = fromFileUrl(new URL('../../../../../bin/netscript-dev.ts', import.meta.url));
  try {
    await Deno.writeTextFile(join(root, 'deno.json'), '{}');
    await Deno.mkdir(join(root, 'routes'));
    for (const args of [['--theme', 'theme-ns-one'], []]) {
      const result = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--frozen',
          '--unstable-kv',
          '-A',
          cli,
          'ui:init',
          '--project-root',
          root,
          ...args,
        ],
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
      assertEquals(
        JSON.parse(await Deno.readTextFile(join(root, 'assets/theme-preset.json'))).id,
        'ns-one',
      );
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
