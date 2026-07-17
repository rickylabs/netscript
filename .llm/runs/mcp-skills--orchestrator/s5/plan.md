# Plan: `@netscript/mcp` S5 doctor aggregation

## Metadata

| Field | Value |
| --- | --- |
| Run | `mcp-skills--orchestrator/s5` |
| Branch | `feat/netscript-mcp-skills-s5-doctor` |
| Target | `packages/mcp` |
| Archetype | `6 — CLI / Tooling` (integration ports/adapters inside the locked package shape) |
| Overlays | none |

## Goal and Scope

Aggregate four bounded doctor families: telemetry reachability, Aspire graph inspection, NetScript project wiring, and injected plugin diagnostics. Preserve no-running-app usefulness and existing doctor compatibility.

Deferred: real CLI plugin-doctor injection (S7), analytics, docs tools, CLI triggers/commands, generic Aspire environment doctor, and PR creation.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `DoctorCheckFamily` is an MCP-owned domain port returning a named family and `DoctorCheck[]`; the application flow only aggregates | Names the real extension axis and keeps IO outside application. |
| D2 | Keep `DoctorCheck` as the atomic contract; extend `DoctorResult` with bounded family results while retaining flattened `checks`, `counts`, `status`, and `endpoint` | Backwards-compatible output plus family attribution. |
| D3 | Severity order is `pass < warn < fail`; overall status is the worst check and counts cover every check exactly once | Deterministic aggregation math. |
| D4 | Telemetry unreachable is `fail` only when an endpoint was explicitly supplied in tool input; otherwise `warn` | A stopped local app is normal, but a caller-specified endpoint is an asserted expectation. |
| D5 | Telemetry family retains shared resolution and HTTP→HTTPS fallback and reports the successful scheme | Preserves S3 behavior and one resolver authority. |
| D6 | Add direct workspace dependency on `@netscript/aspire`; infrastructure calls `inspectAspire()` only when an Aspire apphost/config marker exists | Leaf dependency is clean; avoid generic SDK/.NET checks and irrelevant diagnostics. |
| D7 | Never import or reimplement CLI plugin doctor. Define `ProjectDoctorPort`; S5's stub family emits a clearly informational warning and S7 injects a real CLI-side adapter | Prevents the S7 cycle and follows dependency inversion/wrap-don't-reimplement. |
| D8 | Project wiring family uses injected filesystem behavior and fixture roots; checks `deno.json`, workspace member sanity, generated registries when plugins are configured, and docs root as informational | Pure semantic project checks with deterministic tests. |
| D9 | CLI composition constructs the four named families additively and passes them to `createDoctorFlow`; no new CLI command | Keeps sibling S4 overlap minimal. |
| D10 | Preserve accepted `MCP-A6-V2-SHAPE` debt; no new architecture debt is expected | S5 does not broaden the package's locked horizontal shape. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| CLI dependency vs injection | resolved now | D7 fixes port/injection and stub behavior. |
| Aspire direct dependency | resolved now | D6 fixes direct leaf dependency. |
| Explicit endpoint failure semantics | resolved now | D4 fixes fail vs warn. |
| Output compatibility/family shape | resolved now | D2 fixes additive output. |
| Registry marker names | must resolve before Slice 2 | Derive from current generated scaffold sources; lock exact candidates in worklog before editing implementation. |
| S7 real adapter | safe to defer | Explicitly outside S5 and represented by the injected port. |

## Commit Slices

1. Doctor family contract and aggregation — proves family flattening, severity counts, explicit-endpoint failure, and no-running-app warning; creates `src/domain/doctor-check-family.ts`, `src/application/flows/telemetry-doctor-family.ts`; modifies `doctor-flow.ts`, `tool-contracts.ts`, runner composition seam and doctor tests; updates S5 artifacts. Gate: focused aggregation/telemetry tests + scoped check.
2. Aspire, project, and plugin families — proves real Aspire mapping, fixture-driven project semantics, and explicit S7 plugin stub; creates named domain ports/infrastructure families and project fixtures; modifies `deno.json`, `cli.ts`, README, contracts/tests, and S5 artifacts. Gate: per-family fixture tests + all MCP tests.
3. Merge-readiness evidence — proves scoped check/lint/fmt, tests, architecture, full-export doc lint, publish dry-run, and consumer smoke; changes run artifacts only except bounded corrections in Slice 1–2 files. Scope expansion requires rescope.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Aspire inspector's path report is shallow | Report only what upstream guarantees; warn when no marker, do not invent graph parsing. |
| Plugin stub looks healthy | Give it stable `warn` status and an explicit S7 injection fix. |
| Filesystem heuristics drift from scaffold | Derive marker paths from current generated sources and cover them with fixtures. |
| One family throws and aborts doctor | Convert family exceptions into bounded fail checks named for that family. |
| Sibling overlap in `cli.ts`/contracts | Minimal additive composition and schema edits only. |
| Public declarations create slow types/doc gaps | Explicit annotations/JSDoc, full-export doc lint, publish dry-run. |

## Gates and Debt

Required evidence: scoped check/lint/fmt wrappers; all MCP tests; `deno task arch:check`; full-export doc lint; package publish dry-run; consumer import/server smoke. Report applicable universal and F-CLI gates with manual evidence where scripts are unavailable. F-13 is N/A; runtime/Aspire validation is fixture/upstream-inspector based because no live app is required. Existing `MCP-A6-V2-SHAPE` remains accepted; record any new/deepened violation before completion.

Anti-pattern focus: AP-2 speculative seams (ports must map real S7 injection/test seams), AP-8 container growth, AP-11/AP-25 effects outside infrastructure, AP-19 permissions, AP-22 barrels, AP-23 inline adapter wiring, and CLI dependency inversion.
