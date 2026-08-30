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

Slices 1-7 are pushed on draft PR #1740. Separate-session IMPL-EVAL cycle 1 returned `FAIL_FIX` for
one configured-lint defect in the auth/triggers public modules. Slice 8 removes those two dead
import bindings while preserving direct deprecated re-exports; its requested local gates are green.

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
- Slice 8 resolves evaluator finding F-1 with direct auth/triggers public re-exports and a green
  configured repository lint receipt: `receipts/08-configured-lint.txt`.

## In Progress

- Slice 8 is ready to commit, push, and hand back for independent IMPL-EVAL cycle 2.

## Next Steps

1. Push slice 8 and post its immutable SHA + lint receipt on PR #1740.
2. Independent Fable 5 supervisor owns IMPL-EVAL cycle 2.
3. Runtime validation remains CI `scaffold.runtime` after the supervisor-controlled ready transition.

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
| `plugins/auth`, `plugins/triggers` | changed | Deprecated compatibility contracts; direct public re-exports without dead bindings. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | green; generated barrels excluded and six compatibility paths allowed | slice 7 receipt |
| Fitness | green across contributions and generated host ports | slices 3-4, 6 receipts |
| Runtime | CI deferred | S2 live receipts + future CI `scaffold.runtime` |
| Consumer | auth/sagas/triggers publish and doc baselines re-proven | slice 7 receipt |
| Scaffold | `scaffold.plugins` 17/17 | slice 7 receipt |
| Configured lint | 2,047 files / 36 batches / zero findings | slice 8 receipt |

## Open Questions

- None. Locked owner contract resolves older issue wording conflicts.

## Drift and Debt

- Drift: naming-only D-16 discrepancy recorded in `drift.md`.
- Debt: deprecated export removal draft targets 0.0.8.

## Commits

- Slices 1-6: `e83659d78`, `24817a404`, `aae91586b`, `8aee17462`, `732337435`, `13375bfc0`.
- Slice 7: `1634a3c3c`; see `receipts/07-tier-a-fixes.txt` and the PR comment.
- Slice 8 is pending its immutable commit SHA; see `receipts/08-configured-lint.txt`.
