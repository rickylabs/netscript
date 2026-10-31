# Preset import safety supervisor

## Repair round (2026-10-31)

- Repair baseline: `69951eb22268d40cfb51373f79b3da838150976b`; same branch and PR #2518.
- Active implementation: assigned Codex, feature tier. Matrix queried with `deno task agentic:matrix --tier feature --json`; implementation `sol` xhigh then `muse_spark_1_3` xhigh; plan evaluation `glm_5_3` provider_default then `fable_5_1` low; implementation evaluation `muse_spark_1_3` xhigh then `opus_5` xhigh.
- Owner override, verbatim: "IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only." Separate session and vendor family retained. Operator-requested implementation effort: high.
- Added allowed write surface: `packages/cli/src/kernel/domain/ui/ui-config.ts`; existing registry/preset tests under `packages/cli/src/kernel/application/ui/v2/tests/`; `packages/cli/src/public/features/ui/add/add-ui-command_test.ts`; existing init safety test; existing preset resolver; this run directory; dated repair lesson `.llm/2026-10-31-preset-import-safety-repair.md`. Existing manifest/carrier generation paths remain allowed if freshness requires them.
- Specific repair directives override generic completion boilerplate: push normally to the existing PR branch, `Refs #2516` only. Existing no-label and no-session-id policy retained. READY permits policy-skipped checks and must include the exact head. Canonical issue report uses the final-report file handoff. Stop at READY; Cockpit merges.

- Baseline: `851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2`.
- Branch/worktree: `orch/divybot-6542502397`, repository root `.`.
- Implementation: assigned Codex, feature tier; matrix primary `sol` xhigh, fallback `muse_spark_1_3` xhigh. Operator requests high effort.
- Matrix implementation evaluation: `muse_spark_1_3` xhigh, then `opus_5` xhigh. Owner override: "IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only." Different vendor family and separate session required.
- Write surface: this run directory; existing preset helpers under `packages/cli/src/kernel/application/ui/v2/presets/`; preset tests under `packages/cli/src/kernel/application/ui/v2/tests/`; public init and UI apply tests; public/maintainer init and their root dependency wiring; `docs/site/reference/cli/commands.md`; generated CLI documentation carriers under `packages/cli/src/kernel/assets/`; dated lesson `.llm/2026-10-31-preset-import-safety.md`.
- No labels or session identifiers in public artifacts. Draft PR references `#2516` only. No merge; READY requires green required checks at the exact head.

## CI repair scope

Owner steering: "New activity on your PR — address each item, push fixes, keep the PR green: CI quality: FAILURE". Add `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv` to the allowed write surface for generated manifest freshness only. No parity policy, workflow, pins or labels change.
