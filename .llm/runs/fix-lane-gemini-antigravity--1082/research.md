# Research — fix-lane-gemini-antigravity--1082

## Re-baseline

- Issue #1082 and the supplied slice were re-derived against `origin/main` at `2d58481e4`.
- PR #1077 introduced the incorrect OpenRouter preset; no later commits were present in this branch.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | `research_extraction` already provides the correct Antigravity binding shape. | `runtime/routing-policy.ts` |
| 2 | Gemini appeared in both the OpenRouter model registry and a documentation preset. | `config/models.ts`; `runtime/provider-profiles.ts` |
| 3 | The formal evaluator rejects non-evaluation routes before checking their model. | `runtime/routing-policy.ts`; existing named guard test |

## jsr-audit surface scan

N/A: this changes internal `.llm` tooling, tests, and harness policy; no package/plugin export changes.

## Open questions

None. The owner fixed the transport, provider, model constant, effort, and cost rationale in #1082.
