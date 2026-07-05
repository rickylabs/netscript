# B2c — Telemetry-Relevant Arch-Debt & Doctrine Constraints

Direct reads of `.llm/harness/debt/arch-debt.md` and `docs/architecture/doctrine/` in the worktree.
These are the load-bearing, already-tracked constraints a telemetry revamp inherits. Cite the exact
debt ID / doctrine axiom.

## 1. Open arch-debt entries touching telemetry

### `packages/telemetry — doctrine verdict Refactor`
- **Reason:** "Confirm port/adapter split and expose OTEL adapter as a subpath export."
- **Gate:** F-3, F-5, F-6. **Owner:** Architecture doctrine follow-up. **Target:** 2026-Q3.
- **Status:** OPEN (created 2026-04-29). Linked: `doc-harness-doctrine-refactor--harness-v2-plan/plan.md`.
- **Implication:** the revamp is EXPECTED to introduce a ports/adapters split and a dedicated OTEL
  adapter subpath export. The current package has no `ports/` or `adapters/` folder and no OTEL-adapter
  subpath — B2a confirms this. This debt entry IS the doctrine mandate for the revamp's structure.

### `runtime — Aspire OTEL CLI Dashboard API discovery fails (aspire-otel-cli-discovery)`
- **Reason:** Slice can start the AppHost with full OTEL env and the Aspire Dashboard telemetry HTTP
  API returns `200` for `/api/telemetry/resources`, `/api/telemetry/logs`, `/api/telemetry/traces`,
  **but `aspire otel logs` / `aspire otel traces` CLI still fail "Dashboard API is not available."**
  Blocks CLI-command evidence, not trace capture.
- **Gate:** runtime - C# baseline, runtime - telemetry. **Status:** OPEN (2026-05-03),
  records `PASS_WITH_CLI_DEBT`. Linked: `feat-cli-aspire-otel-parity/plan.md`.
- **Implication (MAJOR for beta.6 dashboard):** the HTTP telemetry API works where the CLI does not.
  A NetScript dev-dashboard consuming traces should hit the Dashboard **HTTP API directly**, NOT shell
  out to `aspire otel`. This aligns with Fork E's independent finding (see B2d / B3e). Final PR "must
  not claim the `aspire otel` CLI path passed."

### Scaffold `createJobTools(ctx)` no-op (`workers-scaffold-job-tools-noop`)
- Documented across `docs/site/capabilities/telemetry.md` and `explanation/observability.md` with
  `<!-- caveat: arch-debt:workers-scaffold-job-tools-noop -->` markers. The scaffold job-tools
  (`trace.addEvent`, `withChildSpan`, `progress`) callers invoke INSIDE a handler are **no-op stubs**.
  Framework-level spans (dispatch/execute/scheduler/subprocess) are real; handler-level scaffold tools
  are not. Revamp should close this gap or make the boundary explicit.

### Non-`deno` task sandbox boundary (`workers-non-deno-task-sandbox-boundary`)
- Referenced inline in `docs/site/tutorials/erp-sync/03-polyglot-transform.md`
  (`<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->`). Only the `deno` task runtime
  is sandboxed; python/shell/powershell/dotnet/cmd/executable inherit full OS access. Relevant because
  cross-language trace propagation (a candidate showcase) crosses this trust boundary.

### `packages/telemetry` NOT in the doctrine repo-audit table
- `docs/architecture/doctrine/05-folder-structure.md`'s own "mapping rules onto the repo" audit does
  not enumerate `packages/telemetry`. Its structural debt (the forbidden `core/` folder, role-vocabulary
  drift — see B2a §1) was never catalogued there; the arch-debt "Refactor" entry is the only tracked note.

## 2. Doctrine constraints the revamp must satisfy

### Axioms (from doctrine)
- **A1 public surface = export map** (F-5): every subpath in `deno.json` is the contract; the orphan
  `src/public/mod.ts` and the fully-duplicated `./registry` subpath (B2a §2) both violate the spirit.
- **F-6 doc-lint bar**: `deno doc --lint` must be clean on the FULL export set (memory: "JSR doc-lint
  full export set" — must lint every export, not just mod.ts, or sibling re-exports false-flag).
- **A12/A13 (doctrine 08 Runtime, State, Failure)**: stateful packages must declare a named state
  model, named lifecycle, identity mechanism, and failure model; must use `ClockPort`, `AbortSignal`
  cancellation, a supervisor/crash-boundary model, and `NormalizedError`. Telemetry itself is largely
  stateless (module-level caches for tracers/config), but the `InstrumentationRegistry` lifecycle
  (`setupAll`/`teardownAll`) is the one stateful surface and should be graded against the lifecycle bar.

### Doctrine 08 verdicts on the plugins telemetry grades against
- `@netscript/sagas`: has a `defineSaga` DSL; doctrine expects named state/lifecycle. Its telemetry is
  a self-owned `otel-saga-tracer.ts` (B2a §7, §12) — a reimplementation rather than reuse.
- `@netscript/workers`: doctrine flags the executor as monolithic (`task-executor.ts` ~1,287 LOC).
  Workers is nonetheless the best-instrumented consumer (see B2b grading).
- `@netscript/triggers`: doctrine verdict was "Restructure" (flat files → application/state/runtime);
  arch-debt marks this RESOLVED 2026-07-03 (superseded by `packages/plugin-triggers-core` +
  `plugins/triggers`, doctrine-compliant layout incl. a `telemetry/` folder).

## 3. Revamp constraints checklist (derived)

1. Introduce ports/adapters split + OTEL-adapter subpath export (closes the tracked Refactor debt).
2. Remove/justify the forbidden `core/` folder; realign folder vocabulary to doctrine roles.
3. Delete orphan `src/public/mod.ts`; collapse duplicated `./registry` subpath.
4. Add config validation (Standard Schema) per repo convention; decouple `enabled` from `OTEL_DENO`.
5. Close `createJobTools` no-op OR make the framework-vs-scaffold boundary explicit and tested.
6. Dashboard/query surface must target the Aspire Dashboard HTTP telemetry API, not the `aspire otel` CLI.
7. Add tests for the untested instrumentation core (queue/scheduler/sse/worker) — the cross-process
   propagation path is the highest-value untested code.
8. Decide a single attribute-namespacing convention (vendor-prefix non-semconv).
