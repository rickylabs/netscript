# Independent PLAN-EVAL round 1 — 2026-10-31

Requested/observed model: claude-opus-5-5; requested effort high. Separate Anthropic
session, read-only Read/Glob/Grep tools, stdin closed; process exit 0. No self-review.

**PLAN-EVAL: #2396 finishing relaunch mc009e-r3 (read-only, blockers only)**

I checked every box in `.llm/harness/gates/plan-gate.md` against `finishing-plan.md`, `supervisor.md:94-118` and the `worklog.md:345-366` Design section. All of them pass except the open-decision sweep, which fails on one blocker.

**Blocker 1: the open-decision sweep is not done, and the plan says "No open design decision" (`finishing-plan.md:48`).**

- **The new type depends on a value.** `ProcedureErrorCode` is not a standalone type. It is defined as `typeof PROCEDURE_ERROR_CODES[keyof typeof PROCEDURE_ERROR_CODES]` (`packages/service/src/auth/types.ts:104-110`), so it points at a runtime constant. That constant is exported separately as a value (`packages/service/src/auth/mod.ts:104`).
- **The current lint result doesn't prove the fix is complete.** `memory-authz-doc-closure.md:3` records exactly one `private-type-ref` today. That is expected: neither facade exports `ProcedureErrorCode` yet, so the linter never looks inside it. Once it is exported, `deno doc --lint` will walk its definition and see `PROCEDURE_ERROR_CODES`.
- **This repo already shows `typeof` triggering that error.** `.llm/runs/docs-rfc-sdk-client-contribution--rfc/research.md:40` records `ReturnType<typeof oc.errors>` as a current `deno doc --lint` `private-type-ref`. So adding only `ProcedureErrorCode` may leave a second diagnostic on both facades.
- **The fallback is not authorized.** The coordinator approved only `ProcedureErrorCode` type re-exports at exactly 23/22 names (`supervisor.md:105-107`). Re-exporting `PROCEDURE_ERROR_CODES` would mean 24/23 names, and possibly a value export rather than a type-only one. That is outside the approved scope and the debt bounds, and the plan says no structural type copy.
- **There is no stop rule.** The plan has no branch for this case, so the implementer would either stall or extend the closure by analogy. The same gap applies if merging `f6839463` brings any other new native type into the auth signature graph.

**Required fix (cycle 1, fixable):**

1. Add an explicit open decision, marked "must resolve now", covering the transitive closure of `ProcedureErrorCode` (and anything else main brings in).
2. Run a scratch doc-lint probe on both facades after the merge and before writing anything. Two outcomes:
   - If `ProcedureErrorCode` alone brings both facades to zero diagnostics, go ahead at 23/22.
   - If any further name is needed (`PROCEDURE_ERROR_CODES` or anything else), stop. Record it in drift and escalate to the coordinator. Do not add exports, change debt bounds, use `export type` on a value, or copy the type locally.
3. Add this as a named risk in the risk section.

**Checked and passing:**

- **Research re-baselined:** baseline d3a52cb1 → main f6839463 is stated at `finishing-plan.md:5-6`.
- **Load-bearing finding spot-checked:**
  - `AuthzDecision.code?: ProcedureErrorCode` is at `types.ts:119`.
  - Both facades omit `ProcedureErrorCode` (`plugins/workers/services/mod.ts:86-99`, `plugins/streams/services/mod.ts:66-79`).
  - The debt entries name exactly 22/21 (`arch-debt.md:2967-3036`) with a fixed 2026-11-10 target and no growth.
- **Slices:** one slice under 30 files, with files and proving gates listed. The optional merge checkpoint comes first (`worklog.md:353-355`).
- **Gate set and jsr-audit:** doc-lint on both facades at zero, the publish dry-runs and the JSR audits are listed. `plugins/workers/tests/public/type-refs_test.ts` checks export targets, not symbol inventory, so adding names won't break it.
- **Deferred scope:** stated at `worklog.md:356-357` and `finishing-plan.md:46-58`.

VERDICT: FAIL_PLAN
