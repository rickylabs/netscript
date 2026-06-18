# PLAN-EVAL cycle 2 — chore/prod-readiness

## Verdict

**`PASS`**

## Rationale (one paragraph)

All 7 cycle-1 required fixes are resolved. Each is visible in `plan.md`, the `## Design` section of `worklog.md`, and the tree at `cc3b8731` (off `release/jsr-readiness`). F3 (`ConnectionStrings__{provider}db` legacy alias) is recorded as functional with an arch-debt entry that names readers, writers, owner, reason, and target. S4′ (`mysqlJsonExtension`) is governed by the new PR-7 deprecate-before-remove rule and is correctly classified in G1-3b (deprecate-only this run, removal deferred). S5 (`trustedConnection`) is correctly classified as a G1-3c behavioural refactor with the internal writer at `mssql.adapter.ts:415-416` named, plus an adapter behavioural test gate — not a symbol delete. S6's scaffolder consumer at `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` is now in G1-5's touch list alongside the scaffolder test fixture. Every public-surface slice (G1-3a/b/c, G1-4, G1-5) carries a `scaffold.runtime` smoke. Per-slice file lists + LOC budgets are present for G1-0..G1-6, and G1-5 is explicitly flagged for sub-split if its migration exceeds ~30 LOC. G1-6 is bounded to G1-0..G1-5 surfaces + `.llm/tools/`, with newly-discovered dead surfaces recorded + deferred. The off-limits guardrail holds: `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, and `catalog:` references appear only in the plan's Non-Scope exclusion rows, never in a touch list. All 8 `plan-gate.md` checklist boxes are satisfied; no open decision would force rework if deferred. Implementation may begin.

## Summary

I was the cycle-2 PLAN-EVAL evaluator for the `chore/prod-readiness` cleanup group of the `release/jsr-readiness` umbrella. Cycle 1 returned `FAIL_PLAN` with 7 mechanical fixes; the supervisor's remediation (commit 9ed3791b) was the input. I re-walked each cycle-1 fix against the actual tree on `chore/prod-readiness` @ `cc3b8731` and re-walked the full `plan-gate.md` checklist. All 7 fixes verified; all 8 plan-gate boxes checked. Verdict: **PASS**. Wrote the cycle-2 verdict to `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` (overwriting the cycle-1 file as the trigger comment directed). I did not post a PR comment — the workflow owns that.

## Cycle-1 fixes — verification status

| # | Cycle-1 fix | Tree verification | Plan verification | Result |
|---|-------------|-------------------|-------------------|--------|
| 1 | F3 record the resolution (functional + arch-debt) | writer line numbers (139, 130, 98) and reader line numbers (48, 71, 94) all match; arch-debt entry present with all 7 fields | research.md + plan.md all carry the F3 RESOLVED marker with readers cited | **VERIFIED** |
| 2 | S4 deprecate-first (PR-7) → G1-3 split | mssqlJsonExtension @ `:554` deprecated; mysqlJsonExtension @ `:571` NOT deprecated — the asymmetric state PR-7 hinges on | plan.md G1-3b + PR-7 + Open-Decision Sweep all reflect this | **VERIFIED** |
| 3 | S5 name the internal rewrite (G1-3c refactor, not delete) | `mssql.adapter.ts:65-66` `@deprecated Use authentication.type = 'ntlm' instead`; writer at L414-415 sets `config.options!.trustedConnection` | plan.md G1-3c + Risk Register + worklog Design all classify this as a refactor, not a delete | **VERIFIED** |
| 4 | S6 scaffolder consumer in G1-5 | `job-scaffolders.ts:64-65` emits `.schedule(...)` into generated worker modules; no existing scaffolder test fixture in the tree (must be created) | plan.md G1-5 + Per-slice file list + Risk Register all name the scaffolder + fixture + scaffolder test | **VERIFIED** |
| 5 | `scaffold.runtime` smoke on every public slice (G1-3a/b/c, G1-4, G1-5) | n/a (gate is post-implementation) | plan.md Slice table + Fitness Gates + prose all confirm smoke on every public slice | **VERIFIED** |
| 6 | Per-slice file list + LOC budget; single-concern; sub-split flag for G1-5 | n/a (file lists are pre-implementation) | plan.md §"Per-slice file list + LOC budget" present with full table; G1-5 explicitly flagged for sub-split | **VERIFIED** |
| 7 | G1-6 bounded | n/a (scope is pre-implementation) | plan.md PR-6 + G1-6 row + Per-slice file list + worklog Design all bound G1-6 to G1-0..G1-5 surfaces + `.llm/tools/`; newly-discovered dead surfaces recorded + deferred | **VERIFIED** |

Off-limits guardrail (re-confirmed): `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, and catalog/`catalog:` appear only in Non-Scope exclusion rows; never in any touch list. **PASS**.

## Plan-Gate checklist (all 8 boxes checked)

