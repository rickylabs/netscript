# Binding-inflight-eval — plugin-service-auth--1383 (cycle-3 sanctioned repair)

- Evaluator: Muse Spark (`opencode-go/muse-spark-1.3-contributor`), same independent session as rounds 1–3 — not planner family/session (Fable/Anthropic), not coordinator/author (Astra/OpenAI).
- Authority: `matrix-binding-inflight.json` (complex `plan_evaluation`, first route `muse_spark_1_3@max`) + native `plan-protocol.md` complex row ("evaluator edits a fixable plan on cycle three") + `binding-inflight-brief.md` scoped authorization superseding the prior no-plan-edit restriction **for F1/F2 only**. This is cycle three in-flight repair, not a fourth cycle/reset. Prior `binding-repair-eval.md` FAIL_FIX preserved.
- Reviewed HEAD: `ac4df8bbb` (working tree; only change vs `5f9d9393d` is the two edits below plus launcher trace). Edited file sha256: `0080b500c632085cff2e410017f452b242c0d87f33609527ff612695fe5d3092`.
- Compliance: edited only `binding-repair-plan.md` (F1/F2 lines); no technical-scope change, no product edits, commits, GitHub changes, runtime, or releases. Wrote only this file (plus the edit itself).

## Exact changed text

**F1 (§5 probe receipt, old lines 124–125):**
```diff
-   revoked, 503 with the auth service stopped, `/health` 200. Receipt replaces `s5-runtime-finding.json`
-   with a PASS record only if every assertion holds.
+   revoked, 503 with the auth service stopped, `/health` 200. On success write the PASS record to a
+   separately named receipt `s5-runtime-PASS.json`; `s5-runtime-finding.json` (the FAIL record) is
+   preserved unmodified and never overwritten — only if every assertion holds.
```

**F2 (§5 gate list, after the `doc:lint` line):**
```diff
 deno task doc:lint --root packages/plugin --pretty && (cd packages/plugin && deno publish --dry-run --allow-dirty)
+# Doc-lint baseline comparison (required, honest): full `packages/plugin` doc-lint currently reports 15
+# baseline findings (`s2-doclint-baseline.json`: totalErrors 15, all privateTypeRef). After the change,
+# re-run the same wrapper and compare finding counts by file/count against that baseline receipt: PASS
+# requires no new findings on the touched surface (`contract-base/domain/contract-mount.ts`, `mod.ts`,
+# `plugin-contract-binder.ts`) and no increase in the package total. The pre-existing 15 baseline findings
+# stay FAIL-truthful — this gate never claims a whole-package doc-lint PASS.
```

## Certification

- **F1 resolved:** the "replaces" instruction is gone; the plan now names `s5-runtime-PASS.json` as the success receipt and states the FAIL record is preserved unmodified and never overwritten — exactly the brief's correction #1. Verified baseline count (15, all `privateTypeRef`) read from the actual `s2-doclint-baseline.json` receipt, not recalled.
- **F2 resolved:** the comparison step is now explicit and executable (same wrapper, before/after counts by file/count, delta ≤ 0 on touched surface and package total), and the gate keeps full FAIL truthful — exactly the brief's correction #2. No invented whole-package PASS is claimable under this text.
- **Scope discipline:** no other line of the plan touched; technical repair, geometry, proof set, sequencing, and deferrals unchanged from the round-3 review (which verified them end to end). Nothing in either edit introduces an owner question.

## Verdict

`PASS` (composite plan as repaired in-flight)

The two mechanical findings are resolved in place. The binding-repair amendment is admitted to implementation as slices S5a/S5b → S6 → full runtime → IMPL-EVAL (separate session/family from both composite authors).

## Limits

Certifies the two plan-document corrections only. S5 re-run, `scaffold.plugins`/`scaffold.runtime` execution, exact-head CI, and any release/publication are downstream and unclaimed.
