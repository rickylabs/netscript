/**
 * deps/prod-install.ts — structured wrapper over `deno ci --prod`.
 *
 * `deno ci --prod` performs a lockfile-frozen install of the **production** dependency
 * surface only (excludes devDependencies). It proves the *published* surface
 * resolves and installs without dev tooling — the thing a consumer of the
 * `@netscript/*` packages actually gets. This is ADDITIVE to the quality lane:
 * `check`/`lint`/`fmt` still need dev deps, so this does not replace the plain
 * `deno ci` in the `ci` task.
 *
 * `ci` fails if the lockfile would change — exactly the signal we want in CI:
 * the prod graph must already be locked.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-net --allow-run --allow-env \
 *     .llm/tools/deps/prod-install.ts [--skip-types] [--pretty]
 *
 * Note: this fails rather than mutating deno.lock when the prod graph drifted.
 * Never pass a reload flag here.
 */

export function parseArgs(argv: string[]): { skipTypes: boolean; pretty: boolean } {
  return { skipTypes: argv.includes('--skip-types'), pretty: argv.includes('--pretty') };
}

export function buildDenoCiArgs(args: { skipTypes: boolean }): string[] {
  const cmdArgs = ['ci', '--prod'];
  if (args.skipTypes) cmdArgs.push('--skip-types');
  return cmdArgs;
}

async function main() {
  const args = parseArgs(Deno.args);
  const cmdArgs = buildDenoCiArgs(args);
  const start = performance.now();
  const command = new Deno.Command('deno', { args: cmdArgs, stdout: 'piped', stderr: 'piped' });
  const output = await command.output();
  const durationMs = Math.round(performance.now() - start);
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);

  const result = {
    generatedAt: new Date().toISOString(),
    command: `deno ${cmdArgs.join(' ')}`,
    exitCode: output.code,
    ok: output.code === 0,
    durationMs,
    stderr: stderr.trim(),
  };

  if (args.pretty) {
    console.log(
      `deps:prod-install — ${result.ok ? 'OK' : `FAILED (exit ${output.code})`} in ${durationMs}ms`,
    );
    if (!result.ok) console.log(stderr.trim() || stdout.trim());
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  Deno.exit(output.code);
}

function printHelp(): void {
  console.log(
    [
      'deps/prod-install.ts — structured wrapper over `deno ci --prod`',
      '',
      'Usage:',
      '  deno run --allow-read --allow-write --allow-net --allow-run --allow-env \\',
      '    .llm/tools/deps/prod-install.ts [flags]',
      '',
      'Flags:',
      '  --skip-types   pass --skip-types to `deno ci --prod`',
      '  --pretty       human-readable summary instead of JSON',
      '  --help, -h     show this help',
      '',
      'Output (default): JSON { generatedAt, command, exitCode, ok, durationMs, stderr }.',
    ].join('\n'),
  );
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    printHelp();
    Deno.exit(0);
  }
  await main();
}
