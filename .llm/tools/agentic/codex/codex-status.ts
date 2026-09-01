/** @deprecated Retained through one compatibility cycle; retirement requires reviewed #577-#582 completion. */
/** Read-only daemon, worktree, and per-session live-state snapshot for Codex orchestration. */

import {
  requireValue,
  sq,
  wsl,
  wslGitInfo,
  wslGitLogsPath,
  wslHome,
  wslUser,
} from '../lib/agentic-lib.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import { parseProcessTable } from '../runtime/adapters/local-codex-remote-adapter.ts';
import { type CodexLiveSnapshot, deriveCodexLiveSnapshot } from './codex-rollout-live.ts';
import { type AgyAgentSnapshot, deriveAgySnapshot, parseAgyConversationIndex } from './agy-live.ts';

export const CODEX_STATUS_PROCESS_TABLE_MARKER = '__NETSCRIPT_CODEX_PROCESS_TABLE__' as const;

export function parseCodexDaemonProbe(
  output: string,
  home: string,
): { version: string | null; appServerProcesses: number; anchoredAppServerProcesses: number } {
  const marker = `${CODEX_STATUS_PROCESS_TABLE_MARKER}\n`;
  const markerIndex = output.indexOf(marker);
  const header = markerIndex === -1 ? output : output.slice(0, markerIndex);
  const processTable = markerIndex === -1 ? '' : output.slice(markerIndex + marker.length);
  const appServers = parseProcessTable(processTable, home).appServers;
  return {
    version: header.match(/^VERSION=(.*)$/m)?.[1]?.trim() || null,
    appServerProcesses: appServers.length,
    anchoredAppServerProcesses: appServers.filter((process) => process.anchored).length,
  };
}

export interface CodexStatusArtifact {
  readonly kind: 'commit' | 'file-write';
  readonly value: string;
}

export interface CodexStatusSession extends CodexLiveSnapshot {
  readonly runtime: 'codex';
  readonly rollout: string;
  readonly lastArtifact: CodexStatusArtifact | null;
}

export function buildCodexStatusSession(
  jsonl: string,
  rollout: string,
  now: Date,
  stalledAfterMs: number,
  mtime: Date,
  git: { readonly dirty: boolean; readonly commit: string | null } | null = null,
): CodexStatusSession {
  const snapshot = deriveCodexLiveSnapshot(jsonl, rollout, now, stalledAfterMs, mtime);
  const lastArtifact = snapshot.lastFileWritten && git?.dirty
    ? { kind: 'file-write' as const, value: snapshot.lastFileWritten }
    : git?.commit
    ? { kind: 'commit' as const, value: git.commit }
    : snapshot.lastFileWritten
    ? { kind: 'file-write' as const, value: snapshot.lastFileWritten }
    : null;
  return { ...snapshot, runtime: 'codex', rollout, lastArtifact };
}

interface Options {
  readonly worktree?: string;
  readonly user: string;
  readonly sessions: number;
  readonly pretty: boolean;
  readonly stalledAfterMs: number;
}

function duration(value: string): number {
  const match = value.match(/^(\d+)(s|m|h)$/);
  if (!match) throw new Error('--stalled-after must be a duration such as 90s, 5m, or 1h');
  return Number(match[1]) * { s: 1_000, m: 60_000, h: 3_600_000 }[match[2] as 's' | 'm' | 'h'];
}

function printHelp(): void {
  console.log([
    'Usage:',
    '  deno task agentic:codex-status [options]',
    '',
    'Options:',
    '  --worktree <path>         Report branch/HEAD/upstream/dirty state.',
    '  --user <name>             WSL user. Default: codex.',
    '  --sessions <n>            Recent live sessions. Default: 5 (0 to skip).',
    '  --stalled-after <duration> Inactivity threshold. Default: 5m.',
    '  --pretty                   Human-readable output instead of JSON.',
  ].join('\n'));
}

function parseArgs(args: string[]): Options | null {
  args = normalizeTaskArguments(args);
  let worktree: string | undefined;
  let user = wslUser();
  let sessions = 5;
  let pretty = false;
  let stalledAfterMs = 300_000;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--worktree') worktree = requireValue(args, index++, arg);
    else if (arg === '--user') user = requireValue(args, index++, arg);
    else if (arg === '--sessions') sessions = Number(requireValue(args, index++, arg));
    else if (arg === '--stalled-after') {
      stalledAfterMs = duration(requireValue(args, index++, arg));
    } else if (arg === '--pretty') pretty = true;
    else if (arg === '--help') {
      printHelp();
      return null;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isFinite(sessions) || sessions < 0) throw new Error('--sessions must be >= 0');
  return { worktree, user, sessions, pretty, stalledAfterMs };
}

