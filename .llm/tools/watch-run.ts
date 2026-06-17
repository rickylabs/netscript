/**
 * watch-run.ts — block until a harness run directory changes, then exit.
 *
 * The supervisor delegates slices to sub-agents and must re-wake when a slice
 * lands — without polling (which burns tokens) and without depending on
 * `ScheduleWakeup` (unreliable here). Run this as a **background** process: it
 * `Deno.watchFs`-es a run dir and exits 0 on the first relevant change (a
 * sub-agent appending `commits.md` / `worklog.md`), which re-invokes the
 * supervisor turn. The supervisor then inspects the new commit and continues.
 *
 * A `--timeout-seconds` fallback exits 2 (heartbeat) so a hung sub-agent that
 * never writes still eventually wakes the supervisor instead of blocking forever.
 *
 * Usage:
 *   deno run --allow-read .llm/tools/watch-run.ts <run-dir> \
 *     [--files commits.md,worklog.md] [--timeout-seconds 1800] [--quiet]
 *
 * Exit codes: 0 = relevant change seen · 2 = timed out (heartbeat) · 1 = bad args.
 */

interface Args {
  runDir: string;
  files: string[];
  timeoutSeconds: number;
  quiet: boolean;
}

function parseArgs(argv: string[]): Args | null {
  const positional: string[] = [];
  let files = ['commits.md', 'worklog.md'];
  let timeoutSeconds = 1800;
  let quiet = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--files') {
      files = (argv[++i] ?? '').split(',').map((f) => f.trim()).filter(Boolean);
    } else if (arg === '--timeout-seconds') timeoutSeconds = Number(argv[++i] ?? '1800');
    else if (arg === '--quiet') quiet = true;
    else if (!arg.startsWith('--')) positional.push(arg);
  }
  if (positional.length !== 1 || !Number.isFinite(timeoutSeconds)) return null;
  return { runDir: positional[0], files, timeoutSeconds, quiet };
}

function emit(quiet: boolean, payload: Record<string, unknown>): void {
  if (!quiet) console.log(JSON.stringify(payload));
}

async function main() {
  const args = parseArgs(Deno.args);
  if (!args) {
    console.error(
      'usage: watch-run.ts <run-dir> [--files a.md,b.md] [--timeout-seconds N] [--quiet]',
    );
    Deno.exit(1);
  }
  try {
    const stat = await Deno.stat(args.runDir);
    if (!stat.isDirectory) throw new Error('not a directory');
  } catch {
    console.error(`watch-run: run dir not found: ${args.runDir}`);
    Deno.exit(1);
  }

  const watcher = Deno.watchFs(args.runDir, { recursive: true });
  const matches = (path: string) =>
    args.files.length === 0 || args.files.some((f) => path.replace(/\\/g, '/').endsWith(`/${f}`));

  const timeout = setTimeout(() => {
    emit(args.quiet, { timedOut: true, runDir: args.runDir, at: new Date().toISOString() });
    watcher.close();
    Deno.exit(2);
  }, args.timeoutSeconds * 1000);

  emit(args.quiet, {
    watching: args.runDir,
    files: args.files,
    timeoutSeconds: args.timeoutSeconds,
  });

  for await (const event of watcher) {
    if (event.kind !== 'modify' && event.kind !== 'create') continue;
    const hit = event.paths.find(matches);
    if (!hit) continue;
    clearTimeout(timeout);
    emit(args.quiet, {
      changed: hit.replace(/\\/g, '/'),
      kind: event.kind,
      at: new Date().toISOString(),
    });
    watcher.close();
    Deno.exit(0);
  }
}

await main();
