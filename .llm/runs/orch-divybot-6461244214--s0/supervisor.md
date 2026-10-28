# S0 supervisor

Date: 2026-10-28. Branch: `orch/divybot-6461244214`. Baseline: `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d` (fast-forwarded from dispatcher checkout before implementation).
Implementer: OpenAI Codex, feature tier, high effort as requested.

## Authorized write surface

- `.llm/runs/orch-divybot-6461244214--s0/**` — plan, evaluation, evidence and lessons.
- `packages/fresh-ui/scripts/build-tokens.ts`, `packages/fresh-ui/deno.json`, `packages/fresh-ui/deno.lock`, `packages/fresh-ui/README.md`, `packages/fresh-ui/registry/theme/{tokens.css,theme-bridge.css,tokens.json}`.
- `tools/fresh-ui-browser/**` — reusable browser harness and before baseline.
- `.github/workflows/fresh-ui-quality.yml`, `.github/scripts/ci-classify-changes{.ts,.test.ts}`.
- `.llm/tools/validation/fresh-ui-quality_test.ts`, `.llm/tools/gates/catalog.ts` if needed for durable gates.
- Scaffold design templates and corresponding generated asset module only if browser evidence requires a scoped accessibility correction (record exact additions before editing).

## Routing

Read feature routing with `deno task agentic:matrix --tier feature --json` (exit 0).
Implementation primary: sol / xhigh; dispatcher selects Codex / high.
Matrix PLAN-EVAL: glm_5_3, then fable_5_1. Matrix IMPL-EVAL: muse_spark_1_3, then opus_5.
Owner override, verbatim: “Run PLAN-EVAL before implementing, and IMPL-EVAL after, both in the opposite family: claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts in the run dir.”
Separate Anthropic evaluation sessions will review the plan and implementation. No self-certification.

## Instruction precedence

Use the supplied leaf process; do not read target repository profiles. Preserve the owner’s no-label and privacy instructions. PR starts with the required Refs URL; final delivery instructions additionally require the exact closing line at the end. Stop at READY; never merge, tag or release. Publish the final issue reply through the requested file handoff.
