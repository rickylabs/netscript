use harness

## SKILL

netscript-harness (independent delta IMPL-EVAL; never continue implementation). netscript-tools
(raw git verification). netscript-pr (close-gate #387, review-comment resolution). aspire (facts
only; no runtime — this delta touches no runtime path).

## Context

S1 (#1713 / PR #1727 / epic #1712). Runtime carried forward from **`c4cbda25410cd56d915d420c17d97ee74c16be55`**
(hosted `e2e-cli.yml` run **33330714604 SUCCESS all tiers**, and current-main run **33331429495
SUCCESS all tiers**) to head **`32e418c586e7a4f6d7c6d8312b8787fe7c4f59c2`**: audited delta is
**exactly** `.llm/tools/validation/check-aspire-version-parity.ts`,
`check-aspire-version-parity_test.ts`, plus two run-dir artifacts — no `packages/`, `plugins/`,
`apps/`, or `.llm/tools/` runtime-path change. Verify that diff yourself
(`git diff c4cbda254 32e418c58`); the two hosted runs' verdicts still apply unchanged to this
head. **Do not request or run the full E2E matrix.**

## Verify

1. The stated delta is exact (reproduce the diff).
2. The fix resolves review comment `r3890336485` on PR #1727: substring match →
   exact-token match; `13.5.30` is RED under the old logic, correctly rejected under the fix;
   negative regression present.
3. Scoped gates green: `check-aspire-version-parity_test.ts` (supervisor measured 65/0),
   `run-deno-check.ts --root .llm/tools/validation` (0 failed batches),
   `deno task check:aspire-version-parity` gate exit.
4. Runtime-identity carry-forward is legitimate: the two named hosted runs targeted a head whose
   only difference from `32e418c58` is this validator + run artifacts.

Verdict `PASS`/`FAIL_FIX`/`FAIL_PLAN`. Write
`slices/s1/convergence/evaluate-r3890336485.md` + PR #1727 comment
`[PHASE: IMPL-EVAL] [VERDICT: …] — r3890336485 delta`.

## Bounded deviation (record only — validation scope unchanged)

The first dispatch (Claude Fable 5 · medium) terminated immediately on the session's monthly
spend limit, with **no verdict produced**. This is a routing/availability event, not a content
cycle: no evidence was read, no judgment was rendered, nothing here is a policy-wide model
waiver. Retry authorized as **Claude Opus 5 · medium**, same brief, same exact head, same
Codex-generator/Claude-evaluator and fresh-session (never the generator, never a prior evaluator)
invariants. `openrouter.env` is absent and AGY is unauthenticated in this environment, so those
are not available fallbacks; Opus 5 is the in-family substitute per the lane's own escalation
order. Validation-only — no runtime.
