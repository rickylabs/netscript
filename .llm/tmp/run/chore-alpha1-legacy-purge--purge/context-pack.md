# Context Pack

Run: `chore-alpha1-legacy-purge--purge`
PR: `#114`
Branch: `chore/alpha1-legacy-purge`

## Scope

This implementation completed the PLAN-EVAL-approved alpha-1 legacy/deprecated purge and folded
hygiene work in four forward slice commits.

Explicit exclusions were preserved:

- `packagesAsWorkspaceMembers`
- workers stream schema `schedule?`
- canonical `ServiceConfig.dependsOn` in `packages/config`

Version policy was preserved at `0.0.1-alpha.0`. Root `deno.lock` was not modified, and no new casts
were introduced.

## Slice Commits

- S1: `7492a1d97940d5059dc68732f222eafabc307699` - `chore: purge tier-1 legacy surfaces`
- S2: `35f9278b5c654e6ac9ee1891a7c53317277a3c79` - `chore: remove aspire DependsOn alias`
- S3: `6971fa8e5553dcbb8329ac84f876d9c689e1c7d4` - `chore: untrack generated smoke artifacts`
- S4: `a0573ce34cc5823cf0ec9f07148eece5a1741373` - `chore: clarify fresh canonical docs`

## PR Comments

- S1: `4774576885`
- S2: `4774595757`
- S3: `4774604177`
- S4: `4774647730`

## Gate Evidence

S1:

- Named grep gate clean for `updatePluginRegistry`, `safeExtend`, `startWorkersStreamMirror`, and
  `WorkersStreamMirrorState` across live source/docs/templates after edits.
- `.llm/tools/run-deno-check.ts --root packages/cli --root packages/fresh --root plugins/workers --ext ts,tsx` PASS.
- `.llm/tools/run-deno-lint.ts` and `.llm/tools/run-deno-fmt.ts` over the same roots PASS with
  `--batch-size 1000`.
- `deno doc --lint packages/cli/mod.ts`, `packages/fresh/mod.ts`,
  `packages/plugin-workers-core/mod.ts`, and `plugins/workers/streams/server.ts` PASS.
- Package tests PASS for `packages/cli`, `packages/fresh`, `plugins/workers`, and
  `packages/plugin-workers-core`.
- `deno task arch:check` PASS with only pre-existing warnings.

S2:

- `DependsOn` grep clean across `packages/aspire`, `packages/cli`, `plugins`, `templates`, and
  `docs` after removing the Aspire legacy alias path.
- Canonical `dependsOn` and `ServiceReferences` path preserved through raw config, deploy config
  resolution, generated Aspire helper templates, compile targets, and tests.
- `.llm/tools/run-deno-check.ts --root packages/aspire --root packages/cli --ext ts,tsx` PASS.
- `.llm/tools/run-deno-lint.ts` and `.llm/tools/run-deno-fmt.ts` over the same roots PASS with
  `--batch-size 1000`.
- `deno doc --lint packages/aspire/mod.ts` PASS.
- `packages/aspire` tests PASS.
- Targeted CLI compile/helper tests PASS, then full `packages/cli` tests PASS.
- `deno task arch:check` PASS with only pre-existing warnings.

S3:

- `.llm/tmp/init-json-smoke/` untracked from git and added to `.gitignore`.
- CLI init-json e2e regenerated smoke output locally; regenerated files are ignored by
  `.gitignore`.
- Zero-reference scratch files under `.llm/tmp/` were deleted after confirming no code/docs/template
  consumers.
- `deno task arch:check` PASS with only pre-existing warnings.

S4:

- Fresh wording-only docstring changes retained canonical query hook and telemetry APIs.
- Stale wording grep clean for `Backward-compatible alias`, `Backward-compatible telemetry`, and
  `backward-compatible alias` across `packages/fresh/src` and
  `docs/site/reference/fresh/index.md`.
- Canonical symbol grep confirmed `useQuery`, `useSuspenseQuery`, `useInfiniteQuery`,
  `useSuspenseInfiniteQuery`, `useMutation`, and `FreshAppTelemetryOptions` remain present.
- `deno doc --lint packages/fresh/mod.ts` PASS.
- `.llm/tools/run-deno-fmt.ts` PASS on the four touched S4 files after scoped format/write and
  check.
- `deno task arch:check` PASS with only pre-existing warnings.
