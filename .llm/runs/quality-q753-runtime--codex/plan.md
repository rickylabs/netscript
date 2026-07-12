# Plan: #753 deeper elimination across runtime packages and plugins

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `quality-q753-runtime--codex` |
| Branch | `quality/q753-runtime-h` |
| Phase | `plan` |
| Target | Ten package/plugin roots named in #753 |
| Archetype | `2 Integration`, `3 Runtime/Behavior`, `4 Public DSL`, `5 Plugin` |
| Scope overlays | none |

## Archetype

- Archetype 2 governs database, KV, logger, and Prisma adapter boundaries (and the integration
  aspects of queue/cron).
- Archetype 3 governs queue/cron lifecycle boundaries and the saga/trigger runtime paths.
- Archetype 4 governs `packages/plugin`'s public contract builder seam.
- Archetype 5 governs the three first-party plugin connectors. The larger runtime profile is applied
  where a plugin stream/service path owns runtime behavior.

## Current Doctrine Verdict

The current doctrine requires typed published boundaries and recognizes existing unrelated debt in
the touched tree. This slice does not restructure folders or expand capabilities. It closes scanner
escapes only and must not deepen the open plugin builder-size or connector convergence debt.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1/A2 | Boundary types must express the real input/output contracts rather than erase them. |
| A5/A7 | Thin typed adapters wrap upstream APIs and Web timers directly. |
| A9 | Validation follows each touched unit's archetype. |
| A12/A13 | Runtime typing must preserve lifecycle and async failure behavior. |
| A14 | Scanner, scoped wrappers, tests, docs, and publish dry-runs prove the result. |

## Goal

Reach zero scoped scanner findings and reduce the reproducible base allowance count from 12 as far
below the ceiling of 6 as the upstream contracts permit, preferably to zero, without lint ignores,
lock churn, public API breakage, or behavior suppression.

## Scope

- Replace timer and query double casts with correct platform/upstream APIs and return types.
- Introduce narrow structural adapters/type guards where external clients are dynamically shaped.
- Preserve generic async return shapes without unconstrained casts.
- Express oRPC contracts through `AnySchema`/error-map builder types.
- Type or validate generated KV documents before use.
- Derive Zod/durable-stream types from schemas and factory return types.
- Add or adjust focused tests only where behavior/type regression needs proof.
- Maintain the harness worklog and final allowance inventory.

## Non-Scope

- No new features, exports, dependency/version changes, schema migrations, scaffold output, or
  connector convergence work.
- No unrelated architecture debt remediation and no repo-wide formatting.
- No edits to out-of-scope `packages/plugin-streams-core`; its internal scanner debt belongs to its
  owning slice even though this run inspects and consumes its public generic contracts.
- No PR creation, per the owner directive.

## Hidden Scope

- Dynamic import typing and upstream option-name translation may require local structural adapter
  types.
