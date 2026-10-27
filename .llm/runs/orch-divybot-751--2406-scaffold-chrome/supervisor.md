# Supervisor Identity — orch-divybot-751--2406-scaffold-chrome

| Field | Value |
| --- | --- |
| Model | Claude Opus 5.5 (`claude-opus-5-5`), effort `xhigh` |
| Session | Claude Code 2.1.306, orchid dispatch for rickylabs/harness#751 |
| Host | `ai-agents` / Linux / `node` |
| Checkout | `/home/agent/projects/orchid/worktrees/issue-751` (shallow orchid worktree) |
| Worktree | `/home/agent/projects/orchid/worktrees/issue-751` |
| Branch | `orch/divybot-751` |
| Baseline | `a833dfa8a3095bb6434cf7ae8bf24f954cf2f1bd` `main` — `chore(release): cut 0.0.8 (#2389)`, 2026-10-12 |
| Run ID | `orch-divybot-751--2406-scaffold-chrome` |
| Upstream issue | rickylabs/netscript#2406 (items 1 + 4 of 4; see split below) |
| Tier / profile | `feature` / harness `leaf` profile (dispatcher-supplied, Harness `2f4720dd`) |

## Routes in force

Resolved with `deno task agentic:matrix --tier feature --json` (pinned Harness `bd02f966…`); raw
output in `matrix-feature.json`.

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| implementation | Claude Opus 5.5 `xhigh` (owner override, see below) | generator + Tier-A supervisor |
| implementation_evaluation | `muse_spark_1_3@xhigh` (family `meta`, OpenCode → OpenRouter) | IMPL-EVAL |
| implementation_evaluation fallback | `opus_5@xhigh` | **skipped**: same vendor family (anthropic) as generator |
| plan_evaluation | `glm_5_3` → `fable_5_1@low` | not selected (`PLAN-EVAL: N/A`, see worklog) |

## Recorded lane/eval overrides

- **Implementation lane = Claude Opus 5.5** instead of the matrix primary `sol@xhigh`. Authority:
  the owner's dispatch on rickylabs/harness#751, verbatim: `harness: claude` / `tier: feature` /
  `role: implementation` / `model: claude-opus-5-5` / `effort: xhigh` / `profile: leaf`. Mirrored
  in `drift.md`. Evaluator family independence is unaffected (generator anthropic, evaluator meta).

## Write surface (declared)

Anything changed outside this list is drift.

- `packages/cli/src/kernel/assets/app/routes/_layout.tsx.template`
- `packages/cli/src/kernel/assets/app/navigation.ts.template` (new)
- `packages/cli/src/kernel/assets/manifest.ts`, `packages/cli/src/kernel/adapters/templates/scaffold-template-assets.ts`
- `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts`
- `packages/cli/src/kernel/application/ui/{web-scaffold,remove-ui-page,registry-styles,app-navigation}.ts` + tests
- `packages/cli/src/public/features/ui/{add,remove}/*.ts` + tests
- `packages/cli/src/kernel/templates/app/route-templates_test.ts`, `app-template-test-support.ts`
- `skills/netscript-build/SKILL.md`
- generated carriers refreshed by `gen:assets-barrel` / `gen:publish-assets`
- this run directory

## Split with sibling session (#752)

rickylabs/harness#752 is a second inbox stub for the same upstream issue. Agreed split by
cross-session message, 2026-10-21: **#751 (this run)** owns issue items 1 + 4 (scaffold chrome,
`ui:add page` nav/hint, `ui:remove page` reconcile, `netscript-build` skill) plus the
`registry-styles.ts` custom-tail fix; **#752** owns items 2 + 3 (theme-chain docs in
`customize-fresh-ui.md`, a design guide page, MCP embedded corpus, `agent-conventions.ts`,
fresh-ui primitives) and files the complementary design caveats issue. Both PRs use `Refs #2406`.
