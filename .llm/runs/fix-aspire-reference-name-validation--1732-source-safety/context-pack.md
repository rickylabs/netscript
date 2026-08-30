# Context Pack: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Current phase  | `plan` — cycle 1 `FAIL_FIX`; cycle 2 of 2 pending          |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Current State

Cycle 1 found that the narrowed plan covered literal safety but not emitted identifiers. The bounded
repair now locks user-text-free ordinal bindings in the background generator, unconditional
entrypoint/workdir escaping, conditional concurrency-key escaping, and composed-only config
validation. The exact Aspire grammar and observable fail-fast compatibility position are unchanged.
No RED tests or implementation have started.

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

## Next Steps

1. Owner dispatches separate opposite-family PLAN-EVAL cycle 2 of 2.
2. If and only if PLAN-EVAL returns `PASS`, land a visible RED slice before implementation.
3. Implement source-safe literal emission before the config grammar lock.

## Files Changed

- Only this run directory has been added; product and test files are untouched.

## Gates

Implementation gates are `NOT_RUN`; root test is explicitly `NOT FIRED`. Pre-change doc-lint and
JSR-audit comparisons both exit 1 on recorded existing findings.

## Open Questions

- None after the F1/F2 repair. PLAN-EVAL cycle 2 is pending and blocks implementation.

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
