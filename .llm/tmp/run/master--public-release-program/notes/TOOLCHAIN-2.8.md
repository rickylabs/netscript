# Toolchain Note — Deno 2.8 leverage for the public release

> Source: `https://deno.com/blog/v2.8` (released 2026-05-22), cross-checked with
> `jsr.io/docs` and `docs.deno.com`. This note feeds supervisor **S2** and the
> release engineering in **S3**. It records *what changes the program*, not the
> full changelog.

## TL;DR

Deno 2.8 **deletes a whole supervisor's worth of bespoke release machinery** the
prior plan assumed (custom `release.ts`, manual `jsr:` rewrite, hand-rolled
lockstep bumping). The upgrade is leverage, not a chore.

## Game-changers (program-affecting)

| Feature | Effect on the program |
|---|---|
| **`deno bump-version`** (workspace-aware) | Replaces custom `release.ts`. Lockstep `bump-version patch\|minor\|prerelease` bumps **all 29 members** and **rewrites `jsr:` constraints + the root import map**. Alt mode `--base=main` derives per-package bumps from Conventional Commits (post-alpha option). Drives S3 release. |
| **`deno publish` workspace auto-rewrite** | Publishing from the workspace root replaces workspace path imports (`../shared/mod.ts`) with registry refs (`jsr:@netscript/shared`) **in the published code**. Kills the prior plan's "rewrite import_map on handoff" task (DRIFT-005). Keep path imports for local dev. |
| **`deno ci`** | Frozen, reproducible install: errors if `deno.lock` missing, wipes `node_modules`, installs `--frozen`. First step of both CI workflows; `--prod` / `--skip-types` available. |
| **`isolatedDeclarations` (TS 5.5+/6.0) + `deno doc --lint`** | Together they turn the **two highest-weighted JSR score factors** (no slow types, docs on every symbol) into **local + CI gates**. `isolatedDeclarations: true` at the workspace root makes the publish surface slow-type-compliant *by construction* — the prior plan's single biggest line item (17/24 packages, up to 50 slow types each) becomes compiler-enforced. |
| **`deno pack`** | One-shot `deno.json` → npm-publishable `.tgz` with generated `package.json` (conditional exports) and `.d.ts` from the same fast-check pipeline as `deno publish`. Near-free **npm mirror** → raises JSR compatibility score (≥2 runtimes) and reaches Node/Bun. S3 stretch / post-alpha. |
| **`catalog:` protocol** | Pin `@std/*`, `zod`, etc. once in the root `deno.json` and reference `catalog:` from all 29 members. Solves cross-package version harmonisation in one place (prior plan DRIFT-005 family). |
| **`deno audit` / `deno audit fix`** | Supply-chain gate in `ci.yml`; `--fix` auto-patches to the nearest safe version. |
| **TypeScript 6.0.3 bundled** | Free type-check engine upgrade for `deno check`, LSP, `deno doc`, `deno compile`. No flag. |
| **`lib.node` on by default** | `Buffer`/`process`/`NodeJS.*` resolve without config. **Action:** re-enable `no-process-global` + `no-node-globals` lint rules (now off by default) since we are a multi-runtime library. |
| **Testing upgrades** | Per-test `timeout`, sanitizers **off by default**, `Deno.test.sanitizer()` module API, **per-function coverage** (`deno coverage`) — exposes "high line coverage hiding untested API surface", exactly the framework-quality signal S1 wants. |
| **`deno compile` framework detection** | Detects Fresh / Vite SSR / TanStack Start / Astro etc. Useful for shipping the Lume/Fresh docs site (S5) or the CLI as a single binary. |
| **OTel: console + gRPC exporters, `DENO_AUDIT_PERMISSIONS=otel`** | Aligns with `@netscript/telemetry` observability standard; strong Aspire dashboard story (S4). |
| **`deno task` parallel output prefixing + `set -e`** | Cleaner multi-package task fan-out in CI. |

## Caveat — heavy-generic packages

`isolatedDeclarations` does not rescue every Zod/DSL-inference-heavy public API.
`contracts`, `triggers`, `service`, and `plugin` may still require
**`--allow-slow-types` per package** (all-or-nothing per package; costs the
"no slow types" score factor and the npm `.d.ts`). Treat each as a **per-package,
score-impacting decision** recorded in `debt/arch-debt.md` during S1 — never a
workspace default.

## Adoption order (S2 sub-branches)

1. `feat/toolchain/upgrade-runtime` — `deno upgrade`; set `isolatedDeclarations`,
   `lint.rules.tags:["recommended","jsr"]`, re-enable node-globals rules.
2. `feat/toolchain/bump-version-release` — wire `deno bump-version` as the
   release path; delete any bespoke release script assumptions.
3. `feat/toolchain/catalog-deps` — move shared deps to root `catalog:`.
4. `feat/toolchain/doc-lint-gate` — add `deno doc --lint` to local + CI gates.
5. `feat/toolchain/otel-2.8` — adopt console/gRPC exporters where telemetry
   already emits.

## Sources

- `https://deno.com/blog/v2.8`
- `https://jsr.io/docs/about-slow-types` · `https://jsr.io/docs/scoring`
- `https://docs.deno.com/runtime/reference/cli/bump_version/`
- `https://docs.deno.com/runtime/fundamentals/workspaces/`
- `https://docs.deno.com/runtime/reference/cli/doc/` (`--lint`)
