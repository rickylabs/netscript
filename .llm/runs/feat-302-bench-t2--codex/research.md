# Research

## Re-baseline

Baseline `eac57c5f5ac4c10b9c1cc5b17874ae821b27a20d` contains one registered bench task,
`t1-storefront-api`. `bench conformance` iterates every registered task and expects a golden
reference at `reference/netscript/main.ts`. `bench self --fake` iterates every task but currently
uses a fixed five-probe fixture without loading the task's frozen suite.

## Findings

- A task conventionally owns `prompt.md`, `context/AGENTS.md`, `rubric.md`, a withheld
  `tests/frozen-suite.ts`, and a withheld runnable reference.
- The tutorial durable-workflow spine is: a correlated saga state machine emits queued worker
  work; worker outcomes return as saga events; `defineScheduledTrigger` emits an `enqueueJob`
  effect on a five-field cron schedule with an explicit timezone.
- The conformance harness already supports process restart with a stable Deno KV path.
- The fake path must dynamically load each suite to prove its registered module and probe list are
  valid; it can still use deterministic synthetic results and spend no API budget.

## Publishability

N/A for this slice: `@netscript/bench` is `publish: false`, and no public export is added. The
planned change extends task data and internal CLI wiring only.
