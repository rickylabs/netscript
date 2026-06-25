# Research — Deno 2.9.0 adoption for the NetScript framework

Run: `chore-deno-2.9-adoption--adoption-plan` · branch `chore/deno-2.9-adoption` · baselined against
`origin/main` @ `c0020a1b` (includes #126). Research date 2026-06-25 (Deno 2.9.0 shipped same day).
Read-only grounding; no source modified during research.

Sources: [denoland/deno v2.9.0 release](https://github.com/denoland/deno/releases/tag/v2.9.0),
[Deno 2.9 blog](https://deno.com/blog/v2.9), [PR #34359 (deno link)](https://github.com/denoland/deno/pull/34359).

## Part A — Deno 2.9.0 feature inventory

### Dependency management / linking

| Feature | Description | API / flag | Status |
|---|---|---|---|
| `deno link` / `deno unlink` | Link a local dir whose `deno.json` has a JSR `"name"`; resolvable by **bare specifier**, composes **transitively** across siblings; may live **outside** the workspace tree | `deno link <path>` / `deno unlink <path-or-name>` (#34359) | Stable |
| `"links"` field | `deno.json` array of relative paths populated by `deno link`; now stable | `{"links": ["../pkg"]}` (#34996) | Stable |
| Resolve linked pkgs by bare specifier | Imported by name, no import-map entry; transitive | #35228; wrong-name hint #35319 | Stable |
| `deno install` lockfile seeding | Seeds `deno.lock` from an **existing** `package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`/`bun.lock` | #35330/#35346/#35350/#35394 | Stable |
| Workspace member `node_modules` | `deno install` creates per-member `node_modules`/`.bin`; symlinks npm members by name | #34970/#35383 | Stable |
| `deno list` | Lists declared deps + versions (≈ `npm ls`) | `deno list` (#34972) | Stable |
| `preferPackageJson` | `deno add/install/remove` manage `package.json` vs `deno.json` | `"preferPackageJson": true` (#35392) | Stable |
| `catalog:` in `deno.json` imports | pnpm-style catalog accepted in `deno.json` (was npm/`package.json`-only) | #35168 | Stable |
| Min dependency age | Default-on 24h window for npm (supply-chain) | #35458 | **Stable (default-on)** |

### Task runner

| Feature | Description | API / flag | Status |
|---|---|---|---|
| `--jobs` / `--concurrency` | Cap parallel task execution | `deno task --jobs N` (#35318) | Stable |
| Input-based caching | Task skips when declared `files`/`output` unchanged | `files`/`output` in task def (#34509) | Stable |
| `--if-present` | Exit clean if task undefined | (#35315) | Stable |
| npm-script env vars | `npm_execpath` etc. for `package.json` scripts | #35317/#35252 | Stable |

### Build / test / format / publish (selected)

| Feature | API | Status |
|---|---|---|
| `bundle --declaration` | rolled-up `.d.ts` (#33838) | Stable |
| `deno watch` | alias of `run --watch-hmr` (#35301) | Stable |
| `fmt` `.editorconfig` inference | CLI → deno.json → `.editorconfig` → defaults (#34071) | Stable |
| Test `--changed`/`--related`/`--shard`, `Deno.test.each`, retries, snapshots | #35199/#35057/#34938/#35053/#35139 | Stable |
| `deno compile` Web Storage/KV persistence | per-app data dir, `--app-name` (#34618) | Stable |
| Publish: continue-after-member-failure | #35133 | Stable |
| Publish: skip already-published versions | #35134 | Stable |
| Publish: include `publish.include` assets in tarball | #35331 | Stable |

### Runtime behavior changes (bump-risk)

| Change | Detail | PR |
|---|---|---|
| `Deno.serve` automatic compression **OFF by default** | opt back in via `automaticCompression: true` / `DENO_SERVE_AUTOMATIC_COMPRESSION=1` | #35486 |
| Min dependency age default-on (24h) | can warn/block freshly-published npm installs | #35458 |
| `deno.lock` reseed / v5 | `deno install` may re-resolve checked-in lock | n/a |

**Import.meta / asset note:** 2.9 has **no** change to `Deno.readTextFile*` over `https://`. The
repo's known CLI-on-JSR asset blocker is **NOT** addressed by 2.9 (it is fixed independently by PR
#127). Do not couple that fix to this program.

## Part B — Repo grounding

### B.1 Current pin (2.8.3) — bump surface (7 sites / 5 files; not DRY)
- Canonical: `.github/toolchain.env:7` → `NETSCRIPT_DENO_VERSION=v2.8.3` (consumed by `openhands-agent.yml:286,398`).
- Hardcoded `deno-version: "2.8.3"`: `ci.yml:47,68,98`, `e2e-cli.yml:57,87`, `publish.yml:23`.
- Prose: `.agents/skills/netscript-deno-toolchain/SKILL.md` (+ `.claude` mirror), `AGENTS.md:13`, `.llm/tools/README.md:22,82`.
- README: `README.md:47` "Deno 2.x" (no change).
- No `.dvmrc`/`.deno-version`; no `engines`.
- Unstable array `deno.json:13-18` = `["kv","temporal","tsgo","worker-options","raw-imports"]` — **none stabilized in 2.9**; `--unstable-kv` remains pervasive (incl. scaffold output `deno-json.ts`/`editor-config.ts`). Unstable surface unchanged by the bump.

### B.2 Maintainer local-linking vs `deno link` — strong fit, framework SOURCE (spike)
- `packages/cli/src/maintainer/adapters/packages-copier.ts:9-21` docstring states the exact problem `deno link` solves (workspace members must live at/below root; relative escapes break transitive deps → packages are **copied** in). `copyLocalPackages()` `:91-160`; injection `:195-199`.
- Hand-maintained subpath maps: `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts:84-131` (`PACKAGE_TO_LOCAL_PATH`, ~45 entries) and `maintainer/adapters/local-import-resolver.ts:6-40+`.
- `importMode: 'jsr'|'local'` at `kernel/domain/scaffold/scaffold-options.ts:11,25`; public `init` defaults `jsr`; `local` drives the copier in e2e `scaffold.runtime` + `netscript-dev`.
- **Blockers to PoC before committing:** (1) does `"links"` resolve each linked pkg's own subpaths (`/client`,`/query`,`/middleware`) by bare specifier without re-enumeration; (2) `catalog:` resolves against source monorepo (untested); (3) MySQL-adapter prune (`pruneMysqlAdapterFromDatabasePackage:203-230`) mutates copied files — links are immutable source, needs a different exclusion approach.

### B.3 Task runner — clear wins, config-only
- `ci:quality` (`deno.json:22`) shells a **hand-rolled** `Promise.all` runner `.llm/tools/run-parallel-tasks.ts` → replaceable by `deno task --jobs`.
- Input-based caching fits `check`(`:23`)/`lint`(`:50`)/`fmt:check`(`:49`). Keep side-effecting `e2e:cli`(`:47`) OUT.

### B.4 Lockfile seeding / polyglot — weak/no fit
- Scaffold emits no foreign lockfile (seeding imports an *existing* lock; fresh projects have none). Generated root uses `nodeModulesDir:'auto'` (`templates/workspace/deno-json.ts:45`).
- Only npm island: `aspire/package.json` (`render-ts-apphost.ts:51-77`) ships no lock → manual `npm install` (pre-existing DX gap → arch-debt, not a 2.9 slice).

### B.5 `bundle --declaration` / doc-lint — no fit
- Repo publishes source TS directly; zero `deno bundle` usage; `isolatedDeclarations:true` (`deno.json:60`) already gives fast `.d.ts`. **Reject** rolled-up `.d.ts`.

### B.6 Breaking risks on bump
1. `Deno.serve` compression OFF by default (#35486) — verify scaffold.runtime HTTP/OTEL behavior; re-enable per-handler if any check assumes gzip/br.
2. Min-dep-age default-on (#35458) — verify CI `deno install` doesn't warn/block.
3. `deno.lock` reseed — expect one-time reviewed diff; CI not `--frozen` (`ci.yml:50,71`) so won't hard-fail, but must reconcile. **Requires explicit user approval per repo lock-hygiene rule.**
4. `catalog:` in deno.json (#35168) is additive; re-verify the skill's JSR-in-catalog rejection claim (`SKILL.md:50-53`) on 2.9.

## Part C — Candidate slices (detail) — see plan.md for the locked scope

- **C0** bump 2.8.3→2.9.x across CI/toolchain pins (prereq, config/CI → supervisor).
- **C1** replace `run-parallel-tasks.ts` with `deno task --jobs` (config + tool deletion → supervisor).
- **C2** input-based caching on check/lint/fmt:check (config → supervisor).
- **C3** refresh `netscript-deno-toolchain` skill to 2.9 (docs → supervisor; generated from `.agents/`).
- **C4** adopt/verify `deno publish` 2.9 resilience semantics in `publish.yml` (CI/config → supervisor).
- **C5** (spike, framework SOURCE → Codex, gated by PoC) migrate maintainer local-link copy → `"links"`.
- **C6** (follow-up, framework SOURCE → Codex) generated-project task DX (`--jobs`/input-cache).

### Decided-out (record so not re-litigated)
- `bundle --declaration` — no fit (source publish + isolatedDeclarations).
- Lockfile seeding — no scaffold consumer (fresh projects).

## Bottom line (alpha.3 window)
Bump first (C0; risks = serve-compression-off + min-dep-age, both caught by scaffold.runtime +
CI `deno install`; reconcile one-time lock reseed). Then the free/cheap wins: C1 (delete bespoke
parallel runner), C4 (publish resilience de-risks the whole-workspace publish that bit this repo
before), C2 (dev-loop speedup). C3 keeps the toolchain skill truthful. C5/C6 are deferred
(spike-gated / follow-up).
