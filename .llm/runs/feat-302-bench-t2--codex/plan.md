# Plan

## Profile

- Archetype 6 (CLI/tooling): the affected behavior is the bench command flow and its task catalog.
- Overlays: none; task prose is implementation data rather than a docs-site surface.
- Current doctrine verdict: `@netscript/bench` is not listed in doctrine file 10; new files follow
  its existing horizontal domain/ports/adapters/application/presentation shape.

## Locked decisions

1. Mirror the t1 task layout, including a withheld golden reference, because conformance treats all
   registered tasks uniformly.
2. Use a deterministic HTTP contract: checkout creation queues payment work; saga events advance
   or compensate state; a named UTC schedule trigger queues reconciliation work.
3. Persist workflows and jobs through `@netscript/kv`, allowing a real restart probe.
4. Make fake mode load every frozen suite and derive its fixture size from the loaded probe count.
5. Do not run a live agent bench; real t1+t2 runs remain owner-gated.

## Open decisions

- Safe to defer: live model, credentials, per-run budget, repeat count, and cross-framework lanes.
- Must resolve now: none.

## Risks

- Race-prone background work: avoided by explicit event/trigger HTTP operations in the frozen
  contract; the rubric still rewards real saga/worker/trigger primitives.
- False fake coverage: mitigated by dynamic-importing each task suite and using its actual probe
  count.
- Reference divergence: mitigated by conformance replay and unit coverage of the frozen suite.

## Gates

- `deno task bench:conformance`
- `deno task bench:self:fake`
- bench unit tests
- scoped check/lint/format wrappers for `packages/bench`

## Deferred scope

Paid real-agent runs, N>=3 variance, regression thresholds, and cross-framework comparison remain
owner-gated and do not close #302.
