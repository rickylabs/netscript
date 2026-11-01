# Plan & Design — READY FOR REVIEW

Locked: collections(namespace?) returns qualified remote collection/member references from
that namespace catalog. Updates intersect remote membership with installed lock keys;
uninstalled members stay uninstalled. Preserve built-in collection and legacy behavior.
Unknown configured remote collection or zero installed members fail before any file write.
Exact installed item references continue to update without catalog reads. No new ui:add
semantics, lock schema, port, dependency or CSS/token changes.

PLAN-EVAL N/A: bounded existing-client/lifecycle extension with explicit acceptance and
existing atomic install engine. Mandatory separate-family IMPL-EVAL before sign-off commit.

Slices: plan/draft, then client contract + lifecycle + regression/docs with focused/broad
gates and independent review, then delivery. Under10 authored source files expected.
Gates: real injected remote fixture, partial/full installed collections, drift preservation,
unknown/zero installed no-write diagnostics, mixed-request atomic refusal and built-in
regressions; UI-v2 + public protocol tests; scoped check/lint/fmt; configured CLI/broad
quality and architecture; carrier freshness and native publish dry-run. Full runtime suite
attempted at readiness; UNPROVEN if Docker remains unavailable.
Risks: installing unintended members/dependencies, cross-namespace identity, extra remote
reads for ordinary item update, partial writes on bad requests. Mitigate with exact lock
intersection, qualified refs, transport assertions and full filesystem snapshots.
