use harness

# #1502 slice S4 fix-up — make the `SUFFICIENT` verdict reproducible

Continue in this same thread. Tier-A review of the S4 handoff returned **`CHANGES_REQUESTED`** with
exactly one finding. Everything else in S4 is correct — in particular **N-4 is fully discharged**:
all six contracted gates record `gitHead == actualGitHead == 120859d5c` (the content head), no
receipt carries `allowGitHeadMismatch`, all 17 final receipts share that one head, the two-commit
content-then-receipts structure is exactly right, the DoD leaves only the IMPL-EVAL/Tier-A box
unticked, and the `acceptance-evidence` block has no `PENDING` entries. Do not redo any of that.

Full review:
`/home/codex/repos/netscript-007-features/.llm/runs/release-0.0.7-features--orchestration/slices/tier-a-review-1502-s4.md`.

## SKILL

- `.agents/skills/netscript-tools/SKILL.md` — **re-read the durable-receipt and sufficiency rules**;
  they are the whole subject of this fix.
- `.agents/skills/netscript-harness/SKILL.md` — commit trail, evaluator handoff.
- `.agents/skills/netscript-pr/SKILL.md` — per-slice PR comment.

## S4-F1 — the only finding

`worklog.md:241` records "The repository evidence-set evaluator reports `SUFFICIENT` with no reasons"
without stating **which receipt set** the verdict covers, and that verdict cannot be reproduced from
the final receipts as they stand.

Three final receipts share one `gateId`:

| File | `gateId` | `invocationId` |
| --- | --- | --- |
| `publish-dry-run-final.json` | `publish-dry-run` | `ns1502-s4-final-publish-work…` |
| `publish-dry-run-cli-final.json` | `publish-dry-run` | `ns1502-s4-final-publish-cli` |
| `publish-dry-run-plugin-final.json` | `publish-dry-run` | `ns1502-s4-final-publish-plug…` |

`.llm/tools/gates/evidence-set.ts:20–22` computes duplicates over `receipts.map(r => r.gateId)` and
pushes `gate ${gateId} has duplicate or contradictory receipts` for any repeat, which makes the set
insufficient. So `SUFFICIENT` can only have come from a hand-selected subset holding one
`publish-dry-run` receipt.

That subset is defensible, but the record is unreproducible — and your own handoff at
`worklog.md:358` tells the IMPL-EVAL evaluator to "independently re-check the six-receipt metadata
and sufficiency". An evaluator who does that by globbing `receipts/*final*.json` gets
**INSUFFICIENT** and will reasonably conclude the evidence set is broken. That is why this is fixed
before handoff rather than carried.

Choose one and say which:

- **(a) preferred** — give the per-member receipts distinct gate IDs (for example
  `publish-dry-run-cli` and `publish-dry-run-plugin`) so a naive recomputation over the whole
  directory returns `SUFFICIENT`.
- **(b)** — record in `worklog.md` the exact six receipt filenames that constitute the contracted
  evidence set the verdict covers, and label the per-member receipts supplemental and excluded, so an
  evaluator reproduces the same scope.

Then **re-run the evidence-set evaluator and record the invocation actually used** — the command, the
receipt set it consumed, and its result — so the claim is checkable rather than asserted. Update the
handoff instruction at `worklog.md:358` so the evaluator is told the same scope you used.

## Do not re-run the binding gates

This fix touches receipt metadata and journal prose only. The six contracted gates stay as they are;
their recorded command, exit code, and attested head are unchanged, and the content head stays
`120859d5c`. If a receipt's `gateId` changes, state plainly in `worklog.md` that only the identifier
changed and that command, exit code, and attested head are untouched. Do not regenerate a receipt in
a way that would re-time or re-attest it to a different head.

## Contract — unchanged

RFC-only. No package/plugin source, no `deno.lock`. No merge, publish, **ready-for-review flip**,
relabel, issue filing, `#1348` mutation, central cluster-state change, or expensive-gate lease.
**Never run `scaffold.runtime`.** Do not self-evaluate. The PR stays draft at `status:impl`; the
ready-flip and the IMPL-EVAL dispatch are coordinator decisions.

## Reporting

One bounded commit. Reconcile raw Git truth, push with
`git push origin HEAD:refs/heads/docs/rfc-plugin-cli-contribution` only, post one PR comment, and
keep the run dir current in the same commit.

Then stop and report the exact head, which remedy you chose, the evidence-set invocation and its
result, confirmation that the six contracted receipts still attest `120859d5c` with unchanged command
and exit code, and the literal line
`TIER-A STOP: slice S4 fix-up ready for topic review and IMPL-EVAL handoff`.
