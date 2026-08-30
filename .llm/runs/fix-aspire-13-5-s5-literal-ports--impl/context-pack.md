# Context Pack: Aspire 13.5 S5 literal ports

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-aspire-13-5-s5-literal-ports--impl` |
| Branch | `fix/aspire-13-5-s5-literal-ports` |
| Current phase | `implement` |
| Archetype | `5 - Plugin` + `6 - CLI/tooling` |
| Scope overlays | Aspire contribution, scaffold, E2E, JSR |

## Current State

Slices 1-6 are pushed on draft PR #1740. Supervisor Tier-A review requested the bounded slice-7
evidence correction; slice 7 is complete at the branch head with full local validation recorded in
the run receipt and PR commit trail.

## Completed

- Required issue, parent research/plan, doctrine, skills, and S2 receipt intake.
- RED fitness contract committed and pushed as `e83659d78`.
- D-14 sagas slice committed and pushed as `24817a404` with JSR evidence.
- Contribution slice committed and pushed as `aae91586b`.
- Plugin/infrastructure opt-in pin slice committed and pushed as `8aee17462`.
- Describe-derived E2E probe slice committed and pushed as `732337435`.
- Final static, JSR, plugin, asset, doctrine, and `scaffold.plugins` gates are green/baseline.
- Tier-A fixes revert grep-driven generated-source/numeric respelling, align the generated exclusion,
  and deprecate the retained auth/triggers compatibility constants under the shared 0.0.8 draft.
- Slice-7 full gates are green/baseline; receipt: `receipts/07-tier-a-fixes.txt`.

## In Progress

- Implementation lane complete; independent supervisor rereview is next.

## Next Steps

1. Independent Fable 5 supervisor rereviews slice 7 and owns IMPL-EVAL.
2. Runtime validation remains CI `scaffold.runtime` after the supervisor-controlled ready transition.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No endpoint is a non-retryable rejected publish | parent D-14 | Public type unchanged. |
| Runtime evidence comes from CI | owner directive | S2 receipts are current live evidence. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/validation/check-aspire-host-ports.ts` | changed | Contribution rules/default roots. |
| `.llm/tools/validation/check-aspire-host-ports_test.ts` | changed | RED contribution and literal-grep tests. |
| `.llm/runs/fix-aspire-13-5-s5-literal-ports--impl/` | new | Harness evidence and resumability. |
| `.llm/tools/generate-cli-assets-barrel.ts` | changed | Tier-A revert restores content-agnostic serialization. |
| `plugins/auth`, `plugins/triggers` | changed | Deprecated compatibility contracts and surface-only tests. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | green; generated barrels excluded and six compatibility paths allowed | slice 7 receipt |
| Fitness | green across contributions and generated host ports | slices 3-4, 6 receipts |
| Runtime | CI deferred | S2 live receipts + future CI `scaffold.runtime` |
| Consumer | auth/sagas/triggers publish and doc baselines re-proven | slice 7 receipt |
| Scaffold | `scaffold.plugins` 17/17 | slice 7 receipt |

## Open Questions

- None. Locked owner contract resolves older issue wording conflicts.

## Drift and Debt

- Drift: naming-only D-16 discrepancy recorded in `drift.md`.
- Debt: deprecated export removal draft targets 0.0.8.

## Commits

- Slices 1-6: `e83659d78`, `24817a404`, `aae91586b`, `8aee17462`, `732337435`, `13375bfc0`.
- Slice 7 is the current branch-head commit; see `receipts/07-tier-a-fixes.txt` and the PR comment
  for its immutable SHA.
