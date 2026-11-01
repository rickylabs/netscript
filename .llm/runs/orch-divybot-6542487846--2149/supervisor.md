# Auth backend persistence — issue 2149

- Baseline: `851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2` (main).
- Branch: `orch/divybot-6542487846`; one leaf PR to main, coordinator owns merging.
- Implementation: assigned Codex session, feature tier, high effort.
- Evaluation: separate Anthropic Claude session, `claude-opus-5-5`, high effort, read-only, closed stdin. Reuse evaluator across rounds.
- Matrix queried with `deno task agentic:matrix --tier feature --json`; implementation primary `sol`; plan evaluation primary `glm_5_3`; implementation evaluation primary `muse_spark_1_3`. Operator explicitly overrides both evaluator routes: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
- Limits: two plan rounds, five implementation rounds; two consecutive terminal failures stop the leaf.
- Writable surface: auth plugin manifest/adapter/scaffold and tests under `plugins/auth/`; plugin persistence contracts under `packages/plugin/` if necessary; plugin install/generation/doctor orchestration and tests under `packages/cli/`; `docs/site/orchestration-runtime/how-to/add-a-plugin.md`; this run directory. Assignment/report handoff files are excluded from Git.
- External actions: push assigned branch, open and ready PR, per-slice PR comments. No labels/milestones, merge, tag, release, or local scaffold.runtime E2E.
- Public evidence uses repository-relative paths, no private machine/session details.

## Consumer-proof scope amendment

Independent IMPL-EVAL required updating stale auth migration claims in the identity docs,
workspace tutorial chapters 1/2/3/6/index, glossary and CLI reference. The corresponding auth
README, executable recipe regression and generated CLI prose carrier are included. The
architecture debt registry receives the scoped install-shape growth record. These paths are
explicitly recorded in drift.md and remain within the single issue's acceptance coherence.
