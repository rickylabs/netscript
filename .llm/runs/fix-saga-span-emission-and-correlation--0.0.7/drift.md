# Drift Log: Emit and correlate saga cascade spans

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — Remote-tracking main advanced after leaf baseline

- **What:** The worktree `HEAD` remains at the owner-locked `f8b4f804`, while the freshly observed
  local `origin/main` remote-tracking ref is `952cc106`.
- **Source:** Raw `git rev-parse HEAD` and `git rev-parse origin/main` during S1.
- **Expected:** Owner briefing identifies head/base as `origin/main @ f8b4f804`.
- **Actual:** The branch is correctly at `f8b4f804`; only the moving tracking ref advanced.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` records the immutable baseline. No rebase or product edit was made;
  changing the baseline is coordinator-controlled.

## 2026-08-30 — Owner-assigned implementation author owns S1

- **What:** The current Codex implementation-author session performed S1 research and plan.
- **Source:** Owner briefing: “You are the implementation author” and “S1 — research and a locked
  plan.”
- **Expected:** Generic lane policy routes deep analysis to its default research model.
- **Actual:** The explicit owner assignment takes precedence for this leaf; formal PLAN-EVAL remains
  a separate opposite-family session.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` route table and override.

## 2026-08-30 — RTK executable unavailable

- **What:** The repo-preferred token-saving proxy is not installed in this environment.
- **Source:** `rtk --version` returned `rtk: command not found` during S1.
- **Expected:** Read-heavy git/rg commands are prefixed with RTK when available.
- **Actual:** Focused raw `rg`/git reads and structured repository wrappers are used instead.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Gate table names raw commands and structured wrappers as verdict sources.

## 2026-08-30 — Supervisor review corrected derivative and runtime gate ownership

- **What:** The initial S1 plan omitted `check:mcp-export-corpus` and listed the leased
  `scaffold.runtime` command in the author validation table despite the leaf's no-runtime boundary.
- **Source:** Supervisor plan review at `d1436696` and direct inspection of
  `.llm/tools/docs/generate-export-surface-corpus.ts` plus root task definitions.
- **Expected:** All four shared derivative writers are represented with non-mutating checks, and
  cluster-wide runtime gates are assigned only to a lease-holding supervisor.
- **Actual:** The first plan carried only three derivative gates and described the runtime command
  as later work without an explicit author-must-not-run owner.
- **Severity:** significant
- **Action:** fix
- **Evidence:** The corrected plan adds measured baseline/expected-stale MCP corpus evidence and
  marks Flow-B runtime proof `REQUIRED, supervisor-coordinated, author-must-not-run`.

## 2026-08-30 — PLAN-EVAL corrected completion ownership and red-before mechanics

- **What:** Cycle 1 found that the planned bridge-owned `saga.cascade.complete` span would wrap only
  `return;`, and that constructing a compensator with a future instrumentation option would make S2
  fail during type checking instead of at the two behavioral assertions.
- **Source:** PLAN-EVAL verdict commit `7b96c498` over plan commit `742d870d`.
- **Expected:** Every retained factory surrounds a real operation, and the red-before proves the
  defect using only the locked baseline's type surface.
- **Actual:** Complete work is owned by the engine's persisted transition, while the original S2
  sketch depended on a not-yet-existing constructor field. The same review also exposed divergent
  engine/compensator correlation precedence and an unacknowledged engine-direct bus path.
- **Severity:** significant
- **Action:** fix
- **Evidence:** Plan D1/D6/D8/D9 now lock engine-owned completion and single-resolution correlation
  transport; the S2 contract requires two assertion failures from a baseline-compatible composed
  runtime; direct engine-as-bus dispatch is explicitly non-scope; `docs:readme:check` is gate 17.

## 2026-08-30 — PLAN-EVAL found two out-of-ceiling signature consumers

- **What:** Cycle 2 found that `.llm/tools/release/baselines/public-surfaces.json` snapshots the
  exported signatures changed by this leaf, while `docs/site/reference/plugin-sagas-core/index.md`
  carries manually maintained per-subpath export counts that can become stale if S3 adds exported
  symbols.
- **Source:** PLAN-EVAL verdict commit `81c5f874` over plan commit `f5994260`.
- **Expected:** Every generated/signature consumer is either within the locked ceiling or named as a
  stop/report handoff; outside-ceiling documentation is not edited silently.
- **Actual:** The release baseline is a full-suite-only, non-blocking consumer and the docs page has
  no enforcing tool. Neither path was in the approved 19-path ceiling.
- **Severity:** minor
- **Action:** accept and hand off
- **Evidence:** The plan ceiling-completeness table now records the release baseline as expected to
  classify the optional-field surface change additive/minor and forbids regeneration here. The docs
  export counts remain outside scope and are reported for the docs lane; this author will not edit
  either path.

## 2026-08-30 — Global README gate has unrelated baseline debt