async function sessionGit(
  user: string,
  cwd: string | null,
): Promise<{ dirty: boolean; commit: string | null } | null> {
  if (!cwd) return null;
  const quoted = sq(cwd);
  const result = await wsl(
    user,
    `if git -C ${quoted} rev-parse --is-inside-work-tree >/dev/null 2>&1; then ` +
      `echo "COMMIT=$(git -C ${quoted} log -1 --format='%h %s' 2>/dev/null)"; ` +
      `echo "DIRTY=$(git -C ${quoted} status --porcelain 2>/dev/null | wc -l | tr -d ' ')"; fi`,
  );
  const commit = result.stdout.match(/^COMMIT=(.*)$/m)?.[1]?.trim() || null;
  const dirty = Number(result.stdout.match(/^DIRTY=(\d+)$/m)?.[1] ?? 0) > 0;
  return commit || dirty ? { commit, dirty } : null;
}

async function recentSessions(options: Options): Promise<CodexStatusSession[]> {
  const inventory = await wsl(
    options.user,
    `find ~/.codex/sessions -type f -name '*.jsonl' -printf '%T@ %p\\n' 2>/dev/null | ` +
      `sort -nr | head -n ${options.sessions} | sed -E 's/^[0-9.]+ //'`,
  );
  const paths = inventory.stdout.split('\n').filter(Boolean);
  const sessions: CodexStatusSession[] = [];
  for (const path of paths) {
    const content = await wsl(
      options.user,
      `{ head -n 1 ${sq(path)} 2>/dev/null; ` +
        `grep -F '\"type\":\"turn_context\"' ${sq(path)} 2>/dev/null | tail -n 1; ` +
        `tail -c 131072 ${sq(path)} 2>/dev/null; }`,
    );
    const stat = await wsl(options.user, `stat -c %Y ${sq(path)} 2>/dev/null`);
    const seconds = Number(stat.stdout);
    const mtime = Number.isFinite(seconds) ? new Date(seconds * 1_000) : new Date();
    const provisional = deriveCodexLiveSnapshot(
      content.stdout,
      path,
      new Date(),
      options.stalledAfterMs,
      mtime,
    );
    sessions.push(buildCodexStatusSession(
      content.stdout,
      path,
      new Date(),
      options.stalledAfterMs,
      mtime,
      await sessionGit(options.user, provisional.cwd),
    ));
  }
  return sessions;
}

type AgyStatusAgent = AgyAgentSnapshot & { readonly lastArtifact: CodexStatusArtifact | null };
type StatusAgent = CodexStatusSession | AgyStatusAgent;

