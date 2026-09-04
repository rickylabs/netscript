# Agentic orchestration suite

This directory is the machinery a NetScript supervisor uses to run other agents. The supervisor — a
Claude session — does not implement framework code by hand; it delegates implementation slices to
**WSL Codex**, terminal/vision turns to **OpenCode**, and evaluation to **OpenHands**, then watches,
steers, and gates the results. Driving those lanes by hand from Windows PowerShell is fragile and
token-expensive, so every step is encoded here as a small, typed Deno tool with a stable
`deno task agentic:*` entry point.

Two things make this suite worth reading rather than skimming. First, it is a **control system**: at
its centre is a desired-state runtime controller — the "brain" — that observes the real machine,
compares it to a declared desired state, and plans the smallest safe change. Everything else is an
execution or utility tool that the brain (or a human) calls. Second, it is **defensive by
construction**: every landmine these lanes have historically hit — PowerShell mangling `<` and
`$()`, CRLF-corrupted bash scripts, leaked tokens, a bare `git push` landing on the wrong branch,
two Codex sends fighting over one git index — is defended in code and pinned by a test. The suite
maintains a large part of this repository under owner supervision, so its own tooling is held to the
same bar as the framework it edits.

> **Scope.** These are internal repo tools under `.llm/tools/`, not a published package. They are
> type-checked (`deno check`) and unit-tested (`deno test`) but excluded from the repo's `deno lint`
> config like every other `.llm/` script. Lint them ad hoc with the scoped wrapper shown under
> [Tests & validation](#tests--validation).

## The mental model: brain vs. hands

It pays to hold two categories in your head.

The **brain** is `runtime/` — a contract-first, ports-and-adapters controller (NetScript Archetype
6). It speaks in a versioned schema (`schema 1.0`): a `RouteIdentity`, a desired vs. observed
`RuntimeState`, a pure `planner` that turns the gap into a finite list of actions, and adapters that
are the _only_ place `Deno.env` and `Deno.Command` may live. The brain never mutates blindly —
`doctor`, `status`, and every `--dry-run` are inspect-only, and generic apply is deliberately
withheld until explicit mutation ports are wired.

The **hands** are the concern-grouped lanes around it — `codex/`, `opencode/`, `openhands/`,
`github/`, `wsl/`, `claude/` — plus `lib/` (shared primitives) and `runtime/cli/` (the human/agent
entry points that drive the brain). A hand does one job well: launch a slice, watch a PR, resolve a
token. It is safe to read any one of them in isolation.

## Folder map

| Folder         | What lives there                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/`     | The desired-state controller: `contract.ts`, `state.ts`, `ports.ts`, pure `planner.ts`, `controller.ts`, `output.ts`, the routing/rollout policy, provider profiles, and `adapters/` (the only home for `Deno.env`/`Deno.Command`). |
| `runtime/cli/` | Entry points over the brain: the canonical `agentic-runtime` doctor/status/repair, routing-state, Antigravity evidence, and the provider + rollout canaries.                                                                        |
| `codex/`       | The WSL agent lane: launch/watch/steer Codex, follow live rollouts, and triage Codex plus agy transcript state.                                                                                                                     |
| `opencode/`    | The native WSL OpenCode lane: run general terminal turns, capture Kimi vision evaluations, or host the browser UI.                                                                                                                  |
| `openhands/`   | The OpenHands lane: dispatch an evaluator, read its status, watch for the verdict.                                                                                                                                                  |
| `github/`      | The GitHub REST lane: leaf-PR lifecycle, background CI/verdict watch, durable token resolution.                                                                                                                                     |
| `wsl/`         | The WSL foundation: a native doctor and a reversible bootstrap/rollback planner.                                                                                                                                                    |
| `claude/`      | Claude hooks, Remote Control smoke and bounded OpenRouter delegation, plus surface validation.                                                                                                                                      |
| `config/`      | **The single source for everything volatile** — model ids, tool versions, endpoints. See [Maintenance map](#maintenance-map-change-one-thing-in-one-place).                                                                         |
| `lib/`         | Shared pure + impure primitives (all the landmine logic), its unit suite, and real fixtures.                                                                                                                                        |

Tests sit next to what they test (`*_test.ts`). The one root-level test,
`compatibility-wrappers_test.ts`, guards the one-deprecation-cycle boundary that keeps the legacy
`codex/`, `claude/`, and `wsl/` task names delegating to shared primitives.

## The everyday flow: driving a slice

The supervisor's core loop is _launch → watch → steer → evaluate → merge_. Each step is one tool,
and each is safe to dry-run first.

### 1. Launch a Codex slice — `codex/launch-codex-slice.ts`

**When:** you have a Windows-authored brief and want an implementation agent working in a
native-ext4 WSL worktree. The tool validates the brief contract, refuses to launch if a bare push
could land on the wrong branch, stages the brief with LF endings, launches Codex, and records the
thread id plus a secret-safe requested-vs-observed route identity.

```bash
# Dry-run the whole plan — validates brief + git safety, stages nothing, launches nothing:
deno run --allow-read --allow-run .llm/tools/agentic/codex/launch-codex-slice.ts \
  --brief <win-path> --worktree <wsl-path> --branch <branch> --slug <slug> \
  --slice-dir <win-path> --provider openai --model <model-id> --effort <effort> --dry-run
```

Pick workload tier and role from `.llm/harness/workflow/lane-policy.md`; the typed bindings live in
`runtime/delegation-matrix.ts`, the resolver lives in `runtime/routing-policy.ts`, and concrete ids
live in `config/models.ts`. Prose in the brief is not launch authority. Drop `--dry-run` for the
real launch; it fails closed unless the observed provider/model/effort match what you requested. The
`complex` and `architecture` rows additionally require explicit owner or milestone-coordinator
authorization with a rationale recorded in the run and passed to the route resolver. Inferred
complexity cannot select them. The launcher uses the v2 app-server JSONL protocol directly because
Codex CLI 0.144.1's `debug app-server send-message-v2` helper does not propagate
`-c model_reasoning_effort` to the child turn. Pass `--allow-route-mismatch` only for an explicit
operator-approved exception; otherwise a pending or mismatched route exits non-zero with a
`BLOCKED:` operator action. Exit: `0` ok/dry-run/parse-log · `1` stage failed · `2` watcher
heartbeat · `3` brief contract violation · `4` git-safety violation (e.g. inherited upstream) · `5`
worktree not found.

### 2. Watch it — `codex/codex-watch.ts` (runs **inside** WSL)

**When:** you want to be re-woken on progress or on turn completion without burning tokens polling.
`fs` events only fire natively on ext4, so this runs inside WSL, not over `/mnt`. Two modes, chosen
by _which signal you need_:

- `--mode git` (default) wakes on the next commit / ref write — _the slice made progress_.
- `--mode turn` wakes when the agent's current turn finishes (the daemon's `task_complete` marker) —
  _the agent is idle, awaiting your next steer_.

```bash
# Progress — wake on the next commit/ref event:
deno run --allow-read --allow-run .llm/tools/agentic/codex/codex-watch.ts \
  --worktree <wsl-path> --timeout-seconds 1800

# Finish — wake when the launched/steered turn completes:
deno run --allow-read --allow-env --allow-run .llm/tools/agentic/codex/codex-watch.ts \
  --mode turn --thread-id <uuid> --timeout-seconds 1800
```

Use both together: `git` to surface each commit, `turn` to know when to step back in. Exit: `0` on
the awaited event · `2` on the timeout heartbeat (slice may be hung) · `1` bad args / missing
worktree, logs dir, or rollout.

### 3. Follow it live — `codex/codex-follow.ts`

**When:** you need to know whether a session is progressing and what it is doing without reading raw
JSONL. It resolves `--thread-id` through the same shared resolver as `codex-watch`, prints only
reasoning, messages, commands/results, file writes, and terminal events, then exits when the turn
completes or fails.

```bash
deno task agentic:codex-follow --thread-id <uuid> --since 5m --format pretty
```

Use `--format json` for line-delimited machine-readable events. `--rollout <path>` is available for
direct inspection. User prompts and token bookkeeping are never streamed.

Mixed-fleet status also reads agy's existing worktree index at
`~/.gemini/antigravity-cli/cache/last_conversations.json` and each conversation's
`brain/<conversation-id>/.system_generated/logs/transcript.jsonl`. Its `USER_INPUT`,
`PLANNER_RESPONSE`, `RUN_COMMAND`, and `CODE_ACTION` records provide the dispatch issue, current
step, non-zero exit codes, and file evidence. This is transcript evidence only; `ps` is never used
to claim agy progress. Pass `--worktree <path>` to resolve and filter either runtime by the handle a
supervisor normally has.

### 4. Steer it — `codex/codex-resume.ts`

**When:** the agent is idle and you want to send a follow-up. This tool issues _exactly one_
`codex exec resume` against an explicit `--thread-id`; it never fires a second send at a worktree,
because two concurrent sends fork rival agents that fight over the index.

```bash
deno run --allow-read --allow-run .llm/tools/agentic/codex/codex-resume.ts \
  --thread-id <uuid> --message "<follow-up>" [--worktree <wsl-path>] [--dry-run]
```

`--dry-run` prints the exact command and sends nothing. A real resume exits `0` only when the child
result is accepted. A recognized rejection — including
`thread-store conflict: already has an active writer` — remains visible on the same child
stdout/stderr stream but forces exit `1` even when the child process itself exited `0`. Other child
failures also exit `1`; usage errors exit `2`.

### 5. Check live state anytime — `codex/codex-status.ts`

**When:** you want the one-command triage answer. Each recent session reports thread id, model,
effort, worktree, current activity/reasoning, last commit or file write, and an evidence-derived
state: `working`, `idle`, `stalled-for-N`, `dead`, or `refused`. Quiet incomplete sessions become
stalled; process presence alone never makes them dead.

```bash
deno task agentic:codex-status --sessions 10 --stalled-after 5m --pretty
```

Exit: `0` ok · `2` daemon unreachable · `5` worktree not found.

### 6. Run a complete multi-turn slice — `codex/run-codex-slice.ts`

The runner delegates a new thread to `launch-codex-slice.ts`, or attaches only when the durable
sender registry already maps the requested worktree to the requested thread. It then issues one
resume at a time until the final non-empty response line is exactly `DONE` or `BLOCKED: <reason>`.
Markers earlier in a response do not terminate the slice.

Every turn appends to `<slice-dir>/codex-thread-ids.md` and atomically refreshes
`codex-slice-status.json`, which gives `watch-run.ts` a filesystem wake signal. The final stdout is
structured JSON containing `threadId`, `turns`, `lastState`, and `quotaEvents`. `--max-turns` and
`--max-wall-seconds` are mandatory safety budgets with bounded quota/capacity retry delays.

Use repeated `--launch-arg` values to pass the ordinary launcher arguments, or `--thread-id` to
attach. `--dry-run` emits a deterministic simulated transcript and writes/sends nothing.

## The everyday flow: evaluating with OpenHands

Implementation is only half the loop. Cloud evaluation normally runs through the phase workflow:
`openhands` + `status:plan-eval` for PLAN-EVAL, or draft→ready for IMPL-EVAL. Choose at most one
one-shot `eval:model:*` override before the transition. Do not also post a manual trigger for the
same phase/head.

### Dispatch — `openhands/dispatch-openhands.ts`

**When:** an authorized manual rerun or non-phase cloud task genuinely needs a direct trigger. The
tool validates the dispatch-prompt contract (it must begin with `use harness` and carry a `## SKILL`
chapter), builds the trigger, and POSTs it. Normal PLAN/IMPL phase runs use labels/status
transitions instead. Dispatch exactly one trigger per intended run.

