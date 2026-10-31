# Watch recovery and native strategy — #2151

- Branch: `orch/divybot-6537103305`; base: `main` at `a410a815ce1401d533b18f2a85eb75e266de94a5`.
- Implementation: assigned Codex implementer, feature tier, xhigh effort.
- Separate reviewer: owner-requested native Claude `claude-opus-5-5`, high effort, read-only, stdin closed; preserve reviewer context across rounds.
- Owner override (assignment): “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
- Matrix resolved with `deno task agentic:matrix -- --tier feature --json`: implementation sol/xhigh; normal plan evaluation glm_5_3, normal implementation evaluation muse_spark_1_3. Owner's explicit evaluator override applies.
- Authorized write surface: this run directory; `packages/plugin-triggers-core/src/{adapters,ports,domain,runtime,public}/` watch contracts/recovery/health and their tests; `plugins/triggers/src/` processor wiring and health/tests; `packages/watchers/` native strategy/contracts/tests/docs; `docs/site/reference/watchers/index.md` and triggers reference documentation if needed. Generated publish assets only if the repository documentation gate requires refreshing them.
- Preserve sibling event key (`#eventFor`, #2187/#2479) and processor dedup key (#2165/#2477). Merge main without force-pushing after #2479 merges.
- Draft PR starts with Refs URL, no labels/milestones; coordinator owns merging and expensive E2E. No local scaffold.runtime run.
- Privacy: repository-relative paths and role identities only; no operator paths, hostnames, ports, or session identifiers in public records.
