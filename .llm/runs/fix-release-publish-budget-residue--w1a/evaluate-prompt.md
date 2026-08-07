use harness

Run the mandatory independent IMPL-EVAL for draft PR #1341 on current head. You are a separate
evaluator session, not the implementation writer. Read `.llm/harness/evaluator/protocol.md`,
`.llm/harness/evaluator/verdict-definitions.md`, Archetype 6/tooling gate guidance, the complete run
directory `.llm/runs/fix-release-publish-budget-residue--w1a/`, both current issue bodies (#1312 and
#1148), the PR body/comments/commit list, and the full diff from the declared base.

Independently verify acceptance, workflow failure semantics, JSR quota/reset claims, generated
source residue scope/exclusions/cost, lock hygiene, and the recorded generator gates. Do not publish,
do not trigger OpenHands, do not merge, and do not broaden into dependency remediation. Write
`evaluate.md` with `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, and post the canonical
`**[PHASE: IMPL-EVAL] [VERDICT: ...]**` PR comment. A PASS is the evaluator's certification, never
the writer's.

## SKILL

- `netscript-harness` — evaluator protocol and separate-session verdict.
- `netscript-pr` — current PR/issue evidence and canonical phase comment.
- `netscript-tools` — trustworthy wrapper gates and raw git/lock verification.
- `netscript-deno-toolchain` — release/dependency/publication evidence.
- `netscript-release` — canary immutability, OIDC, partial-publish, and green-pair semantics.
- `jsr-audit` — publication-safety rubric.
- `rtk` — compressed exploratory reads only; final gate evidence remains authoritative.
