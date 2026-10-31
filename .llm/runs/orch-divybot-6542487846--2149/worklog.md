# Worklog

## Design

1. Public surface: plugin install auth, generate plugins/runtime-schemas, plugin doctor; optional typed installer databaseRequirement and backend-aware auth adapter factory. Existing manifests retain semantics.
2. Domain vocabulary: database requirement selector, configured value, selected boolean requirement; auth backends kv-oauth/workos/better-auth.
3. Ports: FileSystemPort, ProcessPort, existing scaffold/formatter/workspace ports; injected environment accessor. No new service/container abstraction.
4. Constants: metadata names and backend values come from the manifest; auth constants define backend variable/default/Prisma path. No host-side plugin-name switch.
5. Commit slices: S0 plan/evaluation/draft; S1 metadata and install behavior plus focused tests; S2 consumer proof and docs; each records run evidence, gates and reconcile note.
6. Deferred scope: destructive table removal, runtime service rewrites and full consumer acceptance issue 2108. Full runtime suite runs in coordinator CI only.
7. Contributor path: packages/plugin/src/protocol/manifest.ts documents the generic selector; plugins/auth/scaffold.plugin.json is the one file to read for auth persistence choices.

## Routing grant

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” This overrides evaluator model/effort, preserving family/session independence and feature limits.

## Intake

Memory and guidance consulted. Main baseline verified. No pre-existing changes. S0 plan ready for evaluation; implementation has not started. Assignment and report files will not be committed.

## S1 validation

- PLAN-EVAL round 1: PASS before implementation; sanitized review in plan-eval.md.
- Structured contract tests: 24 passed (protocol, auth resources/manifest, selector).
- Structured install/local/dispatch/mutator suites: 81 passed after restoring legacy scaffold payload shape; focused dispatch rerun: 13 passed.
- Structured changed-source check and lint: zero findings. Root fmt excludes CLI, so use a private scoped config preserving root style and the structured formatter's processed-file coverage; 17/17 files processed.
- quality:gate: pass; baseline also passed.
- Actual maintainer init --db none, then auth install with kv-oauth: no database declaration, RequiresDb=false, selected backend persisted, no root Prisma files. Better-auth on a second DB-free scaffold: SQL provisioned and all four mapped auth tables copied. No runtime resources started.
- Consumer generate runtime-schemas/doctor exposed the pre-existing local plugin package import gap: local scaffolder emits auth/plugin.ts importing @netscript/plugin-auth, but local init copies core packages only. S2 will reconcile selected local package exports with root imports; this is necessary for the requested clean generate/doctor acceptance. Record bounded drift and test the real path.
- Auth JSR audit passes. Core plugin audit reports three unchanged entrypoint @module omissions (abstracts/config/testing); its publish dry-run passes. These are baseline findings, not newly accepted debt or a green full JSR audit.
- S1 independent slice review: PASS, see slice-review.md. Reconcile: PR 2519 still draft; no label/milestone edits, no unrelated source changes or lock churn. Proceed to S2 with the bounded local import correction and consumer evidence.

## S2 consumer proof and docs

The actual CLI regression creates DB-free scaffolds and exercises local and public plugin install paths, generate plugins, generate runtime-schemas and plugin doctor. It also selects better-auth through .env, checks all four SQL tables, changes to KV with a process override, verifies existing tables are preserved, and proves an existing SQL app receives no fresh auth schema from KV. No test-only global workspace import substitution. Local package aliases are reconciled from declared package exports.

The first consumer run passed local KV and better-auth controls but exposed a public fixture accidentally using local-source markers. The public fixture now uses public init, so it exercises normal exact package aliases; all three consumer tests pass. Doctor has no errors and only expected stopped-AppHost warnings.

