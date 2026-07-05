# Worklog: fix plugin install ai JSR alias

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-480-plugin-ai-jsr-alias--impl` |
| Branch | `fix/480-plugin-ai-jsr-alias` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `none` |

## Design

### Public Surface

- `netscript plugin install <kind>` public CLI command.
- `resolvePluginPackageSpec(spec)` package resolver used before plugin kind planning.

### Domain Vocabulary

- Bare plugin alias - official shorthand such as `workers`, `auth`, or `ai`.
- JSR plugin descriptor - validated package metadata and `scaffold.plugin.json` from JSR.
- Plugin kind provider - provider metadata registered from the validated plugin manifest.

### Ports

- `JsrPluginValidatorPort` - existing port consumed by the install flow for JSR package validation.

### Constants

- `BARE_PLUGIN_PACKAGE_ALIASES` - official public shorthand to scoped NetScript plugin package map.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Resolve the AI bare alias through the JSR package path and document the official-list sweep. | Resolver unit test, scoped wrappers, scratch prod-path installs. | `packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts`, `packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts`, `.llm/runs/fix-480-plugin-ai-jsr-alias--impl/*` |

### Deferred Scope

- Adding AI to local copy/import-rewrite lists - deferred because those lists gate copied monorepo plugin directories and already intentionally exclude `auth`.
- Full `scaffold.runtime` e2e - deferred to evaluator/merge-readiness per task; this slice runs the smaller prod-path probe that exercises the failing gate.

### Contributor Path

To add a future official public bare alias, update `BARE_PLUGIN_PACKAGE_ALIASES`, add a resolver test, and run the JSR-path plugin install probe without `--local-path`.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-05 | 1 | research | Verified missing `ai` alias and swept adjacent official-plugin lists. |
| 2026-07-05 | 1 | implementation | Added `ai` alias and resolver unit test. |
| 2026-07-05 | 1 | validation | Resolver unit test, `packages/cli` scoped type-check, direct lint, and prod-path AI/Auth installs completed. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Leave trust tier unchanged | First-party trust is scope based. | `plugin-trust-tier.ts` |
| Leave `OFFICIAL_PLUGIN_DIRS` unchanged | It is for local plugin dir path rewriting, not public JSR aliasing. | `plugin-import-rewriter.ts` |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Implementation lane proceeded from owner-supplied verified plan without separate local PLAN-EVAL launch. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Unit | `deno test --allow-read packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts` | PASS | 1 test module, 5 steps passed. |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | PASS | 590 files selected, 5 batches, 0 occurrences. |
| Lint wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/src/public/features/plugins/install --ext ts,tsx` | FAIL | Wrapper selected 13 files but Deno exited 1 with 0 findings because root config excludes `packages/cli/`. |
| Lint direct | `deno lint --no-config packages/cli/src/public/features/plugins/install/plugin-package-resolver.ts packages/cli/src/public/features/plugins/install/plugin-package-resolver_test.ts` | PASS | Checked 2 touched files. |
| Fmt wrapper | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/src/public/features/plugins/install --ext ts,tsx` | FAIL | Wrapper selected 13 files but Deno exited 1 with 0 findings because root config excludes `packages/cli/`. |
| Fmt direct | `deno fmt --check --no-config <touched files>` | NOT_APPLICABLE | Deno defaults prefer double quotes; repo CLI files intentionally follow root single-quote style while root fmt excludes `packages/cli/`. No mutating fmt run. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| F-CLI-* | PENDING_SCRIPT | Manual review of touched files. | No new command files, adapters, side-effect locations, or folders. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Prod-path AI install | PASS | `deno run -A packages/cli/bin/netscript-dev.ts plugin install ai --name ai --project-root . --samples --force` in `.llm/tmp/slice-480-aiprobe/aiprobe`, exit 0. | Ran without `--local-path`; generated 6 plugin files and appsettings entry `jsr:@netscript/plugin-ai@0.0.1-beta.4/services`. |
| Prod-path Auth install | PASS | `deno run -A packages/cli/bin/netscript-dev.ts plugin install auth --name auth --project-root . --samples --force` in `.llm/tmp/slice-480-aiprobe/aiprobe`, exit 0. | Ran without `--local-path`; generated 1 plugin file and appsettings entry `jsr:@netscript/plugin-auth@0.0.1-beta.4/services`. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| Scratch scaffold project | PASS | `deno run -A packages/cli/bin/netscript-dev.ts init aiprobe --ci --yes --no-git --db postgres --service --service-name users --service-port 3001 --force --path .llm/tmp/slice-480-aiprobe`, exit 0. | Created `.llm/tmp/slice-480-aiprobe/aiprobe`. |

## Handoff Notes

- Inspect the resolver diff first; the expected production behavior is that `ai` now resolves as `jsr:@netscript/plugin-ai` and reaches the JSR validator.
