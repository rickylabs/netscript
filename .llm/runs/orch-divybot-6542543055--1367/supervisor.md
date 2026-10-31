# Supervisor and scope

Date: 2026-10-31. Issue #1367, C1, coordinator #2474 (mc009e).
Branch: `orch/divybot-6542543055`; baseline main `851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2`.
Implementation: assigned OpenAI Codex session, feature tier, high reasoning.
Independent evaluator: owner-selected Anthropic Claude Opus (`claude-opus-5-5`, high), read-only,
closed stdin, blockers only; same evaluator resumed between rounds. No self-certification.

Permitted write surface: this run directory; streams plugin Aspire contribution, service storage
wiring, scaffold adapter and their tests; Aspire resource/config directory declarations and tests;
CLI Aspire generated registration, compatible schema/template and generated-project runtime proof
and focused tests; streams README and docs/site/durable-workflows/streams.md. No lock/version
changes, labels, milestones, merges, tags or releases. Local full scaffold.runtime is forbidden;
coordinator must arm e2e-cli-gate for the CI verdict. New files beyond this surface are drift.

Routing resolved using `deno task agentic:matrix --tier feature --json`: implementation primary
sol/xhigh, fallback muse_spark_1_3/xhigh; plan evaluators glm_5_3/provider_default then
fable_5_1/low; implementation evaluators muse_spark_1_3/xhigh then opus_5/xhigh.
Owner override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate
session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
Owner also explicitly requested implementation reasoning high. These override the default routes;
separate sessions and vendor independence remain mandatory. Limits: two plan rounds, five
implementation rounds; two consecutive terminal failures escalate.
