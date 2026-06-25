# Plan — CLI JSR production hardening

Run-id: `fix-cli-jsr-prod-hardening--prod-hardening` · Branch: `fix/cli-jsr-prod-hardening`
Archetype: A6 CLI application package (`@netscript/cli`). Overlay: SCOPE-service/tooling.
Grounding: see `research.md` (empirically confirmed against published alpha.2).

> **Revision history.** Cycle-1 PLAN-EVAL (OpenHands minimax-M3, run 28178494214) returned
> `FAIL_PLAN` (6/8 PASS) with 5 required fixes + 1 bonus. This revision (cycle 2) closes all six:
> D1 hydration timing + sync→async migration list locked; D1 JSON via `with { type: 'json' }`
> (hedge removed); D2 uses the JSR `bin` map (not an `exports` entry); D3 enumerates the
> `packageSource` runner changes; S1 verification is a concrete unit test. Diffs marked **[EVAL-FIX
> N]** inline.

## Goal

Make `@netscript/cli` fully usable when consumed from JSR over https, then re-enable the
production/public CLI demo as an enforced gate. Three coupled outcomes in ONE prod-hardening PR
(user-confirmed shape):

1. **CLI-PROD-01** — all package-shipped-asset reads work over `https:` (no "Must be a file URL").
2. **CLI-PROD-02** — a runnable command entry resolves from JSR.
3. **CLI-PROD-E2E** — a release-triggered GitHub Action runs the full production demo in
   public/JSR mode and notifies on failure; CI PR validation stays maintainer mode.

## Locked decisions

### D1 — Asset-read mechanism (CLI-PROD-01)

There are exactly **two** asset-read concerns: (a) the 80+ `.template` text assets, all routed
through `template-asset.ts` consuming `template-registry.ts` `.url`; and (b) the single JSON schema
in `editor-config.ts`. The contract templates read the *same* `assets/` files but via duplicated
local `new URL(...)` constants. Fix the mechanism once; do not convert 80+ templates.

**D1.a — Registry hydration + sync read from cache.** **[EVAL-FIX 1 — hydration timing locked]**

- Add `TemplateRegistry.hydrate(): Promise<void>` — a **memoized** (single in-flight promise) async
  method that, for every registered entry, loads `value.url` via the portable loader (below) and
  stores the text into `value.content`. Idempotent: a second call awaits/returns the same settled
  promise and re-reads nothing.
- **Portable loader:** `fetch(url).then((r) => r.text())`. Deno `fetch` resolves **both** `file:`
  (requires `--allow-read`) and `https:` (requires `--allow-net`) URLs, so the same code path works
  for local maintainer runs and JSR-served modules.
- **Bootstrap site — lazy, NOT top-level.** No module in the import graph performs FS/asset side
  effects at load time (A6 gate F-CLI-15/F-CLI-16). Hydration is awaited at the **entry of each
  public scaffold command handler** inside `createPublicCli` (the async command actions that
  scaffold: `init` and any command that renders templates), via
  `await DEFAULT_TEMPLATE_REGISTRY.hydrate()` before the first sync render. Programmatic
  `createPublicCli()` consumers pay the hydration cost only when they invoke a scaffold command,
  never on import. (`mod.ts`'s `if (import.meta.main)` path runs the same command handlers, so no
  separate top-level await is added there.)
- After hydration, `readTemplateAssetSync(key)` / `renderTemplateAssetSync(key)` read
  `asset.content` from the cache instead of `Deno.readTextFileSync(asset.url)`. If `content` is
  absent they throw a clear error: `Template registry not hydrated — await DEFAULT_TEMPLATE_REGISTRY.hydrate() before sync template reads`.
- `readTemplateAsset` (async) becomes: hydrate-if-needed then return cached `content` (or fetch the
  passed-`URL` form directly via the portable loader for the `URL` overload).

**D1.b — sync→async migration list (explicit).** **[EVAL-FIX 2 — full enumeration; no deferral]**