The docs warning now distinguishes SQL-backed better-auth from KV/hosted backends and explains precedence and safe reinstallation. `gen:agent-docs-prose` regenerated exactly one carrier row for that page; docs accuracy and rendered-output checks pass. Added explicit return type to the scaffold closure after doc-lint caught it. Changed protocol and scaffold entrypoint doc-lint pass. Whole-package doc-lint retains pre-existing private-type-reference findings in unrelated exported auth/streams/core contracts; full lint is not claimed green.
- Final focused S2 suite: 14 passed, zero failures/ignored (selector including incompatible --no-db, local install, three real consumer proofs). Structured changed-source check/lint/format check: 20 files, no findings or dropped files. Docs accuracy, carrier freshness and changed protocol/scaffold doc-lint pass. CLI JSR audit passes (23 existing warnings); auth JSR audit passes. Review-thread gate passes with zero threads.
- Also aligned auth README's unconditional schema/Postgres claims with the same selected-backend behavior. This is prose within the declared auth plugin surface.

## IMPL-EVAL round 1 repair

FAIL_FIX was limited to stale dependent docs; no source/test blocker. Corrected the identity auth recipe/reference, workspace tutorial chapters 1/2/3/6 and index, glossary, CLI reference and auth README. The recipe now conditionally runs SQL commands only for better-auth; its existing executable test still checks credential export before Aspire and now asserts default KV skips SQL. Auth recipe/command tests: 19 passed. Docs accuracy and link checks pass. Carrier regeneration changes those ten source pages plus derived llms.txt index text, with no unrelated rows. The prior one-row statement describes the initial warning-only pass, superseded by this repair.

Recorded CLI-INSTALL-PERSISTENCE-SELECTION-SHAPE for the incremental cost of the existing oversized install module/directory. Baseline module 712 lines → 754; immediate siblings 15 → 18. Broader installer split is deferred with explicit owner, target and preserving gates. No runtime debt added.

## Stop decision — two consecutive implementation failures

Round 1 FAIL_FIX: dependent docs still claimed unconditional auth migrations; repaired the requested conditional-storage guidance. Round 2 FAIL_FIX: two tutorial references remain stale: chapter 3's primary-db-status precheck still credits chapter 2 migration, and chapter 1 says database commands begin in chapter 2 instead of chapter 3. Both full verdicts are retained in evaluate-round-1.md/evaluate.md.

The assignment and run-loop terminate a leaf after two consecutive terminal failures. Stop the fix/evaluation loop; no third review, no passing exact-head attestation, no ready transition. The print-mode evaluator has completed; there is no live evaluator process or leased resource to retain. Preserve and push S2 as work awaiting review, not a sign-off commit. The PR remains draft. Coordinator decision requested: take over the two docs corrections and arrange final exact-head review, or dispatch a fresh remediation leaf. Recommend coordinator takeover for this small remainder. Full scaffold.runtime CI remains unproven and must be armed by the coordinator.

Reconcile: no labels/milestones changed, no runtime resources started, no lock/cache churn, no unrelated work folded in. Remaining source acceptance is implemented and locally proven, but documentation acceptance and final independent review are not complete. Do not mark READY or merge.

## Continued goal — concrete documentation repair

On continuation, revalidated the clean branch at ed58293a2ccc44d062c9d22f16c2884ad28d19c3 and live PR/issue/coordinator state. No coordinator acceptance or evaluator-cap override was present. The previous turn made progress by implementing/pushing the consumer proof and preserving both verdicts; it did not complete the goal.

Completed the two explicitly requested text repairs: removed chapter 3's primary-db-status precheck that assumed a chapter 2 migration; chapter 1 now says database commands begin in chapter 3. Canonical prose generation passed and changed exactly the two corresponding chapter rows, with no unrelated rows. Docs accuracy, internal links (zero broken links/anchors), built-site freshness and git whitespace checks pass. This is a documentation-only delta; prior functional tests remain historical evidence for unchanged framework code.

The continuation authorizes progressing the concrete repair; it does not waive the two-failure evaluator cap. No third evaluation, sign-off claim or ready transition. Preserve this correction on the same draft PR and request coordinator acceptance/final-head review. Full scaffold.runtime remains unproven and coordinator-controlled.


