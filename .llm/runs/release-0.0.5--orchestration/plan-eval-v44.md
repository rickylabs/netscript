PASS

## Closure-row dispositions

| Row | Disposition | Evidence gathered |
| --- | --- | --- |
| #1090 | **FIXED** | Live `gh issue view 1090 --json body` has four acceptance rows: non-zero MCP diagnostic use; `ui:add` or a recorded reason; the controlled #1071 comparison with the same brief/version/bundle/budget, changing only the app-scoped conventions file, at six agents per arm; and reaching a Web Layer page before route authoring. `plan.md:675` requires all four together and does not permit a single trial to close the issue. Its admissible artifacts are the per-arm trial transcripts with tool-call counts and the controlled-comparison result. Failure to obtain the complete experiment moves #1090 intact to 0.0.6. |
| #1166 | **FIXED** | Live `gh issue view 1166 --json body` has four rows: merge-commit-aware derivation, a real post-`gh pr update-branch` cut, a genuinely empty payload distinguishable from failed derivation, and #1149 re-verification. `plan.md:676` repeats all four without adding another condition. It names the real cut's `release:canary-label` output, merge-inclusive `git log`, distinguishable empty-payload note, and #1149 re-verification as the evidence artifacts. If the complete result is absent, #1166 moves intact to 0.0.6. |
| #1197 | **FIXED** | Live `gh issue view 1197 --json body` has five rows. `plan.md:677` requires all five: failure-moment routing; non-zero measured MCP use **or** no default MCP installation; gated drift use **or** removal of the unenforceable gate; a real re-measurement against the issue's counts; and a repeatable extraction script. Both issue-defined alternatives remain alternatives. The evidence contract identifies the routing implementation, gate-resolution change, landed extraction script, and measured run counts; exact files belong to the separately evaluated group brief under the owner-ratified Plan-Gate split. A zero-adoption run cannot close the row, and non-occurrence moves #1197 intact to 0.0.6. |
| #1208 Phase 2 | **FIXED** | Live `gh issue view 1208 --json body` requires the three Phase-1 tutorial results and describes Phase 2 as a separate follow-up after Phase 1. `plan.md:678` requires complete W5-D Phase-1 evidence plus an explicit owner disposition of Phase 2. It names W5-D's `Refs #1208` acceptance evidence and the owner's written issue decision as the artifacts. If the owner disposition does not exist at F, #1208 moves intact to 0.0.6; the orchestrator neither closes it nor files a follow-up on the owner's behalf. There is no state in which it remains stranded in stage F. |

## Surviving or new findings

None.

## Regression check

- `git show dff8f945d -- plan.md phase-registry.md` shows that the repair commit rewrote only the
  four named manifest rows and appended the v4.4 rationale; it did not change
  `phase-registry.md`.
- #1004, #1333, #1338, and #1343 are semantically unchanged. The table-width rewrite changed only
  Markdown spacing on those rows.
- The nine-issue receipt at `plan.md:687-699`, the stage-F pointer at
  `phase-registry.md:42`, and the W3–W5 group table at `plan.md:422-444` remain unchanged and
  consistent with the rewritten rows.
- The four non-occurrence columns are total: each issue either reaches its acceptance-complete
  closing event or moves intact to 0.0.6.

Plan-Gate result: **PASS**.
