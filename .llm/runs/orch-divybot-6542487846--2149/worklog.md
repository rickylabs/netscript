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
