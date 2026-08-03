# Plan: OMB S5 ServiceEndpointDirectoryPort + adapters

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-endpoint-directory--s5` |
| Branch | `feat/openapi-mcp-endpoint-directory` |
| Phase | `plan` (locked; PLAN-EVAL composed waiver recorded) |
| Target | `packages/mcp` |
| Archetype | `2 — Integration` for this port/adapter slice |
| Scope overlays | none |

## Archetype

Archetype 2 is binding for this slice: MCP consumes filesystem, process, and network facts through a
small package-owned directory port, four named source adapters, and a bounded probe adapter. The
package as a whole retains its accepted horizontal/A6 debt; this PR neither deepens nor closes it.

## Current Doctrine Verdict

`@netscript/mcp` is absent from doctrine 10's historical table. Open debt
`MCP-A6-V2-SHAPE` classifies its existing horizontal protocol-engine layout as an accepted deviation.
This slice uses the existing role folders and applies the full Archetype-2 gate column.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | The public discriminated contracts precede implementation; degraded states cannot be hidden. |
| A5/A10 | The directory composes injected sources/probe; no container or inheritance. |
| A6/A7 | Filesystem/process/network wrappers exist only as tested adapters; Web Platform APIs are used directly. |
| A8/A9 | Files follow existing domain/application/infrastructure roles and the A2 slice profile. |
| A11 | `EndpointSource` is the named finite extension axis. |
| A14 | The fixture matrix, negative cases, JSR gates, and consumer checks preserve the contract. |

## Goal

Publish a deterministic `ServiceEndpointDirectoryPort` for S6 with four honest endpoint sources,
qualified F1(b) precedence, identity-bound probing, complete degraded-status mapping, per-row
timeouts, and fixtures proving every source outcome and status row.

## Scope

- Public constants/types for endpoint sources, source outcomes/failure codes, candidates,
  conflicts, statuses, directory rows, probe outcomes, and the directory/source/probe ports.
- `aspire-cli`, run-manifest, appsettings, and override source adapters.
- Composed directory/factory with `override > aspire-cli > run-manifest > appsettings` precedence.
- Bounded, redirect-free, credential-free spec fetch; service self-identification; concurrency cap;
  exclusions before fetch.
- Exact P3 401/403 guidance and explicit CLI absent/non-zero/parse failure rows.
- Public exports, README permission/config notes, focused fixtures/tests, full A2/JSR evidence.

## Non-Scope

- S4 OpenAPI projection types/logic and S6 MCP tool contracts/registry wiring.
- S7 manifest production or a new mechanism for transporting the current run id.
- Endpoint execution/policy, credentials, authenticated spec fetches, file watching, cross-machine
  discovery, or scaffold changes.
- Repo-wide package restructuring, tool-count docs, release publication, or CLI E2E.

## Hidden Scope

- `appsettings` must preserve configured services without ports as `not_running` candidates.
- `localhost` from Aspire/P1 must normalize to numeric loopback before fetch.
- A manifest present without a verifiable expected current `runId` is failed, not absent/used.
- Unknown `.netscript/agent-mcp.json` top-level fields must not break future S13 policy composition;
  only the S5 `introspection` subsection is decoded here.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Export one application-facing `ServiceEndpointDirectoryPort`, plus narrow source and probe ports required by the tested IO seams. | Package owns consumed behavior; every IO class stays substitutable. |
| D2 | Model `SourceOutcome` and directory rows as discriminated unions with explicit failure codes. | Prevents impossible `failed` rows without reasons and makes CLI failures machine-visible. |
| D3 | Effective precedence is `override > aspire-cli > run-manifest > appsettings`. | Human override remains supreme; P1 selects CLI as current primary live source; fallbacks remain additive. |
| D4 | Manifest use requires real-path project-root equality and a supplied expected current `runId`; otherwise fail visibly. | S5 has no honest independent way to claim token currency; S7 can supply it later. |
| D5 | Override carrier is `.netscript/agent-mcp.json` with `introspection.serviceEndpoints` and `introspection.excludeServices`. | Ratified carrier and named S-25 seam; leaves deferred endpointExecution fields untouched. |
| D6 | Probe spec first, then `/` identity; only both successes produce `running`. | Auth failures get P3 wording; reused ports with valid specs still fail identity. |
| D7 | No-listener transport failures map `not_running`; listener timeout/HTTP/redirect/parse map `spec_unavailable`; self-id mismatch/unavailable maps `identity_mismatch`; exclusion maps `excluded` without fetch. | One S-12 mapping across consumers. |
| D8 | Use a small bounded worker loop with injected probe and `AbortSignal`; one rejected/timeout probe is converted to one row. | Per-service isolation without a dependency or hidden global. |
| D9 | Keep parsed spec JSON opaque to S5 and export no projection dependency. | S4 and S5 remain parallel surfaces consumed by S6. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact public names and union fields | resolved now | Named in the Design checkpoint; implementation may refine spelling only without semantic drift. |
| Run-id producer/wiring | safe to defer | S7-owned; S5 exposes the required composition input and failure. |
| Projection/operation counts | safe to defer | S4/S6-owned; no import or duplicate logic here. |
| External endpoint-provider registry | safe to defer | No external provider exists; finite first-party source list is closed. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Aspire JSON shape drift/banner noise | Parse only top-level `resources[]`, accept `displayName`/DCP `name`, extract JSON after banner, and fixture the live 13.4.6 shape. |
| Stale/copied manifest trusted | Real-path match + expected run-id match + service self-identification. |
| Hanging endpoint hangs the tool | Per-row `AbortController`, timeout, concurrency cap, all-settled conversion to rows. |
| Foreign/non-loopback traffic | Numeric loopback required for discovered sources; only explicit override is operator-trusted. |
| Torn config masks fallback | Every adapter returns failed outcome while composition continues with lower sources. |
| Public slow types/docs regress | Explicit annotations/JSDoc plus full-export doc lint and dry-run. |
| New code deepens A6 debt | Stay in existing role folders; no speculative kernel/CLI restructuring. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep source adapters one per file and tests split if fixture matrix grows. |
| AP-2/AP-9 | risk | Use direct Deno/Web APIs; sibling adapters remain explicit. |
| AP-3 | risk | Ports have one operation each. |
| AP-8 | avoided | Plain factory/composition, no container. |
| AP-11/AP-25 | risk | All filesystem/process/network effects live in adapters and receive config/injection. |
| AP-13/AP-19 | risk | No console output; README declares read/run/net permissions. |
| AP-22/AP-23/AP-24 | risk | No sub-barrels, inline wiring bodies, or source switch; precedence is data. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1–F-5 | yes | `quality:gate`, manual public-surface review, scoped wrappers |
| F-6/F-7 | yes | package dry-run, full-export doc lint, JSR audit |
| F-8/F-9 | yes | `arch:check`; README permission block review |
| F-10–F-12 | yes | fixture/test shape, `arch:check`, lint |
| F-14–F-18 | yes | `quality:gate`/`arch:check`, changed-file review |
| F-19 | yes | scoped check/lint/fmt wrappers for `packages/mcp` |
| Runtime/Aspire | touched | injected command fixture matrix plus optional live CLI-help/shape evidence; no AppHost required |
| Consumer import | yes | both `mod.ts` and `cli.ts` full export surfaces check/doc-lint |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `MCP-A6-V2-SHAPE` | none | Preserve existing horizontal layout; this A2 slice does not close package-wide debt. |
| New debt | none expected | Any new/deepened violation is a merge blocker, not an automatic debt entry. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 0 | PLAN-EVAL | milestone-run composition | **composed per milestone-run.md (orchestrator waiver)** |
| 1 | Focused behavior | `deno test --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/service-endpoint-*_test.ts` | all source/status/timeout fixtures pass |
| 2 | Scoped check | `.llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | exit 0 |
| 3 | Scoped lint | `.llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx` | exit 0, no new ignores |
| 4 | Scoped format | `.llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` | exit 0 |
| 5 | Package tests | `deno task --cwd packages/mcp test` | exit 0 |
| 6 | Code/doctrine | `deno task quality:gate` | exit 0, no allowances/casts |
| 7 | Docs | `deno task doc:lint --root packages/mcp --pretty` | both exports, zero diagnostics |
| 8 | JSR fitness | `audit-jsr-package.ts --root packages/mcp --text` | pass |
| 9 | Publish | package `deno publish --dry-run --allow-dirty` | clean file list, no slow types |
| 10 | Hygiene | raw git diff/status against `origin/main` | no `deno.lock`, lint-ignore, or unrelated churn |

## Dependencies

- Wave-0 P1 and P3 verdict artifacts (present).
- Aspire CLI 13.4.6 machine-readable `describe` surface.
- S4 is deliberately not a dependency; S6 consumes S4 + S5.

## Drift Watch

- Aspire resource JSON field changes, manifest proof shape divergence, a need for S4 types, inability
  to verify current run identity, or any requested scaffold/CLI tool wiring must be logged before
  expanding scope.