Only these sites issue `Deno.read*` against an `import.meta.url`-relative **package asset** (the
in-scope set). Every other `Deno.read*` in `packages/cli/src` reads a **runtime path into the user's
generated project** and is correct as-is (enumerated as out-of-scope below).

| Site | Change |
| --- | --- |
| `kernel/adapters/templates/template-asset.ts:16,18` (`readTemplateAsset`, async) | hydrate-then-read-cache; `URL` overload → portable `fetch` |
| `kernel/adapters/templates/template-asset.ts:25,27` (`readTemplateAssetSync`) | read `asset.content` from cache; throw if not hydrated |
| `kernel/application/registries/template-registry.ts` | add `hydrate()`; `read()`/`content` already exist |
| `kernel/adapters/scaffold/editor-config.ts:16` | JSON module import (D1.c); de-top-level |
| `kernel/adapters/contracts/templates/generate-v1-mod.ts:34,64` | drop local `new URL` constants; use manifest keys `workspaceContractsV1Empty` / `workspaceContractsV1Aggregate` via `readTemplateAssetSync` (cache) |
| `kernel/adapters/contracts/templates/contract-template-registry.ts:26,31` | drop local `new URL` constants; use manifest keys `serviceContract` / `workspaceContractsMod` via `readTemplateAssetSync` (cache) |

**Contract-template resolution.** **[EVAL-FIX 2 — the non-registry-URL gap closed]** The four
contract templates (`workspace/contracts/v1-empty.ts.template`,
`workspace/contracts/v1-aggregate.ts.template`, `service/contract.ts.template`,
`workspace/contracts/mod.ts.template`) are **already in `TEMPLATE_KEYS`** (`workspaceContractsV1Empty`,
`workspaceContractsV1Aggregate`, `serviceContract`, `workspaceContractsMod`) — verified against
`kernel/assets/manifest.ts`. `generate-v1-mod.ts` and `contract-template-registry.ts` simply
duplicate those URLs with local `new URL(...)` constants. The fix replaces those constants with the
existing manifest keys and `readTemplateAssetSync`, so hydration covers them and they read from
cache. No new manifest entries are created; these functions stay **sync** (callers unchanged).

**Consumers that DO NOT change** (stay sync, read from the hydrated cache) — verified call sites:
`kernel/templates/workspace/netscript-config.ts`,
`kernel/templates/aspire/helpers/generate-db-cli-mode.ts`,
`kernel/templates/aspire/helpers/generate-index.ts`,
`kernel/templates/aspire/helpers/register/{generate-register-apps,generate-register-background,generate-register-infrastructure,generate-register-plugins,generate-register-services,generate-register-tools}.ts`,
`kernel/templates/plugins/{generate-plugin-contracts,generate-plugin-samples,generate-plugin-service,generate-plugin-db-schema,generate-plugin-service-context}.ts`,
`kernel/templates/database/{generate-engine-mod,generate-prisma-config}.ts`,
`kernel/adapters/templates/app/generate-vite-config.ts`. These call only the `*Sync` API and are
correct once hydration runs first; the only behavioral precondition is that the scaffold command
awaited `hydrate()` (D1.a) before invoking them — which all scaffold command paths do.

**D1.c — JSON schema (editor-config.ts).** **[EVAL-FIX 4 — committed, no hedge]**
Use a JSON **module import**, not `fetch`:
`import denoConfigSchema from '../../../../assets/schema/config-file.v1.json' with { type: 'json' };`
The schema joins the module graph (bundled/cached with the package, offline, works file:+https:).
**De-top-level** the existing module-load `Deno.readTextFileSync`: remove the
`DENO_CONFIG_SCHEMA_CONTENT` top-level constant and compute the serialized content lazily inside
`createDenoConfigSchemaFile()` via `\`${JSON.stringify(denoConfigSchema, null, 2)}\n\``. The
`with { type: 'json' }` import is a static import (no FS at runtime), so it is permitted at module
scope; the prohibition is specifically on top-level **`Deno.read*`/FS side effects**, which this
removes.

