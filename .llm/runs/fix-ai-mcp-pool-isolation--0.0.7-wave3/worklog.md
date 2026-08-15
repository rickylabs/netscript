# Worklog: AI MCP pool failure isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-ai-mcp-pool-isolation--0.0.7-wave3` |
| Branch | `fix/ai-mcp-pool-isolation` |
| Archetype | `2 — Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- Existing `createMcpTransportPool` / `McpTransportPool` — pool composition and lifecycle.
- Existing `registerMcpTools` — registry bridge; needs caller cancellation.
- Required but unresolved: immediate per-server ready/status/error snapshot and resource-read/close
  cancellation.

### Domain Vocabulary

- Per-server lifecycle snapshot — required public vocabulary; exact type is blocked on scope amendment.
- Ready client/transport — a server whose connection can serve cached tools without network IO.
- Degraded server — addressable server identity plus retained failure evidence.

### Ports

- Existing `McpTransportPort` / `McpClientConnection` — missing resource-read and cancellable-close
  operations required by the live issue.

### Constants

- Existing MCP connection-state vocabulary is insufficient to retain a degraded error without a
  pool-owned snapshot or a port change; no new constants were introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Bootstrap research and record the scope blocker | red-first reproduction | run artifacts only |
| 1 | Failure-isolated concurrent pool startup and per-server status | focused RED test + check | blocked pending amended pool/test/public surface |
| 2 | Pending-operation cancellation and late-success cleanup | focused connector/port tests + check | blocked pending amended connector/base/ports/test surface |
| 3 | Registration cancellation and documentation | focused registry test + doc lint | blocked pending amended register/test/docs surface |

### Deferred Scope

- All implementation is deferred until the coordinator amends the frozen file surface.

### Contributor Path

After amendment, begin at `packages/ai/mcp.ts`, follow the public port to `src/mcp/application/pool.ts`,
and then the external boundary at `src/mcp/adapters/tanstack-connector.ts`.

### Amended Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0.1 | Re-lock plan after coordinator ruling | artifact consistency | run artifacts only |
| 1 | Commit healthy + never-settling RED regression | structured focused test, expected RED | test + run artifacts |
| 2 | Per-server pool settlement and public snapshot | focused test, check, lint, fmt | pool, port, entrypoint, tests + artifacts |
| 3 | Resource-read/close cancellation and late cleanup | focused test, check, lint, fmt | port, base, TanStack, tests + artifacts |
| 4 | Registration cancellation propagation | focused test, check, lint, fmt | registration, tests + artifacts |
| 5 | Optional/degraded docs and full proving gates | all contract/JSR gates | README + artifacts |

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15 10:32 CEST | 0 | bootstrap | Verified branch/head/base and read live issue #1448. |
| 2026-08-15 10:37 CEST | 0 | research | Reproduced sequential failure, non-settling pool abort, and non-settling TanStack connect abort red-first. |
| 2026-08-15 10:40 CEST | 0 | scope gate | Found required test/docs/port/base-transport changes outside the frozen three-file surface; stopped before source edits. |
| 2026-08-15 | 0.1 | scope ruling | Read committed `scope-ruling.md`; exact eight-file package surface and public contract are now authorized. |
| 2026-08-15 | 0.1 | plan re-lock | Recorded `PLAN-EVAL: N/A`; all prior RED evidence remains immutable and implementation can proceed mechanically. |
| 2026-08-15 | 1 | committed RED | Structured focused test exited `1` with `TimeoutError`; healthy peer remained unavailable behind the stalled first peer. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `PLAN-EVAL: BLOCKED / not launched` | The contract cannot express the live acceptance fix. The brief requires a stop and coordinator-granted amendment rather than opening an evaluator. | user contract; research findings |
| Do not implement a partial three-file fix | It would leave explicit acceptance criteria unsatisfied and falsely imply issue closure. | live issue #1448 |
| `PLAN-EVAL: N/A` after amendment | The ruling fixes the public shape, cancellation convention, exact surface, lifecycle behavior, and gates; no decision-heavy question remains. | committed `scope-ruling.md` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Live acceptance requires files outside frozen surface | significant | yes |
| Package-wide doctrine says Archetype 4 while leaf contract says Archetype 2 | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| red-first pool stall | `deno eval --unstable-kv ...` | RED reproduced · raw exit 0 | pending after abort; healthy connects 0 |
| red-first pool rejection | `deno eval --unstable-kv ...` | RED reproduced · raw exit 0 | rejected; healthy connects 0 |
| red-first TanStack connect abort | `timeout 3s deno eval --unstable-kv ...` | RED reproduced · raw exit 124 | abort fired; connector never settled |
| committed RED regression | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --filter "McpTransportPool isolates a never-settling server during startup" packages/ai/tests/mcp_test.ts` | RED · raw exit 1 | 0 passed, 1 failed; TimeoutError |
| check/test/lint/fmt | structured wrappers | NOT_RUN | No implementation; stopped at scope boundary. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| quality:scan / arch:check | NOT_RUN | scope stop | No source changed. |
| JSR audit / publish dry run | NOT_RUN | research surface scan only | Full fix/public surface not authorized. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker/browser/E2E | NOT_RUN | no lease | Explicitly prohibited. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| EIS-Chat migration contract | NOT_RUN | scope stop | Requires completed public snapshot/cancellation contract. |

