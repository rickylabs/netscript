# Research — #1589 split Fresh/SDK versions produce distinct cache-provider singletons

Branch: `fix/1589-sdk-provider-closure` at `main@fc312f211`. Triage source: `slices/triage-1589.md`.
The located mechanism and ranked options are accepted as inputs and were not re-derived.

## Re-baseline

- The branch is based directly on `fc312f211`; its existing first commit (`a317933d`) only carries
  the brief and triage onto the leaf branch.
- The [live issue](https://github.com/rickylabs/netscript/issues/1589) still describes the exact
  split: Fresh root and SDK `0.0.5`, Fresh defer subpaths `0.0.6-canary.3`, followed by the runtime
  provider failure. It has no comments that amend the supplied contract.
- The mechanism remains at `packages/sdk/src/cache/cache-provider.ts:37,62`: one module-local
  `_provider`, and the runtime-only "Cache provider not initialized" failure. This is evidence only;
  the slice does not change it in the first cut.
- All three package manifests at this baseline declare `0.0.5` (`packages/fresh/deno.json:3`,
  `packages/sdk/deno.json:3`, `packages/telemetry/deno.json:3`). Fresh itself pins telemetry and
  SDK/desktop at that exact version (`packages/fresh/deno.json:47,50`). Exact internal pins
  therefore do **not** prevent a consumer from also loading a differently pinned direct SDK copy;
  the incident already proves the duplicate is legal to resolve.

## Existing enforcement and the missing boundary

The repo already has release-train policy, but only on producer-side emitted specifiers:

- `.llm/tools/validation/check-netscript-jsr-specifiers.ts:6-14,372-412` rejects versionless,
  stale-exact, range-pinned, and nonexistent first-party subpaths. It scans framework source and
  generated assets in this repository; it is not installed into a consumer workspace.
- `packages/cli/src/kernel/constants/jsr-specifiers.ts:35-45,54,70,72` derives Fresh, SDK, and
  telemetry JSR specifiers from one `NETSCRIPT_RELEASE_VERSION`.
- `packages/cli/src/public/adapters/jsr-import-resolver.ts:9-21,78-84,95-110` maps Fresh roots and
  subpaths, SDK roots and subpaths, and telemetry from that release-train table.
- The generated app manifest currently carries a Fresh root, an explicit defer-island subpath, and
  an SDK root (`packages/cli/src/kernel/adapters/templates/app/generate-app-deno-json.ts:47-74`).
  JSR-mode subpaths otherwise resolve through the root package mapping; local mode emits explicit
  subpaths (`:76-103`).
- Generated `dev` already runs a dependency preflight, but `build` runs Vite directly
  (`generate-app-deno-json.ts:116-120`). The existing preflight checks npm materialization, not the
  NetScript release closure.
- Generated Vite config always imports `@netscript/fresh/vite` and the defer island
  (`packages/cli/src/kernel/assets/app/vite.config.ts.template:5,40-42`). A checker added only to a
  _new_ Fresh Vite subpath would not protect the reported configuration when that Vite subpath is
  still resolved by the stable Fresh root. This is why the first cut belongs at the generated
  workspace boundary, not solely inside the new Fresh package.

## Deno resolution probe

Read-only scratch probes on Deno `2.9.5` used `import.meta.resolve()` under an explicit config. The
split reproduction resolved exactly as separate identities:

```text
@netscript/fresh => jsr:@netscript/fresh@0.0.5
@netscript/fresh/defer => jsr:@netscript/fresh@0.0.6-canary.3/defer
@netscript/fresh/defer/island => jsr:@netscript/fresh@0.0.6-canary.3/defer/island
@netscript/sdk => jsr:@netscript/sdk@0.0.5
@netscript/telemetry => jsr:@netscript/telemetry@0.0.5
```

With only a coherent Fresh root mapping, Deno prefix-resolved `@netscript/fresh/defer` to the same
canary package. A coherent local-source config resolved the aliases to files under one local Fresh
package plus the local SDK and telemetry package roots. Therefore a generated preflight can compare
the **effective resolved identities**, rather than guessing from raw JSON text or hand-parsing
`deno.jsonc`.

Identity needs two dimensions:

1. version — Fresh, SDK, and a directly mapped telemetry package must be on the same exact release;
2. origin — Fresh root/subpaths (and SDK root/subpaths) must resolve through the same JSR package or
   the same local package root. A local/JSR mixture at the same version is still two module
   identities and must fail.

No cache reload, dependency update, publish operation, or lockfile write was used. `deno.lock`
remained unchanged.

## False-positive analysis

Legitimate situations the check must preserve:

- **Separate apps/workspace members on different releases.** Validate each app with its own active
  Deno config; never aggregate versions across the whole repository.
- **Unrelated transitive multi-version packages.** Ignore the lockfile's general multi-version
  graph. The rule is only the Fresh/SDK cache-provider closure resolved in the active app namespace.
- **A coherent JSR stable or canary closure.** Exact stable and exact prerelease versions both pass;
  prerelease syntax is not treated as a range.
- **A coherent local-source workspace.** Local Fresh subpaths may be different files, but they pass
  when their nearest package manifest is the same `@netscript/fresh` root and the local SDK (plus
  direct telemetry, if present) declares the same release version.
- **Telemetry not directly mapped by an app.** The current generated app manifest does not emit a
  telemetry alias. Absence is not itself a split; telemetry becomes part of the comparison when the
  app can resolve a direct `@netscript/telemetry` identity. If present, it must align.
- **Unused unrelated aliases.** Only the fixed Fresh/SDK closure specifiers and optional telemetry
  are probed. Other NetScript packages may resolve independently.

Intentional rejection, not a false positive:

- An explicit but currently unused Fresh or SDK subpath pin that splits the root is rejected. The
  configuration is a latent instance split, and the issue contract explicitly says a subpath pin
  must not be able to imply one.
- A mixed local/JSR closure at the same textual version is rejected because URL identity, not only
  semver text, controls module singleton ownership.

## Not fully verified

- A single resolver probe cannot prove every per-referrer override in a hand-authored external
  import map using `scopes`. Generated NetScript workspaces do not emit scoped closure overrides;
  the plan treats that as an unsupported manual configuration rather than claiming coverage.
- Direct source imports such as `jsr:@netscript/sdk@<other-version>/query` bypass a bare
  `@netscript/sdk` alias. The generated-workspace contract uses bare package aliases, and this first
  cut does not scan arbitrary source text. PLAN-EVAL should reject the plan if closing #1589 is
  intended to cover deliberately hand-authored literal multi-version imports too.
- No consumer-exact EIS Chat repository was available in this worktree, so the proposed diagnostic
  was not run against that private configuration. The issue body and supplied triage are the
  consumer-exact evidence.
- `deno doc --filter createNetScriptVitePlugin` reached the public signature but emitted unrelated
  cached npm type-resolution warnings. This was not used as a green doc-lint verdict.

## JSR/published-surface scan

The chosen first cut changes generated CLI output, not Fresh, SDK, or telemetry exports. It adds no
public symbol, subpath, peer declaration, or provider ownership rule. The CLI package's published
file set changes only through internal generator code, so the implementation must still run the full
CLI export-map doc lint and publish dry-run. There is no planned slow-type exposure: all new closure
result types/functions remain internal to CLI scaffolding, and the generated verifier is a consumer
edge script rather than a JSR export.
