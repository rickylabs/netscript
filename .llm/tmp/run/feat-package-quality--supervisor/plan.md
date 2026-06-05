# Plan: S1 — Package Quality (slow-types + docs) (supervisor)

> Supervisor run for **S1** of the public release program. Parent authority:
> `.llm/tmp/run/master--public-release-program/RELEASE-PROGRAM.md` (§ 9 execution
> model, § 10 S1 card, § 11 handover, § 12 cross-cutting references). Operating
> protocol: `.llm/harness/workflow/supervisor.md`. **Multi-group supervisor run
> (7 waves).**
>
> **Canonical plan — nest, do not rewrite.** The per-package evaluate/plan
> authority is the prior run
> `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
> (`PLAN.md`, `audit/JSR-DRY-RUN-MATRIX.md`, the `evaluate_*`/`plan_*` docs,
> `harmonisation/`). It was carried into this repo alongside the master run. Each
> wave consumes the matching per-package docs; it does not re-derive them.

## Execution context (read first)

S1 is the **first supervisor that runs in the new repo** (`rickylabs/netscript`),
not in `netscript-start`. S0 produced this repo by ejecting the producer surface;
the umbrella tracker (`netscript-start` PR #97) and the S0 PRs (`netscript-start`
PR #98, new-repo PR #1) record that hand-off. S1 takes the ejected surface — where
`deno publish --dry-run` currently *resolves but slow-types remain* — to
**0 slow-types, `deno doc --lint` clean, every unit publish-ready at
`0.0.1-alpha.0`**.

The genesis tree already pre-applied part of S2 (root `deno.json` has
`isolatedDeclarations: true` and lint tags `jsr` + `no-node-globals`), so S1 can
start immediately; the rest of S2 (the `deno bump-version` release path, `deno
ci`) runs in parallel and is **not** an S1 blocker.

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality--supervisor` |
| Runs in | `rickylabs/netscript` (the public producer repo) |
| Integration branch | `feat/package-quality` |
| Base branch | `feat/repo-genesis` (genesis branch; rebase onto `main` if new-repo PR #1 merges first) |
| Phase | `plan` |
| Archetype | per package — **ARCHETYPE-1..6** as the nested run assigns; `SCOPE-docs.md` for README/`docs/` work |
| Scope overlays | `SCOPE-docs.md` |
| Phase groups | Wave 0..Wave 6 (7 groups — see `phase-registry.md`) |

## Archetype

S1 has **no single archetype** — it is the wave program that brings every
publishable unit to the doctrine/JSR bar. Each wave's nested sub-run selects the
archetype(s) the nested per-package plan already assigned (A1 small-contract, A2
integration, A3 runtime, A4 dsl/app, A5 plugin, A6 cli) and applies
`gates/archetype-gate-matrix.md`. `SCOPE-docs.md` overlays every wave for the
README + `docs/` deliverables (STANDARDS § 6–7).

## Current Doctrine Verdict

Per-package, owned by the nested canonical run. The platform rewrite
(`netscript-start` PR #86–#95) already brought a large subset to 0 slow-types
during the `*-core` split — **the prior run's raw counts are stale and must be
re-measured in this repo at Wave 0 (baseline re-audit)** before trusting any
"today's state" number. Do not assume a unit is dirty or clean from the 2026-05
audit; re-run `tools/fitness/release-readiness.ts` here first.

## Axioms in Play

| Axiom | Why it matters |
|-------|----------------|
| Lockstep `0.0.1-alpha.0` | No unit forks its version line; every member already at `0.0.1-alpha.0` — keep it |
| Slow-type-clean publish surface | `isolatedDeclarations` + explicit return types + `deno doc --lint`; the single largest line item |
| No backward-compatibility shims | Alpha = pre-stability (doctrine no-backcompat rule); delete legacy, do not alias |
| Foundation-first wave order | A wave does not start until the prior wave's gates are green (the PR #96 Group-A-first grain) |
| One engine, two targets | Package sources stay path-imported in the producer repo; `deno publish` rewrites to `jsr:` at publish — do not hand-edit to `jsr:` |

## Goal

Bring all **27 publishable units** (23 packages + 4 plugins, all at
`0.0.1-alpha.0`) to the alpha quality bar: `deno publish --dry-run` clean with
**0 slow-types** (drop `--allow-slow-types`), `deno doc --lint` clean, README
≥ 150 lines, `/docs` per STANDARDS § 7, and the archetype gate matrix green per
unit — sequenced through the seven dependency-ordered waves. The supervisor is
**not done** until every unit is publish-clean and the integration branch's
workspace `deno task check` + affected tests pass.

## Scope — the seven waves (phase groups)

The waves are the proven grain (Foundation-first, like PR #96's Group A). Each is
one reviewable sub-PR with its own Design checkpoint + separate evaluator pass.
Per-package detail lives in the nested canonical run — cite it, do not duplicate.

- **Wave 0 — Foundation** (`feat/package-quality-wave0-foundation`): `@netscript/shared`.
- **Wave 1 — Contracts & schemas (A1)**: `@netscript/runtime-config`,
  `@netscript/config`, `@netscript/contracts`.
- **Wave 2 — Integration adapters (A2)**: `@netscript/logger`,
  `@netscript/telemetry`, `@netscript/aspire`, `@netscript/kv`,
  `@netscript/database`, `@netscript/prisma-adapter-mysql`, `@netscript/queue`,
  `@netscript/cron`.
- **Wave 3 — Plugin runner**: `@netscript/plugin` (the host every other plugin
  loads; `hello-world` is gone — the `netscript plugin scaffold` template
  replaces it).
- **Wave 4 — Runtimes & their plugins**: `@netscript/plugin-streams-core`,
  `@netscript/plugin-workers-core`, `@netscript/plugin-sagas-core`,
  `@netscript/plugin-triggers-core`, `@netscript/watchers`, and the four plugins
  `@netscript/plugin-{streams,workers,sagas,triggers}` (`plugins/*`), released
  core+plugin atomically per sub-wave.
- **Wave 5 — Application surfaces (A4)**: `@netscript/sdk`, `@netscript/service`,
  `@netscript/fresh`, `@netscript/fresh-ui`.
- **Wave 6 — Tooling**: `@netscript/cli` (last — it references the published
  `0.0.1-alpha.0` of every other unit and is the docs-site source of truth).

## Non-Scope

- JSR scope creation/linking + publish workflows + OIDC/provenance → **S3**.
- `deno bump-version` release wiring, `deno ci` → **S2** (parallel).
- Aspire 13.4 bump + `aspire run` E2E → **S4**.
- Docs site (Lume) → **S5**; S1 only produces per-package `/docs` source.
- Governance + the `v0.0.1-alpha.0` tag + announcement → **S6**.
- Actually publishing to JSR — S1 stops at **publish-clean dry-run**, not publish.

## Hidden Scope

- **Reconciliation with PR #84/#86–95.** The nested 2026-05 inventory lists 29
  units (24 packages + 5 plugins incl. `streams`/`triggers`/`workers`/`sagas`
  packages + `hello-world`). This repo's surface is **27 units**: the old runtime
  packages became `@netscript/plugin-*-core`, and `hello-world` is removed. Wave 0
  step 1 is to re-map the nested per-package docs onto the current surface and log
  the delta in `drift.md`.
- The `*-core` packages and their plugins were largely cleaned during the
  platform rewrite — Wave 4 may be mostly verification, not refactor. Confirm by
  re-audit, do not assume.
- README/`docs/` is real scope, not a footnote: STANDARDS § 6 (README ≥ 150 LOC)
  + § 7 (`/docs` shape) gate every unit.

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Rewriting the nested per-package plan | risk | Nest + reconcile; never re-derive verdicts |
| Trusting stale 2026-05 slow-type counts | risk | Re-audit in this repo at Wave 0 |
| Hand-editing path imports to `jsr:` | risk | Keep path imports; `deno publish` rewrites |
| Back-compat aliases to dodge slow-types | risk | Delete legacy; explicit return types instead |
| Starting a wave before the prior wave's gates are green | risk | Enforce Foundation-first ordering |
| Cross-wave edits bleeding into a sibling wave | risk | Disjoint write scope per wave branch |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| Slow-types | yes | `deno publish --dry-run --allow-dirty` (no `--allow-slow-types`) = 0 slow-types per unit in the wave |
| Doc lint | yes | `deno doc --lint <unit>/mod.ts` clean |
| Archetype matrix | yes | `gates/archetype-gate-matrix.md` green for each unit's archetype |
| Standards | yes | `tools/fitness/check-netscript-standards.ts` per unit (mod.ts barrel, exports map, README ≥ 150, `/docs`) |
| Doctrine | yes | `tools/fitness/check-doctrine.ts` (root `deno task arch:check`) clean for the wave |
| Workspace check | yes | `deno task check` green on the integration branch after each merge |
| Affected tests | yes | `deno test --allow-all` for the wave's units |
| Source alignment (SCOPE-docs) | yes | per-unit claims trace to nested `evaluate_*`/`plan_*` + STANDARDS |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `.llm/harness/debt/arch-debt.md` | carry-forward + close | Foundation-alpha debt logged during the platform rewrite (telemetry instrumentation, config plugin schema, aspire `./helpers`) is owned by the relevant wave; close where the wave touches it, carry forward otherwise |
| New entries | create-if-needed | If a unit cannot reach 0 slow-types without a structural change larger than its wave, log `FAIL_DEBT` with owner + closing gate rather than shimming |

## Validation Plan

| Order | Gate | Command or check | Expected result |
|-------|------|------------------|-----------------|
| 1 | Baseline re-audit | `deno run -A tools/fitness/release-readiness.ts --out .llm/tmp/run/feat-package-quality--supervisor/audit --include-plugins` | current per-unit state in this repo |
| 2 | Per-unit slow-types | `deno publish --dry-run --allow-dirty` in each wave unit | 0 slow-types |
| 3 | Doc lint | `deno doc --lint <unit>/mod.ts` | clean |
| 4 | Standards + doctrine | `tools/fitness/check-netscript-standards.ts` + `deno task arch:check` | clean for the wave |
| 5 | Wave tests | `deno test --allow-all <wave units>` | green |
| 6 | Post-merge workspace | `deno task check` on `feat/package-quality` | green |
| 7 | Program exit | all 27 units publish-clean; workspace check + affected tests green | green |

## Risks

- **Stale audit misleads scope.** Mitigation: Wave 0 re-audit before any refactor.
- **`fresh` (11.7k LOC) is the long pole.** Mitigation: it sits in Wave 5; budget
  it as the largest restructure; split per the nested `plan_fresh.md`.
- **`isolatedDeclarations` surfaces new errors per unit.** Mitigation: it is
  already on at root from genesis; fix per unit as part of the slow-type pass.
- **Base drift from S2/S3 landing in parallel.** Mitigation: follow
  `supervisor.md` § 5 base-sync before each wave; log syncs in `worklog.md`.

## Dependencies

- **Upstream**: S0 (done — this repo exists and builds). S2 is parallel; S1
  consumes its `isolatedDeclarations` (already applied) and does not wait for the
  `bump-version`/`deno ci` wiring.
- **Nested authority**:
  `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
  (carried into this repo).
- **Quality bar**: `docs/architecture/STANDARDS.md`,
  `docs/architecture/PUBLIC-SURFACE-PATTERNS.md`,
  `docs/architecture/doctrine/01..10`, and the nested `harmonisation/` docs.
- **Toolchain note**: `.llm/tmp/run/master--public-release-program/notes/TOOLCHAIN-2.8.md`.
- **Downstream**: S4 (runnable surface) and S5 (stable API) depend on S1.

## Drift Watch

- Any unit whose 2026-05 verdict no longer matches its post-PR#84 shape.
- Any unit that needs a structural change beyond its wave to clear slow-types
  (escalate per `supervisor.md` § 4 rather than expanding the wave silently).
- Confirmation that the unit count stays 27 (no stray publishable member appears
  or disappears between waves).
