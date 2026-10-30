# H01 / #2438 supervisor

Baseline: `30c800958dbf512a4951d640f08748703a8b59e3` (current main). Branch: `orch/divybot-6534973379`.
Implementation: assigned Codex session, feature tier. Independent review: Claude Opus 5.5, high effort, read-only print mode, stdin closed.

## Authorized write surface

- `.llm/runs/orch-divybot-6534973379--2438/**` (run evidence and memory).
- Root dependency catalog / import map and `deno.lock`, only if the selected compatibility fix requires them.
- `packages/telemetry/deno.json`, dependency policy only.
- Database command generated-client fixtures under `packages/database/tests/`.
- Saga generated-client fixture support under `packages/plugin-sagas-core/tests/`.
- A focused repository test-support module and regression tests, if shared lock policy is needed.
- `.divybot-final-report.md` (excluded publication handoff).

No scaffold/runtime wiring or public API redesign. Never commit assignment file. No labels/milestones, merge, tag or release.

## Owner routing override

Owner instruction verbatim: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

Matrix queried through `deno task agentic:matrix --tier feature --json`; implementation primary sol/xhigh; plan evaluation glm_5_3 with fable_5_1 fallback; implementation evaluation muse_spark_1_3 with opus_5 fallback. Explicit owner evaluator override above takes precedence. Feature limits: 2 PLAN-EVAL and 5 IMPL-EVAL rounds, same evaluator resumed across repairs. Different session and vendor family remain mandatory.

Specific operator directives take precedence over generic dispatcher completion boilerplate: keep draft, body starts Refs, no closing keywords. Final canonical report uses Orchid file handoff.
