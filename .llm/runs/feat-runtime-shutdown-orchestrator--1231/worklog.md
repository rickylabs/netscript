# Worklog — feat-runtime-shutdown-orchestrator--1231

## Design

### Public surface

- `createRuntimeHost(options): RuntimeHost`
- `RuntimeHost`, `RuntimeHostOptions`, `RuntimeHostDrain`, phase/state/outcome/report contracts
- `RUNTIME_HOST_SHUTDOWN_PHASES` as the finite ordering vocabulary

### Domain vocabulary and lifecycle

- Lifecycle: `running → shutting-down → stopped`.
- Phases: `service → workers → queue → database`.
- Drain outcome: `stopped | failed | timed-out | skipped`.
- Identity: caller-supplied unique drain id.
- Failure: normalize rejection, continue; timeout active drain, skip remainder.

### Ports and effects

- Internal budget-timer port is injected into the runtime for deterministic tests.
- System timer implementation lives in an adapter; drain callbacks are caller-owned ports over
  existing resource handles.

### Constants

- `RUNTIME_HOST_SHUTDOWN_PHASES` derives `RuntimeHostShutdownPhase`.
- Default budget is a named internal constant.

### Commit slices

- S0 research/design/PR bootstrap.
- S1 contract, runtime, timer adapter, tests, README.
- S2 docs caveat/debt closure and final evidence.

### Contributor path

Add a resource by wrapping its existing stop method in one `RuntimeHostDrain`, assigning one of the
four named phases. New phases require changing the single phase tuple plus contract/tests/docs.

### Deferred scope

Signal listener abstraction, forced drain cancellation, new drain implementations, and Aspire
process control are intentionally absent.

## 2026-08-04 — S1 host contract and behavior

- Added `createRuntimeHost()` to the `@netscript/service` root surface.
- The host accepts structural callbacks over existing drain handles and owns only phase ordering,
  one shared timer, idempotency, and aggregate reporting.
- Fixed order is service → workers → queue → database, stable within each phase.
- A timed-out active drain cannot hold the returned promise beyond the controlled budget; remaining
  resources are reported as skipped. Rejections are normalized and later drains continue.
- Real timer effects live in an adapter; tests inject a controlled timer and contain no sleeps.
- Updated the package README with the primary composition example and exact timeout semantics.

### S1 gate evidence

- Focused tests: 3 passed, 0 failed.
- Scoped check: 45 files, 0 occurrences.
- Scoped lint: 45 files, 0 occurrences.
- Scoped fmt: 45 files, 0 findings.
- Full-export doc lint: 3 entrypoints, 0 diagnostics.
- `quality:gate`: exit 0; quality scan clean with seven unrelated existing allowances; root
  doctrine sweep completed with repository-baseline warnings.
- Focused service doctrine: `FAIL=0 WARN=3 INFO=1`, all pre-existing (two generated Scalar
  inheritance warnings, one 531-line builder warning, existing architecture-doc info).

### S1 supervisor review

- Contract contains no service/worker/queue/database teardown implementation; every resource owns
  its existing callback.
- Timer side effects stay in `src/adapters`; runtime logic has no direct clock/process/global access.
- Controlled-timer budget test proves return without resolving the slow drain.
- No dependency or lockfile change belongs to this slice.

### S1 reconcile

PR #1285 remains draft with `Closes #1231`; issue acceptance stays open until S2 closes the caveat,
debt, and final gates. No new comments changed scope.

## 2026-08-04 — S2 caveat and debt burn-down

- Replaced the planned “No single app-wide shutdown orchestrator yet” call-out with the primary
  `createRuntimeHost()` workflow and contract table.
- Removed the sole caveat marker and deleted the matching debt entry because its close gate is now
  met.
- Retained and clarified still-true warnings: service signal automation, standalone worker signal
  ownership, Windows `SIGBREAK`, per-hook failures, platform kill grace, and database teardown only
  after ingress drains.
- Added the pre-existing missing `@module` header on the `./rpc-path` entrypoint after the JSR audit
  exposed it as the only failing package gate.

### Final gate evidence

- Full service suite: 90 passed, 0 failed.
- Focused host tests after root-import consumer wiring: 3 passed, 0 failed.
- Scoped check/lint/fmt: 45 files, zero findings.
- Full-export doc lint: 3 entrypoints, zero diagnostics.
- JSR package audit: exit 0; only sanctioned informational oRPC slow-type notice.
- Package publish dry-run: success; new runtime and adapter files included.
- `quality:gate`: exit 0; no new findings.
- Focused service doctrine: zero failures; three existing warnings only.
- Docs links: 102 docs, zero broken links/anchors.
- Docs accuracy: PASS.
- Retired caveat marker/title/debt id search: zero matches.

### S2 supervisor review

- Guide code calls only the already-public `stop()`/`disconnect()` methods.
- Fixed phase order matches ingress-first, storage-last shutdown semantics.
- The removed call-out and debt row are fully invalidated; no remaining warning claims the host is
  absent.
- `deno.lock` remains the unrelated carried modification and is excluded.

### S2 reconcile

All issue acceptance claims now have local evidence. PR #1285 can move from draft implementation to
formal IMPL-EVAL; no reviewer comment changed scope.
