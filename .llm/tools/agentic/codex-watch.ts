/**
 * codex-watch.ts — event-driven waiter for a WSL Codex slice. Two modes:
 *
 *   --mode git  (default) — wake on the worktree's next git activity. Resolves the
 *      worktree's gitdir `logs` dir and arms `Deno.watchFs` there; exits 0 on the
 *      first ref/commit event (a commit, branch update, or reflog write). This says
 *      "the slice made progress" — it does NOT say the agent stopped working (a turn
 *      can commit mid-flight, or end with no commit at all).
 *
 *   --mode turn — wake when the agent's current turn FINISHES. Watches the thread's
 *      session rollout `.jsonl` and exits 0 when its terminal record is
 *      `task_complete` (the daemon's end-of-turn marker). This is the real
 *      "agent is idle / done" signal that git-ref watching misses. Resolve the
 *      rollout by `--thread-id <uuid>` (newest matching rollout under the sessions
 *      dir) or pass `--rollout <path>` directly. If the thread is already idle when
 *      armed, exits 0 immediately with `alreadyIdle:true`.
 *
 * Both modes exit 2 on a `--timeout-seconds` heartbeat so a hung sub-agent still
 * eventually re-wakes the supervisor. No `sleep` — `sleep` is neutralized in the
 * Codex sandbox; this is pure fs events.
 *
 * IMPORTANT: run this INSIDE WSL so Deno.watchFs observes native ext4 events.
 * The Windows side cannot reliably receive 9P fs events for `/home/codex/...`.
 * Launch it as a background process via:
 *
 *   wsl.exe --cd /home/codex/repos/<wt> -u codex -- bash -lc 'export PATH="$HOME/.local/bin:$PATH"; \
 *     deno run --no-config --allow-env --allow-read --allow-run \
 *     /mnt/c/.../.llm/tools/agentic/codex-watch.ts \
 *     --mode turn --thread-id <uuid> --timeout-seconds 1800'
 *
 * In git mode it uses plain `git` (cwd = worktree); it does NOT call wsl.exe itself.
 *
 * Usage (inside WSL):
 *   # progress (git refs):
 *   deno run --allow-env --allow-read --allow-run codex-watch.ts --worktree <path> [--timeout-seconds 1800]
 *   # turn finish (rollout):
 *   deno run --allow-env --allow-read --allow-run codex-watch.ts --mode turn --thread-id <uuid> \
 *     [--sessions-dir <dir>] [--rollout <path>] [--timeout-seconds 1800]
 *
 * Perms: --allow-env (reads HOME to locate ~/.codex/sessions) · --allow-read ·
 * --allow-run (git). Exit codes: 0 = awaited event seen (git event | turn complete) ·
 * 2 = timed out (heartbeat) · 1 = bad args / worktree, logs dir, or rollout not found.
 */

import { parseTurnComplete, requireValue, runBin, UUID, wslHome } from './agentic-lib.ts';

type Mode = 'git' | 'turn';

interface Options {
  mode: Mode;
  worktree?: string;
  threadId?: string;
  rollout?: string;
  sessionsDir: string;
  timeoutSeconds: number;
  quiet: boolean;
}

function defaultSessionsDir(): string {
  const home = Deno.env.get('HOME') ?? wslHome();
  return `${home}/.codex/sessions`;
}

function parseArgs(args: string[]): Options | null {
  const o: Options = {
    mode: 'git',
    sessionsDir: defaultSessionsDir(),
    timeoutSeconds: 1800,
    quiet: false,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--mode': {
        const v = requireValue(args, i, a);
        if (v !== 'git' && v !== 'turn') {
          throw new Error(`--mode must be 'git' or 'turn', got '${v}'`);
        }
        o.mode = v;
        i++;
        break;
      }
      case '--worktree':
        o.worktree = requireValue(args, i, a);
        i++;
        break;
      case '--thread-id':
        o.threadId = requireValue(args, i, a);
        i++;
        break;
      case '--rollout':
        o.rollout = requireValue(args, i, a);
        i++;
        break;
      case '--sessions-dir':
        o.sessionsDir = requireValue(args, i, a);
        i++;
        break;
      case '--timeout-seconds':
        o.timeoutSeconds = Number(requireValue(args, i, a));
        i++;
        break;
      case '--quiet':
        o.quiet = true;
        break;
      case '--help':
        console.log(
          [
            'usage (run INSIDE WSL):',
            '  git mode  : codex-watch.ts --worktree <path> [--timeout-seconds N] [--quiet]',
            '  turn mode : codex-watch.ts --mode turn (--thread-id <uuid> | --rollout <path>)',
            '              [--sessions-dir <dir>] [--timeout-seconds N] [--quiet]',
          ].join('\n'),
        );
        return null;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!Number.isFinite(o.timeoutSeconds)) throw new Error('--timeout-seconds must be a number');
  if (o.mode === 'git') {
    if (!o.worktree) throw new Error('git mode requires --worktree');
  } else {
    if (!o.rollout && !o.threadId) throw new Error('turn mode requires --thread-id or --rollout');
    if (o.threadId && !new RegExp(`^${UUID}$`).test(o.threadId)) {
      throw new Error(`--thread-id is not a valid uuid: ${o.threadId}`);
    }
  }
  return o;
}

function emit(quiet: boolean, payload: Record<string, unknown>): void {
  if (!quiet) console.log(JSON.stringify(payload));
}

