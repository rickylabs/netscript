# repo:fresh-ui — registry / component / style-dictionary pipeline

Stage-B discovery corpus for the DevTools Contribution Architecture RFC.
Worktree `/home/codex/repos/ns-rfc-devtools-contribution`, branch `plan/devtools-contribution`
@ `d5852188b41c3bd2c7c2a52da61dcc3dc9aa43e1` (baseline `main` @ `2256a67bf`; no `packages/`
divergence observed on this branch).

All paths below are repo-relative unless stated. Everything marked **observed** was read at those
lines; **inference** entries name what they are inferred from; **unverified** entries name what
would verify them.

---

## Summary

`packages/fresh-ui` is a **copy-based (shadcn-style) registry** with a single hardcoded producer:
one TypeScript manifest (`registry.manifest.ts`, 1511 lines, 74 `name:` keys covering items +
collections) declares items whose file *contents* are then inlined into a generated embed
(`registry.generated.ts`, `FRESH_UI_REGISTRY_CONTENT: Record<string,string>`) by
`.llm/tools/generate-cli-assets-barrel.ts`. The CLI consumes both through the package export
`@netscript/fresh-ui/registry` and copies files into a userland Fresh app, rewriting relative and
`@netscript/fresh-ui/*` import specifiers to the copied targets, merging `deno.json` imports, and
appending `@import` lines to `assets/styles.css`. Copy targets are resolved through five fixed
alias prefixes (`@ui/`, `@islands/`, `@assets/`, `@lib/`, `~/`).

The public CLI surface is exactly five commands: `ui:init`, `ui:add`, `ui:list`, `ui:update`,
`ui:remove`, all registered in `packages/cli/src/public/features/root/public-command-tree.ts`.
`ui:add` is overloaded: its first positional is `<kind>` and is intercepted for the literals `page`
and `island` (Fresh scaffold triad) before falling through to registry-item install.

Theme is a registry item like any other (`theme-seed`, `kind: 'theme'`), but with a privileged role:
`writeStylesAggregator` requires *some* item of `kind: 'theme'` to exist and uses its `styles.css`
as the aggregator base; `resolveRegistryItems` lets `--theme <name>` substitute for any theme
dependency. The theme artifacts themselves are **generated** by Style Dictionary v5
(`scripts/build-tokens.ts`, `deno task tokens:build`) from DTCG token JSON under `tokens/`, with
`deno task tokens:check` as the drift gate.

There is **no plugin-facing contribution hook today**. The plugin installer manifest
(`packages/plugin/src/protocol/manifest.ts`) has no UI/registry field. The only extension seam that
exists is `--registry-root <path>`, which *replaces* the manifest wholesale by dynamic-importing
`<root>/registry.manifest.ts` — it does not merge with the built-in one. Collision behavior is
therefore untested and silent: name resolution is a `Map` built from the item array (last wins) and
file planning is keyed by *source* path, so two items writing the same *target* both get written and
the later one wins on disk. No uniqueness validation exists anywhere in the pipeline.

---

## Findings

### F1 — Registry format is a typed TS manifest, not JSON (observed)

The schema lives at `packages/fresh-ui/registry.schema.ts:1-64`. `RegistryManifest` carries
`name`, `version`, `packageName`, `model: 'copy-based-registry'`, `schemaVersion?: 2`,
`tokenSourceStrategy: 'style-dictionary-dtcg-source'`, `items[]`, `collections[]`
(`registry.schema.ts:50-63`). `RegistryItemDefinition` (`registry.schema.ts:29-47`) requires
`name`, `kind`, `description`, `copyOwnership`, `tags`, `files`, and optionally `layer: 2|3`,
`registryDependencies`, `dependencies`, `css`, `cssVars`, `docs`, `categories`, `meta`, `author`.
`RegistryItemKind` is a closed union: `theme | style | component | island | block | lib | hook |
support` (`registry.schema.ts:1-9`). `RegistryCopyOwnership` has exactly one member,
`'app-owned-after-copy'` (`registry.schema.ts:11`).

The single instance is `packages/fresh-ui/registry.manifest.ts:7-13` —
`export const freshUiRegistryManifest: RegistryManifest = { name: 'fresh-ui-foundation', version:
'0.1.0', packageName: '@netscript/fresh-ui', model: 'copy-based-registry', schemaVersion: 2,
tokenSourceStrategy: 'style-dictionary-dtcg-source', … } satisfies RegistryManifest`
(closing `satisfies` at the file tail). Note the manifest carries its **own** `version: '0.1.0'`,
decoupled from the package version `0.0.5` (`packages/fresh-ui/deno.json:3`) even though
`FRESH_UI_PACKAGE_VERSION` is imported at `registry.manifest.ts:2`.

