# Worklog — CLI JSR production hardening

## Design

Implementation resumes from the locked cycle-2 plan in `plan.md` for the A6 `@netscript/cli`
package. Public surface stays unchanged in S1: no new exports, no command vocabulary changes, and no
new public types. The affected extension axis is the existing `TemplateRegistry`, keyed by
`TemplateKey` and consumed by sync scaffold renderers after command-entry hydration.

S1 introduces portable template hydration via `fetch(URL).text()`, lazy hydration at public scaffold
command entry points, cached sync reads, a JSON module import for the generated Deno config schema,
and manifest-key reads for contract templates. The five CLI spine concepts remain unchanged:
`CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and
`Registry<TKey, TValue>`. No new layer-2 abstract is introduced.

Commit slices:

1. S1 — portable asset loader, registry hydration, public scaffold hydration bootstrap, cached sync
   reads, JSON schema module import, contract-template manifest routing, and template asset tests.
2. S2 — JSR `bin` map in `packages/cli/deno.json`, with dry-run publish and doc surface evidence.
3. S3 — production `packageSource` e2e wiring and release-triggered production workflow.

Deferred scope remains the plan's accepted future work: converting `.template` files to TypeScript
string modules for offline scaffold operation and running the expensive full production smoke during
IMPL-EVAL/post-publish rather than this implementation loop.

## Evidence

| Slice | Command | Exit | Summary |
| --- | --- | ---: | --- |
| S1 | `deno test --allow-read --allow-net packages/cli/src/kernel/adapters/templates/template-asset_test.ts` | 0 | New static scan and local HTTP hydration proof passed: 2 tests green. |
| S1 | `rtk proxy deno task --cwd packages/cli check` | 0 | CLI package entrypoints type-check with `--unstable-kv`. |
| S1 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | Scoped wrapper selected 517 files across 5 batches; 0 type occurrences. |
| S1 | `deno test --allow-all packages/cli/src/kernel/adapters/service/scaffolder_test.ts packages/cli/src/kernel/adapters/database/scaffolder_test.ts packages/cli/src/kernel/adapters/plugin/scaffolder_test.ts` | 0 | Direct sync-generator tests hydrate explicitly; 10 tests green. |
| S1 | `deno run -A packages/cli/bin/netscript.ts init s1-init --path .llm/tmp --ci --yes --no-git --no-aspire --force` | 0 | Public local `init` completed end to end; created 110 files / 23 directories, scratch output removed. |
| S1 | `deno fmt --no-config --line-width 100 --single-quote --check <16 touched cli files>` | 0 | Touched CLI files are formatted under the package style. |
| S1 | `deno lint --no-config packages/cli/src/kernel/adapters/templates/template-asset.ts packages/cli/src/kernel/adapters/templates/template-asset_test.ts packages/cli/src/kernel/application/registries/template-registry.ts` | 0 | New loader/registry/test files lint clean with default Deno rules. |
| S1 | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | 1 | Wrapper selected 517 files but Deno returned exit 1 with 0 findings because root config excludes `packages/cli`; raw touched-file lint above is the usable lint evidence. |
| S1 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx --ignore-line-endings --pretty` | 1 | Wrapper selected 517 files but Deno returned exit 1 with 0 findings because root config excludes `packages/cli`; raw touched-file fmt check above is the usable fmt evidence. |
| S1 | `git diff --check` | 2 | Blocked only by unrelated pre-existing `.llm/tmp/run/openhands/**/request.md` trailing whitespace/CRLF changes in the dirty worktree; not staged for this slice. |
| S2 | Deno config/bin verification | 0 | Re-read `.agents/skills/netscript-deno-toolchain`; checked current Deno config/install docs. Current config reference does not document `bin`, but `deno publish --dry-run` below accepted the locked top-level `bin` map. |
| S2 | `deno publish --dry-run --allow-dirty --no-check=remote` from `packages/cli` | 0 | Dry-run succeeded with two pre-existing dynamic-import warnings; `bin/netscript.ts` remained in publish file list and the new `bin` field was accepted. |
| S2 | `deno doc --lint packages/cli/mod.ts` | 0 | Public doc surface lint passed; S2 changed package metadata only, leaving `exports` and `mod.ts` unchanged. |
| S2 | `deno doc --json packages/cli/mod.ts > .llm/tmp/cli-doc-s2.json` | 0 | Public doc JSON generated successfully for surface inspection; scratch file removed. |
| S2 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | Scoped wrapper selected 517 files across 5 batches; 0 type occurrences. |
| S2 | `rtk proxy deno task --cwd packages/cli check` | 0 | CLI package entrypoints type-check with `--unstable-kv`. |
| S2 | scoped lint/fmt wrappers | 1 | Same package-exclude behavior as S1: wrappers return nonzero with 0 findings because root config excludes `packages/cli`; no S2 TypeScript files were changed. |
| S3 | `rtk proxy deno task check` | 0 | Root wrapper selected 1730 files across 15 batches; 0 type occurrences. |
| S3 | `rtk proxy deno task --cwd packages/cli check` | 0 | CLI package entrypoints type-check with `--unstable-kv` after e2e wiring changes. |
| S3 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | Scoped wrapper selected 517 files across 5 batches; 0 type occurrences. |
| S3 | `deno check --unstable-kv <10 touched e2e files>` | 0 | Focused e2e runner, gate, option, and suite files type-check. |
| S3 | `deno lint --config /dev/null <10 touched e2e files>` | 0 | Touched e2e TypeScript files lint clean with direct no-config lint. |
| S3 | `deno fmt --check <10 touched e2e files plus .github/workflows/e2e-cli-prod.yml>` | 0 | Touched TypeScript and workflow files are formatted. |
| S3 | `python3 - <<'PY' ... yaml.safe_load('.github/workflows/e2e-cli-prod.yml') ... PY` | 0 | New production workflow parses as YAML; `ruby` was unavailable locally. |
| S3 | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx` | 1 | Same package-exclude behavior as S1/S2: wrapper selected 517 files and returned 0 findings but nonzero due root config exclusion; direct touched-file lint above is the usable lint evidence. |
| S3 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | 1 | Same package-exclude behavior as S1/S2: wrapper selected 517 files and returned 0 findings but nonzero due root config exclusion; direct touched-file fmt above is the usable fmt evidence. |
| S3 | full `scaffold.runtime` e2e | skipped | Intentionally not run in implementation per locked plan; reserved for IMPL-EVAL/post-publish. |

## Regression fix (commit e5fafc38) — supervisor-direct, authorized

IMPL-EVAL PASS was a FALSE POSITIVE: the pre-merge CI gate found CI RED with 20 failures, all
`Error: Template registry not hydrated — await DEFAULT_TEMPLATE_REGISTRY.hydrate() before sync
template reads`. The eval had run only touched-file tests, not the repo-wide suite. S1's
fetch-based registry requires `hydrate()` to have been awaited before any `readTemplateAssetSync`.

Root-cause split:

- Production paths: the database & service scaffolders already `await readTemplateAsset(...)` (which
  self-hydrates) before their sync generators run; `PluginScaffolder` was the only adapter with no
  async read. Fixes: hydrate once at `runPublicCli` (covers every dispatched command + the bin/e2e
  path) and hydrate at `PluginScaffolder.scaffold()` entry.
- Tests: 14 modules drive sync generators/orchestration directly (below the dispatch path) and so
  never hit the dispatch hydration. Fixed by a module-level top-level-await `hydrate()` (Deno
  completes a module's TLA before running its registered tests; `hydrate()` is memoized).

The F-CLI-15/16 hydration guard was deliberately left unweakened — no sync-FS fallback was added,
because that would re-mask the original https asset-read production failure (CLI-PROD-01).

| Gate | Command | Exit | Summary |
| --- | --- | ---: | --- |
| Fix | `deno test --allow-all --unstable-kv` (full `packages/cli` suite) | — | 0 hydration failures remain; the only 2 locally-red tests are proven Windows-only artifacts (below). |
| Fix | `deno test … orchestrate-init_test.ts` under WSL/Linux Deno | 0 | 5 passed / 0 failed — confirms the local red is `@std/path` `join()` backslash on Windows; Linux CI uses `/`. |
| Fix | `route-templates_test.ts` after LF-normalizing `_layout.tsx.template` | 0 | 1 passed (18 steps) — confirms the local red is a CRLF working-tree vs LF blob artifact; CI checks out LF. |
| Fix | `run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 517 files / 5 batches; 0 type occurrences. |
| Fix | `deno lint packages/cli` | 0 | Checked 73 files; clean (scoped wrappers still exit 1 / 0 findings per the documented root-exclude behavior). |
| Fix | `deno publish --dry-run --allow-dirty` from `packages/cli` | 0 | `Success Dry run complete`. |

