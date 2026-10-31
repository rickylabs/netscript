# Native-source phase PLAN-EVAL — 2026-10-31

Same independent Anthropic plan evaluator session as the historical stop branch. Requested
and observed claude-opus-5-5; requested effort high; read-only tools; stdin closed.
New coordinator-authorized phase under comment6541660112.

**PLAN-EVAL round 1, native-source repair phase: #2396 / PR #2421 (same independent session, read-only, blockers only)**

No blockers. Implementation of the bounded source-first repair can begin.

**Scope and authority match the coordinator's decision**
- The verbatim decision in `supervisor.md:120-137` covers everything the plan does: an explicit two-member union, a constant checked against it, an exact equality test, a public-surface diff, and 23/22 names with 24/23 allowed only after a measured API change.
- The two new source paths (`packages/service/src/auth/types.ts` and its test) were added to the write scope before any edits (`supervisor.md:131-134`). `drift.md:136-139` and `context-pack.md:196-199` agree.
- Earlier stop-branch verdicts stay historical (`worklog.md:421-424`). This is a newly authorized phase, not another attempt at the rejected one-name plan.

**The change fixes the round-1 failure at its root**
- Today `ProcedureErrorCode` is defined through `typeof PROCEDURE_ERROR_CODES` (`types.ts:104-110`), which is what drags the constant into the facades' type closure.
- An explicit union of `'procedure_not_found' | 'procedure_retired'` removes that dependency. One type re-export per facade then closes the workers/streams public types at 23/22, matching the measured 24/23 → 23/22 result in `worklog.md:388-389`.
- The union is the same two literals, so nothing changes semantically. The const keeps `as const`, so its readonly literal shape stays the same.
- The `satisfies` check plus the exact `IsExact` test in both directions guards against the union widening or the constant drifting.

**The test plan is sound**
- `procedure-availability_test.ts:71-77` already checks root/auth identity at runtime; the plan extends it rather than weakening it.
- `@std/testing` is already a dependency: it is in the root import map (`deno.json:194`) and pinned at 1.0.21 in `deno.lock:102-103`. `types` is a subpath of that same package, so there's no new dependency and no lock churn.
- Type assertions with that subpath already exist in the repo (`packages/cli/.../generators-service-plugin_test.ts:6`).

**The compatibility proof is honest**
- `snapshotDocJson` and `diffSurfaceSnapshots` exist (`.llm/tools/release/surface-diff.ts:110,139`).
- The plan reports every raw hash change openly (`native-source-repair-plan.md:26-34`) and proves equality semantically with the compiler.
- The STOP rule (`:32-34`) moves to the coordinator's 24/23 fallback only after a real change to names, values or types has been measured and recorded.

**Plan-gate checklist**
- **Research:** re-baselined at 4771da92, which already includes main f6839463.
- **Decisions:** the contract is locked (`:11-22`).
- **Open decisions:** the only one, API compatibility, is measured and has an authorized fallback.
- **Slice:** a single slice under 30 files, with files listed (`:38-39`).
- **Gates:** raw and structured doc-lint, full service doc-lint, the exact combined test scope, root check, quality gate, all four carrier freshness checks, publish dry-runs for service/workers/streams, and JSR audit (`:40-46`).
- **Risks and deferred scope:** stated in `:55-61` and `worklog.md:416-417`.
- **Review order:** the separate F-5 debt re-review, the substantive review before commit, and the exact-head IMPL-EVAL are kept (`:48-53`).

**Non-blocking note:** `as const satisfies …` on the exported const needs to clear JSR's slow-type check and `deno doc`'s type inference. Neither of us has checked that yet. The planned dry-runs, JSR audit and full service doc-lint will catch it. If it fails, an equivalent check that keeps the type inside the same files is still within the grant, and the compatibility proof still applies.

VERDICT: PASS
