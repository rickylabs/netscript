# #1764 Flow-B — targeted validator plan (prepared, NOT executed; lease returned to Aspire)

## Root cause chain, in order of discovery

1. **First attempt** (`--isolated --non-interactive`) rejected by the CLI's own arg parser — those
   flags don't exist on `packages/cli/e2e/cli.ts`. Nothing started; zero containers before/after.
2. **Second attempt**, correct flags, no relay: hung at `database.init`. `runtime.aspire-start` had
   already published postgres/garnet/redis on `127.0.0.1:<port>` (DCP's contract on the dind host),
   but nothing on `ai-agents` listens on those loopback addresses — the exact D-43 failure mode.
   Diagnosed, evidence preserved, torn down to exact zero (owned containers by exact ID + label
   cross-check via `agentic:leak-check`, volume, AppHost stop).
3. **Third attempt**, with the owner-scoped two-hop relay (`loopback-relay.ts`) armed before launch:
   relay attached correctly (5 ports, hop-A + hop-B proven), run reached **79 passed / 1 failed**.
   Sole failure: `behavior.app-reference` — `No supported headless Chrome/Chromium executable found`.
   This is a **known, pre-existing NAS limitation** (recorded in memory before this session:
   `nas-aspire-runtime-prereqs-missing.md` — "Chromium absence... no environment update so far
   clears it"), unrelated to sagas/#1764.
4. **Structural finding, independently verified against the source, not inferred:**
   `suite-runner.ts:98` — `if (step.critical && step.verdict === 'failed') break;`. In
   `capability-suites.ts`'s `RUNTIME_GATES` array, `GATE.BEHAVIOR_APP_REFERENCE` (line 130) sits
   **before** the otel/Flow-B gates (lines 135-139). So the critical browser failure aborted the
   main-gate loop before `behavior.otel.webhook`, `behavior.otel.stream-consumer`,
   **`behavior.otel.traces`** (the gate that runs `validate-flow-b-traces.ts` — TC-6/TC-7/TC-9),
   `behavior.streams-producer-reconnect`, and `behavior.otel.task-traces` ever ran. Only
   `cleanup.aspire-stop` ran afterward, via the separate always-run cleanup-gate path.
   **Conclusion: 79/1 is topology proof (relay works, AppHost boots, DB/resources come up,
   `runtime.flow-b-fixture` wired the callback), not TC-6/7/9 acceptance.** Confirmed via the run's
   own structured JSON report (`flow-b-scaffold-runtime-5b526e4bc-attempt2.json`): zero `otel`-prefixed
   step ids among the 80 that executed.
5. **First remediation attempt (mine) was a scope breach, corrected before any runtime started.**
   I wrote a script that reconstructed nearly the entire `RUNTIME_GATES` prefix (97 gates) AND forced
   a fresh `createScaffoldCapabilitySuite` scaffold (new project, new plugin installs, new codegen)
   instead of reusing the already-proven scratch. Caught before AppHost boot: process (PID `3746647`)
   and its orphaned child (PID `3751092`, scaffolding a fourth project `…-221514`) stopped by exact
   PID, relay cleaned by exact owner (`fix1764-flowb-targeted`, 0 relays ever created), verified
   exact zero. No tracked or user work touched or deleted.

## The bounded plan (written, not run — this IS the deliverable for this turn)

File: `/home/agent/projects/netscript/worktrees/007-leaf-1368/.llm/tmp/targeted-flow-b-run.ts`
(scratch, uncommitted, 61 lines).

Reuses the **already-scaffolded project from the successful 79/1 run**,
`.llm/tmp/cli-e2e/plugin-smoke-20260830-220506` (confirmed present on disk, `aspire/apphost.mts`
exists), via `createSmokeProject` — verified to be a pure path resolver with no filesystem side
effects, so pointing `projectName` at it is safe. **No new project, no scaffold/plugin/codegen gates.**

Gate list (23 entries, in the exact relative order they hold in the real `RUNTIME_GATES` array —
verified via source, not reconstructed from memory):

```
PREFLIGHT_DENO, PREFLIGHT_ASPIRE,
RUNTIME_ASPIRE_START,
DATABASE_INIT, DATABASE_MIGRATION_ARTIFACTS, DATABASE_GENERATE, DATABASE_SEED,
RUNTIME_CAPTURE_DB_ALLOCATION_FIRST, RUNTIME_ASPIRE_RESTART_AFTER_DB, RUNTIME_CAPTURE_DB_ALLOCATION_SECOND,
RUNTIME_WAIT_POSTGRES, RUNTIME_WAIT_GARNET, ...KV_BACKGROUND_RUNTIME_WAIT_RESOURCES, RUNTIME_WAIT_AUTH, RUNTIME_WAIT_STREAMS, RUNTIME_WAIT_APP,
RUNTIME_ASPIRE_DESCRIBE,
BEHAVIOR_OTEL_WEBHOOK, BEHAVIOR_OTEL_STREAM_CONSUMER, BEHAVIOR_OTEL_TRACES, BEHAVIOR_STREAMS_PRODUCER_RECONNECT, BEHAVIOR_OTEL_TASK_TRACES,
CLEANUP_ASPIRE_STOP
```

Deliberately **excluded**: every scaffold/plugin/codegen/quality-check gate (already proven, on disk,
unchanged), `behavior.app-reference` and everything after it structurally in the array, and every
`behavior.workers-*`/`sagas-*`/`triggers-*`/`auth-*` gate — **verified unnecessary** by reading
`otel-gates.ts`: `BEHAVIOR_OTEL_STREAM_CONSUMER` runs `consume-flow-b-stream.ts`, which is what
*produces* the trace chain `BEHAVIOR_OTEL_TRACES`'s `validate-flow-b-traces.ts` then reads via the
OTel dashboard API; `BEHAVIOR_OTEL_WEBHOOK` and `BEHAVIOR_STREAMS_PRODUCER_RECONNECT` fire their own
traffic; `BEHAVIOR_OTEL_TASK_TRACES` validates its own detached task. None depend on the
workers/sagas/triggers/auth behavior gates having run first. Also excluded: the pre-AppHost fixture
gates (`RUNTIME_FLOW_B_FIXTURE`/`RUNTIME_READINESS_FIXTURE`/`RUNTIME_AUTH_SMOKE_ENV`/
`RUNTIME_SERVICE_ENV_FIXTURE`) — they patch generated source, and the reused project already has
those patches applied from its original successful run.

Command, when the lease returns:

```bash
export DOCKER_HOST=tcp://netscript-dind:2375
# fresh owner-scoped relay first, new --since timestamp, e.g. owner=fix1764-flowb-bounded
deno run -A .../loopback-relay.ts watch --owner fix1764-flowb-bounded --registry <path>/relay.json --since <iso> --interval 1500 &
cd /home/agent/projects/netscript/worktrees/007-leaf-1368
deno run --allow-all .llm/tmp/targeted-flow-b-run.ts \
  .llm/runs/fix-saga-span-emission-and-correlation--0.0.7/receipts/flow-b-bounded-otel-<head>.json
# on exit: relay cleanup --owner fix1764-flowb-bounded --registry <path>/relay.json; verify exact zero
```

## Tooling gap worth recording

No CLI-level "run one gate against an existing project" command exists. The runner supports it
internally (`RunRequest.gateId`, `execution-plan-builder.ts`'s `buildExecutionPlan`), but no
presentation-layer flag exposes it (`run-command.ts` only accepts a suite id; `gates-command.ts` only
lists). Reaching it currently requires a scratch script calling the runner's public functions
directly, which is what I built after the first, overscoped attempt. If targeted runtime-gate proof
becomes routine for this kind of leaf, a `--gate <id>` flag on `run` (with a documented "requires an
existing scaffolded project" contract) would remove the need for a supervisor-authored script each
time. Not proposing to build it now — flagging it as a real gap, not silently working around it forever.

## Disposition

`behavior.app-reference` (browser gate): **classified N/A, verified.** `probe-app-reference.ts` at
this leaf's head is byte-identical to main `9710a2898`'s copy (`diff` clean), #1764 never touched the
file, and Chromium/Chrome are absent at all four checked paths on this host — a host fact independent
of branch. Same failure would occur on a clean checkout of main. Not a leaf regression.

TC-6/TC-7/TC-9 (saga span correlation, the actual #1764-owned acceptance target): **not yet proven**.
The bounded plan above is ready to execute the instant the lease returns.
