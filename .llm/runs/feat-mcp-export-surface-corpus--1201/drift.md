# Drift Log: MCP generated export-surface corpus

Drift is append-only.

## 2026-08-04 — Current export corpus has 35 publishable packages

- **What:** Re-baseline count differs from the issue's measured 36 flat files.
- **Source:** Current `packages/*/deno.json` and `plugins/*/deno.json` publishable-manifest walk.
- **Expected:** 36 generated flat export files in the control-run mirror.
- **Actual:** 35 publishable first-party packages and 268 export subpaths on current main.
- **Severity:** minor
- **Action:** accept; generate from current authoritative manifests and retain issue count only as historical measurement.
- **Evidence:** `research.md` R-baseline; command output in supervisor session.

## 2026-08-04 — Pre-existing lockfile change is outside slice ownership

- **What:** Worktree was dispatched with a modified `deno.lock`.
- **Source:** Raw `git status` and `git diff -- deno.lock` before any task command.
- **Expected:** Clean dispatched worktree.
- **Actual:** One added `jsr:@netscript/queue@0.0.4` dependency row under an existing package graph.
- **Severity:** minor
- **Action:** accept as user-owned working-tree state; never stage, revert, or attribute it to this PR.
- **Evidence:** baseline raw diff captured before implementation.

## 2026-08-04 — Milestone evaluator composition overrides local formal PLAN-EVAL

- **What:** Standard run-loop calls a separate local PLAN-EVAL; owner brief forbids it for this milestone PR.
- **Source:** Owner brief; `.llm/harness/workflow/milestone-run.md` evaluator protocol; orchestrator ruling D6.
- **Expected:** Separate-session local PLAN-EVAL before implementation.
- **Actual:** PLAN-EVAL is composed per milestone-run.md (orchestrator waiver); plan is still locked and recorded before source work.
- **Severity:** minor
- **Action:** accept authorized workflow override; retain draft→ready augment, OpenHands, and orchestrator pre-merge evaluation composition.
- **Evidence:** `supervisor.md`; `plan-eval.md`.

## 2026-08-04 — Query behavior remains in the application layer

- **What:** The locked risk text anticipated four behavior-specific methods on the corpus port.
- **Source:** Contract-first implementation and Archetype-2 port review.
- **Expected:** A port method corresponding to each MCP question form.
- **Actual:** `ExportSurfaceCorpusPort` exposes one narrow `load()` boundary; the four bounded query behaviors remain application flows over immutable corpus data.
- **Severity:** minor
- **Action:** accept; this prevents MCP query policy from coupling the generated-corpus adapter and keeps the port technology-facing.
- **Evidence:** `src/ports/export-surface-corpus-port.ts`; `src/application/export-surfaces/export-surface-flows.ts`.

## 2026-08-04 — Merge-readiness E2E exposed an unrelated generated database-health failure

- **What:** The required full CLI E2E did not produce a wholly green suite.
- **Source:** `deno task e2e:cli` after the complete MCP gate column.
- **Expected:** 52 passing `scaffold.runtime` gates.
- **Actual:** 51 passed; the generated users service returned HTTP 503 because its Prisma raw database query failed. Scaffold, DB init/generate/seed, generated checks, Aspire topology, worker behavior, cleanup, and all slice-specific gates passed.
- **Severity:** minor (external to changed surface)
- **Action:** record without modifying unrelated CLI/database code; cleanup passed and the leak reporter found no run-owned survivors.
- **Evidence:** suite end summary at 606,622 ms; `behavior.service-health` failure; `cleanup.aspire-stop` and container cleanup PASS.
