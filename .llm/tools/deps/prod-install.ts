/**
 * deps/prod-install.ts — structured wrapper over `deno ci --prod`.
 *
 * `deno ci --prod` performs a frozen install of the **production** dependency
 * surface only (excludes devDependencies). It proves the *published* surface
 * resolves and installs without dev tooling — the thing a consumer of the
 * `@netscript/*` packages actually gets. This is ADDITIVE to the quality lane:
 * `check`/`lint`/`fmt` still need dev deps, so this does not replace the plain
 * `deno ci` in the `ci` task.
 *
 * `deno ci` fails if the lockfile would change — exactly the signal we want
 * in CI: the prod graph must already be locked.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-net --allow-run --allow-env \
 *     .llm/tools/deps/prod-install.ts [--skip-types] [--pretty]
 *
 * Note: this mutates deno.lock only if the prod graph drifted; with `--frozen`
 * it instead fails. Never pass a reload flag here.
 */

function parseArgs(argv: string[]): { skipTypes: boolean; pretty: boolean } {
  return { skipTypes: argv.includes('--skip-types'), pretty: argv.includes('--pretty') };
}

async function main() {
  const args = parseArgs(Deno.args);
  const cmdArgs = ['ci', '--prod'];
  if (args.skipTypes) cmdArgs.push('--skip-types');

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

await main();