```bash
# Dry-run (no token, no network) — see the exact comment that would post:
deno run --allow-read .llm/tools/agentic/openhands/dispatch-openhands.ts \
  --pr 86 --prompt-file <win-path> --model openrouter/qwen/qwen3.8-flash \
  --output pr-comment --provider openrouter --effort high --dry-run --pretty
```

Set `GH_TOKEN` in-process and drop `--dry-run` to post for real. By default every prompt gets a
verdict output-contract epilogue so the evaluator posts the machine-readable `OPENHANDS_VERDICT:`
line early (iteration budgets exhaust and late verdicts get lost); pass `--no-verdict-contract` for
non-eval implementation asks. Exit: `0` ok/dry-run · `1` post failed · `2` usage · `3` prompt
contract violation · `4` missing token.

OpenHands currently cannot attest reasoning effort because its adapter does not expose that
identity. The dispatch argument records requested metadata only; workflow comments and summaries
state the limitation and never claim a `max` effort observation.

### Read the verdict — `openhands/openhands-status.ts` and `watch-openhands-verdict.ts`

`openhands-status.ts` reads a run's status from the newest committed trace (default, no token) or
from the PR status comment (`--source remote`, needs a token). Use it for a one-shot answer.

`watch-openhands-verdict.ts` is the layered answer for runs that exhaust their budget and never post
the formal comment. It polls a PR and extracts the verdict in priority order — the machine-readable
`OPENHANDS_VERDICT:` line (exact), the formal `**[PHASE: …-EVAL] [VERDICT: X]**` header (exact),
then heuristics on the runner's synthesized summary (heuristic). The dispatch comment that quotes
the template is never matched.

