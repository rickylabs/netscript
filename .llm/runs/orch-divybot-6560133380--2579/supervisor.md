# Default service records and projections

- Assignment: #2579; feature tier, implementation role, supplied leaf profile.
- Baseline: `4cb0298d7b7020930f1e6b05ca827c8330802d4e`.
- Branch: `orch/divybot-6560133380`; worktree: `.`.
- Implementation: Codex, OpenAI, `gpt-6.1-sol`, requested `xhigh`.
- Matrix resolved with `deno task agentic:matrix --tier feature --json`: implementation `sol@xhigh`, fallback `muse_spark_1_3@xhigh`; plan evaluation `glm_5_3@provider_default`, fallback `fable_5_1@low`; implementation evaluation `muse_spark_1_3@xhigh`, fallback `opus_5@xhigh`.
- Owner overrides implementation evaluation: `claude -p --model claude-opus-5-5 --effort high`, read-only, separate Anthropic evaluator. Exact grant is retained in `worklog.md`.
- Allowed writes: this run directory; CLI scaffold source, templates, generated carriers and tests under `packages/cli/`; corresponding shipped CLI resources under `resources/`; maintained carrier generators under `.llm/tools/`; focused CI/runtime proof under `.github/workflows/` if existing workflow policy cannot run the requested proof. Any additional path requires an explicit drift entry before editing.
- Private generated projects, prompts, raw logs, and evaluator continuation metadata: project run output outside the public repository. Public artifacts use repository-relative paths and omit session identifiers.
- Delivery: one draft PR, `Refs #2579`, no labels; merge main if needed, push normally; publish READY only after required gates pass or workflow-policy skips are verified. Cockpit owns merging.
