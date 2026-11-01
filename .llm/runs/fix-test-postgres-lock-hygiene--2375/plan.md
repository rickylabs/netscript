# Plan & Design — READY FOR REVIEW

Archetype6 tooling/test-only overlay; existing generated helper backend tests remain intact. Locked contract: derive the test-only npm:pg specifier from the root catalog rather than another copied version; require its existing lock entry; assert root lock bytes unchanged after the tests, while preserving cleanup even if the assertion fails. No production/scaffold output changes.

PLAN-EVAL N/A: bounded mechanical test-fixture defect with exact root cause, acceptance and no public API/architecture decision. Separate source and exact-head IMPL-EVAL remain mandatory.

Slices: bootstrap/run + early draft; test-only resolution/lock guard plus focused frozen negative proof and combined CLI/database suite, then independent review before sign-off. Gates: structured scoped check/lint/fmt (explicit CLI config to avoid root exclusions), quality:gate and changed-source scan, focused old/fixed frozen test, full combined wrapper suite with pre/post lock hash and git diff --quiet deno.lock. Existing failure is reported honestly, not waived. No local scaffold.runtime; e2e-cli not required because shipped output/runtime wiring do not change. No package export/JSR surface change, so publishability gates N/A for a test-only diff. No new debt.

Risks: scratch imports can still update the parent lock (frozen reproduction and byte guard); broad suite can expose unrelated environment failures (compare/record, never weaken tests); cleanup must run on assertion failure. Contributor starts at the existing health-check test fixture setup. Deferred unrelated CLI reliability and production dependency upgrades. No open decisions.