## Handoff Notes

- Exact blocker: coordinator amendment to the writable file surface and the public status/close
  contract decision.
- This agent has not self-certified, launched PLAN-EVAL/IMPL-EVAL, or run expensive gates.

## Amendment Handoff Update

- The former scope blocker is resolved by commit `e2faaab15def77c131806aa6cf565d77bd6fe92c`.
- Next action is the committed RED regression slice; no implementation source has yet changed.
- No Aspire, Docker, browser, scaffold runtime, or CLI E2E command has run.

## 2026-08-15 — Slice 2 pool isolation and snapshot

- Changed pool tool collection from sequential awaits to concurrent per-server settlement.
- Caller abort now settles a non-cooperative pending server while preserving already-ready peers;
  a late success is stopped and cleanup failure is retained.
- Added the synchronous `snapshot` accessor with per-server state/last error and ready clients, and
  exported its explicit types from the existing `./mcp` entrypoint.
- Focused RED regression: same structured command as slice 1, raw exit `0` (1 passed).
- Full MCP test file: `deno run --allow-read --allow-write --allow-run
  .llm/tools/run-deno-test.ts -- --allow-all packages/ai/tests/mcp_test.ts`, raw exit `0` (12 passed).
- Structured targeted check: `deno run --allow-read --allow-run
  .llm/tools/run-deno-check.ts --file packages/ai/src/ports/mcp-transport.ts --file
  packages/ai/src/mcp/application/pool.ts --file packages/ai/mcp.ts --file
  packages/ai/tests/mcp_test.ts --ext ts`, raw exit `0`; wrapper used `--unstable-kv`.
- Structured targeted lint: same four files through `run-deno-lint.ts --ext ts`, raw exit `0`.
- Structured targeted fmt check: same four files through `run-deno-fmt.ts --ext ts`, raw exit `0`
  after scoped formatter normalization. The pre-format check exited `1` with three findings.
- `deno.lock` unchanged. No expensive gate ran.

## 2026-08-15 — Slice 3 scope stop

- The public `StdioMcpTransport` and `StreamableHttpMcpTransport` classes are composition wrappers,
  not subclasses of `BaseMcpTransport`.
- A port/base-only resource-read addition cannot be called through those exported concrete class
  types, and their current `stop()` declarations do not expose the ruled options bag.
- Required additional files are exactly
  `packages/ai/src/mcp/adapters/stdio-transport.ts` and
  `packages/ai/src/mcp/adapters/streamable-http-transport.ts`.
- Slice 3 stopped before source edits. No gate was approximated; prior slice-2 green evidence
  remains valid.
- `deno.lock` unchanged. No Aspire, Docker, browser, scaffold runtime, or CLI E2E command ran.

## 2026-08-15 — Amendment 2 re-lock

- Read the topic-orchestrator ruling at head `6db182503b219d76c7db23f89c71ec9e467c2f40`.
- Writable package surface is now exactly ten files; the two additions are pass-through-only
  concrete transport delegates.
- Recorded the optional port / mandatory published implementation split and the read-only Fresh
  compatibility gate.
- `PLAN-EVAL: N/A` remains justified because the ruling resolves all behavioral and type decisions.
- Next action: commit published-transport `readResource` and `stop` abort tests RED before slice-3
  implementation.

## 2026-08-15 — Slice 3 committed cancellation RED