### F2 — The published surface narrows the schema (observed)

`packages/fresh-ui/registry.ts` re-exports a **structurally weaker** view: `FreshUiRegistryItem`
declares only `name`, `kind?: string` (widened from the union), `files`, `registryDependencies?`,
`dependencies?`, `css?` (`registry.ts:27-41`), and `FreshUiRegistryManifest` only `{ items,
collections }` (`registry.ts:51-57`). `freshUiRegistryManifest` is assigned the full manifest
through that narrower type (`registry.ts:76`). So `layer`, `tags`, `cssVars`, `copyOwnership`,
`categories`, `meta`, `docs`, and the manifest-level `model`/`tokenSourceStrategy`/`schemaVersion`
are **not visible to any consumer of the published export** — verified via
`deno doc --no-lock registry.ts` run in `packages/fresh-ui`, whose output lists exactly
`FRESH_UI_REGISTRY_CONTENT`, `freshUiRegistryManifest`, `FreshUiRegistryCollection`,
`FreshUiRegistryCssContribution`, `FreshUiRegistryFile`, `FreshUiRegistryItem`,
`FreshUiRegistryManifest`. The doc-comment on `freshUiRegistryManifest` (`registry.ts:59-75`) states
"The registry contains 66 items total" and enumerates 8 collections: `foundation`, `ai`,
`forms-core`, `surface-core`, `feedback-core`, `layout-foundations`, `dashboard-blocks`, `desktop`.

### F3 — Content embed is generated by the CLI assets barrel, not by fresh-ui (observed)

`registry.generated.ts:1-2` reads `// @generated by .llm/tools/generate-cli-assets-barrel.ts / Do
not edit by hand. Run \`deno task gen:assets-barrel\`.` The producer is
`renderFreshUiRegistryContent()` at `.llm/tools/generate-cli-assets-barrel.ts:176-201`: it takes
`[...new Set(freshUiRegistryManifest.items.flatMap((item) => item.files.map((file) => file.source)))]`,
sorts them, inlines each file as a string literal, and emits
`export const FRESH_UI_REGISTRY_CONTENT: Record<string, string>`. The barrel imports the manifest
directly at `.llm/tools/generate-cli-assets-barrel.ts:15` and writes
`../../packages/fresh-ui/registry.generated.ts` (line 28).

The drift gate is `deno.json:109`, task `check:assets-barrel`:
`deno task gen:assets-barrel && git diff --exit-code -- … packages/fresh-ui/registry.generated.ts …`.
`packages/fresh-ui/registry.generated.ts` is also listed in `PUBLISH_ASSET_OUTPUTS` at
`.llm/tools/generate-publish-assets.ts:41`.

**Consequence (inference, from F3 + F1):** the *only* way a file can reach a userland app through the
default (non-`--registry-root`) path is by being referenced from `registry.manifest.ts` at the time
the barrel is regenerated in this repo. There is no runtime file read.

### F4 — Exactly five `ui:*` CLI commands (observed)

`packages/cli/src/public/features/root/public-command-tree.ts:91-110` registers:

| id | factory | file |
| --- | --- | --- |
| `ui:add` | `createUiAddCommand` | `packages/cli/src/public/features/ui/add/add-ui-command.ts` |
| `ui:init` | `createUiInitCommand` | `packages/cli/src/public/features/ui/init/init-ui-command.ts` |
| `ui:list` | `createUiListCommand` | `packages/cli/src/public/features/ui/list/list-ui-command.ts` |
| `ui:update` | `createUiUpdateCommand` | `packages/cli/src/public/features/ui/update/update-ui-command.ts` |
| `ui:remove` | `createUiRemoveCommand` | `packages/cli/src/public/features/ui/remove/remove-ui-command.ts` |

`ui:list`/`ui:update`/`ui:remove` are registered through a loop at lines 107-110. All five receive
`dependencies.uiInstallDependencies` and `dependencies.resolveUiAppRoot`.

Behaviors (from the application layer, `packages/cli/src/kernel/application/ui/registry.ts`,
re-exported verbatim by `packages/cli/src/public/features/ui/registry.ts:1`):

- **`ui:init`** — installs `DEFAULT_UI_INIT_ITEMS = ['foundation', 'floating-styles',
  'control-props']` (`registry.ts:75-79`) via `installUiRegistryItems`
  (`init-ui-command.ts:38-46`). Flags: `--project-root`, `--app`, `--registry-root`, `--theme`,
  `--force` (`init-ui-command.ts:29-34`).
