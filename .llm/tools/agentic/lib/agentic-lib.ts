/**
 * agentic-lib.ts — shared primitives for the agentic orchestration suite.
 *
 * The supervisor delegates implementation slices to WSL Codex sessions and
 * evaluation work to OpenHands. Driving either by hand from Windows PowerShell
 * is fragile and token-expensive. This module centralizes the primitives the
 * suite tools share so the landmines are encoded once, in code:
 *
 *   1. PowerShell parses `<`, `>`, and `$(...)` inside a command string (the
 *      "'<' operator is reserved for future use" ParserError). FIX: everything
 *      shells out through `Deno.Command(bin, { args: [...] })` — an argv array
 *      that no shell parses. `wsl()` wraps `wsl.exe -u <user> -- bash -lc
 *      <script>`, so `<`/`>`/`$(...)` inside <script> are completely safe.
 *   2. PowerShell here-strings join lines with CRLF; a trailing `\r` inside a
 *      `bash -lc` string breaks `cd`/redirects silently. FIX: Deno writes LF,
 *      and `validateHandoffContract()` / staging strip `\r` defensively.
 *   3. The GitHub PAT must never touch disk or argv (classifier-enforced).
 *      FIX: `readTokenFromEnv()` pulls it from an env var the supervisor sets
 *      in-process; `githubRequest()` uses it only as an Authorization header and
 *      it is never logged.
 *
 * Pure functions (path/quote/validate/parse/eval/build) are exported separately
 * from the impure wrappers (`wsl`, `runBin`, `githubRequest`) so the bulk of the
 * behavior is unit-testable with no side effects. See `agentic-lib_test.ts`.
 */

// ---------------------------------------------------------------------------
// Path + shell quoting (pure)
// ---------------------------------------------------------------------------

/** Windows `C:\a\b` -> WSL `/mnt/c/a/b`; passthrough (normalized) for POSIX paths. */
export function winToWsl(p: string): string {
  const m = p.match(/^([A-Za-z]):[\\/](.*)$/);
  if (!m) return p.replace(/\\/g, '/');
  return `/mnt/${m[1].toLowerCase()}/${m[2].replace(/\\/g, '/')}`;
}

