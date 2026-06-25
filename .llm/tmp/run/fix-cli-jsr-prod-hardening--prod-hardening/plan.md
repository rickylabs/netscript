# Plan — CLI JSR production hardening

Run-id: `fix-cli-jsr-prod-hardening--prod-hardening` · Branch: `fix/cli-jsr-prod-hardening`
Archetype: CLI application package (`@netscript/cli`). Overlay: SCOPE-service/tooling.
Grounding: see `research.md` (empirically confirmed against published alpha.2).

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

All template reads funnel through one chokepoint: `kernel/adapters/templates/template-asset.ts`
(`readTemplateAsset`, `readTemplateAssetSync`, `renderTemplateAssetSync`) consuming
`template-registry.ts` `.url`. There are 80+ `.template` assets — mass-converting each to a TS
string module is high-churn and brittle. **Decision:** fix at the chokepoint, not per-asset.

- Replace `Deno.readTextFile(url)` / `Deno.readTextFileSync(url)` with a **portable loader** that
  works for both `file:` and `https:` URLs. Use `fetch(url).then((r) => r.text())` (Deno `fetch`
  supports `file:` with `--allow-read` and `https:` with `--allow-net`).
- Eliminate the **sync** reads on the scaffold path. The registry already carries an optional
  `content?: string` and a `read()` that returns it — make `load()`/registry hydration **fetch and
  cache** content once (async), so callers use `read()`/async `readTemplateAsset` and no per-call FS
  is needed. `readTemplateAssetSync`/`renderTemplateAssetSync`: if any caller truly needs sync,
  hydrate the registry first then read from cached `content`; otherwise migrate callers to async.
- **JSON schema assets** (small, finite): `editor-config.ts` `config-file.v1.json` and any other
  `.json` → prefer a **JSON module import** (`import schema from '...json' with { type: 'json' }`)
  so it joins the module graph (cached/bundled, offline). Acceptable alternative: same `fetch`
  loader.
- **De-top-level `editor-config.ts`**: remove the module-load-time `Deno.readTextFileSync`. No
  module in the import graph may perform FS/asset side effects at load time. Move to lazy/async
  inside the function that builds the editor config file.
- **Contract templates** (`generate-v1-mod.ts`, `contract-template-registry.ts`): route through the
  same portable loader; remove their `Deno.readTextFileSync(url)` calls.

Out of scope (leave as-is): reads that take a **runtime path into the user's generated project**
(`maintainer/adapters/*`, `public/features/deploy/*`, `kernel/adapters/{windows,config,deploy}/*`,
`runtime/file-system/deno-file-system.ts`). Those are correct.

### D2 — Runnable bin (CLI-PROD-02)

Make a command entry resolvable from JSR. Land the dx-bin approach (task #110): add a bin export
(e.g. `"./bin": "./bin/netscript.ts"`) and/or make `mod.ts` runnable so `deno run -A
jsr:@netscript/cli[/bin]` and `deno install` both produce a working `netscript` command. Confirm the
published `exports` set advertises the runnable entry. Keep `.`, `./scaffolding`, `./testing`.

### D3 — Production e2e Action (CLI-PROD-E2E)

- Wire the existing e2e `packageSource` axis so a **production/JSR** mode forces scaffolded projects
  to resolve `@netscript/*` from published JSR (not local). Public init already uses
  `importMode:'jsr'`; the e2e must exercise that path against the just-published version.
- New workflow `.github/workflows/e2e-cli-prod.yml`, trigger `on: release: published` (+
  `workflow_dispatch` with a version input for manual runs). Steps: install published CLI from JSR
  → `init` a project → full runtime smoke (aspire restore → add plugins workers/sagas/triggers/
  streams → db init → generate → seed → aspire start → health endpoints → trace verification) →
  fail-and-notify on any red. This is the **user-specified demo**, codified.
- CI PR validation (`e2e-cli.yml`) is unchanged (maintainer/local mode).

### D4 — Acceptance / verification bar

Against the **republished** CLI (next version, e.g. alpha.3) pulled from JSR:
1. `deno run -A jsr:@netscript/cli@<v> --help` and `init <proj>` succeed (no "Must be a file URL").
2. Full runtime smoke green (aspire restore → plugins → db init/generate/seed → start → health →
   traces) via Aspire MCP + CLI.
3. **Separate-agent run**: the 4 website doc tutorials end-to-end, all green.
4. New prod-e2e Action green on a dispatch run.
Local gates: `deno task check` (cli), `run-deno-check/lint/fmt` (scoped to `packages/cli`),
`deno task e2e:cli run scaffold.runtime --cleanup` still green (no regression to maintainer mode).

## Slices (commit-by-slice)

- **S1** — Portable asset loader + de-top-level editor-config + contract templates (D1). Smallest
  set that makes `deno run jsr:@netscript/cli init` work. Validate by running the *local* build's
  init AND a from-https smoke (publish dry-run can't prove this; use a local file-server or the
  module-graph import approach to assert no sync/top-level FS).
- **S2** — Runnable bin export (D2).
- **S3** — e2e production-mode wiring + `e2e-cli-prod.yml` Action (D3).

S1 is the true unblocker; S2/S3 can be same PR but separate commits.

## Risks / open questions for PLAN-EVAL

- `fetch(file:)` requires `--allow-read`; `fetch(https:)` requires `--allow-net`. The bin runs
  `--allow-all`, but programmatic `createPublicCli` consumers may run narrower perms — document the
  permission requirement. Is `fetch` of https assets at scaffold time acceptable (network), or must
  templates be bundled as modules for offline scaffold? (Tradeoff: 80+ template TS conversion vs
  network dependency. Recommend fetch now; module-bundling as a follow-up if offline scaffold is a
  requirement.)
- Does removing sync template reads break any caller that can't be made async? Enumerate callers.
- Verifying the https path in CI without first publishing: use a local static file server over the
  built package, or assert via unit test that no module performs top-level FS and that the loader
  uses `fetch`. The real proof is the post-publish prod-e2e Action (D3).

## Process

Framework SOURCE (S1, S2, S3 e2e wiring) = **WSL Codex daemon-attached slice**, harness-gated.
Supervisor authors these artifacts + the `.github/workflows/e2e-cli-prod.yml` glue, and dispatches
**PLAN-EVAL (OpenHands minimax-M3)** before any implementation. IMPL-EVAL (OpenHands qwen3.7-max)
after. Evaluator is a separate session.
