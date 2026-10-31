# Saga instance read model and direct lookup — #2160

Baseline: abe9d3e4303411544502ceb519f39a09d3723fcd (current main).
Branch: orch/divybot-6542166103. Tier: feature. Implementation: Codex / OpenAI.
Evaluator: separate Claude session, claude-opus-5-5, high effort, read-only.
The owner explicitly requested this evaluator route, overriding the inspected pinned
matrix defaults: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a
separate session with claude -p --model claude-opus-5-5 --effort high, read-only,
stdin closed, blockers only."

Allowed tracked writes: plugins/sagas/**; packages/plugin-sagas-core/**;
docs/pages/background-processing/** (sagas documentation if required);
.llm/runs/orch-divybot-6542166103--2160/**.
Excluded assignment/report handoffs are not committed. No lock changes.
No labels or milestone mutations. No local scaffold.runtime, merge, tag, or release.
Final scaffold.runtime verdict is requested from the coordinator in READY.
Run profile: dispatcher-provided leaf; no repository profiles/ used.
Plan evaluation: maximum 2 rounds. Implementation evaluation: maximum 5 rounds,
reusing the evaluator session; two consecutive terminal failures stop the loop.
