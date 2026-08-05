## Summary

Stop `netscript db` from reconstructing a second Aspire resource graph against resident PGDATA.
Run database operations as explicit-start resources inside the already-running resident AppHost,
and make the documented quickstart prove single-postmaster ownership and post-teardown integrity.

The wave-6 published-0.0.4 pilot lost hours, reset its database twice, and required a host-level
privileged scrub after the second Postgres corrupted the shared data directory.

## Scope

- Archetype: CLI/tooling with Aspire/database scaffold and E2E surfaces
- Closes #1310

## Slices

- [x] S0 — live research and locked D6 plan — `c3b65a698`
- [ ] S1 — RED and resident-operation resource contract
- [ ] S2 — runner and obsolete fallback removal
- [ ] S3 — quickstart corruption regression and docs
- [ ] S4 — merge-readiness and composed evaluation

## Validation

- Planned: no-second-AppHost RED→GREEN, explicit-start generator tests, resident discovery and
  signal/failure coverage, quickstart unique-postmaster/bind + PGDATA teardown probe, scoped
  wrappers, quality, docs, publish, full relevant E2E, and lock hygiene.

```acceptance-evidence
issue: 1310
entries:
```

## Harness

- Run dir: `.llm/runs/fix-db-resident-connection-1310--1310/`
- Plan-Gate: composed per milestone-run.md (orchestrator waiver), ruling D6.

## Definition of Done

- [ ] Running-resident DB commands address a resident explicit-start resource and start no AppHost.
- [ ] No standalone stateful fallback can mount resident DataPath.
- [ ] Quickstart proves one Postgres on the bind source and intact PGDATA after teardown.
- [ ] Second-terminal documentation matches the fixed resident-first contract.
- [ ] Required gates, acceptance mirror, review threads, and composed evaluation pass.
