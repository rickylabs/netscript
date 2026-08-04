# Plan: production-harden the Aspire CLI endpoint source

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-manifest-cli--1133` |
| Branch | `feat/openapi-mcp-manifest-cli` |
| Phase | `plan` |
| Target | `packages/mcp` Aspire CLI endpoint adapter + scaffold runtime evidence |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Archetype

Archetype 2 governs: a small consumed port already has four source adapters; this slice hardens the
external Aspire CLI adapter and its failure boundary without adding runtime lifecycle ownership.

## Current Doctrine Verdict

Keep effects at the adapter edge, preserve the port-owned finite vocabulary, and keep application
composition dependent on the port rather than CLI details. No new debt is planned.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Failure and identity vocabulary remains explicit in the published port contract. |
| A7 | Use `Deno.Command`, URL/path primitives, and injected seams; no process wrapper dependency. |
| A11 | Extend the named `EndpointSource` axis rather than fork discovery. |
| A13 | CLI spawn, parse, restart races, and foreign identity are explicit crash boundaries. |
| A14 | Fixtures and runtime evidence prove negative cases fire. |

## Goal

Make `aspire-cli` a trustworthy primary live endpoint source: tolerate benign output drift while
explicitly failing CLI absence, non-zero exit, torn output, foreign project resources, and AppHost
restart races. Prove live scaffold ports resolve through the directory (or S6 tool if landed).

## Scope

- Query `aspire ps` around `aspire describe` and bind the result to exact AppHost path/process run.
- Real-path bind AppHost and executable resource working directories to `projectRoot`.
- Parse documented field aliases and banner-prefixed balanced JSON without accepting torn payloads.
- Add deterministic adapter fixtures for drift and every failure/identity state.
- Update package docs and generated publish assets if the public behavior description changes.
- Queue one `scaffold.runtime` run behind the current baseline owner.

## Non-Scope

- No endpoint manifest template emission (F1(b)).
- No S6 read-tool implementation or registry wiring.
- No changes to source precedence, probing, OpenAPI projection, or service templates.
- No AppHost cleanup belonging to the baseline verification.

## Hidden Scope

- Preserve cancellation across all CLI invocations.
- Bound failure reasons so CLI output cannot become an unbounded MCP row.
- Regenerate package publish assets if README content changes.
- Re-check S6 and expensive-gate ownership immediately before runtime validation.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Treat exact real `appHostPath` + stable `appHostPid` as the CLI adapter run binding. | These are the run identity facts exposed by `aspire ps`; the manifest UUID is not observable through CLI. |
| D2 | Read `ps`, then `describe`, then `ps`; mismatch is `run_id_mismatch`. | Prevents stale/torn describe output from reading as current after restart. |
| D3 | Require candidate executable `workDir` to resolve inside real `projectRoot`; foreign candidates fail the whole source. | Partial trust would let a foreign endpoint appear live. |
| D4 | Accept casing aliases and balanced banner/trailer JSON, but reject incomplete JSON and missing required structures. | Tolerates version/format drift without converting corruption into health. |
| D5 | Reuse existing explicit source failure rows; add only the finite codes needed for CLI identity ambiguity. | Keeps P3-style visible degraded data at the source boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| E2E call path | safe to defer until gate | Use `list_api_services` only if S6 merges; otherwise fixture `directory.list()`. |
| AppHost slot timing | safe to defer until gate | Serialized behind baseline; no local start while `aspire ps` is non-empty for that owner. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| `ps` format varies | Parse array or common envelope aliases; fixture both. |
| PID changes between calls | Pre/post identity equality gate. |
| Some non-executable URL resource lacks workDir | Only accept endpoint candidates with a trustworthy project-root binding; surface failure instead of guessing. |
| S6 lands during work | Rebase before runtime gate and switch evidence to the public tool path. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2 | risk | Keep parsing/domain value-add in adapter; do not wrap `Deno.Command` generically. |
| AP-9 | risk | Add focused parsing functions only where real CLI variants require them. |
| AP-19 | existing documented | Preserve README `--allow-run` declaration. |
| AP-25 | compliant | Process effect remains inside infrastructure adapter. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-3 layering | yes | `deno task arch:check` |
| F-5 public surface/docs | yes | `deno doc --lint` full package exports |
| F-6 publishability | yes | package `deno publish --dry-run` |
| Archetype-2 full column | yes | scoped static, unit/integration, contract, fault, consumer, quality gates |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `.llm/harness/debt/arch-debt.md` | none expected | Record only if the real CLI cannot supply the locked identity proof. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | focused tests | `deno test -A packages/mcp/tests/service-endpoint-sources_test.ts packages/mcp/tests/service-endpoint-directory_test.ts` | all pass |
| 2 | scoped static | run-deno check/lint/fmt wrappers over `packages/mcp` | pass |
| 3 | package tests | package test task | pass |
| 4 | doctrine quality | `deno task quality:scan` + `deno task arch:check` | pass |
| 5 | JSR | full export doc lint + package dry-run | pass, zero slow types |
| 6 | consumer runtime | serialized `scaffold.runtime`; S6 tool or directory fixture | live allocated port resolved through `aspire-cli` |

## Dependencies

- S5/#1131 is present on main.
- S6/#1132 is optional for the E2E presentation edge and currently open.
- Baseline verification currently owns the single AppHost slot.

## Drift Watch

- Any need for template emission, a new process, a second port, or non-CLI identity carrier is a rescope.

