# Workers structured lifecycle logging — #2392

Implementation: Codex, assigned branch `orch/divybot-6541170747`.
Baseline: `f6839463668c5dae4ca7234d26909e74e10b89c0`.
Tier: feature. Supplied dispatcher leaf process applies; no repository profiles loaded.
Write surface: per-job logging in `plugins/workers/worker/`, adjacent tests,
`docs/site/background-processing/workers.md`, and this run directory.
Excluded: listener restart/host options, lockfile, scaffold, unrelated runtime wiring.
Separate evaluator: owner override `claude -p --model claude-opus-5-5 --effort high`, read-only, stdin closed.
Routing queried with `deno task agentic:matrix --tier feature --json`.
Primary implementation route sol; evaluator defaults glm_5_3 and muse_spark_1_3 are overridden by the explicit owner directive.
No private environment/session metadata is retained in tracked artifacts.

Scope addition: `plugins/workers/deno.json` direct logger import declaration.

Scope addition justified by frozen dependency gates: root deno.lock and maintained Expo/desktop
reference locks, exactly one workspace dependency-membership line each; no resolved changes.
