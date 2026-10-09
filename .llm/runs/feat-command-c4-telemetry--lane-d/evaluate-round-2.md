# Evaluation: C4 Command Telemetry (Issue #1485, PR #2094)

Independent IMPL-EVAL round 2 technical acceptance evaluation for leaf C4
(`feat/command-c4-telemetry`).

## Metadata

| Field                | Value                                                                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run ID               | `feat-command-c4-telemetry--lane-d`                                                                                                                                                                                                                                              |
| Target               | Issue #1485 / PR #2094 (`feat/command-c4-telemetry`)                                                                                                                                                                                                                             |
| Evaluated Clean HEAD | `2b233701dedc822d74458dbd62f7312770d28636`                                                                                                                                                                                                                                       |
| Baseline             | `102f40e92501bb9e500c4a2cbc615604f134194e`                                                                                                                                                                                                                                       |
| Predecessor HEAD     | `f99c0f13a7c1ed988bcbfe188ff330703bd9b361` (Round 1 evaluate PASS)                                                                                                                                                                                                               |
| Archetype            | `2 - Integration`                                                                                                                                                                                                                                                                |
| Scope overlays       | `telemetry`, `service`, `cli`                                                                                                                                                                                                                                                    |
| Generator            | `gpt-6.1-sol` (OpenAI family, session-separated)                                                                                                                                                                                                                                 |
| Evaluator Route      | Primary requested `opencode_go` GLM 5.3 Flash max refused by live expense guard (`provider_rate_limited` before inference); observed Google native fallback (`gemini-3.8-flash` / Google family) authorized by HARNESS.md and supervisor. Separate vendor family from generator. |

## Round 2 Delta & Context

Round 1 evaluated clean HEAD `f99c0f13a7c1ed988bcbfe188ff330703bd9b361` with verdict `PASS`.
Subsequent native CI verification and review identified missing documentation export inventory and
an existing CLI consumer assertion: the plugin workspace mutator rewrite map must cover every public
telemetry subpath.

The round 2 delta incorporates:

1. **CLI Consumer Rewrite Map**: Added `@netscript/telemetry/commands` to
   `PLUGIN_SERVICE_SOURCE_IMPORTS` in
   `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts`.
2. **Documentation Export Inventory**: Added `@netscript/telemetry/commands` subpath entry and a
   complete 16-symbol export reference table to `docs/site/reference/telemetry/index.md`.
3. **Upstream Integration**: Reconciled cleanly with `main` via merge `adcef4687` (incorporating C3
   PostgreSQL store without modifying C3).
4. **Generated Consumer Freshness**: Refreshed MCP export corpus with pinned Deno 2.9.5
   (`2b233701d`).
5. **E2E Runtime Scope Expansion**: Under the plugin-copy rewrite repair, leaf C4 requires the
   canonical one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
   verification.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                       |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | Reused approved whole-chain PLAN-EVAL PASS at `359d17f426592d58a6f6388a9522bc3afbc45dde` (Decision 9, S10)                                                     |
| Design section exists in worklog       | PASS   | `worklog.md` contains explicit `## Design` section specifying contracts, adapters, and bounds                                                                  |
| Commit slices match design plan        | PASS   | Slices S10a–S10d followed: contracts, adapter, executor early observation, asset qualification, and consumer map repairs                                       |
| Each slice has a passing gate          | PASS   | Explicit gate logs and receipts recorded for vocabulary, adapter, executor, qualification, and consumer rewrite maps                                           |
| No speculative seams (unused files)    | PASS   | All new files map to public subpath exports, test fixtures, docs, or CLI mutator mappings                                                                      |
| Constants used for finite vocabularies | PASS   | `CommandSpanNames`, `CommandAttributes`, `CommandOutcomes`, `CommandIdempotencyStates`, `CommandIsolationLevels`, `CommandStoreProviders`, `CommandErrorTypes` |

## Technical Acceptance Criteria

