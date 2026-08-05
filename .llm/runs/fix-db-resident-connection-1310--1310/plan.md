# LOCKED Plan — #1310

Status: **LOCKED** — D6 composed evaluation; implement in this run.

## Decisions

| ID | Locked decision | Rationale |
| --- | --- | --- |
| D1 | Generate one explicit-start DB-operation executable per configured database in the resident AppHost. | The executable receives `DATABASE_URL`/engine URI through the resident database resource reference, so it connects to the already-running instance. |
| D2 | `netscript db` discovers the exact resident `aspire/apphost.mts`, writes a bounded request, and invokes `aspire resource <name> start`; it never starts `db-operation/apphost.mts`. | Removes the graph reconstruction that caused #1011, #1196, and #1310. |
| D3 | Stateful operations fail fast when the resident AppHost is absent. No standalone AppHost fallback ships. | A disposable second database would make successful migrations misleading; no fallback means no resident `DataPath` can be mounted twice. |
| D4 | The operation resource runs a generated request dispatcher and remains explicit-start, so normal AppHost startup never runs DB mutations. | Separates graph ownership from command invocation and preserves arbitrary migration names. |
| D5 | Retire the generated `db-operation` AppHost/project and update docs to state the resident-first contract. | The obsolete escape path must not remain callable or documented. |
| D6 | Strengthen `quickstart.walk` step 5 to snapshot the resident Postgres container/bind source, run init→generate→seed, prove it is still the only postmaster using that DataPath, then verify PGDATA after teardown. | Exit 0 is not corruption evidence; the gate must fail on the old two-postmaster mechanism. |

## Slices

1. RED: runner regression requires resident `aspire resource` invocation and forbids operation
   AppHost start; quickstart guard fails without exclusivity/PGDATA verification.
2. Contract/generator: explicit-start request dispatcher resource wired to resident DB; remove
   operation-AppHost generation.
3. Runner: resident discovery, request lifecycle, resource start/poll/logs, success/failure/signals.
4. Consumer gate/docs: quickstart exclusivity + teardown integrity; update second-terminal contract.
5. Gates: focused tests, generated assets, scoped check/lint/fmt, `quality:gate`, CLI tests,
   doc-lint/publish dry-run, full relevant E2E, review threads, acceptance mirror, lock hygiene.

## Plan-Gate

| Row | Result | Evidence |
| --- | --- | --- |
| Research current | PASS | live #1310, main source, Aspire 13.4 CLI/API |
| Contract first | PASS | D1–D4 define resource/request/discovery contract before implementation |
| Cause removed | PASS | D2/D5 prohibit second AppHost construction |
| Regression proves corruption mechanism | PASS | D6 asserts unique postmaster/bind and post-teardown PGDATA |
| Risks/deferrals | PASS | no standalone stateful fallback; no dependency or public export change |
| Evaluator protocol | composed per milestone-run.md (orchestrator waiver) | owner directive; ruling D6 |
