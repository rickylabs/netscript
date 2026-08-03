use harness

# S1 opposite-family review — P1 lifecycle verdict

## SKILL

Read and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-tools`, `.agents/skills/aspire`, and `.agents/skills/netscript-pr`. This
is an advisory `review_codex` lane, not formal IMPL-EVAL.

You are the separate native Claude Fable 5/low reviewer for Codex-authored S1 in
`test-openapi-mcp-wave0-proofs--wave0`. Work from `/home/codex/repos/ns005-proofs-impl` and review
the stable uncommitted diff only.

Read the run's `plan.md` D4–D6, `plan-eval.md`, `worklog.md`, `drift.md`, all `proofs/P1-*` and
`proofs/experiments/p1-*` / `proofs/evidence/P1-*` files, RFC #1123 §4 and §9, and issue #1127's
acceptance contract. Inspect the scratch manifest/AppHost only as needed; do not change it.

Adversarially answer:

1. Does the callback + `getValueAsync()` + atomic identity-bound manifest actually demonstrate the
   RFC's post-allocation seam, or does D5 correctly require coherent Aspire description/health/live
   request evidence and therefore make this an explicit FAIL selecting F1(b)?
2. Is the later HTTP 200 after Aspire `Finished`/exit 1 adequately explained and safe to use, or is
   the evidence contaminated/ambiguous?
3. Are manifest identity, endpoint allocation, atomicity, multi-service completion, evidence
   normalization, exact teardown, scope, and static gates truthful and sufficient?
4. Does `FAIL_RESCOPE` improperly block independent P2/P3 proof work, given that a P1 FAIL is a
   legitimate deliverable rather than a slice failure?
5. Identify every correctness, evidence, path, wording, or acceptance-box defect that must be fixed
   before supervisor sign-off.

Write only `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/reviews/S1-fable.md`. Begin with exactly
`APPROVED` or `CHANGES_REQUESTED`, then list severity-ranked findings with file/line evidence and a
specific required action. Do not edit any proof, plan, worklog, drift, product/template source, or
scratch file; do not commit, push, post to GitHub, run a new AppHost, or spawn subagents.
