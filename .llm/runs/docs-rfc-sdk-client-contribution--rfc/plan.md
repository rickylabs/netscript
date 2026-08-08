# Plan: typed SDK client contribution RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-rfc-sdk-client-contribution--rfc` |
| Branch | `docs/rfc-sdk-client-contribution` |
| Phase | `research` |
| Target | `rfcs/0000-sdk-client-contributions.md` plus harness evidence |
| Archetype | `2 Integration`; `4 Public DSL / Builder`; `5 Plugin`; `6 CLI / Tooling` (described implementation surfaces) |
| Scope overlays | `SCOPE-docs` |

## Archetype

This is a docs-only RFC run whose proposed implementation crosses existing packages with different
assigned archetypes. The RFC must therefore carry the union of their design constraints and future
gates without pretending the RFC PR itself is a framework-source wave.

## Current Doctrine Verdict

- `@netscript/sdk` and `@netscript/contracts`: **Keep**.
- `@netscript/service`: **Refactor** (open role-clarification debt; the RFC must not deepen it).
- `@netscript/plugin`: historical **Restructure** is closed except the open builder-size debt.
- `@netscript/telemetry`: historical **Refactor** is closed, with separate compatibility debt still
  open for domain-specific instrumentation.
- First-party plugins remain thin delivery shells under doctrine 11.

## Goal

Produce the lightweight, decision-complete NetScript RFC for a minimal typed SDK client
contribution axis, grounded in the current repository and upstream oRPC rather than the carried-in
proposal.

## Scope

- Re-baseline source, type, export, test, docs, issue/PR, and upstream claims.
- Lock the public/type-level contract, composition law, failure model, security/redaction boundary,
  plugin discovery relationship, generated ergonomics, compatibility, migration, and gates.
- Prove generality with auth plus a non-auth consumer using focused scratch type probes where useful.
- Produce the draft RFC and complete run artifacts; no framework-source implementation.

## Non-Scope

- No package/plugin/CLI implementation, RFC numbering, merge, issue creation/closure, milestone
  mutation, evaluator launch, or release gate.

## Hidden Scope

- Full JSR/export consequences of proposed type parameters and subpaths.
- Board reconciliation against already-filed issues `#1348`–`#1353` without mutating them.
- Explicit upstream oRPC version/surface citations and inference-budget constraints.

## Locked Decisions

Decisions are not locked at bootstrap. They will be derived in research and recorded before the
external Plan & Design review handoff.

## Open-Decision Sweep

All design forks named by the brief are `must resolve now` unless the final RFC proves they are safe
for FCP without forcing implementation rework.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Carried-in design invents a parallel abstraction or leaks upstream internals. | Start from current public types and `deno doc`; minimize to named extension axes under A11. |
| Tuple/context inference becomes slow, unstable, or inscrutable. | Focused type probes; explicit inference budget and `isolatedDeclarations`/JSR gate plan. |
| Auth special-casing masquerades as generality. | Require a structurally different second consumer and negative/removal proof. |
| Security metadata or credentials leak into logs, errors, or browser bundles. | Specify taint/redaction ownership, server-only boundaries, and conformance tests. |
| RFC over-claims board ownership. | Reconcile live issue/PR scope and retain references without closing keywords or mutations. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-9 premature abstraction | risk | Name the exact extension axes and reject fields without two proven consumers or upstream necessity. |
| AP-11 hidden globals | risk | Require per-call context/resolvers; prohibit module-scope credential reads and mutable registries. |
| AP-14 upstream re-export | risk | Use NetScript-owned public contracts; do not re-export oRPC as NetScript API. |
| AP-24 closed switch / host hardcoding | existing risk | Keep discovery and contribution registration open-on-package, deterministic, and conflict-checked. |
| AP-25 side effects outside edges | risk | Place transport and secret resolution at explicit adapter/request boundaries. |

## Fitness Gates

The exact docs/RFC gate set will be locked after source/export research. Framework implementation
issues will inherit the applicable F-1–F-19, JSR, consumer, plugin-parity, CLI/scaffold, and runtime
gates for Archetypes 2/4/5/6; this docs PR will run source-alignment, link/path, terminology,
Markdown formatting, and relevant docs build/link gates.

## Arch-Debt Implications

No debt entry is expected for a docs-only RFC. Existing service/plugin/telemetry/auth debt will be
cited where it constrains implementation; any newly discovered divergence will be recorded before
handoff rather than silently added to product scope.

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Source/API alignment | `deno doc` plus focused code/tests/exports inspection | Every prescriptive claim grounded |
| 2 | Type ergonomics | Non-product `.llm/tmp/` Deno type probes | Intended inference and rejection cases compile/fail as specified |
| 3 | RFC/docs integrity | repo-native docs/link/format checks selected from current tasks | Exit 0 or scoped N/A with evidence |
| 4 | JSR consequences | full export-map doc/audit inspection for affected packages | Risks and required implementation gates explicit |
| 5 | GitHub reconciliation | live issue/PR reads | No stale scope/state claims; no mutation beyond the draft PR |

## Dependencies

- Tracking issue `#1348`, implementation issues `#1349`–`#1353`, source roadmap PR `#1347`, and
  live dependencies identified by those artifacts.
- Current pinned oRPC public surface and primary upstream documentation/source.

## Drift Watch

- Any mismatch between proposal citations and `origin/main`.
- Any filed issue whose actual scope differs from the proposal's T1 mapping.
- Any upstream oRPC surface that makes a proposed wrapper redundant or unsound.

