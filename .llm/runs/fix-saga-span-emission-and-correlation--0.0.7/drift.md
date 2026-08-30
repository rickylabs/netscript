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
