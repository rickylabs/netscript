use harness

## SKILL

- `netscript-harness` — enforce the Plan-Gate, evaluator separation, and verdict vocabulary.
- `agent-milestone-orchestrator` — evaluate milestone issue disposition, PR-sized clustering, wave
  dependencies, merge authority, and canary cadence.
- `netscript-pr` — verify issue/PR closure semantics, labels, milestone handling, and pre-merge
  gates.
- `netscript-tools` — use current repository evidence and scoped read-only inspection.
- `netscript-release` — verify the canary/publish/e2e sequencing and budget treatment.
- `netscript-doctrine` and `jsr-audit` — verify archetype, debt, public-surface, and JSR risks.
- `rtk` — use repository-standard read-heavy command wrappers where appropriate.

You are the separate PLAN-EVAL session for run `release-0.0.5--orchestration`, draft PR #1337. You
are running through OpenRouter as `minimax/minimax-m3` at high effort, the canonical PLAN-EVAL
route. Do not implement, edit files, change GitHub state, merge, or publish.

Read completely, in order:

1. `.llm/harness/gates/plan-gate.md`
2. `.llm/harness/evaluator/plan-protocol.md`
3. `.llm/harness/evaluator/verdict-definitions.md`
4. `.llm/harness/workflow/milestone-run.md`
5. `.llm/harness/workflow/canary-cadence.md`
6. `.llm/harness/workflow/lane-policy.md`
7. `.llm/harness/workflow/tooling.md`
8. `.llm/harness/workflow/agent-handoff.md`
9. `.llm/runs/release-0.0.5--orchestration/research.md`
10. `.llm/runs/release-0.0.5--orchestration/plan.md`
11. the `## Design` section and latest plan entry in
    `.llm/runs/release-0.0.5--orchestration/worklog.md`
12. `.llm/harness/archetypes/README.md`, A1, A3, A5, A6, and the docs/frontend/service overlays
13. `.llm/harness/gates/archetype-gate-matrix.md` and relevant debt entries
14. `.agents/skills/jsr-audit/SKILL.md` for the planned package/plugin public surfaces

Spot-check load-bearing claims against the current tree and read-only GitHub evidence. In addition
to the normal Plan-Gate walk, verify:

- all 38 open 0.0.5 issues appear in exactly one disposition class;
- the eight proposed 0.0.6 moves are justified and do not conceal a 0.0.5 blocker;
- every retained implementation row is owned by exactly one of the 18 PR clusters;
- the T1/T2 inherited-PR repair sequence and every later dependency are honest;
- no implementation wave exceeds three supervisors;
- #1004/#1090/#1126/#1166/#1169 cannot be auto-closed by code;
- streams schema/contract work precedes reconnect behavior;
- plugin thinness/parity, A6 generated-consumer gates, scope overlays, debt, and JSR risks are
  attached to the right clusters;
- the canary.14/.15/.16 cadence is affordable but still requires #1312's authenticated
  fail-before-mint preflight;
- every slice names expected paths, decisive gates, and an allowed route;
- PLAN-EVAL remains Minimax and IMPL-EVAL remains Qwen, in separate sessions;
- unresolved decisions that would force rework are marked must-resolve at the right checkpoint.

Return a complete `plan-eval.md` body using the repository template and exactly one `PASS` or
`FAIL_PLAN` verdict. Do not modify files: emit the proposed artifact on stdout so the orchestrator
can record it verbatim with session/model/profile evidence.
