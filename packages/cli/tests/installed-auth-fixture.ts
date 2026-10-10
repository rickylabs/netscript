import { join } from '@std/path';
import type { FileSystemPort } from '../src/kernel/ports/file-system-port.ts';

interface InstalledAuthFixture {
  readonly plugins: Record<string, Record<string, unknown>>;
  readonly config: string;
  readonly manifest: string;
}

const fixtures = new Map<string, Promise<InstalledAuthFixture>>();

/** Seed port tests with the unmodified output of the public auth installer. */
export async function writeInstalledAuthFixture(
  fs: FileSystemPort,
  projectRoot: string,
  name = 'auth',
): Promise<void> {
  let fixture = fixtures.get(name);
  if (!fixture) {
    fixture = installAuth(name);
    fixtures.set(name, fixture);
  }
  const installed = await fixture;
  const settingsPath = join(projectRoot, 'appsettings.json');
  const settings = await fs.exists(settingsPath) ? JSON.parse(await fs.readFile(settingsPath)) : {};
  settings.NetScript ??= {};
  settings.NetScript.Plugins = structuredClone(installed.plugins);
  await fs.writeFile(settingsPath, JSON.stringify(settings));
  await fs.writeFile(join(projectRoot, 'netscript.config.ts'), installed.config);
  await fs.writeFile(join(projectRoot, name, 'scaffold.plugin.json'), installed.manifest);
}

async function installAuth(name: string): Promise<InstalledAuthFixture> {
  const root = await Deno.makeTempDir({ prefix: 'installed-auth-fixture-' });
  const repo = new URL('../../../', import.meta.url).pathname;
  const cli = join(repo, 'packages/cli/bin/netscript.ts');
  const project = join(root, 'auth-fixture');
  const run = async (args: string[]) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['run', '--no-lock', '-A', cli, ...args],
      cwd: repo,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (!result.success) {
      throw new Error(
        'Public auth fixture command failed: ' + new TextDecoder().decode(result.stderr) +
          new TextDecoder().decode(result.stdout),
      );
    }
  };
  try {
    await run([
      'init',
      'auth-fixture',
      '--path',
      root,
      '--db',
      'none',
      '--app-name',
      'web',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
      '--editor',
      'none',
    ]);
    await run(['plugin', 'install', 'auth', '--name', name, '--project-root', project, '--force']);
    const settings = JSON.parse(await Deno.readTextFile(join(project, 'appsettings.json')));
    return {
      plugins: settings.NetScript.Plugins,
      config: await Deno.readTextFile(join(project, 'netscript.config.ts')),
      manifest: await Deno.readTextFile(join(project, name, 'scaffold.plugin.json')),
    };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}