async function recentAgyAgents(options: Options): Promise<AgyStatusAgent[]> {
  const indexResult = await wsl(
    options.user,
    `cat ~/.gemini/antigravity-cli/cache/last_conversations.json 2>/dev/null`,
  );
  if (!indexResult.stdout) return [];
  let index: ReadonlyMap<string, string>;
  try {
    index = parseAgyConversationIndex(indexResult.stdout);
  } catch {
    return [];
  }
  const worktreeByConversation = new Map([...index].map(([worktree, conversation]) => [
    conversation,
    worktree,
  ]));
  const inventory = await wsl(
    options.user,
    `find ~/.gemini/antigravity-cli/brain -path '*/logs/transcript.jsonl' -type f ` +
      `-printf '%T@ %p\\n' 2>/dev/null | sort -nr | head -n ${options.sessions}`,
  );
  const agents: AgyStatusAgent[] = [];
  for (const inventoryLine of inventory.stdout.split('\n').filter(Boolean)) {
    const path = inventoryLine.replace(/^[0-9.]+ /, '');
    const seconds = Number(inventoryLine.match(/^([0-9.]+)/)?.[1]);
    const conversation = path.match(/\/brain\/([^/]+)\//)?.[1];
    const worktree = conversation ? worktreeByConversation.get(conversation) : undefined;
    if (!conversation || !worktree || (options.worktree && options.worktree !== worktree)) continue;
    const transcript = await wsl(
      options.user,
      `{ head -n 1 ${sq(path)} 2>/dev/null; tail -c 131072 ${sq(path)} 2>/dev/null; }`,
    );
    const mtime = Number.isFinite(seconds) ? new Date(seconds * 1_000) : new Date();
    const snapshot = deriveAgySnapshot(
      transcript.stdout,
      conversation,
      worktree,
      path,
      new Date(),
      options.stalledAfterMs,
      mtime,
    );
    const git = await sessionGit(options.user, worktree);
    const lastArtifact = snapshot.lastFileWritten && git?.dirty
      ? { kind: 'file-write' as const, value: snapshot.lastFileWritten }
      : git?.commit
      ? { kind: 'commit' as const, value: git.commit }
      : snapshot.lastFileWritten
      ? { kind: 'file-write' as const, value: snapshot.lastFileWritten }
      : null;
    agents.push({ ...snapshot, lastArtifact });
  }
  return agents;
}

async function main(): Promise<void> {
  let options: Options | null;
  try {
    options = parseArgs(Deno.args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(2);
    return;
  }
  if (!options) return;
  const daemonResult = await wsl(
    options.user,
    `export PATH="$HOME/.local/bin:$PATH"; ` +
      `echo "VERSION=$(codex app-server daemon version 2>/dev/null | head -n1)"; ` +
      `echo "${CODEX_STATUS_PROCESS_TABLE_MARKER}"; ps -eo pid=,ppid=,args= 2>/dev/null`,
  );
  const home = options.user === wslUser() ? wslHome() : `/home/${options.user}`;
  const report: Record<string, unknown> = {
    daemon: parseCodexDaemonProbe(daemonResult.stdout, home),
  };
  if (options.worktree) {
    const info = await wslGitInfo(options.user, options.worktree);
    if (!info.found) {
      report.worktree = { worktree: options.worktree, found: false };
      console.log(
        options.pretty ? `worktree NOT FOUND: ${options.worktree}` : JSON.stringify(report),
      );
      Deno.exit(5);
    }
    report.worktree = {
      worktree: options.worktree,
      ...info,
      logsPath: await wslGitLogsPath(options.user, options.worktree),
    };
  }
  if (options.sessions > 0) {
    const codex = (await recentSessions(options)).filter((session) =>
      !options.worktree || session.cwd === options.worktree
    );
    const agy = await recentAgyAgents(options);
    report.sessions = codex;
    report.agents = [...codex, ...agy];
  }

  if (!options.pretty) {
    console.log(JSON.stringify(report));
    return;
  }
  const daemon = report.daemon as ReturnType<typeof parseCodexDaemonProbe>;
  console.log(
    `daemon  : version=${daemon.version ?? '?'} app-server-procs=${daemon.appServerProcesses}`,
  );
  const worktree = report.worktree as Record<string, unknown> | undefined;
  if (worktree) {
    console.log(
      `worktree: ${worktree.branch}@${worktree.head} upstream=${worktree.upstream} dirty=${worktree.dirty}`,
    );
    console.log(`          logs=${worktree.logsPath ?? '?'}`);
  }
  const sessions = (report.agents ?? []) as StatusAgent[];
  console.log(`agents  : ${sessions.length} recent`);
  for (const session of sessions) {
    const id = session.runtime === 'agy' ? session.conversationId : session.threadId;
    const worktreePath = session.runtime === 'agy' ? session.worktree : session.cwd;
    const doing = session.runtime === 'agy'
      ? session.currentStep
      : session.lastReasoning ?? session.lastActivity;
    const identity = session.runtime === 'agy'
      ? id
      : `${id} ${session.model ?? '?'} / ${session.effort ?? '?'}`;
    console.log(
      `  ${session.stateLabel.padEnd(16)} ${(session.runtime ?? 'codex').padEnd(5)} ${identity}`,
    );
    console.log(`    worktree: ${worktreePath ?? '?'}`);
    console.log(`    doing   : ${doing ?? '?'}`);
    console.log(
      `    artifact: ${
        session.lastArtifact ? `${session.lastArtifact.kind} ${session.lastArtifact.value}` : '?'
      }`,
    );
    if (session.runtime === 'agy') {
      if (session.issue) console.log(`    issue   : ${session.issue}`);
      if (session.lastNonZeroExit) {
        console.log(
          `    command : exit ${session.lastNonZeroExit.code} at step ${
            session.lastNonZeroExit.step ?? '?'
          }`,
        );
      }
    } else if (session.failure) console.log(`    failure : ${session.failure}`);
  }
}

if (import.meta.main) await main();
