# Context Pack: NetScript Ecosystem 0.0.1-alpha.0 JSR Release

## Run Identity

| Field | Value |
|-------|-------|
| Run ID | `copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release` |
| Branch | `copilot/evaluate-every-package-jsr-release` |
| Phase | docs-only multi-target evaluate-then-plan |
| Profile hint | `package` |

## Quick Start (for resumption)

1. Read this file.
2. Read `PLAN.md`.
3. Read `worklog.md` §"Slice progress" for current slice.
4. If resuming the evaluator pass: pick the next package row in `PLAN.md` archetype matrix and
   produce its `evaluate_<pkg>.md`.
5. If resuming the planner pass: pick the next package row and produce its `plan_<pkg>.md`.
6. If resuming the master plan: produce `PLAN.md` consuming all per-package plans.

## State

| Item | State |
|------|-------|
| `plan.md` | written |
| `worklog.md` | written (Design checkpoint complete) |
| `drift.md` | written (10 entries — added DRIFT-010) |
| `commits.md` | seeded; updated each progress report |
| Per-package evaluations | **complete** — 23 packages + 5 plugins = 28 targets |
| Per-package plans | **complete** — 23 packages + 5 plugins = 28 targets |
| Plugin evaluations + plans | **complete** — 5 plugins each (28 targets total) |
| `PLAN.md` master | **complete** — wave plan, `/docs` contract, dep graph, monorepo handoff, alpha→beta→stable cadence |

## Wave Order (from `PLAN.md`)

0 shared → 1 contracts/config/runtime-config/streams → 2 logger/telemetry/aspire →
3 kv/queue/cron/database+prisma-adapter-mysql → 4-prelude plugin+plugin-hello-world →
4 watchers/(plugin-streams)/triggers+plugin/workers+plugin/sagas+plugin → 5 service/sdk/fresh+fresh-ui →
6 cli

## Key inputs

- `.llm/research/architecture-doctrine-docs-v2/doctrine/10-codebase-verdict-and-handoff.md` — per-package verdict table.
- `.llm/harness/archetypes/README.md` — archetype decision tree.
- `.llm/harness/archetypes/ARCHETYPE-{1..6}*.md` — per-archetype profiles.
- `.llm/harness/gates/archetype-gate-matrix.md` — required gates per archetype.
- `.llm/harness/templates/{evaluate,plan}.md` — artifact templates.
- `.llm/harness/debt/arch-debt.md` — open debt; closed entries note new locations.
- `packages/cli/{README.md,deno.json,docs/}` — quality bar reference.

## Key outputs (this run)

- `evaluate_<pkg>.md` × 23 packages + 5 plugins = 28 targets.
- `plan_<pkg>.md` × 23 packages + 5 plugins = 28 targets.
- `PLAN.md` master.

## Decisions on file

- Single-session evaluator + planner per user direction (DRIFT-001).
- Quality bar = `@netscript/cli` v1.0.0.
- Alpha version pin = `0.0.1-alpha.0` across all packages.
- Linked package + plugin pairs ship in the same wave.

## Open questions for evaluator

None for this run — the evaluator session will run when individual implementation runs follow.

---

## Deeper-pass update — 2026-05-04

The user requested an additional pass with: real fitness gates run, JSR + doctrine
+ standards readiness scripts, public-surface refactor proposals, target folder
trees, public surface stubs, and test plans for every package.

### Tooling added (now reusable repo-wide)

- `.llm/tools/fitness/audit-jsr-package.ts` — JSR readiness per package
- `.llm/tools/fitness/check-doctrine.ts` — doctrine readiness per package
- `.llm/tools/fitness/check-netscript-standards.ts` — standards readiness per package
- `.llm/tools/fitness/release-readiness.ts` — unified master runner
- `.llm/tools/fitness/audit-all-packages.ts` — batch JSR audit
- `.llm/tools/fitness/generate-package-plans.ts` — generates per-package plan/evaluate
  docs from audit data

### Authoritative documents

- **`PLAN.md`** — master 6-wave release plan, alpha quality bar, archetype mapping
- **`harmonisation/STANDARDS.md`** — repo-wide naming + deno.json + mod.ts +
  README + tests + observability
- **`harmonisation/DOCS-STRUCTURE.md`** — `/docs/` layout + frontmatter + auto-gen
  reference pipeline
- **`harmonisation/PUBLIC-SURFACE-PATTERNS.md`** — function family / builder /
  abstract base / DSL / registry, with concrete stubs

### Authoritative data (do not duplicate into plans — link only)

- **`audit/readiness/_summary.md`** — single mechanical truth source per package
- **`audit/readiness/jsr/<pkg>.json`** — JSR finding detail
- **`audit/readiness/doctrine/<pkg>.json`** — doctrine finding detail
- **`audit/readiness/standards/<pkg>.json`** — standards finding detail
- **`audit/dry-run/<pkg>.txt`** — raw `deno publish --dry-run` per package
- **`audit/JSR-DRY-RUN-MATRIX.md`** — pass/fail + slow-type counts table

### How to resume / refresh

1. Re-run readiness:  
   `deno run -A .llm/tools/fitness/release-readiness.ts --out .llm/tmp/run/<run-id>/audit/readiness --include-plugins --no-dry-run`
2. Re-run dry-runs (slow):  
   `deno run -A .llm/tools/fitness/audit-all-packages.ts --out .llm/tmp/run/<run-id>/audit --include-plugins`
3. Regenerate per-package plans:  
   `deno run -A .llm/tools/fitness/generate-package-plans.ts --run .llm/tmp/run/<run-id>`

### Evaluator pass (separate session)

The evaluator (separate harness session, per skill rule §7) verifies:
- Every per-package plan's claims match the readiness JSON.
- The 9-bullet alpha DX bar in `PLAN.md` § 12 is reachable for each package.
- The harmonisation standards apply uniformly across the 28 units.
