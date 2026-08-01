use harness

# Slice brief — #1046: run-owned teardown, enforced

Worktree: `/home/codex/repos/fix-1046` · Branch: `fix/1046-run-owned-teardown` (no upstream, by
design) · Base: `origin/main` @ `26b01ea5b` · Run dir:
`.llm/runs/fix-1046-run-owned-teardown--enforced-teardown/`

## SKILL

Operate under `.agents/skills/netscript-harness`. Also load, and follow, in this order:

1. `.agents/skills/netscript-tools` — how `.llm/tools/` wrappers, evidence and exit codes are
   structured here. Gate evidence is wrapper-sourced; raw `deno check .` is a non-verdict.
2. `.agents/skills/netscript-deno-toolchain` — how `deno task` entries are added and named, and the
   dependency/inspection surface. Your new tasks must match this skill's conventions.
3. `.agents/skills/aspire` — the internal Aspire diagnostic skill. It already carries the standing
   rule "leave pre-existing containers alone — deleting them destroys another session's data".
   Your implementation must be the machine-enforced form of that sentence.
4. `.agents/skills/netscript-pr` — PR body, labels, closing-keyword rules.
5. `.agents/skills/rtk` — use `rtk git diff` / `rtk grep` for inspection.

Read before writing code: `.llm/runs/fix-1046-run-owned-teardown--enforced-teardown/research.md`
(F1–F10) and `plan.md` (D1–D8, slices 1–11). They are the authority; this brief is the contract.

## Evaluator lane — read this before you plan anything

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

`plan-eval.md` already exists in the run dir with the supervisor's `PASS`. Do not overwrite it.

## Why this exists

Agent runs leak Aspire AppHosts and Docker containers. A single session left three exited
`postgres-*` containers behind, and the resulting resource contention made a
`behavior.service-health` timeout look like a product defect. Cleanup today is prose, so it is
skipped under budget pressure — exactly when leaks happen.

## The single hardest requirement — read twice

**Up to a dozen slices run on this machine concurrently.** At research time this host had
`postgres-*` containers belonging to `fix-1011` **and** `fix-1025` running simultaneously, plus a
live AppHost owned by `fix-1011`. Killing by name pattern (`postgres-*`), or by `aspire stop --all`,
or by "everything Docker", would have destroyed both sibling runs mid-test — manufacturing exactly
the phantom failure this issue exists to eliminate. **That outcome is worse than the leak.**

So: **if ownership cannot be proven, do not touch it. Default to leaving it alone.**

## What to build

Follow `plan.md` slices 1–11 in order. The non-negotiable content of each:

### A. Ownership (`.llm/tools/agentic/teardown/ownership.ts`) — slice 2

Total, three-valued, pure: `classify(...) -> 'owned' | 'foreign' | 'unproven'`.

`owned` requires at least one **positive** proof:

- **P1 path containment** — the resource's own absolute path resolves inside this run's worktree
  root. AppHost: `appHostPath` from `aspire ps --format Json`. Container: the `src=` value inside
  label `com.microsoft.developer.usvc-dev.mountsLabel`. Compare by **path segment**, after
  `realpath`; `/repos/fix-104` must not match `/repos/fix-1046`.
- **P2 registry identity** — matches an entry this run wrote at creation time, on the **pair**
  `(pid, creatorProcessStartTime)` (containers) / `(appHostPid, appHostStartedAt)` (AppHosts).
  A bare PID match is **not** a proof — PIDs are reused.

`foreign` = positively resolves under a different `/home/codex/repos/<other>` worktree.
`unproven` = neither (e.g. the live `garnet-*` / `redis-*` containers, which carry the `usvc-dev`
label set but **no** `mountsLabel` — this case is real, see research F4 caveat).

**Only `owned` is ever actionable.** `foreign` and `unproven` both go to escalation.

Required tests, and they must be red before the code exists:

- empty registry + a host full of foreign resources ⇒ **zero** actionable resources;
- `/repos/fix-104` vs `/repos/fix-1046` prefix confusion ⇒ not owned;
- same PID, different `creatorProcessStartTime` ⇒ not owned;
- missing / unparseable label ⇒ `unproven`, never `owned` (fail closed — this is the direction that
  matters when Aspire changes its label schema);
