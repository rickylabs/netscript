## Summary

Research the truthful resource and health-check design for scaffolded SQLite and Deno KV. This is
an honest partial: no product implementation is retained because the pinned service and TypeScript
SDK cannot support the acceptance contract with the issue's proposed-sized change.

## Scope

- Archetype / area: CLI Aspire scaffold and database infrastructure
- References #1251 (does not close it)

## Slices

- [x] S0 Issue-first research, SDK inspection, locked plan, draft surface — `115da0d5c`
- [x] S1 Reproduced generated graph paths and upstream health capability boundary — pending commit
- [ ] S2 Product implementation (stopped: requires a probe-resource design)

## Validation

- Focused generator prototype: 4 passed / 42 steps; discarded because the generated `/health`
  check would fail against Deno KV Connect 0.11.0.

## Harness

- Run dir: `.llm/runs/fix-aspire-backing-resources-1251--1251/`
- Route: openai / gpt-5.6-sol / medium
- Phase: blocked design / honest partial

## Drift / Debt

- Deno KV Connect 0.11.0 exposes authenticated POST protocol routes and no HTTP health endpoint.
- Aspire 13.4 TypeScript AppHosts cannot register custom AppHost health checks.
- SQLite needs a truthful file-readiness probe resource; representing it as a parameter would only
  change the dashboard shape, not prove health.
- Inherited lockfile churn remains excluded.

```acceptance-evidence
issue: 1251
entries:
  - box-index: 1
    evidence: "Pending implementation."
  - box-index: 2
    evidence: "Pending implementation."
  - box-index: 3
    evidence: "Pending implementation."
  - box-index: 4
    evidence: "Pending implementation."
  - box-index: 5
    evidence: "Pending implementation."
```