/** Single-quote a string for safe embedding inside a bash command. */
export function sq(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

// ---------------------------------------------------------------------------
// Command execution (impure)
// ---------------------------------------------------------------------------

export {
  buildWslCommand,
  type CommandPlan,
  type CommandResult,
  currentUsername,
  renderCommandPlan,
  resolveWslCommand,
  runBin,
} from '../../maint/wsl-command.ts';
import { resolveWslCommand, runBin } from '../../maint/wsl-command.ts';
import type { CommandResult } from '../../maint/wsl-command.ts';

/**
 * Run a bash script inside WSL as <user>. The script is passed as a single argv
 * entry to `bash -lc`, so PowerShell never sees `<`/`>`/`$(...)` — the suite's
 * structural fix for the reserved-`<` ParserError.
 */
export async function wsl(user: string, script: string): Promise<CommandResult> {
  const plan = await resolveWslCommand(user, script);
  return runBin(plan.bin, plan.args, { cwd: plan.cwd });
}

/**
 * Like {@link wsl} but sets the WSL working directory natively via `wsl.exe --cd`.
 *
 * Landmine: when wsl.exe is spawned with a Windows cwd (e.g. a `/mnt/c/...`
 * worktree), an in-script `cd /home/codex/...` can silently fail to stick —
 * the shell stays in the Windows-mapped directory, so cwd-relative `git` runs
 * against an unresolvable Windows `.git` file and every command comes back
 * empty. `--cd` sets the directory at the interop layer, before bash starts,
 * so it is immune to that quirk. Prefer this over `cd … && …` whenever the
 * launched process (e.g. `codex … send-message-v2`) derives its worktree from
 * the ambient cwd.
 */
export async function wslCd(
  user: string,
  cwd: string,
  script: string,
): Promise<CommandResult> {
  const plan = await resolveWslCommand(user, script, { cwd });
  return runBin(plan.bin, plan.args, { cwd: plan.cwd });
}

// ---------------------------------------------------------------------------
// Machine/environment configuration (portability seam)
// ---------------------------------------------------------------------------

/**
 * Read an env override, falling back to `fallback` when unset OR when this
 * process lacks `--allow-env` (in which case `Deno.env.get` throws `NotCapable`).
 * Swallowing the permission error is deliberate: the suite's CLIs are commonly
 * run with only `--allow-read --allow-run`, so an override read must never harden
 * into a new permission requirement. With the env var unset the returned value is
 * byte-identical to the previous hardcoded literal — this is a portability seam,
 * not a behavior change.
 */
function envOr(name: string, fallback: string): string {
  try {
    return Deno.env.get(name) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * WSL linux user the suite drives Codex under. Defaults to `codex` (this repo's
 * historical hardcoded value); override with `NETSCRIPT_WSL_USER` to run on a
 * machine whose WSL user differs. Unset ⇒ identical to the prior default.
 */
export function wslUser(): string {
  return envOr('NETSCRIPT_WSL_USER', 'codex');
}

/**
 * Home directory of {@link wslUser} inside WSL. Defaults to `/home/<wslUser>`
 * (i.e. `/home/codex` when the user is unchanged); override with
 * `NETSCRIPT_WSL_HOME` for a non-standard home. Unset ⇒ identical to the prior
 * hardcoded `/home/codex`.
 */
export function wslHome(): string {
  return envOr('NETSCRIPT_WSL_HOME', `/home/${wslUser()}`);
}

// ---------------------------------------------------------------------------
// Arg parsing helper (pure)
// ---------------------------------------------------------------------------

/** Read the value following a flag at `index`; throws if missing. */
export function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (value === undefined) throw new Error(`Missing value for ${flag}`);
  return value;
}

// ---------------------------------------------------------------------------
// Handoff contract validation (pure)
// ---------------------------------------------------------------------------

export interface ContractCheck {
  ok: boolean;
  useHarness: boolean;
  skillChapter: boolean;
  bytes: number;
  problems: string[];
}

/**
 * Every brief handed to a Codex session and every OpenHands dispatch prompt MUST
 * begin with `use harness` and carry a `## SKILL` chapter. CRLF is normalized
 * before the check so a CRLF brief never falsely fails.
 */
export function validateHandoffContract(content: string): ContractCheck {
  const normalized = content.replace(/\r/g, '');
  const useHarness = /^\s*use harness\b/i.test(normalized);
  const skillChapter = /^##\s+SKILL\b/m.test(normalized);
  const problems: string[] = [];
  if (!useHarness) problems.push('must begin with `use harness`');
  if (!skillChapter) problems.push('must contain a `## SKILL` chapter');
  return {
    ok: useHarness && skillChapter,
    useHarness,
    skillChapter,
    bytes: new TextEncoder().encode(normalized).length,
    problems,
  };
}

// ---------------------------------------------------------------------------
// Codex thread-log parsing (pure)
// ---------------------------------------------------------------------------

export const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export interface ThreadInfo {
  threadId: string | null;
  rollout: string | null;
  model: string | null;
  provider: string | null;
  effort: string | null;
  cwd: string | null;
  exited: number | null;
}

/**
 * Parse a `send-message-v2` launch log for the thread/session id. The reliable
 * signal is the rollout path the daemon prints — `rollout-<ts>-<uuid>.jsonl` —
 * whose trailing UUID *is* the thread id. We capture the rollout path first,
 * then the UUID before `.jsonl`; a `"thread":{"id":"..."}` JSON shape is the
 * fallback.
 */
export function parseThreadInfo(log: string): ThreadInfo {
  const rollout = log.match(
    new RegExp(`(/[^\\s"]*rollout-[0-9T:.-]+-${UUID}\\.jsonl)`),
  )?.[1] ?? null;
  const threadId = rollout?.match(new RegExp(`(${UUID})\\.jsonl$`))?.[1] ??
    log.match(
      new RegExp(`"thread"\\s*:\\s*\\{[^}]*?"id"\\s*:\\s*"(${UUID})"`),
    )?.[1] ??
    log.match(new RegExp(`\"(?:threadId|sessionId)\"\\s*:\\s*\"(${UUID})\"`))?.[1] ?? null;
  const model = log.match(/"model"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  const provider = log.match(/"(?:model_provider|modelProvider)"\s*:\s*"([^"]+)"/)?.[1] ??
    log.match(/model_provider:\s*"([^"]+)"/)?.[1] ?? null;
  const effort = log.match(/"(?:reasoning_effort|reasoningEffort)"\s*:\s*"?([A-Za-z]+)"?/)?.[1] ??
    log.match(/reasoning_effort:\s*Some\(([A-Za-z]+)\)/)?.[1] ?? null;
  const cwd = log.match(/(?:^|\W)CWD=([^\s"]+)/)?.[1] ??
    log.match(/"cwd"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  const exited = Number(
    log.match(/codex app-server exited: exit status:\s*(\d+)/)?.[1] ?? NaN,
  );
  return {
    threadId,
    rollout,
    model,
    provider,
    effort,
    cwd,
    exited: Number.isFinite(exited) ? exited : null,
  };
}

// ---------------------------------------------------------------------------
// Codex rollout turn-state parsing (pure)
// ---------------------------------------------------------------------------

/**
 * Rollout records that are post-turn bookkeeping and do NOT change idle/busy
 * state. A `token_count` event is emitted both mid-turn and as a trailing line
 * after `task_complete`, so it must be skipped when deciding the terminal event.
 */
const ROLLOUT_BOOKKEEPING = new Set(['token_count']);

export interface TurnState {
  /** Event type of the latest *meaningful* record (bookkeeping skipped), or null. */
  lastEvent: string | null;
  /** True when the thread's latest turn has completed (idle) — terminal `task_complete`. */
  turnComplete: boolean;
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

/**
 * Decide whether a Codex thread's latest turn has completed, from the TAIL of its
 * session rollout `.jsonl`. The daemon writes one JSON record per line; a turn
 * ends with a `task_complete` event (carried as `payload.type`, sometimes the
 * top-level `type`), optionally followed by a trailing `token_count` bookkeeping
 * line. We scan the tail bottom-up, skip bookkeeping, and report the first
 * meaningful event: `task_complete` ⇒ idle/done; anything else (`agent_message`,
 * `function_call`, `reasoning`, `response_item`, …) ⇒ a turn is still in flight.
 *
 * This is the finish signal `codex-watch.ts --mode turn` keys off — git refs only
 * tell you a commit landed, not that the agent stopped working. `tail` is the last
 * chunk of the file: a truncated leading line is tolerated (unparseable lines are
 * skipped). Pure and allocation-light so it is unit-testable without fs access.
 */
export function parseTurnComplete(tail: string): TurnState {
  const lines = tail.split('\n').map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    let ev: string | null = null;
    try {
      const parsed: unknown = JSON.parse(lines[i]);
      const record = objectRecord(parsed);
      const payload = objectRecord(record?.payload);
      ev = (typeof payload?.type === 'string' ? payload.type : null) ??
        (typeof record?.type === 'string' ? record.type : null);
    } catch {
      continue; // truncated/partial line (e.g. the first sliced line) — skip it
    }
    if (!ev || ROLLOUT_BOOKKEEPING.has(ev)) continue;
    return { lastEvent: ev, turnComplete: ev === 'task_complete' };
  }
  return { lastEvent: null, turnComplete: false };
}

// ---------------------------------------------------------------------------
// Git info (impure read) + push-safety (pure eval)
// ---------------------------------------------------------------------------

export interface GitInfo {
  found: boolean;
  branch: string;
  head: string;
  upstream: string;
  dirty: number;
}

/**
 * Read branch/head/upstream/dirty for a WSL worktree (read-only).
 *
 * Uses `git -C <worktree>` for every query rather than `cd <worktree>` + a
 * cwd-relative git. When this tool's `deno run` is spawned from a Windows cwd,
 * an in-script `cd` to a WSL path can silently fail to stick — the shell stays
 * in the `/mnt/c/...` mount, so cwd-relative git reads an unresolvable Windows
 * `.git` file and returns empty branch/head (which would trip push-safety with
 * a bogus "branch is ''"). `git -C` names the repo explicitly and is immune.
 */
export async function wslGitInfo(user: string, worktree: string): Promise<GitInfo> {
  const q = sq(worktree);
  const script = [
    `test -d ${q} || { echo "ERR_NO_WORKTREE"; exit 5; }`,
    `echo "BRANCH=$(git -C ${q} rev-parse --abbrev-ref HEAD 2>/dev/null)"`,
    `echo "HEAD=$(git -C ${q} rev-parse --short HEAD 2>/dev/null)"`,
    `echo "UPSTREAM=$(git -C ${q} rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo NONE)"`,
    `echo "DIRTY=$(git -C ${q} status --porcelain 2>/dev/null | wc -l | tr -d ' ')"`,
  ].join('; ');
  const r = await wsl(user, script);
  if (r.stdout.includes('ERR_NO_WORKTREE')) {
    return { found: false, branch: '', head: '', upstream: '', dirty: 0 };
  }
  const get = (k: string) => r.stdout.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim() ?? '';
  return {
    found: true,
    branch: get('BRANCH'),
    head: get('HEAD'),
    upstream: get('UPSTREAM'),
    dirty: Number(get('DIRTY') || '0'),
  };
}

export interface SafetyExpectation {
  branch?: string;
  expectBase?: string;
}

export interface SafetyVerdict {
  ok: boolean;
  code: number;
  problems: string[];
}

/**
 * Push-safety: a worktree branched off an umbrella must have NO upstream, so a
 * stray bare `git push` (push.default=upstream) fails loudly instead of landing
 * on the umbrella branch. Optionally assert branch name and base sha.
 * Returns code 5 (worktree not found), 4 (safety violation), or 0 (clean).
 */
export function evaluateGitSafety(info: GitInfo, exp: SafetyExpectation): SafetyVerdict {
  if (!info.found) {
    return { ok: false, code: 5, problems: ['worktree not found'] };
  }
  const problems: string[] = [];
  if (info.upstream !== 'NONE') {
    problems.push(
      `worktree has upstream '${info.upstream}' — a bare push could corrupt it (push-safety requires NONE; push via explicit refspec)`,
    );
  }
  if (exp.branch && info.branch !== exp.branch) {
    problems.push(`branch is '${info.branch}', expected '${exp.branch}'`);
  }
  if (exp.expectBase && info.head !== exp.expectBase) {
    problems.push(`HEAD is '${info.head}', expected base '${exp.expectBase}'`);
  }
  return { ok: problems.length === 0, code: problems.length === 0 ? 0 : 4, problems };
}

/**
 * Resolve a worktree's gitdir `logs` directory — the path `Deno.watchFs` should
 * watch for ref/commit events. For a linked worktree this resolves under the
 * main repo's `.git/worktrees/<name>/logs`.
 */
export async function wslGitLogsPath(user: string, worktree: string): Promise<string | null> {
  const r = await wsl(
    user,
    `cd ${sq(worktree)} 2>/dev/null && git rev-parse --absolute-git-dir 2>/dev/null`,
  );
  if (r.code !== 0 || !r.stdout) return null;
  return `${r.stdout}/logs`;
}

// ---------------------------------------------------------------------------
// Repo target (pure)
// ---------------------------------------------------------------------------

export interface RepoSlug {
  owner: string;
  repo: string;
}

/** Parse `owner/name` into {owner, repo}; throws on malformed input. */
export function parseRepoSlug(slug: string): RepoSlug {
  const m = slug.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!m) throw new Error(`Invalid repo slug '${slug}'; expected owner/name`);
  return { owner: m[1], repo: m[2] };
}

// ---------------------------------------------------------------------------
// OpenHands dispatch comment (pure)
// ---------------------------------------------------------------------------

/** Formal evaluator phase carried with an immutable PR head. */
export type OpenHandsDispatchPhase = 'plan' | 'impl';

export interface DispatchOptions {
  model?: string;
  outputMode?: string;
  iterations?: number | string;
  provider?: string;
  effort?: string;
  phase?: OpenHandsDispatchPhase;
  head?: string;
  prompt: string;
}

/**
 * Build the manual trigger comment body. The command token begins the first line, that line contains
 * only `name=value` arguments, and the prompt begins after it. This is the exact grammar enforced by
 * the issue-comment authorization policy.
 */
export function buildOpenHandsComment(o: DispatchOptions): string {
  const hasPhase = o.phase !== undefined;
  const hasHead = o.head !== undefined;
  if (hasPhase !== hasHead) {
    throw new Error('Formal OpenHands dispatch requires phase and head together');
  }
  if (hasPhase && o.phase !== 'plan' && o.phase !== 'impl') {
    throw new Error('Formal OpenHands dispatch phase must be plan or impl');
  }
  if (hasHead && !/^[0-9a-f]{40}$/.test(o.head!)) {
    throw new Error('Formal OpenHands dispatch head must be a 40-character lowercase hex SHA');
  }

  const tokens = ['@openhands-agent'];
  if (o.model) tokens.push(`model=${o.model}`);
  if (o.provider) tokens.push(`provider=${o.provider}`);
  if (o.effort) tokens.push(`effort=${o.effort}`);
  if (o.outputMode) tokens.push(`output=${o.outputMode}`);
  if (o.iterations !== undefined && String(o.iterations) !== '') {
    tokens.push(`iterations=${o.iterations}`);
  }
  if (hasPhase && hasHead) tokens.push(`phase=${o.phase}`, `head=${o.head}`);
  return `${tokens.join(' ')}\n\n${o.prompt.replace(/\r/g, '')}`;
}

// ---------------------------------------------------------------------------
// OpenHands verdict output contract (pure)
// ---------------------------------------------------------------------------

/** HTML marker that tags a prompt as already carrying the verdict output contract. */
export const VERDICT_CONTRACT_MARKER = '<!-- openhands-verdict-contract -->';

/** The machine-readable verdict tokens the output contract allows. */
export const OPENHANDS_VERDICT_TOKENS = [
  'PASS',
  'FAIL_FIX',
  'FAIL_RESCOPE',
  'FAIL_DEBT',
  'FAIL_PLAN',
  'NONE',
] as const;

const VERDICT_CONTRACT_EPILOGUE = [
  '---',
  '',
  VERDICT_CONTRACT_MARKER,
  '',
  '## OUTPUT CONTRACT (mandatory — verdict first)',
  '',
  '1. Post the verdict PR comment IMMEDIATELY after you form the verdict — BEFORE any',
  '   optional deep-dive, extra verification, or long context dump. Iteration budgets',
  '   exhaust; a verdict comment deferred to the end of the run is frequently lost.',
  '2. That PR comment MUST start with the formal header line, exactly:',
  '   **[PHASE: <phase>] [VERDICT: <verdict>]**',
  '   where <phase> is your eval phase (e.g. IMPL-EVAL, PLAN-EVAL) and <verdict> is one',
  '   of PASS, FAIL_FIX, FAIL_RESCOPE, FAIL_DEBT, FAIL_PLAN.',
  '3. ALWAYS end BOTH the verdict PR comment AND your summary file with one final',
  '   machine-readable line of the exact form:',
  '   OPENHANDS_VERDICT: <verdict>',
  '   using a literal token from: PASS, FAIL_FIX, FAIL_RESCOPE, FAIL_DEBT, FAIL_PLAN,',
  '   NONE. Use NONE only when no verdict could be reached.',
].join('\n');

/**
 * Append the deterministic verdict output contract to a dispatch prompt: post the
 * formal verdict comment EARLY (before optional deep-dives, which historically eat
 * the iteration budget and leave only a synthesized summary) and always end both
 * the PR comment and the summary file with a machine-readable
 * `OPENHANDS_VERDICT: <token>` line that watchers can grep deterministically.
 * Idempotent: a prompt already carrying {@link VERDICT_CONTRACT_MARKER} is
 * returned unchanged. The epilogue uses only `<placeholder>` forms, so the
 * trigger comment itself can never satisfy a watcher's verdict regexes.
 */
export function appendVerdictContractEpilogue(prompt: string): string {
  if (prompt.includes(VERDICT_CONTRACT_MARKER)) return prompt;
  return `${prompt.replace(/\s+$/, '')}\n\n${VERDICT_CONTRACT_EPILOGUE}\n`;
}

// ---------------------------------------------------------------------------
// OpenHands status parsing (pure)
// ---------------------------------------------------------------------------

export const OPENHANDS_MARKER = '<!-- openhands-agent-summary -->';

export interface OpenHandsStatus {
  heading: string | null;
  verdict: string | null;
  model: string | null;
  provider: string | null;
  jobStatus: string | null;
  runUrl: string | null;
  isFinal: boolean;
  /** Formal evaluator phase from the terminal machine marker. */
  phase: 'plan' | 'impl' | null;
  /** Immutable head evaluated by the formal phase run. */
  evaluatedHead: string | null;
  /** Formal verdict from the terminal machine marker. */
  formalVerdict: string | null;
}

/**
 * Parse an OpenHands status/summary comment body (the `## OpenHands Agent — X`
 * comment the workflow owns). Maps the heading to a verdict slug; `Running` is
 * the only non-final heading (the acknowledge comment).
 */
export function parseOpenHandsStatusComment(body: string): OpenHandsStatus {
  const heading = body.match(/^##\s+OpenHands Agent\s+—\s+(.+?)\s*$/m)?.[1] ?? null;
  const model = body.match(/^Model:\s*`?([^`\n]+?)`?\s*$/m)?.[1]?.trim() ?? null;
  const provider = body.match(/^Provider:\s*`?([^`\n]+?)`?\s*$/m)?.[1]?.trim() ?? null;
  const jobStatus = body.match(/^Job status:\s*(.+?)\s*$/m)?.[1]?.trim() ?? null;
  const runUrl = body.match(/Run:\s*(https?:\/\/\S+)/)?.[1] ?? null;
  const headingToVerdict: Record<string, string> = {
    'Running': 'running',
    'Completed': 'completed',
    'Completed — no agent summary': 'summary-missing',
    'Agent failed': 'agent-failed',
    'Bootstrap failed': 'bootstrap-failed',
    'Did not run': 'not-run',
  };
  const verdict = heading ? (headingToVerdict[heading] ?? heading.toLowerCase()) : null;
  let marker: Record<string, unknown> | null = null;
  const markerText = body.match(/<!--\s*openhands-run:\s*(\{[^\r\n]*\})\s*-->/)?.[1];
  if (markerText) {
    try {
      const parsed = JSON.parse(markerText);
      if (typeof parsed === 'object' && parsed !== null) marker = parsed;
    } catch {
      // Malformed provenance is represented as absent and therefore fails merge gates closed.
    }
  }
  const rawPhase = marker?.phase;
  const rawHead = marker?.evaluated_head;
  const rawFormalVerdict = marker?.verdict;
  return {
    heading,
    verdict,
    model,
    provider,
    jobStatus,
    runUrl,
    isFinal: heading !== null && heading !== 'Running',
    phase: rawPhase === 'plan' || rawPhase === 'impl' ? rawPhase : null,
    evaluatedHead: typeof rawHead === 'string' && /^[0-9a-f]{40}$/.test(rawHead) ? rawHead : null,
    formalVerdict: typeof rawFormalVerdict === 'string' ? rawFormalVerdict : null,
  };
}

export type ImplEvalMergeBlock =
  | 'no-eval-comment'
  | 'eval-not-final'
  | 'eval-not-impl'
  | 'eval-stale-head'
  | 'eval-not-pass'
  | 'eval-invalid-marker';

export type CurrentHeadImplEvalSelection<T extends CommentLike> =
  | { ok: true; comment: T; status: OpenHandsStatus }
  | { ok: false; reason: 'none' | 'malformed-marker' | 'ambiguous-marker' };

/**
 * Select the latest terminal formal IMPL evaluation for an immutable PR head.
 *
 * Valid non-evaluator OpenHands summaries (`phase` and `evaluated_head` both null) are ignored, so
 * later generic agent runs cannot hide a prior evaluator verdict. A malformed or multiply-marked
 * workflow summary fails closed instead of allowing an older PASS to mask corrupt provenance.
 */
export function selectLatestCurrentHeadImplEval<T extends CommentLike>(
  comments: T[],
  currentHead: string,
): CurrentHeadImplEvalSelection<T> {
  const candidates: Array<{ comment: T; status: OpenHandsStatus; index: number }> = [];
  for (const [index, comment] of comments.entries()) {
    const body = comment.body ?? '';
    if (!body.includes(OPENHANDS_MARKER)) continue;
    const markers = [...body.matchAll(/<!--\s*openhands-run:\s*(\{[^\r\n]*\})\s*-->/g)];
    const markerTokens = body.match(/<!--\s*openhands-run:/g)?.length ?? 0;
    if (markerTokens > 1) return { ok: false, reason: 'ambiguous-marker' };
    if (markerTokens === 1 && markers.length !== 1) {
      return { ok: false, reason: 'malformed-marker' };
    }
    if (markers.length === 0) continue; // legacy summary without the v2 marker

    let marker: Record<string, unknown>;
    try {
      const parsed = JSON.parse(markers[0][1]);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ok: false, reason: 'malformed-marker' };
      }
      marker = parsed;
    } catch {
      return { ok: false, reason: 'malformed-marker' };
    }
    const phase = marker.phase;
    const evaluatedHead = marker.evaluated_head;
    const nonEval = (phase === null || phase === undefined) &&
      (evaluatedHead === null || evaluatedHead === undefined);
    const formal = (phase === 'plan' || phase === 'impl') &&
      typeof evaluatedHead === 'string' && /^[0-9a-f]{40}$/.test(evaluatedHead);
    if (!nonEval && !formal) return { ok: false, reason: 'malformed-marker' };
    if (nonEval) continue;

    const status = parseOpenHandsStatusComment(body);
    if (status.phase === 'impl' && status.evaluatedHead === currentHead && status.isFinal) {
      candidates.push({ comment, status, index });
    }
  }
  const selected = candidates.sort((a, b) => {
    const time = String(a.comment.created_at ?? '').localeCompare(
      String(b.comment.created_at ?? ''),
    );
    return time || a.index - b.index;
  }).at(-1);
  return selected
    ? { ok: true, comment: selected.comment, status: selected.status }
    : { ok: false, reason: 'none' };
}

/** Require one terminal IMPL PASS whose marker names the PR's current immutable head. */
export function evaluateCurrentHeadImplEvalGate(
  commentExists: boolean,
  status: OpenHandsStatus,
  currentHead: string,
): { ok: true } | { ok: false; blocked: ImplEvalMergeBlock } {
  if (!commentExists) return { ok: false, blocked: 'no-eval-comment' };
  if (!status.isFinal) return { ok: false, blocked: 'eval-not-final' };
  if (status.phase !== 'impl') return { ok: false, blocked: 'eval-not-impl' };
  if (status.evaluatedHead !== currentHead) return { ok: false, blocked: 'eval-stale-head' };
  if (status.formalVerdict !== 'PASS') return { ok: false, blocked: 'eval-not-pass' };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Pull-request lifecycle (pure)
// ---------------------------------------------------------------------------

export type MergeMethod = 'merge' | 'squash' | 'rebase';

export interface MergeSpec {
  method: MergeMethod;
  title?: string;
  message?: string;
  /** Optional head-sha guard: GitHub rejects the merge if the PR tip moved. */
  sha?: string;
}

/** Build the JSON body for `PUT /repos/:owner/:repo/pulls/:n/merge`. */
export function buildMergeBody(s: MergeSpec): Record<string, unknown> {
  return {
    merge_method: s.method,
    ...(s.title ? { commit_title: s.title } : {}),
    ...(s.message ? { commit_message: s.message } : {}),
    ...(s.sha ? { sha: s.sha } : {}),
  };
}

// ---------------------------------------------------------------------------
// Evaluator verdict parsing (pure)
// ---------------------------------------------------------------------------

export interface EvalVerdict {
  kind: 'IMPL' | 'PLAN' | null;
  /** PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT | FAIL_PLAN | … (null if absent). */
  verdict: string | null;
  isPass: boolean;
  isFail: boolean;
}

/**
 * Extract an IMPL-EVAL / PLAN-EVAL verdict from an evaluator comment body.
 *
 * Two accepted shapes, in priority order:
 *   1. **Canonical** `(IMPL|PLAN)-EVAL: PASS|FAIL_*` — the form our dispatch
 *      prompts request (`**Verdict: IMPL-EVAL: PASS**`). A `Verdict:`-prefixed
 *      occurrence wins over an instructional echo elsewhere in the body, and the
 *      `kind` (IMPL/PLAN) is recovered.
 *   2. **Standalone** `VERDICT: PASS | PASS-WITH-NITS | FAIL | FAIL_*` — the form
 *      some evaluator prompts request when they don't restate IMPL/PLAN. `kind`
 *      is unknown (null). `PASS-WITH-NITS` counts as a pass (nits are
 *      non-blocking by definition).
 *
 * Both shapes are guarded against a *menu echo* — an instruction line that lists
 * the options (`VERDICT: PASS | FAIL | …`) is never parsed as a verdict, via a
 * negative lookahead for a trailing `|`. The prompt text itself (which also
 * contains `IMPL-EVAL: PASS`) is never the parse target — only the posted result
 * comment is, since {@link selectLatestOpenHandsComment} isolates it first.
 */
export function parseEvalVerdict(body: string): EvalVerdict {
  // 1. Canonical kinded token.
  const canon = /(IMPL|PLAN)-EVAL:\s*(PASS|FAIL_[A-Z]+)/;
  const cm = body.match(new RegExp(`Verdict[^\\n]*?${canon.source}`, 'i')) ??
    body.match(canon);
  if (cm) {
    const kind = cm[1].toUpperCase() as 'IMPL' | 'PLAN';
    const verdict = cm[2].toUpperCase();
    return { kind, verdict, isPass: verdict === 'PASS', isFail: verdict.startsWith('FAIL') };
  }
  // 2. Standalone `VERDICT: <token>` (longest alternatives first so `PASS-WITH-NITS`
  //    and `FAIL_*` win over their bare prefixes; `(?!\s*\|)` skips the menu echo).
  const bare = body.match(
    /VERDICT:\s*\**\s*(PASS-WITH-NITS|PASS|FAIL_[A-Z]+|FAIL)\b(?!\s*\|)/i,
  );
  if (bare) {
    const verdict = bare[1].toUpperCase();
    const isPass = verdict === 'PASS' || verdict === 'PASS-WITH-NITS';
    return { kind: null, verdict, isPass, isFail: verdict.startsWith('FAIL') };
  }
  return { kind: null, verdict: null, isPass: false, isFail: false };
}

// ---------------------------------------------------------------------------
// Comment selection (pure)
// ---------------------------------------------------------------------------

export interface CommentLike {
  body?: string | null;
  // deno-lint-ignore camelcase
  created_at?: string;
}

/**
 * Select the most recent OpenHands summary comment (the one the workflow tags
 * with {@link OPENHANDS_MARKER}) from a chronological comments array. The GitHub
 * list endpoint returns comments oldest-first, so the last tagged entry is the
 * latest run's summary. Returns null when none is tagged yet (eval still pending).
 */
export function selectLatestOpenHandsComment<T extends CommentLike>(comments: T[]): T | null {
  const tagged = comments.filter((c) => (c.body ?? '').includes(OPENHANDS_MARKER));
  return tagged.length ? tagged[tagged.length - 1] : null;
}

// ---------------------------------------------------------------------------
// Layered verdict extraction (pure)
// ---------------------------------------------------------------------------

/** A PR issue comment reduced to the fields verdict extraction needs. */
export interface VerdictSourceComment {
  body: string;
  url: string;
  /** ISO timestamp (`created_at`); used to order comments newest-first. */
  createdAt: string;
}

export type VerdictConfidence = 'exact' | 'heuristic';

export interface ExtractedVerdict {
  /** PASS | FAIL_FIX | FAIL_RESCOPE | FAIL_DEBT | FAIL_PLAN | NONE (or bare FAIL, heuristic only). */
  verdict: string;
  confidence: VerdictConfidence;
  /** html_url of the comment the verdict was extracted from. */
  url: string;
}

export type VerdictMarkerState = 'parsed' | 'absent' | 'unparseable';

export interface MachineVerdictInspection {
  state: VerdictMarkerState;
  verdict: string | null;
}

export interface VerdictExtractionResult {
  state: VerdictMarkerState;
  extracted: ExtractedVerdict | null;
}

/**
 * Machine-readable contract line: `OPENHANDS_VERDICT: <token>` at line start.
 * Tolerates blockquotes, leading markdown headings/emphasis, and an evaluator-
 * habit `Verdict:` prefix — observed in prod (PR #475):
 * `**Verdict: OPENHANDS_VERDICT: PASS**`.
 */
const MACHINE_VERDICT_LINE_RE =
  /^[ \t]*(?:>[ \t]*)*(?:#{1,6}[ \t]+)?[*_`]*(?:Verdict[*_`]*[ \t]*:?[ \t]*[*_`]*)?OPENHANDS_VERDICT[ \t]*:[ \t]*[*_`]*(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|NONE)[*_`]*[ \t]*$/;
const MACHINE_VERDICT_MARKER_RE = /OPENHANDS_VERDICT[ \t]*:/;

/** Inspect one output body without conflating a missing marker with a malformed emitted marker. */
export function inspectMachineVerdict(text: string): MachineVerdictInspection {
  let inFence = false;
  let markerSeen = false;
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || line.includes('<')) continue;
    if (MACHINE_VERDICT_MARKER_RE.test(line)) markerSeen = true;
    const match = line.match(MACHINE_VERDICT_LINE_RE);
    if (match) return { state: 'parsed', verdict: match[1] };
  }
  return { state: markerSeen ? 'unparseable' : 'absent', verdict: null };
}

/**
 * Decorated verdict line without the machine marker: `**Verdict**: \`FAIL_FIX\``
 * — the whole line is the verdict statement (observed in prod, PR #476). Only
 * exact harness tokens match; GitHub review vocabulary (CHANGES_REQUESTED,
 * APPROVED) never does, by design — that drift must surface as NONE.
 */
const DECORATED_VERDICT_RE =
  /^[\s>]*[*_`]*Verdict[*_`]*\s*:\s*[*_`\s]*(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN)[*_`.\s]*$/im;

/** Formal evaluator header: `**[PHASE: IMPL-EVAL] [VERDICT: PASS]**`. */
const FORMAL_HEADER_RE =
  /\*\*\s*\[PHASE:\s*[A-Z][A-Z _-]*EVAL\]\s*\[VERDICT:\s*(PASS|FAIL_[A-Z_]+|NONE)\s*\]\s*\*\*/;

/** Verdict token used by the fallback heuristics (bare FAIL accepted; menu echoes rejected). */
const HEURISTIC_TOKEN_RE = /\b(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|FAIL)\b(?!\s*\|)/;

/**
 * A dispatch/trigger comment must never be read as a verdict: it quotes the
 * output-contract template (`[VERDICT: <verdict>]`, `OPENHANDS_VERDICT: <verdict>`)
 * and would otherwise false-positive every watcher poll.
 */
function isTriggerOrTemplateComment(body: string): boolean {
  return body.includes('@openhands-agent') ||
    body.includes('<verdict>') ||
    /\[VERDICT:\s*</i.test(body) ||
    /OPENHANDS_VERDICT:\s*</.test(body);
}

/**
 * Fallback heuristics for a synthesized `<!-- openhands-agent-summary -->` body
 * whose verdict is present but not in the formal form. Tried in order:
 *   a. a `## Verdict` section — token within the heading's next few lines;
 *   b. an inline `**Verdict: PASS.**` / `Verdict: PASS` phrase;
 *   c. a standalone uppercase token within a short window of the word "verdict"
 *      (a context-dump mention). Plain PASS/FAIL prose away from "verdict" never
 *      matches.
 */
function heuristicVerdict(body: string): string | null {
  // a. `## Verdict` section: token in the heading line + next 4 lines.
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s*Verdict\b/i.test(lines[i].trim())) {
      const m = lines.slice(i, i + 5).join('\n').match(HEURISTIC_TOKEN_RE);
      if (m) return m[1];
    }
  }
  // b. inline `**Verdict: PASS.**` / `Verdict: FAIL_FIX` / `**Verdict**: \`FAIL_FIX\`` phrase.
  const inline = body.match(
    /[*_`]{0,3}[Vv]erdict[*_`]{0,3}\s*:?\s*[*_`\s]{0,4}(PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|FAIL)\b(?!\s*\|)/,
  );
  if (inline) return inline[1];
  // c. token near the word "verdict" (buried in a context dump).
  const lower = body.toLowerCase();
  for (let idx = lower.indexOf('verdict'); idx !== -1; idx = lower.indexOf('verdict', idx + 7)) {
    const m = body.slice(Math.max(0, idx - 80), idx + 120).match(HEURISTIC_TOKEN_RE);
    if (m) return m[1];
  }
  return null;
}

/**
 * Layered verdict extraction over a PR's issue comments (any order; sorted by
 * `createdAt` internally, matched newest-first). Priority:
 *   1. the machine-readable `OPENHANDS_VERDICT: <token>` contract line (exact);
 *   2. the formal `**[PHASE: …-EVAL] [VERDICT: X]**` header (exact);
 *   3. a full-line decorated verdict (`**Verdict**: \`FAIL_FIX\``) in ANY
 *      non-trigger comment — evaluator-authored verdict comments observed in
 *      prod carry no machine marker (heuristic);
 *   4. {@link heuristicVerdict} fallbacks, restricted to comments carrying
 *      {@link OPENHANDS_MARKER} (the runner's synthesized summary).
 * A higher layer in ANY comment beats a lower layer in a newer one. Trigger and
 * template comments are excluded up front ({@link isTriggerOrTemplateComment}).
 */
export function extractVerdictResult(comments: VerdictSourceComment[]): VerdictExtractionResult {
  const newestFirst = comments
    .filter((c) => !isTriggerOrTemplateComment(c.body))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  let unparseableMarkerSeen = false;
  for (const c of newestFirst) {
    const inspection = inspectMachineVerdict(c.body);
    if (inspection.state === 'parsed' && inspection.verdict !== null) {
      return {
        state: 'parsed',
        extracted: { verdict: inspection.verdict, confidence: 'exact', url: c.url },
      };
    }
    if (inspection.state === 'unparseable') unparseableMarkerSeen = true;
  }
  for (const c of newestFirst) {
    const m = c.body.match(FORMAL_HEADER_RE);
    if (m) {
      return {
        state: 'parsed',
        extracted: { verdict: m[1], confidence: 'exact', url: c.url },
      };
    }
  }
  for (const c of newestFirst) {
    const m = c.body.match(DECORATED_VERDICT_RE);
    if (m) {
      return {
        state: 'parsed',
        extracted: { verdict: m[1].toUpperCase(), confidence: 'heuristic', url: c.url },
      };
    }
  }
  for (const c of newestFirst) {
    if (!c.body.includes(OPENHANDS_MARKER)) continue;
    const v = heuristicVerdict(c.body);
    if (v) {
      return {
        state: 'parsed',
        extracted: { verdict: v, confidence: 'heuristic', url: c.url },
      };
    }
  }
  return { state: unparseableMarkerSeen ? 'unparseable' : 'absent', extracted: null };
}

/** Compatibility view for callers that only need the extracted verdict, if any. */
export function extractVerdict(comments: VerdictSourceComment[]): ExtractedVerdict | null {
  return extractVerdictResult(comments).extracted;
}

// ---------------------------------------------------------------------------
// GitHub REST and token resolution: owned by the release tools, re-exported here
// for the agentic tools that still call them.
// ---------------------------------------------------------------------------

export {
  buildGithubTokenResolutionError,
  buildMissingGithubNetPermissionMessage,
  buildPullRequestBody,
  formatGithubTokenAttempt,
  GITHUB_NET_PERMISSION_FLAG,
  GITHUB_TOKEN_ENV_CANDIDATES,
  githubField,
  githubRequest,
  type GitHubResponse,
  isMissingGithubNetPermission,
  parseGithubHostsOauthToken,
  type PullRequestSpec,
  readTokenFromEnv,
  type ResolvedGithubToken,
  resolveGithubToken,
  type ResolveTokenOptions,
  validateGithubToken,
} from '../../release/github-api.ts';