```bash
export GH_TOKEN=…   # never commit or echo this
deno run --allow-env --allow-net .llm/tools/agentic/openhands/watch-openhands-verdict.ts \
  --repo rickylabs/netscript --pr 86 --timeout-seconds 1800 --interval-seconds 30
```

It prints one JSON line `{ok, verdict, confidence, commentUrl, elapsedSeconds}`. Exit: `0` verdict
found · `2` timeout heartbeat (re-arm to keep waiting) · `1` bad args / auth.

## The everyday flow: PRs and merges

### `github/gh-pr.ts` — `create` | `verdict` | `merge`

The leaf-PR lifecycle over the GitHub REST API (no `gh` on the Windows PATH). `create` opens a leaf
PR and refuses base `main` without `--allow-base-main`. `verdict` reads the latest IMPL/PLAN-EVAL
comment. `merge` is the interesting one: it refuses unless the verdict is `PASS` (`--no-eval-gate`
for umbrella→base where no leaf eval exists), unless `mergeable_state == clean` (`--force` to
override), and never targets base `main` without `--allow-base-main` — and it pins the head sha into
the merge body so a race can't merge a moved tip.

```bash
deno task agentic:gh-pr create \
  --repo rickylabs/netscript --head feat/x/s4 --base feat/x --title "…" \
  --body-file .llm/tmp/<run-id>/<session-id>/pr-body.md --dry-run --pretty
```

Publication scratch is always per-run and per-session. For every create invocation, the tool copies
inline or file content into its own UUID directory under `.llm/tmp/agentic/gh-pr/`, writes
owner+SHA-256 metadata, and re-verifies both before constructing the GitHub request. Cross-session
reuse or post-stage tampering is refused. A durable reviewed body may instead live in its harness
run directory; never use a workspace-shared scratch filename.

Exit: `0` ok/PASS · `1` API failure · `2` usage · `4` missing token · `6` base-`main` guard · `7`
not mergeable · `10` eval FAIL · `11` eval pending · `12` no eval comment.

### `github/gh-watch.ts` and `github/gh-token.ts`

`gh-watch.ts` blocks in the background until a PR's IMPL/PLAN-EVAL verdict is terminal, then exits
to re-wake the supervisor — a token-free re-wake with no polling loop kept in the agent's context.
`gh-token.ts check` validates a token from any healthy source (env → `gh auth token` → Git
Credential Manager), printing only source and login; `gh-token.ts store` persists one stdin PAT to
Windows GCM and WSL `gh` so future sessions resolve it automatically.

### `github/review-threads.ts` — when a green PR still should not merge

