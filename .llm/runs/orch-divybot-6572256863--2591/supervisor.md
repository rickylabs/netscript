# Supervisor — issue 2591

- Baseline: `6766130bbafbe78a9bb5870f704987cb0743c5e6`.
- Branch/worktree: `orch/divybot-6572256863`, repository root `.`.
- Assignment: repair the documented scaffold lifecycle and stream linking; no visual redesign.
- Implementation: Codex, feature tier, matrix `sol` at `xhigh`; separate cross-family evaluator required.
- Matrix read with `deno task agentic:matrix --tier feature --json`: implementation `sol` then `muse_spark_1_3`; implementation evaluation `muse_spark_1_3` then `opus_5`, both xhigh. Plan evaluation `glm_5_3` then `fable_5_1` if risk-selected.
- Allowed write surface: `packages/cli/`, `plugins/workers/`, canonical scaffold templates/resources under `resources/`, related docs under `docs/`, generated carriers only through their generation tasks, this run directory, `.llm/2026-11-02-scaffold-documented-lifecycle.md`. Ignored local scratch under `.llm/tmp/`; final handoff `.divybot-final-report.md`.
- Public run artifacts use repository-relative paths only. No credentials. Assignment file is excluded from commits.
- Delivery: early draft PR with `Refs #2591`; no issue closing keyword, no rebase, no force push, no merge. Honor the operator's specific canary hold over generic assignment boilerplate. READY only after final-head checks and runtime CI evidence.
