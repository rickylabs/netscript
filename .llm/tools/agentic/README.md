# Agentic orchestration suite

This directory is the machinery a NetScript supervisor uses to run other agents. The supervisor — a
Claude session — does not implement framework code by hand; it delegates implementation slices to
**WSL Codex** and evaluation to **OpenHands**, then watches, steers, and gates the results. Driving
those lanes by hand from Windows PowerShell is fragile and token-expensive, so every step is encoded
here as a small, typed Deno tool with a stable `deno task agentic:*` entry point.

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

The **hands** are the concern-grouped lanes around it — `codex/`, `openhands/`, `github/`, `wsl/`,
`claude/` — plus `lib/` (shared primitives) and `runtime/cli/` (the human/agent entry points that
drive the brain). A hand does one job well: launch a slice, watch a PR, resolve a token. It is safe
to read any one of them in isolation.

## Folder map

| Folder         | What lives there                                                                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runtime/`     | The desired-state controller: `contract.ts`, `state.ts`, `ports.ts`, pure `planner.ts`, `controller.ts`, `output.ts`, the routing/rollout policy, provider profiles, and `adapters/` (the only home for `Deno.env`/`Deno.Command`). |
| `runtime/cli/` | Entry points over the brain: the canonical `agentic-runtime` doctor/status/repair, routing-state, Antigravity evidence, and the provider + rollout canaries.                                                                        |
| `codex/`       | The WSL Codex lane: launch a slice, watch it, steer it, inspect the daemon.                                                                                                                                                         |
| `openhands/`   | The OpenHands lane: dispatch an evaluator, read its status, watch for the verdict.                                                                                                                                                  |
| `github/`      | The GitHub REST lane: leaf-PR lifecycle, background CI/verdict watch, durable token resolution.                                                                                                                                     |
| `wsl/`         | The WSL foundation: a native doctor and a reversible bootstrap/rollback planner.                                                                                                                                                    |
| `claude/`      | The Claude surface: the hook logger, remote-control smoke, skill-mirror sync, and surface validator.                                                                                                                                |
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
  --slice-dir <win-path> --provider openai --model gpt-5.6-sol --effort medium --dry-run
```

The `--model gpt-5.6-sol` above is an **illustrative literal** for a runnable example — it is not a
source of truth. Pick the real provider/model/effort from `.llm/harness/workflow/lane-policy.md`
(whose bindings live in `runtime/routing-policy.ts`, referencing the ids in `config/models.ts`);
prose in the brief is not launch authority. Drop `--dry-run` for the real launch; it fails closed
unless the observed provider/model/effort match what you requested. Exit: `0` ok/dry-run/parse-log ·
`1` stage failed · `2` watcher heartbeat · `3` brief contract violation · `4` git-safety violation
(e.g. inherited upstream) · `5` worktree not found.

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

### 3. Steer it — `codex/codex-resume.ts`

**When:** the agent is idle and you want to send a follow-up. This tool issues _exactly one_
`codex exec resume` against an explicit `--thread-id`; it never fires a second send at a worktree,
because two concurrent sends fork rival agents that fight over the index.

```bash
deno run --allow-read --allow-run .llm/tools/agentic/codex/codex-resume.ts \
  --thread-id <uuid> --message "<follow-up>" [--worktree <wsl-path>] [--dry-run]
```

`--dry-run` prints the exact command and sends nothing. Exit: `0` ok/dry-run · `1` resume failed ·
`2` usage error.

### 4. Check the daemon anytime — `codex/codex-status.ts`

**When:** you want a read-only snapshot — daemon version and app-server process count, a worktree's
git state and logs path, and the recent session rollouts. Safe to run at any time.

```bash
deno run --allow-read --allow-run .llm/tools/agentic/codex/codex-status.ts --worktree <wsl-path> --pretty
```

Exit: `0` ok · `2` daemon unreachable · `5` worktree not found.

### 5. Run a complete multi-turn slice — `codex/run-codex-slice.ts`

The runner delegates a new thread to `launch-codex-slice.ts`, or attaches only when the durable
sender registry already maps the requested worktree to the requested thread. It then issues one
resume at a time until the final non-empty response line is exactly `DONE` or
`BLOCKED: <reason>`. Markers earlier in a response do not terminate the slice.

