# Phase Group Registry: package-quality

The group map for the S1 supervisor run. See `.llm/harness/workflow/supervisor.md`.
One section per **phase group** (= one wave: branch + worktree + nested run +
sub-PR + evaluator pass).

> S1 runs in the **new repo** (`rickylabs/netscript`). The per-package authority
> is the nested canonical run
> `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`
> — each wave consumes the matching `evaluate_<unit>.md` / `plan_<unit>.md`; it
> does not rewrite them. The 2026-05 counts are **stale** post-PR#84 and are
> re-measured at Wave 0.

## Run Metadata

| Field | Value |
|-------|-------|
| Supervisor run ID | `feat-package-quality--supervisor` |
| Integration branch | `feat/package-quality` |
| Base branch | `feat/repo-genesis` (rebase onto `main` if new-repo PR #1 merges first) |
| Surface | 27 publishable units (23 packages + 4 plugins), all `0.0.1-alpha.0` |
| Canonical nested run | `…/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/` |

## Status Legend

| Status | Meaning |
|--------|---------|
| `planned` | In the map, not started |
| `active` | Group branch/worktree launched; implementation in progress |
| `evaluating` | Handed to a separate evaluator session |
| `merged` | Evaluator `PASS` (or accepted `FAIL_DEBT`); merged `--no-ff` |
| `blocked` | Waiting on a dependency or a user decision |
| `rescope` | Under rescope (see `escalations/`) |

## Wave 0 — Foundation

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave0-foundation` |
| Nested run ID | `feat-package-quality-wave0-foundation--<suffix>` |
| Units | `@netscript/shared` |
| Archetype(s) | A1 — small-contract |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- On `feat/package-quality` (off `feat/repo-genesis`); workspace `deno task check` green at baseline.
- **Baseline re-audit run first** (`tools/fitness/release-readiness.ts`), delta vs the 2026-05 inventory logged in `drift.md`.

### Inherited debt

- None upstream. Owns the surface-reconciliation note (29→27 units) for the whole run.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 0) + `evaluate_shared.md` + `plan_shared.md`
- `docs/architecture/STANDARDS.md` § 6–7; `docs/architecture/PUBLIC-SURFACE-PATTERNS.md`

### Surfaces touched

- `packages/shared/` (the type substrate every other unit depends on)

### Success criteria

- `@netscript/shared`: `deno publish --dry-run` 0 slow-types; `deno doc --lint` clean; README ≥ 150 LOC; `/docs` per STANDARDS; archetype A1 matrix green.

### Notes

- Foundation-first: no other wave starts until Wave 0 is `merged`. It also fixes the run-wide baseline numbers everything downstream trusts.

## Wave 1 — Contracts & schemas (A1)

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave1-contracts` |
| Nested run ID | `feat-package-quality-wave1-contracts--<suffix>` |
| Units | `@netscript/runtime-config`, `@netscript/config`, `@netscript/contracts` |
| Archetype(s) | A1 — small-contract (config/contracts are A1/A4 hybrids — see nested docs) |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Wave 0 `merged`.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 1) + `evaluate_{runtime-config,config,contracts}.md` + matching `plan_*`

### Surfaces touched

- `packages/runtime-config/`, `packages/config/`, `packages/contracts/`

### Success criteria

- All three: 0 slow-types dry-run, `doc --lint` clean, README/`docs` per STANDARDS, archetype matrix green.

### Notes

- Pure type/schema packages most of the tree depends on; align `defineContract` with the platform `definePlugin`/`defineTrigger` shapes per nested `plan_contracts.md`.

## Wave 2 — Integration adapters (A2)

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave2-adapters` |
| Nested run ID | `feat-package-quality-wave2-adapters--<suffix>` |
| Units | `@netscript/logger`, `@netscript/telemetry`, `@netscript/aspire`, `@netscript/kv`, `@netscript/database`, `@netscript/prisma-adapter-mysql`, `@netscript/queue`, `@netscript/cron` |
| Archetype(s) | A2 — integration |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Wave 1 `merged`.

### Inherited debt

- Foundation-alpha debt from the platform rewrite touches `telemetry` (instrumentation) and `aspire` (`./helpers` subpath) — close where this wave touches them, else carry forward in `arch-debt.md`.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 2, dependency order) + per-unit `evaluate_*`/`plan_*`

### Surfaces touched

- `packages/{logger,telemetry,aspire,kv,database,prisma-adapter-mysql,queue,cron}/`

### Success criteria

- Each unit: 0 slow-types, `doc --lint`, README/`docs`, archetype A2 matrix; each adapter ships a `./testing` port-contract entrypoint per nested PLAN § 4 Wave 2.

### Notes

- Implement in the dependency order in the nested PLAN (logger → telemetry → aspire → kv → database → prisma-adapter-mysql → queue → cron).

## Wave 3 — Plugin runner

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave3-plugin` |
| Nested run ID | `feat-package-quality-wave3-plugin--<suffix>` |
| Units | `@netscript/plugin` |
| Archetype(s) | A4 — dsl-builder (plugin host) |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Wave 2 `merged`.

### Phase 0 reading

