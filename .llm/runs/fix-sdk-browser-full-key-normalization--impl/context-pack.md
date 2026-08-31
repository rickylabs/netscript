# Context Pack: browser full-key discovery normalization (#1824)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-sdk-browser-full-key-normalization--impl` |
| Branch | `fix/sdk-browser-full-key-normalization` |
| Current phase | `close` |
| Archetype | `2 — Integration` |
| Scope overlays | `frontend` (browser environment-key contract) |

## Current State

The branch started at baseline `dea449911`; `origin/main` advanced during review without touching
this slice. Draft PR #1831 is open and intentionally remains draft with `status:impl`. The SDK
browser builder now applies Aspire's exact resource-name identifier normalization through a private
helper; shorthand and server code are untouched. Every owner-requested local gate is green, both
slices passed independent review, and separate-session IMPL-EVAL returned `PASS`.

## Completed

- Harness, doctrine, PR, tools, rtk, jsr-audit, and Claude-manager instructions loaded.
- Archetype 2 and frontend/browser overlay selected.
- Doctrine verdicts and relevant debt reviewed.
- `PLAN-EVAL: N/A` recorded before implementation.
- Slice 1 signed/pushed as `e5dd8dbc5`; draft PR #1831 opened with the requested metadata.
- Canonical RED captured and all Slice 2 gates passed.
- Slice 2 signed/pushed as `b05ae25b8`; its independent Opus 5 review returned `PASS`.
- Native Fable 5 IMPL-EVAL was quota-blocked before a turn; the policy-authorized OpenRouter
  `z-ai/glm-5.3-flash` fallback independently reproduced all evidence and returned `PASS`.

## In Progress

- None. The slice is complete and closed out.

## Next Steps

- None remaining in this slice. Converged onto `main` `f59874abd2bc39446b21f5126323e0d2dcbce547`
  with the evaluated product blobs preserved byte-identically
  (`browser-env.ts` `f92db485af0f`, `env-ordering_test.ts` `7d46837d65af`), so the independent
  supervisor-dispatched GLM `PASS` carries to the converged head. Lifecycle (ready-for-review,
  `status:ready-merge`) and merge remain coordinator-owned.
- Residual sibling defects found by that evaluation are tracked separately in
  [#1833](https://github.com/rickylabs/netscript/issues/1833) — shorthand-key normalization, the
  deploy-prebuild full-key skip, and widening the cross-package pin corpus. They are explicitly not
  defects of this slice.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No production SDK↔Aspire dependency | doctrine and package manifests | Cross-package coupling exists only in tests. |
| Aspire regex is the contract authority | `build-vite-env-var-name.ts` | SDK comment names the source. |
| Server and shorthand functions remain untouched | issue #1824 and user scope | Exact regression guards. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-sdk-browser-full-key-normalization--impl/*` | new | Harness record. |
| `packages/sdk/tests/discovery/env-ordering_test.ts` | changed | SDK contract and regression guards. |
| `packages/sdk/src/discovery/browser-env.ts` | changed | Private Aspire-compatible browser resource-name normalization. |
| `packages/aspire/tests/helpers_test.ts` | unchanged | Existing Aspire normalization tests remain the authority. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Contract 11/11; SDK 86/86; Aspire 91/91; scoped check/lint/fmt exit 0; root check exit 0 with `failedBatches: 0`. |
| Fitness | PASS | `quality:scan` and `arch:check` exit 0. |
| Runtime | N/A | **Not applicable by contract shape, not merely deferred.** This slice changes only pure string-building functions (`createBrowserServiceEnvKey`) whose full behaviour is observable from unit tests; it starts no process, opens no socket, and reads no environment at build time. There is no runtime surface for a live gate to exercise, so `scaffold.runtime` would add no evidence. (Independently, host runtime is parked by the upstream Aspire remote-Docker constraint, microsoft/aspire#14878 — but that is not why this row is N/A.) |
| Consumer | PASS | Cross-package full-key agreement test exit 0. |

## Open Questions

- None.

## Drift and Debt

- Drift: `rtk` unavailable; exact current Codex model/effort not exposed; native IMPL-EVAL quota
  blocked and used the policy fallback; the high-volume raw evaluator stream was not retained.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments.
- Formal evaluation applies to product/test head `b05ae25b88de089781ab581e77b3f0567628f780`;
  the remaining commit contains run artifacts only.