| Criterion                                     | Result | Evidence                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact finite vocabularies and closed bounds   | PASS   | Closed sets for 3 span names, 8 attributes, 6 outcomes, 6 idempotency states, 6 isolation levels, 4 store providers, 9 error kinds. Registration upper-bounded to 1..1024 unique name/version pairs. Definitions validate lowercase dot/hyphen names <= 120 chars and positive safe integer versions. Audit and outbox counts bounded 0..64.   |
| Strict attribute selection (no leak)          | PASS   | `commandStartAttributes` and `commandResultAttributes` explicitly select allowed fields; payload, envelope headers, raw identities, key hashes, version tokens, and exception stacks/messages are completely excluded.                                                                                                                         |
| Native INTERNAL server child parenting        | PASS   | `trace` creates `SpanKind.INTERNAL` beneath active request context. Verified in `native_test.ts`: `command.kind === SpanKind.INTERNAL`, `command.parentSpanContext?.spanId === server.spanContext().spanId`.                                                                                                                                   |
| PRODUCER publication and W3C relationships    | PASS   | `traceRelay` creates `SpanKind.INTERNAL`; `tracePublish` creates `SpanKind.PRODUCER` and activates context. W3C injection propagates publication context to consumers; deferred roots link to publication context without re-parenting. Verified in `native_test.ts`.                                                                          |
| Lifecycle and once-only operation semantics   | PASS   | `finish` and `end` are invoked once. Retained finish calls are ignored. Observer failures do not alter application results or error identity. Operation executed once. Verified in `lifecycle_test.ts` and `commands-telemetry_test.ts`.                                                                                                       |
| Early validation and cancellation observation | PASS   | `createCommandExecutor` enters `telemetry.trace` before identity/validation. Early rejections (missing key -> `missing`, unsupported isolation, pre-aborted signal -> `cancelled`) observe spans before any store access. Store protocol, transaction isolation, and zero-retry semantics preserved. Verified in `commands-telemetry_test.ts`. |
| Semantic production mutations                 | PASS   | 11 named tests verified with production mutations in `mutations.json`: each mutant produces an `AssertionError` (exit 1), and every restored target passes with byte-identical restoration (exit 0).                                                                                                                                           |
| CLI Consumer Qualification                    | PASS   | `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts` verifies `@netscript/telemetry/commands` rewrites to canonical consumer import paths. All 19 tests pass (exit 0).                                                                                                                                                          |
| Truthful remaining Definition of Done         | PASS   | PR body retains unchecked DoD checklist pending independent evaluation and full CI completion. No false readiness or merge claimed.                                                                                                                                                                                                            |

## Static Gates

| Gate                  | Command or check                                               | Result | Evidence                                                                                                                                                     | Notes                                   |
| --------------------- | -------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Narrow / Root check   | `deno task check`                                              | PASS   | Exit 0: 3238 files selected across packages/plugins, 27 batches, 0 failed batches, 0 errors                                                                  | `--unstable-kv` included                |
| Format check          | `deno task fmt:check`                                          | PASS   | Exit 0: 2224 files selected, 37 batches, 0 findings                                                                                                          | Wrapper passed                          |
| Lint check            | `deno task lint`                                               | PASS   | Exit 0: 2224 files selected, 37 batches, 0 findings                                                                                                          | Wrapper passed                          |
| Doc lint (new)        | `deno doc --lint packages/telemetry/commands.ts`               | PASS   | Exit 0: 0 diagnostics                                                                                                                                        | Clean export graph                      |
| Doc lint (attributes) | `deno doc --lint packages/telemetry/src/attributes/command.ts` | PASS   | Exit 0: 0 diagnostics                                                                                                                                        | Clean types                             |
| Baseline doc lint     | `deno task doc:lint --root packages/telemetry`                 | PASS   | `./commands.ts` (0 errors) and `./attributes.ts` (0 errors) clean; 7 baseline diagnostics in unchanged oRPC/Hono/SDK files explicitly recorded in `drift.md` | Baseline debt                           |
| Docs exports drift    | `deno task docs:exports-drift`                                 | PASS   | Exit 0: Telemetry reference index matches all public package exports including `commands`                                                                    | Synchronized                            |
| Docs accuracy         | `deno task docs:accuracy`                                      | PASS   | Exit 0: Documentation code blocks and symbol tables validated                                                                                                | Clean                                   |
| Publish dry-run       | `deno publish --dry-run --allow-dirty` (packages/telemetry)    | PASS   | Exit 0: `Success Dry run complete`                                                                                                                           | Zero slow types in new commands surface |
| Publish dry-run       | `deno publish --dry-run --allow-dirty` (packages/service)      | PASS   | Exit 0: `Success Dry run complete`                                                                                                                           | Approved carve-out preserved            |
| JSR package audit     | `audit-jsr-package.ts --root packages/telemetry`               | PASS   | Exit 0: dry-run OK                                                                                                                                           | 14 subpaths qualified                   |
| JSR package audit     | `audit-jsr-package.ts --root packages/service`                 | PASS   | Exit 0: dry-run OK                                                                                                                                           | 5 subpaths qualified                    |
| Generated assets      | `deno task check:assets-barrel`                                | PASS   | Exit 0: generated assets barrel up-to-date                                                                                                                   | Fresh                                   |
| Generated assets      | `deno task check:publish-assets`                               | PASS   | Exit 0: publish assets up-to-date                                                                                                                            | Fresh                                   |
| Generated assets      | `deno task check:mcp-export-corpus` (pinned Deno 2.9.5)        | PASS   | Exit 0: export corpus up-to-date at `2b233701d`                                                                                                              | Matches pinned compiler                 |
| Generated assets      | `deno task check:agent-docs-prose` (pinned Deno 2.9.5)         | PASS   | Exit 0: agent docs prose up-to-date and fresh                                                                                                                | Matches site output                     |

