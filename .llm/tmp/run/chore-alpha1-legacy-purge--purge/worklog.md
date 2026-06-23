# Worklog

## S1 - Tier-1 Removals

Removed `updatePluginRegistry`, the Fresh `safeExtend` alias, and the workers
`startWorkersStreamMirror` export path. The Fresh in-class caller was migrated to `this.extend(shape)`
before deleting `safeExtend`. The workers service now installs `createStreamMutationHook()` directly.

Validation:

- Named grep gate clean for removed symbols after edits.
- Scoped check/lint/fmt PASS for `packages/cli`, `packages/fresh`, and `plugins/workers`.
- Public docs lint PASS for CLI, Fresh, plugin workers core, and the workers stream server.
- Package tests PASS for CLI, Fresh, workers plugin, and plugin workers core.
- Architecture check PASS with only pre-existing warnings.

Commit: `7492a1d97940d5059dc68732f222eafabc307699`
PR comment: `4774576885`

## S2 - Aspire `DependsOn` Alias Removal

Removed only the Aspire legacy `DependsOn` alias and its back-compat merge branch. The canonical
`ServiceReferences` to deploy-config `dependsOn` path now covers appsettings and NetScript config
resolution. Canonical `packages/config` `dependsOn` was not touched.

Validation:

- `DependsOn` grep clean across affected live source/docs/templates after edits.
- Scoped check/lint/fmt PASS for `packages/aspire` and `packages/cli`.
- `deno doc --lint packages/aspire/mod.ts` PASS.
- Aspire tests PASS.
- Targeted CLI compile/helper tests PASS, followed by full CLI tests PASS.
- Architecture check PASS with only pre-existing warnings.

Commit: `35f9278b5c654e6ac9ee1891a7c53317277a3c79`
PR comment: `4774595757`

## S3 - Generated Smoke Artifact Hygiene

Removed tracked `.llm/tmp/init-json-smoke/` output from the index, ignored the regenerated smoke
directory, and deleted confirmed zero-reference scratch files under `.llm/tmp/`.

Validation:

- `git ls-files .llm/tmp/init-json-smoke` dropped from 109 entries to 0.
- CLI init-json e2e regenerated the smoke output locally, and `git check-ignore -v` confirmed it is
  ignored.
- Scratch files had no live code/docs/template consumers before deletion.
- Architecture check PASS with only pre-existing warnings.

Commit: `6971fa8e5553dcbb8329ac84f876d9c689e1c7d4`
PR comment: `4774604177`

## S4 - Fresh Wording and Arch-Debt Folding

Changed only misleading Fresh doc wording for canonical query hooks and telemetry options, refreshed
the Fresh reference wording, and appended the staged arch-debt decisions:
`RUN-ARTIFACT-ARCHIVAL-POLICY`, `PAGEBUILDER-LEGACY-COMPAT-TREE`,
`FORMPAGEPROPS-PLAYGROUND-MIGRATION`, `REDIS-LEGACY-VALUE-FALLBACK`, `DEBT-1`, and `DEBT-2`.

Validation:

- Stale backward-compatible wording grep clean across Fresh source and reference docs.
- Canonical Fresh query/telemetry symbols remain present.
- `deno doc --lint packages/fresh/mod.ts` PASS.
- Scoped formatter check PASS on touched S4 files after write/check.
- Architecture check PASS with only pre-existing warnings.

Commit: `a0573ce34cc5823cf0ec9f07148eece5a1741373`
PR comment: `4774647730`

## Final Notes

The requested scaffold runtime suite was not run during implementation; it is reserved for the
separate IMPL-EVAL / merge-readiness pass. The implementation used forward commits only and explicit
push refspecs for the PR branch.
