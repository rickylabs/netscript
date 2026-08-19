# Drift Log: scriptc task-runtime benchmark + RFC

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-19 — D-1: Lane overrides for cloud-container run

- **What:** Orchestrator runs as Claude Fable 5 (cloud session) instead of the canonical Opus 5 ·
  high local orchestrator; Tier-D WSL Codex implementation lane and native opposite-family local
  evaluator sessions are unreachable from this container.
- **Source:** Session environment (Claude Code Remote managed container); `supervisor.md` § Recorded
  lane/eval overrides.
- **Expected:** `lane-policy.md` canonical routes (local Opus orchestrator, WSL Codex Tier-D
  implementation, native Codex Sol evaluator sessions).
- **Actual:** Cloud-driven run launched by the owner on this surface. Benchmark scaffolding is
  run-dir throwaway code and the deliverable is an RFC (SCOPE-docs); no `packages/`/`plugins/`
  source changes. Evaluator phases use the cloud PR automation route (`openhands` +
  `status:plan-eval`; draft→ready for IMPL-EVAL) per lane-policy's cloud-PR provision.
- **Severity:** significant
- **Action:** accept (recorded; owner-launched surface is the directive)
- **Evidence:** `supervisor.md`; lane-policy § "Native-first formal evaluation" cloud-PR paragraph.

## 2026-08-19 — D-2: Handover Phase 1 (scaffold + Aspire + Docker) not executable in container

- **What:** The handover's Phase 1 requires Aspire CLI, .NET, and a running Docker daemon to
  scaffold `bench-app` and start the AppHost graph. This container has none of them
  (no `dotnet`, no `aspire`, no Docker socket), and installing them cannot conjure a container
  runtime (no docker daemon available to start).
- **Source:** `docker info` → cannot connect `/var/run/docker.sock`; `which aspire dotnet` → empty.
- **Expected:** `netscript init bench-app` + `netscript plugin install worker` + Aspire graph, then
  benchmark through the hosted worker service.
- **Actual:** The dispatch machinery the benchmark must measure (queue → `MultiRuntimeTaskExecutor`
  → adapter → subprocess → TaskResult) lives in `@netscript/plugin-workers-core` and is exercised
  in-process from the repo workspace with the repo's own queue provider (see research.md
  § Feasibility for the provider chosen and why). The Aspire-hosted environment differs only in
  process hosting/wiring, not in the executor/adapter code path. This substitution is stated
  plainly in the RFC methodology + limits; end-to-end numbers are labeled "in-process worker
  runtime, not Aspire-hosted".
- **Severity:** significant
- **Action:** accept + propose-update (handover's own stop-rule consulted; the real dispatch-path
  requirement is satisfied at the executor/queue layer, which is what the RFC's claims depend on)
- **Evidence:** `supervisor.md` § Environment constraints; toolchain probe output in worklog.

## 2026-08-19 — D-3: DB-less init flag unrecorded (Phase 1 step 3 not reachable)

- **What:** The handover asks to record the real DB-less `netscript init` flag from
  `netscript init --help`. Because the scaffold path is not executable here (D-2), the flag is
  determined from CLI source instead of a live `--help` run, and recorded in research.md.
- **Source:** `packages/cli` init command source (see research.md finding).
- **Severity:** minor
- **Action:** accept
- **Evidence:** research.md § Findings.

## 2026-08-19 — D-4: Worker dispatch does not forward correlation/trace context to task subprocesses

- **What:** `processWorkerTask` calls `taskExecutor.execute(taskDef, { env: { TASK_ID, TASK_PAYLOAD }, timeout })` without `correlationId`/`traceparent`/`tracestate` options, so `runProcess` never injects `CORRELATION_ID`/`TRACEPARENT` env into queue-triggered task subprocesses.
- **Source:** `plugins/workers/worker/job-dispatcher.ts:234-240`; `packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:89-98`; confirmed empirically (task output `correlationId: null` in smoke runs).
- **Expected:** `docs/site/background-processing/polyglot-tasks.md` documents `CORRELATION_ID`/`TRACEPARENT` as injected by the runtime.
- **Actual:** Injection happens only when the caller passes those options (e.g. direct executor use); the queue path drops them even though `TaskMessage.correlationId` is present.
- **Severity:** significant (doc/behavior mismatch + likely upstream bug)
- **Action:** propose-update — surfaced in PR; candidate follow-up issue after evaluator review.
- **Evidence:** file:line above; smoke JSONL in run dir.

## 2026-08-19 — D-5: Named queues collide on a shared local Deno KV database

- **What:** With the default local Deno KV provider, `createQueue('jobs')` and `createQueue('tasks')` on the same KV database each register `kv.listenQueue` on their own connection; Deno KV has ONE queue per database and the adapter envelope (`packages/queue/adapters/_envelope.ts`) carries no queue name, so messages are delivered to whichever listener wins — the Worker's jobs listener consumed 'tasks' messages ("Processing job 'undefined' … Workers KV key contains unsupported part: undefined") and the message was lost to the task listener.
- **Source:** Observed in S5 smoke (worker-based boot); `packages/queue/adapters/deno-kv.adapter.ts` (no name filtering), `_envelope.ts` (no queueName field).
- **Expected:** Named queues are isolated per name on every provider.
- **Actual:** Isolation holds on Redis/RabbitMQ (real named queues) but not on a shared local Deno KV database — affects DB-less local dev running worker + task listeners in one process.
- **Severity:** significant (upstream bug candidate in @netscript/queue local-KV provider)
- **Action:** propose-update — benchmark harness boots the task listener only (contexts mirrored verbatim from `worker.ts:315-349`); candidate follow-up issue.
- **Evidence:** smoke log excerpt in worklog S5; harness comment in `bench/harness/run-series.ts`.

## 2026-08-19 — D-6: Sandboxed deno tasks cannot self-report RSS (/proc gated behind --allow-all)

- **What:** `Deno.readTextFileSync('/proc/self/status')` fails with `NotCapable: Requires all access to "/proc/self/status", run again with the --allow-all flag` even under `--allow-read=/proc`.
- **Source:** Empirical (deno 2.9.5); reproduced standalone.
- **Expected:** Benchmark plan had every subject self-report VmHWM.
- **Actual:** Subject A (sandboxed) reports `vmHwmKb: null`; per-subject cold-spawn peak RSS measured externally via `/usr/bin/time -v` (`bench/harness/rss-probe.ts`), including an `A-deno-allow-all` variant matching the production no-permissions default.
- **Severity:** minor (methodology adjustment; also an RFC-relevant sandbox datum)
- **Action:** accept
- **Evidence:** error string above; rss-probe.ts.
