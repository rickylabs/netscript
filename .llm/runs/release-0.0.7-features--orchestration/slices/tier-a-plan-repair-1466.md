# Tier-A review — #1466 / PR #1731 PLAN-EVAL cycle-1 repair

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high. Subject: commit
`7db3954bf3f6f7a59d09fa53435db5252edb4ccb` — `docs(harness): transcribe #1466 plan-eval rulings`.

Verdict: **`PASS`**. All eight required fixes landed; scope is exactly as bounded; the one number I
was unwilling to take on faith reproduces.

## Scope — bounded as instructed

| Check | Result |
| --- | --- |
| Files | `plan.md` (+217/−52), `worklog.md` (+58, new) |
| `packages/**` touched | **0** — the docs-only bound held |
| `deno.lock` | untouched |
| Base | committed on top of the evaluator's `a3452650d` after a fast-forward, as instructed |

## A-1 … A-8 verified present

| Fix | Evidence |
| --- | --- |
| A-1 fourth generic pinned | `NetScriptProcedureMeta & Record<never, never>` ×2; `BaseContractMeta` ×6 |
| A-2 extractor named | extractor identifiers ×20; `ActionMethod` marker ×5 in slice 2 |
| A-3 open decisions resolved | 8 `resolved` rows in the sweep |
| A-4 per-member surface delta | enumerated in scope section |
| A-5 doc-json independence gate | ×5, replacing the tool-less "declaration scan" |
| A-6 assertion-budget gate | ×9, with review explicitly demoted to non-evidence |
| A-7 receipt table | 8 rows, `expectedGateIds` present |
| A-8 worklog `## Design` | present, before the slice-1 commit |

## The receipt set is now recomputable

Eight rows with **distinct** `gateId`s — `1466-check-final`, `-lint-final`, `-fmt-check-final`,
`-test-final`, `-public-doc-lint-final`, `-quality-gate-final`, `-arch-check-final`,
`-publish-dry-run-final`. No id repeats, so `.llm/tools/gates/evidence-set.ts`'s
duplicate-or-contradictory rule cannot fire on the contracted set. `arch-check` is carried as its own
id rather than folded into `quality-gate`, and the plan says why. That is what T-3 asked for.

## I re-derived the baselines rather than accept them

I asked the author to re-measure with the scanner it commits rather than copy the evaluator's
numbers. It reports re-measurement at `a3452650d` and adds the right rule — a discrepancy from the
planning baselines is *a finding, not an automatic baseline adjustment*.

My own first count disagreed: a crude `grep -oE '\bas\s+…' | wc -l` gave **8** for
`sdk/src/query/query-factory.ts` against the pinned **5**. Reproducing the specified scanner
properly — strip block comments, line comments, and string literals, then count `\bas\s+` excluding
`as const` — every file matches exactly:

| File | Pinned | Reproduced |
| --- | --- | --- |
| `sdk/src/query/query-factory.ts` | 5 | **5** |
| `sdk/src/presets/define-services.ts` | 1 | **1** |
| `sdk/src/client/service-client.ts` | 1 | **1** |
| `sdk/src/ports/service-client.ts` | 0 | **0** |
| `sdk/src/ports/query-factory.ts` | 0 | **0** |
| `contracts/src/application/contract-primitives.ts` | 0 | **0** |

The discrepancy was my measurement, not theirs: `grep -o` emits one line per match and I counted
occurrences where the scanner counts them after stripping. Worth recording because it is the same
error class this lane keeps finding in others — a number produced by a convenient command and
reported as the contracted measurement. The baselines are sound and the assertion-budget gate will be
neither vacuous nor permanently red.

## Next

PLAN-EVAL cycle 2, bounded to the scope the evaluator set for itself: confirm `plan.md` carries
A-1…A-8 as written. Resuming evaluator session `5cd50ad0` rather than launching a fresh one — the
scope is a transcription check, that session holds the rulings, and generator ≠ evaluator still holds
because the author is Codex. No implementation until it returns `PASS`.
