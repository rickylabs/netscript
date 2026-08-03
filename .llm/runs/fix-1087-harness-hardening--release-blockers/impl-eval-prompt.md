use harness

# IMPL-EVAL — release-blocking harness hardening (#1087, #1084, #1080, #1083)

You are the separate formal open-model evaluator. The implementation generator is Codex; do not
reuse or defer to generator conclusions. Read `.agents/skills/netscript-harness/SKILL.md` and the
focused run artifacts under `.llm/runs/fix-1087-harness-hardening--release-blockers/`, then inspect
the actual diff from `4833a1676` through current HEAD.

Write the verdict to:

`.llm/runs/fix-1087-harness-hardening--release-blockers/impl-eval.md`

Do not edit product/tooling source. Do not spawn sub-agents or workflows. You may run focused
read-only checks. Never read or print credentials.

Evaluate these release blockers against their complete GitHub issue bodies and acceptance boxes:

1. **#1087 cost safety:** the formal evaluator launch route remains open-model-only, and the spawned
   evaluator environment enforces `OPEN_EVALUATOR_MODEL_IDS` at every model-bearing child request. A
   prohibited/missing model produces 403, credential-blind model+requesting-session audit, process
   termination/escalation, and non-zero exit. Confirm the Gemini documentation-authoring generator
   lane remains rejected and ordinary Claude routes are not accidentally changed.
2. **#1084 publication ownership:** `agentic:gh-pr` stages every body into a collision-free
   invocation/session directory, records owner+digest metadata, verifies exact ownership and bytes
   immediately before payload construction, and rejects cross-session, tampered, reused, or
   inherited unsafe artifacts. Confirm active guidance no longer advertises shared publication
   filenames.
3. **#1080 Redis execution:** hosted CI provisions healthy Redis and sets the required URL; the gate
   fails closed without it, observes both exact real-Redis test names with `ok`, and the permanent
   negative control mechanically removes only #1075 serialization, requires each exact regression to
   report `FAILED`, restores source, and cannot pass from an unrelated error. Review the linked
   issue evidence for run `30808236575`, job `91668504084`, including 16 winners versus 1.
4. **#1083 release note:** the tracked 0.0.4 `--notes-file` intro has an explicit Breaking Changes
   entry naming `ServiceStreamProducerOptions.assertResolvable`, tells consumers to remove it, and
   states fail-fast startup resolution behavior. No live docs/generated/source residue remains;
   historical run evidence need not be rewritten. Confirm no release was published.
5. **Process/gates:** issue-scoped commit/push/comment trail, evidence-backed acceptance ticks,
   PLAN-EVAL, opposite-family slice reviews and remediations, root check, full agentic guards,
   full-repository tests, scoped lint/fmt, lock/source hygiene, close-gate, and review-thread gate.
   Treat missing or contradictory evidence as a failure, not an assumption.

Key commits are `2f3e49456` (#1087), `3f3cc6cb8` (#1084), `1921a106c` (#1080), `5efcaf770` (hosted
mixed-type remediation), and `e7dabae7d` (#1083). Inspect rather than trusting this list.

Your artifact must lead with `Verdict: PASS` or `Verdict: FAIL_FIX`, then include severity-ordered
findings, an explicit assessment of every numbered boundary, and the exact checks/evidence you
independently inspected. `PASS` is allowed only if no release-blocking or required remediation
remains.
