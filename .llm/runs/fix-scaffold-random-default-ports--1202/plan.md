# Plan: randomized high-range scaffold listener defaults

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-scaffold-random-default-ports--1202` |
| Branch | `fix/scaffold-random-default-ports` |
| Phase | `plan` |
| Target | `packages/cli` scaffold planning, emitted config/source, and runtime E2E command |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | service (generated services and Aspire runtime proof) |

## Archetype and Doctrine Verdict

Archetype 6 applies because `@netscript/cli` owns scaffold and generated-runtime command flows. The
current doctrine verdict is the historical **Restructure** classification, with the bounded A6
promotion already completed. This slice stays within existing scaffold/service/plugin feature
boundaries and introduces no new public command, export, dependency, layer, or debt.

## Goal

No generated application or service uses a fixed low/common listener by default. Aspire-managed
resources publish dynamic endpoints, standalone fallbacks are stable per project in the high range,
and generated-output tests reject any default listener below 49152.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | App/service Aspire host endpoints omit `HostPort` and legacy `Port`; plugin APIs receive their deterministic high-range port because current plugin runtime consumers still address those endpoints directly. Explicit user pins remain supported. | Uses discovery where the consuming path already supports it, while moving every remaining generated pin out of the Windows-conflicted low/common ranges. |
| D2 | Standalone fallbacks use a deterministic project/resource hash over the inclusive range 49152–65535, with wraparound linear probing for occupied emitted ports. | Meets randomized high-range intent while keeping one scaffold stable across restarts and additions collision-free. |
| D3 | One pure allocator owns init service/app, service-add, and plugin default selection. | Prevents another set of sibling hardcoded ranges and gives the RED/GREEN test one contract. |
| D4 | Protocol-owned database/cache/OTLP target ports are excluded. | They are internal protocol contracts, not generated host listener defaults, and randomizing them would break upstream integrations. |
| D5 | Remove the runtime suite's explicit 3001 override so `scaffold.runtime` tests the real default path. | The fixed test argument is the reproduced collision trigger. |
| D6 | PLAN-EVAL is `composed per milestone-run.md (orchestrator waiver)`. | Explicit owner direction for this per-PR milestone slice. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| High-range floor | resolved now | 49152 is the enforced floor. |
| Seed identity | resolved now | Project name plus resource category/name; absolute machine paths do not affect output. |
| Explicit low user override | resolved now | Preserved as an intentional user pin; the no-low-port gate applies to defaults. |
| Windows service identity | safe to defer / owner-owned | Evidence is recorded on the issue by the owner tonight. |
| Three consecutive local runtime passes from the old comment | superseded by owner brief | Run one clean local one-pass; cloud CI remains verdict source. |

## Scope

- Add the pure deterministic allocation contract and RED-first tests.
- Route init app/service, `service add`, legacy plugin scaffolding, and plugin-owned installation
  defaults through it.
- Omit pinned host fields for automatic allocations; preserve explicit pins.
- Remove fixed 3001 from the canonical runtime E2E scaffold command.
- Add semantic generated-output coverage for all listener-bearing defaults below the floor.
- Run scoped wrappers, quality/architecture, JSR static gates, and one serialized runtime one-pass.

## Deferred Scope

- Identifying or changing the Windows service.
- Randomizing upstream protocol/container target ports.
- Redesigning endpoint-directory contracts or public CLI option names.
- Chasing a residual local runtime red that is unrelated to fixed generated listener defaults.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Hash collisions between resources | Probe the complete configured-port set with deterministic wraparound. |
| Explicit override semantics regress | Tests distinguish automatic allocation from user-pinned host ports. |
| Regex test mistakes protocol ports for listeners | Parse known listener-bearing fields and command arguments semantically. |
| Plugin paths drift | Cover both legacy `PluginScaffolder` and plugin-owned install result/config emission. |
| Expensive gate contention | Check slot/resource health and queue; never overlap another `scaffold.runtime`. |
| Local Windows/WSL residue misclassified | Record local evidence, but treat cloud CI as the owner-declared verdict. |
| Lock churn | Exclude inherited `deno.lock` from commits and compare it with the branch base after gates. |

## Anti-Patterns and Fitness Gates

| Concern | Treatment |
| --- | --- |
| AP-9 premature abstraction | The shared computation is already repeated across three allocator paths and has one named axis: scaffold listener defaults. |
| AP-18 giant snapshots | Tests inspect semantic listener fields/argv positions, not whole generated strings. |
| AP-25 side effects | Hash/allocation logic is pure; filesystem reads stay in existing adapters. |
| Static | Scoped check/lint/fmt wrappers over owned CLI paths. |
| Framework quality | `deno task quality:gate`; no new ignores, casts, or debt. |
| JSR | CLI doc-lint and publish dry-run; no public-surface delta expected. |
| Runtime/consumer | Focused generated-output tests and one serialized `scaffold.runtime` one-pass; cloud CI is final verdict. |

## Drift Watch

- A required public API/export change, dependency change, plugin package source change, or endpoint
  directory redesign is significant drift and requires re-scope before proceeding.
