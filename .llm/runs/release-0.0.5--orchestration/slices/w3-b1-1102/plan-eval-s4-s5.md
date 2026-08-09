# PLAN-EVAL record — #1102 S4–S5 continuation

## Verdict

`PASS`

## Provenance

- Evaluator: separate Claude · Fable 5 session, orchestrator-routed.
- Plan head: `71c0a29c2`.
- Verdict delivered to this implementation thread by the owner on 2026-08-09.
- This file records the received verdict and binding conditions; it is not a self-evaluation.

## Verified design claim

For the score-only row, `concepts = []` makes every `routeIndex` return
`Number.MAX_SAFE_INTEGER`, so route order ties and sorting falls through to
`right.score - left.score`. Link boosts mutate the same score before the sort, and the query has
positive corpus tokens, so the empty fallback cannot bypass the comparator.

## Binding carries

1. D14 ships a render/request phrase family plus a non-quoted paraphrase test, not one memorized
   alias.
2. The scratch inverted-comparator test must actually run, exit 1 on the score-only row, and be
   followed immediately by an unmodified exit-0 run.
3. If the score-only expected order is wrong, record drift and stop; never fit the expectation to
   runtime output.

Implementation was authorized in S4A → S4B → S5 order.
