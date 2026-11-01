use harness

## SKILL
Same independent read-only harness/tools/doctrine/PR evaluation session; apply aspire-upgrade guidance only for manifest regeneration. No source edits, Git changes, agents or external posts.

You already returned final IMPL-EVAL PASS for all32 product/workflow/gate files in reviewed-files.json. Those32 hashes remain unchanged at committed source e776763. Its dedicated hosted workflow succeeded and code-quality passed. Required quality failed only at check:aspire-version-parity phase1: manifestFresh=false, exactly1 failure, no missing/unmatched paths. User explicitly requested repair and push.

Focused follow-up slice3 updates only the canonical generated .llm/tools/validation/fixtures/aspire-surface-manifest.tsv plus run records. The generator adds exactly one existing-rule archival row for .llm/2026-11-01-s5b-component-library.md, which mentions Aspire. The manifest indexes paths, not content hashes. No version, scanner policy/exclusion, package/tool product source, dependency or lock change.

Review `git diff -- .llm/tools/validation/fixtures/aspire-surface-manifest.tsv`, confirm it exactly matches buildAspireSurfaceManifest().body and has no unmatched paths, and run configured phase1 `deno task check:aspire-version-parity`. Relevant existing wrapper regressions: check-aspire-version-parity_test.ts, aspire-scan-scope_test.ts and check-compat-fixtures_test.ts. Preserve the accepted prior full implementation PASS; do not re-read all product code or repeat the expensive scaffold smoke. No new implementation code exists in this follow-up.

Return a concise PASS or precise FAIL_FIX for this CI freshness repair and confirm the32 reviewed content hashes still match. Historical eval output preserved in evaluate.md. Scope/drift/supervisor write surface and worklog already record the repair. Hosted checks at the future pushed head remain a separate readiness gate.
