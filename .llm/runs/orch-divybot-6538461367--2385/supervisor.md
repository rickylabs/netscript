# Issue 2385 — supervisor

- Implementation: assigned Codex implementation lane, high effort; baseline main `2f426b970d7a00bdbeb09c59b72b49478b839a5a`.
- Branch: `orch/divybot-6538461367`.
- Workload: feature (owner explicitly selects feature-tier review limits).
- Profile: dispatcher-supplied leaf; no repository profiles used.
- Allowed writes: `docs/site/**`, `.llm/tools/docs/**`, and this run directory. Product package/plugin sources and lockfiles are excluded.
- Evaluation: independent read-only Claude sessions, `claude-opus-5-5`, high effort, as explicitly requested by the owner; no private runtime identifiers in published artifacts.
- Matrix resolved via `deno task agentic:matrix --tier feature --json`. Default implementation sol/xhigh; plan evaluation glm_5_3/provider_default; implementation evaluation muse_spark_1_3/xhigh. Owner override: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
- Review limits: 2 plan rounds, 5 implementation rounds; two consecutive terminal failures stop the leaf.
- PR: draft early; only coordinator merges; no label/milestone mutation.
