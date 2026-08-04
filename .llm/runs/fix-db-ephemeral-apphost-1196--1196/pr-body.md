## Summary

Make every one-shot `netscript db` command own and fully retire the DB-operation AppHost it uses,
including success, failure, and signal paths. Preserve the resident AppHost as the sole visible
project and remove the command-scoped operation workspace after return.

The orchestrator reproduced the defect during #1250 verification on 2026-08-04/05: after
`netscript db seed`, `aspire ps` listed both the project's resident AppHost and
`<project>/aspire/db-operation/apphost.mts`; the second required an explicit path-scoped stop and
was holding ports while confusing the project topology.

## Scope

- Archetype / area: CLI / database / Aspire lifecycle
- Closes #1196

## Slices

- [x] S0 — research and locked D6-composed plan — `cd014d666`
- [x] S1 — RED and lifecycle ownership — `e29a7ad9e`
- [x] S2 — consumer regression gate — `e29a7ad9e`
- [ ] S3 — composed evaluation and close-gate handoff

## Validation

- RED-first: the pre-existing exact-path runner scenario failed because no `stop` was issued.
- Focused lifecycle tests: 4 tests / 13 BDD steps pass, including success, failure, and signal.
- CLI package: check and complete test task pass.
- Scoped wrappers: 17 touched CLI/E2E files pass check, lint, and format with zero findings.
- `deno task quality:gate`: pass; no new quality findings or lint ignores.
- CLI publish dry-run: pass (known dynamic-import warnings only).
- `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`: 71 passed, 0 failed;
  `behavior.db-status-preserves-apphost` proves the resident identity is stable and the operation
  AppHost plus its directory/request are absent.
- Lock/resource hygiene: pre-existing `deno.lock` change excluded; run-owned Aspire/Docker probes
  clean, foreign/unproven resources untouched.

```acceptance-evidence
issue: 1196
entries:
  - box-index: 1
    evidence: "operation-runner_test.ts covers success, failure, and SIGINT/SIGTERM cancellation; full scaffold.runtime passed 71/71"
  - box-index: 2
    evidence: "behavior.db-status-preserves-apphost passed and asserts the resident identity is stable while the exact db-operation path is absent from aspire ps"
  - box-index: 3
    evidence: "command wrapper tests prove finally cleanup; live scaffold gate asserts aspire/db-operation and .netscript-db-operation.json are absent"
  - box-index: 4
    evidence: "studio regression proves the long-running command uses the named resident aspire/apphost.mts path and does not materialize a shadow operation host"
  - box-index: 5
    evidence: "the strengthened read-only db status scaffold gate fails on the old leak and passed in scaffold.runtime (71 passed, 0 failed)"
```

## Harness

- Run dir: `.llm/runs/fix-db-ephemeral-apphost-1196--1196/`
- Plan-Gate: composed per milestone-run.md (orchestrator waiver), ruling D6.
- Draft→ready triggers the milestone-run composed evaluator; no local PLAN-EVAL was run.

## Drift / Debt

- #1088's lifecycle isolation exists on main, but its ownership rule and gate left the reported
  exact-path leak possible.
- Pre-existing `deno.lock` modification is excluded.
- Foreign AppHosts and containers were inspection-only and were not mutated.

## Definition of Done

- [x] One-shot DB commands tear down the exact operation AppHost on success, failure, and signals.
- [x] Cleanup verifies operation path/PID absence rather than trusting `aspire stop` exit status.
- [x] Resident AppHost identity remains visible and stable after a read-only DB command.
- [x] Operation AppHost project and request file are absent after return.
- [ ] Composed evaluation, acceptance mirror, review-thread, and hosted checks pass.