Run `deno task agentic:review-threads -- --repo rickylabs/netscript --pr <number> --pretty` when
checks are green but review findings may be silent. It lists every thread with author, location,
severity when present, and answered/unanswered state, then exits non-zero for any current thread
without a reply. Resolution clicks are irrelevant; a reasoned decline is a reply, and outdated
threads never block. The command is read-only and is also enforced in CI's `close-gate` job.

## The brain: the runtime controller

### `runtime/cli/agentic-runtime.ts` — the canonical surface

This is the front door to the desired-state controller: inspection, planning, and guarded recovery
commands.

```bash
deno task agentic:runtime doctor --json      # inspect-only health
deno task agentic:runtime status --json      # inspect-only observed state
deno task agentic:runtime repair codex-remote --worktree <wsl-path> --dry-run --json
deno task agentic:runtime repair sender-lease --worktree <wsl-path> --dry-run --json
```

`doctor` and `status` never write. Controller state and checkpoints are value-free JSON under
`~/.config/netscript-agentic/runtime`, written atomically at mode `0600` by apply code only.
`repair codex-remote` diagnoses managed / unmanaged / stale-socket / disconnected / version-skew /
absent daemon states and is **fail-closed**: active work refuses repair; only a PID whose argv
begins below `$HOME/.codex/` with a `codex
app-server` may receive `SIGTERM`; only the one known
control socket may be removed; no broad `pkill` or shell-evaluated kill patterns exist. Always
`--dry-run` first — it inspects and plans without terminating a PID, removing a socket, or writing
evidence.

`repair sender-lease` is the only eviction path for a durable sender owner; launch itself is
preserve-only and never removes an existing record. A launch blocked by `duplicate_sender_risk` or
`ownership_conflict` must be handled by resuming the recorded thread or by running this explicit
repair against one canonical worktree. There is no sender-directory scan, force flag, or
elapsed-time shortcut.

Always preview the exact worktree first, then omit `--dry-run` only when the plan reports stale:

```bash
deno task agentic:runtime repair sender-lease --worktree <wsl-path> --dry-run --json
deno task agentic:runtime repair sender-lease --worktree <wsl-path> --json
```

A lease is stale only when all three provenance-bound signals agree: two debounced PID probes show
the owner dead, the exact rollout is terminal or proven absent, and the thread is non-active or
proven absent. Absence counts only when the inspected rollout inventory and thread daemon are bound
to the record's own session provenance. Alive, working, stalled, active, foreign, mismatched,
unreadable, or otherwise unknown evidence fails closed and preserves the lease.

Apply re-reads the unchanged lease token and repeats every probe. It atomically persists an
`authorized` receipt containing both timestamped evidence passes, CAS-removes only that exact
record, then finalizes the receipt as `evicted`. Receipts live under
`~/.config/netscript-agentic/runtime/evidence/`, record the finite `restart_stale_ownership` reason,
and redact the lease token. If re-observation changes or any evidence becomes unknown, repair aborts
without eviction.

### `runtime/cli/routing-state.ts` — quota fallback, inspected

Read the machine-local routing state and its transition history without contacting a provider or
changing a route:

```console
$ deno task agentic:routing-state
No persisted routing transitions.

$ deno task agentic:routing-state --json
[]
```

The state machine keeps the configured desired route separate from the active fallback route,
records a finite reason category, fallback depth, restoration/canary status, and at most 32 concise
transitions — no credentials, prompts, or account identity. Fallback and restoration are _data
decisions only_, and only at an idle turn or session boundary; an active/critical slice blocks. This
command is strictly read-only.

### `runtime/cli/provider-canary.ts` and `rollout-canary-cli.ts` — prove before you fan out

`provider-canary.ts` runs one bounded, read-only probe of a provider/model/effort route and reports
structured, non-secret compatibility facts. A credential-absent machine returns an actionable
`auth_required` diagnostic; it never fabricates a pass.

OpenRouter Claude routes run with an isolated `CLAUDE_CONFIG_DIR`, explicitly empty
`ANTHROPIC_API_KEY`, late-bound `ANTHROPIC_AUTH_TOKEN`, and the Anthropic-skin base URL from
`config/endpoints.ts`. This prevents a cached native Claude login from silently overriding the
gateway. `claude/claude-print.ts` is the launch/resume wrapper for non-mobile gateway sessions.
Native Claude Remote Control remains a different surface.

For interactive OpenRouter work, `agentic:claude-openrouter-gateway` starts a loopback-only split
gateway. Exact `/v1/messages` requests receive the configured OpenRouter credential and forced
model; other Claude API traffic is passed to the configured Anthropic endpoint without the
OpenRouter key. The Claude child receives neither provider API key and runs with
`bypassPermissions`. The key is read from `OPENROUTER_API_KEY` or the same configured user env file
as OpenCode and is never printed.

```bash
# New inference-only GLM 5.3 Flash session at max effort.
deno task agentic:claude-openrouter-gateway -- --cwd /home/me/repo

# Fork an existing conversation without changing the original.
deno task agentic:claude-openrouter-gateway -- \
  --cwd /home/me/repo --resume <conversation-id> --fork-session --effort max
```