Every turn appends to `<slice-dir>/codex-thread-ids.md` and atomically refreshes
`codex-slice-status.json`, which gives `watch-run.ts` a filesystem wake signal. The final stdout is
structured JSON containing `threadId`, `turns`, `lastState`, and `quotaEvents`. `--max-turns` and
`--max-wall-seconds` are mandatory safety budgets with bounded quota/capacity retry delays.

Use repeated `--launch-arg` values to pass the ordinary launcher arguments, or `--thread-id` to
attach. `--dry-run` emits a deterministic simulated transcript and writes/sends nothing.

## The everyday flow: evaluating with OpenHands

Implementation is only half the loop. Evaluation runs on OpenHands via a GitHub Action triggered by
an `@openhands-agent` comment.

### Dispatch — `openhands/dispatch-openhands.ts`

**When:** a slice is ready for a PLAN-EVAL or IMPL-EVAL pass. The tool validates the dispatch-prompt
contract (it must begin with `use harness` and carry a `## SKILL` chapter), builds the trigger, and
POSTs it. Dispatch exactly one trigger per intended run — OpenHands cancels overlapping runs per PR.

```bash
# Dry-run (no token, no network) — see the exact comment that would post:
deno run --allow-read .llm/tools/agentic/openhands/dispatch-openhands.ts \
  --pr 86 --prompt-file <win-path> --model openrouter/qwen/qwen3.7-max \
  --output pr-comment --provider openrouter --effort xhigh --dry-run --pretty
```

Set `GH_TOKEN` in-process and drop `--dry-run` to post for real. By default every prompt gets a
verdict output-contract epilogue so the evaluator posts the machine-readable `OPENHANDS_VERDICT:`
line early (iteration budgets exhaust and late verdicts get lost); pass `--no-verdict-contract` for
non-eval implementation asks. Exit: `0` ok/dry-run · `1` post failed · `2` usage · `3` prompt
contract violation · `4` missing token.

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
deno run --allow-read .llm/tools/agentic/github/gh-pr.ts create \
  --repo rickylabs/netscript --head feat/x/s4 --base feat/x --title "…" --body-file <path> --dry-run --pretty
```

Exit: `0` ok/PASS · `1` API failure · `2` usage · `4` missing token · `6` base-`main` guard · `7`
not mergeable · `10` eval FAIL · `11` eval pending · `12` no eval comment.

### `github/gh-watch.ts` and `github/gh-token.ts`

`gh-watch.ts` blocks in the background until a PR's IMPL/PLAN-EVAL verdict is terminal, then exits
to re-wake the supervisor — a token-free re-wake with no polling loop kept in the agent's context.
`gh-token.ts check` validates a token from any healthy source (env → `gh auth token` → Git
Credential Manager), printing only source and login; `gh-token.ts store` persists one stdin PAT to
Windows GCM and WSL `gh` so future sessions resolve it automatically.

## The brain: the runtime controller

### `runtime/cli/agentic-runtime.ts` — the canonical surface

This is the front door to the desired-state controller: inspection, planning, and one guarded
recovery command.

```bash
deno task agentic:runtime doctor --json      # inspect-only health
deno task agentic:runtime status --json      # inspect-only observed state
deno task agentic:runtime repair codex-remote --worktree <wsl-path> --dry-run --json
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

```console
$ deno run --allow-run --allow-env .llm/tools/agentic/runtime/cli/provider-canary.ts
Usage: deno task agentic:provider-canary --profile <id> --model <id> --effort <effort>
  --worktree <native-ext4-path> [--base-url <https-url>] [--codex-profile-home <path>]

Prints structured non-secret JSON. Exit: 0 passed · 4 blocked · 5 failed · 2 usage.
```

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

`claude-hook-log.ts` is the sink wired into `.claude/settings.json` hooks; it appends Claude Code
events to `.llm/tmp/claude/hooks/<run-id>/events.jsonl` and is careful never to disturb `deno.lock`.
`sync-claude-skills.ts` **generates** `.claude/skills/` from `.agents/skills/` — the mirrors are
generated, never hand-edited. `validate-claude-surface.ts` (the `agentic:check-claude` gate) checks
the whole surface in one pass:

