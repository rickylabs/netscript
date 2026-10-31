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
