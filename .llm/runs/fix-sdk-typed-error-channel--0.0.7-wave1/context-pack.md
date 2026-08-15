# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                     |
| -------------- | --------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                |
| Branch         | `fix/sdk-typed-error-channel`                             |
| Current phase  | `plan` — awaiting scope/ownership ruling before PLAN-EVAL |
| Archetype      | `1 — Small Contract` slice                                |
| Scope overlays | `docs`                                                    |

## Current state

Research and a concrete error contract are complete. No product or docs implementation exists. The
base RED is TS2339 because `safe()` erases `TError` and `isDefinedError()` narrows the result to
`never`. Exact end-to-end repair cannot fit the declared five-file surface because
`packages/sdk/src/ports/service-client.ts` is the loss point. Procedure metadata additionally has a
live owner conflict with #1466 and requires the curated contracts barrel if assigned here.

## Completed

- Required skill/harness/doctrine/RFC/issue reading.
- `deno doc` public-surface inspection before source inspection.
- Focused source map and executed whole-repo consumer search.
- Exact RED and JSR/publish baseline inspection.
- Research, plan, design, risk/gate set, docs dispositions, and rescope report.

## Next steps

1. Topic orchestrator rules on `packages/sdk/src/ports/service-client.ts` scope.
2. Topic orchestrator rules whether #1350 supersedes #1466 for procedure metadata and, if so,
   authorizes `packages/contracts/src/public/mod.ts` plus any required SDK metadata type surface.
3. Update the plan with that ruling if needed; separate session performs PLAN-EVAL.
4. Only after PLAN-EVAL PASS may implementation begin.

## Key decisions

- Exact six-key `typeof commonErrorMap`; never open `ErrorMap`.
- `SafeResult` gains literal defined/non-defined failure arms and failure `data: undefined`.
- No broad fallback error union; error identity must originate in the real client promise.
- Breaking published change, not patch-level.
- No new SDK error export; metadata exports are conditional on ownership ruling.

## Files changed

Only `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/` plan-phase artifacts. The
launcher-created `codex-thread-ids.md` is preserved. No declared product/doc file was modified.

## Gates

- Plan artifacts: ready for topic-orchestrator ruling.
- PLAN-EVAL: not launched by instruction.
- Implementation/static/docs/fitness gates: not run.
- Baseline JSR/publish inspection is recorded in `research.md` and `worklog.md`.

## Open questions

- Required sixth file authorization.
- Metadata owner and required barrel/SDK metadata scope.
- Disposition of already-stale out-of-scope contracts/benchmark prose.

## Drift and debt

- Drift: significant scope and live-ownership conflicts; see `drift.md`.
- Debt: no new debt accepted.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