This surface is deliberately **not Remote Control/mobile-visible**. Claude Code 2.1.196 and newer
disable Remote Control when `ANTHROPIC_BASE_URL` is not `api.anthropic.com`; on 2.1.222 the daemon
exits before making a request, while interactive `--remote-control` can stay alive without creating
a `bridgeSessionId`. The launcher therefore rejects `--remote-control` and `--remote-session-id`
instead of fabricating attachment. Do not work around this with TLS interception, a trusted local
root, binary patching, or provider-managed-host flags that disable subscription login.

For a mobile-visible session with an alternate-model worker, use `agentic:claude-hybrid`. This is an
explicit delegation bridge, not a transparent replacement for Claude inference:

```bash
deno task agentic:claude-hybrid -- --cwd /home/me/repo --name netscript-hybrid
```

The launcher starts the installed `claude` binary with native Anthropic authentication, Remote
Control, `bypassPermissions`, and a generated stdio MCP config. Claude remains the supervisor seen
by the web/mobile client. When Claude calls the `netscript-hybrid` MCP tool `delegate_openrouter`,
the MCP server validates a bounded task and optional context, then launches an isolated OpenCode
process for the approved OpenRouter worker. The response includes requested and observed route
identity; “observed” means the exact OpenCode argv constructed by this bridge, not provider-side
attestation. The default and allowlist are centralized in `config/models.ts`
(`HYBRID_DELEGATION_DEFAULT_MODEL` and `HYBRID_DELEGATION_MODEL_IDS`).

This preserves the boundary Claude Code enforces: the Claude child receives no Anthropic API-key,
auth-token, custom-base-URL, or OpenRouter-key override, while only the short-lived OpenCode worker
receives the resolved OpenRouter key. The generated MCP configuration is mode `0600` inside a mode
`0700` temporary directory, contains no credential, grants the MCP process read access only to the
configured credential file, and is removed when the launcher exits. Worker requests have bounded
input, output, diagnostic output, timeout, and concurrency; cancellation or timeout terminates the
isolated process group with bounded TERM-to-KILL escalation.

Remote Control must be available to the natively authenticated Claude installation. The launcher
does not treat a living process or a requested session name as proof: it waits for Claude's session
registry to match the child PID and cwd and to contain a non-empty `bridgeSessionId`, otherwise it
terminates the child and fails closed. The requested `--name` is only a label because Claude may
derive a different registry name.

> **Quota limitation.** Claude must still have enough native allowance to take a turn and choose to
> call `delegate_openrouter`. The OpenRouter worker can do the delegated reasoning, but this bridge
> cannot make a zero-Claude-quota Remote Control session progress. For work that needs no Claude
> turn, use the non-Remote-Control `agentic:claude-openrouter-gateway` surface or OpenCode directly.

If launch fails, diagnose the boundary reported by the error: confirm `--cwd` is an existing
absolute directory, `HOME` is set, native `claude --remote-control` works with the current login,
and the OpenRouter credential is either exported or present in OpenCode's configured user env file.
An attachment timeout means native bridge evidence was absent or mismatched; an MCP connection
failure usually means the generated Deno permission set, OpenCode binary, or credential file is
unavailable. A delegated call can also fail closed as `invalid_request`, `cancelled`, `timed_out`,
`result_too_large`, or `worker_failed`; reduce caller-selected context before increasing the bounded
timeout. Do not add provider credentials to Claude's environment to repair the worker.

The formal-evaluator preset additionally replaces `ANTHROPIC_BASE_URL` in the spawned evaluator
environment with a loopback request guard. Every model-bearing request must name a model in
`OPEN_EVALUATOR_MODEL_IDS`; a denial returns 403, terminates the evaluator, exits non-zero, and
writes a credential-blind JSONL event under `.llm/tmp/agentic/evaluator-policy/` with only the model
id and requesting session. This child-surface policy is configuration, not prompt guidance.

### `agentic:claude-openrouter`

`claude/openrouter-run.ts` is the first-class Claude-over-OpenRouter transport — the OpenCode
alternative for local evaluator and review turns. It wraps `claude-print.ts` and performs the three
steps that were previously manual: it resolves the OpenRouter credential, applies the canonical
`claude-openrouter` provider profile, and always enables the evaluator model guard.

This compatibility transport is not selected by the active workload matrix. Matrix-driven OpenRouter
turns use the OpenCode transport; invoke this command only for an explicitly selected legacy/local
compatibility turn using one of its guarded evaluator models.

Because it is a credential-owning boundary it does not define its own environment rules. It
materializes the profile policy from `runtime/provider-profiles.ts` and spawns with `clearEnv`, so
the child keeps only `ANTHROPIC_AUTH_TOKEN`, has every rival provider/route key cleared, and runs
under an isolated `CLAUDE_CONFIG_DIR` — a cached native Claude login cannot override the gateway.

```bash
deno task agentic:claude-openrouter --model <openrouter-id> --effort max \
  --prompt .llm/runs/<run-id>/evaluate-prompt.md [--resume <session>] [--output result.json]
```

**Open models only.** The guard is not switchable on this route: a closed model id is denied with
403, terminates the turn, and exits `78`. An already-exported `OPENROUTER_API_KEY` wins; otherwise
only that assignment is read from the configured credential file (see `OPENROUTER_ENV_RELATIVE_PATH`
in `config/versions.ts`). The key is never printed and never reaches argv. Unknown, duplicate, or
value-less flags are rejected before any request can spend credit, and `--output` is opened before
the child is spawned so an unwritable destination cannot fail behind a live turn. `--output` tees
the stream-JSON result to a file while still streaming to stdout; the launcher exits with the
child's exit code.