- Added behavioral tests through exported `StreamableHttpMcpTransport` for an in-flight resource
  read and an in-flight close.
- Structured command: `deno run --allow-read --allow-write --allow-run
  .llm/tools/run-deno-test.ts -- --allow-all --filter "published transport"
  packages/ai/tests/mcp_test.ts`.
- Raw exit `1`: 0 passed, 2 failed. Resource-read was absent; close ignored the passed signal and
  timed out.
- No cancellation implementation source changed in this RED slice.

### Pool teardown RED addendum

- Structured focused pool-stop test raw exit `1`: the pool remained `timed-out` instead of
  `fulfilled` after caller abort, proving a hanging close still blocks aggregate teardown.
- Healthy peer teardown did run; the missing behavior is caller-signal propagation and independent
  aggregate settlement.

## 2026-08-15 — Slice 3 cancellation implementation

- Added SDK-independent resource result types; `readResource` is required on the low-level
  connection and optional only on `McpTransportPort` for Fresh compatibility.
- Base transport now races connect/call/resource/close against caller or transport cancellation,
  invokes late connection cleanup, and transitions closed even when caller-aborted close rejects.
- Default HTTP fetch receives the combined caller signal; TanStack list/call/resource/close and
  both HTTP/stdio connector startups settle on abort with late client cleanup.
- Both published concrete transports forward only `readResource(options)` and `stop(options)`.
- Pool stop uses per-server settlement and caller-signal races.
- Published-path/default-fetch/late-success regressions and the full MCP file: structured test raw
  exit `0`, 18 passed.
- Targeted eight-file structured check (`--unstable-kv`): raw exit `0`.
- Cross-package structured `packages/fresh` check (`--unstable-kv`, 197 files, 2 batches): raw exit
  `0`; no out-of-scope source changed.
- Targeted eight-file structured lint: raw exit `0`.
- Targeted eight-file structured fmt check: raw exit `0` after scoped formatter normalization;
  the pre-normalization check exited `1` with one finding.
- `deno task quality:scan`: raw exit `0`, no findings.
- `deno task arch:check`: raw exit `0`; existing warning census only, no failures.
- `deno.lock` unchanged. No expensive runtime gate ran.

## 2026-08-15 — Slice 4 registration cancellation RED

- Focused structured registration test raw exit `1`: caller abort was not forwarded to pending
  discovery, which timed out instead of rejecting.
- No registration implementation source changed in the RED commit.

## 2026-08-15 — Slice 4 registration cancellation implementation

- Added an optional `McpConnectOptions` argument to `registerMcpTools` and its registration handle's
  `stop`, preserving all existing two-argument/zero-argument call sites.
- Forwarded the registration signal through discovery and registered tool calls; registration stop
  forwards its own caller options to transport stop.
- Full structured MCP test file raw exit `0`, 20 passed, including discovery and registered-call
  cancellation.
- Targeted four-file structured check (`--unstable-kv`), lint, and fmt each raw exit `0`.
- `deno task quality:scan` raw exit `0`, no findings.
- `deno task arch:check` raw exit `0`, baseline warnings only.
- `deno.lock` unchanged. No expensive runtime gate ran.

## 2026-08-15 — Slice 5 degraded-infrastructure docs and final JSR audit

- Documented bounded startup/teardown, synchronous snapshot inspection, healthy-client selection,
  degraded-server retry, and last-error reporting in `packages/ai/README.md`.
- Replaced the touched connector's computed TanStack module specifiers with literal imports so JSR
  can analyze and rewrite the exact `npm:@tanstack/ai-mcp@0.2.1` package mapping. Explicit runtime
  narrowing now preserves the stdio boundary without assertions.
- Structured AI check: `deno run --allow-read --allow-run
  .llm/tools/run-deno-check.ts --root packages/ai --ext ts,tsx`, raw exit `0` (98 files;
  `--unstable-kv`).
- Mandatory cross-package check: `deno run --allow-read --allow-run
  .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`, raw exit `0` (197 files, 2
  batches; `--unstable-kv`).
- Structured AI tests: `deno run --allow-read --allow-write --allow-run
  .llm/tools/run-deno-test.ts -- --allow-all packages/ai/tests`, raw exit `0` (138 passed).
- Structured AI lint/fmt: `run-deno-lint.ts --root packages/ai --ext ts,tsx` and
  `run-deno-fmt.ts --root packages/ai --ext ts,tsx`, raw exit `0` each (98 files).
