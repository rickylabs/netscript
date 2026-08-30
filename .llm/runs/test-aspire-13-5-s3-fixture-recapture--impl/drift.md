# Drift Log: Aspire 13.5 S3 fixture re-capture

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-30 — Dashboard telemetry requires phase B

- **What:** S2 receipts contain `aspire ps`, `aspire describe`, doctor, and runtime/MCP projections,
  but no dashboard `/api/telemetry/resources` or `/api/telemetry/spans` envelopes.
- **Source:** S2 receipt inventory and issue #1715 dispatch correction.
- **Expected:** Original issue text implied S2 V5 contained dashboard envelopes.
- **Actual:** Capturing them requires a running 13.5.3 AppHost and runtime lease.
- **Severity:** minor
- **Action:** defer to phase B in the same draft PR; keep telemetry parity `pending-lease` in phase
  A.
- **Evidence:** `origin/test/aspire-13-5-s2-runtime-verification` receipt inventory and
  `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-fixture.ts` capture header.

## 2026-08-30 — Phase-B host Docker client differs from the lease briefing

- **What:** The lease briefing warned that Docker client 27.5.1 was below Aspire's 28.0 minimum.
- **Expected:** The first `aspire start` might fail on the client-version floor.
- **Actual:** The verbatim preflight `aspire doctor` auto-detected Docker 28.5.2 and reported the
  container runtime healthy; `docker ps -a` was empty.
- **Severity:** minor (environment evidence)
- **Action:** Continue with the single authorized start; retain the start output as the remote-dind
  path probe and obey the original stop condition if endpoint proxying fails.
- **Evidence:** `worklog.md` § "Phase B Lease Preflight — verbatim".

## 2026-08-30 — D-39 supersedes stale NAS environment assumptions

- **What:** Supervisor steering re-proved the host after this thread's preflight and corrected the
  remote dind address, inotify capacity, and process-reaping state.
- **Actual:** `netscript-dind` is `10.4.12.19`; Docker client/server are 28.5.2;
  `fs.inotify.max_user_instances=1024`; PID 1 is `tini`; zombie count is zero.
- **Severity:** minor (environment correction)
- **Action:** Treat D-37's below-28 Docker condition as resolved. Preserve only the remote-dind
  endpoint/proxy probe and exit-134/inotify report-and-stop condition, with no workaround or retry.
- **Evidence:** supervisor steering dated 2026-08-30T09:27Z; acknowledged in `worklog.md` before
  AppHost start.

## 2026-08-30 — Phase-B remote-dind bind sources are not visible

- **What:** The exact 13.5.3 AppHost started successfully, but the remote Docker daemon rejected
  PostgreSQL and Redis container creation because their bind source paths exist only in this
  worktree/container filesystem.
- **Expected:** Container-backed resources become healthy, worker resources start, and the
  `health-check` job produces a dashboard telemetry capture.
- **Actual:** PostgreSQL/Redis were `FailedToStart`; users/workers/workers-api stayed `Waiting`. No
  capture was possible.
- **Severity:** significant (environment blocker, not a product or fixture defect)
- **Action:** Obeyed the explicit stop condition: no workaround and no retry; stopped the exact
  AppHost, verified leak-check survivors `[]`, previewed an empty teardown, and proved final Aspire
  and Docker inventories empty. A future capture needs a newly authorized lease on a host whose
  Docker daemon can see the AppHost bind sources.
- **Evidence:** `receipts/07-phase-b-runtime-probe.md`.

## 2026-08-30 — Attempt 2 removed bind mounts but exposed the remote-loopback gap (D-43)

- **What:** The attempt-2 scratch omitted database/cache `DataPath` values, allowing the containers
  to start without worktree bind mounts.
- **Expected:** Healthy containers would unblock the workers resources and dashboard capture.
- **Actual:** DCP published PostgreSQL on the remote dind's `127.0.0.1`; the AppHost host could not
  reach that loopback endpoint. PostgreSQL health checks failed with connection refused and no
  envelope was captured.
- **Severity:** significant (environment blocker, not product behavior)
- **Action:** Obeyed the no-retry rule, preserved D-43 evidence, and tore down to zero. A later
  attempt required an owner-scoped relay rather than a product workaround.
- **Evidence:** `receipts/08-phase-b-attempt-2-capture.md`.

## 2026-08-30 — Attempt 3 used relay D-74 but the brief-scoped capture lacked consumer-run inputs

- **What:** The supervisor-owned D-74 loopback relay closed the remote-DinD endpoint gap, allowing
  the exact 13.5.3 AppHost to reach healthy PostgreSQL and capture real dashboard envelopes.
- **Expected:** The triggered `health-check` job would also produce a worker consumer/`job.execute`
  span and a listed completed run.
- **Actual:** The brief-scoped scratch omitted `database.codegen` and the `streams` plugin. Its web
  resource produced 12 `/health` 500 responses, and the workers runtime could not consume the
  accepted trigger. The envelope has a producer trace but no consumer/`job.execute` span, listed
  run, or found last-job result.
- **Severity:** minor (fixture provenance/coverage routing; environment/scope condition, not Aspire
  13.5.3 behavior)
- **Action:** Keep the raw capture unchanged and state its semantics in the README, fixture header,
  and test. Completed consumer-span coverage remains in the retained 13.4.6 case and hosted
  `scaffold.runtime` suite.
- **Evidence:** D-74 supervisor relay receipt, `receipts/09-phase-b-attempt-3-capture.md`, and
  IMPL-EVAL cycle 3 F-1/F-2.
