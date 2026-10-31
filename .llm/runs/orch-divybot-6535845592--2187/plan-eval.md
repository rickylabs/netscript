# PLAN-EVAL round 2

**PLAN-EVAL: PASS.** Both round-1 blockers are resolved, every plan-gate box is satisfied, and the plan stays inside the owner's scope. This was round 2 of 2, read-only; I changed nothing.

**Blocker 1 (key too long for Deno KV): resolved.**
- Plan decision 2 and worklog Design item 4 now make the key a fixed namespace plus the SHA-256 of the JSON tuple of all five fields (triggerId/path/kind/mtime/size).
- That puts a hard cap on the length of the KV key and of the downstream worker `deduplicationId`, while every field still affects the key.
- Missing or partial metadata gets a UUID.
- The matrix adds a test with a path over 2 KiB through the real adapter and the disk-backed KV.
- `resolveKey`, definition-key precedence and the #2165 identities are unchanged.

**Blocker 2 (negative controls): resolved.** I checked each row of the new matrix against the original code:
- **Your refinement is right.** If only the adapter is reverted, the zero TTL removes the claim on completion. Sequential missing-metadata changes therefore still succeed, so marking them "pass behavior" is correct.
- **Unique keys are proven by the concurrent test.** Two different missing-metadata events run at the same time across processors (limit 2). With the adapter reverted, both hash to the same automatic key, so the second one is rejected and the test fails. The unit tests on the key's five fields and the UUID fallback also fail on the old adapter.
- **The zero default TTL is proven by the same-duplicate tests.** With only the TTL change reverted, the same-metadata duplicate after completion and after the disk-KV restart is still blocked for 24 hours, so those tests fail.
- **Reverting both files** makes the original sequential missing-metadata acceptance case fail, both directly and across a restart. That is the issue's own acceptance sentence.
- **Behaviour that must not change** passes on both versions: different metadata, the #2165 precedence, explicit TTL, and the webhook/scheduled defaults. The plan no longer claims those as regression tests.
- **Explicit TTL overrides stay compatible:** the new default applies only when `ttlMs` is unset.

**Rest of the plan gate: all met.**
- **Research:** current, re-baselined on `7907293`.
- **Decisions:** locked, with rationale.
- **Open-decision sweep:** nothing would force rework.
- **Slices:** S0, S1 and an S1 fix-up slice if needed, each naming its files and gates.
- **Risk register:** present, with mitigations.
- **Gates:** Archetype 3 gate set plus quality and architecture checks. The existing `quality:gate` failure in a docs fixture is recorded as a pre-change baseline, not claimed as green.
- **Deferred scope:** explicit.
- **JSR audit:** no change to the public surface.
- **Owner scope:** no labels, milestone changes, local scaffold E2E, merges, store or builder changes, or dependency churn.
- **Privacy:** the run artifacts contain no hostnames, ports, operator paths or session ids.

**For IMPL-EVAL to check, not blockers now:**
- The negative-control receipts must show assertion failures, not type or setup failures, for each reverted case.
- The real upstream watcher smoke test is "where feasible", so the final report must say whether it actually ran.

PLAN-EVAL: PASS