- `deno doc --lint packages/ai/mcp.ts`: raw exit `0` (1 file).
- `deno task quality:scan`: raw exit `0`, no findings. `deno task arch:check`: raw exit `0`,
  repository baseline warnings only.
- `deno task publish:dry-run`: raw exit `0`; isolated-declaration checks include
  `packages/ai/mcp.ts`, and the touched connector emits no unanalyzable-import warning.
- JSR surface audit: existing `./mcp` export reused; no new `deno.json` export; TanStack dependency
  is exactly pinned; touched publishable TypeScript has no `import.meta`, runtime file/asset read,
  import attribute, or runtime `@netscript/*` dependency. Static hazard scan raw exit `1` means no
  matches. Prohibited escape-hatch scan raw exit `1` means no matches.
- `git diff --quiet <immutable-base> -- deno.lock` returned raw exit `0` (no difference). No
  asset/template surface was touched, so `check:assets-barrel` is not applicable.
- No Aspire, Docker, browser, scaffold runtime, or CLI E2E command ran. Implementation is complete;
  exact next blocker is the topic orchestrator's substantive Tier-A review/sign-off, followed by a
  separately launched opposite-family IMPL-EVAL.

## 2026-08-15 — IMPL-EVAL cycle 1 F-1 repair RED

- Formal cycle 1 returned `FAIL_FIX` at evaluated head `e3c74d7aaf3b7734b5a44a5be248c01f004c21e5`:
  the registration discovery signal was captured as the lifetime signal for every registered call.
- Replaced the defect-encoding registered-call cancellation test with a regression requiring a
  registered call to succeed after the registration discovery signal aborts. The separate
  discovery-abort regression remains unchanged.
- Structured focused RED command: `deno run --allow-read --allow-write --allow-run
  .llm/tools/run-deno-test.ts -- --allow-all --filter "registered calls outlive the registration
  discovery signal" packages/ai/tests/mcp_test.ts`.
- Raw exit `1`: 0 passed, 1 failed with `AbortError: registration deadline` at the handler call.
- `PLAN-EVAL: N/A` remains justified: the evaluator prescribed an exact three-file, mechanical
  lifetime decoupling with no contract or architecture decision remaining.
- No implementation or README change is included in this RED slice. No expensive gate ran.

## 2026-08-15 — IMPL-EVAL cycle 1 F-1 repair GREEN

- Decoupled registered calls from the registration discovery/re-sync signal by restoring the
  handler's signal-free `transport.callTool(name, args)` invocation. Discovery and automatic
  re-sync still call `transport.listTools(options)` unchanged; registration stop still accepts and
  forwards its own operation-specific options.
- README now uses `pool.connect({ signal: startup })` for a one-shot degraded-startup deadline and
  states that `registerMcpTools` signals scope discovery/re-sync rather than registered calls.
- Focused regression command (same as RED): raw exit `0`, 1 passed / 0 failed. Full structured MCP
  suite raw exit `0`, 20 passed / 0 failed, including the unchanged discovery-abort regression.
- Structured AI check raw exit `0` (98 files, `--unstable-kv`); mandatory structured Fresh check
  raw exit `0` (197 files, 2 batches, `--unstable-kv`).
- Structured AI lint raw exit `0`. Initial structured fmt check raw exit `1` for one line-wrap
  finding; scoped formatting followed by the same wrapper returned raw exit `0` (98 files).
- `deno task quality:scan` raw exit `0`, no findings. `deno task arch:check` raw exit `0`, baseline
  repository warnings only.
- `deno doc --lint packages/ai/mcp.ts` raw exit `0`. Package-local
  `deno publish --dry-run --allow-dirty` raw exit `0`, with isolated declarations and no warnings.
- Repair product delta from handoff head `1bdb09e13` is exactly the three authorized files.
  `packages/fresh`, `packages/ai/deno.json`, and `deno.lock` quiet-diff checks each returned raw
  exit `0` (unchanged). Prohibited-pattern and runtime-JSR-hazard scans each returned expected
  no-match exit `1`.
- No O-1 cleanup or O-2/O-4/O-5 work was taken. No Aspire, Docker, browser, scaffold runtime, or
  CLI E2E command ran.
- Exact next blocker: fresh independent Tier-A review of this repair, followed by separately owned
  IMPL-EVAL cycle 2; this implementation session does not self-certify.