## Fitness Gates

| Gate | Function                          | Result | Evidence                                                                              | Violations |
| ---- | --------------------------------- | ------ | ------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint                    | PASS   | All new files under 200 lines (`command.ts`: 155, `otel-command-telemetry.ts`: 182)   | 0          |
| F-2  | Helper-reinvention scan           | PASS   | Reuses `@opentelemetry/api`, existing `Tracer`, `Span`, and context helpers           | 0          |
| F-3  | Layering check                    | PASS   | `telemetry` has no dependency on `service`. Structural adapter implements port.       | 0          |
| F-4  | Inheritance audit                 | PASS   | Functional factories and interfaces; no inheritance chains                            | 0          |
| F-5  | Public surface audit              | PASS   | Explicit exported types in `commands.ts`; `isolatedDeclarations: true` satisfied      | 0          |
| F-6  | JSR publishability gate           | PASS   | `publish:dry-run` clean for both packages                                             | 0          |
| F-7  | Doc-score gate                    | PASS   | Full `@module`, `@example`, and param JSDoc annotations on all new entrypoint symbols | 0          |
| F-8  | Workspace `lib` override check    | PASS   | Conforms to root `deno.json` compiler options                                         | 0          |
| F-9  | Permission declaration check      | PASS   | README documents that command telemetry requires only exporter permissions            | 0          |
| F-10 | Test-shape audit                  | PASS   | 11 named tests with explicit assertions and semantic mutation proof                   | 0          |
| F-11 | Forbidden-folder lint             | PASS   | Canonical folders: `src/attributes/`, `src/adapters/commands/`, `tests/commands/`     | 0          |
| F-12 | Naming-convention lint            | PASS   | Kebab-case filenames, PascalCase types/constants, camelCase functions                 | 0          |
| F-13 | Saga and runtime invariants       | N/A    | C4 scope is command telemetry; saga producer is scheduled for later leaf              | N/A        |
| F-14 | Console-log lint                  | PASS   | Zero `console.log` statements in library code                                         | 0          |
| F-15 | Re-export-of-upstream lint        | PASS   | Owned domain/ports re-exported; no raw leaky upstream re-export                       | 0          |
| F-16 | Folder-cardinality lint           | PASS   | `src/adapters/commands/` has 1 file (well within cap 12)                              | 0          |
| F-17 | Abstract-derived co-location lint | PASS   | Interfaces and factory co-located                                                     | 0          |
| F-18 | Sub-barrel lint                   | PASS   | Focused entrypoint `./commands.ts` cleanly exports surface                            | 0          |
| F-19 | Scoped source gate runners        | PASS   | `deno task quality:scan` exit 0 (0 findings); `deno task arch:check` exit 0 (FAIL=0)  | 0          |

## Runtime Gates

