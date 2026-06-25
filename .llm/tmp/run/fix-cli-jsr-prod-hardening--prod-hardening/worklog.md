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
