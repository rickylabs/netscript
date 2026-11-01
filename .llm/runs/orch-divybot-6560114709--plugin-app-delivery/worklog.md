# Worklog

## Design

1. Public surface: plugin install links web apps automatically or through --app, produces runtime
   registries, and AppHost forwards linked endpoints. Doctor explains unsupported remote Docker.
2. Vocabulary: consumer app, plugin resource key, companion API, installed registry producer.
3. Ports: FileSystemPort, ProcessPort, GenerateInstalledPluginRegistries; Aspire endpoint references.
4. Constants: use SCAFFOLD_FILES, existing registry paths, installed version metadata; introduce no
   host-side plugin-name dispatch.
5. Commit slices: bootstrap; delivery plus tests and generated carriers; independent review evidence.
   See plan.md for gates and touched surfaces.
6. Deferred: remote-network relays, auth changes, dependency/version changes, UI redesign, merging.
7. Contributor path: packages/cli/src/kernel/adapters/plugin/plugin-reference-reconciler.ts.

## Routing and owner override

The feature matrix selects sol/xhigh implementation, muse_spark_1_3/xhigh then opus_5/xhigh
implementation evaluation. Owner instruction overrides evaluation verbatim:
“IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.”
Generator/evaluator remain separate sessions and vendor families.

## Bootstrap

Read the complete assignment and issue body/comments. No orchid-triage comment or matching PR exists.
Baseline is the issue's reported main commit. Deno 2.9.7 is installed. RTK is unavailable; use
focused commands and structured gate wrappers. Consulted existing project memory, including
carrier ordering, CLI scope exclusions and remote-Docker history.

Reconcile: issue remains open; scoped draft PR pending bootstrap commit.
