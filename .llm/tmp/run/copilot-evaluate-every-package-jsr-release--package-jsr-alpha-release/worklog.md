# Worklog: NetScript Ecosystem 0.0.1-alpha.0 JSR Release

## Design

This is a docs-only multi-target run. The "implementation" produced by this run is the harness
artifact set that scopes the alpha cut. Per `workflow/run-loop.md` §2a, the Design checkpoint must
declare public surface, vocabulary, ports, constants, slices, deferred scope, and contributor path.
The "files" introduced are markdown artifacts in this run directory.

### Public surface

The artifacts produced by this run are:

- `plan.md` — the run plan (already created).
- `worklog.md` — this file.
- `context-pack.md` — resumable summary for the eventual evaluator session.
- `drift.md` — drift log including process drift (single-session evaluator).
- `commits.md` — commit list.
- `evaluate_<pkg>.md` × 24 packages + 5 plugins.
- `plan_<pkg>.md` × 24 packages + 5 plugins.
- `PLAN.md` — master release plan.

External consumers are: (a) the future generator session that implements each per-package refactor;
(b) the future evaluator session that re-evaluates each package against this plan; (c) the
maintainer who triggers the JSR alpha cut; (d) the future website, which sources the per-package
`docs/` corpus this plan defines.

### Domain vocabulary

| Term | Definition |
|------|------------|
| **Wave** | A coordinated batch of packages released to JSR at the same time with the same version pin. |
| **Quality bar** | `@netscript/cli` v1.0.0 — the structural reference every other package matches. |
| **Linked package** | A `packages/*` whose runtime is exposed via a `plugins/*`. The pair must release in the same wave. |
| **Idiomatic docs/** | The per-package `docs/` shape defined in `PLAN.md` §"Documentation contract." |
| **Concept of done (alpha)** | F-1..F-18 + F-CLI-1..30 (where applicable) PASS or DEBT_ACCEPTED, README + `docs/` complete, `deno publish --dry-run` clean, JSR doc score 100, README archetype + permissions declared, version pinned `0.0.1-alpha.0`. |
| **JSR readiness gates** | F-5 public-surface audit, F-6 publishability, F-7 doc-score, F-8 workspace-lib check. |
| **Release group** | A package + its linked plugin (e.g. `@netscript/sagas` + `plugins/sagas`). |
| **Restructure verdict** | File-folder shape is wrong; needs archetype-shaped reorganization (file 10 §"Verdict per package"). |

### Ports

This run consumes (does not produce) the following abstractions:

- harness templates as input contracts;
- doctrine files as authority;
- `arch-debt.md` as the open-debt registry.

No new ports are introduced.

### Constants

The finite domain values that must be referenced by every artifact:

- archetype IDs: `1`, `2`, `3`, `4`, `5`, `6`, `special`;
- doctrine verdict values: `Keep`, `Refactor`, `Restructure`, `Rewrite`, `Defer`;
- evaluator verdict values: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, `FAIL_DEBT`;
- gate result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`;
- AP status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`;
- alpha version pin: `0.0.1-alpha.0`;
- monorepo handoff version: `0.0.1-alpha.0` across all packages.

### Commit slices

Each commit is its own slice and produces a coherent batch of artifacts.

| Slice | Purpose | Files | Gate |
|-------|---------|-------|------|
| 1 | Run skeleton | `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md` | template adherence |
| 2 | Archetype-1 evaluations + plans | `evaluate_streams.md`, `evaluate_runtime-config.md`, `evaluate_config.md`, `evaluate_contracts.md`, `plan_streams.md`, `plan_runtime-config.md`, `plan_config.md`, `plan_contracts.md` | template adherence |
| 3 | Archetype-2 evaluations + plans | aspire, cron, database, queue, kv, prisma-adapter-mysql, logger, telemetry × evaluate + plan | template adherence |
| 4 | Archetype-3 evaluations + plans | watchers, triggers, workers, sagas × evaluate + plan | template adherence |
| 5 | Archetype-4 evaluations + plans | fresh, fresh-ui, sdk, service, plugin × evaluate + plan | template adherence |
| 6 | Archetype-6 + special | cli (quality bar baseline), shared (rewrite) × evaluate + plan | template adherence |
| 7 | Plugin evaluations + plans | plugins/hello-world, plugins/sagas, plugins/streams, plugins/triggers, plugins/workers × evaluate + plan | template adherence + grouped-release linkage |
| 8 | Master `PLAN.md` | release waves, dependency graph, ideomatic `docs/` shape, monorepo handoff | release coherence |
| 9 | Close | update `context-pack.md` with final state and handoff to evaluator | resumable |

### Deferred scope

- Implementing any of the per-package refactors (each becomes a future harness run).
- Editing `arch-debt.md` (debt entries are recommended in plans, created when refactors land).
- Bumping any package version (version pin happens in implementation runs).
- Building or running fitness function scripts (Phase A note: scripts are pending).
- The doctrine handoff "engineering reference" (file 10 §"What the next engineering reference must
  contain") — that is a separate megadocument run.
- Evaluator-separation: the user explicitly requested a single session, so this run produces both
  evaluator and planner artifacts. Drift entry recorded.

### Contributor path

A contributor (or the future evaluator) reads:

1. `plan.md` for the run shape and per-target archetype matrix;
2. `worklog.md` (this file) for design intent;
3. `evaluate_<pkg>.md` for current state of any one package;
4. `plan_<pkg>.md` for the alpha cut plan for that package;
5. `PLAN.md` for the cross-package release order.

To extend: copy any `evaluate_*.md` + `plan_*.md` pair, replace the package name and per-package
fields, and update `PLAN.md` to add the package to a wave.

## Slice progress

| Slice | Status | Notes |
|-------|--------|-------|
| 1 Run skeleton | complete | `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, `commits.md` |
| 2 Archetype-1 | complete | evaluate_streams.md, evaluate_runtime-config.md, evaluate_config.md, evaluate_contracts.md, plan_streams.md, plan_runtime-config.md, plan_config.md, plan_contracts.md |
| 3 Archetype-2 | complete | aspire, cron, database, queue, kv, prisma-adapter-mysql, logger, telemetry × evaluate + plan |
| 4 Archetype-3 | complete | watchers, triggers, workers, sagas × evaluate + plan |
| 5 Archetype-4 | complete | fresh, fresh-ui, sdk, service, plugin × evaluate + plan |
| 6 Archetype-6 + special | complete | cli, shared × evaluate + plan |
| 7 Plugins | complete | hello-world, sagas, streams, triggers, workers × evaluate + plan |
| 8 Master PLAN.md | complete | release waves, dependency graph, ideomatic `docs/` shape, monorepo handoff |
| 9 Close | complete | update `context-pack.md` with final state |
| 10 Address FAIL_FIX | complete | All 29 findings closed, verdict changed to PASS |

## Gate Evidence (this run)

| Gate | Function | Result | Evidence |
|------|----------|--------|----------|
| Template adherence | every artifact matches its template | pending | populated when slices land |
| Doctrine alignment | archetype matches file 10 | PASS | per-target matrix in plan.md mirrors file 10 verdict table |
| Linkage | each plan references its evaluation | pending | populated when slices land |
| Release coherence | PLAN.md waves respect dependency graph | pending | gated on slice 8 |
| Grouped release | linked package+plugin pairs share a wave | pending | gated on slice 8 |
| JSR readiness coverage | every plan declares F-5/F-6/F-7 | pending | populated per-plan |