- **What:** `deno task docs:readme:check` exits 1 because `packages/bench/README.md` lacks an
  `## Install` section; the edited `packages/plugin-sagas-core/README.md` passes the same checker
  when selected directly.
- **Source:** S5 global and focused invocations of `.llm/tools/validation/check-readme-standard.ts`.
- **Expected:** Plan gate 17 expected the repository-wide task to exit 0.
- **Actual:** The one reported non-conformant README is outside this leaf's product ceiling and is
  unchanged from locked baseline `f8b4f804`; the in-scope README reports `1/1` conformant.
- **Severity:** minor
- **Action:** accept measured baseline; do not edit outside ceiling
- **Evidence:** Global result `1/36 non-conformant`, focused result
  `A2 README standard OK - 1 README(s) conform`. The final repair's raw base-to-head diff for
  `packages/bench/README.md` exits 0, proving the plan-gate-17 red is identical at `f8b4f804`.

## 2026-08-30 — Plugin JSR audit has unrelated baseline module-tag debt

- **What:** The plugin-side `audit-jsr-package.ts` exits 1 because exported
  `plugins/sagas/doctor.ts` lacks an `@module` JSDoc tag; core audit exits 0.
- **Source:** S6 core/plugin package audit pair.
- **Expected:** Plan gate 12 expected both audit invocations to exit 0 with no new findings.
- **Actual:** `doctor.ts` is byte-unchanged from locked baseline `f8b4f804` and outside this leaf's
  product ceiling. Plugin publish dry-run still exits 0; the audit also reports the existing root
  cardinality and slow-type warnings.
- **Severity:** minor
- **Action:** accept measured baseline; do not edit outside ceiling
- **Evidence:** Raw base-to-head diff for `plugins/sagas/doctor.ts` exits 0; plugin audit reports
  one `F-JSR-2 module-tag` failure and two warnings. This proves the plan-gate-12 red is identical
  at `f8b4f804`.

## 2026-08-30 — IMPL-EVAL found bridge child-key precedence regression

- **What:** Cycle 1 measured that scheduled dispatch overwrote a handler-supplied child
  `correlationKey` with the upstream cross-plane ID. It also identified a compensation-handler
  trace-context regression under noop instrumentation.
- **Source:** IMPL-EVAL cycle 1 verdict `72be7d12`, findings F2 and F3.
- **Expected:** Engine-selected values feed telemetry and explicit parent handoff without silently
  replacing a child message's domain identity or deleting trace context already present at the
  handler boundary.
- **Actual:** `withScheduledContext` was parent-wins, and the compensator replaced the base
  message-trace fallback with only the optional new span context.
- **Severity:** significant
- **Action:** fix within the locked bridge, compensator, test, README, and run-artifact ceiling.
- **Evidence:** Repair red at `bd89e523` exits 1 with 10 passed / 2 failed assertions. The final fix
  makes explicit scheduled keys child-wins, keeps nested sends keyless while transporting the
  cross-plane ID through separate engine execution context, and restores message trace context only
  for the handler—not for span parenting or correlation precedence.

## D-INT-1 — main-integration drift: stale import from a cross-PR file move (NOT #1368 product scope)

**Discovered:** during the `f309dfb3b` convergence, by CI `check-test` on run `33351053382`.

**Defect.** `packages/cli/e2e/src/application/gates/scaffold/ui-data-screen-gates.ts:5` imported
`./generated-app-name.ts`, which no longer exists. TS2307, 3 occurrences, 1 unique path — the
repo-wide `deno task check` gate, red.

**Cause — a semantic conflict between two independently-green PRs.** #1743 *moved*
`generated-app-name.ts` into `scaffold/runtime/`. #1781 *added* `ui-data-screen-gates.ts` importing
the pre-move path, and was validated (including a terminal off-host `e2e-cli.yml` SUCCESS) at a head
that did not yet contain #1743's move. Neither PR was wrong at its own head, and neither PR's CI
could have caught it: the breakage exists only in the *combination*. Both merged, so **`main` itself
is red on `deno task check`** — this leaf inherited the failure, it did not introduce it.

**Repair (coordinator-authorized, bounded).** One line: the import now resolves to
`./runtime/generated-app-name.ts`, matching the three sibling gate files (`runtime-gates.ts`,
`database-gates.ts`, `ui-ai-gates.ts`) that already use that path. Exported symbol `generatedAppName`
is unchanged, so this is a path correction with no behavioral change.

**No focused regression test added, deliberately.** The check that fires on the wrong path already
exists and already fired: repo-wide `deno check` produced the exact TS2307 that found this. A new
test asserting "this import resolves" would duplicate the compiler with no added coverage. The real
gap is that two individually-green PRs can be red when combined — a merge-queue/integration concern
outside this leaf's ceiling, not something a unit test here would catch. Recorded for the coordinator.

**Scope boundary.** Outside #1368's 19-path product ceiling and unrelated to saga span emission or
correlation. Recorded as main-integration drift; the leaf's own product work is untouched and its
IMPL-EVAL disposition is unaffected.
