# Context Pack: managed form redirect navigation strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1569-form-redirect-nav-strategy--codex` |
| Branch | `fix/1569-form-redirect-nav-strategy` |
| Current phase | `plan` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Clean baseline is verified. Research and design are locked; implementation has not started.

## Completed

- Read requested skills, harness workflow, Archetype 4, frontend overlay, doctrine, JSR audit, PR
  rules, and Playwright CLI guidance.
- Verified plain Preact omits boolean false while real Fresh SSR emits the literal string false.
- Located Fresh client lookup at `@fresh/core@2.3.3/src/runtime/client/partials.ts:41-45`.
- Selected public `{ navigation: 'client' | 'document' }` strategy.

## In Progress

- Bootstrap commit and draft PR creation.

## Next Steps

1. Commit/push bootstrap and open the draft PR.
2. Add named failing SSR/state/browser tests and capture red output.
3. Implement the public strategy and documentation.
4. Run every required gate and update PR/run evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Literal false transport mapping | Fresh reviver + SSR hooks | Actual Fresh accepts boolean false, but literal output is robust outside its SSR hook too. |
| Default omission | existing behavior | Preserves inherited body opt-in. |
| No local evaluation | owner directive | Automatic lifecycle only. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1569-form-redirect-nav-strategy--codex/*` | new | Harness bootstrap artifacts. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | not run | implementation pending |
| Fitness | not run | implementation pending |
| Runtime/browser | not run | implementation pending |
| Consumer | not run | implementation pending |

## Open Questions

- None that force implementation rework.

## Drift and Debt

- Drift: actual Fresh SSR makes boolean false sufficient; issue wording was plain-Preact-specific.
- Debt: none created.

## Commits

- See the draft PR's commit list + per-slice PR comments.

