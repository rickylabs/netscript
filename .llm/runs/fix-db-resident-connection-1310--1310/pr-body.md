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
- [x] S1 — RED and resident-operation resource contract — `3efb1052d`
- [x] S2 — runner and obsolete fallback removal — `3efb1052d`, `94da16a9b`
- [x] S3 — quickstart corruption regression and docs — `3efb1052d`
- [x] S4 — merge-readiness and composed evaluation — `18910bd52`

## Validation

- GREEN: focused runner/generator/pipeline/quickstart tests; scoped check/lint/fmt; `quality:gate`;
  CLI doc-lint and publish dry-run.
- Full `scaffold.runtime`: resident start → db init → generate → seed all passed; the run later
  timed out at unrelated `runtime.wait.workers-api`; cleanup passed. See worklog for raw gate names.
- Lock hygiene: pre-existing `deno.lock` modification remains unstaged.

```acceptance-evidence
issue: 1310
entries:
  - box-index: 1
    evidence: "3efb1052d: runner starts netscript-db-<key> in the exact resident apphost; focused test forbids aspire start and nested apphost paths."
  - box-index: 2
    evidence: "3efb1052d: transient db-operation project and mutator were removed; absent resident AppHost now fails closed, so no standalone stateful fallback exists."
  - box-index: 3
    evidence: "3efb1052d + 18910bd52: quickstart holds one PGDATA bind owner across init/generate/seed and runs read-only pg_controldata after teardown; full runtime passed all three DB gates."
  - box-index: 4
    evidence: "3efb1052d: quickstart, migration guide, and storefront tutorial document resident explicit resources and no second Postgres."
```

## Harness

- Run dir: `.llm/runs/fix-db-resident-connection-1310--1310/`
- Plan-Gate: composed per milestone-run.md (orchestrator waiver), ruling D6.

## Definition of Done

- [x] Running-resident DB commands address a resident explicit-start resource and start no AppHost.
- [x] No standalone stateful fallback can mount resident DataPath.
- [x] Quickstart proves one Postgres on the bind source and intact PGDATA after teardown.
- [x] Second-terminal documentation matches the fixed resident-first contract.
- [ ] Required gates, acceptance mirror, review threads, and composed evaluation pass — CI and
  review-thread verdicts pending after the implementation push.
