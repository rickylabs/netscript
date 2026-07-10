# Agentic orchestration tool suite

Deno tools that automate the two sub-agent lanes the supervisor drives — **WSL Codex**
(stage / launch / watch / resume) and **OpenHands** (dispatch / status) — so the supervisor
never hand-rolls fragile PowerShell for staging, launching, watching, status, or logs.

Every landmine these lanes hit historically (PowerShell `<`/`$()` parse errors, CRLF-corrupted
bash scripts, leaked tokens, inherited-upstream `git push`-to-main, rival concurrent Codex sends)
is defended **in code** and unit-tested. The pure logic lives in `agentic-lib.ts`; each tool is a
thin CLI over it.

> Scope note: these tools are intentionally **excluded from `deno lint`** by the repo's
> `deno.json` (`lint.exclude: [".llm/"]`), like every other `.llm/tools/` script. They ARE
> type-checked (`deno check`) and unit-tested (`deno test`). Lint them ad hoc with
> `deno lint --no-config <files>` if you touch them.

## Files

| File | Role |
| ---- | ---- |
| `agentic-lib.ts` | Shared pure + impure primitives (the heart; all landmine logic). |
| `wsl-foundation-lib.ts` | Pure runtime probe, auth-boundary, and doctor-report contracts. |
| `wsl-foundation.ts` | Read-only native WSL doctor; S2 adds reversible bootstrap/rollback planning. |
| `launch-codex-slice.ts` | Validate brief → push-safety check → stage → launch a Codex slice; record thread id. |
| `codex-status.ts` | Read-only: daemon health, worktree git state, recent sessions. |
| `codex-watch.ts` | Event-driven wait on a worktree's git activity (**runs inside WSL**). |
| `codex-resume.ts` | Steer an existing thread via `codex exec resume` (never forks a rival). |
| `dispatch-openhands.ts` | Validate prompt contract → build & POST an `@openhands-agent` trigger comment. |
| `openhands-status.ts` | Read-only run status from the committed trace (default) or the PR status comment. |
| `watch-openhands-verdict.ts` | Poll a PR for the eval verdict with layered extraction (contract line → formal header → summary heuristics). |
| `gh-pr.ts` | Leaf-PR lifecycle: `create` / `verdict` / `merge` over the GitHub REST API (eval-gated merge). |
| `gh-watch.ts` | Background CI/verdict watch — polls a PR's OpenHands summary until the IMPL/PLAN-EVAL verdict is terminal, then exits to re-wake the supervisor (token-free re-wake, no polling loop in agent context). |
| `gh-token.ts` | Durable GitHub-token resolver/store — `check` validates a token from any healthy source (env → `gh auth token` → GCM) printing source+login only; `store` persists one stdin PAT to Windows GCM + WSL `gh` so future sessions resolve it automatically. |
| `agentic-lib_test.ts` | `deno test` unit suite over the pure primitives + real fixtures. |
| `__fixtures__/` | Real Codex launch log + a real-shaped OpenHands status comment. |

## Landmines defended (and where)

- **PowerShell argv parsing** (`'<' is reserved`, `$()` eaten): all WSL calls go through
  `wsl(user, script)` → `Deno.Command("wsl.exe", ["-u", user, "--", "bash", "-lc", script])`.
  An argv array means PowerShell never parses the bash body. `agentic-lib.ts`.
- **CRLF in bash scripts**: Deno writes LF; staging normalizes with `tr -d '\r'`. Trailing `\r`
  breaks `cd`/redirects under `bash -lc`. `launch-codex-slice.ts`.
- **Token leakage** (classifier-enforced): PAT is read from an in-process env var
  (`readTokenFromEnv`), used ONLY as `Authorization: Bearer …`, never written to file/argv/output.
  `agentic-lib.ts`, `dispatch-openhands.ts`, `openhands-status.ts`.
- **Inherited-upstream push-to-main**: a worktree branched off the umbrella inherits its upstream,
  so a bare `git push` lands on the umbrella branch. `evaluateGitSafety` fails (exit 4) unless
  `@{u}` is `NONE`; push via explicit `HEAD:refs/heads/<branch>` refspec. `launch-codex-slice.ts`.
- **Rival concurrent sends**: two `send-message-v2` at one worktree fork agents that fight over the
  git index. `codex-resume.ts` requires an explicit `--thread-id` and issues exactly one
  `codex exec resume` — never a second send.
- **`sleep` neutralized in sandbox**: watchers use `Deno.watchFs` (event-driven), not polling sleeps.
  `codex-watch.ts`.
