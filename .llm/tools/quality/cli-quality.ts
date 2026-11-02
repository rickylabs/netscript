import { fromFileUrl } from '@std/path';

/** CLI lint/format ratchet: only byte-identical legacy files may retain recorded findings. */
export interface CliQualityBaseline {
  readonly lint: Readonly<Record<string, string>>;
  readonly fmt: Readonly<Record<string, string>>;
}

/** Return unchanged debt paths; edits and new files always enter the structured wrappers. */
export async function unchangedBaselinePaths(
  baseline: Readonly<Record<string, string>>,
  cwd: string,
): Promise<string[]> {
  const unchanged: string[] = [];
  for (const [path, expected] of Object.entries(baseline)) {
    if (
      !/^packages\/cli\/(?:[\w().@ -]+\/)*[\w().@ -]+\.(?:ts|tsx)$/.test(path) ||
      path.split('/').some((part) => part === '.' || part === '..') ||
      !/^[a-f0-9]{64}$/.test(expected)
    ) throw new Error(`Invalid CLI quality baseline entry: ${path}`);
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = await Deno.readFile(`${cwd}/${path}`);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join(
      '',
    );
    if (hash === expected) unchanged.push(path);
  }
  return unchanged;
}

/** Run the repo wrappers with CLI coverage and unchanged baseline files explicitly excluded. */
export async function runCliQuality(
  cwd: string,
  baseline: CliQualityBaseline,
): Promise<number> {
  let exitCode = 0;
  for (const mode of ['lint', 'fmt'] as const) {
    const unchanged = await unchangedBaselinePaths(baseline[mode], cwd);
    const escaped = unchanged.map((path) => path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const args = [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      fromFileUrl(new URL(`../run-deno-${mode}.ts`, import.meta.url)),
      '--root',
      'packages/cli',
      '--ext',
      'ts,tsx',
      '--config',
      fromFileUrl(new URL('./cli-quality.deno.json', import.meta.url)),
    ];
    if (escaped.length) args.push('--exclude', `^(?:${escaped.join('|')})$`);
    const result = await new Deno.Command(Deno.execPath(), {
      cwd,
      args,
      stdout: 'inherit',
      stderr: 'inherit',
    }).output();
    console.error(
      `CLI ${mode}: ${unchanged.length} unchanged baseline files; wrapper exit ${result.code}`,
    );
    if (!result.success) exitCode = 1;
  }
  return exitCode;
}

if (import.meta.main) {
  const baseline: CliQualityBaseline = JSON.parse(
    await Deno.readTextFile(new URL('./cli-quality-baseline.json', import.meta.url)),
  );
  Deno.exit(await runCliQuality(Deno.cwd(), baseline));
}
