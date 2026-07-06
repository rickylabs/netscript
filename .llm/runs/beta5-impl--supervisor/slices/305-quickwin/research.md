# Research — beta5-impl--supervisor

## Re-baseline

- Carried-in source: user prompt for issue #305 "Early quick-win PR" findings.
- Re-derived against `main` @ `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` on 2026-07-06.
- What changed vs the carried-in version:
  - The run directory named in the prompt did not exist locally; this slice bootstraps it before
    implementation.
  - The branch is exactly `chore/305-doctrine-quickwin`, at `origin/main`, with no remote branch.
  - The three requested findings still reproduce in this checkout.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `.llm/tools/fitness/check-doctrine.ts` still claims doctrine AP-1..AP-30 and carries a handwritten `Result/Either/Option/Maybe` rule that tells packages to re-export from `@netscript/shared`. | `rg "@netscript/shared|AP-30|Result/Either/Option" .llm/tools/fitness/check-doctrine.ts` |
| 2 | Doctrine file 09 is the current authoritative AP/F list: AP-1..AP-25 and F-1..F-19. | `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` |
| 3 | Dead `phase-0-research/*` references remain in doctrine chapters 01 and 04. | `rg "phase-0-research" docs/architecture/doctrine` |
| 4 | The evaluator anti-pattern catalog still mirrors the current doctrine AP-1..AP-25, while the checker maps several rules through old refs such as `AP-7/F-DOCT-4`, `A8/AP-9`, `A10/AP-22`, `AP-19`, and `AP-23`. | `rg "AP-|F-DOCT" .llm/tools/fitness/check-doctrine.ts .llm/harness/evaluator/anti-pattern-catalog.md` |
| 5 | `.llm/harness/debt/arch-debt.md` uses AP/F refs heavily and should not be globally renumbered without a map; only entries whose meaning is made untrusted by the reconciled numbering should change in this quick-win. | `rg "AP-|F-" .llm/harness/debt/arch-debt.md` |

## jsr-audit surface scan (package/plugin waves)

- N/A. This is a docs/tooling quick-win; it does not change a package/plugin public export surface.

## Open questions

- None blocking. The quick-win will add an explicit old-ref to new-ref map rather than attempting the
  out-of-scope doctrine v2 rewrite.
