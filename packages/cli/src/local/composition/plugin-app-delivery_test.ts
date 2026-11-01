import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

const REPO = fromFileUrl(new URL('../../../../../', import.meta.url));
const CLI = join(REPO, 'packages/cli/bin/netscript-dev.ts');

async function run(args: readonly string[], expected = 0): Promise<string> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', CLI, ...args],
    cwd: REPO,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(
    expected === 0 ? result.code === 0 : result.code !== 0,
    true,
    new TextDecoder().decode(result.stderr),
  );
  return new TextDecoder().decode(result.stdout);
}

Deno.test('documented installs persist app links and compile workers before any generate command', async () => {
  const parent = join(REPO, '.llm/tmp', `plugin-app-delivery-${crypto.randomUUID()}`);
  await Deno.mkdir(parent, { recursive: true });
  const root = join(parent, 'shop');
  try {
    await run([
      'init',
      'shop',
      '--path',
      parent,
      '--db',
      'none',
      '--app-name',
      'web',
      '--ci',
      '--yes',
      '--no-git',
      '--editor',
      'none',
    ]);
    const path = join(root, 'appsettings.json');
    const settings = JSON.parse(await Deno.readTextFile(path));
    settings.NetScript.Apps.admin = { Type: 'app' };
    settings.NetScript.Apps.off = { Type: 'app', Enabled: false };
    settings.NetScript.Apps.task = { Type: 'task' };
    await Deno.writeTextFile(path, JSON.stringify(settings));
    const before = await Deno.readTextFile(path);
    await run([
      'plugin',
      'install',
      'workers',
      '--name',
      'workers',
      '--app',
      'missing',
      '--project-root',
      root,
      '--no-db',
    ], 1);
    assertEquals(await Deno.readTextFile(path), before);
    await run([
      'plugin',
      'install',
      'workers',
      '--name',
      'workers',
      '--app',
      'web',
      '--project-root',
      root,
      '--samples',
      '--no-db',
      '--dry-run',
    ]);
    assertEquals(await Deno.readTextFile(path), before);
    await run([
      'plugin',
      'install',
      'workers',
      '--name',
      'workers',
      '--app',
      'web',
      '--project-root',
      root,
      '--samples',
      '--no-db',
    ]);
    const registry = join(root, '.netscript/generated/plugin-workers/job-registry.ts');
    assertStringIncludes(await Deno.readTextFile(registry), 'export const jobDefinitions');
    let current = JSON.parse(await Deno.readTextFile(path)).NetScript;
    assertEquals(current.Apps.web.PluginReferences, ['workers-api']);
    assertEquals(current.Apps.admin.PluginReferences, undefined);
    const manifest = JSON.parse(
      await Deno.readTextFile(join(root, 'workers/scaffold.plugin.json')),
    );
    assertEquals(manifest.linking.consumers.apps, ['web']);
    await Deno.remove(registry);
    const diagnosis = await run(['plugin', 'doctor', '--project-root', root], 1);
    const workersCheck = diagnosis.split('\n').find((line) =>
      line.includes('generated job registry exists')
    ) ?? '';
    assertStringIncludes(workersCheck, JSON.stringify(CLI));
    assertStringIncludes(workersCheck, `generate plugins --project-root ${JSON.stringify(root)}`);
    assertEquals(workersCheck.includes('jsr:@netscript/plugin-workers@'), false);
    await run(['generate', 'plugins', '--project-root', root]);
    assertStringIncludes(await Deno.readTextFile(registry), 'export const jobDefinitions');

    await run([
      'plugin',
      'install',
      'streams',
      '--name',
      'streams',
      '--project-root',
      root,
      '--samples',
    ]);
    current = JSON.parse(await Deno.readTextFile(path)).NetScript;
    assertEquals(current.Apps.web.PluginReferences, ['streams', 'workers-api']);
    assertEquals(current.Apps.admin.PluginReferences, ['streams']);
    assertEquals(current.Apps.off.PluginReferences, undefined);
    assertEquals(current.Apps.task.PluginReferences, undefined);
    await run(['plugin', 'install', 'ai', '--name', 'ai', '--project-root', root, '--no-samples']);
    current = JSON.parse(await Deno.readTextFile(path)).NetScript;
    assertEquals(current.Plugins.ai, undefined);
    assertEquals(current.Apps.web.PluginReferences, ['streams', 'workers-api']);
    assertEquals(current.Apps.admin.PluginReferences, ['streams']);
    // Reconciliation after another install retains the first plugin's explicit consumers.
    assertStringIncludes(await Deno.readTextFile(registry), 'export const jobDefinitions');
  } finally {
    await Deno.remove(parent, { recursive: true });
  }
});