- **`ui:add <kind> [name]`** — three-way dispatch (`add-ui-command.ts:57-77`): `kind === 'page'` →
  `scaffoldUiPage` (Fresh route + optional colocated island + query loader); `kind === 'island'` →
  `scaffoldUiIsland`; otherwise `installUiRegistryItems({ names: [kind] })`. Extra flags over
  `ui:init`: `--route`, `--island`, `--query` (`add-ui-command.ts:41-52`).
- **`ui:list`** — `listUiRegistryItems` maps every manifest item to `{ ...item, installed }`, where
  `installed` is true iff the item has ≥1 file and *every* target file exists
  (`registry.ts:130-142`). Returns collections unchanged.
- **`ui:update`** — `updateUiRegistryItems` (`registry.ts:145-166`): recomputes the desired content
  from the embed, writes the file if absent, and if present-but-different reports it as **drifted**
  and does **not** overwrite. Empty `names` → all currently-installed items.
- **`ui:remove <name>`** — `removeUiRegistryItem` (`registry.ts:169-201`): deletes the item's target
  files, then prunes `deno.json` imports it contributed, but only if no other *installed* item maps
  to the same import key (`registry.ts:186-197`).

### F5 — Copy-in, not package-import; target aliasing and import rewriting (observed)

The decision point is `installUiRegistryItems` (`registry.ts:81-127`). Files are read from the
embedded `FRESH_UI_REGISTRY_CONTENT` when no `--registry-root` is given (`registry.ts:90`, resolved
by `readRegistryContent`, `registry.ts:338-347`), otherwise read off disk from the override root.
Each file is written to the app (`registry.ts:106`) and skipped when the target exists and
`--force` was not passed (`registry.ts:97-99`).

Target aliases are a fixed table (`registry.ts:67-73`):

```
'@ui/'      -> 'components/ui/'
'@islands/' -> 'islands/ui/'
'@assets/'  -> 'assets/'
'@lib/'     -> 'lib/'
'~/'        -> ''            (project root)
```

resolved by `resolveTarget` (`registry.ts:277-284`); a non-alias target is joined onto the project
root (absolute targets pass through unchanged — see D3).

TS/TSX files get **import rewriting** (`registry.ts:103-105`, `rewriteRegistryImports`
`registry.ts:290-318`): two regexes rewrite `from '…'` and bare `import '…'` specifiers.
`resolveSpecifierSource` (`registry.ts:320-336`) only rewrites (a) relative `./` / `../` specifiers
and (b) specifiers beginning with the literal prefix `@netscript/fresh-ui/`; anything else is left
verbatim. The rewrite target is the *relative path between the two copied files*
(`registry.ts:302`). This is what makes copied L2 components self-contained in userland.

Runtime dependencies are merged into the app's `deno.json` by `mergeDenoJsonImports`
(`registry.ts:118`, implementation in `packages/cli/src/kernel/application/ui/registry-deno-json.ts`,
69 lines). Item `dependencies` are raw specifiers such as `'npm:clsx@^2.1.1'`,
`'npm:tailwind-merge@^3.5.0'` (`registry.manifest.ts:22`).

**Copy ownership is asserted in data, not enforced in code** (inference, from `registry.schema.ts:11`
+ `registry.ts:145-166`): `copyOwnership: 'app-owned-after-copy'` is a manifest-level annotation with
a single possible value; the only behavioral expression of it is `ui:update` reporting drift instead
of clobbering.

### F6 — Style aggregator assembly and the theme's privileged role (observed)

`packages/cli/src/kernel/application/ui/registry-styles.ts:8-38` (`writeStylesAggregator`):

1. Picks `input.items.find(item => item.kind === 'theme')`, falling back to the first theme item in
   the manifest; throws `Fresh UI registry manifest does not declare a theme item.` if none
   (lines 16-19).
2. Requires that theme to ship a file whose `target` ends in `styles.css`
   (`themeEntryStylesSource`, lines 65-71) — otherwise throws.
3. Collects each installed item's `css[].content`, keeping only entries starting with `@import `
   (lines 25-29).
4. Reads back previously-written per-item `@import` lines from the existing
   `<projectRoot>/assets/styles.css` and unions them, so incremental `ui:add` appends rather than
   regenerates (lines 30-35, rationale comment at lines 31-33;
   `readExistingPerItemImports` lines 46-62).
5. `composeStylesAggregator` (lines 81-101) emits the theme's leading `@import` block, then the
   literal marker `/* Per-item CSS - ui:init writes these @import lines. */`, then the unioned
   imports, then the theme body, then `/* App-specific custom styles below. */`.

So the aggregator's **parse contract is textual**: recovery of prior state depends on line-prefix
matching `@import ` and on set-differencing against the theme's own imports (lines 51-56).

### F7 — Theme substitution is the one built-in variation point (observed)

