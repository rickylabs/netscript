# Context Pack: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Current phase  | `plan-eval` handoff; hard stop                                       |
| Archetype      | `6 — CLI / Tooling` (supporting MCP member A2)                       |
| Scope overlays | `docs`                                                               |

## Current state

Bootstrap, live issue research, source research, JSR surface scan, bounded plan, and Design
checkpoint are complete. Draft PR #1663 targets immutable `main` base
`05fc3132b6800a85eb6152691a961b658962571b`. The plan owns exactly six product/config files and
requires formal PLAN-EVAL. No implementation is authorized, and the expensive gate has not been
requested or run.

## Completed

- Bootstrap commit `25c29575c` pushed with explicit refspec.
- Draft PR #1663 opened with exact closing keywords, checkable DoD, `type:fix`, `area:tooling`,
  `status:research`, milestone `0.0.7`; no acceptance-evidence blocks.
- All three issues re-read live.
- Three cwd failures and MCP fmt config crash reproduced through structured wrappers.
- `closeScoreGap` definition, consumption, and decorative test behavior traced.
- Six-file plan and per-member JSR audit plan locked.

## In progress

- Awaiting topic-supervisor PLAN-EVAL after the research + plan handoff commit/comment.

## Next steps

1. Topic supervisor launches a fresh native opposite-family Fable 5 medium PLAN-EVAL.
2. If and only if verdict is `PASS`, coordinator grants implementation authority.
3. Future implementation follows S1-S4; S4 requests the serialized `scaffold.runtime` mutex.

## Key decisions

| Decision                             | Source         | Notes                                                                           |
| ------------------------------------ | -------------- | ------------------------------------------------------------------------------- |
| Root config excludes invalid fixture | plan L3/L4     | Exact standalone formatter command must work; fixture remains malformed/tested. |
| Module-derived CLI paths             | plan L1/L2     | No ambient cwd and no weakened assertion.                                       |
| `0.5` pinned both directions         | plan L5/L6     | Inside/outside identity conflict makes movement observable.                     |
| Formal PLAN-EVAL required            | plan judgement | This thread cannot self-launch or self-certify.                                 |

## Authoritative product/config edit surface

1. `deno.json`
2. `packages/cli/e2e/src/application/gates/scaffold/service-env/service-env-gates_test.ts`
3. `packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts`
4. `packages/cli/e2e/src/application/gates/scaffold/run-documented-stream-example.ts`
5. `packages/mcp/src/domain/docs/guidance-index.ts`
6. `packages/mcp/tests/guidance-retrieval_test.ts`

Everything else in the frozen outer bound is read-only, especially both docs sources and the broken
fixture. A seventh path is rescope.

## Gates

| Gate family | Current status               | Evidence                                       |
| ----------- | ---------------------------- | ---------------------------------------------- |
| Plan-Gate   | REQUIRED / NOT_RUN           | `plan.md`; evaluator absent by design.         |
| Static      | NOT_RUN                      | No implementation.                             |
| Fitness/JSR | planned                      | `research.md` and `plan.md` per-member tables. |
| Runtime     | NOT_RUN                      | Coordinator mutex not granted.                 |
| Consumer    | baseline failures reproduced | `worklog.md` research diagnostics.             |

## Open questions

- None that change implementation. Only external authorization/mutex state remains.

## Drift and debt

- Drift: coordinator thread file preseed; root task wrapper exclusion does not fix standalone
  command.
- Debt: no new/closed entry; named CLI/MCP baseline debt remains unchanged.

## Commits

- Draft PR commit list + phase comments are authoritative; no `commits.md`.