- a candidate whose command line matches `aspire\s+mcp\b` is rejected even when it otherwise
  classifies as `owned`.

### B. Registry (`run-resources.ts`) — slice 3

`<slice-dir>/run-resources.json`, schema-versioned, atomic write (tmp + rename, the pattern already
used by `heartbeat()` in `run-codex-slice.ts`). Records AppHosts and containers this run created,
with the identity pairs above and a `startedAt`.

### C. Probes (`probes.ts` + `ports.ts` + `__fixtures__/`) — slice 4

Read-only, time-bounded, behind ports so tests never shell out. `aspire ps --format Json` and
`docker ps -a --format '{{json .}}'` (or `docker inspect` for labels). Pin the observed Aspire
13.4.6 shapes as fixtures — research F3/F4 contain real captured output; use it.

### D. `leak-check.ts` — slice 5

**Read-only. Never kills anything, ever.** Emits JSON on stdout and writes
`<slice-dir>/leak-report.md`. For every surviving resource: kind, identity, age, the run that
appears to own it (worktree path when derivable, else `unknown`), and the **exact copy-pasteable
command the user could run** (`aspire stop --apphost <path> --non-interactive --nologo` or
`docker rm -f <id>`). Stale threshold: a constant (2 h) plus `--stale-after`.

A leak nobody is told about is how the contention went unnoticed for hours — so never silently
ignore an `unproven` resource either. Report it as unknown-owner.

### E. `teardown.ts` — slice 6

- Defaults to `--dry-run`; mutating requires an explicit `--apply`.
- AppHost: one `aspire stop --apphost <path> --non-interactive --nologo` **per owned AppHost**.
- Container: `docker rm -f <single-id>` only for a container that is `owned` **and** still present
  after its owning AppHost was stopped, with labels **re-read immediately before removal**; if the
  re-read no longer proves ownership, abandon and escalate.
- Everything `foreign` / `unproven` → escalation report, no action.

**Forbidden anywhere in your diff, in any form** — add
`.llm/tools/agentic/teardown/forbidden-commands_test.ts` that greps the repo (excluding
`.llm/runs/**`) and fails on each:

```
docker ps -aq        docker rm -f $(          xargs … docker rm
docker container prune   docker system prune      aspire stop --all
```

`docker ps -aq | xargs -r docker rm -f` was removed from the shipped `help.md` in PR #1034 for being
destructive on shared hosts. Do not reintroduce it here under any framing.

### F. Never kill `aspire mcp start` — slice 2 + 6

Structural, not hopeful: the only AppHost truth source is `aspire ps --format Json` (which does not
list MCP servers) and the only AppHost verb is `aspire stop --apphost <path>`. There must be no code
path that can express "stop an MCP server". The regex guard is defence in depth, not the mechanism.

### G. Enforcement — slice 8 (this is the acceptance box that matters most)

In `.llm/tools/agentic/codex/run-codex-slice-lib.ts` add the pure function:

```ts
export function enforceTeardown(contract: DoneContract, leaks: LeakReport): DoneContract;
```

`{state:'done'}` + **owned** survivors ⇒ `{state:'blocked', reason:'teardown: …'}` naming each
surviving resource and its exact stop command. `foreign` / `unproven` entries **must not** downgrade
the contract — a run must never be failed for a sibling's resources.

Wire it into `run-codex-slice.ts` on the `done` branch: leak-check → if owned survivors, run the
scoped teardown once → re-check → `enforceTeardown`. A slice that leaves its own AppHost running
exits `3` (blocked), not `0`. Keep `parseDoneContract` a pure parser; do not fold the two together.

Test that the downgrade is load-bearing: assert `done + owned survivor ⇒ blocked`, and
`done + foreign survivor ⇒ done`.

### H. e2e default — slice 9

