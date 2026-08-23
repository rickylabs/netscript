# Brief — #1663 slice S3 (`closeScoreGap` bidirectional pinning, #1622)

You are the preserved Codex author, thread `01a004ec-86a6-7c21-8886-81c09de099f5`. Resume your own
thread.

## S2 is signed off

Tier-A **PASSED** S2 at `22dc3906e53c6f5d560a8afdaab5acc6ca8b3862`. I reproduced every number: 3/3
failing → **6 passed / 0 failed** from `packages/cli` cwd, **6/0 also from the repository root** (so
the fix is cwd-independent, not cwd-relocated), and the canonical `deno task --cwd packages/cli test`
at **828 passed (533 steps) / 0 failed**. I also confirmed no assertion was weakened and that a
four-level anchor still fails, so the anchors are load-bearing. Implement **S3 only**, then stop.

## S3 scope — exactly the two paths your S3 row names

- `packages/mcp/src/domain/docs/guidance-index.ts` — record the empirical rationale adjacent to
  `closeScoreGap`. **Do not change the value or any public export.**
- `packages/mcp/tests/guidance-retrieval_test.ts` — replace the decorative boundary arrangement with
  observable just-inside and just-outside controls.

S4 is the last slice. Do not start it.

## The defect, measured by the supervisor at `22dc3906e` — sharper than the plan states

The plan and #1622 describe `closeScoreGap` as "pinned by no test". My measurement is more specific:
**it is pinned on one side only.**

| Mutation of `closeScoreGap` (`guidance-index.ts:42`) | `guidance-retrieval_test.ts` result |
| ----------------------------------------------------- | ------------------------------------- |
| unchanged at `0.5`                                    | 7 passed / 0 failed, exit 0           |
| **widen `0.5` → `5`** (10×)                           | **7 passed / 0 failed, exit 0** — completely undetected |
| narrow `0.5` → `0.01`                                 | 6 passed / **1 failed**, exit 1 — caught |

So narrowing is already observable; **widening is not**. The load-bearing addition S3 owes is the
observable **just-outside** case that fails when the gap widens. Do not assume the inside direction
needs no work — verify it is genuinely observable rather than incidentally caught, but the outside
direction is where the hole is.

## Locked decisions that bind this slice

- **L5** — keep `closeScoreGap = 0.5`. Add one observable just-inside case at exactly the boundary
  and one early-sorting just-outside case at `0.5 + epsilon`. Narrowing must break the inside
  reorder; widening must break the outside score order.
- **L6** — record the empirical rationale next to the policy: observed gap ≈ `0.3019801982`,
  headroom ≈ `0.1980198018`, regeneration movement ≈ `0.0748587452`. The value is tuned from
  observed headroom, not derived from an arbitrary score scale. A comment only — no value change.
- Risk row: floating-point equality makes the inside case ambiguous. Use exactly representable
  values/differences where you can and a deliberately larger outside epsilon; **assert order, not
  raw floating equality.**

## Proof obligations before you commit

- Targeted `guidance-retrieval_test.ts` green at the unmutated value.
- **Controlled mutation `0.5 → 5`: raw non-zero exit** — this is the regression the current suite
  misses and the specific thing S3 must fix.
- **Controlled mutation `0.5 →` below the inside gap: raw non-zero exit.**
- After each mutation, restore `guidance-index.ts` **byte-exactly** (verify by hash) and rerun green.
- MCP scoped check / test / lint / fmt, non-empty selection each.
- `deno task quality:scan` — `allowCount` must stay **7**; a new allowance is review-blocking.
- Confirm `@netscript/mcp` public exports are unchanged: the policy stays internal and the only
  published-source delta is a comment.

## Hard bounds

- No `scaffold.runtime`, Aspire, Docker, or `e2e:cli`; coordinator-waived `n/a`.
- No fourteenth path. No score-algorithm change, no public export change, no value change to
  `closeScoreGap`.
- No new `deno-lint-ignore`, `any`, or `as unknown as`. No snapshot, skip, or deletion of an existing
  assertion — AP-18/F-10 is a named risk for this slice.
- Do not touch the three preserved `plan-eval*` files, S1/S2 landed paths, `deno.lock`, or caches.
- No merge, ready flip, relabel, issue-checkbox mutation, central-state edit, or lease.

## Output

Commit S3 as one slice, push with `git push origin HEAD:refs/heads/fix/package-gate-honesty`, post a
`[PHASE: IMPL]` comment on #1663 with the gate evidence including both mutation exits, then **stop**.
The supervisor performs a fresh Tier-A slice review before S4, and the sign-off commit is the
supervisor's. Report your thread id, commit SHA, and head.
