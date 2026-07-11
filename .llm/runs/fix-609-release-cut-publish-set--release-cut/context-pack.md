# Context Pack

- Phase: Plan-Gate
- Branch/base: `fix/609-release-cut-publish-set` / `origin/main@720fcb7e`
- Scope: `.llm/tools/release/**` plus this run directory
- Re-baseline drift: current publisher already includes `@netscript/ai` and `@netscript/plugin-ai-core`; missing safeguard is an explicit intended-vs-effective audit.
- Plan: add publish-set delta audit, markdown stale-pin preflight, cut integration, tests, and dry-run evidence.
- Safety: no publish/tag/release; preserve `deno.lock`; `docs/site/**` warn-only.
- Next: separate Claude PLAN-EVAL; implementation remains blocked until PASS.
