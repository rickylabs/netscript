# Worklog — exact canary plugin install

## Design

- Public surface: existing `plugin install --jsr-url`; no new exported API or command.
- Domain vocabulary: `ResolvedPluginPackageSpec.requestedVersion` is the optional exact request; package identity remains `@scope/package`; `jsrSpecifier` is executable and versioned when explicit.
- Ports: existing `JsrPluginValidatorPort`, `JsrHttpClient`, `ProcessPort`, and `FileSystemPort`; no new port.
- Constants: negative-control requested version `0.0.6-canary.2`, stable latest `0.0.5` in test fixtures only.
- Archetype-6 spine/layer-2: unchanged. No abstract, registry, feature folder, command vocabulary, composition, permission, or extension-axis change.
- Vertical feature: `public/features/plugins/install`; JSR adapter remains under `public/infra/jsr`; dispatch remains under `public/features/plugins/dispatch`.
- Extension axes: existing plugin-kind registry only; no change.
- Generated outputs: root `deno.json` plugin import, appsettings command, installed `scaffold.plugin.json` metadata.
- Semantic test strategy: resolver tests both spellings; adapter negative control proves exact beats differing latest; install-flow test proves the exact spec reaches process dispatch and generated files.
- Commit slice: one deterministic slice, as named in `plan.md`.
- Deferred scope: ranges/tags and contended `scaffold.runtime`.
- Contributor path: resolver → validator → `resolvePluginDescriptorBeforePlanning` → `dispatchPluginScaffold` / workspace mutation.

## Plan gate

`PLAN-EVAL: N/A` — #1456 provides exact behavior, acceptance, negative control, and gates; no architecture or scope decision remains.

## Progress

- Bootstrap and research complete.
- Added exact semantic-version parsing to the package resolver for both accepted spellings.
- Made explicit version selection precede CLI-release/latest fallback, with missing/yanked checks
  and manifest identity validation.
- Threaded the validated version through plugin-owned scaffold dispatch and generated root imports.
- Added resolver, validator negative-control, and end-to-end install-flow tests.
- Captured a reproducible red run on the baseline and a green 50-step focused run.
- Live JSR validation proved `plugin-ai@0.0.6-canary.2` while stable latest remained `0.0.5`.
- All required root/scoped/quality gates, CLI doc lint, and CLI publish dry-run are green.
- Diff scan found no new `deno-lint-ignore`, `as unknown as`, or `@ts-ignore`; lock unchanged.
- Opened draft PR #1579 with `Closes #1456`, the explicit acceptance checklist, structured
  `box-index:` evidence, required taxonomy labels, and milestone `0.0.6`.
- Re-synced advancing `main` through `db1d79c68` immediately before the one-way ready
  transition; focused tests, scoped CLI check, and quality gate remained green after the merge.
- Automatic IMPL-EVAL passed on head `b80e56249`:
  https://github.com/rickylabs/netscript/actions/runs/31602734057
- Final review-thread gate passed with 0 threads / 0 unanswered. PR left open and unmerged.
