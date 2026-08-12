# W2-H implementation evidence — package-backed plugin doctor truth (#1454)

**Branch:** `fix/1454-plugin-doctor-package-backed`  
**Draft PR:** [#1574](https://github.com/rickylabs/netscript/pull/1574)  
**PLAN-EVAL:** PASS at immutable head `ad7574bb7`; Claude Opus 5 medium, opposite-family,
verdict in `verdict-plan-fallback.md`.

## Implemented result

The CLI now records a configured plugin's installation contract as either `local-workdir` or
`package`. Relative, absolute, and `file:` specifiers are local; package/import-map specifiers are
package-backed regardless of whether an incidental conventional directory exists. Only the local
variant carries `workdir` and `rootDir`.

Package manifests are imported in the existing bounded child process and returned through a
versioned, validated, JSON-safe envelope. Doctor and generated Aspire runtime configuration now
consume the manifest's existing permissions and workers doctor contribution. No plugin manifest
field, package export, or plugin public file changed.

The one permission chain used by doctor and generated runtime resolution is:

```text
explicit appsettings/service cfg.Permissions
  > pluginService.permissions
    > plugin.permissions
      > global defaults
```

`plugin list` renders a package install as `package:<configured-specifier>`. Doctor emits an
explicit healthy package-backed source check and does not invent a workspace-directory check.

## Slice-to-file and gate map

| Slice | Principal files | Direct proof |
| --- | --- | --- |
| Source contract and caller migration | `resolved-config.ts`, `registered-plugin-source.ts`, guarded deploy/doctor/list callers | source classifier tests; package-with-incidental-directory doctor test; package list rendering test; CLI scoped check |
| Bounded probe contract | `configured-plugin-manifest-summary.ts`, probe parent/child | valid and malformed envelope tests; doctor probe parity tests |
| Package metadata and doctor | `plugin-registry.ts`, `doctor-plugin-use-case.ts` | published workers/streams focused E2E; workers contributed registry checks |
| Runtime permissions | deploy resolvers and `workspace-mutator.ts` | four-slot precedence unit test; generated helper semantic assertions in focused E2E |
| Consumer gate | `package-backed-plugin-doctor-fixture.ts`, scaffold suite registration | baseline red, deliberate seam red, restored green below |

## Slice 1 caller inventory

The type migration enumerated and guarded every production reader found by the plan evaluator:

- `deploy-config-background.ts` reads local workdir only after `source.kind === 'local-workdir'`;
- `deploy-config-resolvers.ts` does the same for plugin services;
- `doctor-plugin-use-case.ts` guards both the workdir reader and the local doctor `rootDir` reader;
- `list-plugins-command.ts` chooses local workdir or the deliberate package rendering;
- `doctor-plugin-command_test.ts`, `doctor-plugin-invariants_test.ts`, and the auth doctor fixture
  construct explicit local source variants; and
- the existing E2E userland fixtures remain explicit local/copy-mode consumers, while the new
  published-package fixture is the package variant.

The Aspire `generate-register-*.ts` `entry.Workdir` reads consume already-resolved deploy config and
are not `RegisteredPluginConfig` callers.

## Negative control 1 — baseline RED before product implementation

The composite gate was committed first at `668b3b3d6`, then executed before any product fix. The
fixture completed registry and Aspire helper generation; it failed specifically because doctor
invented local directories, discarded published permissions, and skipped the workers adapter.

```text
$ deno task e2e:cli gate scaffold.plugins behavior.package-backed-plugin-doctor --cleanup --format pretty
Running scaffold.plugins
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  FAILED 1390ms
    Command exited 1; expected 0.
    PACKAGE_BACKED_PLUGIN_DOCTOR_FAIL
    - doctor did not report published permissions: @netscript/plugin-workers healthy Permission metadata --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run
    - doctor did not report published permissions: @netscript/plugin-streams healthy Permission metadata --allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi
    - doctor did not execute healthy workers check: generated job registry exists
    - doctor did not execute healthy workers check: generated job registry is non-empty
    - doctor did not execute healthy workers check: every declared job is registered
    - doctor emitted forbidden diagnostic: plugins/workers does not exist
    - doctor emitted forbidden diagnostic: plugins/streams does not exist
    - doctor emitted forbidden diagnostic: No plugin permissions declared
    - generated plugin AppHost helper lacks workers manifest permissions
    - generated plugin AppHost helper lacks streams manifest permissions
    - generated background AppHost helper lacks workers manifest permissions
    --- doctor output ---
    Plugin Status Check Message
    apphost warning Aspire AppHost running No AppHost is running for this project. Start it and rerun plugin doctor.
    workers healthy Configured module resolves jsr:@netscript/plugin-workers@0.0.5
    workers healthy Configured module exports manifest jsr:@netscript/plugin-workers@0.0.5
    workers healthy Service entrypoint resolves jsr:@netscript/plugin-workers@0.0.5/services
    workers healthy Manifest resolved Workers
    workers warning Workspace directory plugins/workers does not exist
    workers warning Permission metadata No plugin permissions declared
    streams healthy Configured module resolves jsr:@netscript/plugin-streams@0.0.5
    streams healthy Configured module exports manifest jsr:@netscript/plugin-streams@0.0.5
    streams healthy Service entrypoint resolves jsr:@netscript/plugin-streams@0.0.5/services
    streams healthy Manifest resolved Streams
    streams warning Workspace directory plugins/streams does not exist
    streams warning Permission metadata No plugin permissions declared
Summary: passed=0 failed=1 skipped=0
EXIT_CODE=1
```

No `plugins/workers` or `plugins/streams` directory and no consumer permission duplication was
added to obtain this red.

## Negative control 2 — post-fix narrow-seam RED

After the gate first passed, the single manifest-summary assignment was deliberately changed from
the published permission array to `undefined`. The focused gate failed on both doctor and runtime
truth, demonstrating that it cannot report clean while the transport does nothing:

```text
$ deno task e2e:cli gate scaffold.plugins behavior.package-backed-plugin-doctor --cleanup --format pretty
Running scaffold.plugins
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  FAILED 1884ms
    Command exited 1; expected 0.
    PACKAGE_BACKED_PLUGIN_DOCTOR_FAIL
    - doctor did not report published permissions: @netscript/plugin-workers healthy Permission metadata --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run
    - doctor did not report published permissions: @netscript/plugin-streams healthy Permission metadata --allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi
    - generated plugin AppHost helper lacks workers manifest permissions
    - generated plugin AppHost helper lacks streams manifest permissions
    - generated background AppHost helper lacks workers manifest permissions
    --- doctor output ---
    @netscript/plugin-workers healthy Permission metadata --allow-net
    @netscript/plugin-streams healthy Permission metadata --allow-net
Summary: passed=0 failed=1 skipped=0
EXIT_CODE=1
```

The inverse patch restored the exact assignment. A path-scoped diff of the fixture against the
pre-fix gate commit was empty before the restored green; neither negative control added/deleted a
fake directory or changed fixture permissions.

## Restored focused gate — GREEN

```text
$ deno task e2e:cli gate scaffold.plugins behavior.package-backed-plugin-doctor --cleanup --format pretty
Running scaffold.plugins
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  PASSED 1845ms
Summary: passed=1 failed=0 skipped=0
EXIT_CODE=0
```

The verifier asserts the exact workers and streams permission arrays, all three healthy workers
registry checks, exact JSR modules, generated plugin/background helper permissions, no fake
directory warning, and doctor exit 0.

## Required gates

Complete command logs are retained untruncated in the orchestration slice `logs/` directory. The
decisive verdicts are:

```text
$ rtk proxy deno task check
filesSelected=2891 batches=25 failedBatches=0 occurrences=0
EXIT_CODE=0

$ rtk proxy deno task test
ok | 3260 passed (622 steps) | 0 failed | 17 ignored (3m34s)
EXIT_CODE=0

$ rtk proxy deno task lint
filesSelected=2019 batches=11 findings=0
EXIT_CODE=0

$ rtk proxy deno task fmt:check
filesSelected=2019 batches=11 failedBatches=0 findings=0 ignoredFindings=0
EXIT_CODE=0

$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
filesSelected=867 batches=8 failedBatches=0 occurrences=0
EXIT_CODE=0

$ rtk proxy deno task quality:gate
quality:scan ok=true findings=[]
arch:check completed with FAIL=0; existing doctrine warnings remain visible
EXIT_CODE=0
```

The filtered package test invocation also exercised the CLI/E2E unit set. Its one cwd-sensitive
quickstart test was not used as a verdict; the root task above ran that same test from the canonical
repository cwd and passed. CLI source tests and E2E unit tests separately completed green.

## Serialized runtime verdict — substantive PASS

The orchestrator granted the free global slot after independently verifying the focused gates.
The exact command ran once locally. Raw exit code was 0 and observed wall time was approximately
5m34s, so this was not a seconds-long classifier short-circuit. All 89 named gates executed; none
was skipped or cancelled. The untruncated transcript is:

```text
$ deno task e2e:cli run scaffold.runtime --cleanup --format pretty
Task e2e:cli deno run --allow-all packages/cli/e2e/cli.ts 'run' 'scaffold.runtime' '--cleanup' '--format' 'pretty'
Running scaffold.runtime
> preflight.deno: Deno CLI is available
  PASSED 6ms
> preflight.aspire: Aspire CLI is available
  PASSED 48ms
> scaffold.init: Scaffold generated project
  PASSED 1207ms
> scaffold.plugin.worker: Install official worker plugin
  PASSED 987ms
> scaffold.plugin.saga: Install official saga plugin
  PASSED 783ms
> scaffold.plugin.trigger: Install official trigger plugin
  PASSED 890ms
> scaffold.plugin.stream: Install official stream plugin
  PASSED 786ms
> scaffold.plugin.auth: Install official auth plugin
  PASSED 728ms
> scaffold.plugin.ai: Install official ai plugin
  PASSED 821ms
> scaffold.plugin.ai.mcp: Install official AI plugin with MCP skill tool
  PASSED 701ms
> scaffold.plugin.ai.lifecycle: Add and self-wire an AI tool through the plugin CLI
  PASSED 66ms
> scaffold.plugin-list: List configured plugins
  PASSED 1403ms
> scaffold.plugin.ai.appsettings: Reject synthesized service configuration for the AI plugin
  PASSED 283ms
> scaffold.ui-add-ai: Install the Fresh UI AI collection
  PASSED 294ms
> scaffold.ui-local-source: Map the unpublished AI dependency to the local workspace member
  PASSED 317ms
> generated.runtime-schemas: Generate runtime schemas from all configured plugin modules
  PASSED 995ms
> database.codegen: Generate database clients (standalone, no Aspire)
  PASSED 3750ms
> behavior.project-boundary-dev: Start the generated Fresh dev server below a hostile parent tsconfig
  PASSED 21896ms
> behavior.plugins-unhealthy: Reject missing workers and sagas registries
  PASSED 1526ms
> generated.plugins-check: Generate plugin registries from discovered manifests
  PASSED 960ms
> generated.workers-registry: Compile workers registry through plugin CLI
  PASSED 151ms
> generated.sagas-registry: Generate sagas registry through plugin CLI
  PASSED 93ms
> behavior.plugin-doctor-missing-module: Reject a configured plugin whose module has been removed
  PASSED 2632ms
> runtime.aspire-restore: Restore Aspire TypeScript SDK
  PASSED 7197ms
> runtime.service-env-fixture: Declare service environment and regenerate on the consumer path
  PASSED 1681ms
> generated.quality-negative: Prove every generated quality surface with deliberate failures
  PASSED 74542ms
> generated.deno-check: Run the generated workspace type-check task
  PASSED 2909ms
> generated.deno-lint: Run the generated workspace lint task
  PASSED 142ms
> generated.deno-fmt-check: Run the generated workspace format-check task
  PASSED 191ms
> generated.ui-ai-check: Type-check copied Fresh UI AI files
  PASSED 737ms
> generated.ai-namespace-check: Type-check the complete generated AI namespace
  PASSED 3174ms
> runtime.auth-smoke-env: Wire auth smoke environment
  PASSED 1663ms
> runtime.flow-b-fixture: Wire real Flow-B callback fixture
  PASSED 1782ms
> runtime.readiness-fixture: Wire dead-port readiness fixture
  PASSED 43ms
> runtime.aspire-start: Start generated Aspire AppHost
  PASSED 13685ms
> database.init: Initialize generated database
  PASSED 22380ms
> database.migration-artifacts: Create and verify headless and TTY migration artifacts
  PASSED 28207ms
> database.generate: Generate database clients
  PASSED 6990ms
> database.seed: Seed generated database
  PASSED 4598ms
> runtime.capture-db-allocation-first: Capture first live database allocation
  PASSED 438ms
> runtime.aspire-restart-after-db: Restart resident AppHost after database preparation
  PASSED 16140ms
> runtime.capture-db-allocation-second: Capture second live database allocation
  PASSED 439ms
> runtime.wait.postgres: Wait for postgres
  PASSED 352ms
> runtime.wait.garnet: Wait for garnet
  PASSED 5311ms
> runtime.wait.workers-api: Wait for workers-api
  PASSED 2186ms
> runtime.wait.workers: Wait for workers
  PASSED 796ms
> runtime.wait.sagas-api: Wait for sagas-api
  PASSED 435ms
> runtime.wait.sagas: Wait for sagas
  PASSED 413ms
> runtime.wait.triggers-api: Wait for triggers-api
  PASSED 374ms
> runtime.wait.triggers: Wait for triggers
  PASSED 261ms
> runtime.wait.auth: Wait for auth
  PASSED 284ms
> runtime.wait.streams: Wait for streams
  PASSED 478ms
> runtime.wait.app: Wait for the project-derived Fresh app
  PASSED 22458ms
> runtime.aspire-describe: Describe generated topology
  PASSED 128ms
> behavior.db-status-preserves-apphost: DB status preserves resident AppHost identity
  PASSED 5379ms
> behavior.endpoint-readiness: Endpoint-bearing process requires readiness evidence
  PASSED 458ms
> behavior.workers-health: Workers API health
  PASSED 24ms
> behavior.workers-jobs: List worker jobs
  PASSED 40ms
> behavior.workers-tasks: List worker tasks
  PASSED 13ms
> behavior.workers-seed: Seed worker demo data through API
  PASSED 10ms
> behavior.workers-trigger-health-job: Trigger workers plugin health job
  PASSED 145ms
> behavior.workers-executions: List recent worker executions
  PASSED 253ms
> behavior.mcp-endpoint-directory: Follow the documented MCP OpenAPI discovery path
  PASSED 6309ms
> behavior.service-health: Users service health
  PASSED 29701ms
> behavior.service-env: The AppHost-started service process observes its declared environment
  PASSED 325ms
> behavior.live-db-endpoint: Users service uses the second live Postgres allocation with correlated telemetry
  PASSED 607ms
> behavior.sagas-health: Sagas API health
  PASSED 4ms
> behavior.sagas-list: List saga definitions
  PASSED 12ms
> behavior.sagas-instances: List saga instances
  PASSED 8ms
> behavior.triggers-health: Triggers API health
  PASSED 5ms
> behavior.triggers-webhook: Accept generic trigger webhook
  PASSED 67ms
> behavior.triggers-events: List trigger events
  PASSED 83ms
> behavior.auth-live: Auth API liveness
  PASSED 6ms
> behavior.auth-ready: Auth API readiness
  PASSED 4ms
> behavior.auth-session: Read auth session route
  PASSED 18ms
> behavior.ai-chat-route: Import generated AI chat route
  PASSED 642ms
> behavior.app-home: Generated app serves its home page
  PASSED 278ms
> behavior.app-reference: Render canonical app reference states in desktop and mobile browsers
  PASSED 54394ms
> behavior.ui-render: Render safe nested and fallback generative UI output
  PASSED 161ms
> behavior.mcp-widget-roundtrip: Round-trip an MCP UI resource through the widget renderer
  PASSED 467ms
> behavior.plugins-health: Check installed plugin health
  PASSED 2501ms
> behavior.package-backed-plugin-doctor: Validate package-backed plugin doctor truth
  PASSED 3250ms
> behavior.otel.webhook: Fire webhook for OTEL trace capture
  PASSED 32ms
> behavior.otel.stream-consumer: Consume real Flow-B stream with fan-in links
  PASSED 1247ms
> behavior.otel.traces: Validate OTEL trace chain via Dashboard API
  PASSED 153ms
> behavior.streams.producer-reconnect: Recover buffered stream producer writes with correlated OTEL
  PASSED 10987ms
> behavior.otel.task-traces: Validate generated detached Aspire telemetry task
  PASSED 1862ms
> cleanup.aspire-stop: Stop generated Aspire AppHost
  PASSED 969ms
Summary: passed=89 failed=0 skipped=0
EXIT_CODE=0
```

This was a local invocation, so CI step-2/step-10 classifier provenance is not applicable. The
named transcript and wall time establish that the full suite executed rather than being skipped or
short-circuited.

## Lock and diff hygiene

Before every implementation commit:

```text
$ git diff --stat -- deno.lock packages/fresh-ui/deno.lock
EXIT_CODE=0
```

The output was empty. Both deliberate breaks were restored. Added lines contain no
`deno-lint-ignore`, `as unknown as`, or `@ts-ignore`; `git diff --check` is clean. Files were staged
by explicit path only, and no publication command ran.

## #1022 debt close-out

The exact close-out gate is `behavior.package-backed-plugin-doctor`, scheduled in both
`scaffold.plugins` and `scaffold.runtime`. The focused published-package red/green evidence is above.
The serialized runtime suite passed with all 89 gates executed, so the
`cli-plugin-doctor-published-module` row is closed with this focused red → green plus runtime proof.

## Acceptance status

All implementation claims are pre-merge proven. The six explicit PR-body acceptance items are
implemented and covered by the focused gate and the substantive serialized runtime pass. Formal
separate-session IMPL-EVAL remains pending; this implementation session does not self-certify that
box.