Preset capability is data in `runtime/provider-profiles.ts`: the Claude GLM design preset is
live-agentic supported, while the legacy Codex GLM design preset is explicitly unsupported because
the Responses route declares a native namespace tool that the available OpenRouter endpoints reject.
Canaries surface that incompatibility as a structured diagnostic rather than retrying a dead lane.

```console
$ deno task agentic:provider-canary
{"mode":"static","status":"passed","expectedPresetIds":[...],"rows":[...]}

$ deno task agentic:provider-canary --live --profile <id> --model <id> --effort <effort> \
    --worktree <native-ext4-path> [--base-url <https-url>] [--codex-profile-home <path>]
```

Default mode validates registry coverage, capability coherence, and the real Claude/Codex launch
planners for every `OPENROUTER_PRESETS` entry without reading credentials or spawning a provider.
The `--live` flag is mandatory before any provider process can run.

`rollout-canary-cli.ts` runs the broader rollout matrix and renders a report; it orchestrates the
shipped CLIs rather than re-implementing probes.

### `runtime/cli/antigravity-evidence-cli.ts` — the evidence lane

Runs one fixed, read-only Antigravity probe (`headless`, `web-citations`, `agents-instructions`,
`gemini-instructions`) from a native WSL worktree. It accepts no arbitrary prompt or credential
flag, and `--aggregate` writes only normalized HTTPS citation metadata, and only after an
empirically successful web/citation probe. Owner acceptance is represented as
`owner_accepted_working`; it never converts a failed runtime observation into a pass.

## The WSL foundation — `wsl/wsl-foundation.ts`

Before any of the above can run, the WSL host must be sound. The foundation doctor inspects the
native runtime without printing environment values or credentials:

```bash
deno task agentic:wsl-foundation doctor --json
deno task agentic:wsl-foundation bootstrap --dry-run --json
deno task agentic:wsl-foundation rollback-plan --json
```

The doctor reports a stable schema, native-ext4 proof, bounded tool versions, required state
directories, Codex managed/version-skew state, and Claude/Antigravity auth boundaries — the last
from documented Google Sign-In marker files, without reading credential contents. Bootstrap installs
a checksum-verified Node, npm-stable Claude Code, and the official Antigravity installer, writing a
value-free ownership manifest; it refuses unproven legacy `gemini` ownership before mutating
anything, preserves `~/.gemini` (Antigravity uses it), and never touches `/root/.local/bin/agy`.
Exit: `0` ready · `2` degraded / browser auth required · `3` invalid ownership · `4` usage/execution
failure.

## The Claude surface — `claude/`

`claude-hook-log.ts` is the sink wired into `.claude/settings.json` hooks. Both `PreToolUse` and
`Stop` use exec-form arguments rooted at `${CLAUDE_PROJECT_DIR}`, so a nested turn cwd cannot change
which checked-in logger runs. Claude defines that variable as the session launch root; it does not
follow `EnterWorktree`, and this hook deliberately writes the event log back to that launch root at
`.llm/tmp/claude/hooks/<run-id>/events.jsonl`. A direct non-Claude script/task invocation falls back
to `Deno.cwd()` only when the variable is absent.

The configured process reads exactly `CLAUDE_PROJECT_DIR`, `NETSCRIPT_RUN_ID`, and
`CLAUDE_SESSION_ID`, writes only below the launch-root hook-log subtree, and needs no runtime read
permission. `--no-lock` keeps the hook from disturbing `deno.lock`; `--no-prompt` prevents a future
TTY-attached invocation from prompting. Repository skills live only in `.agents/skills/`; the lone
`.claude/skills/repo-skills/SKILL.md` file points Claude to that source.
`validate-claude-surface.ts` (the `agentic:check-claude` gate) checks the whole surface in one pass:

```console
$ deno task agentic:check-claude --pretty
OK CLAUDE.md: contains @AGENTS.md
OK CLAUDE.md: contains .agents/skills/<name>/SKILL.md
OK .claude/settings.json: valid JSON
OK .gitignore: ignores .claude/settings.local.json
OK Claude repository-skill bridge: .claude/skills/repo-skills/SKILL.md is the only Claude skill and points to .agents/skills
OK claude hook lock check: deno.lock unchanged after 3 hook runs
```

## The OpenCode surface — `opencode/`

OpenCode is one native WSL product with terminal, TUI, and browser surfaces. The non-interactive
launcher resolves `OPENCODE_BIN` when set and otherwise asks `Deno.Command` to resolve the
configured `opencode` binary name on `PATH`; it never uses Windows interop or translates paths.

```bash
deno task agentic:opencode --message "Review this implementation" \
  --model <matrix-selected-provider/model> --variant high --workload-tier feature \
  --workload-role implementation_evaluation \
  --usage-snapshot .llm/tmp/usage/openrouter.json --estimated-cost-usd <amount>

deno task agentic:opencode-eval --prompt "Adversarially review this design" \
  -f /home/me/screens/dashboard.png -f /home/me/screens/detail.png
```

The child invocation is
`opencode run "<message>" -m <provider/model> --variant <effort> -f
<wsl-image>`. The message is
deliberately built **before every flag**: OpenCode's `-f` is an array flag, so a trailing positional
message is swallowed as another filename. Repeating `-f` passes native WSL paths through unchanged.
Add `--format json` to the general launcher when structured event output is required; the evaluator
captures default markdown.