`resolveRegistryItems` (`registry.ts:216-259`) builds `byName` and `collections` maps, then does a
DFS over `registryDependencies` with cycle detection (`registry.ts:239-241`, error `Cycle detected in
Fresh UI registry dependencies at "<name>".`). When `--theme` is passed, `requireThemeItem`
(`registry.ts:354-363`) validates the named item exists *and* has `kind === 'theme'`, and then **any
item resolved whose `kind === 'theme'` is swapped for the override** (`registry.ts:236-237`, comment:
"Theme dependencies name the official theme; an override satisfies them instead"). Unknown names
throw `Unknown Fresh UI registry item or collection: <name>` (`registry.ts:234`).

Names are resolved collection-first: if the name matches a collection it expands, else it is treated
as an item (`registry.ts:249-256`). **A collection and an item may therefore share a name, and the
collection silently wins.**

### F8 — Token pipeline: DTCG → Style Dictionary v5 → three checked-in artifacts (observed)

Source of truth is DTCG JSON under `packages/fresh-ui/tokens/`:
`primitives.tokens.json`, `semantic.tokens.json`, `themes/light.tokens.json`,
`themes/dark.tokens.json` (directory listing; consumed at
`packages/fresh-ui/scripts/build-tokens.ts` where `loadDictionaryTokens({ include:
['tokens/primitives.tokens.json'], source: ['tokens/semantic.tokens.json'] })` is called).

The build imports `npm:style-dictionary@5.4.4` (`scripts/build-tokens.ts:1`), inits a dictionary with
a single `css` platform / `transformGroup: 'css'`, and keeps only tokens carrying
`$extensions.netscript.cssVar` (`tokenSourceCssVar`). Outputs, written explicitly:

- `registry/theme/tokens.css` — `:root { … }` (light) + `[data-theme='dark'] { … }` (dark overrides
  restricted to `LIGHT_GROUPS`), OKLCH values with hex fallback pairs (`tokenCssDeclarations`).
- `registry/theme/theme-bridge.css` — a Tailwind v4 `@theme inline { … }` block mapping `--ns-*` to
  `--color-ns-*` / `--spacing-ns-*` / `--radius-ns-*` / `--shadow-ns-*` (`renderThemeBridge`).
- `registry/theme/tokens.json` — `{ version: 1, generatedBy:
  'packages/fresh-ui/scripts/build-tokens.ts', tokens, themes: { dark } }` (`renderTokensJson`).

`registry/theme/styles.css` is **not** generated by this script (it is not written by
`build-tokens.ts`); it is the aggregator entry that the CLI consumes per F6.

Tasks (`packages/fresh-ui/deno.json`, `tasks`):
- `tokens:build` = `deno run … --allow-write=registry/theme --allow-net=registry.npmjs.org scripts/build-tokens.ts`
- `tokens:check` = `deno task tokens:build && git diff --exit-code registry/theme/tokens.css registry/theme/theme-bridge.css registry/theme/tokens.json`

The build is **layout-strict**: `renderBlock` throws `Missing token for --ns-<name>` for any name in
`ROOT_GROUPS`/`LIGHT_GROUPS` that has no token, and throws
`Token layout is missing --ns-<…>` for any token not claimed by a group. Adding a token therefore
requires editing the hardcoded `ROOT_GROUPS` array in the script.

### F9 — Documented theme authority chain (observed)

`.agents/skills/fresh-ui-horizontal/l0-conventions.md` states the layer table:

| Layer | Ownership | Import rule |
| --- | --- | --- |
| L0 | package | platform elements + Preact types only |
| L1 (runtime) | package | may import L0 |
| L2 (registry components) | consumer (copied) | may import L0/L1; **must not import another L2** |
| L3 (registry blocks) | consumer (copied) | may import L0–L2 |
| L4 (application) | consumer | anything |

