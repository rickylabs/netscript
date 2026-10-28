# Security dependency qualification: five-owner handoff

Decision requested: substantive source/evidence review of the exact five-owner candidate before
checkpoint. No commit, push, PR, independent inference, application or deployment was performed.
Base/HEAD1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d; branch fix/better-auth-critical-1-7-7.

The catalog floor and four direct test import literals now use ^1.7.7. Ordinary native Deno2.9.7
selected1.7.14; root-selection-amendment.md explicitly accepts that release and supersedes only
the original1.7.7 selection. The original selection mismatch/stop evidence remains historical.
Root install and canonical Fresh UI lock:update both exited0 without override, reload, lock/cache
deletion or dependency-age bypass. No age refusal occurred; the ordinary default24h policy remains.

## Footprint and native closure

Exactly five tracked owners, +91/-86. See final-five-owner.diff and final-source-closure.json.

| Owner | Physical lines | Working-file SHA256 |
| --- | ---: | --- |
| deno.json |287|7fd92d5c707a359210ad4fc9a3b2e84fb7f4db4a93b7bd9aa6754aa7e589c7ee|
| deno.lock |4877|56b8b9cd2c8bae3b9a240af14aed2b7a48368ef572f3f711bed1c70e1a40bcb1|
| packages/fresh-ui/deno.lock |4373|a9faaab08ce672968c1e860b17342b1e0cb2b09520618894859a75235d228674|
| plugins/auth/tests/services/better-auth-global-logout-http_test.ts |78|ac5aea39f538be2f8cf33ffdc244181cb725ea0752a950f11e6b6bbb30be98ac|
| plugins/auth/tests/services/unsupported-revocation-http_test.ts |184|dc7337c186ff457bc41dc1e00ea12d81964f8e2d87a3996b6fd2a5c23fd8b871|

The three authored files equal their original bytes with only ^1.6.20 replaced by ^1.7.7; line
counts, every test body/assertion and production adapter bytes are unchanged. Both locks contain
exactly the same eight release-family identities at1.7.14, no retained1.6.20 family. Actual production
plus two direct-test native info graph:587modules,0errors,8family IDs at1.7.14, complete peers.

Each native lock changes35 npm records counting removed/added identities and two retained-identity
metadata records. Release closure: utils0.4.2->0.5.1, fetch1.3.1->1.3.3, noble ciphers/hashes2.2.0->2.4.0,
better-call1.3.6->1.4.4, kysely0.29.2->0.29.7, nanostores1.3.0->1.5.5, added rou3 0.9.2 beside unchanged
0.7.12, set-cookie-parser root3.1.0/UI3.1.1->3.2.1. Existing @orpc/openapi1.15.5 keeps its integrity and
same rou3 0.7.12 identity, now explicit; existing sdk-trace-base root2.8.0/UI2.9.0 adds deprecated:true
only. These are native metadata, not upgraded versions. All other npm records/non-npm lock sections,
unrelated specifiers and normalized workspace metadata are asserted unchanged in the closure report.
Root/UI old independently retained noble1.x versions remain; that is not a better-auth release split.

80 protected source/config/lock records match baseline, including all other auth owners, read-only
reference/docs locks and frozen PR2422/2424/2425 owners (protected-final.json). Source whitespace
check passes. Bootstrap-generated untracked tooling is outside the tracked five-owner product diff.

## Actual gate outcomes and limits