| Gate                       | Validation                                                                                                                                                           | Result   | Evidence                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| C4 Named Test Suite        | `deno test --allow-all packages/telemetry/tests/attributes/command_test.ts packages/telemetry/tests/commands/*.ts packages/service/tests/commands-telemetry_test.ts` | PASS     | Exit 0: 11 passed, 0 failed                                                                                                  |
| Telemetry Full Test Suite  | `deno test --allow-env --allow-read packages/telemetry/tests/`                                                                                                       | PASS     | Exit 0: 62 passed, 0 failed                                                                                                  |
| Service Commands Suite     | `deno test --allow-all packages/service/tests/commands*_test.ts`                                                                                                     | PASS     | Exit 0: 51 passed, 0 failed                                                                                                  |
| Contracts Suite            | `deno test --allow-all packages/contracts/tests/`                                                                                                                    | PASS     | Exit 0: 20 passed, 0 failed                                                                                                  |
| Scoped Regression Suite    | `deno test --allow-all --unstable-kv packages/telemetry packages/service packages/contracts`                                                                         | PASS     | Exit 0: 298 passed (293 tests + 5 steps), 0 failed                                                                           |
| CLI Mutator Unit Suite     | `deno test --allow-all packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts`                                                                            | PASS     | Exit 0: 19 passed, 0 failed (covers `@netscript/telemetry/commands` rewrite map)                                             |
| Full-Chain CLI E2E Runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`                                                                                                   | FAIL_FIX | Exit 1: 43 passed, 1 failed (`runtime.aspire-start` describe timeout), 0 skipped. Cleanup gate `cleanup.aspire-stop` passed. |

### Full-Chain E2E Detail (`scaffold.runtime`)

1. **Initial Preflight Run**:
   - Result: Failed early on missing installed .NET SDK selection and unavailable Docker daemon
     socket.
   - Status: Recorded as a real failure, not erased.

2. **Configured Execution**:
   - 43 gates passed, including:
     - Project scaffolding, configuration, and plugin dependencies (`worker`, `saga`, `trigger`,
       `stream`, `auth`, `ai`).
     - Standalone DB codegen and migration.
     - Production design route exclusion.
     - Plugin registries compilation and doctor verification.
     - Generated workspace type-check, lint, and format-check (`generated.deno-check`,
       `generated.deno-lint`, `generated.deno-fmt-check`).
     - Generated quality negative surface verification (`generated.quality-negative`).
     - Generated AI and Fresh UI copy checks.
     - Auth smoke environment and Flow-B fixtures.
   - 1 gate failed:
     - `runtime.aspire-start` (`describe-follow.ts` capture):
       - Aspire AppHost successfully launched and started containers (`postgres`, `garnet`,
         `redis`).
       - Health checks for `garnet_resp` and `redis_resp` timed out (`ETIMEDOUT` to allocated ports)
         due to container network boundaries in the Docker-in-Docker environment without an active
         loopback port relay.
       - The observation stream timed out after 300s waiting for resource convergence.
   - 1 cleanup gate passed:
     - `cleanup.aspire-stop`: Successfully stopped and cleaned the AppHost and session containers.

## Consumer Gates

| Consumer             | Validation                                                                                                                     | Result | Evidence                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------- |
| `@netscript/service` | Cross-package executor integration in `packages/service/tests/commands-telemetry_test.ts`                                      | PASS   | Structural assignability to `CommandTelemetryPort`; early rejection and committed telemetry tested |
| `@netscript/cli`     | Workspace mutator rewrite mapping in `packages/cli/src/kernel/adapters/plugin/workspace-mutator_test.ts`                       | PASS   | Export rewrite map includes `@netscript/telemetry/commands`; generates clean consumer imports      |
| Documentation Site   | Reference inventory in `docs/site/reference/telemetry/index.md` via `deno task docs:exports-drift` & `deno task docs:accuracy` | PASS   | All 16 public command symbols documented and validated                                             |

## Anti-Pattern Check

| AP    | Status | Evidence                                                                                                      | Notes                   |
| ----- | ------ | ------------------------------------------------------------------------------------------------------------- | ----------------------- |
| AP-1  | CLEAR  | File length well within limits (max file 182 lines)                                                           |                         |
| AP-2  | CLEAR  | Explicit typed options and definitions                                                                        |                         |
| AP-3  | CLEAR  | Port strictly limited to required methods (`trace`, `traceRelay`, `tracePublish`)                             | No fat port             |
| AP-4  | CLEAR  | No `any` casting in new source; quality scan clean                                                            |                         |
| AP-5  | CLEAR  | Pure composition factory; no class hierarchies                                                                |                         |
| AP-6  | CLEAR  | No speculative seams or unneeded helpers                                                                      |                         |
| AP-7  | CLEAR  | Web standards and `@opentelemetry/api` used directly                                                          |                         |
| AP-8  | CLEAR  | Factory composition without DI container                                                                      |                         |
| AP-9  | CLEAR  | Clear structural adapter without boolean flag dispatch                                                        |                         |
| AP-10 | CLEAR  | No cyclic package dependencies; service/telemetry decoupled                                                   |                         |
| AP-11 | CLEAR  | No module-load side effects or premature connections                                                          |                         |
| AP-12 | CLEAR  | Explicit parameter passing and context propagation                                                            |                         |
| AP-13 | CLEAR  | Typed error handling; telemetry errors caught and swallowed without replacing application outcome             |                         |
| AP-14 | CLEAR  | Native tests prove parentage, kind, propagation, links, and lifecycle                                         |                         |
| AP-15 | CLEAR  | No monkey patching or global mutation                                                                         |                         |
| AP-16 | CLEAR  | Semantic failure mappings (`aborted`, `invalid_envelope`, `unsupported_capability`) map to closed error types |                         |
| AP-17 | CLEAR  | Canonical `ports/` and `adapters/` folder vocabulary                                                          | No `interfaces/` folder |
| AP-18 | CLEAR  | No leaky abstraction; raw exporter errors cannot escape                                                       |                         |
| AP-19 | CLEAR  | README documents permission requirements                                                                      |                         |
| AP-20 | CLEAR  | Telemetry observer failures preserve original application errors                                              |                         |
| AP-21 | CLEAR  | No barrel exports of unrelated internals                                                                      |                         |
| AP-22 | CLEAR  | No redundant sub-barrel re-exports                                                                            |                         |
| AP-23 | CLEAR  | Adapter implementation referenced from composition root                                                       |                         |
| AP-24 | CLEAR  | Finite vocabulary validated with sets/arrays, not arbitrary strings                                           |                         |
| AP-25 | CLEAR  | Pure attribute builders; IO isolated to exporter                                                              |                         |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                             |
| --------------------- | ----- | -------------------------------------------------------------------- |
| New entries           | 0     | No doctrine debt introduced                                          |
| Resolved entries      | 0     | None targeted by C4                                                  |
| Deepened violations   | 0     | None                                                                 |
| Unrecorded violations | 0     | Existing baseline telemetry doc-lint debt pre-dates C4 in `drift.md` |

## Findings

1. **Full-Chain Runtime Smoke Convergence Failure**:
   - The canonical one-pass `scaffold.runtime` suite executed 44 gates, passing 43.
   - `runtime.aspire-start` failed with an uncaught
     `Error: aspire describe --follow did not converge: timed out after 300s`.
   - The root cause is container loopback reachability in Docker-in-Docker: Aspire's health checks
     for `garnet_resp` and `redis_resp` failed with `ETIMEDOUT` to the allocated ports because the
     TCP ports were bound within the remote Docker daemon without an active loopback forwarder/relay
     to the Aspire host.
   - The subsequent cleanup gate (`cleanup.aspire-stop`) executed cleanly and freed all resources.
2. **Native CI & Readiness Incomplete**:
   - Native CI on PR #2094 is enabled with the `e2e-cli-gate` workflow.
   - PR checklist Definition of Done items remain unchecked. Readiness cannot be certified until
     Native CI and runtime smoke achieve green execution.

## Required Next Actions (Remediation)

1. **Run `scaffold.runtime` with an Owner-Authorized Port Relay**:
   - Execute the canonical runtime smoke
     (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`) with a loopback relay
     configuration (as established in previous DinD runs) so that Aspire resource probes can reach
     Garnet and Redis container endpoints.
   - Confirm all gates in the suite pass cleanly to exit 0.
