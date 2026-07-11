/** @deprecated Retained through one compatibility cycle; retirement requires reviewed #577-#582 completion. */
/**
 * codex-status.ts — read-only health/state snapshot for WSL Codex orchestration.
 *
 * Replaces the ad-hoc PowerShell one-liners the supervisor used to hand-write for
 * "what's the daemon doing / where is this worktree at". Everything runs through
 * the shared `wsl()` helper (argv array — no PowerShell `<`/`$()` parse hazard),
 * and the tool is strictly read-only: it never sends a turn, pushes, or mutates a
 * worktree.
 *
 * Reports (any subset, controlled by flags):
 *   - daemon : `codex app-server daemon version` + whether an app-server process
 *              is running for the user.
 *   - worktree : branch / HEAD / upstream / dirty count + resolved gitdir logs
 *              path (the path codex-watch.ts watches) for the given --worktree.
 *   - sessions : most recent session rollout jsonl files (newest first).
 *
 * Usage:
 *   deno run --allow-run .llm/tools/agentic/codex/codex-status.ts \
 *     [--worktree /home/codex/repos/<wt>] [--user codex] [--sessions 10] [--pretty]
 *
 * Exit codes: 0 = ok · 2 = usage error · 5 = --worktree given but not found.
 */

import { requireValue, wsl, wslGitInfo, wslGitLogsPath, wslUser } from '../lib/agentic-lib.ts';
import { classifyCodexRolloutFailure } from './classify-codex-failure.ts';

interface Options {
  worktree?: string;
  user: string;
  sessions: number;
  pretty: boolean;
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno run --allow-run .llm/tools/agentic/codex/codex-status.ts [options]',
    '',
    'Options:',
    '  --worktree <path>  WSL worktree to report branch/HEAD/upstream/dirty + logs path.',
    '  --user <name>      WSL user. Default: codex.',
    '  --sessions <n>     List the N most recent session rollout files. Default: 5 (0 to skip).',
    '  --pretty           Human-readable output instead of JSON.',
    '  --help             Show this help.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  const o: Options = { user: wslUser(), sessions: 5, pretty: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '--worktree':
        o.worktree = requireValue(args, i, a);
        i++;
        break;
      case '--user':
        o.user = requireValue(args, i, a);
        i++;
        break;
      case '--sessions':
        o.sessions = Number(requireValue(args, i, a));
        i++;
        break;
      case '--pretty':
        o.pretty = true;
        break;
      case '--help':
        printHelp();
        return null;
      default:
        throw new Error(`Unknown argument: ${a}`);
    }
  }
  if (!Number.isFinite(o.sessions) || o.sessions < 0) throw new Error('--sessions must be >= 0');
  return o;
}

async function main(): Promise<void> {
  let o: Options | null;
  try {
    o = parseArgs(Deno.args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(2);
    return;
  }
  if (!o) return;

  // deno-lint-ignore no-explicit-any
  const report: Record<string, any> = {};

  // Daemon version + running app-server processes (read-only).
  const daemon = await wsl(
    o.user,
    `export PATH="$HOME/.local/bin:$PATH"; ` +
      `echo "VERSION=$(codex app-server daemon version 2>/dev/null | head -n1)"; ` +
      `echo "PROCS=$(ps -eo pid,etime,cmd 2>/dev/null | grep -E "[a]pp-server" | wc -l | tr -d ' ')"`,
  );
  report.daemon = {
    version: daemon.stdout.match(/^VERSION=(.*)$/m)?.[1]?.trim() || null,
    appServerProcesses: Number(daemon.stdout.match(/^PROCS=(\d+)$/m)?.[1] ?? '0'),
  };

  // Worktree state + logs path.
  if (o.worktree) {
    const info = await wslGitInfo(o.user, o.worktree);
    if (!info.found) {
      report.worktree = { worktree: o.worktree, found: false };
      console.log(o.pretty ? `worktree NOT FOUND: ${o.worktree}` : JSON.stringify(report));
      Deno.exit(5);
    }
    const logsPath = await wslGitLogsPath(o.user, o.worktree);
    report.worktree = { worktree: o.worktree, ...info, logsPath };
  }

  // Recent session rollout files.
  if (o.sessions > 0) {
    const sess = await wsl(
      o.user,
      `find ~/.codex/sessions -type f -name '*.jsonl' -printf '%T@ %p\\n' 2>/dev/null | ` +
        `sort -nr | head -n ${o.sessions} | sed -E 's/^[0-9.]+ //'`,
    );
    report.sessions = sess.stdout ? sess.stdout.split('\n').filter(Boolean) : [];
    const latest = await wsl(
      o.user,
      `latest=$(find ~/.codex/sessions -type f -name '*.jsonl' -printf '%T@ %p\\n' 2>/dev/null | ` +
        `sort -nr | head -n 1 | sed -E 's/^[0-9.]+ //'); ` +
        `if [ -n "$latest" ]; then tail -c 65536 "$latest"; fi`,
    );
    const failure = classifyCodexRolloutFailure(latest.stdout);
    report.failure = failure.kind === 'other' ? null : failure;
  }

  if (o.pretty) {
    console.log(
      `daemon  : version=${
        report.daemon.version ?? '?'
      } app-server-procs=${report.daemon.appServerProcesses}`,
    );
    if (report.worktree) {
      const w = report.worktree;
      console.log(`worktree: ${w.branch}@${w.head} upstream=${w.upstream} dirty=${w.dirty}`);
      console.log(`          logs=${w.logsPath ?? '?'}`);
    }
    if (report.sessions) {
      console.log(`sessions: ${report.sessions.length} recent`);
      for (const s of report.sessions) console.log(`          ${s}`);
    }
    if (report.failure) {
      console.log(
        `failure : ${report.failure.kind}${
          report.failure.resetAt ? ` reset-at=${report.failure.resetAt}` : ''
        }`,
      );
    }
  } else {
    console.log(JSON.stringify(report));
  }
  Deno.exit(0);
}

if (import.meta.main) await main();
