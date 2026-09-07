# Context Pack: remote session-verifying AuthenticatorPort (#1383 partial)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `remote-session--1383` |
| Branch         | `feat/remote-session-authenticator` (baseline `3330d6f9c`, HEAD `4adb5ef95` = run dir only) |
| Current phase  | `plan` — awaiting PLAN-EVAL in a separate non-Anthropic session |
| Archetype      | 2 (auth-core adapter) + 5 (plugin re-export) |
| Scope overlays | service |

## Current State

Plan artifacts are complete; no product code exists on the branch. The plan places the remote
session authenticator in `packages/plugin-auth-core/src/adapters/` (export `./authenticator`) with a
thin `@netscript/plugin-auth/authenticator` re-export named `createAuthServiceAuthenticator`, uses
the typed SDK client + bearer contribution (`direct-only`), validates with `SessionResponseSchema`,
denies rejected/expired/inconsistent sessions, and throws on unavailable/malformed remote answers so
the #2001 middleware returns a redacted 503.

## Completed

- Research (`research.md`, F1–F17; F8/F17 carry the coordinator's baseline probe and test receipt) including dependency-cycle facts and generator discovery-key evidence.
- Plan with locked decisions L1–L11, open-decision sweep, slices S0–S4, validation plan, IMPL-EVAL scope.
- Design checkpoint in `worklog.md`; drift log.

## In Progress

- Nothing. Hard stop at PLAN-EVAL.

## Next Steps

1. Coordinator dispatches PLAN-EVAL (`muse_spark_1_3@max → grok_4_6@high`, separate session) reading
   `research.md`, `plan.md`, `worklog.md` § Design, `gates/plan-gate.md`.
2. Coordinator answers OQ1 (default discovery name), OQ2 (timeout default), and records OQ3 as a
   step-4 dependency on #1383.
3. On `PASS`: open the draft PR (`Part of #1383`, no closing keyword, milestone 0.0.8, labels per L10),
   then implement S0→S4 on the implementation route (`astra@medium → fable_5_1@medium`).

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Owner package = auth-core; plugin-auth re-exports | doctrine verdict, F10/F12 | no new edge, no cycle |
| Throw → 503, deny → 401 | #2001 (`64e6c4c74`) | never relabel outage as bad credential |
| `serviceName` required; no invented default | brief | OQ1 pending |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/remote-session--1383/*.md` | new | planning artifacts only |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | NOT_RUN | — |
| Fitness | NOT_RUN | — |
| Runtime | N/A | no runtime change |
| Consumer | NOT_RUN | — |

## Open Questions

- OQ1 default `serviceName` (`auth` vs `auth-api`); OQ2 timeout default; OQ3 auth service bearer
  mapping on `/session`; OQ4 principal scheme confirmation.

## Drift and Debt

- Drift: see `drift.md` (4 entries). Debt: none created.

## Commits

- None beyond the coordinator's bootstrap commit; the draft PR commit list is the trail once opened.
