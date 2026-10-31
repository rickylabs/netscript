# Independent PLAN-EVAL round2

**Verdict: FAIL_PLAN (stop).** Option B's condition holds for the `implement` finding but not for `WorkersContractDefinition`, so neither debt row can close and box 1 of #1655 can't be reworded under this decision.

Independent separate-session Claude Opus5.5 review, high effort requested, read-only repository access and no probes. The evaluator produced a private planning note; no repository source was written by it. Supervisor preserves the substantive verdict here.

## The two findings against the condition

The coordinator's condition: each finding must trace to "an oRPC `declare`d internal… If either one comes from a NetScript-owned private type instead, that one is not covered: fix it, or stop and report."

1. **`WorkersContractImplementer` → `implement`: covered.** It imports `implement` directly from `@orpc/server`, and doctrine 02 covers packages that extend the base contract seam. Item 1 of `boundary-trace.md` is enough.
2. **`WorkersContract` → `WorkersContractDefinition`: not covered.**
   - The diagnostic names the local interface in `workers.contract-definition.ts`. NetScript owns it and could export it, so it isn't an oRPC internal.
   - That its members eventually use `ContractProcedureBuilderWithInputOutput` doesn't change what the diagnostic points at. The trace correctly keeps the two apart.
   - Below it is more owned code: `Route`, `BaseErrors`, `JobTriggerSchema`, `SubscribeRoute`, and about 25 private schema constants. There are also Zod types, which aren't oRPC; the doctrine 02 exception only names `@orpc/contract` builder types.

## No bounded fix exists

The only fix in view is to publish the owned definition and everything under it, with docs. The recorded prototype of that went from 2 to 40 private refs plus 55 missing-JSDoc findings. Fixing that means about 30 new public symbols, which is the widened surface the coordinator ruled out. Zod references would still be left over, and they can't be removed because `contract-graph_test.ts` requires the concrete Zod methods. They're outside the oRPC-only condition, so "fix it" isn't met and the condition's fallback applies: stop and report.

## Blockers on the current plan

- **B1:** Remove the step that closes both rows "with a measured two-finding ceiling." The 1655 row would close with one uncovered owned finding. The 2066 row's gate ("all worker export doc-lint diagnostics zero") fails on the same finding across the 14 plugin and 19 core targets.
- **B2:** Don't reword box 1. The new wording lists only sanctioned oRPC findings, and `WorkersContractDefinition` can't be one of them.
- **B3:** Waiving the owned finding would be a new exception, and the coordinator said "No new exception is created."

## Stop record for the supervisor

No source, acceptance or debt changes:

1. **`drift.md`:** add an architectural entry saying `implement` is covered and `WorkersContractDefinition` is owned and not covered. No bounded fix exists, so option B can't be carried out. Both rows stay open and box 1 is unchanged.
2. **Status files:** mark `worklog.md`, `context-pack.md` and `plan.md` as STOPPED, citing this verdict.
3. **#1655 and #2474:** report there so Eric can rule before the canary .3 cut. He needs to pick one:
   - (a) amend doctrine 02 so the exception covers an owned contract-definition type whose members use oRPC and Zod;
   - (b) fund a separately scoped job to publish the owned route/schema types with docs, then decide how leftover Zod references are treated;
   - (c) keep both rows open until Deno doc lint or the oRPC/Zod types change upstream, with a trigger to re-check.
4. **Ceiling correction:** changing the stale ceiling from 4 to the measured 2 (and 13 to 14 targets) is a factual tightening, not a closure. Do it only if the coordinator confirms it stands on its own, separate from option B.

Two consecutive FAIL_PLAN verdicts end this leaf loop. No third evaluation or implementation is authorized by this leaf; any later remediation needs an explicit new owner instruction.