- **`gh` not on Windows PATH**: OpenHands tools use the GitHub REST API via `fetch`, no `gh`.
- **OpenHands per-PR concurrency cancel**: dispatch ONE trigger per intended run. `dispatch-openhands.ts`.
- **Un-gated / un-clean / wrong-base merges**: `gh-pr.ts merge` refuses to merge unless the latest
  OpenHands IMPL/PLAN-EVAL comment is `PASS` (`--no-eval-gate` to bypass for umbrella→base), unless
  `mergeable_state == clean` (`--force` to override), and never targets base `main` without
  `--allow-base-main`. The head sha is pinned in the merge body so a race can't merge a moved tip.

## Tools

### `wsl-foundation.ts`

Inspect the native WSL agentic runtime without printing environment values or provider credentials:

```bash
deno task agentic:wsl-foundation doctor
deno task agentic:wsl-foundation doctor --json
deno task agentic:wsl-foundation bootstrap --dry-run --json
deno task agentic:wsl-foundation bootstrap --json
deno task agentic:wsl-foundation rollback-plan --json
```

The doctor reports a stable schema, native-ext4 proof, bounded tool versions, required Linux-local
state directories, Codex managed/version-skew state, and Claude/Gemini authentication boundaries.
Gemini is restricted to Google subscription sign-in; API-key and Vertex environment key *names* are
reported as conflicts without reading or printing their values. Exit: `0` ready · `2` degraded or
browser auth required · `3` forbidden auth route · `4` usage/execution failure.

Bootstrap installs the checksum-verified Node `26.5.0` distribution and npm stable Claude Code /
Gemini CLI releases below `~/.local/share/netscript-agentic`, then exposes only owned symlinks in
`~/.local/bin`. It writes a mode-0600, value-free ownership manifest under
`~/.config/netscript-agentic`; it never changes Windows Claude, `~/.codex`, or provider session
files. Run `rollback-plan` to print non-executing reversal guidance before removing any owned path.

Permissions are explicit in the task: read/write for the owned user-local paths, run for fixed
`npm`/`tar` and version probes, environment access for key-presence/PATH checks, and network access
restricted to `nodejs.org` plus `registry.npmjs.org`. External requirements are `tar` with xz
support and the pre-bootstrap system npm used only to resolve stable dist-tags. The doctor never
writes despite sharing the bootstrap entry point; bootstrap refuses forbidden Gemini auth routes
before downloading or mutating anything.

### `launch-codex-slice.ts`
Stage and launch a Codex slice from a Windows-authored brief, with a push-safety gate, and record
the thread id to the run-artifact dir.

```powershell
# Parse a saved launch log for the thread id (no side effects):
deno run --allow-read .llm/tools/agentic/launch-codex-slice.ts --parse-log <log>

# Dry-run the full plan (validates brief + git safety, stages nothing, launches nothing):
deno run --allow-read --allow-run .llm/tools/agentic/launch-codex-slice.ts \
  --brief <win-path> --worktree <wsl path> --branch <branch> --slug <slug> \
  --slice-dir <win path> --dry-run

# Real launch (omit --dry-run): stages the brief, spawns ~/launch_slice.sh, streams output,
# writes codex-thread-ids.md into --slice-dir on first thread id.
```
Exit codes: `0` ok / dry-run / parse-log · `1` stage failed · `2` watcher heartbeat · `3` brief
contract violation · `4` git-safety violation (e.g. inherited upstream) · `5` worktree not found.

### `codex-status.ts`
Read-only snapshot — safe to run anytime.

```powershell
deno run --allow-read --allow-run .llm/tools/agentic/codex-status.ts --pretty
deno run --allow-read --allow-run .llm/tools/agentic/codex-status.ts --worktree <wsl path> --pretty
```
Reports daemon version + app-server proc count, worktree git state + logs path (if `--worktree`),
and recent session rollouts. Exit: `0` ok · `2` daemon unreachable · `5` worktree not found.

### `codex-watch.ts`  (run INSIDE WSL)
Token-free event-driven wait. Two modes — pick by **which signal you need**:

- **`--mode git` (default)** — wakes on the worktree's next git activity (commit / branch update /
  reflog write). This means *the slice made progress*; it does **not** mean the agent stopped — a
  turn can commit mid-flight, or finish with no commit at all.