`.llm/tools/e2e/scaffold-e2e-test.ts` currently has `cleanup: false` as the default and `--cleanup`
as an opt-in (research F1) — that is the leak's origin. Flip the default **on**, add a `--no-cleanup`
opt-out that still writes a registry entry and prints the escalation line, and register the AppHost
into `run-resources.json` at start (`#startAspire`). Its existing `stopCommand` is already correctly
per-AppHost — reuse it, do not replace it.

### I. Deno toolchain surface — slice 7

Add, following `.agents/skills/netscript-deno-toolchain` conventions and the existing `agentic:`
prefix:

- `agentic:leak-check` — read-only reporter
- `agentic:teardown` — scoped teardown (`--apply` required to mutate)

Index them in `.llm/tools/entry.md` and `.llm/tools/README.md`.

### J. Discoverability from the symptom — slice 10

Presence is not enough: `aspire otel` and `netscript plugin doctor` were invoked **zero** times
across five agent runs while being named six times in shipped skills. Make the new verbs reachable
from the **symptom** in four places: `AGENTS.md` (new "Resource hygiene" section),
`.llm/harness/workflow/run-loop.md` § Close, `.llm/tools/entry.md` / `README.md`, and the
`netscript-tools` + `netscript-deno-toolchain` skills. Index at least these symptoms:

- "my run failed and I do not know what is still running"
- "`behavior.service-health` timed out"
- "ports are already in use"
- "there is a `postgres-*` container I did not start"

### K. Dogfood the consumer surface — slice 10

Owner's instruction: we ship `aspire`, `deno` and a symptom-indexed `help.md` to consumers via
`netscript agent init` and then do not use them ourselves.

**Do not create or edit anything under `skills/**`.** Those files live on PR #1034's branch, are
still moving, and `check:assets-barrel` there now diffs `skills.generated.ts`. Instead add
`deno task agentic:dogfood-skills`, which runs the local CLI's `agent init` bundle into
`.agents/generated/consumer-skills/` for this repo's own agents — installing whatever the bundle
contains, so it picks up #1034 automatically on merge and cannot fork from it — and reference that
surface from `AGENTS.md`. Do **not** hand-edit `.claude/skills/**`; it is a generated mirror of
`.agents/skills/**` (regenerate with `deno task agentic:sync-claude`).

If, after this, acceptance box 5 ("`aspire`, `deno`, `help.md` installed and referenced") cannot be
evidenced end-to-end on this base, **say so plainly in the PR body** and leave the box unticked.
Never tick a box to make a gate green.

## Method and constraints

- **Do not poll.** Use `.llm/tools/harness/watch-run.ts <run-dir>`.
- **Do not pass `--unstable-kv` to `.llm/tools/run-deno-check.ts`** — it emits it by default and
  rejects the flag with exit 1.
- Gate evidence is wrapper-sourced: `run-deno-check.ts`, `run-deno-lint.ts`, `run-deno-fmt.ts
  --check`, `deno task doc:lint`, `deno test`, `deno task agentic:sync-claude:check`.
  `quality:scan` / `arch:check` / `jsr-audit` are **N/A** (no `packages/**` / `plugins/**` change) —
  record them as N/A, do not silently omit them.
- Commit per slice with a message naming what the slice **proves**. Push explicitly, every time:
  `git push origin HEAD:refs/heads/fix/1046-run-owned-teardown`, then confirm local and remote SHAs
  match. A previous run left six good commits unpushed while CI graded a stale head.
- After each slice, comment on the draft PR with scope, commit hash, and gate evidence; update
  `worklog.md` + `context-pack.md` in the same commit.
- Every `gh` command takes `--repo rickylabs/netscript`.

## Do not leak while building this

You are building teardown enforcement. Stop any AppHost you start (by `--apphost`, never `--all`),
scope any container removal to your own run, leave `aspire mcp start` alone, and record in
`worklog.md` anything you found on the host or left behind. The foreign resources listed in
`research.md` § F10 belong to `fix-1011` and `fix-1025` — **do not touch them**; if they are still
present when you finish, report them, do not remove them.

## Terminal contract

End your final response with exactly `DONE` or `BLOCKED: <reason>`.
