use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push + PR comment trail, run-dir artifacts; no
  self-certification.
- netscript-doctrine — `packages/cli` is framework code: `quality:scan` + `arch:check` per slice; no
  `any`/casts/lint-ignores; IO only at the gate/runtime edge.
- netscript-cli — E2E surface (`packages/cli/e2e`: `cli-surface.ts` gate classes,
  `capability-suites.ts` ordering, `runtime/` gate modules from S6/S8, `run-gate.ts` receipts).
- netscript-tools — scoped wrappers, `check:emitted-samples`, gate receipts, lock hygiene.
- aspire — 13.5 facts: `aspire doctor --format Json --non-interactive --nologo`;
  `aspire describe --follow --format Json` (NDJSON stream); `aspire stop --apphost <exact>` then
  `aspire stop --force --apphost <exact>`; `aspire resource <name> restart|start|stop`; S8's typed
  `aspire resource <db>-cli <command> --<arg>`. **No AppHost start, no containers, no `e2e:cli`
  runtime suites in this phase.**

## Context

- Slice **S10 — E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force`
  cleanup, resource-command gate class** (#1722, epic #1712; partial for #1372 — reference only,
  never close). Contract = `sub-issues/10-e2e-gate-upgrades.md` in the supervisor run dir (read
  fully). Supervisor run dir (read-only):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — `plan.md`, `drift.md` D-39/D-42/D-43/D-45, `slices/s8/handoff-phase-a.md`,
  `slices/s9/review-tier-a.md`.
- **Dependencies:** S8 (typed `<db>-cli` commands — you are stacked on its head); S7
  (teardown/leak-check contract on `origin/fix/aspire-13-5-s7-teardown-leak-check`, files under
  `.llm/tools/agentic/teardown/` only: `probes.ts`
  `ASPIRE_MOUNTS = 'com.microsoft.developer.usvc-dev.mountsLabel'`, `ASPIRE_DCP_APPHOST_PATH` env
  evidence, `--apphost` argv matching, `aspire-managed`/`dcp` process names). S7 is **not** in your
  ancestry: reuse its **contract** (same label/env/argv rules, cite the file:line on that branch)
  inside `packages/cli/e2e`; do not copy S7 commits, do not import from `.llm/tools`, and record in
  `drift.md` that the post-stop container probe mirrors S7's contract pending S7's merge.

### Your worktree / branch — STACKED ON S8 (→ S6 → S5)

- Worktree: `/home/agent/projects/netscript/worktrees/007-aspire-s10` (NAS; work ONLY here).
- Branch: `test/aspire-13-5-s10-e2e-gate-upgrades`, based on S8's settled phase-A head `9dd06647`.
  No upstream — push only with
  `git push origin HEAD:refs/heads/test/aspire-13-5-s10-e2e-gate-upgrades`. Draft PR **base
  `feat/aspire-13-5-s8-typed-resource-commands`**; the supervisor retargets after S8 merges. Never
  touch S5/S6/S8 commits; rebase onto the new S8 head only if the supervisor says S8 moved.

### Host (authoritative, D-39)

- Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400, node 24.20.0 via
  `/home/agent/.local/bin/mise exec --` (the `mise` shell function is broken). Docker 28.5.2 at
  `tcp://netscript-dind:2375`; inotify 1024; tini; lifecycle tests trustworthy (no inotify/zombie
  waiver).
- `aspire ps --format Json --nologo --non-interactive` must read `[]` and `docker ps -a` empty
  before/after any `aspire` command. **You never start an AppHost**; AppHost-boot gates are
  environment-blocked on this host (D-42/D-43) — not yours to solve. Allowed non-runtime reads:
  `aspire doctor --format Json --non-interactive --nologo` (capture as a receipt fixture),
  `aspire describe --help`, `aspire stop --help`, `aspire resource --help`.

### Phase split

- **Phase A (this dispatch, static):**
  1. **RED-first gate tests** under `packages/cli/e2e/tests` for each new/changed gate, driven by
     recorded fixtures (doctor JSON from this host; a hand-built NDJSON `describe --follow` stream
     with a converging resource set; stop/force-stop command transcripts; `docker ps` label
     fixtures).
  2. **Preflight receipt:** `preflight.aspire` runs
     `aspire doctor --format Json --non-interactive --nologo`, persists the JSON through the gate
     receipt path, fails on any `status: fail`, warns on `warning` (Docker-version and cert warnings
     are warnings).
  3. **Readiness evidence:** during `runtime.aspire-start`, capture
     `aspire describe --follow --format Json` NDJSON into `.netscript/e2e/aspire-describe.ndjson`
     bounded by `ASPIRE_CLI_START_TIMEOUT` (reuse S8's `resolveDbCliTimeoutSeconds()` budget
     semantics); wait gates assert convergence from the stream (last-seen state per resource)
     instead of polling, with the existing `healthReports` object semantics from S6.
  4. **Cleanup:** `CLEANUP_ASPIRE_STOP` = `aspire stop --apphost <exact>` then, only with
     `--cleanup`, `aspire stop --force --apphost <exact>`; post-stop probe lists containers whose
     `ASPIRE_MOUNTS` label / DCP evidence maps to that AppHost path (S7 contract) and asserts zero;
     receipt records the docker probe output.
  5. **Gate class `resource-command`** in `cli-surface.ts`: invoke S8's typed commands
     (`aspire resource <db>-cli <cmd> --<arg>`) and background-child restarts
     (`aspire resource <bg> restart`), asserting state via `describe`; placed in `scaffold.runtime`
     on both tiers after the S8/S9 runtime gates and before cleanup; skip receipt (never silently
     absent) when the runtime phase does not run.
  6. **Docs/regeneration:** `packages/cli/e2e/README` gate table and the netscript-cli skill gate
     table if they list gates; `gen:assets-barrel` if skills changed; `check:emitted-samples`.
  7. **Gates:** scoped check/lint/fmt + raw lint/fmt on config-excluded files, `quality:scan`,
     `arch:check`, `check:assets-barrel`, `check:publish-assets`, `check:emitted-samples`, tests for
     touched roots; write a `#1372` update draft (what S10 covers / what remains) in your run dir —
     the supervisor posts it.
- **Phase B (lease-backed, later, same PR):** `scaffold.runtime --cleanup` green on both tiers with
  the new receipts under `.llm/tmp/gate-receipts/`, persistent-container leak = 0 receipt. **Do not
  attempt** (D-43).

## Boundaries

No new suites; no OpenHands trigger changes; no saga compensation semantics (#1372 residual); no
product changes outside `packages/cli/e2e` (+ README/skill table); no S5/S6/S8/S9 commit edits; no
pins; no runtime.

## Draft PR and receipts

- After commit 1: draft PR (base `feat/aspire-13-5-s8-typed-resource-commands`), title
  `test(e2e): structured Aspire 13.5 gate receipts — doctor, describe --follow, stop --force, resource-command class (S10)`;
  body per `.github/pull_request_template.md`, `## Scope` = `Closes #1722`, `Part of #1712`,
  `Refs #1372` (no closing keyword); labels `type:test`, `epic:aspire-13-5`, `area:tooling`,
  `area:cli`, `gate:e2e`, `priority:p1`, `status:impl`; milestone `0.0.7`. State the S8 stacking,
  the S7 contract mirroring, and that Phase B is lease-backed and environment-blocked.
- Commit by slice, push with the explicit refspec, one `## [PHASE: IMPL] S10 slice N` comment per
  commit. Keep your run dir current.

## Stop conditions

- Final non-empty line exactly `DONE` when Phase-A slices are pushed, the draft PR carries the
  commit trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not
  self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>`.
