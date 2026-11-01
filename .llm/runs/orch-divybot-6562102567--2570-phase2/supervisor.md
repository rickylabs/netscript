# Scaffold phase 2 — supervisor

Baseline: `51175490de51f655f7573b5922f3a14443b0b11a`.
Branch: `orch/divybot-6562102567`. Worktree: `.`. Tier: feature.
Implementation: owner-dispatched Codex Astra, xhigh. Review: separate read-only Codex session, with Cockpit cross-family review at READY, per exact owner override.

Writable surface: `packages/cli/src/`, `packages/cli/e2e/`, generated CLI asset carriers, `packages/fresh-ui/` only if a shared component defect blocks the specified interaction, generated agent-doc/MCP export carriers, `.llm/runs/orch-divybot-6562102567--2570-phase2/`. Generated fixtures under `.llm/tmp/scaffold-2570-phase2/`; private logs/evaluator identity under the project runs directory, outside tracked public evidence. Assignment and final-report handoff are excluded from commits.

Routing query: `deno task agentic:matrix --tier feature --json` at baseline. Defaults: implementation sol/xhigh then muse_spark_1_3/xhigh; plan evaluation glm_5_3/provider_default then fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh then opus_5/xhigh. Owner override applies; no inferred provider fallback.

Scope: real projection-driven Utility pages; seeded live/plugin/browser proof; source, emitted-app, carrier and CI gates. No fake template data, rebase, force push, labels, merge, public absolute paths or session IDs. Specific owner process (draft, Refs #2570, READY only after required checks) supersedes generic assignment boilerplate.

S2 support scope: packages/plugin-streams-core/src/application/stream-browser-environment.d.ts, correcting ambient declaration merging required to consume the public streams API from Fresh/Vite. No new runtime API.
