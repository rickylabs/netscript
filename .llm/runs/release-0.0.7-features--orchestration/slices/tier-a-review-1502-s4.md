# Tier-A review — #1502 slice S4 (final)

**Reviewer:** `topic-features-0.0.7` (native Claude Opus 5 · high), a session separate from the Codex
generator `019ffcc5-d3e1-7c13-9815-e9956ec43683`.

**Reviewed:** content head `120859d5c762706702cd45a3f2be19664e335e22`, final head
`c987f009e502df0bbeb33c3d23f508bc6f320238`.

**Verdict: `CHANGES_REQUESTED` — one narrow, reproducibility-critical defect.** Everything else in S4
is correct, including the part that mattered most.

## N-4 is fully discharged — the headline result

The instruction that made this slice risky was carried since PLAN-EVAL cycle 2: final gate evidence
must attest the content being evaluated, not its parent. S4 got this exactly right.

| Gate | Outcome | `gitHead` | `gitHead == actualGitHead` | mismatch flag |
| --- | --- | --- | --- | --- |
| `check` | PASS | `120859d5c` | true | none |
| `test` | PASS | `120859d5c` | true | none |
| `publish-dry-run` | PASS | `120859d5c` | true | none |
| `arch-check` | PASS | `120859d5c` | true | none |
| `docs-source-format` | PASS | `120859d5c` | true | none |
| `docs-accuracy` | PASS | `120859d5c` | true | none |

All 17 final receipts share the single `gitHead` `120859d5c`, none carries
`allowGitHeadMismatch`, and no outcome is non-`PASS`. The two-commit structure is exactly as
instructed: `120859d5c` lands content, gates run against that clean committed tree, and `c987f009e`
adds receipts and journals only. The content-to-final delta is confined to the leaf run directory —
no RFC, package/plugin source, contract file, or `deno.lock`.

## Other verification — all clean

| Check | Method | Result |
| --- | --- | --- |
| PR lifecycle | live search `is:pr is:draft is:open label:status:impl`, parsed | `draft: true`, `state: open`, status labels `['status:impl']` — **no ready-flip**, exactly one lifecycle label |
| DoD honesty | parsed the PR body's Definition-of-Done | 9 of 10 ticked; the **only** unticked box is "A fresh opposite-family IMPL-EVAL records `PASS`; Tier-A S4 topic review is complete" — precisely the box that cannot yet be true. This is the #260 failure mode correctly avoided |
| Acceptance evidence | parsed the fenced block | **0 `PENDING` entries** remain; `Closes #1502` still present |
| Scope | `git diff --name-only 171e4e62e..HEAD` | no `packages/**`, `plugins/**`, or `deno.lock` |
| Heads | `git rev-parse` / `git ls-remote` | local == remote == PR head; tree clean; no upstream |
| Receipt integrity | all 17 final receipts | one `gitHead`, no duplicate `invocationId`, no non-`PASS` |

## Finding S4-F1 — the `SUFFICIENT` claim is not reproducible from the receipt directory

`worklog.md:241` states "The repository evidence-set evaluator reports `SUFFICIENT` with no reasons"
without recording **which receipt set** that verdict covers. It is not reproducible over the final
receipts as they stand, and it will fail for the next actor.

Three distinct final receipts carry the **same** `gateId`:

| File | `gateId` | `invocationId` | argv |
| --- | --- | --- | --- |
| `publish-dry-run-final.json` | `publish-dry-run` | `ns1502-s4-final-publish-work…` | `deno task publish:dry-run` |
| `publish-dry-run-cli-final.json` | `publish-dry-run` | `ns1502-s4-final-publish-cli` | `… --member packages/cli` |
| `publish-dry-run-plugin-final.json` | `publish-dry-run` | `ns1502-s4-final-publish-plug…` | `… --member packages/plugin` |

`.llm/tools/gates/evidence-set.ts:20–22` computes duplicates over `receipts.map(r => r.gateId)` and
pushes `gate ${gateId} has duplicate or contradictory receipts` for any repeat — which makes the set
insufficient. So a `SUFFICIENT` verdict can only have come from a hand-selected subset containing one
`publish-dry-run` receipt, not from the final receipt directory.

That subset choice is defensible — the contracted gate set is six gates and the per-member runs are
supplemental — but the verdict as recorded is unreproducible, and `worklog.md:358` explicitly directs
the IMPL-EVAL evaluator to "independently re-check the six-receipt metadata and sufficiency." An
evaluator who follows that instruction by globbing `receipts/*final*.json` gets **INSUFFICIENT** and
will reasonably conclude the evidence set is broken. The gates genuinely passed at the content head;
this is a labelling and reproducibility defect, not a false green — but it lands on the very next
actor, so it is fixed now rather than carried.

Fix either way, and state which:

- **(a)** give the per-member receipts distinct gate IDs (`publish-dry-run-cli`,
  `publish-dry-run-plugin`) so the whole directory recomputes `SUFFICIENT` — preferred, because it
  makes the naive recomputation correct; or
- **(b)** record in `worklog.md` the exact six receipt filenames that constitute the contracted
  evidence set the verdict covers, and label the per-member receipts supplemental and excluded, so
  the evaluator reproduces the same scope.

Re-run the evaluator after the change and record the invocation actually used — command, receipt set,
and result — so the claim is checkable rather than asserted.

## Disposition

One bounded fix. Because the fix touches only receipt metadata and journal prose, the content head's
six binding gates need not be re-run; if a receipt's `gateId` changes, say plainly that the recorded
command, exit code, and attested head are unchanged. Push by explicit refspec, comment on #1651,
stop again for Tier-A review.

The PR stays draft at `status:impl`. **The ready-flip and the IMPL-EVAL dispatch remain coordinator
decisions**, not this lane's; the evaluator will be a fresh separate opposite-family session.
