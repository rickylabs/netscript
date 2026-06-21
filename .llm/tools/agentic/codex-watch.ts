/**
 * codex-watch.ts — event-driven waiter for a WSL Codex worktree's git activity.
 *
 * Generalizes the hand-written per-slice watchers (s1-watch / as6-watch). Given a
 * worktree, it resolves that worktree's gitdir `logs` directory and arms a
 * `Deno.watchFs` watcher there. It exits 0 on the first ref/commit event (a
 * commit, branch update, or reflog write), or exits 2 on a `--timeout-seconds`
 * heartbeat so a hung sub-agent still eventually re-wakes the supervisor. No
 * `sleep` — `sleep` is neutralized in the Codex sandbox; this is pure fs events.
 *
 * IMPORTANT: run this INSIDE WSL so Deno.watchFs observes native ext4 events.
 * The Windows side cannot reliably receive 9P fs events for `/home/codex/...`.
 * Launch it as a background process via:
 *
 *   wsl.exe -u codex -- bash -lc 'export PATH="$HOME/.local/bin:$PATH"; \
 *     deno run --allow-read --allow-run \
 *     /mnt/c/Dev/repos/netscript-framework/.claude/worktrees/fw-prime-time/.llm/tools/agentic/codex-watch.ts \
 *     --worktree /home/codex/repos/<wt> --timeout-seconds 1800'
 *
 * Because it runs inside WSL it uses plain `git` (cwd = worktree); it does NOT
 * call wsl.exe itself.
 *
 * Usage (inside WSL):
 *   deno run --allow-read --allow-run codex-watch.ts --worktree <path> \
 *     [--timeout-seconds 1800] [--quiet]
 *
 * Exit codes: 0 = git event seen · 2 = timed out (heartbeat) · 1 = bad args /
 * worktree or logs dir not found.
 */

import { requireValue, runBin } from "./agentic-lib.ts";

interface Options {
  worktree?: string;
  timeoutSeconds: number;
  quiet: boolean;
}

function parseArgs(args: string[]): Options | null {
  const o: Options = { timeoutSeconds: 1800, quiet: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case "--worktree":
        o.worktree = requireValue(args, i, a);
        i++;
        break;
      case "--timeout-seconds":
        o.timeoutSeconds = Number(requireValue(args, i, a));
        i++;
        break;
      case "--quiet":
        o.quiet = true;
        break;
      case "--help":
        console.log(
          "usage: codex-watch.ts --worktree <path> [--timeout-seconds N] [--quiet]  (run INSIDE WSL)",
        );
        return null;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!o.worktree) throw new Error("--worktree is required");
  if (!Number.isFinite(o.timeoutSeconds)) throw new Error("--timeout-seconds must be a number");
  return o;
}

function emit(quiet: boolean, payload: Record<string, unknown>): void {
  if (!quiet) console.log(JSON.stringify(payload));
}

async function main(): Promise<void> {
  let o: Options | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(1);
    return;
  }
  if (!o) return;

  // Resolve the gitdir logs path with plain git (we are inside WSL).
  const gd = await runBin("git", ["rev-parse", "--absolute-git-dir"], { cwd: o.worktree });
  if (gd.code !== 0 || !gd.stdout) {
    console.error(`codex-watch: not a git worktree: ${o.worktree} (${gd.stderr})`);
    Deno.exit(1);
  }
  const logsPath = `${gd.stdout}/logs`;
  try {
    const stat = await Deno.stat(logsPath);
    if (!stat.isDirectory) throw new Error("not a directory");
  } catch {
    console.error(`codex-watch: logs dir not found: ${logsPath}`);
    Deno.exit(1);
  }

  const watcher = Deno.watchFs(logsPath, { recursive: true });
  const timeout = setTimeout(() => {
    emit(o!.quiet, { timedOut: true, worktree: o!.worktree, logsPath, at: new Date().toISOString() });
    watcher.close();
    Deno.exit(2);
  }, o.timeoutSeconds * 1000);

  emit(o.quiet, { watching: logsPath, worktree: o.worktree, timeoutSeconds: o.timeoutSeconds });

  for await (const ev of watcher) {
    if (ev.kind !== "create" && ev.kind !== "modify") continue;
    clearTimeout(timeout);
    emit(o.quiet, {
      gitEvent: true,
      kind: ev.kind,
      paths: ev.paths.map((p) => p.replace(/\\/g, "/")),
      at: new Date().toISOString(),
    });
    watcher.close();
    Deno.exit(0);
  }
}

if (import.meta.main) await main();
