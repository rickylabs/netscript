# Plan: Aspire 13.5 listener-readiness health checks

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-aspire-13-5-s6-health-checks--impl` |
| Branch | `feat/aspire-13-5-s6-health-checks` |
| Phase | `plan` |
| Target | `packages/cli` generated Aspire AppHost + CLI E2E harness |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Archetype

Archetype 6 applies because `@netscript/cli` owns scaffold generation and the generated-project E2E
surface. The change stays inside the established template adapter/generator boundary and adds no
command or public library surface.

## Current Doctrine Verdict

`packages/cli`: **Keep** — preserve the Archetype-6 kernel/surface split. Existing debt
`scaffold-runtime-a8-f16-1333` requires the E2E gate registry split before another runtime probe.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A6/A7 | The helper is justified by the readiness policy and focused socket seam; use `node:net` with no new dependency. |
| A8 | Extract runtime/behavior gate declarations and group readiness probes instead of growing the 812-line registry/48-child folder. |
| A11 | The extension axis is the backing-service probe kind; generator dispatch stays finite and explicit. |
| A14 | Helper, semantic generator, credential-grep, structured static, doctrine, and scaffold gates preserve the contract. |

## Goal

Generated Aspire 13.5 AppHosts attach listener-level health checks to Postgres, MySQL, SQL Server,
Redis, and Garnet resources using live endpoint allocation, with deterministic helper tests and
CI-run failure/recovery acceptance code.

## Scope

- Add one-socket TCP and RESP checks to `_aspire-compat.ts.template` with focused generated-template
  tests.
- Emit `addHealthCheck` registrations and `withHealthCheck` attachments for supported backing
  service kinds without reading credential parameters.
- Regenerate the infrastructure template snapshot and embedded asset barrel.
- Make backing-service wait gates assert the named `healthReports` entry is Healthy.
- Register the stop → Unhealthy/exit-18 → start → Healthy Phase-B fixture without running it locally.
- Draft the S6b issue and #1366/#863 comments in the run directory.

## Non-Scope

- Credential/authentication probes or protocol client dependencies.
- Deno KV, SQLite, local, external, or `none` health behavior.
- `packages/aspire` public-surface changes or JSR audit.
- AppHost start, resource mutation, Aspire CLI changes, docs/skills, S5 commit edits, or release pins.

## Hidden Scope

- Preserve the generated asset registry/barrel invariant.
- Split the over-cap E2E runtime registry before adding the new probe, per existing debt.
- Keep the fixture resilient: recovery start runs even when an assertion fails.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| D1 | TCP checks use exactly one `node:net` socket, `setTimeout(2000)`, no retries, and destroy on every terminal event. | #1718 locked cancellation contract. |
| D2 | RESP writes inline `PING\r\n`; only `+PONG` is Healthy and `-NOAUTH` is Degraded. | Listener readiness without credential material. |
| D3 | Generator callbacks obtain the endpoint and resolve `.host()` / `.port()` on every invocation. | Amended after cycle-1 drift: 13.5.3 `property(...)` returns expression handles; live-value intent is unchanged. |
| D4 | Check keys are `<resource>_listener` for DB servers and `<resource>_resp` for Redis-compatible resources. | Stable describe/receipt contract. |
| D5 | Runtime I/O lives only in emitted helper/E2E probes; the generator remains pure. | A7/A11 boundary. |
| D6 | Deno KV remains unchanged despite carried-in drift. | Owner's explicit Phase-A boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Credential-level readiness | safe to defer | S6b / 0.0.8; service `/health` remains credential truth. |
| Deno KV HTTP health mismatch | safe to defer | Explicit non-scope; supervisor must decide follow-up ownership. |
| Phase-B live receipts | safe to defer | Fixture code lands now; lease-backed execution remains supervisor-owned. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Socket double-settlement/leak | One guarded completion path always destroys the socket; tests cover connect/error/timeout/data. |
| Credentials leak into callback | Generator tests reject password/user identifiers inside every health-check block and helper result data. |
| Endpoint allocation goes stale | Resolve host/port inside callback, not during generation or AppHost graph creation. |
| E2E fixture strands a stopped resource | `finally` recovery starts the resource and verifies Healthy. |
| Existing E2E debt deepened | Extract behavior/runtime script modules and group readiness probes before registration. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-1/AP-18 | existing/risk | Split runtime registry; keep generator tests semantic, not a single giant snapshot. |
| AP-11/AP-25 | risk | I/O only at emitted/E2E runtime edges; generator stays pure. |
| AP-19 | N/A | No new CLI permission surface; E2E commands declare exact permissions. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| F-1/F-3/F-5/F-10/F-11/F-12/F-16/F-18 | yes | `arch:check`, scoped wrappers, structural review |
| F-2 | yes | Node platform primitive only; no dependency/helper reinvention |
| F-6/F-7/F-8/F-9/F-15 | N/A for public-surface change | No export/package/permission/re-export change |
| F-CLI-1…31 | reviewed | `arch:check` + manual confirmation of unchanged CLI command/composition surface |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `scaffold-runtime-a8-f16-1333` | update | S6 performs the stop-condition split and must not increase direct-child count. |
| New debt | none expected | Any unavoidable remaining over-cap baseline stays attributed to the existing entry. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Helper RED→green | structured test wrapper on helper test | exact Healthy/Unhealthy/Degraded mapping |
| 2 | Generator | structured test wrapper on generator tests | exact per-kind emission + credential grep |
| 3 | Assets | `gen:assets-barrel`, `check:assets-barrel` | generated files current |
| 4 | E2E registry | targeted E2E tests / `scaffold.plugins` | registry code compiles; no AppHost start |
| 5 | Static | configured lint + scoped check/lint/fmt/test wrappers | PASS |
| 6 | Doctrine | `quality:scan`, `arch:check` | PASS |

## Dependencies

- Stacked base S5 `0bd8ba832`; draft PR base remains `fix/aspire-13-5-s5-literal-ports`.
- Aspire 13.5 `addHealthCheck`/`withHealthCheck` and endpoint `host()` / `port()` value APIs.
- Phase-B live execution requires the supervisor's runtime lease.

## Drift Watch

- SDK endpoint `host()` / `port()` runtime behavior against later 13.5 patch modules.
- A resource whose `withHealthCheck` attachment is not represented in `healthReports`.
- E2E split that increases the scaffold folder's direct-child count.