/** Recursively find the newest rollout file for a thread id under sessionsDir. */
async function resolveRollout(sessionsDir: string, threadId: string): Promise<string | null> {
  const suffix = `-${threadId}.jsonl`;
  let best: { path: string; mtime: number } | null = null;
  async function walk(dir: string): Promise<void> {
    let entries: Deno.DirEntry[] = [];
    try {
      entries = [...Deno.readDirSync(dir)];
    } catch {
      return;
    }
    for (const e of entries) {
      const full = `${dir}/${e.name}`;
      if (e.isDirectory) {
        await walk(full);
      } else if (e.isFile && e.name.startsWith('rollout-') && e.name.endsWith(suffix)) {
        try {
          const st = await Deno.stat(full);
          const mtime = st.mtime?.getTime() ?? 0;
          if (!best || mtime > best.mtime) best = { path: full, mtime };
        } catch { /* race: file vanished */ }
      }
    }
  }
  await walk(sessionsDir);
  return best ? (best as { path: string }).path : null;
}

/** Read the last `maxBytes` of a file as text (whole-line boundaries not required). */
async function readTail(path: string, maxBytes = 65536): Promise<string> {
  const f = await Deno.open(path, { read: true });
  try {
    const { size } = await f.stat();
    const start = size > maxBytes ? size - maxBytes : 0;
    if (start > 0) await f.seek(start, Deno.SeekMode.Start);
    const buf = new Uint8Array(size - start);
    let pos = 0;
    while (pos < buf.length) {
      const n = await f.read(buf.subarray(pos));
      if (n === null) break;
      pos += n;
    }
    return new TextDecoder().decode(buf.subarray(0, pos));
  } finally {
    f.close();
  }
}

function dirname(p: string): string {
  const i = p.replace(/\\/g, '/').lastIndexOf('/');
  return i <= 0 ? '/' : p.slice(0, i);
}

async function watchGit(o: Options): Promise<never> {
  // Resolve the gitdir logs path with plain git (we are inside WSL).
  const gd = await runBin('git', ['rev-parse', '--absolute-git-dir'], { cwd: o.worktree });
  if (gd.code !== 0 || !gd.stdout) {
    console.error(`codex-watch: not a git worktree: ${o.worktree} (${gd.stderr})`);
    Deno.exit(1);
  }
  const logsPath = `${gd.stdout}/logs`;
  try {
    const stat = await Deno.stat(logsPath);
    if (!stat.isDirectory) throw new Error('not a directory');
  } catch {
    console.error(`codex-watch: logs dir not found: ${logsPath}`);
    Deno.exit(1);
  }

  const watcher = Deno.watchFs(logsPath, { recursive: true });
  const timeout = setTimeout(() => {
    emit(o.quiet, {
      timedOut: true,
      mode: 'git',
      worktree: o.worktree,
      logsPath,
      at: new Date().toISOString(),
    });
    watcher.close();
    Deno.exit(2);
  }, o.timeoutSeconds * 1000);

  emit(o.quiet, {
    watching: logsPath,
    mode: 'git',
    worktree: o.worktree,
    timeoutSeconds: o.timeoutSeconds,
  });

  for await (const ev of watcher) {
    if (ev.kind !== 'create' && ev.kind !== 'modify') continue;
    clearTimeout(timeout);
    emit(o.quiet, {
      gitEvent: true,
      kind: ev.kind,
      paths: ev.paths.map((p) => p.replace(/\\/g, '/')),
      at: new Date().toISOString(),
    });
    watcher.close();
    Deno.exit(0);
  }
  // watcher ended without an event (closed externally) — treat as heartbeat.
  Deno.exit(2);
}

async function watchTurn(o: Options): Promise<never> {
  let rollout = o.rollout ?? null;
  if (!rollout && o.threadId) {
    rollout = await resolveRollout(o.sessionsDir, o.threadId);
  }
  if (!rollout) {
    console.error(
      `codex-watch: no rollout found for thread ${o.threadId} under ${o.sessionsDir}`,
    );
    Deno.exit(1);
  }
  try {
    if (!(await Deno.stat(rollout)).isFile) throw new Error('not a file');
  } catch {
    console.error(`codex-watch: rollout not found: ${rollout}`);
    Deno.exit(1);
  }
  const resolved = rollout as string;

  const check = async (): Promise<boolean> => {
    try {
      const state = parseTurnComplete(await readTail(resolved));
      return state.turnComplete;
    } catch {
      return false;
    }
  };

  // Already idle at arm time? Report it and exit — the thread isn't running a turn.
  if (await check()) {
    emit(o.quiet, {
      turnComplete: true,
      alreadyIdle: true,
      mode: 'turn',
      rollout: resolved,
      at: new Date().toISOString(),
    });
    Deno.exit(0);
  }

  // Watch the rollout's parent dir (file-level events can be missed on append);
  // filter to our rollout basename.
  const watchDir = dirname(resolved);
  const watcher = Deno.watchFs(watchDir, { recursive: false });
  const timeout = setTimeout(() => {
    emit(o.quiet, {
      timedOut: true,
      mode: 'turn',
      rollout: resolved,
      at: new Date().toISOString(),
    });
    watcher.close();
    Deno.exit(2);
  }, o.timeoutSeconds * 1000);

  emit(o.quiet, { watching: resolved, mode: 'turn', timeoutSeconds: o.timeoutSeconds });

  for await (const ev of watcher) {
    if (ev.kind !== 'create' && ev.kind !== 'modify') continue;
    const touchesRollout = ev.paths.some((p) => p.replace(/\\/g, '/') === resolved);
    if (!touchesRollout) continue;
    if (await check()) {
      clearTimeout(timeout);
      emit(o.quiet, {
        turnComplete: true,
        mode: 'turn',
        rollout: resolved,
        at: new Date().toISOString(),
      });
      watcher.close();
      Deno.exit(0);
    }
  }
  Deno.exit(2);
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
  if (o.mode === 'git') await watchGit(o);
  else await watchTurn(o);
}

if (import.meta.main) await main();
