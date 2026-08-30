# Context Pack: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Current phase  | `implementation` — visible RED established                 |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Current State

The owner independently confirmed cycle-2 F1/F2, released the plan gate after the second and final
cycle, and authorized implementation. The bounded amendment adds the flow-B fixture derivation
contract and removes user text from generated comments. The focused RED wrapper now executes 99
results and fails 32 as expected: 24 missing contextual config rejections, six generator
source/execution seams, and two parent-step summaries. Production code remains unchanged.

## Completed

- Loaded all requested skills and static-gates guidance.
- Verified clean branch and exact baseline.
- Researched Aspire's default name contract and current scaffold production contract.
- Locked dual-defense ordering and the explicit compatibility position.
- Kept the new Aspire grammar in a private `packages/aspire/src/domain/` module rather than adding a
  public `@netscript/aspire/constants` symbol.
- Captured red pre-change doc-lint and JSR-audit baselines without reporting them green.
- Recorded PLAN-EVAL cycle 1 at evaluator commit `1f52d5e2b6b35e204167686714fe3ad72f4fafae` and
  repaired F1/F2 without implementing.
- Added accepted parse-and-execute coverage for `class`, `await`, and `builder`, plus direct
  arbitrary-input binding safety.
- Recorded sibling service/plugin/app identifier exposure as pre-existing deferred scope owned
  upstream.
- Pushed the final plan amendment at `f1d7d9d8f738b4907e1c770051ee1f59abaacc4a` without modifying
  either evaluator verdict file.
- Added and executed the visible RED matrix before production edits: 67 pass, 32 fail, 99 total.

## Next Steps

1. Commit and push the visible RED test slice with its structured failure receipt.
2. Implement source-safe literal/binding/comment emission and the flow-B fixture update.
3. Implement the private composed-level config grammar lock only after slice 2 is green.

## Files Changed

- RED changes are limited to `packages/aspire/tests/config_test.ts`,
  `generate-register-background_test.ts`, and run evidence. Product files are untouched.

## Gates

The focused RED wrapper exits 1 after executing 99 results (67 pass, 32 fail). Root test remains
explicitly `NOT FIRED`. Pre-change doc-lint and JSR-audit comparisons both exit 1 on recorded
existing findings.

## Open Questions

- None. PLAN-EVAL is owner-released with no cycle 3; IMPL-EVAL is the next separate formal gate.

## Drift and Debt

- Drift: the scaffold is looser than Aspire; the accepted correction rejects those values earlier.
- Drift: `rtk` is unavailable on the host despite the requested tooling skill.
- Corrected plan premise: exported `constants.ts` is a JSR surface, so the rule moved private.
- Drift: sibling service/plugin/app generators retain the pre-existing identifier exposure; this
  leaf deliberately does not fix it.
- Debt: none created.

## Commits

- `2176041116f3eb40c2d035f1e22d20c024e8a0dc` — initial narrowed plan artifact.
- The complete artifact/published head SHA is copied from final `git log` into the draft PR phase
  comment and final handoff.
