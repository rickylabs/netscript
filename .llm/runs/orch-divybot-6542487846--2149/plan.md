# Plan & Design — READY FOR REVIEW

## Contract and locked decisions

Auth's default kv-oauth and hosted workos backend contribute no Prisma contract and require no database. Better-auth retains all four auth tables and requires SQL. Both public/package and local/source installs must use the same selection before provisioning; generate plugins/runtime-schemas and doctor must remain clean on a no-db consumer.

Add optional `databaseRequirement` to the core installer manifest: an environment variable, default value, ordered appsettings paths, and a finite record mapping selector values to booleans. The generic CLI resolver reads an injected environment accessor, project .env, declared appsettings paths and finally the default; rejects unsupported selectors before mutations; specializes provider, capabilities and official-source DB metadata without testing plugin names. Keep selected configuration available to plugin-owned scaffold through options. Auth defaults become DB-free. Its typed adapter factory returns a Prisma contract only for better-auth. Local schema copying reads selected package source fragments; public schema fetching stays integrity checked. No schema contribution when the backend is DB-free, including on a project that already has SQL.

No automatic destructive removal of existing tables. To change installed persistence, select the backend and reinstall with --force; document this safe path. Backend runtime authentication logic is outside scope.

## Slices

1. S0: run plan/design/evaluation artifacts, draft PR. Gate: independent PLAN-EVAL.
2. S1: optional core manifest contract/validation, shared CLI selector, both install paths, dispatch selected options, auth manifest and adapter factory, focused contract/install tests. Paths: packages/plugin/src/protocol/{manifest,mod}.ts and protocol tests; packages/cli/src/public/features/plugins/install/, dispatch/dispatch-plugin-verb.ts; packages/cli/src/local/features/plugins/install/install-local-plugin.ts; plugins/auth/{scaffold.ts,scaffold.plugin.json,src/adapter/plugin.ts,src/adapter/resources/resources.test.ts,tests/scaffold/manifest_test.ts}; this run. Gates: structured scoped check/test/lint/fmt; quality:gate; independent slice review.
3. S2: consumer regression proof and docs warning. Paths: CLI plugin install integration test, docs/site/orchestration-runtime/how-to/add-a-plugin.md; this run. Gates: no-db install/generate/doctor proof, better-auth four-table negative control, JSR audit/doc lint, docs accuracy as applicable; independent IMPL-EVAL then ready PR.

## Risk register

- Divergent public/local behavior: shared selector plus tests for both paths.
- Ambient config disagreement: explicit precedence, persisted selected backend in appsettings, tests for .env/appsettings/default/overrides/invalid values.
- Schema accidentally copied on KV: gate schema copy on selected capability independent of explicit --db intent; DB-present negative case.
- Breaking old manifests: optional field; unchanged default paths for unconfigured plugins.
- Existing SQL data: never delete tables or unrelated resources.

## Gate set

Structured .llm/tools/run-deno-{check,test,lint,fmt}.ts on changed TypeScript and focused regressions; quality:gate (quality scan plus architecture); package JSR audit and doc-lint for changed core/plugin surfaces. Runtime services unchanged. Full scaffold.runtime acceptance is UNPROVEN locally by owner instruction; request e2e-cli CI verdict in READY and coordinator arms its label. No local expensive suite.

## Open decisions / deferred scope / debt

No must-resolve open decisions. Auto-migrating existing data or runtime switching of provisioned infrastructure is deferred: reinstall explicitly reconciles requirements, existing tables remain owned by the consumer. No new accepted architecture debt. Broader KV-only consumer proof belongs to 2108. No profiles/ files read.

## S2 consumer-driven refinement

Actual CLI consumer checks confirmed local init copies core packages but omits the composing auth plugin, while its generated auth/plugin.ts uses that package name. Reuse the existing local install helper to register the selected package's declared exports as relative source imports. This preserves source-mode semantics and lets generate/doctor run without test-only import substitution. Scope adds the existing install-local-plugin-helpers.ts plus a real CLI consumer test under local/composition. Both remain within the declared CLI surface. Docs regeneration changes only the add-a-plugin page in the checked-in compressed prose carrier.

## Documentation repair after IMPL-EVAL round 1

The evaluator found that dependent auth recipes/tutorials still require KV users to migrate the
better-auth tables. Correct those conditional-storage claims across the identity pages, workspace
tutorial chapters/index and glossary, and update the existing executable recipe expectation so
its default KV path skips SQL. Regenerate the associated prose carrier rows. No runtime or API
scope expansion. Record the existing install-module/directory shape increase as
CLI-INSTALL-PERSISTENCE-SELECTION-SHAPE with an explicit closing gate.
