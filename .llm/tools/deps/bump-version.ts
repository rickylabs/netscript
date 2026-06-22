#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
/**
 * Structured wrapper over native `deno bump-version`.
 */

interface Args {
  json: boolean;
  pretty: boolean;
  cwd: string;
  nativeArgs: string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = { json: false, pretty: false, cwd: Deno.cwd(), nativeArgs: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--pretty') args.pretty = true;
    else if (arg === '--cwd') args.cwd = argv[++i] ?? args.cwd;
    else args.nativeArgs.push(arg);
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(Deno.args);
  const commandArgs = ['bump-version', ...args.nativeArgs];
  const start = performance.now();
  const command = new Deno.Command('deno', {
    args: commandArgs,
    cwd: args.cwd,
    stdout: 'piped',
    stderr: 'piped',
  });
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  const result = {
    generatedAt: new Date().toISOString(),
    command: `deno ${commandArgs.join(' ')}`,
    cwd: args.cwd,
    exitCode: output.code,
    ok: output.code === 0,
    durationMs: Math.round(performance.now() - start),
    stdout,
    stderr,
  };

  if (args.json || !args.pretty) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`deps:bump-version - ${result.ok ? 'OK' : `FAILED (exit ${output.code})`}`);
    if (stdout.trim()) console.log(stdout.trim());
    if (stderr.trim()) console.error(stderr.trim());
  }
  Deno.exit(output.code);
}

await main();
