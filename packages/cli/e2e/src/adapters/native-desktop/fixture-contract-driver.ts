import { copy } from '@std/fs';
import { join, resolve, toFileUrl } from '@std/path';
import { requireNativeCommand } from './command.ts';
import { prepareDesktopFixture } from './fixture-workspace.ts';

function argument(name: string): string {
  const index = Deno.args.indexOf(name);
  const value = index < 0 ? undefined : Deno.args[index + 1];
  if (!value) throw new Error(`Missing required ${name}.`);
  return resolve(value);
}

async function main(): Promise<void> {
  const repoRoot = argument('--repo-root');
  const checkOnly = Deno.args.includes('--check-only');
  const fixtureRoot = await Deno.makeTempDir({
    prefix: 'netscript-desktop-fixture-contract-',
  });
  try {
    const fixture = await prepareDesktopFixture(repoRoot, fixtureRoot, '1.0.0');
    const isolatedSdk = join(fixture.root, 'sdk-source');
    await copy(join(repoRoot, 'packages', 'sdk', 'src'), isolatedSdk, { overwrite: true });
    const denoPath = join(fixture.root, 'deno.json');
    const config = JSON.parse(await Deno.readTextFile(denoPath)) as {
      imports: Record<string, string>;
    };
    config.imports['@netscript/sdk/auto-update'] = toFileUrl(
      join(isolatedSdk, 'auto-update', 'mod.ts'),
    ).href;
    config.imports['@netscript/sdk/desktop'] = toFileUrl(
      join(isolatedSdk, 'desktop', 'mod.ts'),
    ).href;
    await Deno.writeTextFile(denoPath, `${JSON.stringify(config, null, 2)}\n`);
    const check = await requireNativeCommand(Deno.execPath(), [
      'run',
      '--allow-read',
      '--allow-run',
      join(repoRoot, '.llm', 'tools', 'run-deno-check.ts'),
      '--cwd',
      fixture.root,
      '--root',
      '.',
      '--ext',
      'ts',
      '--exclude',
      '^sdk-source/',
    ], {
      cwd: repoRoot,
      timeoutMs: 180_000,
    });
    if (check.stdout.trim()) console.log(check.stdout.trim());
    if (checkOnly) return;
    const test = await requireNativeCommand(Deno.execPath(), [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      join(repoRoot, '.llm', 'tools', 'run-deno-test.ts'),
      '--',
      '--allow-all',
      'tests/fixture-contract.ts',
    ], {
      cwd: fixture.root,
      timeoutMs: 180_000,
    });
    if (test.stdout.trim()) console.log(test.stdout.trim());
  } finally {
    await Deno.remove(fixtureRoot, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

if (import.meta.main) await main();
