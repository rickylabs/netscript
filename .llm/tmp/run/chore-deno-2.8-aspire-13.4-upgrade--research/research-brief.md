# Toolchain Upgrade — Deno 2.8.x + Aspire 13.4.x — RESEARCH-ONLY brief

> **Phase:** RESEARCH ONLY. No implementation, no version bumps, no config edits in
> `deno.json`/`*.csproj`/`global.json`, no lockfile changes. The deliverable is an
> upgrade analysis + a concrete adoption plan + seams, not code.
> Branch: `chore/deno-2.8-aspire-13.4-upgrade` (off `feat/package-quality` @ `fcef53d`).
> Artifacts live ONLY under
> `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/`.

## Why this research exists

The maintainer wants two coordinated toolchain upgrades, each adopting **all** new
features and **removing all legacy**:

1. **Deno `2.7.11` → `2.8.x`** — adopt the new 2.8 capabilities (see blog
   `https://deno.com/blog/v2.8`), not just bump the binary.
2. **Aspire `13.2.2` → `13.4.x`** — adopt 13.4's latest features and retire the
   hand-patched / legacy paths where 13.4 supersedes them.

This is the RESEARCH phase: produce the upgrade map, the new-feature adoption
matrix, the legacy-removal list, the validation plan, and the risk register so a
LATER impl phase executes cleanly. **No edits to source/config in this wave.**

## Maintainer intent (verbatim spine)

- Upgrade **Deno to 2.8.x INCLUDING implementing all new features** (check the
  2.8 blogpost) — but here, **research only**.
- Upgrade **Aspire to 13.4.x, same** — include all new features, **remove all
  legacy**, do the initial setup, research only.
- **No backward compatibility** is required (greenfield alpha; legacy may be
  deleted outright).

## Grounding — repo already has prior notes (READ FIRST, re-verify, do not trust blindly)

- `.llm/tmp/run/master--public-release-program/notes/TOOLCHAIN-2.8.md` — the
  program-level Deno 2.8 leverage map (S2/S3). Treat as the authoritative starting
  inventory of 2.8 features; this research turns it into an executable adoption
  plan for THIS workspace.
- `.llm/tmp/run/master--public-release-program/notes/ASPIRE-13.4-13.5.md` — the
  Aspire 13.4-now / 13.5-later map (S4), with current pins.
- Current pins (re-verify): Deno `2.7.11`; CI `denoland/setup-deno@v2` →
  `deno-version: v2.x`; `Aspire.AppHost.Sdk 13.2.2`, `CommunityToolkit.Aspire.
  Hosting.Deno`/`.SQLite 13.1.0`, `net10.0`, `dotnet/global.json` SDK `10.0.0`
  (`rollForward: latestMinor`, `allowPrerelease: true`).

## Research questions (answer each with evidence + a recommendation)

### A. Deno 2.8 feature-adoption matrix
For every program-affecting 2.8 feature, decide **adopt now / defer / N-A here**
with the concrete workspace action and the file(s) it touches (named, not edited):
- `isolatedDeclarations` at workspace root + `lint.rules.tags:["recommended","jsr"]`;
  re-enable `no-process-global` + `no-node-globals` (now off by default; we are a
  multi-runtime library); per-package `--allow-slow-types` carve-outs for the
  generic-heavy packages (`contracts`, `triggers`, `service`, `plugin`) recorded as
  score-impacting debt — never a workspace default.
- `deno bump-version` (workspace-aware, all 29 members) replacing any bespoke
  release script; `--base=main` Conventional-Commit mode (post-alpha option).
- `deno publish` workspace path→registry auto-rewrite (kills manual `jsr:` rewrite).
- `deno ci` as first CI step (frozen/reproducible; `--prod`/`--skip-types`).
- `catalog:` protocol — pin `@std/*`, `zod`, etc. once in root `deno.json`.
- `deno audit` / `deno audit fix` supply-chain gate.
- TypeScript 6.0.3 bundled (free `deno check`/LSP/doc upgrade).
- `lib.node` on by default (re-enable node-globals lint).
- Testing: per-test `timeout`, sanitizers off by default + `Deno.test.sanitizer()`,
  per-function `deno coverage`.
- `deno compile` framework detection (Fresh/Vite/TanStack/Astro) — relevance to
  CLI single-binary + S5 docs site.
