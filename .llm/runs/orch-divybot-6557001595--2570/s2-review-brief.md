# S2 independent slice review

Review changes since c2c85fb. Scope: live service record adapters, safe plugin/auth
capability detection, app import registration, focused behavioral tests, and the
canonical memory resource initial-input fix. See plan B1–B6 and drift.md.

Evidence: s2-tests.json (77 tests), s2-check/lint/fmt.json, s2-service-check.json,
s2-database-check.json, s2-plugins-check.json, s2-service-browser.json,
s2-plugins-browser.json, s2-quality.log. Some logs still use host paths pending
publication normalization; do not repeat those paths in your report.

Known boundaries: post-init service add is installed-unwired per B2; the initial
with-service variant is live. AI now uses app-owned in-process modules; no-samples
has configuration but no chat runtime, deliberately empty. Plugin app references
must be enabled; missing refs are visibly installed-unwired, not absent. Actual
plugin fixture refs were added with the real config set command, and unavailable
runtime services must show unavailable rather than fabricated success.

Do not assess final visual fidelity or certify merge readiness. S3 and S4 remain.
Review semantic correctness, typed boundaries, auth credential isolation, exact CLI
commands, generated variant behavior and runtime compatibility. Give PASS, FAIL_FIX,
FAIL_RESCOPE or FAIL_DEBT with concrete blockers. Read-only, repo-relative paths,
no session IDs. This is not the mandatory final IMPL-EVAL.

Round 2 correction brief: read s2-review.md then current source. Gating debt is
accepted in plan/drift and .llm/harness/debt/arch-debt.md with cost/version risk and
closure. workspace-pages_test now verifies real public JsrImportResolver app output
against official workers plugin/core version. Corrected public and maintainer
resolver entries; public add-service test now passes. s2-corrections-tests.json:90.
s2-check/lint/fmt.json updated. s2-postinit-check.json proves generated app after
actual service add --with-client connects exact placeholder; new helper preserves
edited/missing/already-connected source (client-scaffolder_test). Added safe B2 path
is recorded in plan. Capability metadata corrections address observations1,2,8.
Review S2 only, not final visual/merge acceptance. Report PASS or specific blockers.
