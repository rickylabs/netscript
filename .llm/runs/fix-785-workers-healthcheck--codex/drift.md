# Drift Log: issue #785 workers health-check execution

## 2026-07-16 — Parent harness identity unavailable in implementation checkout

- **What:** The owner assigned this as a Tier-D implementation slice, but the referenced parent orchestrator run and PLAN-EVAL artifact are not present on this branch, and the current session does not expose a concrete daemon thread id/steering command.
- **Source:** Direct owner brief; `.llm/runs` filesystem inspection; session environment inspection.
- **Expected:** Parent run artifacts plus daemon-managed Tier-D identity and PLAN-EVAL evidence are locally readable.
- **Actual:** Only the owner implementation brief is available as authorization. This lane can keep its own worklog but cannot substantiate parent evaluator/session metadata.
- **Severity:** significant
- **Action:** accept for this owner-authorized implementation lane; do not claim PLAN-EVAL or mobile attachment; require separate IMPL-EVAL before merge.
- **Evidence:** `supervisor.md`; initial repository/session inspection.

## 2026-07-16 — Canonical E2E port is owned outside WSL

- **What:** The full cleanup acceptance run now loads the corrected health-check module, but its users callback resolves to the fixture-fixed `http://localhost:3001`, which is owned by a Windows-side `sco-web` process and returns 404.
- **Source:** Canonical E2E run, `aspire describe`, direct RPC probes, and read-only Windows TCP/process inspection.
- **Expected:** Aspire's users proxy owns port 3001 and serves `/api/rpc/v1/users/health/check`.
- **Actual:** `sco-web` owns `0.0.0.0:3001`; the unrelated endpoint returns 404. The generated users process is healthy on Aspire's assigned target port and returns 200 for the identical RPC request.
- **Severity:** significant
- **Action:** do not stop the unrelated process without owner authority and do not weaken the behavior assertion. The owner clarification removed the false dependency: ordinary health-check no longer calls users, while the separate Flow-B callback uses Aspire service discovery. This drift is no longer an acceptance blocker.
- **Evidence:** `services__users__http__0=http://localhost:3001`; Windows PID 9188 (`sco-web`); users target response 200 versus discovery URL 404.

## 2026-07-16 — Concurrent edits overlapped acceptance diagnostics

- **What:** During a temporary port-isolated diagnostic run, another workspace actor edited three Flow-B E2E source files and extended `job-execution_test.ts`.
- **Source:** Git diff observed while the E2E command was running.
- **Expected:** Acceptance runs against a stable committed source tree.
- **Actual:** The generated workspace was assembled while its source fixture changed and failed `generated.deno-check`; the edits remain uncommitted and are not owned by this lane.
- **Severity:** significant
- **Action:** preserve the edits, do not commit or revert them, and invalidate that diagnostic run as gate evidence. Re-run after their owner settles the changes.
- **Evidence:** dirty paths listed in the worklog; diagnostic summary 20 passed / 1 failed at generated type-check.
- **Resolution:** Supervisor clarified that these were this lane's own diagnostic edits. They were completed, validated, and committed as the Flow-B separation slice; no external work was absorbed.

## 2026-07-16 — Health-check special case replaced by generic CLI job

- **What:** Runtime evidence showed that the E2E fixture rewrote the default `health-check` job and manually replaced its registry, while the owner clarified that health-check must remain an ordinary generated job.
- **Source:** Owner clarification; `prepare-flow-b-fixture.ts`; generated-project inspection after the corrected resolver loaded the handler.
- **Expected:** The plugin install emits the default health job, and additional consumers/plugins use the workers CLI to add jobs under the configured jobs directory.
- **Actual:** Flow-B had commandeered health-check for an unrelated users-service callback and emitted a one-job special registry.
- **Severity:** significant
- **Action:** scaffold `flow-b-callback` through the generic workers CLI, regenerate the standard rich runtime registry, and customize only the Flow-B definition. Preserve health-check source and normal definition unchanged.
- **Evidence:** generated registry contains standard `health-check` plus Flow-B-only `flow-b-callback`; focused fixture run passed.

## 2026-07-16 — Acceptance retries exposed fixture integration details

- **What:** The first revised fixture used an absolute Deno executable outside its allow-run grant; the next full run passed the workers target but exported the callback span without the outcome set inside its async body.
- **Source:** `.llm/tmp/785-final-report.json`; `.llm/tmp/785-final2.ndjson`.
- **Expected:** Fixture setup runs within its declared permissions and Flow-B span creation carries all assertion-critical attributes.
- **Actual:** Setup initially failed before runtime, then final telemetry alone failed after every product gate and target workers execution passed.
- **Severity:** minor
- **Action:** invoke the granted `deno` command name and place the Flow-B outcome in span creation attributes; require one clean full rerun.
- **Evidence:** focused fixture pass; `behavior.workers-executions` first-poll pass; telemetry failure attribution.
- **Resolution:** The final canonical one-pass suite passed 60 / 60 with cleanup; this retry drift is closed.

## 2026-07-16 — Generic workers CLI discarded runtime definitions

- **What:** `workers add job flow-b-callback` created the requested file but its registry compiler emitted only static handlers, overwriting the runtime definition map.
- **Source:** Retained generated registry after the first stable Flow-B fixture attempt.
- **Expected:** Any job scaffolded through the public workers CLI is immediately both importable and registrable by the durable runtime.
- **Actual:** The file existed, but no `jobDefinitions` export remained for runtime registration.
- **Severity:** significant
- **Action:** extend the generic compiler and byte-identity golden test to emit local definitions for all discovered jobs, including nested paths. No health-check branch or follow-up generator is required.
- **Evidence:** direct fixture passed; focused compiler/resolver/gate tests passed; final canonical suite passed 60 / 60.
