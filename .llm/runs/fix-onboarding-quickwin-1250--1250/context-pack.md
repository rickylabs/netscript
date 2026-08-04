# Context Pack: restore Zod-4 OpenAPI query coercion (#1250)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-onboarding-quickwin-1250--1250` |
| Branch | `fix/onboarding-quickwin-1250` |
| Current phase | `plan-eval` (composed) |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `service` |

## Current State

Issue #1250 is re-baselined at current `origin/main`; the plan is locked under the owner-authorized
milestone composition rule. No product source has been modified yet.

## Completed

- Read issue body, relevant skills, harness authorities, doctrine, package surface, tests, and
  upstream oRPC Zod-4 export.
- Recorded the inherited unrelated `deno.lock` change.

## In Progress

- Open the draft PR from the bootstrap commit, then add the red/green behavior regression.

## Next Steps

1. Commit and push run bootstrap; open draft PR.
2. Add the HTTP regression and capture pre-fix failure.
3. Switch to the Zod-4 plugin, run targeted gates, and update evidence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Alias Zod-4 experimental export | upstream API inspection | Internal-only name adaptation. |
| Test actual query transport | issue #1250 | Prevents present-but-inert false green. |
| Preserve dirty lockfile | owner + AGENTS.md | Never stage it. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-onboarding-quickwin-1250--1250/**` | new | Harness activation and locked plan. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | plan |
| Fitness | pending | plan |
| Runtime | pending | plan |
| Consumer | pending | plan |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: authorized milestone evaluation composition; inherited lock modification.
- Debt: no new/deepened debt expected.

## Commits

- See the draft PR's commit list + per-slice PR comments.

