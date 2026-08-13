# Context Pack: JSR specifier token boundary

## Run Metadata

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| Run ID         | `fix-1631-specifier-token-boundary--w8` |
| Branch         | `fix/1631-specifier-token-boundary`     |
| Current phase  | evaluate handoff                        |
| Archetype      | N/A                                     |
| Scope overlays | none                                    |

## Current State

Implementation and all owner-required gates are green. Draft PR #1632 awaits the owner-controlled
draft → ready transition and separate-session IMPL-EVAL.

## Completed

- Authority loading, issue acceptance inspection, seam/predecessor inspection, and plan/design
  checkpoint.
- Pre-fix RED capture, shared parser implementation, strictness tests, root gates, and
  `publish:readiness` PASS.

## In Progress

- Commit/push and draft-PR evidence finalization.

## Next Steps

1. Owner flips PR #1632 ready to trigger automatic IMPL-EVAL.

## Key Decisions

| Decision                           | Source                | Notes                                                 |
| ---------------------------------- | --------------------- | ----------------------------------------------------- |
| Shared parser vocabulary           | issue #1631 / plan D1 | All three call sites reuse one definition.            |
| Range pins fail composed readiness | strictness guard      | Promoted scanner range notes into readiness failures. |

## Files Changed

| Path                                                      | Status  | Notes                                             |
| --------------------------------------------------------- | ------- | ------------------------------------------------- |
| `.llm/tools/netscript-jsr-specifier.ts`                   | new     | Canonical parser/matcher/boundary vocabulary.     |
| `.llm/tools/validation/check-netscript-jsr-specifiers.ts` | changed | Uses canonical matches without prose punctuation. |
| `.llm/tools/release/publish-readiness.ts`                 | changed | Reuses parser and fails ranges.                   |
| `.llm/tools/deps/bump-version.ts`                         | changed | Reuses canonical rewrite boundary.                |
| Focused tests and run artifacts                           | changed | RED, guards, and gate evidence.                   |

## Gates

| Gate family       | Current status           | Evidence                  |
| ----------------- | ------------------------ | ------------------------- |
| Static            | PASS                     | `evidence.md`             |
| Focused           | PASS — 37/37             | `evidence.md`             |
| Release readiness | PASS                     | `evidence.md`             |
| IMPL-EVAL         | pending owner transition | separate session required |

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
