## Summary

Represent scaffolded SQLite and Deno KV truthfully in the generated Aspire graph: SQLite receives
a resolved file-path resource, while Deno KV uses the existing Connect container with a concrete
endpoint URL instead of an undefined connection-string parameter.

## Scope

- Archetype / area: CLI Aspire scaffold and database infrastructure
- Closes #1251
- Real backing-service health checks moved to #1280

## Slices

- [x] S0 Issue-first research, SDK inspection, locked plan, draft surface — `115da0d5c`
- [x] S1 Reproduced generated graph paths and upstream health capability boundary — `f79bc29b3`
- [x] S2 Resolved SQLite/Deno KV graph resources and regressions — `e12157a77`

## Validation

- Focused Aspire generators: 4 passed / 42 steps
- CLI package: 594 passed / 485 steps
- Targeted `deno check --unstable-kv`: pass
- Scoped lint/fmt and diff hygiene: pass

## Harness

- Run dir: `.llm/runs/fix-aspire-backing-resources-1251--1251/`
- Route: openai / gpt-5.6-sol / medium
- Phase: implementation evaluation / orchestrator pre-merge gate

## Drift / Debt

- Health checks are explicitly out of scope and tracked by #1280. Deno KV Connect 0.11.0 exposes
  authenticated POST protocol routes and no HTTP health endpoint; Aspire 13.4 TypeScript AppHosts
  cannot register custom AppHost health checks. Generating `withHttpHealthCheck('/health')` would
  therefore be a false probe.
- Inherited lockfile churn remains excluded.

```acceptance-evidence
issue: 1251
entries:
  - box-index: 1
    evidence: "The generated graph registers SQLite exactly once as a resolved, non-secret path-valued resource and stores it in the database map."
  - box-index: 2
    evidence: "Scaffolded Deno KV now selects Container mode; generation emits exactly one Deno KV Connect container and exposes EndpointProperty.Url as DENO_KV_URL."
  - box-index: 3
    evidence: "The scaffold path no longer emits addConnectionString('deno-kv'); both graph resources carry explicit values, eliminating the undefined parameter banner."
  - box-index: 5
    evidence: "A scaffold-level generator regression asserts one SQLite resource, one Deno KV resource, no Deno KV connection-string parameter, and a concrete endpoint URL."
```
