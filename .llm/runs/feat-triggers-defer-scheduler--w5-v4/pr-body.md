## Summary

Add the durable one-shot scheduler/replay seam required for trigger handlers that return
`DeferAction`, replacing the current unsupported-operation → DLQ path.

Do not merge until runtime, durability, JSR, and composed evaluation gates are complete.

## Scope

- Core-owned one-shot defer/replay contract and KV-backed persistence.
- Thin plugin runtime composition that resolves definitions and replays due events.
- Fake-clock fire, cancel, past-due, and restart recovery tests through the public runtime path.
- Re-judgement of both `arch-debt:triggers-defer-unsupported` caveats and the debt entry.

Closes #1229

## Slices

- [x] S0 Live-issue research, locked contract plan, and D6 composed Plan-Gate — `db5023295`
- [x] S1 RED proof through the public plugin runtime
- [x] S2 Core scheduler/replay contract and durable adapter
- [x] S3 Plugin scheduling/replay lifecycle
- [ ] S4 Caveat/debt burn-down and archetype gates

## Harness

- Run: `.llm/runs/feat-triggers-defer-scheduler--w5-v4/`
- Archetype: 5 (plugin), folding core runtime behavior; docs overlay
- PLAN-EVAL: every row `COMPOSED` per milestone-run.md + ruling D6
- Lock hygiene: inherited `deno.lock` modification excluded

## Validation

- [ ] RED/GREEN defer lifecycle tests (fake clock; no real sleeps)
- [ ] Scoped check/lint/fmt wrappers
- [ ] Core/plugin JSR, doc, and publish dry-run gates
- [ ] Quality, architecture, consumer, and plugin verification gates
- [ ] Composed implementation evaluation

```acceptance-evidence
issue: 1229
entries: []
```
