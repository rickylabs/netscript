# S3 Phase B — IMPL-EVAL cycle 3 `FAIL_FIX` → bounded fix (same thread, same branch, no runtime)

You are the S3 implementer (thread `01a05200-345d-7ef0-bb18-30c4dacdaf4a`, worktree
`/home/agent/projects/netscript/worktrees/007-aspire-s3`, branch `test/aspire-13-5-s3-fixture-recapture`
@ `1611c5868`). The independent evaluator's verdict is in
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s3/evaluate-cycle-3.md`
and on PR #1741 (18:41:28Z). Fix exactly F-1..F-3; **no new capture, no runtime, no AppHost, no
envelope edits, no evaluators**. Push with the explicit refspec; report the new head SHA.

- **F-1 (medium, provenance):** README "Current capture" and the `aspire-13.5.3-fixture.ts`
  header must state the envelope's degraded semantics honestly: captured under the supervisor
  relay (D-74) from a brief-scoped scratch **without** `database.codegen` and **without** the
  `streams` plugin → no consumer/`job.execute` span, 12 web `/health` 500s, worker run not listed;
  say where consumer-span coverage lives (retained 13.4.6 case + the hosted `scaffold.runtime`
  suite) and that this is an environment/scope condition, not 13.5.3 behaviour.
- **F-2 (medium, test honesty):** the 13.5.3 case's `workerSpanKind: 'producer'`,
  `listedRunCount: 0`, `jobFound: false` need an in-test comment naming the cause above and a
  pointer to the README section; if a constant/enum expresses "captured-without-consumer", use it.
- **F-3 (low, bookkeeping):** generator `drift.md` gets attempt-2 (D-43 block) and attempt-3
  (relay D-74, consumer-run gap) entries; `context-pack.md` open questions list the two gaps;
  PR #1741 body Slices/Validation/DoD updated to phase-B wording (keep draft, base, labels,
  closing keywords unchanged).

Gates: scoped `run-deno-test.ts` on `packages/mcp/tests/telemetry-live-fixture_test.ts`,
`run-deno-fmt.ts --ext ts,tsx` on `packages/mcp`, README fmt check. One commit trail, PR comment
`## [PHASE: IMPL] S3 phase B — cycle-3 fixes` with SHA and gate exits.
