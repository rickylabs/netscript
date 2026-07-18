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

Group Plan-Gate passed with D1–D9 locked. Slice 1 implements the public desktop runtime contract and
is stopped at its Tier-A review boundary; slices 2 and 3 have not started.

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

## In Progress

- Tier-A review of implementation slice 1 by the Fable 5 orchestrator.

## Next Steps

1. Wait for explicit slice-1 Tier-A PASS or address requested changes.
2. Only after PASS, begin slice 2 L2 registry components and island work.

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

## Gates

| Gate family | Current status | Evidence                                                                                           |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------- |
| Static      | PASS           | Scoped check/lint/fmt, new-export doc lint, package dry-run.                                       |
| Fitness     | PARTIAL        | `quality:scan` passes; root `arch:check` stops on unchanged integration-base SDK range divergence. |
| Runtime     | PASS           | Six desktop tests plus full 144-test Fresh UI directory; #457 remains external.                    |
| Consumer    | NOT_RUN        | L2 gallery consumer belongs to slices 2–3.                                                         |

## Open Questions

- Tier-A disposition of the unchanged root `arch:check` baseline failure.

## Drift and Debt

- Drift: integration-base corrections, JSR baseline, and root architecture-gate baseline failure are
  recorded.
- Debt: none introduced; existing baseline is bounded and must not worsen.

## Commits

- See the draft PR's commit list + per-slice PR comments.
