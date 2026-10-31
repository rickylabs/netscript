# Issue 2144 supervisor contract

- Assignment: issue #2144, milestone 0.0.9, group A3; coordinator #2474.
- Baseline: `7907293f3dad3aeb557923809ddcd3435adae151`.
- Branch: `orch/divybot-6536190825`; one PR directly to main.
- Implementation: Codex, OpenAI family, feature tier, requested xhigh effort.
- Evaluators: separate Anthropic Claude sessions, read-only, stdin closed.
- Owner matrix override (verbatim): "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."
- Queried authority: `deno task agentic:matrix --tier feature --json`; implementation Sol xhigh; owner override controls evaluator selection. Plan limit 2; implementation limit 5; same session re-steered across rounds.
- Permitted writes: `.llm/runs/orch-divybot-6536190825--2144/**`; worker job domain/builders/ports/runtime/testing/stores under `packages/plugin-workers-core/**`; worker execution/composition/health/tests and registry generation under `plugins/workers/**`; worker retry registry generation under `packages/cli/**` only if research proves necessary; `docs/site/background-processing/how-to/tune-worker-runtime.md`; worker package README/export declarations only when a public port requires it.
- Forbidden surface: listener-supervisor; lock files; unrelated changes; labels/milestones; merge/tag/release.
- Runtime acceptance: use local structured gates, real KV and available Redis queue adapters; scaffold.runtime is CI-only by owner instruction.
- Public artifacts contain only repository-relative paths and no private runtime/session details.
- Scoped debt writes: append only the issue-2144 domain-cardinality entry to `.llm/harness/debt/arch-debt.md`; the new cohesive retry policy raises immediate domain children from 12 to 13, so retain explicit follow-up cost rather than reshuffling unrelated domain files.
- S2 health transport scope: `packages/plugin/src/presentation/run-child-health-process.ts` and its focused health test may add backward-compatible async snapshot support. This lets each workers health request await durable DLQ depth instead of reporting a stale process-local counter. Generated workers runtime glue and bin/runtime.ts carry the compatible async reader; no listener-supervisor change.
- Documentation freshness scope: the canonical `gen:agent-docs-prose` task may refresh the shared CLI/MCP carrier `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`, its deterministic `.llm/assets/agent-docs/provenance.json`, and `packages/cli/src/kernel/assets/llms-policy.generated.ts` only if the task changes them. Inspect its exact delta, retain only generated changes required by the edited worker recipe, and record the quality-gate failure/repair before final evaluation.
- Public export freshness scope: `deno task gen:mcp-export-corpus` may refresh only `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` after the source read set is committed, as its clean-tree guard requires. Prove freshness and the generator regression tests before final exact-head approval.
