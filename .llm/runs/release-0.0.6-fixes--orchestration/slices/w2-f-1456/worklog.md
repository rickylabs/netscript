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

