# Plan: CLI bundled-asset access — unified import-attribute strategy behind one port

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `fix-cli-jsr-asset-embedding--asset-embed`       |
| Branch         | `fix/cli-jsr-asset-embedding`                    |
| Phase          | `plan`                                           |
| Target         | `@netscript/cli` (+ `@netscript/plugin`, `@netscript/fresh-ui` embedded exports) |
| Archetype      | `4 - Application/CLI tooling package`            |
| Scope overlays | `service` (scaffold), `frontend` (fresh-ui registry) |

## Archetype

`@netscript/cli` is the application/tooling package; the asset layer is its kernel
(ports/adapters). `@netscript/plugin` and `@netscript/fresh-ui` are library packages that must
expose their bundled assets as **public embedded content** so the CLI consumes data, not file paths.

## Current Doctrine Verdict

Hexagonal seam exists (`Manifest` port → `TemplateRegistry` adapter → `template-asset` read API) but
is **bypassed**: scaffolders hand-build `new URL(…, import.meta.url)` and use the `fetch()` overload.
That bypass is both the JSR prod break and the call-site duplication the user flagged. Verdict:
re-converge every asset consumer onto the port; the port owns all complexity; call sites become thin.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| Contract first | Define the embedded-content contract (key→content) before rewiring consumers. |
| Wrap, don't reinvent | Use the platform mechanism (import attributes), not bespoke fetch/fs readers. |
| One way in | A single read API keyed by `TemplateKey`; deleting the `URL` overload forces convergence. |
| In-graph determinism | Assets travel as module-graph edges → bundled by JSR, no network/fs at scaffold time. |

## Goal

`@netscript/cli` scaffolds correctly when installed from JSR (`https:` `import.meta.url`), with
**zero** runtime asset access via `Deno.readTextFile`, `fromFileUrl`, `import.meta.resolve(bare)`, or
`fetch()`. All bundled assets load through import attributes behind one port. `--help`, `init`,
`plugin add`, service/db scaffold, and `ui install` all work over https. Merge bar = green
`e2e-cli-prod` against the published package.

## Scope

- **Embedded-content adapter (the port realization).** Introduce a single mechanism — an embedded
  content map keyed by `TemplateKey` — that the `TemplateRegistry` is constructed from. The registry
  no longer carries `url`/`ASSET_ROOT_URL`; `content` is always present; `hydrate()`/`#hydrate()`
  fetch loop is removed (kept as a no-op only if external callers exist, else deleted).
- **Generated barrel (`embedded.generated.ts`).** A codegen maps `TEMPLATE_KEYS` →
  `import k_<n> from '../assets/<path>' with { type: 'text' }` (and `{ type: 'json' }` for JSON),
  exporting `Record<TemplateKey, string>`. Content stays in the `.template` files; only the import
  list is generated. Add a `check:assets-barrel` regenerate-and-assert-no-diff gate.
- **Kill the `URL` overload.** `readTemplateAsset`/`readTemplateAssetSync` accept only `TemplateKey`.
  This forces sites #3–#6 off raw-URL/fetch onto declared keys.
