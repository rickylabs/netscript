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

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Run an arbitrary binary via Deno.Command (argv array — no shell parsing).
 * Returns trimmed decoded stdout/stderr and the exit code.
 */
export async function runBin(
  bin: string,
  args: string[],
  opts: { cwd?: string } = {},
): Promise<CommandResult> {
  const out = await new Deno.Command(bin, {
    args,
    cwd: opts.cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const dec = new TextDecoder();
  return {
    code: out.code,
    stdout: dec.decode(out.stdout).trim(),
    stderr: dec.decode(out.stderr).trim(),
  };
}

/**
 * Run a bash script inside WSL as <user>. The script is passed as a single argv
 * entry to `bash -lc`, so PowerShell never sees `<`/`>`/`$(...)` — the suite's
 * structural fix for the reserved-`<` ParserError.
 */
export function wsl(user: string, script: string): Promise<CommandResult> {
  return runBin('wsl.exe', ['-u', user, '--', 'bash', '-lc', script]);
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
export function wslCd(user: string, cwd: string, script: string): Promise<CommandResult> {
  return runBin('wsl.exe', ['-u', user, '--cd', cwd, '--', 'bash', '-lc', script]);
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
    )?.[1] ?? null;
  const model = log.match(/"model"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  const cwd = log.match(/(?:^|\W)CWD=([^\s"]+)/)?.[1] ??
    log.match(/"cwd"\s*:\s*"([^"]+)"/)?.[1] ?? null;
  const exited = Number(
    log.match(/codex app-server exited: exit status:\s*(\d+)/)?.[1] ?? NaN,
  );
  return {
    threadId,
    rollout,
    model,
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
      // deno-lint-ignore no-explicit-any
      const o = JSON.parse(lines[i]) as any;
      ev = (o?.payload && typeof o.payload === 'object' && typeof o.payload.type === 'string'
        ? o.payload.type
        : null) ?? (typeof o?.type === 'string' ? o.type : null);
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

export interface DispatchOptions {
  model?: string;
  outputMode?: string;
  iterations?: number | string;
  provider?: string;
  prompt: string;
}

/**
 * Build the `@openhands-agent` trigger comment body. The workflow's matcher reads
 * `name=value` / `name: value` tokens anywhere in the comment, and the
 * issue_comment trigger requires the literal `@openhands-agent` mention.
 */
export function buildOpenHandsComment(o: DispatchOptions): string {
  const tokens = ['@openhands-agent'];
  if (o.model) tokens.push(`model=${o.model}`);
  if (o.provider) tokens.push(`provider=${o.provider}`);
  if (o.outputMode) tokens.push(`output=${o.outputMode}`);
  if (o.iterations !== undefined && String(o.iterations) !== '') {
    tokens.push(`iterations=${o.iterations}`);
  }
  return `${tokens.join(' ')}\n\n${o.prompt.replace(/\r/g, '')}`;
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
  return {
    heading,
    verdict,
    model,
    provider,
    jobStatus,
    runUrl,
    isFinal: heading !== null && heading !== 'Running',
  };
}

// ---------------------------------------------------------------------------
// Pull-request lifecycle (pure)
// ---------------------------------------------------------------------------

export interface PullRequestSpec {
  title: string;
  head: string;
  base: string;
  body: string;
  draft?: boolean;
}

/** Build the JSON body for `POST /repos/:owner/:repo/pulls`. */
export function buildPullRequestBody(s: PullRequestSpec): Record<string, unknown> {
  return {
    title: s.title,
    head: s.head,
    base: s.base,
    body: s.body,
    ...(s.draft ? { draft: true } : {}),
  };
}

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
// GitHub REST (impure; token from env, never logged)
// ---------------------------------------------------------------------------

/** Read a GitHub token from an env var the supervisor sets in-process. Never logged. */
export function readTokenFromEnv(envName: string): string | null {
  return Deno.env.get(envName) ?? null;
}

/** Env vars, in priority order, that may carry a GitHub token in this environment. */
export const GITHUB_TOKEN_ENV_CANDIDATES = [
  'GH_TOKEN',
  'GITHUB_TOKEN',
  'GH_PAT',
  'GITHUB_PAT',
  'PAT_TOKEN',
  'GITHUB_MCP_PAT',
] as const;

export interface ResolvedGithubToken {
  /** The bearer token. Use in-process only; never log, print, or persist. */
  token: string;
  /** Human-readable provenance, e.g. `gh:wsl (rickylabs)`. Safe to log. */
  source: string;
}

export interface ResolveTokenOptions {
  /** Env var to try before the standard candidates. */
  preferEnv?: string;
  /** WSL user whose `gh` login to consult. Default: codex. */
  wslUser?: string;
  /** Validate each candidate against GET /user before accepting. Default: true. */
  validate?: boolean;
  /** Bound on the GCM `git credential fill` fallback (anti-hang). Default: 20000ms. */
  gcmTimeoutMs?: number;
  /** Skip subprocess sources (gh / GCM) — env-only. Default: false. */
  envOnly?: boolean;
}

/**
 * Confirm a candidate token actually works by calling GET /user. Returns the
 * authenticated login on success, or null on any non-2xx / network error. The
 * token is used only as the Authorization header.
 */
export async function validateGithubToken(token: string): Promise<string | null> {
  try {
    const res = await githubRequest('GET', '/user', token);
    const login = res.ok && res.body && typeof res.body.login === 'string' ? res.body.login : null;
    return login;
  } catch {
    return null;
  }
}

/** Run a subprocess, returning trimmed stdout, or null on failure / missing --allow-run. */
async function runCapture(cmd: string, args: string[]): Promise<string | null> {
  try {
    const status = await Deno.permissions.query({ name: 'run', command: cmd });
    if (status.state !== 'granted') return null;
    const out = await new Deno.Command(cmd, {
      args,
      stdout: 'piped',
      stderr: 'null',
      stdin: 'null',
    }).output();
    if (!out.success) return null;
    const text = new TextDecoder().decode(out.stdout).trim();
    return text.length ? text : null;
  } catch {
    return null;
  }
}

/** Bounded, non-interactive GCM credential fill. Never hangs; returns the password line or null. */
async function gcmCredentialFill(timeoutMs: number): Promise<string | null> {
  try {
    const status = await Deno.permissions.query({ name: 'run', command: 'git' });
    if (status.state !== 'granted') return null;
    const child = new Deno.Command('git', {
      args: [
        '-c',
        'credential.interactive=false',
        '-c',
        'credential.guiPrompt=false',
        'credential',
        'fill',
      ],
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'null',
      env: { GCM_INTERACTIVE: 'Never', GIT_TERMINAL_PROMPT: '0' },
    }).spawn();
    const w = child.stdin.getWriter();
    await w.write(new TextEncoder().encode('protocol=https\nhost=github.com\n\n'));
    await w.close();
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch { /* already exited */ }
    }, timeoutMs);
    const out = await child.output();
    clearTimeout(timer);
    if (!out.success) return null;
    const text = new TextDecoder().decode(out.stdout);
    const line = text.split(/\r?\n/).find((l) => l.startsWith('password='));
    const pw = line ? line.slice('password='.length).trim() : '';
    return pw.length ? pw : null;
  } catch {
    return null;
  }
}

/**
 * Durably resolve a working GitHub token from whatever source is healthy in this
 * environment, validating each candidate against GET /user before accepting it.
 *
 * Tried in order: preferEnv → standard env candidates → `gh auth token`
 * (Windows, then WSL) → bounded GCM `git credential fill`. The first candidate
 * that authenticates wins. `gh auth token` is the durable source: a one-time
 * `gh auth login` yields a credential gh keeps fresh, so it survives token
 * expiry that kills static PATs.
 *
 * Throws with a precise, secret-free message listing what was tried when nothing
 * validates — the caller surfaces it so a human runs `gh auth login` once.
 */
export async function resolveGithubToken(
  opts: ResolveTokenOptions = {},
): Promise<ResolvedGithubToken> {
  const validate = opts.validate ?? true;
  const wslUser = opts.wslUser ?? 'codex';
  const tried: string[] = [];

  const accept = async (
    token: string | null,
    source: string,
  ): Promise<ResolvedGithubToken | null> => {
    if (!token) return null;
    if (!validate) return { token, source };
    const login = await validateGithubToken(token);
    tried.push(login ? `${source} (valid)` : `${source} (401)`);
    return login ? { token, source: `${source} (${login})` } : null;
  };

  const envOrder = [
    ...(opts.preferEnv ? [opts.preferEnv] : []),
    ...GITHUB_TOKEN_ENV_CANDIDATES,
  ];
  const seen = new Set<string>();
  for (const name of envOrder) {
    if (seen.has(name)) continue;
    seen.add(name);
    const r = await accept(readTokenFromEnv(name), `env:${name}`);
    if (r) return r;
  }

  if (!opts.envOnly) {
    const ghWin = await runCapture('gh', ['auth', 'token']);
    let r = await accept(ghWin, 'gh:windows');
    if (r) return r;

    const ghWsl = await runCapture('wsl.exe', [
      '-u',
      wslUser,
      '--',
      'bash',
      '-lc',
      'export PATH="$HOME/.local/bin:$PATH"; gh auth token',
    ]);
    r = await accept(ghWsl, 'gh:wsl');
    if (r) return r;

    const gcm = await gcmCredentialFill(opts.gcmTimeoutMs ?? 20000);
    r = await accept(gcm, 'gcm:windows');
    if (r) return r;
  }

  const summary = tried.length ? tried.join(', ') : 'no candidate produced a token';
  throw new Error(
    `No valid GitHub token resolved (tried: ${summary}). ` +
      `Authenticate once with \`gh auth login\` (WSL: \`wsl.exe -u ${wslUser} -- gh auth login\`) ` +
      `so \`gh auth token\` can supply a self-refreshing credential, or store a PAT via ` +
      `\`git credential approve\`, then retry.`,
  );
}

export interface GitHubResponse {
  status: number;
  ok: boolean;
  // deno-lint-ignore no-explicit-any
  body: any;
}

/**
 * Minimal GitHub REST call. `token` is used only as the Authorization header and
 * is never written to disk, argv, or output. `path` is appended to
 * `https://api.github.com`.
 */
export async function githubRequest(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<GitHubResponse> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'netscript-agentic-suite',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let parsed: unknown = null;
  const text = await res.text();
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, ok: res.ok, body: parsed };
}
