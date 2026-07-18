# Context Pack: fresh-ui desktop components

## Run Metadata

| Field          | Value                                       |
| -------------- | ------------------------------------------- |
| Run ID         | `beta11-cli--orchestrator/slices/g5-843-ui` |
| Branch         | `feat/desktop-frontend-843-ui`              |
| Current phase  | `gate`                                      |
| Archetype      | `4 - Public DSL / Builder`                  |
| Scope overlays | `frontend`                                  |

## Current State

Group Plan-Gate passed with D1–D9 locked. Slices 1 and 2 are implemented; slice 2 is stopped at its
Tier-A review boundary. Slice 3 has not started.

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

## In Progress

- Tier-A review of implementation slice 2 by the Fable 5 orchestrator.

## Next Steps

1. Wait for explicit slice-2 Tier-A PASS or address requested changes.
2. Only after PASS, begin slice 3 scaffold design-gallery and documentation work.

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

## Gates

| Gate family | Current status | Evidence                                                                               |
| ----------- | -------------- | -------------------------------------------------------------------------------------- |
| Static      | PASS           | Scoped check/lint/fmt, new-export doc lint, package dry-run.                           |
| Fitness     | PASS           | DS scans, `quality:scan`, and root `arch:check` pass.                                  |
| Runtime     | PASS           | Full 151-test Fresh UI directory and 66 focused registry tests; #457 remains external. |
| Consumer    | PARTIAL        | Generated-copy fidelity passes; real scaffold gallery belongs to slice 3.              |

## Open Questions

- Tier-A disposition of slice 2.

## Drift and Debt

- Drift: integration-base corrections, JSR baseline, architecture-gate resolution, and rebase SHA
  rewrite are recorded.
- Debt: none introduced; existing baseline is bounded and must not worsen.

## Commits

- See the draft PR's commit list + per-slice PR comments.
