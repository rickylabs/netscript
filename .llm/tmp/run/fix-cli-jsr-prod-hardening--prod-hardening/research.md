# Research — CLI JSR production hardening

Run-id: `fix-cli-jsr-prod-hardening--prod-hardening`
Branch: `fix/cli-jsr-prod-hardening` (off `main` @ c0020a1b, includes #126)
Archetype: ARCHETYPE-? (CLI app package — `@netscript/cli`), SCOPE: service/tooling.

## Problem (empirically confirmed 2026-06-25)

A prod smoke test of the **published** `@netscript/cli@0.0.1-alpha.2` (pulled from JSR, not
local source) found the CLI is **unusable from JSR**. Two production-only blockers, both invisible
to the existing maintainer/local e2e (`scaffold.runtime`), which loads modules from `file://`
paths where the broken reads succeed.

### Evidence

`deno run -A jsr:@netscript/cli@0.0.1-alpha.2 --help` →
```
error: Uncaught (in promise) TypeError: Must be a file URL
  const DENO_CONFIG_SCHEMA_CONTENT = Deno.readTextFileSync(DENO_CONFIG_SCHEMA_SOURCE);
    at pathFromURL (ext:deno_web/00_infra.js:446:13)
    at Object.readTextFileSync (ext:deno_fs/30_fs.js:842:36)
    at https://jsr.io/@netscript/cli/0.0.1-alpha.2/src/kernel/adapters/scaffold/editor-config.ts:16:41
```
`deno run -A jsr:@netscript/cli@0.0.1-alpha.2/bin/netscript.ts --help` →
```
error: Unknown export './bin/netscript.ts' for '@netscript/cli@0.0.1-alpha.2'.
  Package exports:  * .  * ./scaffolding  * ./testing
```

## Root cause — CLI-PROD-01: asset reads via `import.meta.url` break over https

`Deno.readTextFile(url)` / `Deno.readTextFileSync(url)` accept only `file:` URLs. When a module is
served from `https://jsr.io/...`, `import.meta.url` is an https URL, so any
`new URL('../relative/asset', import.meta.url)` resolves to an https URL and the read throws
`TypeError: Must be a file URL`.

Confirmed sites in `packages/cli/src` (all read package-shipped assets relative to the module):

| File:line | Scope | Asset | Impact |
| --- | --- | --- | --- |
| `kernel/adapters/scaffold/editor-config.ts:16` | **module top-level** | `assets/schema/config-file.v1.json` | crashes on *import* → kills bin AND `createPublicCli()` |
| `kernel/application/registries/template-registry.ts:10,25` | constant + per-asset URL | `src/kernel/assets/**` (`ASSET_ROOT_URL = new URL('../../assets/', import.meta.url)`) | core scaffold template loader |
| `kernel/adapters/templates/template-asset.ts:14-28` | `readTemplateAsset`/`readTemplateAssetSync`/`renderTemplateAssetSync` | consumes registry `.url` via `Deno.readTextFile(url)` | every scaffold template read |
| `kernel/adapters/contracts/templates/generate-v1-mod.ts:34,64` | function-scoped | contract v1 mod templates | contract scaffold path |
| `kernel/adapters/contracts/templates/contract-template-registry.ts:26,31` | function-scoped | contract/contracts-mod templates | contract scaffold path |

**Assets ARE shipped** — `packages/cli/deno.json` `publish.include` has `assets/schema/**/*.json`,
`src/**/*.ts`, `src/**/*.template`. The defect is the *read mechanism*, not missing files.

Reads that are NOT affected (read from the generated/target project on local disk, correct as-is):
`maintainer/adapters/*` (packages-copier, plugin-import-rewriter, official-plugin-source,
plugin-file-collector), `public/features/deploy/*`, `kernel/adapters/{windows,config,deploy}/*`,
`kernel/adapters/runtime/file-system/deno-file-system.ts`. These take runtime paths to the user's
project, not package-relative `import.meta.url` assets.

## Root cause — CLI-PROD-02: no runnable bin export

Published `exports`: `.`, `./scaffolding`, `./testing`. `bin/netscript.ts` is shipped
(`publish.include`) but not exported, so `deno run jsr:@netscript/cli/bin/netscript.ts` → "Unknown
export". Public users have no command entry from JSR. The dx-bin slice (task #110) addresses this
but is NOT in alpha.2 (predates the publish or was on an unmerged branch).

## Why local e2e missed both — CLI-PROD-E2E gap

The `scaffold.runtime` e2e suite runs maintainer/local mode (`importMode:'local'`, `file://`
modules). It has a `packageSource` axis (`auto|starter|local`, default `local`) that is never wired
into the scaffold init gate, and public init hardcodes `importMode:'jsr'` while maintainer init
hardcodes `'local'`. So the suite never loads a module over https and structurally cannot catch
CLI-PROD-01/02. (Memories: [[cli-jsr-asset-read-prod-blocker]], [[cli-prod-e2e-mode-missing]].)

## Fix-pattern candidates (to be locked in plan + PLAN-EVAL)

Deno portability rule: a package consumed over https cannot read its own shipped files with
`Deno.readTextFile(import.meta.url-relative URL)`. Options:

1. **Import assets as modules** (most robust — assets join the module graph, cached/bundled with the
   package, no network at scaffold time, works file:+https:):
   - JSON: `import schema from '../../assets/schema/config-file.v1.json' with { type: 'json' }`.
   - `.template` text: Deno has no text-import. Convert each `.template` to a `.ts` module exporting
     the string (codegen at build, or hand-author), or keep `.template` and load via option 2.
2. **`fetch(url).then(r => r.text())`** — works for both `file:` and `https:` URLs. Minimal change
   (swap `Deno.readTextFile` → `fetch`), but: makes sync reads async (editor-config top-level + the
   `*Sync` variants must become lazy/async), and fetched https files are NOT in Deno's module cache
   (re-downloaded per run; relies on HTTP cache). Acceptable but less clean than (1).
3. **Hybrid**: JSON schema via type-json import (1); `.template` files via `fetch`
   (`import.meta.resolve`) (2). Pragmatic if converting all templates to TS is too large.

Recommended: (1) for JSON (small, finite set), and for `.template` either convert to TS string
modules (best) or (2) fetch. The plan must enumerate every `.template` consumed and pick one
mechanism so behavior is uniform. De-top-level `editor-config.ts` regardless (no module-load side
effects).

## CLI-PROD-02 fix

Add a runnable bin entry that JSR can execute. Land the dx-bin slice (#110) approach: export the
bin (e.g. add `"./bin": "./bin/netscript.ts"` to exports, or a documented
`deno run -A jsr:@netscript/cli` path if `mod.ts` is made runnable). Confirm `deno install` and
`deno run jsr:@netscript/cli...` both resolve a command.

## Verification bar (acceptance — becomes the prod-e2e Action)

Against the *republished* CLI (alpha.3) pulled from JSR:
1. `deno run -A jsr:@netscript/cli@<v> init <proj>` scaffolds with no "Must be a file URL".
2. Full runtime smoke (user-specified): aspire restore → add plugins (workers, sagas, triggers,
   streams) → db init → generate → seed → aspire start → health-check endpoints (Aspire MCP + CLI)
   → verify traces.
3. Separate-agent run: the 4 website doc tutorials end-to-end, all green.
4. New GitHub Action `on: release: published` runs (1)+(2) in production/public mode (scaffold from
   published JSR) and notifies on failure. CI PR validation stays maintainer mode.

## Doctrine / process

Framework SOURCE changes (`packages/cli/src/**`, exports, e2e `packageSource` wiring) =
WSL Codex daemon-attached slice, harness-gated. Supervisor authors run artifacts + the
`.github/workflows` Action glue only. PLAN-EVAL (OpenHands minimax-M3) before any implementation.