2. **Verify Native CI**:
   - Await green verdict from Native CI on GitHub PR #2094.
3. **Complete PR Definition of Done**:
   - Update PR body checklist items only after end-to-end evidence is verified.

## Lessons for Promotion

| Lesson                                                | Pattern                                                                                                                                  | Applies to                | Confidence |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------- |
| Structural Port Inversion for Cross-Package Telemetry | Expose a telemetry-owned structural port that satisfies an application port shape without creating an import dependency between packages | Archetype 2 (Integration) | High       |
| Consumer Rewrite Map Synchronization                  | When introducing a new package public entrypoint, update CLI plugin mutator import maps alongside documentation index tables in one pass | Archetype 2 / CLI         | High       |

## Verdict

| Field          | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict        | `FAIL_FIX`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Evaluated HEAD | `2b233701dedc822d74458dbd62f7312770d28636`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Rationale      | On exact clean HEAD `2b233701dedc822d74458dbd62f7312770d28636`, all C4 product implementation, vocabulary contracts, strict attribute filtering, W3C propagation, mutation testing, CLI consumer workspace mutator repairs, documentation export tables, static checks, quality scans, architecture fitness rules, and 298 scoped regression tests PASS. However, the newly mandated canonical one-pass `scaffold.runtime` gate failed at `runtime.aspire-start` due to describe convergence timeout on container loopback ports under Docker-in-Docker (43 passed, 1 failed). Under NetScript harness doctrine, no technical gate is waived, and a required gate failure mandates `FAIL_FIX` until full-chain runtime smoke convergence and native CI pass with concrete verified evidence. |