- Research present and current — **PASS**
- Decisions locked — **PASS** (PR-1..PR-7; PR-7 added in cycle 2)
- Open-decision sweep — **PASS** (F3, S4′, S5 all closed; no new open decisions)
- Commit slices (< 30, gate + files each) — **PASS** (G1-0..G1-6, G1-3 split, G1-5 sub-split flag, per-slice file list + LOC)
- Risk register — **PASS** (8 risks with mitigations)
- Gate set selected — **PASS** (publish:dry-run, scoped check, test, lint/fmt, validate-claude-surface, arch:check, scaffold.runtime smoke, full e2e:cli)
- Deferred scope explicit — **PASS** (Non-Scope, Hidden Scope, PR-6 bounds G1-6, PR-7 defers S4′)
- jsr-audit surface scan (pkg/plugin) — **PASS** (public-surface slices identified; cycle-1 S6 consumer undercount closed by Fix #4)

## Subtle observations (informational, not gate-blocking)

- The `mysqljsonextension-deprecated-removal-deferred` arch-debt entry is listed in `plan.md` §"Arch-Debt Implications" as "add" but is not pre-existing. The implementer adds it in G1-3b alongside the `@deprecated` marker. Plan is correct.
- The scaffolder test fixture for G1-5 is a new file the implementer must create. Plan names it correctly.
- Two minor line-number offsets in the plan: `mssql.adapter.ts:415-416` (actual 414-415) and `mod.ts:254` (actual 252-256). Substantive content matches; the implementer should grep for the symbol, not the line number.
- The plan correctly names the scaffolder consumer as a generated-output consumer that must be migrated in the same slice as the public-symbol removal, gated on a full `scaffold.runtime` E2E.

## Changes

- `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` — overwritten (102 lines → 80 lines, denser cycle-2 verdict; previous cycle-1 FAIL_PLAN content replaced by PASS + verification matrix).

No other files were modified. The verdict is in the canonical run-scoped path; the workflow owns the PR comment and branch commit.

## Validation

- Read `.llm/harness/evaluator/plan-protocol.md` (input protocol).
- Read `.llm/harness/gates/plan-gate.md` (8-box checklist).
- Read `.llm/harness/evaluator/verdict-definitions.md` (PASS / FAIL_PLAN / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT definitions).
- Read cycle-2 inputs: `plan.md` (189 lines), `worklog.md` (73 lines), `research.md` (101 lines), cycle-1 `plan-eval.md` (102 lines).
- Spot-checked every cycle-1 fix against the tree:
  - `packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:138-139` (F3 writer)
  - `packages/cli/src/kernel/adapters/windows/environment/env-file-values.ts:130` (F3 writer)
  - `packages/cli/src/kernel/adapters/windows/environment/env-file-content.ts:98` (F3 writer)
  - `packages/service/src/diagnostics/database-connectivity.ts:48,71,94` (F3 readers)
  - `packages/database/mod.ts:252-256` (G1-3a `buildConnectionString` @deprecated)
  - `packages/database/extensions/sql-json.extension.ts:547,554,556,571` (G1-3b mssqlJsonExtension vs mysqlJsonExtension)
  - `packages/database/adapters/mssql.adapter.ts:65-66, 414-415` (G1-3c `trustedConnection` + writer)
  - `packages/fresh/src/runtime/server/define-fresh-app.ts:48,71` (G1-4 `staticFiles`/`fsRoutes` @deprecated)
  - `packages/plugin-workers-core/streams/schema.ts:106` (G1-5 `schedule?` @deprecated)
  - `packages/plugin-workers-core/builders/job-builder.ts:48,130` (G1-5 `schedule()` @deprecated)
  - `packages/plugin-workers-core/public/root.ts:179` (G1-5 `schedule()` @deprecated)
  - `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` (G1-5 scaffolder consumer — emits `.schedule(...)`)
  - `.llm/harness/debt/arch-debt.md` `database-connectivity-legacy-connstring-alias` entry (all 7 fields present)
- Confirmed off-limits guardrail: `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, `catalog:` appear only in plan Non-Scope exclusion rows.

No lints, tests, or builds were run (this is plan evaluation, not implementation; per `plan-protocol.md`: "Do not evaluate code, run the implementation gate set, or comment on slices that do not yet exist.").

## Responses to review comments or issue comments

N/A. I did not post a PR comment — the workflow owns PR comments per the trigger comment. The cycle-1 `pr-review-comments.json` is empty (3 bytes), confirming no prior thread to reply to.

## Remaining risks

For the **implementer** (not for the plan):
1. `mysqljsonextension-deprecated-removal-deferred` arch-debt entry must be **created** by the implementer in G1-3b, not just referenced.
2. Scaffolder test fixture for G1-5 is a **new** file; the implementer creates it. Plan does not promise a pre-existing fixture to update.
3. Two minor line-number offsets in plan; grep-by-symbol, not by line.

For the **plan**:
None. All cycle-1 fixes resolved, all plan-gate boxes checked, all open decisions closed.

## Files in scope

- **Read** (input protocol + run files): `plan-protocol.md`, `plan-gate.md`, `verdict-definitions.md`, `research.md`, `plan.md`, `worklog.md`, cycle-1 `plan-eval.md`, `arch-debt.md`, all touched `packages/cli/...`, `packages/service/...`, `packages/database/...`, `packages/fresh/...`, `packages/plugin-workers-core/...`, `plugins/workers/...` files.
- **Written**: `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` (cycle-2 verdict, overwrites cycle-1).
- **Not written**: `AGENTS.md`, `replies.json`, no PR comment.