Pushed `d0e1bf7a..e5fafc38` to `origin/fix/cli-jsr-prod-hardening`.

## Regression fix part 2 (commit 4e252b80) — second composition root

CI stayed RED after e5fafc38: the `scaffold-static` job's `scaffold.plugin.worker` gate failed with
the same `Template registry not hydrated` error. Root cause via the e2e `--report` JSON: the failing
command is `deno run -A packages/cli/bin/netscript-dev.ts plugin add worker ...`. `netscript-dev.ts`
dispatches through `createLocalContributorCli(...).parse()`, a SECOND composition root distinct from
`runPublicCli` (bin `netscript.ts`). e5fafc38 only hydrated `runPublicCli` + `PluginScaffolder`; the
local-contributor root never hydrated, and the local plugin-add flow performs a sync template read
before reaching `PluginScaffolder.scaffold()`. (`init` passed because its scaffolders self-hydrate
via async `readTemplateAsset`.)

Fix: `createLocalContributorCli` now wraps the composed command's `parse()` with
`await DEFAULT_TEMPLATE_REGISTRY.hydrate()` before dispatch, mirroring `runPublicCli`. Covers the
dev bin, e2e, and any direct caller. Guard left unweakened.

| Gate | Command | Exit | Summary |
| --- | --- | ---: | --- |
| Fix2 | `deno task e2e:cli run scaffold.plugins --format pretty` | 0 | passed=10 failed=0 — worker/saga/trigger/stream/auth plugin adds all green. |
| Fix2 | `run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 517 files / 5 batches; 0 type occurrences. |
| Fix2 | `deno test --unstable-kv packages/cli/src/local/` | 0 | 2 passed (4 steps) / 0 failed — local-contributor add-plugin flow green. |
| Fix2 | `deno fmt --no-config --line-width 100 --single-quote --check <file>` | 0 | Checked 1 file; formatted. |
| Fix2 | `deno lint --no-config <file>` | 0 | Checked 1 file; clean. |

Pushed `e5fafc38..4e252b80` to `origin/fix/cli-jsr-prod-hardening`.

### CI re-trigger note

After pushing `53754c4b`, GitHub's PR-head pointer desynced: the branch ref advanced to `53754c4b`
but `pulls/127.head.sha` stayed at `e5fafc38`, so the `pull_request` synchronize event never fired
and no `ci` / `e2e-cli` run was created for the fix (`gh pr checks` showed stale `e5fafc38`
results). Advancing the branch ref with this note forces a fresh synchronize so CI runs against the
real fix tip.
