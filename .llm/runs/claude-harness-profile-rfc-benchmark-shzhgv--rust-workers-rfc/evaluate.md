# IMPL-EVAL — claude-harness-profile-rfc-benchmark-shzhgv--rust-workers-rfc

**Verdict: PASS** (`OPENHANDS_VERDICT: PASS`)

| Field | Value |
| --- | --- |
| Evaluator session | OpenHands cloud run 32309331096 (separate session) |
| Model / route | `openrouter/deepseek/deepseek-v4-flash-0731` (lane-policy relay route; owner-dispatched after draft→ready) |
| Trusted base | 8ab438d471950420a28b0f767a6d96ec01213c08 |
| Evaluated head | b0cd3d46537fce14b259b5ed1a8ab4478beacc23 |
| Verdict provenance | PR #1683 comment (2026-08-19T22:44Z) |

## Independently verified

- All headline figures re-derived from raw JSONL (460 samples): P1 4.5 jobs/s + 878 ms blocked
  jitter; P2 3.3× at 3.6 MB/isolate; P3 3.8×; P4 79.3 jobs/s = 17.6× with 1.9/4.2 ms jitter
  (passes pre-registered L5 liveness bar; K=8 waving supports size-to-cores); P5 53.9 ≈ 53.1 ms.
- R2-D-2 verified at source (zero isolate constructions; `WORKER_RUNTIMES` vocabulary without
  implementation). Scope/lock hygiene clean; PLAN-EVAL: N/A accepted; no false-done states.

## Findings

1. **LOW (applied post-verdict):** RFC wording "poolSize and workerUrl accepted but never read"
   → `workerUrl` is read (`worker.ts:113`) and forwarded before the pool ignores it. Fixed to
   "accepted unused / read but not honored for isolate creation" in the close commit, per the
   evaluator's suggested wording; substance of the claim was verified accurate.
2. INFO items (scope clean, claims validated, no forbidden states): no action.

## Post-verdict head note

The close commit contains this mirror, the finding-1 wording fix (evaluator-suggested), and
worklog bookkeeping. Benchmark data and all other RFC content unchanged since evaluated head.
