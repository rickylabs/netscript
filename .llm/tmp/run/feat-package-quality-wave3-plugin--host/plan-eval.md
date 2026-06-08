# PLAN-EVAL — feat-package-quality-wave3-plugin--host

- Plan evaluator session: PLAN-EVAL (separate session) / 2026-06-08
- Run: `feat-package-quality-wave3-plugin--host`
- Surface / archetype: `@netscript/plugin` — **A4 — Public DSL/Builder**
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselines the stale canonical `evaluate_plugin.md`/`plan_plugin.md` (5 files / 33 slow types / 0 tests) against the umbrella base `89071df` (the integration point for this stacked sub-branch). Spot-checked load-bearing findings against the tree: `deno.json` has 8 exports entrypoints; `plugin-builder.ts` = 343 LOC; `README.md` = 138 LOC; `doc-lint-out.txt` = 93 errors (84 missing-jsdoc + 9 private-type-ref). All match. |
| Decisions locked                        | PASS   | LD-1..LD-8 each stated with rationale (`plan.md` §Locked Decisions). |
| Open-decision sweep                     | PASS (after direct fix) | Evaluator sweep found one rework-forcing decision the plan left implicit (see below). Resolved directly and locked as LD-8 per the author's "proceed with minor adjustments directly" instruction. Remaining open decisions are correctly marked safe-to-defer. |
| Commit slices (< 30, gate + files each) | PASS   | 24 slices, ordered Phase A→D; each names its proving gate and touched files (`plan.md` §Slice List). |
| Risk register                           | PASS   | 4 risks with mitigations (`plan.md` §Risk Register); plus per-OQ risk table in `research.md` §10. |
| Gate set selected                       | PASS   | Arch 4 column of `gates/archetype-gate-matrix.md`: F-1..F-12, F-14..F-18 (F-13 n/a) + Static + Consumer-import (required for Arch 4). Plan enumerates all of these. Note: `ARCHETYPE-4-dsl-builder.md`'s inline list stops at F-15 and is stale; the plan correctly follows the gate matrix (source of truth), consistent with the same tension recorded for Arch 2. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope + worklog §6 (builder split, AST precision, e2e:cli triggers-health → Wave 4, runtime lifecycle). |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `deno publish --dry-run` SUCCESS / 0 slow types (`dry-run-out.txt`); full-export doc-lint surfaced; every named publishability/surface risk (private-type-ref incl. the upstream-type leak) has a slice (slice 1). |

## Open-decision sweep (evaluator-run)

One rework-forcing decision was surfaced that the plan did not flag:

- **Upstream-typed `private-type-ref` fix.** 2 of the 9 `private-type-ref` errors are on **upstream**
  types used in public signatures — `z.ZodType` in `src/config/validators/manifest-schema.ts:4` and
  `StandardSchemaV1<TPayload>` in `src/abstracts/plugin-stream-topic-contribution.ts:11`. The
  original slice 1 said to "export the interface" / "use explicit annotation or re-export" them. A
  naive barrel re-export would violate **F-15** (re-export-upstream lint) and **AP-14**, directly
  contradicting this plan's own F-15 "pass" claim — forcing rework after slice 1. The doctrine-
  preferred fix is a package-owned minimal structural type (precedent:
  `packages/database/prisma-tracing.ts:37-63`, which mirrors OpenTelemetry's span rather than
  re-exporting it).

  **Resolution (applied directly):** locked as **LD-8**; slice 1, the research private-type-ref
  table, and the F-15 evidence row were amended to require package-owned structural types for the
  two upstream-typed errors and barrel exports only for the 7 package-owned types.

No other open decision would force rework if deferred. The remaining open items (README section
ordering, per-symbol `@example`, builder pre-beta split strategy) are correctly safe-to-defer.

## Verdict

`PASS`

Implementation may begin. The single rework-forcing gap was resolved in-line (LD-8) rather than
returned as `FAIL_PLAN`, per the author's standing instruction to apply non-significant adjustments
directly. Carry LD-8 into slice 1.

## Notes

- Debt handling is sound: the old `packages/plugin — AP-1 (types.ts 1,005 LOC)` entry
  (`arch-debt.md:193`) is open and closeable (slice 19); the new `plugin-builder.ts` 343 LOC entry
  is a valid create with owner/target/closing-gate named.
- Consumer-import validation (required for Arch 4) is covered by slices 21–22 (`packages/cli` +
  `plugins/*`).
- "Research present and current" is satisfied against the umbrella base `89071df` rather than
  literal `main`; for a stacked sub-branch the umbrella is the correct integration baseline.
