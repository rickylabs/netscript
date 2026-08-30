# Context Pack: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Current phase  | `plan` — PLAN-EVAL pending                                 |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Current State

Research and the narrowed plan are complete. The owner approved source-safe emission first, followed
by the exact Aspire config grammar as an observable fail-fast correction. Aspire 13.4.6 rejects
consecutive/trailing hyphens and names over 64 characters, while the current scaffold validator can
produce them. No RED tests or implementation have started.

## Completed

- Loaded all requested skills and static-gates guidance.
- Verified clean branch and exact baseline.
- Researched Aspire's default name contract and current scaffold production contract.
- Locked dual-defense ordering and the explicit compatibility position.
- Kept the new Aspire grammar in a private `packages/aspire/src/domain/` module rather than adding a
  public `@netscript/aspire/constants` symbol.
- Captured red pre-change doc-lint and JSR-audit baselines without reporting them green.

## Next Steps

1. Owner dispatches a separate opposite-family PLAN-EVAL after the evaluator queue becomes free.
2. If and only if PLAN-EVAL returns `PASS`, land a visible RED slice before implementation.
3. Implement source-safe literal emission before the config grammar lock.

## Files Changed

- Only this run directory has been added; product and test files are untouched.

## Gates

Implementation gates are `NOT_RUN`; root test is explicitly `NOT FIRED`. Pre-change doc-lint and
JSR-audit comparisons both exit 1 on recorded existing findings.

## Open Questions

- None in plan scope. PLAN-EVAL is pending and blocks implementation.

## Drift and Debt

- Drift: the scaffold is looser than Aspire; the accepted correction rejects those values earlier.
- Drift: `rtk` is unavailable on the host despite the requested tooling skill.
- Corrected plan premise: exported `constants.ts` is a JSR surface, so the rule moved private.
- Debt: none created.

## Commits

- `2176041116f3eb40c2d035f1e22d20c024e8a0dc` — initial narrowed plan artifact.
- The complete artifact/published head SHA is copied from final `git log` into the draft PR phase
  comment and final handoff.