Every OpenCode launch discovers the nearest generated `.mcp.json` without crossing the current
project/git boundary, strictly translates its stdio declarations to OpenCode local MCP entries, and
adds them through `OPENCODE_CONFIG_CONTENT`. Existing external config and inline provider, model,
permission, and plugin settings remain intact; current-project MCP names win only same-name MCP
collisions. Malformed declarations or inline JSON fail closed.

Measured runs can require real attachment before the product prompt:

```bash
deno task agentic:opencode --message "Inspect the project" --model <provider/model> \
  --variant <effort> --cwd /path/to/project --workload-tier feature \
  --workload-role implementation \
  --estimated-cost-usd <amount> \
  --require-mcp netscript --require-mcp aspire \
  --receipt .netscript/agent/opencode-receipt.jsonl
```

The loopback-only preflight requires both servers to report connected, checks the host tool catalog,
then runs a bounded OpenCode preflight turn that must execute exactly one harmless
`netscript_search_docs` lookup. Its receipt reports the available-tool count separately from
expected-tool and MCP-call counts. The product turn does not start if any row fails. Receipts
contain only bounded event identities, reason/category names, and counts—never prompts, tool
inputs/outputs, paths, config, credentials, or secrets.

Resume an exact stored session with `--session <session-id>`. A checked-in OpenCode plugin runs
immediately before every provider conversion (including compaction), removes empty unsigned
assistant text/reasoning fragments, preserves all tool parts and ordering, and is idempotent across
repeated resume. Unsafe signed-reasoning boundaries fail with only a safe local event identity.

OpenCode Go, Ollama Cloud, and OpenRouter use provider-scoped credentials. An already-exported
selected key wins; otherwise the launcher reads only that provider's assignment from its mode-600
file under `$HOME/.config/netscript-agentic/`. Rival provider keys are cleared from the child. The
value is never printed, persisted, or added to argv.

Every paid route requires `--estimated-cost-usd`. OpenCode Go fetches authenticated live usage on
every preflight and rejects caller snapshots; inspect its decision without launching a model:

```bash
deno task agentic:expense-watch -- --provider opencode_go --model opencode-go/<model> \
  --estimated-cost-usd <amount> --pretty

deno task agentic:expense-watch -- --provider <ollama|openrouter> \
  --snapshot .llm/tmp/usage/<provider>.json --estimated-cost-usd <amount> --pretty
```

The command exits zero only when the requested spend fits every applicable allowance and concurrency
boundary. Go combines live window status/percentages with the selected model's published effective
limits; its 12/30/60 USD public windows are scaled from the $60 reference allocation. Missing,
unfetchable, stale, mismatched, exhausted, rate-limited, unknown-weight, or unresolved usage fails
closed before process spawn. Go never silently falls into a separately funded Zen balance; Ollama
never guesses the subscription tier or consumes extra balance implicitly. OpenRouter paid-training
eligibility is an owner-approved route property and is not filtered out.

