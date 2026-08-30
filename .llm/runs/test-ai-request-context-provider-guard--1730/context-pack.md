# Context Pack: #1730 provider-invisibility regression guard

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-ai-request-context-provider-guard--1730` |
| Branch | `test/ai-request-context-provider-guard` |
| Current phase | **`TERMINAL — merge-ready; awaiting coordinator merge`** |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

**This leaf is complete. Nothing is pending in it.**

| Field | Value |
| --- | --- |
| **Content head** | **`1c836918abde397b320941f70063d83f25f6c355`** — the tree all seven receipts attest |
| **Evaluator carrier head** | **`899e30ad`** — the carrier bearing the cycle-2 verdict (`evaluate.md` only); `6977debd` likewise for cycle 1. **Zero product bytes** in either. **This is not the current PR head**: evidence-only carriers stack above it, so resolve the live head from GitHub rather than from this table. |
| Tier-A | `ACCEPTED` at `1baabbd6` (S1–S4) and at `1c836918` (R1) — PR comments `5469233540`, `5469372450` |
| IMPL-EVAL | cycle 1 `FAIL_FIX` (`6977debd`) → **cycle 2 `PASS`, terminal** (`899e30ad`); failure count 1 of 2 |
| Receipts | **seven, cut and field-audited** at `1c836918`, `gitHead == actualGitHead`, distinct `requestHash` |
| CI | **Merge requires CI and `close-gate` terminal green at the *current* PR head** — resolve and check it live, never from a run id written here. A run recorded in this file is history for the carrier it ran against, not a statement about the live head. |
| Lifecycle | PR #1763 not draft, `MERGEABLE`/`CLEAN`, `Closes #1730`, both labels sole `status:ready-merge`, issue boxes 5/0 mirror-ticked |

S1–S4 are Tier-A accepted. IMPL-EVAL cycle 1 returned `FAIL_FIX` for one bounded hole — the loop guard
ignored `ChatClientCallOptions`. R1 records the second `stream()` argument and projects every
call-option field except `signal`; mutation **B2** makes the named guard red and reverts to 9/9. The
test is **498 LOC against a 500 cap — the next change to this file must split it**. The model-ID path
is documented as incidentally owned by the existing single-text-turn loop test. Cycle 2 searched for a
third provider-bound escape and found none.

### Carrier-only ruling — why the evaluator verdict still holds at `899e30ad`

A verdict certifies a **content** head. `899e30ad` and this correction are **evidence-only carriers**
stacked above content head `1c836918`, and each is *proven* product-neutral rather than assumed:
`git diff --stat 1c836918..<carrier> -- packages plugins docs templates` is **empty**. The cycle-2
`PASS` therefore carries forward unchanged; no re-evaluation is owed for a carrier commit. That proof
is the price of the carry-forward and is restated here so a resumer does not mistake a moved PR head
for moved content.

**Superseded carrier runs — history, not current status.** Each carrier gets its own CI run, and a run
only ever attests the carrier it ran against:

| Carrier | CI run | Outcome | Status |
| --- | --- | --- | --- |
| `899e30ad` | `33317991712` | `completed/success` at attempt 3 | **superseded** |
| `eb6b9f29` | `33318967520` | `completed/success` | **superseded** |

Attempt 3 on the first of those is itself worth remembering: `close-gate` had reported `success`
earlier in that same run, then **failed** on re-run against the corrected surfaces — the sole failing
step was `Answered review-thread gate`, a review thread that arrived after the first pass. A green gate
is only evidence about the state it observed; mutating the body, the labels, or the thread set
invalidates it, and only a rerun re-establishes it.

**Three distinct roles, never interchangeable:** the **product head** (`1c836918`) is what the receipts
and verdict certify; the **evaluator carrier** (`899e30ad`) is where the terminal verdict was written;
the **current PR head** is whatever carrier is live now and advances with each evidence-only commit —
including this one, which cannot name its own SHA. Any instruction to act on a specific head must say
which role it means, and a merge instruction must resolve the live head from GitHub.

## In Progress

**Nothing.** R1 is committed at `1c836918`, the seven named receipts are cut and field-audited at that
head, both Tier-A reviews are posted on PR #1763, and IMPL-EVAL cycle 2 returned a terminal `PASS`.

## Next Steps

1. **Coordinator merge of PR #1763 at its current head** — resolve it live
   (`gh pr view 1763 --json headRefOid`), never from a SHA written in this file. Its **product head is
   `1c836918`** and the **evaluator carrier that bears the terminal verdict is `899e30ad`**. Nothing in
   this leaf blocks the merge.
2. After merge: `status:shipped` on PR and issue is the coordinator's close step.

There is **no** outstanding implementation, receipt, gate or review work in this leaf. Any instruction
in an earlier revision of this pack to commit R1, re-cut receipts, or stop for Tier-A is **complete** —
that stale text was an `augmentcode` review finding on PR #1763 and this section is its correction.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Assert `messages/system/tools/options` minus `context`. | `plan.md` D1 | Exhaustive owned-request projection. |
| Record inner attempts under retry wrapper. | `plan.md` D3 | Covers initial, retry, continuation. |
| Rename/document Anthropic coverage. | `plan.md` D5 | TanStack seam remains mutation-A guard. |
| Project both `stream()` arguments. | IMPL-EVAL F-1 | Keep request `context` and call `signal` out; inspect every provider-bound field. |
| Document model-ID's incidental owner. | IMPL-EVAL F-2 | Avoid extra fixture surface while naming the existing detecting test. |
| Product ceiling is one test file. | `plan.md` | Temporary loop mutation must never be staged. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/test-ai-request-context-provider-guard--1730/*` | new | S1 research/plan/design/handoff artifacts |
| `packages/ai/tests/request_context_test.ts` | modified | S2 retry/continuation provider-invisibility guard |
| `packages/ai/src/agent/loop.ts` | unchanged | Temporary mutation B restored; product diff is empty |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | **PASS at `1c836918`** | `check` 8,090 ms · `lint` 6,420 · `fmt-check` 1,907 · `test` 3,615 · `quality-gate` 7,836 · `publish-dry-run` 28,664 — all exit 0. `doc-lint` is the **contracted base-red delta** (base 20 / head 20), never a pass. All seven `gitHead == actualGitHead`, distinct `requestHash`. |
| Fitness | **PASS at `1c836918`** | 498/500 LOC (next change must split); JSR audit 2 findings at head **and** base — no increase, both base-inherited; `deno.lock` byte-unchanged; no generated carrier moved; zero product outside `packages/ai/tests` over the merge base. |
| Runtime | R1 PASS | B2 named mutation-red 0/1; restored focused suite 9/9; product diff empty |
| Consumer | N/A | No public-surface change |

## Open Questions

- None in the locked plan.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened; pre-existing diagnostics remain explicit baselines.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
