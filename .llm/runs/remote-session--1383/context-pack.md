# Context Pack: remote session-verifying AuthenticatorPort + native `/session` bearer support (#1383 partial)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `remote-session--1383` |
| Branch         | `feat/remote-session-authenticator` (baseline `3330d6f9c`, HEAD `4adb5ef95` = run dir only) |
| Current phase  | `plan` (revision 2) — awaiting PLAN-EVAL in a separate non-Anthropic session |
| Archetype      | 2 (auth-core adapter) + 5 (plugin leaf and `session()` handler) |
| Scope overlays | service |

## Current State

Plan revision 2 is complete after coordinator review; no product code exists. The slice now covers
both halves of a working end state: the reusable `createAuthServiceAuthenticator` (auth-core, thin
plugin-auth leaf) and the minimum change that makes the native auth service honour request credentials over HTTP (existing
`currentAuthRequest()` bridge read at the existing context seam in `main.ts`) and `GET /session` honour a
strict bearer (`token` lookup). Acceptance is real typed-SDK HTTP → native plugin service → in-memory kv-oauth, no IdP.

## Completed

- Research F1–F22 including two runtime probes (handler-level by the coordinator, HTTP-level by the
  planner) that both show bearer verification returns `authenticated:false` at baseline.
- Plan with locked decisions L1–L13, closed decision sweep, slices S0–S5, validation plan, evaluation
  routing, IMPL-EVAL scope. Design checkpoint in `worklog.md`; drift log with rev-1 correction.

## In Progress

- Nothing. Hard stop at PLAN-EVAL.

## Next Steps

1. Coordinator dispatches PLAN-EVAL (`muse_spark_1_3@max → grok_4_6@high`, separate session, different
   family from Fable).
2. On `PASS`: open the draft PR (`Part of #1383`, no closing keyword, milestone 0.0.8, labels per L10),
   then implement S0→S5 on the Astra medium lane; resolve IMPL-EVAL from a fresh matrix relative to Astra.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| One factory in auth-core, leaf re-export | F12, review 6 | no new edge, no cycle (F10) |
| Required `serviceName`/`timeoutMs` | review 3 | no invented defaults |
| `scheme:'bearer'`, no `sessionId` claim | review 4 | session id is the bearer in kv-oauth |
| Request propagated at the `main.ts` context seam; `session()` bearer via `token` | review 1, `coordinator-request-context.md`, F18/F22 | `me`/`signout` code untouched |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/remote-session--1383/*` | new/updated | planning artifacts and probe evidence only |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | NOT_RUN | — |
| Fitness | NOT_RUN | — |
| Runtime | NOT_RUN (required: native service over HTTP, in-memory kv-oauth) | S3 |
| Consumer | NOT_RUN | — |

## Open Questions

- None blocking. `me`/`signout` code is untouched; they now receive the request by design and no
  behaviour is claimed for them (#1384 owns signout).

## Drift and Debt

- Drift: `drift.md` (5 entries incl. one correction). Debt: none created.

## Commits

- None beyond the coordinator's bootstrap commit; the draft PR commit list is the trail once opened.
