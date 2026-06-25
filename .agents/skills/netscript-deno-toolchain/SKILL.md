---
name: netscript-deno-toolchain
description: The Deno 2.9 native dependency, release, and inspection toolchain (deno outdated/update/why/info/add/remove/audit/ci/bump-version/publish/pack/doc, catalogs, isolatedDeclarations, task dependencies + input caching). Use BEFORE hand-rolling dependency bumps, version checks, registry curls, publish scripting, or doc generation in the NetScript workspace — these built-ins replace most ad hoc tooling and the per-dep curl loops that burn tokens. Pairs with the .llm/tools/deps toolbelt and the netscript-tools skill.
---

# NetScript Deno Toolchain (2.9)

Deno 2.9.x ships a full first-class dependency + release toolchain. **Prefer it over reinventing.**
This skill is the command map; the repo wraps the noisy ones in `.llm/tools/deps/` (structured
JSON). Use the wrappers for agent decisions, the raw commands for one-off interactive work.

Repo is on **Deno 2.9.0** (Windows + WSL). Targeted `deno check` must pass `--unstable-kv`.

## The one trap that matters

`deno outdated --latest` **ignores semver AND surfaces pre-release tags as "latest."** It once
reported `@fedify/fedify 2.3.0-dev.*` as latest while the real stable was `2.2.5`, and a dependency
audit then defended an outdated pin. **For "is this the latest stable" always use
`deno task deps:latest`** (registry stable channel: jsr `meta.json.latest` / npm
`dist-tags.latest`, pre-release filtered). Never trust `--latest` alone.

## Dependency commands

| Command | Use | Repo wrapper |
| ------- | --- | ------------ |
| `deno outdated [--recursive] [--latest]` | inventory of outdated deps (lock-aware, transitive) | `deno task deps:outdated` (→ JSON, flags prerelease rows) |
| _registry stable check_ | the authority for "latest stable" | `deno task deps:latest` (`--behind-only`, `--filter`, `--fail-behind`) |
| `deno why <pkg>` | why a package is in the graph (provenance) | `deno task deps:why <pkg>` (+ source-usage grep → dead-import flag) |
| `deno info [<module>] [--json]` | resolved module graph / cache paths | — |
| `deno update [<pkg>] [--latest]` | rewrite specifiers to newer versions | prefer manual catalog edits for review; see Catalogs |
| `deno add npm:<pkg>` / `deno add jsr:<pkg>` | add a dependency + update imports | — |
| `deno remove <pkg>` | drop a dependency from imports | — |
| `deno audit [--level critical\|high\|moderate\|low]` | advisory DB scan of the graph | `deno task deps:audit` / `deno task audit:critical` |

Dead-import sweep: `deps:why <pkg>` → `fullyRemovable: true` (no source usage + not in graph) means
the import-map entry is safe to delete.

## Install / CI commands

| Command | Use |
| ------- | --- |
| `deno ci` | frozen install of the full graph (fails if lock would change) — the quality lane (`check`/`lint` need dev deps) |
| `deno ci --prod [--frozen] [--skip-types]` | frozen install of the **production** surface only — proves the *published* surface installs without dev deps. Additive, not a replacement. `deno task deps:prod-install` |

Never pass a reload flag (`--reload` / `deno cache --reload`) or delete lock files without approval.

## Catalogs (2.9; member resolution needs ≥ 2.8.3)

- A root `deno.json` `catalog` block centralizes versions; members reference `"<pkg>": "catalog:"`.
- **`catalog:` is npm-only.** `npm:<pkg>@catalog:` works; bare `"<pkg>": "catalog:"` works for npm.
- **JSR deps cannot use catalog.** `jsr:pkg@catalog:` is rejected (`Invalid package specifier`) and a
  `jsr:`-valued catalog entry warns `Invalid version requirement`. Keep JSR deps as inline `jsr:`
  specifiers with explicit ranges. (Verified on 2.8.3 and re-verified on 2.9.0 — this is a Deno
  constraint, not repo choice.)
- Catalog values are bare version requirements (e.g. `"^10.29.2"`), not full specifiers.
- `publish:dry-run` materializes `catalog:` → `npm:<pkg>@<version>` per member before dry-run; mirror
  that when reasoning about what consumers receive.

## Release commands

| Command | Use |
| ------- | --- |
| `deno bump-version [--prerelease <tag>]` | bump workspace member versions (alpha/beta prerelease channel) |
| `deno publish [--dry-run] [--allow-dirty] [--allow-slow-types]` | publish to JSR; auto-rewrites workspace specifiers. Repo uses `deno task publish:dry-run` (per-member, catalog-materialized) |
| `deno pack` | produce the publishable tarball for inspection |

Four packages are approved `--allow-slow-types` carve-outs (contracts, plugin-triggers-core, service,
plugin); everything else must satisfy `isolatedDeclarations`. Prefer fixing slow types over carve-outs.

## Inspection commands

| Command | Use |
| ------- | --- |
| `deno doc <module>` | **your friend** — read a package's public API without opening source. Use before implementation reads for `@netscript/*` packages. |
| `deno doc --filter <symbol> <module>` | jump straight to one symbol's signature/docs |
| `deno doc --lint <module>` | enforce documented public surface (publishability gate) |

`deno doc` / `deno doc --filter` are the cheapest way to learn an internal package API — far cheaper
than reading the whole module. Reach for them first.

## TypeScript surface (2.9)

- `isolatedDeclarations: true` is on workspace-wide — annotate explicit return/declaration types on
  exported symbols; this is what makes fast `deno publish` type-checking and `deno doc` reliable.
- `lib.node` is default-on in 2.9; `--unstable-kv` still required for KV-touching `deno check`.

## Task runner (2.9)

Deno 2.9 makes two `deno task` features first-class; the repo uses both in root `deno.json`:

- **Dependency tasks** — a task with `{ "dependencies": [...] }` runs its named tasks concurrently
  (capped at CPU count; `--jobs N` / `-j` / `DENO_JOBS` / `1` = sequential) and exits nonzero if any
  dependency fails. `ci:quality` uses this (`check`, `lint`, `fmt:check`, `deps:check`), replacing
  the former hand-rolled `Promise.all` runner.
- **Input-based caching** — object-form `{ "command": "...", "files": [...], "output": [...] }`
  (both are arrays, not `{include}` maps). An unchanged `files` set SKIPs (`cached, inputs
  unchanged`); an edited/added input — or a previously **failed** run — always re-runs, so a stale
  or failing result is never masked. `check`/`lint`/`fmt:check` declare `files`; the win is the
  local dev loop (CI runners start cold, so they always run).

## When to use which

1. "What's the latest stable of X?" → `deno task deps:latest` (never `outdated --latest`).
2. "What's behind across the workspace?" → `deps:latest --behind-only` + `deps:outdated` (transitive).
3. "Is this import dead?" → `deps:why <pkg>`.
4. "Does the published surface install?" → `deps:prod-install`.
5. "What does this package export?" → `deno doc <module>` / `--filter`.
6. "Any advisories?" → `deps:audit --level critical`.

For repo-native validation wrappers, gate evidence, and git ground-truth, see the **netscript-tools**
skill. For the toolbelt source, see `.llm/tools/entry.md` § Dependency toolbelt.