- Public factory annotations must stay compatible with isolated declarations.
- All ten roots need publish/doc/test evidence even if a root ends with no source diff.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Start from exact hard-reset base and do not reuse rejected commits. | Owner directive. |
| D2 | Prefer inferred schema/factory types, `satisfies`, overloads, and guards; do not replace one cast with another scanner-blind assertion. | Proper typing is the acceptance intent. |
| D3 | Plain Prisma SQL strings use the unsafe string API, not a forged tagged-template object. | Matches the actual upstream API contract. |
| D4 | Allowances require a named upstream declaration conflict plus failed typed alternative; zero is the target. | Six is a ceiling, not a target. |
| D5 | Preserve public names and runtime behavior; add only boundary-local types/helpers. | Limits consumer risk. |
| D6 | `deno.lock` must remain byte-identical. | Owner directive and lock hygiene. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Exact internal helper names/shapes | safe to defer | Local and mechanically reviewable. |
| Whether any allowance survives | safe to defer | Determined only after typed attempts and gates; each survivor needs structural proof. |
| Public API or dependency changes | must resolve now — resolved: none | They would force consumer/release rescope and are prohibited. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Typed wrappers accidentally change runtime calls. | Preserve call order/arguments and run focused package tests. |
| Durable-stream generics expose private/slow types. | Use exported upstream/core aliases and verify doc lint + publish dry-run. |
| Dynamic-client guards are too weak. | Check callable members/record fields and test failure/narrowing paths. |
| Broad multi-root validation is expensive. | Implement in three coherent slices; run focused gates per slice and full acceptance once. |
| Existing allowances appear irreducible but are only hand-written type mismatches. | Derive from Zod/core factory types before considering an allowance. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-2/AP-7 | risk | Use platform/upstream types directly and typed options objects. |
| AP-9 | risk | Keep helpers boundary-local; no generic abstraction unrelated to a finding. |
| AP-12 | existing boundary smell | Type timer handles rather than casting them. |
| AP-14 | risk | Import types without re-exporting upstream packages. |
| AP-20 | risk | Preserve unstable KV checking through scoped wrappers. |
| AP-25 | existing adapter effects | Keep effects in existing adapters; do not move them inward. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1–F-5, F-8–F-19 per matrix | yes where applicable | `arch:check`, review, tests, scoped wrappers |
| F-6 | yes | Per-unit `deno publish --dry-run --allow-dirty` |
| F-7 | yes | Per-unit full export-map `deno task doc:lint --root ...` |
| Code-quality acceptance | yes | Exact scanner with `--max-allow 6`: `ok:true`, zero findings |
| Lock hygiene | yes | Raw git diff confirms no `deno.lock` change |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing package/plugin debt | none | This typing slice neither closes nor deepens unrelated entries. |
| Surviving scanner allowance | create only if needed | Must be fully justified in worklog; target none. |

## Commit Slices

| # | Slice | Proving gate | Files |
| - | --- | --- | --- |
| 1 | Type platform timers, queue/Fedify, Kvdex, database queries/tracing, logger, and mysql adapter boundaries. | Exact scanner subset + scoped check/lint/fmt + focused tests. | Finding-bearing files under `packages/{queue,kv,database,cron,logger,prisma-adapter-mysql}` and focused tests. |
| 2 | Type oRPC base contract and saga generated/KV boundaries with schema-derived guards. | Exact scanner subset + package/plugin checks/tests. | `packages/plugin/src/contract-base/**`, `plugins/sagas/services/**`, focused tests. |
| 3 | Eliminate durable-stream schema/factory allowances through inferred generic contracts and close all gates/worklog. | Full acceptance scanner, all scoped gates, docs, publish dry-runs, tests, arch check. | `plugins/{sagas,triggers}/streams/**`, focused tests, run artifacts. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Scanner | Exact owner command with `--max-allow 6` | `ok:true`, 0 findings, allowance count minimized |
| 2 | Static | Scoped wrapper check/lint/fmt for every touched root | exit 0 |
| 3 | Tests | Each touched unit's `deno task test` | exit 0 |
| 4 | Docs | `deno task doc:lint --root <unit>` for all ten units | exit 0 recorded |
| 5 | Publish | `deno publish --dry-run --allow-dirty` from all ten units | Success, no unsanctioned slow types |
| 6 | Fitness | `deno task arch:check` plus scanner | exit 0 |
| 7 | Hygiene | Raw git status/diff and lock comparison | only scoped files; no `deno.lock` churn |
| 8 | Independent review | Separate Claude IMPL-EVAL | PASS before final force-push |

## Dependencies

- Existing pinned Fedify, Kvdex, Prisma, mysql2, oRPC, Zod, and durable-stream declarations only.

## Drift Watch

- Any public API change, required dependency bump, schema migration, allowance that cannot name an
  upstream declaration conflict, or test failure requiring broader behavior changes triggers drift
  logging and possible rescope.
