# Plan: converge init and activate `generate resource`

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-resource-slice-activate--1354-f` |
| Branch | `feat/cli-resource-slice-activate` |
| Phase | `implement` |
| Target | `packages/cli` scaffold and public command tree |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | frontend consumer output; hosted/runtime acceptance explicitly excluded |

## Archetype and Doctrine Verdict

Archetype 6 applies because the slice changes a public command group and scaffold output. The current doctrine verdict is **Keep**: preserve the kernel/application/adapters/assets split and the vertical public feature. Generated carriers are mechanically regenerated and ceiling-exempt.

## Goal

Implement exactly locked Slice F: init emits the planner's `--form --partial` preset, Fresh derives generated routes after all route emission, the complete old canonical/dependent asset family is retired, init/command canonical roles are byte-identical, and `generate resource` becomes the fourth command.

## Scope

- The amended 33-file enumerated Slice F touch set, with generated carriers mechanically refreshed.
- Production composition for Slice E using Slice A's selector and existing adapters.
- Run artifacts required by the harness.

## Non-Scope

- `service-query.ts.template` and all #1664/#1355 cache-key/invalidation behavior.
- Slice G docs and hosted acceptance.
- Aspire, Docker, browser, and `e2e:cli`.
- Any second canonical template, new extension point, resource deletion, concurrency, or crash atomicity.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1/D2 | Register `generate resource`; reuse the exact app/client/procedure selection seams. | One public selection policy; multi-client ambiguity remains fail-closed. |
| D3 | Preflight all rendered/shared/Fresh-derived candidates before application writes. | No silent overwrite and zero writes on pre-apply failure. |
| D4/F | `planResourceSlice` plus neutral templates are the sole canonical authority; init is fixed `form + partial`. | Required byte equivalence and no duplicate authority. |
| D5/F | Invoke the Fresh adapter only after every route and sidecar exists; remove manual seeds. | Generated manifest/routes reflect actual emitted Form-B routes. |
| D8 | IO stays in adapters/presentation; application planning remains pure. | Archetype-6 layering. |
| F activation | Register the command only after init convergence is implemented and proven. | Prevents an exposed command beside divergent init output. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Retire-set scope | resolved | Exactly the 18 enumerated template assets and their listed carriers/consumers; item 33 repairs the one additional rendered convention consumer. |
| Init client/procedure binding | resolved | Fixed service example values derived from selected init options and #1664's emitted client contract. |
| Hosted validation | safe to defer | Owned by Slice G; explicitly prohibited here. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A surviving importer is broken by retirement. | Complete pre-delete census and post-delete no-orphan scan; stop on any unenumerated consumer. |
| Init and command render subtly different bytes. | Compare planner output by canonical role in focused writer/app tests. |
| Fresh derivation runs too early. | Integration test instruments write ordering and asserts no manual seed remains. |
| Composition duplicates Slice A selection behavior. | Bind production dependencies directly to the shared selector. |
| Generated carrier/corpus churn obscures source changes. | Regenerate mechanically and review source touch set separately; carriers are ceiling-exempt. |
| Lock churn. | Record initial blob and reject any final `deno.lock` delta. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1/AP-18 | risk | Keep writer delegation focused; use semantic role equivalence, not giant snapshots. |
| AP-11/AP-25 | risk | Fresh/filesystem IO stays in adapters and composition dependencies. |
| AP-21/AP-23 | risk | Add only the fourth declarative command registration; no inline command body. |

## Validation Plan

Run focused touched tests, the full CLI package-owned unit suite, assets/publish/emitted/corpus gates, structured CLI check/lint/fmt, CLI JSR audit and publish dry-run, `arch:check`, `quality:gate`, README/JSDoc docs gates, plus raw diff/status and lock verification. No runtime/browser/E2E gate is authorized in Slice F.

## Arch-Debt Implications

- None expected. Existing unrelated CLI debt is not deepened.

## Drift Watch

- Additional retire-set consumers, changes to `service-query.ts.template`, more than 33 product paths (generated carriers exempt), or any `deno.lock` movement are stop conditions.
