# Plan — db ephemeral AppHost lifecycle (#1196)

Status: **LOCKED** on 2026-08-05.

## Profile and doctrine

- Archetype 6 (CLI / Tooling): the product is the `netscript db` command flow.
- Current doctrine verdict: `@netscript/cli` is **Restructure**; this focused adapter/vertical-feature
  change may not deepen existing structural debt.
- Axioms: A7 platform/upstream composition, A13 explicit crash boundaries, A14 runtime proof.
- Anti-pattern risks: AP-11/AP-25 hidden/effectful lifecycle, AP-18 false snapshot proof.
- No public export or new architecture debt is planned.

## Locked decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | The lifecycle lock grants exclusive ownership of the exact `db-operation` AppHost path. Stop and verify any stale/pre-existing instance before starting a new one. | The resource is framework-created and contractually ephemeral; preserving it is the defect. |
| D2 | Cleanup is artifact-based: the exact path must disappear from `aspire ps`, its owned PID must be absent, and the request/project paths must be absent. | `aspire stop` exits before teardown; PID-only proof also misses stale Aspire registry entries. |
| D3 | One-shot commands materialize the operation project immediately before execution and remove it in `finally`; `db studio` stays resident/interactive and never materializes it. | Satisfies repeatability and the no-workspace-noise acceptance without a persistent hidden template. |
| D4 | SIGINT/SIGTERM abort the active Aspire command/poll path, which then runs the same awaited cleanup as success/failure. | One cleanup state machine is less error-prone than a parallel signal-only teardown path. |
| D5 | Extend the existing resident-preservation runtime gate to assert no exact operation AppHost and no operation artifacts after a read-only command. | Closes #1011's false-green gap with the consumer-visible artifact. |

## Open-decision sweep

| Decision | Status | Reason |
| --- | --- | --- |
| Poll interval/retry count for AppHost disappearance | safe to defer | Internal constant; test uses injected clock. |
| Signal exit-code presentation | safe to defer | This slice guarantees teardown; existing CLI error boundary owns final presentation. |
| Persistent `db studio` operation host | resolved | Not applicable: studio uses the resident interactive AppHost and is reported normally. |

## Risks

| Risk | Mitigation |
| --- | --- |
| Cleanup stops a resident/sibling host | Exact canonical `db-operation/apphost.mts` path only; never `--all`; lifecycle lock serializes NetScript commands. |
| Signal handler hangs or races normal cleanup | Idempotent single cleanup promise, unregister listeners in `finally`, pass one abort signal throughout. |
| Multi-database command removes project too early | Materialize/cleanup around the whole runner invocation, not each database target. |
| Stop reports success while process/path survives | Re-probe `aspire ps` and `/proc`/PID; escalate only the positively owned PID. |
| Full runtime gate collides with foreign resources | Run leak-check first; never mutate foreign AppHosts; use suite-owned cleanup. |

## Commit slices

1. **S0 — lock research/design and open draft PR.** Proof: composed Plan-Gate checklist. Files: run artifacts.
2. **S1 — RED and lifecycle ownership.** Proof: focused test fails on current preserve/leak behavior, then passes for success/failure/signal and artifact absence. Files: DB runner/executor/command/tests and run artifacts.
3. **S2 — consumer regression gate.** Proof: read-only live gate retains resident identity while exact operation path/artifacts are absent. Files: CLI E2E gate/tests and run artifacts.
4. **S3 — merge readiness.** Proof: scoped wrappers, CLI tests, quality/architecture, doc-lint/publish dry-run, smallest live runtime proof, composed evaluation. Files: evidence artifacts only unless a gate finds a defect.

## Selected gates

- Focused RED→GREEN lifecycle tests with sanitizers where practical.
- Scoped CLI check/lint/fmt wrappers; no new ignores or casts.
- CLI focused/package tests and `quality:gate`.
- CLI doc-lint, JSR audit, publish dry-run (no public surface change expected).
- Resource leak-check before runtime work.
- Smallest live consumer proof that starts a resident AppHost, runs read-only DB status, then checks
  resident identity plus operation AppHost/process/directory/request absence; full
  `scaffold.runtime` only if the focused route cannot establish the artifact.
- Acceptance mirror dry-run with box-index entries; review-thread gate; explicit-refspec pushes.

## Deferred scope

- Upstream Aspire registry/cache behavior.
- Host-wide cleanup or mutation of foreign AppHosts.
- General Archetype-6 restructuring and unrelated DB generation debt.
