# Supervisor

Issue #2108; B2; coordinator #2474 / mc009e. Branch `orch/divybot-6543997755`.
Baseline main `a9620a34e14e067c56bb6af025ec015f7252b7aa`, verified against remote.
Implementation: current Codex session, OpenAI family, feature / sol / xhigh.
Matrix queried with `deno task agentic:matrix --tier feature --json`.
Owner evaluator override: `claude -p --model claude-opus-5-5 --effort high`, separate Anthropic session, read-only, stdin closed, blockers only. Reuse across rounds; max 2 plan and 5 implementation rounds, stop after two consecutive terminal failures.

## Authorized write surface

- This run directory (including sanitized evaluation/evidence and memory).
- `packages/cli/e2e/fixtures/kv-only/` — opt-in consumer acceptance proof, not a new CI tier.
- `packages/cli/src/local/composition/kv-only-plugins_test.ts` — clean CLI consumer regression.
- Existing CLI scaffold/install/Aspire helper files and focused tests only if the consumer exposes a defect.
- Existing saga runner/store/projection tests only to close demonstrated proof gaps.
- `docs/site/orchestration-runtime/how-to/add-a-plugin.md`, related source documentation and required generated documentation carriers.
- Local excluded runtime/output under project runs or artifacts; temporary files use TMPDIR.

No lock churn, labels/milestones, merge, tag or publication. Assignment and final report handoff remain uncommitted. Public records omit operator paths, session IDs, hostnames and allocated endpoints.
