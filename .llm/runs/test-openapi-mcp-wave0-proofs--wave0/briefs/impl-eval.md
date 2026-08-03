use harness

# IMPL-EVAL brief — OMB wave-0 proofs

## SKILL

Read and follow `.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-tools`, `.agents/skills/netscript-cli`, and
`.agents/skills/netscript-doctrine`. This is a formal evaluator turn, not implementation.

You are the separate OPEN-model Qwen IMPL-EVAL session for `test-openapi-mcp-wave0-proofs--wave0`,
PR #1182 at head `65ea2304a`. Follow `.llm/harness/evaluator/protocol.md` and
`verdict-definitions.md` exactly. Read the run-loop, proof-only N/A archetype decision, service
overlay, research, locked plan, PLAN-EVAL, implement brief, worklog, context pack, drift, debt
registry, all three proof verdicts/evidence sets, all Fable reviews, the draft-PR commit
list/comments/body, and issue acceptance state for #1127–#1129.

Evaluate the approved deliverable as a proof/measurement run: P1 and P2 explicitly report FAIL
experiments, while P3 reports PASS. Independently decide whether honest committed FAIL verdicts
satisfy this run's proof-artifact scope or whether the missing DB-backed P2 measurement requires a
formal failure/rescope disposition. Do not inherit the implementation lane's recommendation and do
not convert a skipped/missing proof branch into PASS.

At minimum, verify:

- Plan-Gate and Design checkpoint preceded implementation; commit slices and per-slice reviews match
  the locked plan.
- `proofs/P1-verdict.md`, `P2-verdict.md`, and `P3-verdict.md` exist at the RFC-designated run path
  and their claims are supported by normalized evidence.
- P1's F1 outcome and RFC/epic synchronization are precise, including the callback-seam versus
  owned-runtime-coherence distinction.
- P2's no-DB operationId/size/error/keyword/truncation measurements are reproducible, the raw spec
  hash/byte size agree, the DB branch is not laundered, and #1128 remains open without a closing
  keyword.
- P3's exact 401/403 envelopes, authorized 200, and byte-identical D9 wording are supported; no
  production authenticated-spec capability is implied.
- Scoped check/lint/fmt evidence, no-lint-ignore, lock/scope hygiene, serialized-resource teardown,
  final leak check, and review-thread gate meet the approved gate set. Do not run
  `deno task e2e:cli`; the user explicitly excluded it.
- Close-gate semantics are truthful: only #1127 and #1129 carry closing keywords and their issue
  acceptance boxes have linked committed evidence; #1128 is explicitly partial/open.
- No `packages/**` or `plugins/**` public surface, doctrine debt, seed RFC file, or `deno.lock` was
  changed by this PR.
- Every implementation/evaluation/side-fix brief carries its required `## SKILL` chapter. Treat the
  native Fable review prompts as advisory review briefs and check them under the same rule.

You may run minimal read-only or non-mutating validation commands, including the focused P3 test and
scoped proof-experiment wrappers. Do not start Aspire, scaffold, modify product/evidence/plan files,
commit, push, edit GitHub, invoke Agent/Task, spawn a subagent, or delegate any work. Perform the
complete evaluation in this single session; the evaluator model guard will terminate any child model
request.

Write only `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/evaluate.md` using
`.llm/harness/templates/evaluate.md`. Emit exactly one formal verdict: `PASS`, `FAIL_FIX`,
`FAIL_RESCOPE`, or `FAIL_DEBT`, with evidence for every row and explicit issue/PR readiness
consequences.