- **Thin the scaffolders (#3–#6).** Delete the `new URL(…, import.meta.url)` constants in
  `service/scaffolder.ts`, `database/scaffolder.ts`, `plugin/registry-scaffolder.ts`,
  `windows/environment/env-file-writer.ts`; each calls `renderTemplateAssetSync(key, vars)`.
- **Site #1 (plugin skeleton, the `--help` crash).** `@netscript/plugin` exposes embedded skeleton
  content (`Record<PluginSkeletonTemplatePath, string>`) via `./templates`, built with the same
  import-attribute pattern. CLI deletes `pluginTemplateRoot`/`import.meta.resolve`; the plugin
  scaffold consumes the embedded record instead of a `templateRoot` + fs reads.
- **Site #2.** Fold `ASSET_ROOT_URL` removal into the registry rewrite.
- **Site #7 (fresh-ui registry, architectural).** `@netscript/fresh-ui` exposes its registry as a
  public embedded export (manifest + every component file's content as `Record<string,string>`),
  built with import attributes. CLI `ui install` consumes embedded content + manifest instead of
  `defaultFreshUiRegistryRoot()` fs-walk and per-file `fs.readFile`. Import-rewriting operates on
  embedded content strings. (Largest, isolated commit.)

## Non-Scope

- Bucket-B reads (maintainer-time local reads, deploy logs, compile/bundler, install,
  manifest-loader, deno-file-system) — they run at maintainer/local time with a real filesystem; not
  a JSR-prod path. (See [[cli-jsr-asset-read-prod-blocker]] bucket list.)
- The parallel **plugin-copy / userland `plugins/` surfacing** concern — separate slice/PR
  (investigation agents running). Note the adjacency but do not couple.
- Changing template content/output shape. This is a transport change only; scaffold output bytes
  must be byte-identical.

## Hidden Scope

- Import specifiers must be static literals → the barrel MUST be generated (no dynamic path import).
- `publish.include` for cli/plugin/fresh-ui must ship the assets AND the generated barrel.
- `deno doc --lint` must pass on the **full export map** of plugin + fresh-ui after adding embedded
  exports ([[jsr-doc-lint-full-export-set]]).
- `readTemplateAssetSync` callers that relied on prior `hydrate()` ordering must still work now that
  content is eagerly present (simplification, but verify no caller awaited hydrate for correctness).
- JSON assets via `with { type: 'json' }` already proven by editor-config; reuse, don't re-derive.
- `scaffold-template-assets.ts` is **already conformant** (its `*_URLS` maps hold `TemplateKey`s, not
  URLs — misleading naming; it uses the keyed branch). It is the reference target shape, NOT a
  bypass. It benefits automatically once the registry is embedded-backed. Optional: rename `*_URLS`
  → `*_KEYS` for clarity (cosmetic, may defer).
- The real `URL`-overload bypasses are only the four scaffolders #3–#6 (service, database,
  plugin/registry, windows env). Their `.template` files (`assets/service/**`, `assets/database/**`,
  `assets/workspace/plugins/mod.ts.template`, `assets/windows/env.template`) may NOT yet be in
  `TEMPLATE_KEYS`; if so, promote them into the manifest + barrel, then switch each scaffolder from
  its `new URL(...)` constant to the declared key.

## Locked Decisions

| ID    | Decision | Rationale |
| ----- | -------- | --------- |
| `D1`  | Import attributes everywhere; no `fetch`, no `Deno.readTextFile`, no `fromFileUrl`/`import.meta.resolve` on import.meta-derived asset paths | User-locked mechanism; in-graph, deterministic, https-safe ([[jsr-safe-asset-embedding-text-imports]]) |
| `D2`  | One port, one read API keyed by `TemplateKey`; delete the `URL`/`fetch` overload | Removes the duplication escape hatch; forces convergence |
| `D3`  | Barrel is **generated** + guarded by a `check:assets-barrel` no-diff gate | Static-literal constraint; durability against new templates |
| `D4`  | `@netscript/plugin` and `@netscript/fresh-ui` own their embedded content (per-package barrels); CLI consumes data, not template roots | Asset belongs to its package ([[jsr-safe-asset-embedding-text-imports]]) |
| `D5`  | Scaffold output bytes unchanged | Transport-only change; e2e must see identical files |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Split #7 (fresh-ui) into its own PR? | safe to defer to slice-time | Keep as the final, isolatable commit; if it balloons, fast-follow PR but it IS in scope (user: "all aligned") |
| Keep `hydrate()` as deprecated no-op vs delete | resolve at impl | Delete if no external caller; else no-op + remove from hot path |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| 130+ generated imports slow cold start / bundle bloat | Measure; import attributes are lazy-string content, comparable to prior fetch payload; acceptable for a CLI |
| fresh-ui embedded registry is large / many files | Isolate in its own commit; generate its barrel too; verify `deno doc --lint` + publish dry-run |
| Removing `URL` overload breaks an unseen caller | Grep all `readTemplateAsset(` call sites before deleting; convert each |
| Barrel drift (new template not embedded) | `check:assets-barrel` gate fails CI on diff |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| Per-call `new URL(…, import.meta.url)` asset reads | existing | resolve — delete all, route through port |
| Two read paths (key vs URL/fetch) | existing | resolve — single keyed API |
| Eager `import.meta.resolve` at command-deps build | existing (crash) | resolve — embedded plugin record |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| `deno task check` (cli/plugin/fresh-ui, `--unstable-kv`) | yes | scoped `run-deno-check.ts` clean |
| `deno task lint` + `fmt:check` (source ts/tsx) | yes | scoped wrappers clean |
| `publish:dry-run` (cli, plugin, fresh-ui) | yes | assets + barrel included, no slow-types |
| `deno doc --lint` full export map (plugin, fresh-ui) | yes | no private-type-ref on new embedded exports |
| `check:assets-barrel` no-diff | yes (new) | regenerate → `git diff --exit-code` clean |
| `deno task e2e:cli run scaffold.runtime --cleanup` | yes | local-mode scaffold output byte-identical |
| `e2e-cli-prod` (published package, https) | yes (MERGE BAR) | `--help`/init/plugin/service/db/ui install all green from JSR |
| static lint gate: no `Deno.readTextFile`/`fromFileUrl`/`import.meta.resolve` in JSR-prod asset paths | yes (new) | regression guard ([[jsr-safe-asset-embedding-text-imports]]) |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `cli-jsr-asset-read-prod-blocker` | close on merge | This slice is the systemic fix |
| static-guard for asset-read class | create | Lint rule + required `e2e-cli-prod` so the class can't regress |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | check | `run-deno-check.ts --root packages/cli --root packages/plugin --root packages/fresh-ui --ext ts,tsx` | clean |
| 2 | barrel | `deno task gen:assets-barrel && git diff --exit-code` | no diff |
| 3 | lint/fmt | scoped `run-deno-lint.ts` / `run-deno-fmt.ts` (ts,tsx) | clean |
| 4 | doc-lint | `deno doc --lint` full export map plugin + fresh-ui | clean |
| 5 | dry-run | `deno task publish:dry-run` (cli, plugin, fresh-ui) | assets+barrel shipped |
| 6 | e2e local | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | pass, output byte-identical |
| 7 | e2e prod | `e2e-cli-prod` against published alpha.5 | pass — MERGE BAR |

## Risks

- fresh-ui (#7) is the architectural unknown — keep it the last, isolated commit so #1–#6 can land
  and prove `e2e-cli-prod` even if #7 needs a fast-follow.
- Release ordering: `e2e-cli-prod` requires a published alpha.5; coordinate with the release-train
  ordering defect (#123) so the prod gate runs after publish completes.

## Dependencies

- `@netscript/plugin` `./templates` embedded export (this slice) before CLI site #1 rewrite.
- `@netscript/fresh-ui` embedded registry export (this slice) before CLI site #7 rewrite.
- Published `alpha.5` to exercise `e2e-cli-prod` (release train; see [[alpha3-release-train-defects]]).

## Drift Watch

- If import-attribute `type:"text"` requires `--unstable-raw-imports` on the CI Deno build (it did
  NOT in 2.8.3/2.9.0 spikes) → log and add the flag.
- If fresh-ui embedded registry forces a public-type change in `@netscript/fresh-ui` `*Namespace`
  exports → that sub-change is itself a framework slice; record and keep on Codex.
- If any scaffold output byte differs after transport change → drift `significant`, stop and diff.
