use harness

# S1 Fable re-review — amended P1 proof

You are the separate opposite-family slice reviewer. Work only in
`/home/codex/repos/ns005-proofs-impl`. Do not edit implementation or evidence files, do not run an
AppHost or scaffold, do not delegate, and do not create a commit or contact GitHub.

Read the locked plan and PLAN-EVAL, then the original review at `reviews/S1-fable.md`. Re-review
the amended stable S1 artifacts, especially:

- `proofs/P1-verdict.md`
- `proofs/evidence/P1-runtime.json`
- `proofs/evidence/P1-attempts.md`
- `worklog.md`
- `context-pack.md`
- `drift.md`

Verify each original finding M1, M2, M3, m1, m2, and m3 is resolved without weakening the locked
D5/D6 gate or misrepresenting the unattributed HTTP 200. Confirm that P1 remains an explicit FAIL,
that F1(b) is causally qualified and revisitable, that only DB-backed P2 is product-blocked, and
that evaluator vocabulary and supervisor-owned RFC updates are correctly scoped.

Write exactly one review artifact at `reviews/S1-fable-rereview.md`. Its first line must be exactly
`APPROVED` or `CHANGES_REQUESTED`. Include a per-finding disposition table and list any new finding
with severity and a concrete required action. If all original findings are resolved and no new
blocking issue exists, approve. This is advisory slice review, not IMPL-EVAL.