- Nested `evaluate_plugin.md` + `plan_plugin.md`; platform-rewrite final state (`netscript-start` PR #90/#96)

### Surfaces touched

- `packages/plugin/`

### Success criteria

- `@netscript/plugin`: 0 slow-types, `doc --lint`, README/`docs`, archetype matrix. Largely cleaned during the platform rewrite — **verify, do not assume**.

### Notes

- `plugins/hello-world` is **gone** (replaced by the `netscript plugin scaffold` template); the nested Wave 3 "hello-world" line does not apply here — log the delta.

## Wave 4 — Runtimes & their plugins

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave4-runtimes` |
| Nested run ID | `feat-package-quality-wave4-runtimes--<suffix>` |
| Units | `@netscript/plugin-streams-core`, `@netscript/plugin-workers-core`, `@netscript/plugin-sagas-core`, `@netscript/plugin-triggers-core`, `@netscript/watchers`, `@netscript/plugin-streams`, `@netscript/plugin-workers`, `@netscript/plugin-sagas`, `@netscript/plugin-triggers` |
| Archetype(s) | A1/A4 (`*-core`), A3 (`watchers`), A5 (`plugins/*`) |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Wave 3 `merged`.

### Inherited debt

- These units were rebuilt in the platform rewrite (`netscript-start` PR #88/#91/#92/#93/#94); most reached 0 slow-types there. This wave is **verification + docs parity**, escalating only real regressions.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 4) + `evaluate_{streams,workers,sagas,triggers}.md` + `plugin-*` evaluate/plan; reconcile names to `*-core`

### Surfaces touched

- `packages/plugin-{streams,workers,sagas,triggers}-core/`, `packages/watchers/`, `plugins/{streams,workers,sagas,triggers}/`

### Success criteria

- Each core+plugin: 0 slow-types, `doc --lint`, README/`docs`, archetype matrix; released as atomic core+plugin sub-waves (streams, workers, sagas, triggers) + `watchers`.

### Notes

- Largest reconciliation surface (old `@netscript/{streams,triggers,workers,sagas}` packages → `*-core`). Confirm the nested per-package docs map cleanly; log every rename in `drift.md`.

## Wave 5 — Application surfaces (A4)

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave5-apps` |
| Nested run ID | `feat-package-quality-wave5-apps--<suffix>` |
| Units | `@netscript/sdk`, `@netscript/service`, `@netscript/fresh`, `@netscript/fresh-ui` |
| Archetype(s) | A4 — dsl/app |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Wave 4 `merged`.

### Phase 0 reading

- Nested `PLAN.md` § 4 (Wave 5) + `evaluate_{sdk,service,fresh,fresh-ui}.md` + matching `plan_*`

### Surfaces touched

- `packages/{sdk,service,fresh,fresh-ui}/`

### Success criteria

- Each unit: 0 slow-types, `doc --lint`, README/`docs`, archetype matrix. `@netscript/fresh` (≈11.7k LOC) is the long pole — split per nested `plan_fresh.md`.

### Notes

- `fresh` is the largest restructure on the board; budget accordingly. Migrate route/handler code that belongs to `service` per the nested plan.

## Wave 6 — Tooling

| Field | Value |
|-------|-------|
| Group branch | `feat/package-quality-wave6-cli` |
| Nested run ID | `feat-package-quality-wave6-cli--<suffix>` |
| Units | `@netscript/cli` |
| Archetype(s) | A6 — cli-tooling |
| Status | `planned` |
| Merge commit | — |

### Pre-conditions

- Waves 0–5 `merged` (CLI references every other unit at `0.0.1-alpha.0`).

### Phase 0 reading

- Nested `evaluate_cli.md` + `plan_cli.md`; nested PLAN § 6 (the CLI quality bar) + § 9 (CLI dry-run false positive)

### Surfaces touched

- `packages/cli/` (and `packages/cli/e2e/` as the workspace member, non-publishable)

### Success criteria

- `@netscript/cli`: 0 slow-types (watch the documented `--dry-run` false positive in nested PLAN § 9), `doc --lint`, README/`docs`, archetype A6 matrix. It is also the docs-site source of truth for S5.

### Notes

- Shipped last by design. Do not bump scaffold templates to `jsr:` refs here — that is S3 (publish) territory; S1 stops at publish-clean.

---

## Summary Table

| Wave | Status | Depends on | Units | Merge commit |
|------|--------|-----------|-------|--------------|
| 0 — Foundation | `planned` | none | shared | — |
| 1 — Contracts & schemas | `planned` | 0 | runtime-config, config, contracts | — |
| 2 — Integration adapters | `planned` | 1 | logger, telemetry, aspire, kv, database, prisma-adapter-mysql, queue, cron | — |
| 3 — Plugin runner | `planned` | 2 | plugin | — |
| 4 — Runtimes & plugins | `planned` | 3 | plugin-{streams,workers,sagas,triggers}-core, watchers, plugin-{streams,workers,sagas,triggers} | — |
| 5 — Application surfaces | `planned` | 4 | sdk, service, fresh, fresh-ui | — |
| 6 — Tooling | `planned` | 0–5 | cli | — |

Unit count: 1 + 3 + 8 + 1 + 9 + 4 + 1 = **27**.

## Base-Sync Log

| Date | Base sha merged | Result | Notes |
|------|-----------------|--------|-------|
| — | — | — | (sync base into `feat/package-quality` before each wave; see `supervisor.md` § 5) |
