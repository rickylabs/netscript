# Context Pack: sdk-typed-error-channel (#1350)

## Run Metadata

| Field          | Value                                                          |
| -------------- | -------------------------------------------------------------- |
| Run ID         | `fix-sdk-typed-error-channel--0.0.7-wave1`                     |
| Branch         | `fix/sdk-typed-error-channel`                                  |
| Current phase  | `plan` — amended; awaiting fresh Tier-A review, then PLAN-EVAL |
| Archetype      | `1 — Small Contract` slice                                     |
| Scope overlays | `docs`                                                         |

## Current state

Research and a concrete error contract are complete. No product or docs implementation exists. The
base RED is TS2339 because `safe()` erases `TError` and `isDefinedError()` narrows the result to
`never`. The coordinator authorized `packages/sdk/src/ports/service-client.ts` as the sixth and
final product path. #1466 owns metadata definition/export; this leaf keeps only the existing fourth
generic slot as `Record<never, never>` and makes no metadata semantic claim.

## Completed

- Required skill/harness/doctrine/RFC/issue reading.
- `deno doc` public-surface inspection before source inspection.
- Focused source map and executed whole-repo consumer search.
- Exact RED and JSR/publish baseline inspection.
- Research, plan, design, risk/gate set, docs dispositions, and rescope report.

## Next steps

1. Fresh Tier-A reviews the amended head.
2. A separate session performs PLAN-EVAL after that review passes.
3. Only after PLAN-EVAL PASS may implementation begin.

## Key decisions

- Exact six-key `typeof commonErrorMap`; never open `ErrorMap`.
- `SafeResult` gains literal defined/non-defined failure arms and failure `data: undefined`.
- No broad fallback error union; error identity must originate in the real client promise.
- Breaking published change, not patch-level.
- No new export. The empty fourth metadata generic remains explicit; all metadata vocabulary belongs
  to #1466.
- The exact six-path ceiling is locked; any seventh product/test/docs path requires a fresh ruling.

## Files changed

Only `.llm/runs/fix-sdk-typed-error-channel--0.0.7-wave1/` plan-phase artifacts. The
launcher-created `codex-thread-ids.md` is preserved. No declared product/doc file was modified.

## Gates

- Plan artifacts: ready for topic-orchestrator ruling.
- PLAN-EVAL: not launched by instruction.
- Implementation/static/docs/fitness gates: not run.
- Baseline JSR/publish inspection is recorded in `research.md` and `worklog.md`.

## Open questions

- None that can force implementation rework. Stale contracts/benchmark prose is tracked follow-up
  debt outside the six-path ceiling.

## Drift and debt

- Drift: the earlier scope and ownership conflicts are resolved by the coordinator amendment; see
  the append-only resolution in `drift.md`.
- Debt: no new debt accepted.
- Commit trail: draft PR commit list plus phase comment; no `commits.md`.
