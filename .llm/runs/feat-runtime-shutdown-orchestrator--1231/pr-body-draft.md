## Summary

Adds an app-wide `host.shutdown()` composition root over the existing service, worker, queue, and
database drain paths. One deterministic order and one deadline now govern the whole in-process app.

## Scope

- Archetype / area: runtime behavior in `@netscript/service`, service + docs overlays
- Closes #1231

## Slices

- [x] S0 research and locked design
- [ ] S1 host contract, one-budget orchestration, and deterministic tests
- [ ] S2 caveat/debt burn-down and final evidence

## Validation

- Focused runtime-host tests — pending
- Scoped check/lint/fmt — pending
- `packages/service` tests — pending
- JSR/doc/publish gates — pending
- Archetype quality gates — pending

## Harness

- Run dir: `.llm/runs/feat-runtime-shutdown-orchestrator--1231/`
- Phase: plan; D6 `COMPOSED_WAIVER` for local PLAN-EVAL
- Do not merge until formal IMPL-EVAL passes and every acceptance claim is earned.

## Drift / Debt

- D6 waiver recorded. Runtime shutdown debt remains open until S2 proves and removes it.

## Definition of Done

- [ ] Existing service, worker, queue, and database drains compose under one host budget.
- [ ] Deterministic tests prove ordering, budget exhaustion, and partial-failure reporting.
- [ ] The invalidated caveat marker/call-out and debt entry are removed; remaining warnings stay.
- [ ] Required Archetype-3, service, docs, JSR, and consumer gates pass.

```acceptance-evidence
issue: 1231
entries:
  - box: "A composed shutdown orchestrator drains all app resources under a single budget, wrapping the existing per-resource drains (no new drain logic)."
    evidence: "Pending S1 implementation and focused tests."
  - box: "Deterministic tests: ordering, budget exhaustion, partial-failure reporting."
    evidence: "Pending S1 controlled-timer test evidence."
  - box: "Caveat marker + call-out removed; debt entry closed."
    evidence: "Pending S2 marker/debt search."
  - box: "Archetype gates green."
    evidence: "Pending final gate table and IMPL-EVAL."
```

