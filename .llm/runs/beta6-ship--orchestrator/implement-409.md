use harness

# Slice brief — #409 T8: real grouped-trace Flow-B e2e (epic #399 merge gate)


## SKILL
netscript-harness, netscript-cli, netscript-tools, netscript-doctrine

## Identity (per lane-policy)
Provider openai · model GPT-5.6 Sol · effort medium. Implementation slice under Tier-A supervisor
`fb43bc3e` (beta6-ship orchestrator). Branch: `feat/409-telemetry-t8-flowb-e2e` off `origin/main`
(after PR #568/T6 merge). Commit in slices; push each with
`git push origin HEAD:refs/heads/feat/409-telemetry-t8-flowb-e2e` (explicit refspec). Do NOT open
the PR — the supervisor owns PR lifecycle. When done, write a completion summary to
`.llm/runs/beta6-ship--orchestrator/worklog-409.md` in the worktree and commit it.

## Objective
Issue #409 (Closes #409 in PR body). Generalize
`packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts` `BEHAVIOR_OTEL_TRACES` into a real
(non-mocked) Flow-B grouped-trace assertion suite run under `scaffold.runtime`:

- single `trace_id` across all processes;
- parent/child edges: enqueue→dequeue, `job.execute` child of dispatch, callback child of
  `job.execute`;
- fan-in span link present (T5 `createFanInLinks` behavior);
- no severed/fresh-trace regression (triggers guard);
- attribute floor: `netscript.correlation.id` + outcome, per #402 TC conventions and `netscript.*`
  namespacing;
- wire a REAL streams consumer for the fan-in leg (eis-chat scaffold is inert — do not rely on it).

Use the T7 `@netscript/telemetry/query` Aspire adapter (`AspireTelemetryQuery`, dashboard
`/api/telemetry/*`) as the read side — no span mocks.

## Acceptance
- Suite green under `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Each assertion names its #402 TC id; killing the T6 oRPC fix or triggers propagation makes a
  named assertion red.
- Scoped wrapper check/lint/fmt over `packages/cli` green; no new `as` casts; no deno.lock churn.

## Constraints
- Read `.llm/harness/` run-loop + `.agents/skills/netscript-cli` before editing suites.
- Do not modify telemetry package source — e2e/cli layer only (plus minimal scaffold template
  wiring for the real streams consumer if required).
- Record drift in the run dir `.llm/runs/beta6-ship--orchestrator/` (worklog-409.md).
