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