| Control | Actual result | Receipt/report |
| --- | --- | --- |
| Unchanged audit-critical RED |exit1,54 findings:7low/23moderate/23high/1critical; GHSA-965c-763c-88jm|audit-unchanged-red.receipt.json|
| Patched audit-critical |exit0,47 findings:4low/23moderate/20high/0critical; target GHSA gone|audit-critical-green.receipt.json|
| Structured deps:audit, level low |wrapper exit0 emits advisory inventory, not a clean audit;47 lower findings remain|deps-audit-structured.receipt.json|
| Root native lock-only refresh |exit0,4.172s; accepted1.7.14 candidate|root-lock-native-refresh.process.json|
| Canonical Fresh UI lock:update |exit0,153 selected files/2batches/0failures/0errors|fresh-ui-lock-native-refresh.process.json and stdout.log|
| Owning broad auth controls |98pass/16fail/0ignored,114total,9failure groups|auth-controls.json|
| Same16 failed names on original baseline |0pass/16fail/0ignored, same Deno/sanitizers/original PATH; project removed|baseline-control.receipt.json, auth-controls-unchanged-baseline.json|
| Focused better-auth package plus two changed HTTP test modules |21pass/0fail/0ignored|patched-auth-controls.json|
| Types |78 selected/1batch/0errors|auth-check.json|
| Lint and format |78 selected/78processed each,2batches each,0findings/drops/refusals|auth-lint.json, auth-fmt.json|
| Root config fmt |native exit0,1 file checked; .lock inputs are not native fmt selections|selected-config-fmt.receipt.json|
| Quality scan |PASS,7existing allowances,0findings/allowance failures|quality-scan.native-receipt.json|
| Composite arch |FAIL at both known Windows cold DB identities; reference/centralization/file-link/catalog/private-lock/Zod predecessors completed; doctrine stage not reached|arch-check.native-receipt.json|
| Auth public docs/export |1export selected;1private-type-ref in unchanged src/better-auth.ts; same result on original baseline|auth-public-docs.json, auth-public-docs-unchanged.json|
| JSR surface inventory |1export/4reported runtime symbols/4test files,0mechanical findings; this run explicitly omits dry-run|auth-jsr-surface.json|
| Full workspace publication dry-run |native exit0,74.455s, ends Success Dry run complete; full stderr hash654139bytes with bounded tail|publish-dry-run.native-receipt.json|
| MCP generated corpus freshness |PASS,299subpaths,35packages,8898symbols; no generated edit|corpus-freshness.receipt.json|
| Cleanup |owned temp0,baseline projections0,owned Deno processes0,root package.json absent|cleanup-final.json|

The full auth suite and all focused/baseline test runs used --cached-only --frozen --check --allow-all
--sanitize-ops --sanitize-resources --trace-leaks. Existing per-test options/shorthand were preserved;
these are runner flags, not newly inserted Deno.test options. No failure was skipped, weakened or
sanitizer-disabled.21/0 is supplemental isolation, not a replacement broad-suite success claim.

The16 broad failures are13 pre-existing KV expiration interval sanitizer failures at
MemoryKvAdapter.startExpirationChecker,2 pre-existing Windows SIGTERM/SIGINT stdout assertions, and
1 missing sh in the original owned environment. All16 exact names reproduce on unchanged baseline.
The earlier progress shorthand15interval+1sh was inaccurate; this corrected13+2+1 classification is
supported by the complete report.

Root authorized adding exact existing C:/Program Files/Git/bin (native sh hash recorded) only to the
owned child PATH, keeping portable Deno first. The real cookie-jar shell now executes and fails a
session-cookie assertion with a retained CR character (rendered /r by the report). The same assertion
reproduces on original1.6.20 with that corrected PATH;0/1 both (native-cookie-jar-gitpath.json and
native-cookie-jar-gitpath-unchanged.json, baseline-doc-cookie.receipt.json). No fixture was edited.
The public docs private-type-ref likewise exists before the upgrade. These remain real failures,
not waivers or claims that the complete branch is green. The separately owned Windows DB repair
PR2425 is not integrated; the cold architecture gate remains open on this chosen base.

## Provenance and operational notes

Installed MCP find_guidance and exact better-auth plugin guidance were actively used. No new product
API or architecture was introduced. PLAN-EVAL N/A for root's fixed dependency repair only; separate
independent IMPL and integration acceptance remain mandatory. No model credit was spent.

Retained preparation failures are not gate passes: first archive setup named absent apps/examples;
first graph evidence writer collided with the outer PowerShell stderr file; five request parsers
rejected UTF8 BOM before launching children; two closure-checker attempts mislabeled native metadata
owners while actual source remained unchanged. Corrected ignored helpers/requests and unique native
receipts are retained. Final metadata owner checks prove sdk-trace-base and @orpc/openapi exactly.
No failed receipt/log or published history was overwritten. Hashes/tails in gate receipts attest full
native streams where capture is bounded; this packet does not claim full stderr text was archived.

The maintainer advisory is conditional Magic Link/OAuth verification-state exposure, not proof of
universal deployment exploitability. The root-selected1.7.14 release notes require coordinated
participants sharing verification stores/OAuth Proxy state; pending verification/OAuth/SAML flows may
need restart and purpose-aware custom identifier hashers need review.1.7.12 requires configured
clientId audience validation for ID-token providers;1.7.13 fixes type-only exports. No schema
migration, provider behavior edit, deployment or custom hasher implementation is part of this slice.

Primary sources: https://github.com/better-auth/better-auth/security/advisories/GHSA-965c-763c-88jm
and https://github.com/better-auth/better-auth/releases/tag/v1.7.14, plus root's accepted1.7.8-1.7.13
release-note review in root-selection-amendment.md. Source acceptance and checkpoint authority are
still pending. Every archived executable diagnostic/source snapshot must be stored as .txt data
and explicitly mapped, so no historical _test.ts can be discovered by shipping test selection.