use harness

# PLAN-EVAL request: agent init tooling and offline docs bundles

Evaluate the locked plan for PR #1092 only. Do not implement, edit product code, tick issue boxes,
or change `deno.lock`.

## SKILL

- `.agents/skills/netscript-harness` — evaluator protocol, Plan-Gate, tracked verdict semantics.
- `.agents/skills/netscript-cli` — `agent init`, scaffold output, fixture expectations.
- `.agents/skills/netscript-tools` — shipped `.llm/tools` and trustworthy validation evidence.
- `.agents/skills/netscript-doctrine` — Archetype 6 and docs-overlay architecture fitness.
- `.agents/skills/netscript-pr` — structured PLAN-EVAL PR comment and repository targeting.
- `.agents/skills/rtk` — compact read-heavy git/grep inspection.

## Scope and authority

- Repository: `rickylabs/netscript`
- Branch: `feat/1024-agent-tooling-bundle`
- Run: `.llm/runs/feat-1024-agent-tooling-bundle--agent-init/`
- Issues: #1024 and #1061; read both full issue bodies and all eleven acceptance criteria.
- Read the run's `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`, and
  `supervisor.md`.
- Read the harness PLAN-EVAL protocol and verdict definitions referenced by the harness skill.
- Spot-check current `agent init`, the eight proposed tool entrypoints, the merged #1068 task router,
  and the external docs-bundle assumptions needed to judge feasibility.

Challenge especially:

1. whether project lock/config evidence can prove exact installed `@netscript/*` versions;
2. whether strict same-release docs/CLI matching is valid and fails before partial writes;
3. whether scaffold E2E can be dependency-closed and framework-clone-independent while invoking
   host-port validation and handling a missing binary without a thrown-process escape;
4. whether generated path-closure and no-fixture-mutation tests actually cover every installed
   reference;
5. whether the two commit slices are independently reviewable and have adequate gates.

## Required output

Write the complete evaluation to
`.llm/runs/feat-1024-agent-tooling-bundle--agent-init/plan-eval.md`. It must use the harness verdict
vocabulary and end in exactly one authoritative verdict: `PASS` or `FAIL_PLAN`. Include concrete,
actionable findings with file/decision references and distinguish blockers from advisory notes.

Commit and push only the tracked evaluator artifact needed for this evaluation. Do not mutate
`deno.lock`, product code, generated assets, issue bodies, or unrelated run files. Post one structured
PR comment beginning `[PHASE: PLAN-EVAL]` and include the exact machine line
`OPENHANDS_VERDICT: APPROVED` for `PASS`, or `OPENHANDS_VERDICT: CHANGES_REQUESTED` for
`FAIL_PLAN`. The tracked artifact is authoritative if a summary disagrees.
