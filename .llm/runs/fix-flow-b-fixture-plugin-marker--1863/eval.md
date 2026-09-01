# IMPL-EVAL record — #1863 / PR #1865

## Cycle 1 — PASS_IMPL with one accepted finding

- **Route:** checked-in hybrid delegation (`delegate_openrouter`).
- **Head judged:** `ca9c25ec3`.
- **Verdict:** `PASS_IMPL`.
- **Model discrepancy (recorded, not hidden):** the call requested `z-ai/glm-5.3-flash`; the worker
  reported `requested` **and** `observed` as `deepseek/deepseek-v4-flash-0731` (`source:
  opencode_argv`). The model parameter did not reach the worker. Per the standing owner ruling,
  qualifying DeepSeek evaluations remain valid at their recorded exact head, so this verdict stands —
  but the routing gap is real and is recorded in the lane ledger.

### Findings

| # | Item | Result |
|---|---|---|
| A1 | Locator soundness — identifier binding, ambiguity rejection, exactly-one span, quote-agnostic | CONFIRMED, each exercised on constructed inputs |
| A2 | Attempts to break it | **No hole found.** Attacks tried: wrong-resource selection; `plugins.get('workers-api')` reference treated as registration; same-name/different-identifier registration; over-wide span with a full sibling block between creation and registration; prefix/suffix collision (`workers` vs `workers-api`, both plugins and background forms); non-line-start anchors |
| A3 | Tests not vacuous | **One vacuous test found** — see below |
| A4 | Background migration is real | CONFIRMED — `:111` creation and `:237` `backgroundProcessors.set(...)` both genuinely emitted; consumer migrated; no comment-keyed locator remains (the only `---` left, `:122`, is prose) |

Evaluator observation, accepted as safe: anchors must be line-start (`^[ \t]*const`), so an inline
`{ const resource = ...` yields "found 0" — fail-loud, and real generator output always satisfies
line-start. Name matching is bounded by the closing-quote backreference, so `workers` can never match
a `workers-api` creation, confirmed in both directions.

### Accepted finding — vacuous background test

The evaluator was correct. `generate-register-background.ts:56` **still** emits
`  // --- ${name} ---`, so on today's output the old comment-keyed locator and the semantic one agree.
With `workers` last in the fixture the old EOF fallback produced an identical span, so the test passed
under either implementation and proved nothing about the migration.

Independently reproduced before fixing: old locator on current output yields a block containing only
`workers` — identical to the semantic result.

**Repair (`dfd6009dd`).** Added a discriminating test that strips the name comment from real generator
output — exactly the rename #1837 applied to the plugins generator — and requires the locator to still
find the block. Verified the old implementation returns `-1` on that input and would fail the test,
while the semantic locator passes. `workers` is now also placed **between** two siblings rather than
last, so an over-wide span cannot pass unnoticed.

This finding was a **test-suite gap, not a code defect**: A4 independently confirmed the code migration
is real.

Tier-A after repair: `packages/cli/e2e` **211 passed / 0 failed**, lint and fmt clean.

## Cycle 2 — corroboration, in flight

A second evaluator was launched through the checked-in direct route
(`agentic:claude-openrouter --model z-ai/glm-5.3-flash --effort max`) writing to
`impl-eval-verdict.md`. It judges `ca9c25ec3`, i.e. **before** the vacuity repair; the delta to the
current head is a single test file with product source byte-identical. Treated as corroboration of
cycle 1, not as the gating verdict.

## Transport gap (recorded)

Two hybrid dispatches failed with `result_too_large: worker output exceeds 262144 bytes` before one
succeeded. The delegation route has no output-size control and returns worker tool output, so any
verification task that runs a test suite or reads several files can exceed the ceiling. Per coordinator
ruling, transport truncation is **not** an IMPL-EVAL failure and does not consume the two-failure
product ceiling. Mitigation used: narrow the task, forbid whole-file reads, cap the reply, and prefer
the direct route with `--output` to a file.