- **`--mode turn`** — wakes when the agent's current **turn finishes**, by watching the thread's
  session rollout `.jsonl` for its terminal `task_complete` marker (the daemon's end-of-turn event).
  This is the real *agent is idle / done* signal that git-ref watching misses. If the thread is
  already idle when armed, it returns immediately with `alreadyIdle:true`.

```bash
# progress — wake on the next commit/ref event:
deno run --allow-read --allow-run .llm/tools/agentic/codex-watch.ts \
  --worktree <wsl path> --timeout-seconds 1800

# finish — wake when the steered/launched turn completes (resolve rollout by thread id):
deno run --allow-read --allow-env --allow-run .llm/tools/agentic/codex-watch.ts \
  --mode turn --thread-id <uuid> --timeout-seconds 1800
# (or pass --rollout <path> directly; --sessions-dir defaults to $HOME/.codex/sessions)
```
fs events only fire natively on ext4, so this must run inside WSL (not from Windows over `/mnt`).
**Use both together:** `--mode git` to surface each commit as the slice works, `--mode turn` to know
when the agent has actually stopped (idle, awaiting your next steer). Exit: `0` on the awaited event
(git change | turn complete) · `2` on `--timeout-seconds` heartbeat (slice may be hung) · `1` bad
args / worktree, logs dir, or rollout not found.

### `codex-resume.ts`
Steer an existing thread. Never fires a second send at a worktree.

```powershell
deno run --allow-read --allow-run .llm/tools/agentic/codex-resume.ts \
  --thread-id <uuid> --message "<follow-up>" [--worktree <wsl path>] [--dry-run]
```
`--dry-run` prints the exact command (token-free, sends nothing). Exit: `0` ok / dry-run ·
`1` resume failed · `2` usage error (missing/invalid thread id or empty message).

### `dispatch-openhands.ts`
Validate the dispatch-prompt contract, build the `@openhands-agent` trigger, and POST it.

```powershell
# Dry-run (no token, no network) — see the exact comment that would post:
deno run --allow-read .llm/tools/agentic/dispatch-openhands.ts \
  --pr 86 --prompt-file <win-path> --model openrouter/qwen/qwen3.7-max \
  --output pr-comment --iterations 800 --provider openrouter --dry-run --pretty

# Real post: set the token in-process first, then drop --dry-run:
$env:GH_TOKEN = (read from your secret store)   # never commit / echo this
deno run --allow-read --allow-env --allow-net .llm/tools/agentic/dispatch-openhands.ts \
  --pr 86 --prompt-file <win-path> --model openrouter/qwen/qwen3.7-max --output pr-comment
```
The prompt MUST begin with `use harness` and contain a `## SKILL` chapter (handoff contract).
Output modes: `pr-comment` · `respond-comments` · `thread-replies` · `summary-only`. A `--pr`
trigger checks out the PR branch; `--issue` checks out the default branch. Exit: `0` ok / dry-run ·
`1` post failed · `2` usage error · `3` prompt contract violation · `4` missing token (non-dry-run).

By default every dispatched prompt gets a **verdict output-contract epilogue**
(`appendVerdictContractEpilogue`): post the formal `**[PHASE: …] [VERDICT: …]**` PR comment EARLY
(before optional deep-dives — iteration budgets exhaust and late verdicts get lost), and always end
both the PR comment and the summary file with a machine-readable
`OPENHANDS_VERDICT: <PASS|FAIL_FIX|FAIL_RESCOPE|FAIL_DEBT|FAIL_PLAN|NONE>` line. Pass
`--no-verdict-contract` for non-eval dispatches (implementation asks) that should not carry it.

### `openhands-status.ts`
Read the verdict without hand-writing PowerShell.

```powershell
# Local (default, no token): newest committed trace under .llm/tmp/run/openhands/pr-<n>/
deno run --allow-read .llm/tools/agentic/openhands-status.ts --pr 37 --pretty

# Remote: parse the workflow's status comment via the API (needs a token in GH_TOKEN)
deno run --allow-read --allow-env --allow-net .llm/tools/agentic/openhands-status.ts \
  --source remote --repo rickylabs/netscript --pr 86 --pretty
```
Exit: `0` status found · `1` no status found · `2` usage error · `4` missing token (remote).

### `watch-openhands-verdict.ts`
Poll a PR for the OpenHands eval **verdict** — the layered answer to runs that exhaust their
iteration budget and never post the formal comment. Extraction priority (per poll, newest comment
first): (1) the machine-readable `OPENHANDS_VERDICT: <token>` contract line (`confidence: exact`),
(2) the formal `**[PHASE: …-EVAL] [VERDICT: X]**` header (`exact`), (3) heuristics on the runner's
synthesized `<!-- openhands-agent-summary -->` comment — `## Verdict` section, `**Verdict: PASS.**`
phrase, or a token near the word "verdict" in a context dump (`confidence: heuristic`). The
dispatch/trigger comment (which quotes the `[VERDICT: <verdict>]` template) is never matched.

```powershell
$env:GH_TOKEN = (read from your secret store)   # never commit / echo this
deno run --allow-env --allow-net .llm/tools/agentic/watch-openhands-verdict.ts \
  --repo rickylabs/netscript --pr 86 --since 2026-07-05T10:00:00Z \
  --timeout-seconds 1800 --interval-seconds 30
```
Prints one JSON line `{ok, verdict, confidence, commentUrl, elapsedSeconds}`. Exit: `0` verdict
found · `2` timeout heartbeat (re-arm to keep waiting) · `1` bad args / auth.

### `gh-pr.ts`  (`create` | `verdict` | `merge`)
Leaf-PR lifecycle over the GitHub REST API — replaces the hand-rolled `Invoke-RestMethod` PowerShell
for opening leaf PRs, reading IMPL/PLAN-EVAL verdicts, and merging into an umbrella. The token rule
is identical to the OpenHands tools (in-process env var only; `create --dry-run` is token-free,
`merge`/`verdict` read PR state so need a token).

```powershell
# create — open a leaf PR (refuses base 'main' without --allow-base-main):
deno run --allow-read .llm/tools/agentic/gh-pr.ts create \
  --repo rickylabs/netscript --head feat/prime-time/auth-s4-backends \
  --base feat/prime-time/auth --title "..." --body-file <win-path> --dry-run --pretty

# verdict — read the latest OpenHands IMPL/PLAN-EVAL comment on a PR:
$env:GH_TOKEN = (read from your secret store)
deno run --allow-read --allow-env --allow-net .llm/tools/agentic/gh-pr.ts verdict --pr 95 --pretty

# merge — eval-gated, clean-gated, base-guarded, head-sha-pinned:
deno run --allow-read --allow-env --allow-net .llm/tools/agentic/gh-pr.ts merge \
  --pr 95 --method merge --title "..." --message "..." --pretty
```
`merge` gates on a `PASS` verdict by default (`--no-eval-gate` for umbrella→base where no leaf eval
exists), requires `mergeable_state == clean` (`--force` to override), refuses base `main` without
`--allow-base-main`, and pins the head sha. Exit: `0` ok / PASS · `1` API failure · `2` usage ·
`4` missing token · `6` base-`main` guard · `7` not mergeable · `10` eval FAIL · `11` eval
pending/not-final · `12` no eval comment found.

## Environment overrides

The suite ships portable: every machine/user-specific default is read through an env override with
the **historical value as the fallback**, so with none of these set the behavior is byte-identical
to before. Override them to run the suite on a machine whose WSL user or home differs. Reads are
permission-guarded — a tool run without `--allow-env` simply falls back to the default rather than
failing, so overrides only take effect when the process is granted `--allow-env`.

| Env var | Overrides | Default | Consumed by |
| ------- | --------- | ------- | ----------- |
| `NETSCRIPT_WSL_USER` | WSL linux user the suite drives Codex under (the `-u <user>` for `wsl.exe`, `--user` flag default). | `codex` | `launch-codex-slice.ts`, `codex-status.ts`, `codex-resume.ts`, `gh-token.ts`, `resolveGithubToken` in `agentic-lib.ts`. |
| `NETSCRIPT_WSL_HOME` | WSL home dir (default brief dest, `codex-watch.ts` sessions-dir fallback when `$HOME` is unset). | `/home/<NETSCRIPT_WSL_USER>` (i.e. `/home/codex`) | `launch-codex-slice.ts`, `codex-watch.ts`. |

The `wslUser()` / `wslHome()` helpers in `agentic-lib.ts` are the single source of truth; per-tool
`--user` flags still override at call time. Note `$HOME/.local/bin` PATH prepends stay `$HOME`-relative
(already portable) and so carry no env var.

## Tests & validation

```powershell
deno test --allow-read --allow-env .llm/tools/agentic/agentic-lib_test.ts   # 54 unit tests
deno check --unstable-kv .llm/tools/agentic/*.ts                   # type-check (clean)
deno lint  --no-config   .llm/tools/agentic/*.ts                   # lint (repo excludes .llm/)
```

Unit tests use a local throw-based `assert`/`assertEquals` (the repo's import map is empty, so
`@std/assert` is unavailable — matches `fitness/check-ds-gates_test.ts`). `parseThreadInfo` is
asserted against the **real** launch fixture
(`__fixtures__/codex-launch-s1.head.log`, thread `019ee68a-9a41-7f01-b7d5-072fbd469b09`).
