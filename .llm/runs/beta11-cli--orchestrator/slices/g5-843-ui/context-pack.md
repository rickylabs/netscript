# Context Pack: fresh-ui desktop components

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g5-843-ui` |
| Branch         | `feat/desktop-frontend-843-ui`              |
| Current phase  | `evaluate`                                  |
| Archetype      | `4 - Public DSL / Builder`                  |
| Scope overlays | `frontend`                                  |

## Current State

Group Plan-Gate and Tier-A reviews for slices 1 and 2 passed. All three implementation slices are
complete and the run is stopped for supervisor-dispatched IMPL-EVAL.

## Completed

- Activated all requested skills and read the run-loop plus authority chains.
- Rebased the worktree onto current integration `1709dcba` (including #456, #841, and #842).
- Inspected live #843/#840, merged dependency surfaces, POC/RFC, Deno desktop APIs,
  registry/consumer topology, doctrine, and current JSR baseline.
- Locked architecture, public vocabulary, three commit slices, and gate matrix.
- Implemented the browser-safe `@netscript/fresh-ui/desktop` lifecycle, structural native capability
  types, declarative tray/application menus, dialogs, notifications, documented window actions, and
  deterministic tests.
- Passed the full Fresh UI test directory (144 tests), scoped check/lint/fmt, new-export doc lint,
  package dry-run, and `quality:scan`.
- Received Tier-A PASS for slice 1, rebased onto the supervisor's integration fix `46e50cf2`, and
  confirmed root `arch:check` now passes.
- Added the L2 desktop window chrome, exhaustive update-ready prompt, hydration-safe desktop-only
  island, token CSS, desktop registry collection/generated embeds, and full-dir tests.
- Passed 151 full Fresh UI tests, 66 focused registry tests, DS fitness, JSR checks, scoped static
  checks, `quality:scan`, and root `arch:check`.
- Received Tier-A PASS for slice 2.
- Added the self-contained D3/D4 tray/menu, dialog, and notification controls; extended the desktop
  and scaffold foundation collections; regenerated registry and CLI embeds.
- Added the real design-gallery examples and “Building a desktop frontend the NetScript way” docs
  page with navigation/xref entries.
- Passed 154 full Fresh UI tests, 69 focused registry tests, docs verification, real-browser desktop
  gallery proof, all static/DS/JSR/quality/architecture gates, and `scaffold.runtime` 60/60.

## In Progress

- Supervisor-dispatched IMPL-EVAL; this implementation session will not dispatch it.

## Next Steps

1. Run opposite-family IMPL-EVAL from the supervisor-owned evaluator session.
2. Address only an explicit evaluator or supervisor finding; do not merge or release from G5.

## Key Decisions

| Decision                          | Source                        | Notes                                                       |
| --------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| Archetype 4 with frontend overlay | doctrine + plan               | Adapter behavior stays bounded inside a public DSL package. |
| Explicit `./desktop` entrypoint   | plan D1                       | Root export remains environment-neutral.                    |
| Structural capability, no port    | plan D2/D5                    | One implementation and deterministic tests.                 |
| Scaffold gallery as L2 consumer   | fresh-ui-horizontal + plan D9 | Real browser proof, not native smoke.                       |

## Files Changed

| Path                                                   | Status  | Notes                                                 |
| ------------------------------------------------------ | ------- | ----------------------------------------------------- |
| `.llm/runs/beta11-cli--orchestrator/slices/g5-843-ui/` | changed | Slice-1 gate evidence and drift.                      |
| `packages/fresh-ui/deno.json`                          | changed | Adds explicit `./desktop` export.                     |
| `packages/fresh-ui/desktop.ts`                         | new     | Documented public entrypoint.                         |
| `packages/fresh-ui/src/desktop/`                       | new     | Contracts, constants, and structural runtime adapter. |
| `packages/fresh-ui/tests/desktop/`                     | new     | Full slice-1 behavior and web/no-op tests.            |
| `packages/fresh-ui/registry/components/ui/desktop-*`   | new     | L2 window chrome and update prompt TSX/CSS pairs.     |
| `packages/fresh-ui/registry/islands/DesktopOnly.tsx`   | new     | Hydration-safe structural desktop gate.               |
| `packages/fresh-ui/registry.manifest.ts`               | changed | Desktop items and collection.                         |
| `packages/fresh-ui/registry.generated.ts`              | changed | Deterministically regenerated embedded copies.        |
| `packages/fresh-ui/tests/registry/`                    | changed | Full component and island behavior/copy tests.        |
| `deno.lock`                                            | changed | Exact SDK subpath dependency resolution.              |
| `packages/cli/src/kernel/assets/app/`                  | changed | Desktop copies exposed in the real scaffold gallery.  |
| `packages/cli/src/kernel/assets/embedded.generated.ts` | changed | Regenerated CLI template embeds.                      |
| `docs/site/how-to/build-a-desktop-frontend.md`         | new     | Desktop frontend composition recipe.                  |
| `docs/site/_data.ts`, `_data/xref.ts`                  | changed | Docs navigation and cross-reference.                  |

## Gates

| Gate family | Current status | Evidence                                                                      |
| ----------- | -------------- | ----------------------------------------------------------------------------- |
| Static      | PASS           | Scoped check/lint/fmt, new-export doc lint, package dry-run.                  |
| Fitness     | PASS           | DS scans, `quality:scan`, and root `arch:check` pass.                         |
| Runtime     | PASS           | 154 full Fresh UI tests and 69 focused registry tests; #457 remains external. |
| Consumer    | PASS           | Real browser gallery proof and full scaffold runtime 60/60.                   |

## Open Questions

- IMPL-EVAL verdict, owned by the supervisor-dispatched evaluator.

## Drift and Debt

- Drift: integration-base corrections, JSR baseline, architecture-gate resolution, and rebase SHA
  rewrite are recorded.
- Debt: none introduced; existing baseline is bounded and must not worsen.

## Commits

- See the draft PR's commit list + per-slice PR comments.
