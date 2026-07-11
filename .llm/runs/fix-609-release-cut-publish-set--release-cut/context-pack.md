# Context Pack

- Phase: Implement
- Branch/base: `fix/609-release-cut-publish-set` / `origin/main@720fcb7e`
- Scope: `.llm/tools/release/**` plus this run directory
- Re-baseline drift: current publisher already includes `@netscript/ai` and `@netscript/plugin-ai-core`; missing safeguard is an explicit intended-vs-effective audit.
- Plan: add publish-set delta audit, markdown stale-pin preflight, cut integration, tests, and dry-run evidence.
- Safety: no publish/tag/release; preserve `deno.lock`; `docs/site/**` warn-only.
- PLAN-EVAL: cycle 1 `FAIL_PLAN` on slice attribution, corrected; cycle 2 separate-session `PASS`.
- Implemented: intended/effective publish audit, explicit `packages/bench` exclusion, stale markdown scan, deferred-site reporting, and cut hook.
- Real audit: 34 effective members including all three AI surfaces; zero deltas; markdown zero blocking / one deferred site finding.
- Next: final gates, supervisor review, commit/push/comment, then separate IMPL-EVAL.
