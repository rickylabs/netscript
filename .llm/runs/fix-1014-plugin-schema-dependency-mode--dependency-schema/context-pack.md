# Context Pack: dependency-mode plugin Prisma schema resolution

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1014-plugin-schema-dependency-mode--dependency-schema` |
| Branch | `fix/1014-plugin-schema-dependency-mode` |
| Current phase | `evaluate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

Research and design are locked. The reported defect reproduces at the kernel copier boundary, and
JSR 0.0.2 metadata proves the required package files exist. No implementation files have changed.
Implementation and generator gates are complete. Published package fragments are resolved through
the injected JSR fetcher, take precedence over copied placeholders, retain the root target layout,
and fail loudly only for actual JSR dependency installs that require DB and declare migrations.

## Completed

- Skills/doctrine/harness bootstrap.
- Clean baseline and direct zero-copy reproduction.
- Static call-graph verification and 0.0.2 published-file mapping.
- Plan/design artifacts.
- Owner-approved one-row replan and implementation.
- Focused tests: 46 passed / 56 steps / 0 failed.
- Scoped check and lint PASS; TS-only fmt PASS; quality gate PASS.

## In Progress

- Awaiting Opus 5 supervisor slice review / IMPL-EVAL.

## Next Steps

1. Commit the implementation and evidence locally without push/PR.
2. Opus 5 supervisor performs slice review / IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Package metadata fragments win when present | plan D3 | Avoids placeholder shadowing. |
| Migration capability is declaration signal | plan D4 | Backward-compatible with 0.0.2. |
| Local copied-source remains fallback | plan D1/D3 | Empty local metadata remains supported. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1014-plugin-schema-dependency-mode--dependency-schema/*` | new | Harness bootstrap, research, plan, design. |
| `packages/cli/src/public/infra/jsr/verify-jsr-package-integrity.ts` | changed | Published Prisma path discovery/fetch helper. |
| `packages/cli/src/kernel/adapters/plugin/db-integration.ts` | changed | Package-first source selection, target write helper, typed missing-schema error. |
| `packages/cli/src/public/features/plugins/install/install-plugin.ts` | changed | JSR descriptor/fetcher wiring; no-DB and dry-run preserve early exits. |
| `packages/cli/src/{kernel,public}/**/*_test.ts` | changed | Semantic acceptance coverage. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS with one unrelated broad-fmt finding | check/lint/TS fmt clean; broad fmt flags existing CLI E2E README Markdown |
| Fitness | PASS | `quality:gate` exit 0; existing warnings only |
| Runtime | PASS | focused command: 46 passed / 56 steps |
| Consumer | PASS (semantic substitute) | JSR-shaped `installPlugin` writes real Saga fragment |

## Open Questions

- None blocking implementation.

## Drift and Debt

- Drift: owner-prohibited PR/push overrides normal harness commit trail; the retired evaluator
  blocker is superseded by the Opus 5 owner waiver; userland E2E is local-path-only.
- Debt: no new architecture debt planned.

## Commits

- Local branch commits only; owner explicitly prohibited PR/push.
