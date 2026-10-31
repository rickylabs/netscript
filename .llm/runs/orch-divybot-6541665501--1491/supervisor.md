# Command and relay documentation — #1491

Baseline: `4e018ad0bab9b9b90daf4764a035fd3ff879b9fa` (current main at intake).
Branch: `orch/divybot-6541665501`. Implementer: Codex, feature tier, high effort.
Scope overlay: SCOPE-docs; describes the existing service command DSL and relay runtime without changing their contracts.

Allowed writes: `docs/site/**`, documentation tooling under `.llm/tools/docs/**` when needed to compile the new pages, this run directory, and canonical generated documentation carriers: `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`, `packages/mcp/src/publish-assets.generated.ts`, and the generated assets barrel if required. Assignment and final-report handoff files are excluded from commits.

Evaluator: separate Anthropic session, read-only, `claude-opus-5-5`, high effort, stdin closed, through the repository agentic Claude print wrapper. PLAN-EVAL precedes implementation; IMPL-EVAL reviews the pushed head. Reuse evaluator sessions across rounds.

Matrix consulted with `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh then muse_spark_1_3/xhigh; plan evaluation glm_5_3/provider_default then fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh then opus_5/xhigh. Owner override (verbatim): “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Feature limits: two plan rounds, five implementation rounds; two consecutive terminal failures stop the leaf.

The milestone coordinator owns labels, milestone, merge, tag and release. No local scaffold.runtime run is authorized for this docs leaf. Public records omit private host, endpoint, session and absolute operator path metadata.