**Out of scope (leave as-is — runtime reads of the user's generated project, not package assets):**
`maintainer/adapters/*` (packages-copier, plugin-import-rewriter, plugin-file-collector,
official-plugin-source), `public/features/deploy/*`, `kernel/adapters/{windows,config,deploy}/*`,
`kernel/adapters/runtime/file-system/deno-file-system.ts`. Each takes a runtime `path` argument.

### D2 — Runnable bin (CLI-PROD-02) **[EVAL-FIX 3]**

- `mod.ts` is **already runnable** (`if (import.meta.main) { runNetscriptCli(...) }`), so once D1
  lands `deno run -A jsr:@netscript/cli` resolves a working command. No `exports` change needed for
  the `deno run` path; keep `.`, `./scaffolding`, `./testing` exactly as-is.
- For `deno install -g` / a named binary, add the **JSR `bin` map** to `packages/cli/deno.json`
  (top-level field, sibling of `exports`):
  ```jsonc
  "bin": { "netscript": "./bin/netscript.ts" }
  ```
  This is the JSR/Deno binary mechanism — **NOT** an `exports["./bin"]` entry (the cycle-1 plan's
  example was wrong). `bin/netscript.ts` is already in `publish.include`.
- **Re-verify the exact `bin` field shape against `.agents/skills/netscript-deno-toolchain` / the
  current JSR `deno.json` spec at slice time** before committing (toolchain nuance may have shifted
  since alpha.2). The locked decision is: use the `bin` field mechanism, keep existing exports.
- Acceptance: `deno run -A jsr:@netscript/cli@<v> --help` AND `deno install -g jsr:@netscript/cli`
  (then `netscript --help`) both produce a working command.

### D3 — Production e2e Action (CLI-PROD-E2E) **[EVAL-FIX 5 — plumbing enumerated]**

`RunOptions.packageSource` exists but currently every default is `PACKAGE_SOURCE.LOCAL` and the
field is **never read** by any gate. Enumerated runner changes to make a production/JSR mode real:

| Site | Change |
| --- | --- |
| `packages/cli/e2e/src/.../create-default-runner.ts:57` | stop hard-defaulting `PACKAGE_SOURCE.LOCAL`; accept the configured `packageSource` (default stays `local` for existing CI) |
| `packages/cli/e2e/src/.../suite-builder-options.ts:23` | thread `packageSource` from suite options instead of pinning `local` |
| scaffold-init gate (the gate that runs `init`) | **read** `packageSource`; when `jsr`/production, drive the **public** init path (`importMode:'jsr'`, pinned `jsr:@netscript/*@<version>`) instead of maintainer/local (`importMode:'local'` + `syncPackages()`) |
| new `.github/workflows/e2e-cli-prod.yml` | set production `packageSource` + the published version input; run the full demo |

- The exact file paths under `packages/cli/e2e/src/` are confirmed at slice time via the e2e tree
  (`create-default-runner.ts`, `suite-builder-options.ts`, the `scaffold.runtime` gate that calls
  `init`); the decision is: the production mode must be **selectable, defaulted off, and actually
  read** by the init gate.
- New workflow `.github/workflows/e2e-cli-prod.yml`, trigger `on: release: published` (+
  `workflow_dispatch` with a version input for manual runs). Steps: install published CLI from JSR
  → `init` a project (public/jsr import mode) → full runtime smoke (aspire restore → add plugins
  workers/sagas/triggers/streams → db init → generate → seed → aspire start → health endpoints →
  trace verification) → fail-and-notify on any red. This is the **user-specified demo**, codified.
- CI PR validation (`e2e-cli.yml`) is **unchanged** (maintainer/local mode), so PR latency and
  determinism are unaffected.

### D4 — Acceptance / verification bar

Against the **republished** CLI (next version, e.g. alpha.3) pulled from JSR:
1. `deno run -A jsr:@netscript/cli@<v> --help` and `init <proj>` succeed (no "Must be a file URL");
   `deno install -g jsr:@netscript/cli` then `netscript --help` works.
2. Full runtime smoke green (aspire restore → plugins workers/sagas/triggers/streams → db
   init/generate/seed → start → health → traces) via Aspire MCP + CLI.
3. **Separate-agent run**: the 4 website doc tutorials end-to-end, all green.
4. New prod-e2e Action green on a `workflow_dispatch` run.
Local gates: `deno task check` (cli), `run-deno-check/lint/fmt` (scoped to `packages/cli`),
`deno task e2e:cli run scaffold.runtime --cleanup` still green (no regression to maintainer mode).

## Slices (commit-by-slice)

- **S1** — Portable loader + `TemplateRegistry.hydrate()` + lazy bootstrap in `createPublicCli` +
  `readTemplateAssetSync`/`renderTemplateAssetSync` read-from-cache + de-top-level `editor-config.ts`
  (JSON module import) + contract templates routed through manifest keys (D1). The true unblocker:
  smallest set that makes `deno run jsr:@netscript/cli init` work over https.
  **Verification [EVAL-FIX 6 — concrete unit test, replaces "use a local file-server" hand-wave]:**
  add `template-asset_test.ts` (or extend an existing test) that:
  1. **Static-scan** asserts no module in `packages/cli/src` performs a top-level `Deno.read*`
     (regex/source scan of `editor-config.ts` + the template adapters — fails if a bare
     `Deno.readTextFileSync(` appears at module scope).
  2. **https proof**: start a local static file server (`Deno.serve` over the built `assets/`
     dir), point a `TemplateRegistry` instance at `http://localhost:<port>/...` URLs, call
     `hydrate()`, and assert `readTemplateAssetSync(key)` returns the expected content — proving the
     portable loader resolves `https:`/`http:` (publish `--dry-run` cannot prove this).
  Plus: local build's `init` runs end-to-end; `deno task check` + scoped lint/fmt for `packages/cli`.
- **S2** — JSR `bin` map in `packages/cli/deno.json` (D2); `deno publish --dry-run` + `deno doc`
  re-run to confirm the surface.
- **S3** — e2e `packageSource` production-mode wiring (the 3 runner/gate edits) +
  `e2e-cli-prod.yml` Action (D3).

S1 is the true unblocker; S2/S3 land in the same PR as separate commits.

## Risks / open questions (resolved from cycle 1)

- **`fetch(file:)`/`fetch(https:)` permissions.** The bin runs `--allow-all`. Programmatic
  `createPublicCli` consumers must grant `--allow-read` (file) and/or `--allow-net` (https) for
  scaffold-time template loading — **document this** in the CLI module JSDoc and the scaffolding
  export's docs. JSON schema joins the module graph (no extra perm).
- **Network at scaffold time (https).** Accepted for alpha: templates fetched over https are served
  from JSR with HTTP caching; offline scaffold is not an alpha requirement. If offline scaffold
  becomes a requirement, the follow-up is converting `.template` assets to TS string modules
  (tracked as future debt, not this PR).
- **No sync caller is left unconvertible.** All `*Sync` consumers are satisfied by hydrate-first +
  read-from-cache (D1.a/D1.b); `generateV1Mod`'s previously-non-registry URLs are resolved via
  existing manifest keys. No caller must become async except the loader internals.
- **Proving https without publishing first.** S1's unit test (local file server) proves the loader;
  the real end-to-end proof is the post-publish prod-e2e Action (D3/D4).

## Process

Framework SOURCE (S1, S2, S3 e2e wiring) = **WSL Codex daemon-attached slice**, harness-gated.
Supervisor authors these run artifacts + the `.github/workflows/e2e-cli-prod.yml` glue, and
dispatched **PLAN-EVAL (OpenHands minimax-M3)** before any implementation (cycle 1 FAIL_PLAN → this
cycle-2 revision). IMPL-EVAL (OpenHands qwen3.7-max) after. Evaluator is a separate session. Two
FAIL_PLAN cycles then user escalation — this is cycle 2.