`.agents/skills/fresh-ui-horizontal/theme-authoring.md` defines the theme contract: a theme must
assign **every** semantic slot ("The authoritative list is `registry/theme/tokens.json`"), ship both
a light and a dark block, own the primitive ramps (components must not read ramps directly except
under a `ds-allow-raw-color` / `ds-allow-color-utility` marker), and ship the Tailwind bridge. It
states themes must **not** rename/add/remove semantic slots ("vocabulary changes are package API
changes and go through the registry, not a theme") and must not style components directly. It also
records that NS One is generated, not hand-written, and that `registry/theme/` is "the **only** place
raw colors are allowed".

This is enforced mechanically by the DS fitness gates: `.llm/tools/fitness/check-ds-no-raw-hex.ts:3`
("DS fitness gate for @netscript/fresh-ui: no raw color literals"), with
`DEFAULT_PACKAGE_ROOT = 'packages/fresh-ui'` (line 19) and `EXCLUDED_SEGMENTS = ['registry/theme/',
'scripts/', 'docs/']` (line 22). Sibling gate `.llm/tools/fitness/check-ds-color-utilities.ts`;
shared test `.llm/tools/fitness/check-ds-gates_test.ts`.

So the authority chain is: `tokens/*.tokens.json` (DTCG, hand-authored)
→ `scripts/build-tokens.ts` + Style Dictionary 5.4.4
→ `registry/theme/{tokens.css,theme-bridge.css,tokens.json}` (generated, checked in, gated by
`tokens:check`)
→ `registry/theme/styles.css` (hand-authored aggregator entry)
→ `.llm/tools/generate-cli-assets-barrel.ts` → `registry.generated.ts`
→ `installUiRegistryItems` → `<app>/assets/*.css` (app-owned after copy).

### F10 — No plugin-facing registry contribution hook exists (observed)

`packages/plugin/src/protocol/manifest.ts` (the published `scaffold.plugin.json` contract,
`PLUGIN_MANIFEST_SCHEMA_VERSION = 1` at line 4) declares `PluginManifestCapabilities`
(`hasDatabaseMigrations`, `hasRoutes`, `hasBackgroundWorkers`, `supportsMcpScaffold?`, lines 17-26),
`PluginManifestScaffolder` (lines 29-35), `PluginManifestPostScript`, `PluginManifestProvider`,
`PluginManifestOfficialSource`, `PluginManifestLinking`. **None of these carry a UI, registry,
component, theme, or token field.** The closest is
`pluginType: 'background-processor' | 'api' | 'frontend' | 'utility'`
(`packages/plugin/src/protocol/manifest.ts:69`) — a routing/classification label only.

A repo-wide grep for registry-authoring symbols
(`rtk grep -rln "registry.manifest\|RegistryItemDefinition\|copyOwnership" plugins packages
--include=*.ts`) returns **zero files under `plugins/`**; the only hits are
`packages/fresh-ui/{registry.manifest.ts,registry.schema.ts,registry.ts,registry.generated.ts}`,
`packages/cli/src/kernel/application/ui/{registry.ts,registry-styles.ts}`,
`packages/cli/src/public/features/ui/registry.test.ts`,
`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts`
(unrelated — plugin runtime registry), and `packages/cli/src/kernel/assets/embedded.generated.ts`.

**Nearest seam (inference, from F5 + F7):** `--registry-root <path>`. `loadRegistryManifest`
(`registry.ts:203-210`) dynamic-imports `toFileUrl(join(registryRoot, 'registry.manifest.ts')).href`
(`registryManifestModuleUrl`, lines 212-214) and requires the module to export
`freshUiRegistryManifest`. When that flag is present the CLI reads files off disk instead of the
embed (`registry.ts:90`, `registry.ts:100-102`). That gives a *replacement* registry with an
identical shape — not composition. To support contribution you would need, minimally: (a) manifest
merge instead of replacement, (b) a provenance/namespace field on `RegistryItemDefinition` (none
exists — `author` is free-form prose, `registry.schema.ts:36`), (c) collision policy (see F11), and
(d) a file-content source per contributor, since `FRESH_UI_REGISTRY_CONTENT` is generated in *this*
repo from *this* manifest (F3).

### F11 — Collision behavior today: silent last-wins, at three different layers (observed + inference)

No uniqueness validation exists. Searching the manifest/CLI test suites for duplicate checks
(`rtk grep -rn "duplicate\|Duplicate" packages/fresh-ui/tests packages/cli/src/kernel/application/ui
packages/cli/src/public/features/ui`) returns only unrelated hits
(`packages/fresh-ui/tests/registry/components/ui/prompt-input.test.tsx:84`,
`packages/fresh-ui/tests/registry/islands/mcp-ui-widget.test.tsx:70`,
`packages/cli/src/kernel/application/ui/registry-styles.test.ts:164`,
`registry-styles.ts:44`). The lifecycle/resolution tests
(`registry-lifecycle_test.ts:28,38,46,56,67`; `registry.test.ts:42,49,56,63,75,87,97,103`) cover
theme override, cycles, embed usage, and dependency pruning — none covers a name collision.

Three distinct last-wins behaviors:

1. **Item name collision.** `const byName = new Map(manifest.items.map((item) => [item.name, item]))`
   (`registry.ts:221`). Two items with the same `name` → the *later* array entry silently shadows the
   earlier one. Same for collections (`registry.ts:222-225`). *(inference from that line: `Map`
   construction from an entry array is last-wins; no diagnostic is emitted.)*
2. **Item vs. collection name collision.** `resolveRegistryItems` checks `collections.get(name)`
   first (`registry.ts:250-253`); a same-named item becomes unreachable by direct request.
3. **Distinct items writing the same target file.** `planFiles` de-duplicates on the normalized
   **source** path, not the target: `files.set(normalize(source), { source, target })`
   (`registry.ts:271`). Two items with different sources and identical targets both survive planning,
   and the write loop (`registry.ts:96-108`) writes them in order — **last write wins on disk**, with
   no warning. If `--force` is absent, the *first* write wins instead, because the second is skipped
   by the `exists` guard (`registry.ts:97-99`). So collision resolution flips with `--force`.

Additionally, **`ui:add` collides its own namespaces**: `kind` is both the scaffold selector and the
registry item name (`add-ui-command.ts:57,63,69`). A registry item literally named `page` or `island`
would be unreachable. No such item exists today (grep for `name: 'page'` / `name: 'island'` in
`registry.manifest.ts` → 0 matches), so this is latent, not live.

**Also unenforced:** `ui:remove` prunes `deno.json` imports keyed on `importEntryForDependency(...)`
key equality (`registry.ts:189-197`), so two contributors depending on the same npm package under
different version ranges would produce an import key whose value only matches one of them — the
`config.imports?.[entry.key] === entry.value` guard (`registry.ts:196`) then silently declines to
prune. *(inference from those lines; not exercised by a test.)*

### F12 — `tools/design-sync` is a second consumer of the manifest (observed)

`tools/design-sync/src/registry-source.ts:2-9` documents a `RegistrySource` port that "joins the
typed registry manifest with the actual file contents", imports `registry.manifest.ts` directly, and
explicitly "never parses the 290KB `registry.generated.ts` embed". It strips the leading `registry/`
segment to derive synthetic-package paths (`toPkgPath`, lines 29-31) and reads sources from
`${cfg.repoRoot}/${cfg.registry.root}` (lines 61-62, 82-84). Config validation
(`tools/design-sync/src/config.ts:70-71`) requires `registry.root` + `registry.manifest` and rejects
any `shape` other than `'package'` (line 69). The entry task is `design:sync` at `deno.json:80`
(`deno run --no-lock … tools/design-sync/mod.ts`).

This is the **second independent reader of the manifest**, and it is repo-internal tooling, not a
published package.

---

## Contracts

| Name | Shape | Evidence |
| --- | --- | --- |
| `RegistryManifest` | `{ name; version; packageName; homepage?; model:'copy-based-registry'; schemaVersion?:2; tokenSourceStrategy:'style-dictionary-dtcg-source'; items:RegistryItemDefinition[]; collections:RegistryCollectionDefinition[] }` | `packages/fresh-ui/registry.schema.ts:50-63` |
| `RegistryItemDefinition` | `{ name; kind:RegistryItemKind; layer?:2\|3; title?; description; author?; copyOwnership:'app-owned-after-copy'; tags:string[]; files:{source;target}[]; registryDependencies?; dependencies?; css?; cssVars?; docs?; categories?; meta? }` | `packages/fresh-ui/registry.schema.ts:29-47` |
| `RegistryItemKind` | `'theme'\|'style'\|'component'\|'island'\|'block'\|'lib'\|'hook'\|'support'` | `packages/fresh-ui/registry.schema.ts:1-9` |
| `FreshUiRegistryManifest` (published) | `{ readonly items: FreshUiRegistryItem[]; readonly collections: FreshUiRegistryCollection[] }` — narrower than the schema | `packages/fresh-ui/registry.ts:51-57`; `deno doc --no-lock registry.ts` |
| `FRESH_UI_REGISTRY_CONTENT` | `Record<string,string>` keyed by manifest `file.source` (POSIX-normalized) | `packages/fresh-ui/registry.generated.ts:234`; lookup `packages/cli/src/kernel/application/ui/registry.ts:338-347` |
| `installUiRegistryItems` | `(input:{projectRoot;registryRoot?;names:string[];overwrite:boolean;theme?}, deps:{fs:FileSystemPort}) => Promise<{installedItems;copiedFiles;stylesPath;denoJsonPath;dependenciesMerged}>` | `packages/cli/src/kernel/application/ui/registry.ts:42-57,81-127` |
| `resolveRegistryItems` | `(manifest, names, theme?) => readonly UiRegistryItem[]` — collection-first, DFS over `registryDependencies`, cycle-detecting | `packages/cli/src/kernel/application/ui/registry.ts:216-259` |
| `loadRegistryManifest` | `(registryRoot) => Promise<UiRegistryManifest>` — dynamic `import()` of `<root>/registry.manifest.ts`, requires named export `freshUiRegistryManifest` | `packages/cli/src/kernel/application/ui/registry.ts:203-214` |
| Target alias table | `@ui/→components/ui/`, `@islands/→islands/ui/`, `@assets/→assets/`, `@lib/→lib/`, `~/→<root>` | `packages/cli/src/kernel/application/ui/registry.ts:67-73,277-284` |
| `DEFAULT_UI_INIT_ITEMS` | `['foundation','floating-styles','control-props']` | `packages/cli/src/kernel/application/ui/registry.ts:75-79` |
| CLI commands | `ui:init`, `ui:add <kind> [name]`, `ui:list`, `ui:update`, `ui:remove` | `packages/cli/src/public/features/root/public-command-tree.ts:91-110` |
| `writeStylesAggregator` | `({registryRoot?;registryContent?;projectRoot;manifest;items;fs}) => Promise<string>` — writes `<root>/assets/styles.css` | `packages/cli/src/kernel/application/ui/registry-styles.ts:8-38` |
| Token build | `deno task tokens:build` → `registry/theme/{tokens.css,theme-bridge.css,tokens.json}`; drift gate `tokens:check` | `packages/fresh-ui/deno.json` tasks; `packages/fresh-ui/scripts/build-tokens.ts` |
| Embed regen | `deno task gen:assets-barrel`; drift gate `deno task check:assets-barrel` | `deno.json:109`; `.llm/tools/generate-cli-assets-barrel.ts:28,176-201` |
| `PluginInstallerManifest` | schemaVersion 1; capabilities/scaffolder/postScript/provider/officialSource/linking — **no UI or registry field** | `packages/plugin/src/protocol/manifest.ts:4,17-140` |

---

## Drift candidates

### D1 — `netscript ui:design-sync` is referenced but does not exist (significant)

- **Expected:** `tools/design-sync/src/registry-source.ts:9` names "the `netscript ui:design-sync`
  promotion path" as a real CLI path.
- **Actual:** no such command exists. `rtk grep -rn "design-sync" packages/cli/src` returns 0
  matches; the command tree registers only the five `ui:*` ids
  (`packages/cli/src/public/features/root/public-command-tree.ts:91-110`). The only entry point is
  the repo-internal task `design:sync` (`deno.json:80`).
- **Bearing:** if the RFC assumes a promotion path from an app's copied registry back into the
  package, that path is a doc-comment, not code.

### D2 — Manifest `version` and package version have diverged (minor)

- **Expected:** a registry that ships inside a versioned package would normally track it, and
  `registry.manifest.ts:2` deliberately imports `FRESH_UI_PACKAGE_VERSION`.
- **Actual:** `registry.manifest.ts:9` pins `version: '0.1.0'` while `packages/fresh-ui/deno.json:3`
  is `"version": "0.0.5"`. The imported `FRESH_UI_PACKAGE_VERSION` is not used for the manifest
  `version` field.
- **Bearing:** any contribution scheme keyed on registry version needs a decided source of truth.

### D3 — `resolveTarget` accepts absolute targets and escaping relatives (significant)

- **Expected (from the alias table's framing, `registry.ts:67-73`):** every copied file lands inside
  the app workspace.
- **Actual:** `resolveTarget` returns `isAbsolute(target) ? target : resolve(projectRoot, target)`
  (`registry.ts:283`) — an item whose `target` is `/etc/x` or `../../x` writes outside the project
  root. There is no containment assertion anywhere in `installUiRegistryItems`.
- **Bearing:** with only a first-party manifest this is inert; the moment a third party can
  contribute items, it is an arbitrary-write primitive. This is the single most load-bearing
  security finding for the RFC.

### D4 — The registry-item count in the published doc-comment is hand-maintained (minor)

- **Expected:** "The registry contains 66 items total" (`packages/fresh-ui/registry.ts:64`) matches
  the manifest.
- **Actual:** unverified — I counted 74 `name:` keys in `registry.manifest.ts`
  (`rtk grep -c "      name: '"`), which includes both items and collections, so 66 items + 8
  collections is *consistent* but not proven by that count. The doc-comment is prose in
  `registry.ts`, with no generator marker and no gate asserting it against
  `freshUiRegistryManifest.items.length`.
- **Bearing:** a contribution scheme that changes item counts will silently rot this doc surface.

---

## Open questions

1. Is `--registry-root` intended as a supported public extension seam or as a dev/test affordance
   only? `packages/cli/src/public/features/ui/registry.test.ts:87` exercises
   `registryManifestModuleUrl` "outside the copy payload", which reads like test plumbing; the flag's
   help text is `"Fresh UI package root override"` (`add-ui-command.ts:38`). Unverified — would need
   the owner's intent or a doctrine statement.
2. What executes `deno task gen:assets-barrel` in CI, and is `check:assets-barrel` wired to a
   workflow? I did not inspect `.github/workflows`.
3. Does `registry/theme/styles.css` have any generator, or is it purely hand-authored?
   `build-tokens.ts` writes only `tokens.css`, `theme-bridge.css`, `tokens.json`. Would be verified
   by grepping for writers of `registry/theme/styles.css`.
4. What is the intended provenance/namespace model for a contributed item name — prefix (`ai:card`),
   scoped (`@acme/card`), or flat with a collision error? Nothing in the schema anticipates it
   (`registry.schema.ts:29-47` has only free-form `author`).
5. How would `FRESH_UI_REGISTRY_CONTENT` be sourced for a third-party contributor, given the embed is
   generated in *this* repo from *this* manifest (F3)? Either contributors ship their own embed
   (needing a merge protocol) or the CLI gains a runtime file-read path (needing permissions).
6. Does the `ui:update` drift-report path degrade for contributed items whose upstream content
   changed independently of the `@netscript/fresh-ui` version? Unverified — no versioning is recorded
   per copied file today.
7. Are the DS fitness gates (`check-ds-no-raw-hex.ts`, `check-ds-color-utilities.ts`) wired into any
   `deno task`? `rtk grep -rn "check-ds" deno.json .github/workflows tools` returned no matches,
   which suggests they are invoked directly or by the harness. Would be verified by grepping
   `.llm/` and `.agents/` for their filenames.
8. `ui:add` takes exactly one item name (`names: [kind]`, `add-ui-command.ts:71`). Is multi-item add
   intentionally excluded, and does that constrain a contribution UX?

---

## Sources

All repo-relative to `/home/codex/repos/ns-rfc-devtools-contribution`, read at
`d5852188b41c3bd2c7c2a52da61dcc3dc9aa43e1`.

**Read directly**
- `packages/fresh-ui/deno.json`
- `packages/fresh-ui/registry.schema.ts` (64 lines, full)
- `packages/fresh-ui/registry.ts` (77 lines, full)
- `packages/fresh-ui/registry.manifest.ts` (1511 lines — head 1-40, `theme-seed`/`layout-objects`/
  `button` region, tail 40)
- `packages/fresh-ui/registry.generated.ts` (351 lines — head 20; `FRESH_UI_REGISTRY_CONTENT` at 234)
- `packages/fresh-ui/scripts/build-tokens.ts` (full)
- `packages/cli/src/kernel/application/ui/registry.ts` (363 lines, full)
- `packages/cli/src/kernel/application/ui/registry-styles.ts` (102 lines, full)
- `packages/cli/src/public/features/ui/registry.ts` (1 line)
- `packages/cli/src/public/features/ui/add/add-ui-command.ts` (full)
- `packages/cli/src/public/features/ui/init/init-ui-command.ts` (full)
- `packages/cli/src/public/features/root/public-command-tree.ts:80-125`
- `packages/plugin/src/protocol/manifest.ts:1-140`
- `.llm/tools/generate-cli-assets-barrel.ts:160-210` (+ grep of fresh-ui references)
- `.llm/tools/generate-publish-assets.ts:20-70`
- `.llm/tools/fitness/check-ds-no-raw-hex.ts` (grep: lines 3, 9, 19, 22, 31, 100)
- `tools/design-sync/src/registry-source.ts` (grep), `tools/design-sync/src/config.ts:1-80`
- `.agents/skills/fresh-ui-horizontal/l0-conventions.md:1-60`
- `.agents/skills/fresh-ui-horizontal/theme-authoring.md` (full)
- `deno.json:80`, `deno.json:109`

**Commands run**
- `cd packages/fresh-ui && deno doc --no-lock registry.ts` — public surface of
  `@netscript/fresh-ui/registry` (F2)
- `rtk grep -rln "registry.manifest\|RegistryItemDefinition\|copyOwnership" plugins packages --include=*.ts` (F10)
- `rtk grep -rn "design-sync" packages/cli/src tools/design-sync/deno.json deno.json` (D1)
- `rtk grep -rn "duplicate\|Duplicate" packages/fresh-ui/tests packages/cli/src/kernel/application/ui packages/cli/src/public/features/ui` (F11)
- `rtk grep -rn "registry.generated.ts" --include=*.ts --include=*.json --include=*.yml .` (F3)
- `rtk grep -n "^      name: 'page'\|^      name: 'island'" packages/fresh-ui/registry.manifest.ts` → 0 (F11)
- `rtk grep -c "      name: '" packages/fresh-ui/registry.manifest.ts` → 74 (D4)
- `git rev-parse HEAD` → `d5852188b41c3bd2c7c2a52da61dcc3dc9aa43e1`

**No external URLs were fetched for this topic**; no files were saved under `research/sources/`.
