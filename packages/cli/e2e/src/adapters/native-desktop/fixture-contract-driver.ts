import { resolve } from '@std/path';
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
  const fixtureRoot = await Deno.makeTempDir({
    prefix: 'netscript-desktop-fixture-contract-',
  });
  try {
    const fixture = await prepareDesktopFixture(repoRoot, fixtureRoot, '1.0.0');
    await requireNativeCommand(Deno.execPath(), ['task', 'test'], {
      cwd: fixture.root,
      timeoutMs: 180_000,
    });
  } finally {
    await Deno.remove(fixtureRoot, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
}

if (import.meta.main) await main();
