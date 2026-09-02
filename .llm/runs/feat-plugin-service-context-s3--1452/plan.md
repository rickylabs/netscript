# Plan: #1452 Slice 3 — complete the plugin service host context seam

**PLAN-EVAL: N/A.** The live issue, prior owner ruling, and doctrine fully determine the remaining
contract: caller-owned structural resolvers, no concrete dependency, and a real generated-consumer
boot proof. Appsettings does not introduce a new framework configuration model; it adds the missing
input to the already-published composition seam.

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-plugin-service-context-s3--1452` |
| Branch | `feat/plugin-service-context-s3` |
| Phase | `plan` |
| Target | `packages/plugin` public SDK host context |
| Archetype | `4 — Public DSL / Builder` (package-level doctrine assignment) |
| Scope overlays | none; service boot is a focused consumer gate, not hosted runtime work |

## Archetype

`@netscript/plugin` is assigned Archetype 4 by doctrine file 10 and a package is not split across
archetypes. This slice is a small composition-root extension inside that package; it adds no new
builder, lifecycle owner, adapter, or package dependency.

## Current Doctrine Verdict

**Keep** — preserve manifest, discovery, validation, and host contracts. The old monolithic types
debt and Deno 2.8 slow-type carve-out are closed; the unrelated open builder-size and AST-extractor
debts are neither touched nor deepened.

## Goal

Finish issue #1452 by adding generic appsettings and environment resolver seams to the public host
factory and proving the unchanged generated consumer can boot workers, auth, and sagas services to
ready without Aspire, Docker, browser, or hosted E2E.

## Scope

- Add generic appsettings to `PluginServiceContext` and factory assembly.
- Add a caller override for environment resolution while preserving the current default.
- Extend focused factory tests for one-shot resolution and caller values.
- Add a generated-template consumer integration test that starts and stops workers/auth/sagas.
- Update only package-local public documentation if required by the public surface.

## Non-Scope

- No `packages/plugin/deno.json`, `deno.lock`, CLI template, generated carrier, config/Aspire/KV
  dependency, hosted runtime, Docker, browser, or `e2e:cli` change.
- No plugin-specific appsettings schema in `@netscript/plugin`; consumers narrow `unknown` to their
  own typed config.

## Hidden Scope

- The boot test must consume the current CLI template rather than retype its implementation.
- Listener lifecycles must be stopped in `finally` so focused tests leave no services behind.
- Public-surface movement triggers the carrier cascade after the implementation commit.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | Add optional async `getAppsettings` beside DB/KV resolvers and assemble its result into `PluginServiceContext.appsettings` | File-backed host settings are caller IO; structural injection keeps config/Aspire out of `@netscript/plugin` and follows the existing seam |
| LD-2 | Add optional async `getEnvironment`; default to `Deno.env.toObject()` for compatibility | Provides the missing environment override without breaking the shipped CLI template |
| LD-3 | Keep appsettings typed as `unknown` at the generic host boundary | Each plugin owns its schema; the base package must not invent or depend on a concrete config contract |
| LD-4 | Keep DB/KV lazy; resolve env/appsettings once during context assembly | Services consume env/appsettings synchronously, while DB/KV already expose lazy accessors |
| LD-5 | Leave the CLI scaffold untouched | Acceptance row 4 is already shipped and the owner forbids template edits in that case |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Appsettings schema/merging policy | safe to defer | Plugin-specific consumers validate/narrow the opaque host value |
| Sync resolver overloads | safe to defer | Existing resolver contract is async; one consistent shape is sufficient |
| Scaffolded-project requirement | must resolve now | The real boot test decides; if template consumption cannot prove boot, stop as owner directed |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| New public options create doc-lint or slow-type regressions | Explicit inline types/JSDoc; A/B `deno doc --lint`; dry-run |
| Boot test only asserts object shape | Start each real service, await its returned running handle, inspect address/ready response where exposed, then stop |
| Test mutates process env or leaves listeners | Snapshot/restore named env keys and stop every handle in `finally` |
| Cross-package test hides a package dependency | Test-only imports are outside publish include; manifest SHA and dry-run file list prove no runtime edge |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-7 | risk | Preserve one options object; no positional appsettings/env arguments |
| AP-8 | avoided | Extend the plain factory; no container |
| AP-11 | existing compatibility default | Add explicit environment injection; keep default solely for shipped consumer compatibility |
| AP-14 | avoided | No config/KV/Aspire re-export or concrete dependency |
| AP-23 | avoided | Keep composition in the named public factory |
| AP-25 | avoided | No module-load side effect; all resolution occurs inside the factory/test lifecycle |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-19 (Archetype 4 applicable set) | yes | `quality:gate`, `arch:check`, scoped wrappers, JSR audit, and manual surface/dependency review |
| F-5/F-6/F-7 | yes | `deno doc`/A-B doc lint, dry-run, docs fence/example baselines |
| F-10 | yes | focused exact test counts including three real boot cases |
| Consumer import validation | yes | generated-template workers/auth/sagas boot test plus post-commit carrier cascade |
| Runtime/Aspire | no | Explicit owner prohibition; construct-and-ready consumer test is not hosted runtime |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| `packages/plugin` builder size / AST extractor debts | none | Unrelated files and concerns |
| New debt | none expected | Any new/deepened violation is a stop/fix, not silently accepted |

## Validation Plan

1. Scoped check/lint/fmt wrappers over `packages/plugin`.
2. Focused `packages/plugin` tests with exact pass/fail/ignore counts.
3. `deno doc --lint` A/B against `origin/main`; report only new diagnostics.
4. `deno publish --dry-run --allow-dirty` from `packages/plugin`; inspect stderr listing.
5. `docs:readme-fences` and `docs:jsdoc-examples`; do not exceed baselines 7 and 116.
6. Commit the public surface, then run every applicable `check:*` carrier cascade task.
7. `deno task quality:gate` and explicit `deno task arch:check`.
8. Verify `packages/plugin/deno.json` and `deno.lock` SHA-256 unchanged.
9. Separate-session IMPL-EVAL, then push and open the non-draft PR with all required metadata in the
   same action.

## Drift Watch

- Generated template proves insufficient to construct and reach ready.
- Any CLI/template or manifest/lock change becomes necessary.
- Any appsettings design requires concrete config merging or package dependencies.
