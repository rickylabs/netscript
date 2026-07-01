# Research — fix-cli-jsr-asset-embedding--asset-embed

## Re-baseline

- Carried-in source: prior-session inventory of "11 asset-read sites" (pre-alpha.4).
- Re-derived against `main` @ `98b087ef` (alpha.4), worktree
  `C:\Dev\repos\netscript-framework\.claude\worktrees\cli-asset-embed`, branch
  `fix/cli-jsr-asset-embedding`.
- What changed vs the carried-in version:
  - Scope dropped from 11 → **7 bucket-A sites** after PR #127 (Deno 2.9 + fetch-based hydrate)
    and the editor-config import-attribute precedent landed.
  - The central reader (`readTemplateAsset` / `TemplateRegistry.#hydrate`) is now **fetch-based**
    (PR #127), so sites #2–#6 may *function* over https today. They are NOT removed from scope:
    the user directive is **one unified strategy (import attributes), no fetch anywhere** —
    deterministic, in-graph, offline, no network at scaffold time.
  - Confirmed hard *crashes* (not merely fetch-dependent) are **site #1** (plugin
    `import.meta.resolve` + fs walk → the `--help` crash) and **site #7** (fresh-ui directory walk
    + `fs.readFile` of every component).

## The core problem (grounded)

`Deno.readTextFile(Sync)` / `fromFileUrl` accept only `file:` URLs; `import.meta.resolve('@netscript/plugin')`
on a type-only root throws `Import "…" not a dependency`. Locally `import.meta.url` is `file://`;
from JSR it is `https://jsr.io/@scope/pkg/<version>/…`. Any asset access derived from
`import.meta.url` + a filesystem read therefore works locally and **breaks over JSR**.

`with { type: "text" }` / `with { type: "json" }` makes the asset a real module-graph edge: JSR
bundles it AND it loads identically over `file:`/`https:`. **Verified stable in Deno 2.8.3 AND 2.9.0
with NO `--unstable-raw-imports` flag** (local http-server spike: `REMOTE-TEXT-OK`, `REMOTE-JSON-OK`,
`import.meta.url = http://localhost:8123/…`, old read `Must be a file URL`).

## The duplication / doctrine problem (grounded)

The repo already has the correct hexagonal seam, but scaffolders **bypass it**:

- Port: `kernel/abstracts/manifest.ts` — `Manifest<K,V>`.
- Adapter: `kernel/application/registries/template-registry.ts` — `TemplateRegistry extends Manifest`.
- Read API: `kernel/adapters/templates/template-asset.ts` — `readTemplateAsset(URL | TemplateKey)`.

The `URL` overload (`template-asset.ts:25` → `fetch(template)`) is the escape hatch every scaffolder
uses to hand-build `new URL('…', import.meta.url)` and read its own way, instead of declaring a
`TemplateKey` and going through the registry. That overload is the single root of both the JSR break
and the call-site duplication.

## Findings

| #  | Finding | How to verify |
| -- | ------- | ------------- |
| 1  | `TemplateValue` carries `path`, `url`, optional `content`; registry seeds `url = new URL(path, ASSET_ROOT_URL)`, `ASSET_ROOT_URL = new URL('../../assets/', import.meta.url)` | `template-registry.ts:4-10,24-27` |
| 2  | `#hydrate()` does `fetch(value.url)` per entry (130+) — the mechanism to remove | `template-registry.ts:60-66` |
| 3  | `readTemplateAsset` has a `URL` overload → `fetch(template)`; the `TemplateKey` path goes through `hydrate()`+registry content | `template-asset.ts:17-27` |
| 4  | `readTemplateAssetSync` throws unless hydrated; `renderTemplateAssetSync(key, vars)` is the interpolating render entry | `template-asset.ts:30-47` |
| 5  | **Precedent**: editor-config embeds JSON via `import … with { type: 'json' }` and emits `{path, content}` — exact target pattern | `editor-config.ts:9,26-31` |
| 6  | **Site #1 (HARD CRASH, eager)**: `pluginTemplateRoot = fromFileUrl(new URL('./src/templates/skeleton/', import.meta.resolve('@netscript/plugin')))` runs at command-deps build → feeds `templateRoot` → fs reads | `public-command-dependencies.ts:177-179` |
| 7  | **Site #7 (HARD CRASH, architectural)**: `defaultFreshUiRegistryRoot()` = `fromFileUrl(new URL('../../../../../fresh-ui/', import.meta.url))`; `installUiRegistryItems` then `loadRegistryManifest(root)` + `fs.readFile(file.source)` per component | `ui/registry.ts:86-88,94-111` |
| 8  | `@netscript/plugin` already exports `./templates` and ships `src/templates/**/*.template` (publish.include) — so embedded content has a clean home | `packages/plugin/deno.json:14,30-37` |
| 9  | Plugin skeleton = 13 enumerated `*.template` files; the path list already lives as a typed const | `packages/plugin/src/kernel/assets/template-registry.ts:8-39` |
| 10 | `TEMPLATE_KEYS` enumerates every CLI template path as static literals (130+) → a barrel generator can map key→import deterministically | `kernel/assets/manifest.ts:2-45+` |
| 11 | Import specifiers for attributes MUST be static string literals (no dynamic path) → the embedded barrel must be **generated**, not dynamic | Deno/ESM spec; matches editor-config static import |

## jsr-audit surface scan (package waves)

- Surface scanned: `@netscript/cli` (kernel asset layer), `@netscript/plugin` (`./templates`),
  `@netscript/fresh-ui` (registry export).
- Slow-type / surface risks: adding a `Record<string,string>` embedded export to `@netscript/plugin`
  and `@netscript/fresh-ui` must keep `deno doc --lint` clean (no private-type refs); fresh-ui's new
  registry export must lint across its full export map, not mod.ts alone (see
  [[jsr-doc-lint-full-export-set]]).
- The generated barrel (130+ `with {type:'text'}` imports) must pass `publish:dry-run` and ship in
  `publish.include`.

## Open questions (closed in plan)

- 130+ barrel: hand-author vs generated + check-diff gate → **generated** (finding #11 forces it).
- fresh-ui (#7): how to embed a whole component tree behind one export → embedded `Record` +
  manifest, CLI consumes content not paths (own commit; largest unit).
- Keep the `URL` overload for any legitimate remote case? → **No.** One way in (TemplateKey).
  Removing it is what forces every scaffolder onto the port.