## Coordinator-authorized round 3

Revalidation found the coordinator's decision on PR 2519: https://github.com/rickylabs/netscript/pull/2519#issuecomment-6542839829. Exact grant is retained in review-authorization.md. It lifts the consecutive-failure stop for exactly one more IMPL-EVAL round in the same independent read-only Opus session. The two tutorial repairs and canonical generation/accuracy/links/freshness gates have already completed in 4f3ba434b98273bcae22dffaa7a566f8b5fa8937. PR is mergeable; no main merge is needed. Commit this authorization/resume state, push, then review the exact pushed head. On MERGE, mark ready and inspect required CI as directed; the coordinator owns e2e-cli-gate and merging. No new source changes or local expensive E2E.


## User-requested conflict resolution

After round 3 returned MERGE at 2f02788071fd4d8088b7b9e21dfa2394d04f2bc5 and the PR was marked ready, main advanced to 15cffa2 (native workers/streams host policies) and GitHub reported CONFLICTING. The latest direct user instruction was: “New activity on your PR — address each item, push fixes, keep the PR green: merge-conflict: rebase onto the latest base branch, resolve conflicts, force-push.” This explicit later instruction supersedes the earlier merge-only restriction for this integration. Preserve the old tip and protect the update with an explicit --force-with-lease expecting the old remote SHA.

Rebased the five leaf commits onto main. The sole conflict was the generated prose carrier; retained main's corpus and regenerated canonically from the combined sources. Debt merged automatically and no authored framework source conflicted. All 20 owned TypeScript source/test blobs are byte-identical to the previously reviewed tip. Main's pages are retained, with exactly the same 11 auth-related carrier rows differing from main. On the new base: 27 focused consumer/selector/protocol/auth tests pass, scoped check passes for 21 files, docs build/accuracy/links/freshness and whitespace pass. Evidence in rebase-source-equivalence.json and rebase-evidence.json.

This integration changes commit identity; round 3's exact-head MERGE remains historical and is not copied to the new head. The one coordinator-authorized extra round is spent. Prepare/push the concrete validated resolution, then request authorization for one same-session delta review or independent coordinator acceptance. Full scaffold.runtime remains coordinator-owned and unproven. No labels/milestones, merge to main, tag, release or local expensive E2E.

## CI quality repair — generated public API carriers

Current-head quality failure was in MCP export corpus freshness, not the narrower code-quality gate. Read the job's structured receipt: all preceding gates (production install, lint, format, docs, examples, prose corpus) passed; mcp-export-corpus exited 1 because the generated symbol corpus was stale. Latest main's quality job passed, confirming this is the leaf's missing generated update.

Ran canonical gen:mcp-export-corpus, gen:assets-barrel and gen:publish-assets. The export corpus changes exactly three owned API rows: plugin root, plugin ./protocol, and plugin-auth ./scaffold. This reflects the already implemented protocol field/type and scaffold signature. Publish generation also refreshes the MCP fallback prose for the changed llms index. No authored framework source or acceptance gate was changed. check:mcp-export-corpus, check:assets-barrel and check:publish-assets all pass; whitespace clean. These two generated MCP output files are a necessary scope amendment for the CI repair.

Close-gate is a separate current failure for exactly the two truthful outstanding proofs: independent acceptance of the rebased SHA and full scaffold.runtime CI. Requested coordinator delta-review authorization and runtime opt-in; do not tick those boxes prematurely or reuse round 3's old-SHA MERGE. This asset refresh will produce a new final head for that same pending acceptance request.

## CI SQLite repair — contract and regression

Current-head runtime opt-in was applied by the coordinator after the direct READY PR phase comment. In run 41200678341, SQLite fails `database.codegen` with 86 PostgreSQL-native-type validation errors in ordinary plugins' package schemas. Main run 41197676281 at the same base passes that exact gate and full SQLite job. This is a leaf regression, not discovery or an external baseline failure.

