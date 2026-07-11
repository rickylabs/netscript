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
- Final gates: 23 release tests pass; scoped check/lint/fmt pass; beta.6 audit shows 34 members / 0 deltas and markdown 0 blocking / 1 deferred; `deno.lock` unchanged.
- Supervisor review completed, including prerelease/stable comparator correction.
- IMPL-EVAL: PASS from a fresh separate Claude Opus 4.8 session; `evaluate.md` records independently reproduced evidence.
- Close-gate: issue #609 has three Acceptance boxes; evidence maps to markdown lint, full-set audit, and the publish:false fixture proving the new gate catches the omitted/unpublished-package defect class.
- Final state: commit/push evaluator artifact, update PR/issue evidence, move to `status:ready-merge`.
