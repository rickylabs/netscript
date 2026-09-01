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

## Convergence — #1863 and #1870 landed as one tested head (2026-09-01)

The two fixture repairs were **circularly blocked** as standalone leaves: #1871 (#1870, readiness)
reached `runtime.flow-b-fixture` and failed there because it lacked #1865's semantic workers-block
repair, while #1865 passed `runtime.flow-b-fixture` and failed at `runtime.readiness-fixture` because
it lacked #1871's Auto-arm repair. Neither could turn green alone. Per coordinator direction they are
converged into this branch and proven together.

**Merges, both clean, zero conflicts:**

| Step | Result |
| --- | --- |
| `origin/main` `38f2ce735` → branch | merge `8c82fa07f`, no conflicts |
| `origin/fix/readiness-fixture-cache-discovery` `7b5a31a80` → branch | merge `bfba3383a`, no conflicts |

**Both evaluated fixes carry by product identity** — all five product/test blobs are byte-identical
to the heads their `PASS_IMPL` verdicts judged:

| File | Identical to |
| --- | --- |
| `locate-workers-resource-block.ts` | `f008315d1` (#1865) |
| `prepare-flow-b-fixture.ts` | `f008315d1` |
| `locate-workers-resource-block_test.ts` | `f008315d1` |
| `prepare-readiness-fixture.ts` | `7b5a31a80` (#1871) |
| `prepare-readiness-fixture_test.ts` | `7b5a31a80` |

No re-evaluation of the code is required; what the converged head must earn is the **runtime** proof,
which neither leaf could obtain alone.

**Gates at the converged head `bfba3383a`:**

| Gate | Result |
| --- | --- |
| `run-deno-test.ts` on `packages/cli/e2e/tests/application/gates` | **116 passed / 0 failed**, exit 0 |
| `run-deno-check.ts --root packages/cli/e2e --ext ts` | 189 files, 2 batches, **0 diagnostics** |
| `run-deno-fmt.ts --root packages/cli/e2e --ext ts` | 189 processed, **0 findings, 0 refusals** |
| `check:assets-barrel` | exit 0 |
| `deno.lock` | blob **byte-identical** to `origin/main` `38f2ce735` |

The 116 is the union of both leaves' suites (108 from #1870's tree plus #1865's locator cases), so
neither side's tests were lost in the merge.