Contract: source-package fallback is needed by local plugins with backend-selecting metadata; ordinary local packages must retain their existing scaffold-owned SQL selection. JSR packages retain integrity-verified package schemas. An explicitly declared selected backend schema still fails closed if missing. KV auth still contributes none; better-auth retains its tables.

Slice: add actual local/public SQLite consumers installing ordinary workers and running standalone Prisma generation; restrict local package fallback and declared-schema checks to backend-selecting metadata; rerun focused installer/auth/consumer and source quality gates; push the reviewed fix normally. Full runtime remains CI-only. Latest user explicitly requests fixing the SQLite failure and pushing; no rebase, force-push, label edits or merge. Round-4 MERGE at ce431da is historical once this source repair is committed and is not copied to a new SHA. Exact new-head evaluation remains required.

SQLite repair validation: new actual local/public SQLite consumers both fail before the fix (2 failures) on the observed PostgreSQL native types; after the policy fix all 55 focused installer/selector/consumer tests pass. Structured type-check, lint and source formatting pass for all four changed TypeScript files; quality:gate passes. Root lint excludes CLI, so scoped lint uses the root rules with only include/exclude removed, preserving fail-closed coverage. The schema-source guard and missing-schema guard use the same policy. See sqlite-repair-evidence.json. Commit/push normally, preserve authored auth behavior and JSR integrity, and wait for exact-new-head source/runtime acceptance before checking either claim.

## Auth runtime SQL dependency repair — contract

The repaired SQLite runtime tier passes113 gates with no failures/skips, including live auth, doctor, child readiness and cleanup. PostgreSQL tier in run41202168922 fails runtime.aspire-start after auth exits: bootstrap unconditionally calls the host SQL client even though selected KV auth correctly has RequiresDb:false and no SQL connection string. Main at15c passes that full tier because its unconditional auth DB dependency supplies the URI. This is another leaf product failure, not test discovery or flaky infrastructure.

Archetype5 thin plugin composition; doctrine07 and the plugin archetype were read. Backend selection is the existing axis; reuse resolveActiveBackendName and the same appsettings/environment precedence as initializeAuthService. Contract: only better-auth may request the host SQL client or install service database context. KV and WorkOS must bootstrap with a throwing SQL seam; better-auth must still request it. No public package API change or new service abstraction is needed.

Slice: strengthen actual KV cookie-jar and WorkOS bootstrap tests with throwing SQL collaborators, add a better-auth host-client negative control; resolve the selected backend's SQL collaborator in init.ts and make main's database context optional; scoped auth tests and source checks; normal commit/push and CI-only full runtime proof. No local Aspire/Docker, labels, rebase/force-push or merge. The feature-tier five IMPL-EVAL rounds are spent; do not launch a sixth without a new owner-authorized evaluation contract. After a concrete tested fix exists, request owner-arranged exact-head acceptance/review path. Existing MERGE at3b219fd remains historical after a new source commit.

Auth bootstrap repair validation: both real KV and WorkOS SQL-throwing controls fail before the fix (13 passed,2 failed). After the fix, focused15 pass and the complete auth service suite99 pass. Better-auth still requests SQL exactly once and propagates its failure. Structured check/lint/fmt cover all5 changed sources with zero findings; quality:gate and MCP export-corpus freshness pass. No dependencies, schema or gate changed. Evidence is auth-bootstrap-evidence.json. Commit/push normally; prior3b219fd exact review/runtime evidence remains historical, and new-head independent acceptance/full runtime are unproven. No sixth IMPL-EVAL launched under the exhausted five-round contract.

New coordinator decision received: https://github.com/rickylabs/netscript/pull/2519#issuecomment-6543624351 explicitly authorizes one exact-head IMPL-EVAL on the PostgreSQL startup repair delta. The initial five rounds remain spent/historical; this bounded new CI-repair authorization is recorded verbatim in review-authorization.md. Proceed with normal commit/push and exactly this same-session read-only Opus round6; no general review-loop reset or runtime waiver.