For browser access, `agentic:opencode-web` wraps the native
[`opencode web`](https://opencode.ai/docs/web/) server:

```bash
# Local browser only; an ephemeral port is selected by default.
deno task agentic:opencode-web

# LAN access is explicit and fail-closed unless basic authentication is configured.
OPENCODE_SERVER_PASSWORD='<secret>' deno task agentic:opencode-web \
  --hostname 0.0.0.0 --port 4096
```

The web launcher binds loopback by default. Any non-loopback hostname or `--mdns` requires
`OPENCODE_SERVER_PASSWORD`; `OPENCODE_SERVER_USERNAME` remains OpenCode's optional username setting.
This is LAN-hosted remote access to the same OpenCode sessions, not a vendor cloud relay. Repeated
`--cors <origin>` and `--mdns-domain <name>` pass through to OpenCode.

## The safety model

The primitives in `lib/agentic-lib.ts` exist so each landmine is encoded once and pinned by a test.
The invariants worth internalizing:

- **No shell parses agent input.** Every WSL-targeted call consumes the shared command plan: Windows
  uses `Deno.Command("wsl.exe", ["-u", user, "--", "bash", "-lc", script])`, while Linux invokes
  `bash -lc` locally. Both are argv arrays, so PowerShell never sees `<`, `>`, or `$(...)`.
- **LF, always.** Deno writes LF and staging strips `\r`; a trailing `\r` under `bash -lc` silently
  breaks `cd` and redirects.
- **Tokens never touch disk or argv.** A PAT is read from an in-process env var and used only as an
  `Authorization: Bearer` header — never written to a file, argv, or output.
- **Push safety.** A worktree branched off an umbrella inherits its upstream, so a bare `git push`
  lands on the umbrella. Launch fails (exit 4) unless `@{u}` is `NONE`; pushes use an explicit
  `HEAD:refs/heads/<branch>` refspec.
- **One sender per worktree.** A Codex launch has one durable owner per canonical worktree and never
  auto-evicts it; a rival is refused with `duplicate_sender_risk` or `ownership_conflict`. Elapsed
  time alone never makes an owner stale.
- **Sender eviction is explicit and auditable.** Only `agentic:runtime repair sender-lease` can
  remove a provenance-bound stale record, after repeat PID + rollout + thread evidence and a durable
  redacted authorization receipt. Foreign, mismatched, live, or unknown ownership stays fail-closed.
- **Fail-closed, anchored repair.** Destructive recovery only ever touches a `codex
  app-server`
  PID below `$HOME/.codex/` and the one known control socket — never a broad `pkill`.
- **Different-family evaluation.** The routing policy skips evaluator candidates in the selected
  generator's vendor family and requires a separate evaluator session.
- **New selection is matrix-derived.** `resolveWorkloadRoute` and `resolveCoordinatorRoute` select
  only typed workload/coordinator routes, skip same-family evaluators, and reject legacy lane names
  rather than translating historical state into a new dispatch.

## Maintenance map: change one thing in one place

Volatile values live in `config/`; typed routing bindings live in the delegation matrix. Edit the
one documented authority and every doctor, probe, installer, and test picks it up. A guard test
(`config/no-hardcoded-volatile_test.ts`) fails the suite if any of these values is ever hardcoded
again outside `config/`.

| To change a…                                               | Edit                                                          | Notes                                                                                                                                                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Model id**                                               | `config/models.ts`                                            | `MODEL_IDS` (native), `OPENROUTER_MODEL_IDS` (presets), and `OPENCODE_MODEL_IDS` (native OpenCode lane). These are the only model-id string literals.                                            |
| **Routing binding** (tier + role → logical model + effort) | `runtime/delegation-matrix.ts`                                | The matrix authority rendered by `.llm/harness/workflow/lane-policy.md`; concrete ids remain in `config/models.ts`.                                                                              |
| **Tool version**                                           | `config/versions.ts`                                          | Runtime version sets plus `OPENCODE_TOOL` for the pinned OpenCode version, binary name, auth-file location, variant, and web defaults.                                                           |
| **Endpoint / host / installer URL**                        | `config/endpoints.ts`                                         | Node dist host, npm registry, Antigravity host + installer, OpenRouter base URLs, GitHub REST + GraphQL APIs. Keep the `agentic:wsl-foundation` `--allow-net=` allowlist in `deno.json` in sync. |
| **Provider profile / paid OpenCode preset**                | `runtime/provider-profiles.ts`                                | Credential-key wiring and preset effort/purpose; model ids come from `config/models.ts`.                                                                                                         |
| **Provider fallback resolver**                             | `runtime/routing-policy.ts`                                   | Provider capability/health selection, family skipping, and legacy rejection.                                                                                                                     |
| **Subscription allowance**                                 | `config/subscriptions.ts` + `runtime/subscription-expense.ts` | Official numeric limits plus normalized fail-closed expense decisions.                                                                                                                           |
| **Agent / provider vocabulary**                            | `runtime/contract.ts`                                         | `AGENT_KINDS`, `PROVIDER_KINDS`, `EFFORTS`, diagnostic codes, `EXIT_CODES`.                                                                                                                      |
| **Deps**                                                   | root `deno.json` import map + `deno.lock`                     | The suite has no third-party deps of its own; it uses `Deno.*` and Web APIs by design.                                                                                                           |

## Environment overrides

The suite ships portable: every machine-specific default is read through an env override whose
fallback is the historical value, so with nothing set the behavior is byte-identical to before.
Reads are permission-guarded — a tool without `--allow-env` simply falls back.

| Env var                    | Overrides                                                          | Default                        |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| `NETSCRIPT_WSL_USER`       | The WSL Linux user the suite drives Codex under.                   | `codex`                        |
| `NETSCRIPT_WSL_HOME`       | The WSL home dir (brief dest, sessions-dir fallback).              | `/home/<NETSCRIPT_WSL_USER>`   |
| `OPENCODE_BIN`             | The native OpenCode executable or executable name.                 | Configured `opencode` name     |
| `OPENCODE_API_KEY`         | OpenCode Go credential inherited only by selected OpenCode child.  | Configured mode-600 env file   |
| `OLLAMA_API_KEY`           | Ollama Cloud credential inherited only by selected OpenCode child. | Configured mode-600 env file   |
| `OPENROUTER_API_KEY`       | OpenRouter credential inherited only by selected OpenCode child.   | Configured mode-600 env file   |
| `OPENCODE_SERVER_PASSWORD` | Enables authenticated non-loopback/mDNS web access.                | Unset; remote exposure refused |

The `wslUser()` / `wslHome()` helpers in `lib/agentic-lib.ts` are the single source of truth;
per-tool `--user` flags still override at call time.

WSL-targeted commands are host-agnostic: on Windows the shared plan preserves the historical
`wsl.exe -u <user> [--cd <dir>] -- bash -lc <script>` argv, while on Linux/WSL it runs
`bash -lc <script>` locally and maps `--cd` to the process cwd. Local execution uses the current
account and fails clearly when the requested WSL user differs; it never silently drops `-u`.

## Tests & validation

```bash
deno test --no-lock -A .llm/tools/agentic/                                              # full suite
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts  --root .llm/tools/agentic --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts   --root .llm/tools/agentic --ext ts,tsx
deno task agentic:check-claude                                                          # Claude surface gate
```

Unit tests use a local throw-based `assert`/`assertEquals` because the repo's import map is empty
(so `@std/assert` is unavailable) — matching the repo's `fitness/` convention. `parseThreadInfo` is
asserted against the **real** launch fixture at `lib/__fixtures__/codex-launch-s1.head.log` (thread
`019ee68a-9a41-7f01-b7d5-072fbd469b09`).