```console
$ deno task agentic:check-claude --pretty
OK CLAUDE.md: contains @AGENTS.md
OK .claude/settings.json: valid JSON
OK .gitignore: ignores .claude/settings.local.json
OK .claude/skills: agentic:sync-claude OK: 17 skill(s), 21 mirrored file(s)
OK claude hook lock check: deno.lock unchanged after 3 hook runs
```

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
- **One sender per worktree.** A Codex launch has one durable owner per canonical worktree; a live
  owner refuses a rival with `duplicate_sender_risk`. Elapsed time alone never makes an owner stale.
- **Fail-closed, anchored repair.** Destructive recovery only ever touches a `codex
  app-server`
  PID below `$HOME/.codex/` and the one known control socket — never a broad `pkill`.
- **Opposite-family evaluation.** The routing policy refuses to select a fallback in the same model
  family as the author for an evaluation purpose.
- **Dated overrides expire.** `resolveCanonicalRoute` will not silently retain an expired temporary
  owner override past its `effectiveThrough` date.

## Maintenance map: change one thing in one place

Everything that moves over time lives in `config/`. This is the monthly-maintenance surface — edit
the one obvious place and every doctor, probe, installer, and test picks it up. A guard test
(`config/no-hardcoded-volatile_test.ts`) fails the suite if any of these values is ever hardcoded
again outside `config/`.

| To change a…                                        | Edit                                                   | Notes                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Model id**                                        | `config/models.ts`                                     | `MODEL_IDS` (native) and `OPENROUTER_MODEL_IDS` (presets). These are the only model-id string literals.                                                                               |
| **Routing binding** (lane → agent → model → effort) | `runtime/routing-policy.ts` (`CANONICAL_ROUTE_POLICY`) | The lane authority, rendered by `.llm/harness/workflow/lane-policy.md`; it references `config/models.ts` for the ids.                                                                 |
| **Tool version**                                    | `config/versions.ts`                                   | `NODE_TARGET_VERSION` + `COMPONENT_EXPECTED_VERSIONS` (bump targets), `COMPAT_PINNED_TOOL_VERSIONS` (frozen verification markers), `TEST_COMPONENT_VERSIONS` (test-only).             |
| **Endpoint / host / installer URL**                 | `config/endpoints.ts`                                  | Node dist host, npm registry, Antigravity host + installer, OpenRouter base URLs, GitHub API base. Keep the `agentic:wsl-foundation` `--allow-net=` allowlist in `deno.json` in sync. |
| **Provider profile / OpenRouter preset**            | `runtime/provider-profiles.ts`                         | Credential-key wiring and preset effort/purpose; model ids come from `config/models.ts`.                                                                                              |
| **Fallback / lane policy**                          | `runtime/routing-policy.ts`                            | Fallback candidate rules, subscription/approval gates, dated transitions.                                                                                                             |
| **Agent / provider vocabulary**                     | `runtime/contract.ts`                                  | `AGENT_KINDS`, `PROVIDER_KINDS`, `EFFORTS`, diagnostic codes, `EXIT_CODES`.                                                                                                           |
| **Deps**                                            | root `deno.json` import map + `deno.lock`              | The suite has no third-party deps of its own; it uses `Deno.*` and Web APIs by design.                                                                                                |

## Environment overrides

The suite ships portable: every machine-specific default is read through an env override whose
fallback is the historical value, so with nothing set the behavior is byte-identical to before.
Reads are permission-guarded — a tool without `--allow-env` simply falls back.

| Env var              | Overrides                                             | Default                      |
| -------------------- | ----------------------------------------------------- | ---------------------------- |
| `NETSCRIPT_WSL_USER` | The WSL Linux user the suite drives Codex under.      | `codex`                      |
| `NETSCRIPT_WSL_HOME` | The WSL home dir (brief dest, sessions-dir fallback). | `/home/<NETSCRIPT_WSL_USER>` |

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
deno task agentic:sync-claude:check                                                     # mirrors in sync
```

Unit tests use a local throw-based `assert`/`assertEquals` because the repo's import map is empty
(so `@std/assert` is unavailable) — matching the repo's `fitness/` convention. `parseThreadInfo` is
asserted against the **real** launch fixture at `lib/__fixtures__/codex-launch-s1.head.log` (thread
`019ee68a-9a41-7f01-b7d5-072fbd469b09`).