- OTel console + gRPC exporters, `DENO_AUDIT_PERMISSIONS=otel` — `@netscript/
  telemetry` alignment.
- `deno task` parallel output prefixing + `set -e`.
- `deno pack` npm-mirror (`.tgz` + generated `package.json`/`.d.ts`) — defer/stretch?

### B. Deno 2.8 legacy removal
Catalog what 2.8 makes obsolete in THIS repo and should be **deleted** (no back-compat):
bespoke release/version scripts, manual import-map/`jsr:` rewrite helpers,
hand-rolled slow-type workarounds, redundant lint suppressions, custom coverage
shims, any `// deno-lint-ignore` made unnecessary by 2.8 defaults. List file paths.

### C. Aspire 13.4 feature-adoption matrix
- Bump `Aspire.AppHost.Sdk 13.2.2 → 13.4.x` and CommunityToolkit
  `Deno`/`SQLite 13.1.0 → 13.4.x` (named files: `dotnet/AppHost/AppHost.csproj`,
  `dotnet/global.json`).
- **TS apphost GA (13.4):** explicit `apphost.mts` entry point, generated SDK
  modules under `.aspire/modules/`, startup validation before run — confirm the
  CLI-scaffolded apphost matches the GA shape; flag drift.
- **Dashboard commands:** typed resource-command arguments + `WithProcessCommand()`
  to expose `netscript` CLI subcommands (scaffold/seed/migrate) as dashboard
  commands. Design the seam (coordinate with the Wave 6 CLI research's `deploy`/
  command-registry work — cross-reference, do not duplicate).
- `aspire logs/otel --search` (13.4) for cheaper log assertions in e2e.
- Verify against the live toolchain via the **Aspire MCP** (`list_docs`/
  `search_docs`/`get_doc`) and the `aspire` skill.

### D. Aspire legacy removal + 13.5 readiness seam
- Identify the **hand-patched / generated-artifact** paths superseded by 13.4 GA
  and list them for removal (no back-compat).
- Design the 13.4 apphost so it **flips cleanly to the native Deno apphost at
  13.5** (`microsoft/aspire#16218`, which WE requested). Mirror #16218's validation
  checklist (toolchain resolution, `aspire doctor` Deno reporting, CLI E2E
  restore/run/doctor) as the seam — **design only, no impl**. State that 13.4 is
  self-sufficient and 13.5 is an upgrade, not a launch gate.

### E. Coordinated validation plan (design only)
Define the smallest gates that prove each upgrade, mapped to existing tasks
(`deno task check:*`, `lint`, `test`, `fmt`, `arch:check`) plus the stack e2e
(`netscript init → deno task check → aspire run` against the playground, nightly/
release not per-PR). State exact commands and pass criteria; do NOT run impl.

### F. Your own analysis / risk register
Surface unnamed risks: 2.8↔Fresh/Lume/JSR interactions, `isolatedDeclarations`
breakage in generic packages, `.NET 10` + Aspire 13.4 prerelease interplay,
CI floating `v2.x`→pinned `2.8.x` decision, ordering/coupling between the Deno and
Aspire upgrades, and the relationship to the separate Wave 6 CLI research (the CLI
owns the apphost scaffold + deploy seam — keep the two researches consistent, not
overlapping).

## Deliverable (write-artifact-first)

Create and incrementally fill **`research.md`** in this run dir:
- the **Deno 2.8 adoption matrix** (feature → adopt/defer/N-A → action → files);
- the **Deno legacy-removal list**;
- the **Aspire 13.4 adoption matrix** + **legacy-removal list** + **13.5 seam**;
- a **coordinated validation plan** (exact gate commands, pass criteria);
- a **risk register**;
- a suggested **upgrade slice plan** (Deno first vs Aspire first; sub-branch order)
  for the LATER impl phase — not executed here.

End the OpenHands summary with one line: `RESEARCH COMPLETE` (no verdict, no impl).

## Hard boundaries

- **No edits to source/config**: no `deno.json`/`deno.jsonc`, no `*.csproj`/
  `global.json`, no lockfiles, no `packages/` code. New analysis artifacts in this
  run dir only.
- **Never** delete lock files/caches or run `deno cache --reload` (approval-gated).
- No `deno upgrade`, no SDK bumps, no publish, no template `jsr:` rewrites here.
- Aspire/Deno feature work is **research + seams only** — implement nothing.
