# Research — fix-1056-agentic-tooling--critical-path

## Re-baseline

- Carried-in source: owner brief for issues #1074, #1056, #1048, and #1004.
- Re-derived against `origin/main` @ `f663fe0e4fff93a7ab465a7ef68feea76e4b85f6` on 2026-08-03.
- Branch `fix/1056-agentic-tooling` is clean and starts exactly at that baseline.
- All four issue bodies were read in full with `gh issue view <N> --repo rickylabs/netscript`.
- The #1004 owner comment confirms #1035 shipped the behavior fix and only the missing-member retry
  evidence remains.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | OpenRouter model ids are centralized in `config/models.ts`; provider presets and routing lanes reference those constants. | `config/no-hardcoded-volatile_test.ts`; `runtime/provider-profiles.ts`; `runtime/routing-policy.ts` |
| 2 | The formal evaluator resolver requires Claude + OpenRouter + `open_only`, an approved open model, and a supported evaluation preset with a reasoning trace. | `runtime/routing-policy.ts` `resolveCanonicalFormalEvaluatorRoute()` |
| 3 | The approved evaluator set is exactly Minimax M3 and Qwen 3.7 Max. | `config/models.ts` `OPEN_EVALUATOR_MODEL_IDS` |
| 4 | The owner-selected documentation generator model is `google/gemini-3.6-flash`; it must not become evaluator-reachable. | Owner decision, 2026-08-03 |
| 5 | The remaining slices are repository/runtime/release tooling; no `packages/**` or `plugins/**` changes are planned. | Owner brief and focused issue bodies |

## jsr-audit surface scan (package/plugin waves)

N/A. This run changes repository agentic tooling, workflow guidance, and release automation only;
it does not change a publishable package/plugin surface.

## Open questions

- None for Section 1. The model id, transport, lane role, evaluator exclusion, and date are locked by
  the owner.
- Section 5 may end with truthful partial evidence if live partial-publish behavior cannot be proven
  safely; the owner explicitly accepts that outcome.
