# Architecture Debt Registry

Seeded from `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` on 2026-04-29. Entries
track packages with `Refactor`, `Restructure`, or `Rewrite` doctrine verdicts. `Keep` and `Defer`
verdicts are not seeded here.

## packages/runtime-config — doctrine verdict Refactor

- **Reason:** Split single-file `mod.ts`; add subpaths if exports grow.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-05-01 — Phase 11 completed the Archetype 6 v2 layout: public/maintainer
  feature slices, kernel adapters, template assets, binary edges, and executable CLI fitness gates
  now cover the former monoliths.
- **Gate:** F-1, F-5, F-6, F-7
- **Wave 1 closure evidence:** `feat-package-quality-wave1-contracts--contracts` slice 10 split
  `packages/runtime-config/mod.ts` into `src/domain/types.ts`, `src/application/loader.ts`,
  `src/application/watcher.ts`, and `src/diagnostics/summary.ts`; `deno check`, `deno doc --lint`,
  `deno publish --dry-run --allow-dirty`, `deno test --allow-all`, `deno lint`, and
  `deno fmt --check` pass for the package.

## packages/config — AP-1 / doctrine verdict Refactor (schema.ts 945 LOC)

- **Reason:** `schema.ts` is above the doctrine file-size threshold and should split by concept.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-05-01 — public local-source and monorepo behavior moved behind the
  maintainer command graph; `deno task arch:check` enforces public/maintainer isolation.
- **Gate:** F-1, F-5, F-10

## packages/config — AP-16 root helpers.ts

- **Reason:** Root `helpers.ts` held saga authoring input types behind a generic helper name.
- **Owner:** Wave 1 contracts and schemas.
- **Target:** S1 alpha package-quality wave.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave1-contracts--contracts/plan.md`
- **Created:** 2026-06-06
- **Status:** closed 2026-06-06 — slice 11 renamed `helpers.ts` to `src/domain/saga-inputs.ts` and
  kept the public `defineSagas`/input type exports stable through `src/public/mod.ts`.
- **Gate:** F-11, AP-16, `deno check mod.ts`

## packages/config/src/domain/mod.ts — justified domain barrel

- **Reason:** `src/domain/mod.ts` is a sub-barrel, but it intentionally curates the domain schema
  surface consumed by `src/public/mod.ts` and future docs/reference generation.
- **Owner:** Wave 1 contracts and schemas.
- **Target:** Revisit when generated reference tooling can crawl individual schema modules.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave1-contracts--contracts/plan.md`
- **Created:** 2026-06-06
- **Status:** open, DEBT_ACCEPTED — slice 17 added `arch:barrel-ok` justification in the file.
- **Gate:** F-18, `Select-String -Path src/domain/mod.ts -Pattern 'arch:barrel-ok'`

## packages/contracts — AP-16 helpers directory

- **Reason:** Root `helpers/` held query and transform helpers behind a generic folder name.
- **Owner:** Wave 1 contracts and schemas.
- **Target:** S1 alpha package-quality wave.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave1-contracts--contracts/plan.md`
- **Created:** 2026-06-06
- **Status:** closed 2026-06-06 — slices 19 and 20 moved `paginated-query.ts` and `transform.ts`
  into `src/application/` as role-named modules and removed the `helpers/` directory.
- **Gate:** F-11, AP-16, `deno check mod.ts`

## packages/contracts/crud — accepted root subpath layout

- **Reason:** `crud/` remains at the package root to preserve the established `./crud` subpath
  export and avoid broad downstream import churn during S1.
- **Owner:** Wave 1 contracts and schemas.
- **Target:** Revisit when subpath exports can move without consumer breakage.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave1-contracts--contracts/plan.md`
- **Created:** 2026-06-06
- **Status:** open, DEBT_ACCEPTED — locked decision L8 keeps `contracts/crud/` at package root.
- **Gate:** F-5/F-6 remain green for `@netscript/contracts`; consumer validation in slices 25-27.

## packages/contracts — T4 slow-type publish carve-out

- **Reason:** Heavy Zod-derived contract helpers still require `deno publish --allow-slow-types`
  under Deno 2.8 publish analysis. This is accepted score-impacting debt for the toolchain upgrade,
  not a workspace default.
- **Owner:** Toolchain upgrade T4 follow-up.
- **Target:** Narrow public contract helper return types before beta.
- **Linked plan:** `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (LD-5).
- **Created:** 2026-06-15
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** F-6; close when `packages/contracts` dry-run passes without `--allow-slow-types`.

## root toolchain — T5 deferred esbuild audit advisory

- **Reason:** `deno audit` reports GHSA-gv7w-rqvm-qjhr for transitive `esbuild <0.28.1`. The
  runtime-reachable critical `@orpc/client` advisory was remediated by moving ORPC imports to
  `^1.14.6`; this remaining high advisory is deferred as approved toolchain debt because it is tied
  to the Vite/esbuild stack rather than a NetScript runtime dependency path.
- **Owner:** Toolchain upgrade T5 follow-up.
- **Target:** Revisit when the Vite/esbuild dependency chain can move to `esbuild >=0.28.1`.
- **Linked plan:** `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (A-9).
- **Created:** 2026-06-15
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** `deno task audit:critical`; close when full `deno audit` passes without suppressing the
  deferred high-severity advisory.

## packages/cron — AP-17 / doctrine verdict Refactor

- **Reason:** `interfaces/` should become `ports/`; adapter classes should be named by technology.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-06-07 — corrected during Wave 2c after the previous 2026-05-01 closure
  note was found to reference unrelated CLI permission documentation while
  `packages/cron/interfaces/` still existed. Real evidence: `packages/cron/interfaces/` was renamed
  to `packages/cron/ports/`, the public `./types` export was replaced with `./ports`, and
  `tasks.check` now checks `ports/mod.ts`.
- **Gate:** F-3, F-11

## packages/database — AP-17 / doctrine verdict Refactor

- **Reason:** `interfaces/` should become `ports/`; composition root needs confirmation.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11

## packages/queue — AP-16 / doctrine verdict Refactor

- **Reason:** `utils/` needed role-named placement under the doctrine vocabulary; the carried-in
  `internal/` concern is not debt because F-11 and doctrine folder vocabulary explicitly allow
  `internal/`.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-06-07 — Wave 2c slice 1 renamed `packages/queue/utils/` to
  `packages/queue/validation/` and `packages/queue/interfaces/` to `packages/queue/ports/`.
  `packages/queue/internal/` is retained as F-11-allowed. The older doctrine handoff wording that
  said to lift `internal/` conflicts with the F-11 allow-list; the gate is the source of truth for
  this closure.
- **Gate:** F-3, F-11

## packages/kv — AP-1 / doctrine verdict Refactor (bridge_test.ts 1,039 LOC)

- **Reason:** `bridge_test.ts` is a god test file; adapters need audit.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-10, F-3

## packages/telemetry — doctrine verdict Refactor

- **Reason:** Confirm port/adapter split and expose OTEL adapter as a subpath export.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-5, F-6

## packages/triggers — doctrine verdict Restructure

- **Reason:** Flat files should lift into `application/`, `state/`, and `runtime/`.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11, F-13

## packages/plugin-triggers-core — T4 slow-type publish carve-out

- **Reason:** Trigger DSL and runtime inference types still require
  `deno publish --allow-slow-types` under Deno 2.8 publish analysis. This is accepted
  score-impacting debt for the toolchain upgrade, not a workspace default.
- **Owner:** Toolchain upgrade T4 follow-up.
- **Target:** Split trigger inference types and publish explicit public definition interfaces before
  beta.
- **Linked plan:** `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (LD-5).
- **Created:** 2026-06-15
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** F-6; close when `packages/plugin-triggers-core` dry-run passes without
  `--allow-slow-types`.

## plugins/triggers — deferred trigger action scheduler missing (`triggers-defer-unsupported`)

- **Reason:** `DeferAction` models `kind: 'defer'` with an `until` timestamp, but the runtime has no
  one-shot scheduler/replay port that can re-dispatch the processed trigger action later. S2 now
  rejects the action through `TriggersError.unsupportedOperation` and DLQ instead of silently
  dropping it.
- **Owner:** Capability caveats follow-up.
- **Target:** Before advertising deferred trigger action dispatch as supported.
- **Linked plan:** `.llm/tmp/run/cap-s2-defer/brief.md`
- **Created:** 2026-06-19
- **Status:** open
- **Gate:** Replace the S2 DLQ rejection test with a deferred-dispatch test after a package-owned
  scheduler/replay port is designed.

## plugins/sagas — deferred Prisma SagaIdempotencyPort parity

- **Reason:** `PrismaSagaStore` now provides durable saga state persistence, but idempotency and
  applied-key storage remain backed by KV (`KvSagaIdempotencyStore` / `KvSagaAppliedKeyStore`).
  Prisma `SagaIdempotencyPort` parity is intentionally out of scope for the sagas-prisma-store
  slice.
- **Owner:** Prime-time saga durability follow-up.
- **Target:** Before advertising fully Prisma-only saga runtime persistence.
- **Linked plan:**
  `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-prisma-store/plan.md`
- **Created:** 2026-06-20
- **Status:** open
- **Gate:** F-13; add Prisma idempotency/applied-key adapter tests and a Prisma-backed duplicate
  message runtime test.

## auth layer — AS7 documentation architecture metadata warnings

- **Reason:** AS7's auth-scoped doctrine gate is hard-fail clean, but reports documentation
  warnings: `packages/plugin-auth-core/README.md` has one TypeScript example instead of the doctrine
  proxy's two-example target, `packages/plugin-auth-core/docs/architecture.md` does not include an
  explicit `Archetype: <n>` token, and the auth backend packages/plugin omit package-local
  `docs/architecture.md` files because their READMEs carry the public contract.
- **Owner:** Auth architecture follow-up.
- **Target:** Before auth beta documentation freeze.
- **Linked plan:** `conformance-report.md`, `fitness-gates.md`, `jsr-scorecard.md` in branch
  `feat/prime-time/auth-as7-fitness`.
- **Created:** 2026-06-21
- **Update (2026-06-24, PR2 #117):** the `docs/architecture.md` `Archetype:`-token portion of this
  warning is now moot — all per-package `docs/` folders (incl.
  `packages/plugin-auth-core/docs/architecture.md`) were removed in PR2; package public contracts
  live solely in the rewritten READMEs + the published docs site. The README two-example-target
  portion remains the live, open part of this debt.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** `deno task arch:check`; close when the auth-scoped doctrine warnings are zero or
  explicitly demoted in the checker with documented rationale.

## repo doctrine task — full historical scan remains red

- **Reason:** Before AS7 wiring, `deno run --allow-read .llm/tools/fitness/check-doctrine.ts` from
  the repository root exited nonzero on unrelated historical CLI/plugin doctrine debt. AS7 preserved
  that full scan as `deno task arch:check:repo` and made `deno task arch:check` run the auth-owned
  surfaces so the final auth slice has a green mechanical gate without refactoring out-of-scope
  packages.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`.
- **Created:** 2026-06-21
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** `deno task arch:check:repo`; close by reducing unrelated root failures or by replacing
  the legacy root scan with debt-aware package selection.

## release provenance — OIDC publish workflow deferred

- **Reason:** JSR's provenance/SLSA score factor is publish-time only. The current CI workflow runs
  publish dry-runs but explicitly states OIDC publish is deferred; AS7 therefore cannot assert a
  wired provenance workflow without faking it.
- **Owner:** Release process automation follow-up.
- **Target:** Before first public auth package release.
- **Linked plan:** `jsr-scorecard.md` in branch `feat/prime-time/auth-as7-fitness`.
- **Created:** 2026-06-21
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** add a GitHub Actions publish workflow with `permissions: id-token: write` and JSR
  provenance enabled; close when a dry-run/release rehearsal proves the workflow path.

## packages/workers — AP-1 / doctrine verdict Restructure (task-executor.ts 1,287 LOC)

- **Reason:** `task-executor.ts` needs supervisor/executor/dispatcher split.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-1, F-3, F-13

## packages/sagas — AP-1 / doctrine verdict Refactor (list-transport.ts 847 LOC)

- **Reason:** `list-transport.ts` should split; compensation should be a builder method.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-06-09 — Wave 4c slice C13 split the saga transport monoliths in
  `@netscript/plugin-sagas-core`: `src/transports/list-transport.ts` now owns the transport class
  and stable public re-exports while list command/key/recovery mechanics live in
  `src/transports/list-transport-commands.ts`; `src/transports/redis-transport.ts` was split the
  same way into `src/transports/redis-transport-commands.ts`. All four files are below the F-1 cap
  and the transport entrypoint still passes raw `deno check --unstable-kv`.
- **Gate:** F-1, F-13

## packages/fresh — AP-1 / doctrine verdict Restructure (builders/mod.ts 1,110 LOC)

- **Reason:** `builders/mod.ts` should split per builder concern with subpath exports.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** RESOLVED 2026-06-14 — Wave 5 consolidation Phase D split `builders/mod.ts` (1,110 LOC)
  into `src/application/builders/` per-concern modules; max file now 497 LOC (< 500). Independent
  IMPL-EVAL (run 27507518739, MiniMax M3, VERDICT APPROVED) confirmed F-1/F-5/F-11 PASS.
- **Gate:** F-1, F-5, F-11

## packages/fresh — F-7 full package doc-lint residue after 5d1

- **Reason:** 5d1 support-spine FAIL_FIX cannot make broad `deno task doc-lint` pass without
  implementing later 5d-owned public surfaces. The remaining diagnostics are concentrated in
  builders/defer/form/streams/query, including direct upstream TanStack/durable-streams public type
  exposure and missing JSDoc on later-slice symbols.
- **Owner:** Wave 5d `@netscript/fresh` chain; final closeout owner is 5d6 query/server/package
  surface.
- **Target:** Close before merging 5d into Wave 5 apps; 5d6 must prove `deno task doc-lint` passes
  from `packages/fresh`.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`;
  `.llm/tmp/run/feat-package-quality-wave5-apps--5d1-support/escalations/failfix-doc-lint.md`.
- **Created:** 2026-06-13
- **Status:** RESOLVED 2026-06-14 — `deno task doc-lint` now passes from `packages/fresh` (0
  findings, 12 entrypoints). Independent IMPL-EVAL (run 27507518739, MiniMax M3, VERDICT APPROVED)
  confirmed F-7/F-5 PASS at HEAD.
- **Gate:** F-7, F-5, `deno task doc-lint` from `packages/fresh`.

## packages/service — doctrine verdict Refactor

- **Reason:** `presets/` and `assets/` need role clarification.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-11

## packages/service — assets/scalar.min.js (3.3 MB vendored in publish)

- **Reason:** `assets/scalar.min.js` (3.3 MB) is vendored and included in the JSR publish so that
  offline/no-CDN Scalar docs work for JSR-installed consumers. The size is acceptable for alpha but
  should be revisited before beta (lazy npm specifier, optional peer dependency, or CDN-only mode).
- **Owner:** Wave 5a `@netscript/service` generator (D-9).
- **Target:** Revisit before beta; no 2027-Q1 commitment unless publish-size limits change.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave5-apps--5a-service/plan.md` (D-9).
- **Created:** 2026-06-15 (PLAN-EVAL advisory finding #2).
- **Status:** open, DEBT_ACCEPTED. Locked decision D-9 keeps the vendored asset; this entry tracks
  the revisit.
- **Gate:** F-14, JSR publish-size limits; close when an alternative delivery mechanism (lazy
  specifier, optional peer, or CDN-only flag) replaces the vendored file without breaking offline
  docs.

## packages/service — T4 slow-type publish carve-out

- **Reason:** Hono/oRPC service builder schemas still require `deno publish --allow-slow-types`
  under Deno 2.8 publish analysis. This is accepted score-impacting debt for the toolchain upgrade,
  not a workspace default.
- **Owner:** Toolchain upgrade T4 follow-up.
- **Target:** Make Zod schemas source-of-truth behind explicit exported service interfaces before
  beta.
- **Linked plan:** `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (LD-5).
- **Created:** 2026-06-15
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** F-6; close when `packages/service` dry-run passes without `--allow-slow-types`.

## packages/plugin — AP-1 / doctrine verdict Restructure (types.ts 1,005 LOC)

- **Reason:** `types.ts` should split per concept and introduce `domain/` plus `ports/`.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-06-08 — Wave 3 `@netscript/plugin` host track verified the old monolithic
  `types.ts` no longer exists. The package now exposes role-named `src/domain/`, `src/ports/`,
  `src/config/`, `src/cli/`, `src/sdk/`, `src/testing/`, and diagnostics surfaces through curated
  entrypoints. Remaining builder size debt is tracked separately below.
- **Gate:** F-1, F-3, F-5, F-11

## packages/plugin — T4 slow-type publish carve-out

- **Reason:** Plugin manifest/builder generic helpers still require
  `deno publish --allow-slow-types` under Deno 2.8 publish analysis. This is accepted
  score-impacting debt for the toolchain upgrade, not a workspace default.
- **Owner:** Toolchain upgrade T4 follow-up.
- **Target:** Reduce generic helper leakage behind explicit public plugin definition interfaces
  before beta.
- **Linked plan:** `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/plan.md` (LD-5).
- **Created:** 2026-06-15
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** F-6; close when `packages/plugin` dry-run passes without `--allow-slow-types`.

## packages/plugin/src/config/builders/plugin-builder.ts — F-1 size (360 LOC)

- **Reason:** `plugin-builder.ts` remains above the doctrine 300 LOC planning cap (343 LOC at base
  `89071df`, 360 LOC after Wave 3 added public JSDoc in slice 4). It is a typestate-generic fluent
  builder and splitting it during Wave 3 risks breaking the public chain.
- **Owner:** Wave 3 `@netscript/plugin` host generator.
- **Target:** Pre-beta builder refactor.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave3-plugin--host/plan.md` (LD-3, slice 19).
- **Created:** 2026-06-08
- **Status:** open, DEBT_ACCEPTED
- **Gate:** F-1, A4 builder split follow-up

## packages/plugin/src/sdk/discovery/ast-extractor.ts — PLG-WALKER-AST (extractor precision)

- **Reason:** Group G needs walker-generated registries now, but a full TypeScript AST resolver with
  symbol binding, import graph traversal, and expression evaluation exceeds the polish slice. The
  implementation intentionally uses a bounded regex extractor for direct
  `export const name = defineJob|defineSaga|defineWebhook(...)` call sites and records this debt
  before slice G10-3 as required by evaluator finding 3.
- **Owner:** Plugin platform maintainers.
- **Target:** Replace with compiler-backed AST extraction before plugin platform stabilization.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-polish--plan-and-impl/plan.md` (G10-3).
- **Created:** 2026-05-20
- **Status:** open
- **Gate:** PLG-WALKER-AST, F-5, F-11

## packages/plugin-streams-core — AP-13 console.warn runtime reporting

- **Reason:** `DurableStreamProducer` currently uses `console.warn` for connection, pending-event,
  serialization, and primary-key visibility in published runtime code. The warnings are
  intentionally retained for alpha operator visibility; replacing them correctly requires a
  structured telemetry or logger dependency that is outside Wave 4a's package-quality scope.
- **Owner:** `@netscript/plugin-streams-core` maintainers.
- **Target:** Telemetry-integration wave before beta runtime stabilization.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave4-runtimes--4a-streams-watchers/plan.md`
  (D6, slice 4).
- **Created:** 2026-06-08
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** F-14, AP-13; close when `DurableStreamProducer` emits through a structured reporter and
  `console.warn` is absent from
  `packages/plugin-streams-core/src/application/create-durable-stream.ts`.

## plugins/streams — durable topic publish/subscribe transport deferred (`streams-manifest-helpers-unsupported`)

- **Reason:** `defineStreamProducer` and `defineStreamConsumer` are manifest-layer helpers in the
  Tier 2 plugin package. The existing real transport is `@netscript/plugin-streams-core`
  `createDurableStream`, which publishes State Protocol upsert/delete events through
  `@durable-streams/client`; it does not expose a generic topic consumer/subscriber channel that can
  deliver `StreamTopicDefinition<TPayload>` payloads. Building that durable topic transport requires
  a new cross-package runtime contract and consumer SDK, which exceeds the S3 M-sized slice. S3
  replaced the silent no-op helper behavior with typed unsupported-operation failures.
- **Owner:** `@netscript/plugin-streams` / `@netscript/plugin-streams-core` maintainers.
- **Target:** Runtime transport rescope before advertising generic plugin topic publish/subscribe.
- **Linked plan:** `.llm/tmp/run/cap-s3-streams/brief.md`.
- **Created:** 2026-06-19
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when a real durable topic transport exists with producer delivery, consumer
  subscription/unsubscribe semantics, and runtime tests proving a published payload reaches a
  subscribed handler without relying on manifest-layer no-ops.

## packages/watchers — AP-13 console.warn runtime reporting

- **Reason:** `FileWatcher` and `HybridWatchStrategy` currently use `console.warn` for native
  watcher fallback and runtime access-failure visibility. The warnings are intentionally retained
  for alpha operator diagnostics; replacing them correctly requires a structured telemetry or logger
  dependency that is outside Wave 4a's package-quality scope.
- **Owner:** `@netscript/watchers` maintainers.
- **Target:** Telemetry-integration wave before beta runtime stabilization.
- **Linked plan:** `.llm/tmp/run/feat-package-quality-wave4-runtimes--4a-streams-watchers/plan.md`
  (S23 final debt sweep).
- **Created:** 2026-06-08
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** F-14, AP-13; close when watcher runtime warnings emit through a structured reporter and
  `console.warn` is absent from `packages/watchers/src/file-watcher.ts` and
  `packages/watchers/src/strategies/hybrid.ts`.

## packages/cli — AP-1 / doctrine verdict Restructure

- **Reason:** `pipeline.ts` and `official-plugin-copier.ts` are monoliths; package should move
  toward Archetype 6 layout.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** closed 2026-06-17 — Wave 6 completed the bounded A6 promotion for `@netscript/cli`:
  command registry/deploy target seams, scaffold/init pipeline split, JSON init output, preset
  extension seam, schema mirror, and final F-CLI gate sweep. The local `scaffold.runtime` fixture
  stayed `passed=41 failed=0`, CLI doc lint and CLI publish dry-run passed, and focused F-CLI gates
  pass. The only remaining related sub-item is the deliberately deferred
  `scaffold.published.runtime` proof, tracked to post-S3 step F rather than AP-1.
- **Gate:** F-1, F-3, F-10, AP-18 manual review
- **Slice 8 update:** `commands/init/pipeline.ts` was decomposed into
  `src/public/application/init/**`; this entry remains open for `official-plugin-copier.ts` and
  remaining CLI debt.

## packages/cli — cli/maintainer-mode-mixing

- **Reason:** Public CLI code currently exposes local-source and monorepo concepts that must move
  behind the workspace-only `netscript-dev` command graph.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close after slice 25.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-04-30
- **Status:** open
- **Gate:** F-CLI-3, F-CLI-4, F-CLI-11

## packages/cli — cli/no-permissions-doc

- **Reason:** The CLI permissions contract is not documented by command and binary, which leaves
  public and maintainer runtime requirements ambiguous.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close after slice 28.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-04-30
- **Status:** open
- **Gate:** F-CLI-8, F-CLI-10

## packages/cli — cli/doctrine-drift-phase-10

- **Reason:** Phase 10 removed the audited master-era roots, but post-PR review found the package
  still failed the stricter readability and consistency bar now codified in Archetype 6 v2: command
  surfaces remain too flat, composition still owns command body shape, templates and adapters need
  normalized placement, and output/exit edges need hard enforcement.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close by slice 63.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-05-01
- **Status:** closed 2026-05-01 — Phase 11 slices 49-63 completed the kernel rename, binary
  extraction, vertical slicing, declarative composition, exit discipline, template consolidation,
  and executable F-CLI-1..31 gate wiring for the CLI package.
- **Gate:** F-CLI-1..31 plus universal F-16, F-17, F-18

## packages/cli — cli/archetype-6-v2-pending-scripts

- **Reason:** Slice 48 registers Archetype 6 v2 gates F-CLI-14 through F-CLI-31 before all
  enforcement scripts exist. Temporary manual evidence is allowed only while Phase 11 implements the
  scripts.
- **Owner:** refactor-cli-doctrine-rewrite.
- **Target:** Close by slice 62.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md`
- **Created:** 2026-05-01
- **Status:** closed 2026-05-01 — slice 62 added and wired the F-CLI-14..31 fitness scripts;
  `deno
  task arch:check` runs without `pending-script marker` output.
- **Gate:** F-CLI-14..31

## packages/shared — AP-2 / doctrine verdict Rewrite (datetime.ts 1,112 LOC)

- **Reason:** `utils/datetime.ts` should be replaced by `@std/datetime` or platform primitives;
  `shared` should shrink to cross-package identifiers.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** partially closed 2026-06-05 — `utils/datetime.ts` was deleted in Wave 0 and the
  published surface remains free of generic datetime helpers. Residual unpublished `utils/`
  compatibility for `@shared/utils` consumers is tracked in the Wave 0 drift registry until later
  plugin waves migrate those imports.
- **Gate:** F-1 and F-2 closed for datetime; F-11 remains deferred for residual unpublished `utils/`
  compatibility

## plugins/triggers — doctrine verdict Refactor

- **Reason:** Confirm `verify-plugin.ts` exists and plugin verification shape matches Archetype 5.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-9, F-11

## plugins/workers — doctrine verdict Refactor

- **Reason:** Confirm `verify-plugin.ts` exists and review `worker/` versus `jobs/` split.
- **Owner:** Architecture doctrine follow-up.
- **Target:** 2026-Q3 doctrine remediation.
- **Linked plan:** `.llm/tmp/run/doc-harness-doctrine-refactor--harness-v2-plan/plan.md`
- **Created:** 2026-04-29
- **Status:** open
- **Gate:** F-3, F-9, F-11

## packages/cli — public-api doc completeness (`cli/public-api-doc-completeness`)

- **Reason:**
  `deno doc --lint packages/cli/mod.ts packages/cli/scaffolding.ts packages/cli/testing.ts` reports
  48 residual `private-type-ref` errors after the Phase 12 evaluator pass. Public `Add*Dependencies`
  interfaces name concrete kernel adapter classes (`DatabaseWorkspaceMutator`,
  `PluginWorkspaceMutator`, `ServiceWorkspaceResolver`, `PortAllocator`, `DbEngineRegistry`,
  `PluginKindRegistry`) and through them surface internal collaborators (`Registry`,
  `DiscoveredService`, `PluginScaffoldResult`, `ResolvedXxxConfig`, `CompileResult`, etc.). Plan
  goal #3 ("100% JSR documentation score") is not fully met.
- **Owner:** `@netscript/cli` maintainers.
- **Target:** before the next public minor; tracked as plan slice 67.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md` (slice 67).
- **Created:** 2026-05-01 (evaluator pass).
- **Status:** open. Publish dry-run still passes; this is doc-completeness, not a publish blocker.
- **Gate:** F-CLI-8 (doc score), F-7 (universal doc-score gate).

## packages/aspire — public schema doc-lint completeness (`aspire-public-schema-doc-lint`)

- **Reason:** `deno doc --lint packages/aspire/mod.ts` reports 32 pre-existing public API doc-lint
  errors in `config.ts` and `types.ts`: exported Zod schema constants lack explicit type
  annotations, and public types derived with `z.infer` reference Zod's private `output` helper type.
  The slice 1 OTEL vocabulary change adds an explicit dashboard env constant and does not introduce
  these schema/type failures. `deno publish --dry-run --allow-dirty --no-check=remote` from
  `packages/aspire` fails on the same slow-type class, while
  `deno publish --dry-run --allow-dirty --no-check=remote --allow-slow-types` succeeds. Fixing the
  package-wide Zod public surface would exceed the OTEL parity slice.
- **Owner:** `@netscript/aspire` maintainers.
- **Target:** before the next public Aspire package release.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 1 doc-lint gate).
- **Created:** 2026-05-03
- **Status:** superseded by `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl`: root
  `deno doc --lint packages/aspire/mod.ts` now passes after narrowing the root contract. Schema
  subpath/public schema publish hardening remains owned by the future Aspire/schema package work if
  that subpath is promoted as stable.
- **Gate:** F-5, F-7

## packages/telemetry/src/instrumentation/{saga,worker,scheduler}.ts — AP-1/F-1 active compatibility debt (`telemetry-plugin-instrumentation-extraction`)

- **Reason:** `saga.ts`, `worker.ts`, and `scheduler.ts` remain active and exported from
  `@netscript/telemetry/instrumentation` because current worker/scheduler/saga packages and official
  plugins still import those helper symbols. Removing them during Group A would break consumer
  coherence. This intentionally defers the extraction that was partially reversed by the
  compatibility restoration.
- **Owner:** Future worker, scheduler, saga, and plugin runtime package groups.
- **Target:** Move domain-specific instrumentation to the owning future plugin/package subpaths
  before the next plugin-platform stabilization pass.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/plan.md` and
  `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/drift.md`.
- **Created:** 2026-05-08
- **Status:** open, DEBT_ACCEPTED for Foundation alpha only.

## packages/config — plugin-specific schema/config ownership (`config-plugin-specific-schema-debt`)

- **Reason:** Core config still owns plugin-specific concerns in `src/schema/plugins/mod.ts`,
  `src/domain/worker-schema.ts`, `src/domain/saga-schema.ts`, `src/domain/trigger-schema.ts`,
  `src/domain/runtime-config-schema.ts`, and deploy/runtime plugin config surfaces. These remain
  temporarily because the future plugin-specific packages/subpaths that should own them are not
  present yet and CLI/generated project consumers depend on the current shapes.
- **Owner:** Group D (workers) for worker/job/permissions schemas; future groups for
  sagas/triggers/runtime.
- **Target:** Move worker/job/permissions schemas to `@netscript/plugin-workers-core/config` in
  Group D. Move saga/trigger/runtime schemas in their respective groups. Keep `@netscript/config`
  focused on project-level loader/composition contracts.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-workers--plan-and-impl/plan.md` slice D-config.
- **Created:** 2026-05-08
- **Status:** in-progress: workers extracted; sagas/triggers pending
- **Gate:** F-3, F-5, F-7, plugin import/platform fitness gates
- **Notes:** Group D rescoped plan (2026-05-10) adds D-config slice to extract worker/job config
  schemas to `@netscript/plugin-workers-core/config/`. The accepted D4 path is no-shim TRUE_CLOSE:
  workers core does not import or re-export through `@netscript/config`. Legacy config ownership
  remains only until D28-D29 migrate consumers and delete the old worker config copies.

## packages/aspire/deno.json — `./helpers` alpha compatibility subpath (`aspire-helpers-subpath-shim`)

- **Reason:** The forbidden `helpers/` folder was removed, but
  `./helpers -> ./src/application/mod.ts` remains as an alpha compatibility subpath while generated
  AppHost/helper consumers migrate to `@netscript/aspire/application`.
- **Owner:** Future Aspire/AppHost generator migration group.
- **Target:** Remove the `./helpers` export after generated projects and package consumers import
  `@netscript/aspire/application`.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/plan.md` and
  `.llm/tmp/run/feat-plat-impl-foundation--plan-and-impl/drift.md`.
- **Created:** 2026-05-08
- **Status:** closed 2026-06-07 — Wave 2a slice 8 (`37665e2`) removed the `./helpers` export from
  `packages/aspire/deno.json`; grep for `@netscript/aspire/helpers` across `packages/` and
  `plugins/` returns zero consumers. F-5 (public surface matches export map), F-7 (doc-lint clean on
  all 8 entrypoints), F-11 (no `helpers/` folder) verified by IMPL-EVAL.
- **Gate:** F-5, F-7, F-11, F-18

## runtime — Aspire OTEL CLI Dashboard API discovery fails (`aspire-otel-cli-discovery`)

- **Reason:** Slice 5 can start the master C# AppHost and verify Deno runtime resources with full
  OTEL env (`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`, protocol `http/protobuf`, sampler
  `always_on`). Direct Aspire Dashboard telemetry API probes return `200` for
  `/api/telemetry/resources`, `/api/telemetry/logs`, and `/api/telemetry/traces`, but
  `aspire otel
  logs` and `aspire otel traces` still fail with "Dashboard API is not available."
  This blocks CLI-command evidence, not trace capture itself.
- **Owner:** runtime validation / Aspire CLI environment.
- **Target:** before claiming `aspire otel ...` CLI parity as PASS.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slices 5-6 runtime parity
  procedure).
- **Created:** 2026-05-03
- **Status:** open. Slice 5 records `PASS_WITH_CLI_DEBT` evidence in
  `.llm/tmp/run/feat-cli-aspire-otel-parity/baseline-csharp-trace.md`; slice 6 may compare trace
  shape through the Dashboard API, but final PR must not claim the `aspire otel` CLI path passed.
- **Gate:** runtime - C# baseline, runtime - telemetry

## packages/cli — legacy C# scaffold plugin-add incompatibility (`legacy-csharp-scaffold-plugin-add`)

- **Reason:** The runtime plan required a generated C# scaffold covering official plugins, handmade
  plugin, db, service, worker, trigger, saga, and frontend. `netscript init --legacy-aspire` creates
  a legacy C# AppHost project under `dotnet/AppHost`, but `netscript plugin add worker` then fails
  while regenerating helpers because it expects an `aspire/` directory. The command partially writes
  plugin files and `appsettings.json`, but the generated C# `Program.cs` remains frontend-only.
- **Owner:** CLI scaffold/runtime maintainers.
- **Target:** before using generated legacy C# scaffolds for full plugin runtime parity baselines.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 5 scaffolded project
  spec).
- **Created:** 2026-05-03
- **Status:** open. Slice 5 used the master checkout itself as the C# reference after recording
  drift; no C# package edits were made.
- **Gate:** runtime - C# baseline, regression

## runtime — generated TS scaffold local import overlay (`generated-ts-scaffold-local-import-overlay`)

- **Reason:** Slice 6 generated TS scaffolds reference unpublished `@netscript/*` package imports,
  while the current `netscript init` command no longer accepts the documented `--local` mode.
  Runtime validation required an ignored local import-map overlay that maps package exports to
  worktree file URLs and pins `@logtape/logtape@^2.0`.
- **Owner:** CLI scaffold/runtime maintainers.
- **Target:** before declaring generated scaffold runtime parity without harness-only overlays.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 6 runtime parity).
- **Created:** 2026-05-03
- **Status:** open. The overlay is documented in `scaffold.md`; generated source was not committed.
- **Gate:** runtime - generate, runtime - start

## runtime — generated TS frontend React reference (`generated-ts-frontend-react-reference`)

- **Reason:** Slice 6 generated frontend route fails with `ReferenceError: React is not defined`.
  The dashboard trace exists and includes Fresh/page spans, but it is a 500 trace rather than a
  successful frontend-origin E2E parity trace.
- **Owner:** Fresh/frontend scaffold maintainers.
- **Target:** before claiming `runtime - E2E trace` as plain PASS.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 6 runtime parity).
- **Created:** 2026-05-03
- **Status:** open. Trace `5e7adbe64e93c5cc4b0da94d6dfb1b20` records the failure and confirms OTEL
  ingestion works for the frontend resource.
- **Gate:** runtime - E2E trace, runtime - span attrs

## runtime — generated TS sample E2E chain missing (`generated-ts-sample-e2e-chain`)

- **Reason:** The generated TS scaffold's sample resources expose healthy service/plugin API
  endpoints and Deno OTel spans, but they do not provide the same trigger -> queue -> worker chain
  captured from the master C# baseline. A manual Deno probe proves traceparent propagation for a
  client fetch into the `users` service, but not the required full parity chain.
- **Owner:** CLI sample/runtime maintainers.
- **Target:** before claiming generated TS trace shape parity with the C# baseline.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 6 runtime parity).
- **Created:** 2026-05-03
- **Status:** open. `ts-apphost-trace.md` records healthy resource traces and the missing chain.
- **Gate:** runtime - E2E trace, runtime - span attrs

## runtime — DB lifecycle conflicts with strict container hygiene (`runtime-db-hygiene-persistent-container`)

- **Reason:** Removing the generated persistent Postgres container between `db init`/`db seed` and
  final `aspire start` erases the migrated database, causing `otel-parity-db` health to fail with
  `database "otel-parity-db" does not exist`. The successful Slice 6 run preserved the migrated
  generated Postgres container between DB lifecycle and final trace capture.
- **Owner:** runtime validation / generated DB orchestration maintainers.
- **Target:** before requiring strict container removal between generated DB lifecycle and AppHost
  trace capture.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (run hygiene).
- **Created:** 2026-05-03
- **Status:** open. Final cleanup stopped AppHost, removed generated containers, and confirmed ports
  `4318` and `18888` were free.
- **Gate:** runtime - start, runtime - describe

## packages/cli — runtime schema generation plugin dependency gap (`cli-runtime-schemas-plugin-dependency`)

- **Reason:** Slice 7 regression exercised the current project-level generation surface. The
  historical `netscript generate` gate in the plan is stale: the current command group only exposes
  `generate runtime-schemas`. Running `generate runtime-schemas --dry-run` against a fresh scaffold
  after `plugin add worker` failed because the temporary generated plugin registry imports
  `@netscript/plugin`, but the scaffold's import map/dependencies do not resolve that package.
- **Owner:** CLI generation/plugin maintainers.
- **Target:** before treating `generate runtime-schemas` as a clean generated-project regression
  gate.
- **Linked plan:** `.llm/tmp/run/feat-cli-aspire-otel-parity/plan.md` (slice 7 validation matrix,
  `runtime - generate`).
- **Created:** 2026-05-03
- **Status:** open. The OTEL-related regeneration paths still passed through `db add` and
  `plugin add`, each of which regenerated 12 Aspire helper files. The failing command is recorded as
  `DEBT_ACCEPTED` for Slice 7 rather than folded into the OTEL implementation.
- **Gate:** runtime - generate, regression

## packages/plugin-workers-core/contracts — structural server contract export (`workers-contract-structural-server-export`)

- **Reason:** `workersContractV1` is exported as a structural server-contract type to keep JSR
  slow-type findings at 0. The shape preserves route keys but weakens deep handler-options inference
  inside the workers service routers, so the server contract uses a narrow structural handler shim
  instead of exporting the full inferred oRPC server type.
- **Owner:** Workers core maintainer.
- **Target:** Remove the structural handler shim and restore deep server-contract inference once
  oRPC exposes a wrapper that preserves JSR slow-type cleanliness, or once TypeScript/JSR no longer
  reports slow types for the inferred server contract.
- **Linked plan:** `.llm/tmp/run/feat-plat-impl-workers-v2--plan-and-impl/plan.md`,
  `.llm/tmp/run/feat-plat-impl-workers-v2--plan-and-impl/drift.md`, and
  `.llm/tmp/run/feat-plat-impl-workers-v2--plan-and-impl/evaluate.md`.
- **Created:** 2026-05-11
- **Status:** open, DEBT_ACCEPTED for Group D merge.
- **Gate:** core/plugin `deno publish --dry-run --allow-dirty` stays at 0 slow-type errors, then
  remove the structural contract shim without reintroducing service-router casts or slow types.

## packages/cli — maintainer sync isolated-declarations slow types (`cli-maintainer-sync-isolated-declarations`)

- **Reason:** `deno check` on the `@netscript/cli` public graph (task `check`, via `maintainer.ts`)
  reports 3 isolated-declarations slow-type errors (TS9016/TS9027) on the shorthand `_internal`
  object export in `packages/cli/src/maintainer/features/sync/plugin/copy-official-plugin.ts:205`.
  The object needs an explicit type annotation (or non-shorthand entries) to satisfy
  `--isolatedDeclarations`.
- **Owner:** `@netscript/cli` maintainers / CLI doctrine track (Archetype 6).
- **Target:** Next CLI package-quality wave; not the Wave 2c messaging sub-wave.
- **Linked plan:** `.llm/tmp/run/refactor-cli-doctrine-rewrite/plan.md` (CLI track).
- **Created:** 2026-06-07 (Wave 2c IMPL-EVAL).
- **Status:** open, DEBT_ACCEPTED for Wave 2c. Pre-existing on base `55f6108`; the file is
  byte-identical to base and imports neither `@netscript/queue` nor `@netscript/cron`, so it is
  unrelated to the 2c rename. The 2c slice-16 consumer gate surfaced it. The actual queue/cron
  consumers — `plugins/triggers` and `plugins/workers` — both pass `deno task check`, confirming the
  `interfaces/`→`ports/` and `./types`→`./ports` rename is non-breaking.
- **Gate:** `deno check ./maintainer.ts` from `packages/cli` reports 0 TS9016/TS9027 errors.

## root toolchain — R3 held dependency majors (`toolchain-r3-held-dependency-majors`)

| Status        | Package                     | Reason                                                            | Revisit                                                |
| ------------- | --------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| DEBT_ACCEPTED | `npm:vite` `7.2.2`→`8.0.16` | unvetted major; Vite 8 is outside R3's safe patch/minor bump rule | Fresh Vite integration and scaffold runtime validation |

- **Owner:** Toolchain upgrade R3 follow-up.
- **Target:** Before beta dependency freeze.
- **Linked plan:**
  `.llm/tmp/run/chore-deno-2.8-aspire-13.4-upgrade--research/sub-agent-briefs/R3.md`.
- **Created:** 2026-06-16.
- **Status:** open, DEBT_ACCEPTED. R3 follow-up removed `@fedify/amqp`, `@fedify/denokv`,
  `@fedify/redis`, `@durable-streams/state`, and `amqplib` from this debt after maintainer approval
  and green validation.
- **Gate:** `deno task deps:latest --behind-only --pretty` returns only documented holds, then
  targeted package checks and `deno task publish:dry-run` pass after each migration.

## plugins/sagas/src/runtime — saga runtime folder cardinality (`sagas-runtime-folder-cardinality`)

- **Reason:** The `sagas-prisma-store` slice adds a Prisma durable state adapter and backend
  resolver beside the existing saga runtime modules. The public runtime export remains stable, but
  the folder now exceeds the doctrine cardinality warning threshold and needs a follow-up split of
  store/backend implementation files into a role-named subfolder without changing the exported
  runtime API.
- **Owner:** saga runtime maintainers.
- **Target:** before beta package-quality freeze.
- **Linked plan:**
  `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/sagas-prisma-store/plan.md`.
- **Created:** 2026-06-20.
- **Status:** open, DEBT_ACCEPTED for `sagas-prisma-store`; no `SagaStorePort` or `KvSagaStore`
  behavior changes are included in the debt.
- **Gate:** F-16 folder cardinality is back under threshold and F-13 saga runtime invariants remain
  green.

## packages/auth-{workos,better-auth} — duplicated backend error + token helpers (`AS2-CONSOLIDATION`)

- **Reason:** AS2a refactored `@netscript/auth-workos` and `@netscript/auth-better-auth` into pure
  `AuthBackendPort` backends. Each package independently defines an identical
  `AuthBackendOperationUnsupportedError` class (backendName/operation/reason) and a duplicated
  `signSessionToken` / `verifySessionToken` helper pair. The shared shape belongs in
  `@netscript/plugin-auth-core` so all backends (incl. kv-oauth and future tier-2) reference one
  error type and one token-helper implementation.
- **Owner:** Track-5 auth-plugin program; AS3 (unified `plugins/auth` oRPC service) is the
  consolidation point.
- **Target:** Lift the shared error class + token helpers into `@netscript/plugin-auth-core` during
  AS3, then have AS2 backends import them.
- **Linked plan:**
  `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/as2a-backends-refactor/evaluate.md`.
- **Created:** 2026-06-20.
- **Status:** open, DEBT_ACCEPTED at AS2a PASS (qwen3.7-max run 27874783640, PR #87). Non-blocking;
  both backends compile/test/lint/fmt clean with the duplicated definitions.
- **Gate:** `AuthBackendOperationUnsupportedError` and `sign/verifySessionToken` are defined once in
  `@netscript/plugin-auth-core` and imported by both backends; backend tests stay green.

## packages/auth-kv-oauth — OIDC e2e coverage + RFC 9207 iss validation (`AS2B-KV-OAUTH-DEBT`)

- **Reason:** AS2b landed `@netscript/auth-kv-oauth` as a pure KV-backed OAuth2/OIDC
  `AuthBackendPort` backend. The OIDC branch (nonce + id_token via `@panva/oauth4webapi`) is
  correctly wired but **untested end-to-end** — the test provider fixture is `kind:'oauth'` and
  never exercises `kind:'oidc'`. Separately, the callback `iss` response param is stored in the txn
  but not passed as `expectedIssuer` to `validateAuthResponse`, so RFC 9207 issuer validation is not
  enforced (defense-in-depth; state + PKCE already bind the response).
- **Owner:** Track-5 auth-plugin program. Item 1 (OIDC e2e) folds naturally into AS3, where the
  unified oRPC service exercises the OIDC flow end-to-end.
- **Target:** Add an OIDC-kind provider fixture (with issuer) validating nonce round-trip + id_token
  claim extraction; pass `expectedIssuer` on callback validation. Address by/within AS3.
- **Linked plan:**
  `.llm/tmp/run/feat-framework-prime-time--supervisor/slices/auth-plugin/as2b-kv-oauth/evaluate.md`.
- **Created:** 2026-06-20.
- **Status:** open, DEBT_ACCEPTED at AS2b PASS (qwen3.7-max run 27874924828, PR #88). Non-blocking;
  evaluator classified both items as good first follow-ups, not merge blockers. v1-deferred extras
  (PAR/DPoP opt-in, active key-rotation, tier-2/generic presets, global-logout index) remain per
  LD-12.
- **Gate:** An OIDC-kind e2e test asserts nonce + id_token claims; callback passes `expectedIssuer`
  to `validateAuthResponse`; package tests stay green.

## plugins/*/services — oRPC router-composition `any` + external-boundary casts (cross-plugin) (`plugin-service-router-composition-any`)

This entry covers **two classes** of accepted, pre-existing, cross-plugin type drift that every
current feature / quality-hardening / auth slice must LEAVE IN PLACE (they pre-date the slices and
match the merged exemplars). IMPL-EVAL must not FAIL a slice for retaining either class.

### Class A — oRPC router-composition `any` (top-level `router.ts`)

- **Reason:** Every plugin service confines one-or-more `// deno-lint-ignore no-explicit-any` casts
  to its **top-level router-composition file** (`plugins/<plugin>/services/src/router.ts`): the
  `v1: any` version group, `os.prefix('/v1/<plugin>').router(<map> as any)`, and
  `router: any = os.router({ v1 })`. The handler map in
  `plugins/<plugin>/services/src/routers/v1-handlers.ts` is correspondingly typed
  `Record<string, unknown>`. Root cause is the shared contract wrapper: `<plugin>ContractV1` is
  built as `implement(<def>) as unknown as <Plugin>ContractV1`, whose `$context<T>()` exposes a
  hand-rolled `.handler(fn): TOutput` that returns the handler **output** rather than a typed oRPC
  _procedure_, so `os.router(map)` cannot type-check the map without `any`. This is the
  consumer-side manifestation of the contract-side debt `workers-contract-structural-server-export`
  (structural server-contract shim that weakens deep handler-options inference). Confirmed present
  in the merged exemplar `plugins/sagas/services/src/router.ts:39-44,71-75`; the same pattern exists
  (or is being made to match it) in `workers`, `triggers`, `streams`, and `auth`.

### Class B — external-boundary `as unknown as` / `as <T>` casts (SDK adapters, KV/db clients, bootstrap)

- **Reason:** Every plugin service carries pre-existing single-step boundary casts where an
  **external or untyped surface** is narrowed to the plugin's internal port type. These are NOT in
  handler business logic — they sit at the I/O seam between third-party SDKs / Deno KV / Prisma
  clients / plugin-bootstrap context and the service's typed interior. They are arbitrary in the
  sense that the external surface cannot be made to flow its own precise type to the port without a
  dedicated adapter-typing pass. Confirmed in the merged exemplar:
  `plugins/sagas/services/src/main.ts:89,102` (`dbClient as unknown as PrismaSagaStoreClient`,
  `... as unknown as SagaStreamPrismaClient`), `v1-helpers.ts` (KV deserialization), and the same
  class exists across `workers`, `triggers`, `streams`, and `auth`. In `auth` specifically:
  `services/src/backend-registry.ts` (WorkOS SDK session client, `ArrayBuffer` views),
  `services/src/init.ts` (`WatchableKv`, `PluginServiceContext`), `services/src/main.ts`
  (`ServiceDatabaseClient`, the `AuthRunningService` builder return, `PluginServiceBootstrap`).
- **Owner:** Future cross-plugin oRPC-seam fix branch (one dedicated branch reworking the shared
  `$context` contract wrapper to the native oRPC `implement(<contractDefinition>).$context<T>()`
  builder so `.router({...})` returns properly-typed procedures and `os.router(map)` type-checks
  with ZERO `as any` — AND introducing per-adapter typed shims that retire the Class-B boundary
  casts). NOT owned by any feature, quality-hardening, or auth slice.
- **Target:** Post-framework-prime-time, before beta. All plugins migrate together so the contract
  wrapper and every `router.ts` change in lock-step.
- **Linked plan:** related contract-side debt `workers-contract-structural-server-export` (above).
- **Created:** 2026-06-21.
- **Status:** open, DEBT_ACCEPTED. **SANCTIONED for now** — matching the merged sagas exemplar
  (casts confined to the top-level router-composition file, each with `deno-lint-ignore`, zero casts
  elsewhere) is the conformant target for all current slices.
- **Agent directive (read before failing a slice on this):** Do NOT attempt to remove the Class-A
  composition `any` casts, un-widen the `Record<string, unknown>` handler maps, change the contract
  package, OR rewrite the Class-B external-boundary `as unknown as` / `as <T>` casts, inside a
  feature / quality-hardening / auth slice. Mirroring the sagas exemplar IS conformant and IMPL-EVAL
  must NOT FAIL a slice for retaining EITHER the sanctioned router-composition casts (Class A) or
  the pre-existing external-boundary casts (Class B) that match sagas. The only out-of-scope cast
  error is a **NEW** cast a slice INTRODUCES in handler / business-logic / contract code (outside
  `router.ts` and outside the established I/O-adapter seams) — those remain strictly zero-cast. Auth
  S2/S6/S7 and AS7 explicitly mirror sagas and leave BOTH debt classes in place; each plugin gets
  its arbitrary-types fix in the dedicated cross-plugin seam branch, not in these slices.
- **Gate:** Close when (A) the shared contract wrapper returns properly-typed procedures and every
  `plugins/*/services/src/router.ts` type-checks under `deno check --unstable-kv` with zero `as any`
  / `: any` / `deno-lint-ignore no-explicit-any` and the per-plugin handler maps no longer need
  `Record<string, unknown>` widening, AND (B) every external-boundary surface (SDK / KV / db /
  bootstrap) reaches its port through a typed adapter so the `as unknown as` / `as <T>` boundary
  casts are gone across all plugin services.

## packages/auth-better-auth — seamless better-auth integration roadmap (`seamless-auth-roadmap`)

- **Reason:** The audit (docs-v4 Phase-0, `.llm/tmp/run/docs-v4-ia-deepening/seam-coverage.md`)
  found the only real build-seam gap in the framework: all 9 better-auth plugins (`organization`,
  `twoFactor`, `magicLink`, `admin`, `passkey`, `multiSession`, `apiKey`, `bearer`, `jwt`) are
  mountable today ONLY via the undocumented escape hatch
  `createBetterAuthBackend({ auth: betterAuth({ plugins: [...] }) })`. The documented convenience
  factory `createNetscriptBetterAuth` has a closed `NetscriptBetterAuthOptions` (no `plugins`
  field), so the documented path can enable none of them. The Principal mapper already consumes
  org/role/permission claims, so the wiring half is done — only the on-ramp and ergonomics are
  missing.
- **Owner:** Auth layer follow-up (docs-v4 run + a dedicated auth-DX program).
- **Created:** 2026-06-22
- **User directive (2026-06-22):** "build the passthrough and document in the harness what should be
  planned to build (seams, additional adapters, helpers, fluent builder) to make it absolutely
  seamless in NetScript." So the minimal passthrough ships now; the rest is this tracked roadmap.

- **R0 — passthrough seam (BUILD NOW, this run, IMPL-EVAL-gated WSL Codex slice):** add a `plugins`
  / `betterAuthOptions` passthrough to `createNetscriptBetterAuth` so the documented factory can
  mount any better-auth plugin (forwarded into `BetterAuthOptions`). Status: planned.

- **R1 — DB schema generation for plugins (REQUIRED for R0 to be usable):** plugins that need tables
  (`organization` → org/member/invitation, `twoFactor`, `passkey`, `apiKey`) do nothing until their
  Prisma models + migration exist. Wrap better-auth's schema-generation CLI through `netscript db` /
  scaffold so enabling a plugin also generates its required schema. Without R1, R0 enables the
  plugin at the better-auth layer but it fails at runtime on a missing table — docs MUST state this
  honestly until R1 lands.

- **R2 — interactive-flow seam (`InteractiveFlowPort`) for the better-auth backend:** today the
  better-auth backend is non-interactive, so `/signin` and `/callback` return `AUTH_PROVIDER_ERROR`
  and `magicLink`/`passkey` sign-in can't be driven through NetScript (only kv-oauth implements
  `InteractiveFlowPort`). Implement the port over better-auth's own handler to make
  magic-link/passkey/social interactive flows first-class. This is the largest item and the blocker
  for full plugin parity.

- **R3 — NetScript-native organization / multi-tenancy helpers:** typed org/tenant/role primitives
  layered over the `organization` plugin (instead of reading raw claim string keys), so apps and the
  `tutorials/workspace` track get a real framework org primitive. Resolves the "NetScript ships no
  organization primitive" caveat at its root.

- **R4 — fluent auth builder (`defineAuth()`):** a NetScript-idiomatic builder mirroring
  `definePage`/`defineSaga`/`defineTask` that composes backend + plugins + principal mapping +
  schema declaratively, replacing hand-wiring of `betterAuth()` + `createBetterAuthBackend` +
  adapter. This is the "absolutely seamless" endpoint of the roadmap.

- **R5 — plugin-aware Principal mapping + adapters:** typed accessors/mappers per plugin output
  (`apiKey` permissions, `admin` roles, `multiSession`) plus any additional better-auth adapter
  wiring beyond Prisma, and CLI support (e.g. `netscript auth add-plugin <name>`) to scaffold the
  plugin + its schema + wiring in one step.

- **Status:** OPEN — R0 scheduled in the docs-v4 run; R1–R5 tracked here as the seamless-auth
  program for a dedicated future run (needs its own PLAN-EVAL). Docs authored in docs-v4 must (a)
  document the R0 factory path, (b) state the R1 schema-generation requirement honestly, and (c)
  reference this roadmap rather than silently omitting the gaps.
- **Gate:** Close R0 when `createNetscriptBetterAuth({ plugins: [...] })` type-checks and forwards
  to `BetterAuthOptions` with a green IMPL-EVAL; close the program when R1–R5 land under their own
  plan.

## docs/runtime — alpha scaffold specifiers point at future stable ranges (`alpha-specifiers-forward-looking`)

- **Reason:** Several generated/scaffolded examples previously pinned future
  `jsr:@netscript/*@^1.0.0` ranges while the aligned package train was still pre-1.0. PR1 changes
  scaffold/docs examples to exact alpha-1 pins; keep this debt open until publish dry-run evidence
  confirms the corrected public package train.
- **Owner:** Release/publish readiness program.
- **Target:** PR1 (`chore/jsr-alpha1-publish-prep`) updates scaffold/docs examples to exact
  `0.0.1-alpha.1` pins. Close only after `deno task publish:dry-run` passes post-merge against the
  alpha-1 train.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when `deno task publish:dry-run` passes for the alpha-1 train after PR1 merges, and
  scaffold output no longer emits forward-looking stable ranges.

## plugins/auth — single active backend v1 boundary (`auth-single-active-backend-boundary`)

- **Reason:** `@netscript/plugin-auth` composes exactly one backend selected by
  `NETSCRIPT_AUTH_BACKEND`. It does not yet support multi-active routing, cross-backend account
  linking, global logout across backend stores, or historical session replay. The docs should mark
  this as a deliberate v1 boundary wherever the limitation is surfaced.
- **Owner:** Auth layer follow-up.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when a planned auth design introduces multi-backend routing/account-linking
  semantics, or the docs stop presenting provider swapping as anything beyond one active backend per
  deployment.

## packages/fresh — hosted example sandboxes missing (`fresh-hosted-example-sandboxes`)

- **Reason:** The Web Layer examples page promises hosted, one-click sandboxes as planned, but the
  current docs site only points readers to local tutorial source.
- **Owner:** Docs experience follow-up.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when the Web Layer examples page links to maintained hosted sandboxes or removes
  the planned-sandbox statement.

## runtime — app-wide shutdown orchestrator missing (`runtime-app-wide-shutdown-orchestrator`)

- **Reason:** Services, worker runtimes, queues, and database teardown each expose their own drain
  path, but there is no single top-level `host.shutdown()` that orchestrates all app resources under
  one budget.
- **Owner:** Runtime orchestration follow-up.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when the runtime exposes a documented app-wide shutdown orchestrator and the
  graceful-shutdown guide uses it as the primary path.

## packages/cli — deployment artifacts are not generated (`cli-deploy-artifacts-missing`)

- **Reason:** The scaffold records enough process and AppHost facts for manual deployment, but it
  does not generate Dockerfiles, Docker Compose files, Kubernetes manifests, or a first-class deploy
  command.
- **Owner:** Deployment tooling follow-up.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when `netscript deploy` or scaffold generation emits supported deployment
  artifacts, or the deployment docs are rewritten to remove generated-artifact expectations.

## packages/fresh — Fresh app telemetry defaults reserved (`fresh-app-telemetry-defaults`)

- **Reason:** `defineFreshApp` accepts `telemetry` / `FreshAppTelemetryOptions` as a forward
  compatibility seam, but Fresh app bootstrap telemetry defaults are not active yet.
- **Owner:** Fresh telemetry follow-up.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when Fresh app bootstrap telemetry is implemented and the Web Layer server docs
  describe emitted spans rather than reserved options.

## packages/workers — non-Deno task runtimes are not permission-sandboxed (`workers-non-deno-task-sandbox-boundary`)

- **Reason:** `.permissions(...)` compiles into Deno `--allow-*` flags only for `runtime("deno")`.
  Python, .NET, shell, PowerShell, cmd, executable, and custom subprocess runtimes inherit the
  worker host's OS privileges unless the caller adds an external sandbox.
- **Owner:** Workers runtime hardening follow-up.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when non-Deno task runtimes have a documented, enforced per-task sandbox or the
  public task runtime API explicitly models this as a permanent trust boundary.

## packages/workers — scaffold createJobTools handler helpers are no-op stubs (`workers-scaffold-job-tools-noop`)

- **Reason:** The scaffold-generated worker handler toolkit `createJobTools(ctx)` exposes
  `trace.addEvent`, `withChildSpan`, and `progress` helpers that are currently no-op stubs.
  Job-level telemetry is real — dispatch, execution, step events, progress, scheduler runs, and
  subprocess trace continuation emit OpenTelemetry spans visible in Aspire (OTLP
  `http://localhost:4318`). Only these in-handler scaffold helpers do not yet emit; their signatures
  are stable, so handler code written against them keeps compiling and will start emitting once the
  helpers are implemented. For custom handler spans today, call `@netscript/telemetry` helpers
  directly.
- **Owner:** `@netscript/plugin-workers-core` / scaffold telemetry follow-up.
- **Target:** Before advertising in-handler `createJobTools` span/event/progress emission as
  supported.
- **Linked plan:** `.llm/tmp/run/docs-v4-ia-deepening/caveat-inventory.md` (Cluster C).
- **Created:** 2026-06-22
- **Status:** open.
- **Gate:** Close when `trace.addEvent` / `withChildSpan` / `progress` from `createJobTools(ctx)`
  emit real spans/events and a runtime test proves a handler-emitted child span reaches the OTLP
  collector.

## packages/auth-{better-auth,workos} — Archetype-2 folder layout + WorkOS feature-surface parity (`AUTH-ARCHETYPE-LAYOUT`)

- **Reason:** A user review (2026-06-22) flagged two related gaps in the landed auth backends that
  existing auth-debt entries do not cover:
  - **(L) Archetype-2 folder layout non-conformance.** Both `@netscript/auth-better-auth` and
    `@netscript/auth-workos` declare **Archetype-2 (Integration)** in their READMEs but do not
    follow the canonical layout from `.llm/harness/archetypes/ARCHETYPE-2-integration.md` / doctrine
    `04`/`05`:
    - Composition-root factories (`createBetterAuthBackend`, `createWorkosBackend`,
      `createNetscriptBetterAuth`, `createWorkos*Authenticator`) live directly in top-level
      `src/better-auth-backend.ts` / `src/workos-backend.ts` / `src/workos-authenticator.ts` instead
      of `src/application/create-*.ts`.
    - Domain types (e.g. `BetterAuthSessionPayload`, `WorkosSessionAuthenticationSuccess`) are
      inline in the backend files instead of `src/domain/types.ts`.
    - No `src/testing/` test doubles are exported, so consumers must hand-mock `BetterAuthInstance`
      / the WorkOS session client themselves.
    - `src/ports/` is **legitimately** omitted (the consumed port `AuthBackendPort` lives in the
      consuming `@netscript/plugin-auth-core`, per the doctrine "port lives in the consumer" rule),
      and the one-adapter-per-package shape correctly skips an `adapters/` split — but neither
      omission is documented in the package, which is what makes the layout read as "confusing."
      This is the folder-layout dimension; it is distinct from (and complements) the existing
      `auth layer — AS7 documentation architecture metadata` entry (missing `Archetype: <n>` token /
      `docs/architecture.md`) and `AS2-CONSOLIDATION` (duplicated error/token helpers).
  - **(P) WorkOS feature-surface parity.** The `seamless better-auth integration roadmap` (R0–R5)
    gave `auth-better-auth` a `plugins`/`betterAuthOptions` passthrough (R0, commit `539b808b`) plus
    a tracked program for schema-gen, interactive-flow, org primitives, and a fluent `defineAuth()`
    builder. `auth-workos` received **no equivalent program**. The likely justification is
    structural — WorkOS AuthKit is a managed hosted service with a fixed API and no
    better-auth-style plugin ecosystem to pass through — so a 1:1 "plugins passthrough" is not
    meaningful. **However**, WorkOS exposes rich product surface (organizations, SSO connections,
    directory sync / SCIM, MFA, audit logs) that NetScript currently surfaces only as a pure backend
    (sealed sessions + JWT/JWKS verification). Whether those warrant a parallel WorkOS
    feature-surfacing / parity program (or an explicit "WorkOS is intentionally backend-only"
    doctrine note) is an **open question to resolve**, not a settled non-gap.
- **Owner:** Track-5 auth-plugin program / auth-layer doctrine follow-up.
- **Target:** Fold (L) into the next auth-layer doctrine-conformance run (alongside
  `AS2-CONSOLIDATION` and the AS7 metadata warnings — they share the same packages and a single
  refactor pass can close all three). Resolve (P) as a user-facing parity decision before the auth
  beta documentation freeze.
- **Linked entries:** `seamless better-auth integration roadmap` (R0–R5), `AS2-CONSOLIDATION`,
  `auth layer — AS7 documentation architecture metadata warnings`.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED — recorded at user direction ("record it in arch debt for now and
  take care of that later") during the JSR-readiness umbrella merge/cleanup pass. Recording only; no
  refactor in this pass. Both packages compile/test/lint/fmt clean with the current layout.
- **Gate:** Close (L) when `auth-better-auth` and `auth-workos` either match the Archetype-2 layout
  (`src/application/create-*.ts`, `src/domain/types.ts`, `src/testing/` fakes) or carry a documented
  in-package justification for each omission, with `deno task arch:check` green. Close (P) when the
  WorkOS feature-surface decision is recorded (either a parity program is planned or an explicit
  backend-only scope note lands in the package README + auth doctrine).

## docs tutorials/erp-sync/02-import-job — hand-rolled CSV parsing instead of @std/csv or in-memory DuckDB (`TUTORIAL-CSV-PARSE`)

- **Reason:** A user review (2026-06-22) flagged that the published ERP-sync tutorial step
  `tutorials/erp-sync/02-import-job` (live at
  `https://rickylabs.github.io/netscript/tutorials/erp-sync/02-import-job/`) demonstrates **manual,
  hand-written CSV parsing** (e.g. `split('\n')` / `split(',')`-style field slicing). This models a
  bad practice for readers: hand-rolled CSV parsing silently mishandles quoted fields, embedded
  commas/newlines, escaped quotes, BOM, and delimiter variation. The tutorial is a teaching surface,
  so the pattern propagates to user code.
- **Recommended fix (depends on task complexity):**
  - **Simple parse:** use the standard library — `@std/csv` (`parse` / `CsvParseStream`), which
    correctly handles RFC-4180 quoting/escaping and streams. This is the "wrap, don't reinvent"
    doctrine default (Web/`@std` first).
  - **Heavier/analytical import:** use **in-memory DuckDB** via the Node-Neo client
    (`@duckdb/node-api`) — `https://duckdb.org/docs/current/clients/node_neo/overview` and its CSV
    reader `https://duckdb.org/docs/current/data/csv/overview` (`read_csv` auto-detects schema,
    types, delimiters; runs SQL over the file). Appropriate when the import job does filtering,
    typing, joins, or aggregation rather than a trivial row pass-through. An ERP "import job" that
    validates/transforms rows is squarely in this category.
- **Owner:** Docs tutorials track (ERP-sync tutorial author) + a follow-up decision on whether the
  framework should offer a first-class CSV/file-import helper or recommend DuckDB-in-memory as the
  canonical analytical-import path.
- **Target:** Next docs tutorial-accuracy pass (alongside any tutorial code-quality sweep). Confirm
  the exact source file under `docs/site/tutorials/erp-sync/02-import-job/` (deploy branch) when the
  fix is scheduled — this entry records the observation; the precise code block is to be located at
  fix time.
- **Created:** 2026-06-22.
- **Status:** open, DEBT_ACCEPTED — recorded at user direction during the JSR-readiness umbrella
  merge/cleanup pass. Recording only; no tutorial edit in this pass.
- **Gate:** Close when the import-job tutorial step parses CSV via `@std/csv` (simple case) or
  in-memory DuckDB `read_csv` (analytical case) instead of hand-rolled string splitting, and the
  surrounding prose explains the choice.

## plugin-workers-core + plugin-triggers-core — CRON-SUBSYSTEM-DUP (workers `.schedule()` vs triggers `defineScheduledTrigger`)

- **Reason:** Two parallel cron subsystems exist with no unification. Workers
  `defineJob().schedule(cron)` flows through `JobBuilder.schedule()` → `JobDefinition.schedule`
  field → in-process `Scheduler` class → `@netscript/cron`. Triggers `defineScheduledTrigger()`
  flows through `CronTriggerSchedulerAdapter` → `@netscript/cron`. They are NOT equivalent: separate
  runtime adapters, separate scaffolds (`job-scaffolders.ts:64-65` vs
  `trigger-scaffolders.ts:86-88`), separate CLI flags, separate docs, and
  `plugins/workers/deno.json` has NO dependency on `@netscript/plugin-triggers-core`. The workers
  `.schedule()` builder method is marked
  `@deprecated → defineScheduledTrigger(...).enqueueJob(...)`, but that path does NOT yet replace
  in-process cron job scheduling — so `.schedule()` is a **live feature, not a removable shim**.
- **Why it is debt:** PR-B slice S3b originally claimed the trigger path replaces `.schedule()`.
  PLAN-EVAL cycle 1 (openhands-run-27986503722-1) proved that false against the tree. Removing the
  workers `schedule` field/method/Scheduler/scaffold/CLI/docs with no replacement would orphan a
  documented public capability. Correct sequencing: unify the two cron subsystems (or formally bless
  one) FIRST, then retire the other's surface.
- **Decision needed from maintainer (only user-blocking item):** which cron subsystem is canonical —
  (a) keep workers in-process `Scheduler` and undeprecate `.schedule()`; (b) make
  `defineScheduledTrigger` the single canonical path + build a real migration (workers depends on
  triggers-core, scaffold/CLI/docs rewrite, working delegation shim) before any removal; or (c) keep
  both as intentional distinct capabilities (in-process cron vs durable trigger) and drop the
  `@deprecated` tag on `.schedule()`.
- **Owner:** Framework architecture (maintainer call).
- **Target:** Pre-1.0; must precede any workers `.schedule()` surface removal. EXCLUDED from PR-B
  (#113) and PR-C (alpha-1 legacy purge).
- **Linked plan:** `.llm/tmp/run/chore-alpha1-jsr-shim-removal/drift.md` (2026-06-22 cycle-1 +
  2026-06-23 option-(b) deferral).
- **Created:** 2026-06-23
- **Status:** open, DECISION_PENDING — recorded under the overnight don't-block mandate so the
  alpha-1 zero-legacy / JSR-readiness program proceeds without halting on this redesign.
- **Gate:** none (record-only until the maintainer decision; a future unification run selects
  gates).

## repo-wide — RUN-ARTIFACT-ARCHIVAL-POLICY (`.llm/tmp/run/` evidence tonnage)

- **Reason:** `.llm/tmp/run/` carries large tracked harness-evidence volume. The bulk is durable by
  doctrine but dominated by completed or closed programs: OpenHands PR-eval traces, completed
  package-quality wave run directories, and one-off evaluator archives. `.gitignore` ignores runtime
  `.llm/tmp/openhands/` scratch but intentionally tracks `.llm/tmp/run/openhands/` as durable
  evidence.
- **Why it is debt:** this is doctrine-tracked evidence, not junk. Bulk removal needs a retention
  policy, not a blind sweep. Candidate policies include pruning run dirs for PRs merged or closed
  past a fixed age while keeping verdict artifacts, or moving historical run evidence to an archive
  ref.
- **Decision needed from maintainer:** define and apply a retention policy, move historical run
  evidence to an archive branch/ref, or keep all run evidence tracked and accept the volume.
- **Owner:** Harness/process.
- **Target:** Before JSR publish slim-down / task #36 lock-hygiene pass.
- **Created:** 2026-06-23.
- **Status:** open, DECISION_PENDING.
- **Gate:** none until policy is chosen.

## packages/fresh — PAGEBUILDER-LEGACY-COMPAT-TREE (`@netscript/fresh/builders` `PageBuilder`)

- **Reason:** `packages/fresh/src/application/builders/define-page/page-compat.ts` plus
  `page-compat/**` is a public "legacy page-builder compatibility types" tree kept beside the
  successor `DefinePageBuilder`. It is re-exported through the builders surface and asserted in
  surface tests.
- **Why it is debt:** removing `PageBuilder` is a deliberate public API break, not mechanical
  hygiene. It requires dropping the export, the compatibility tree, and the surface-test rows.
- **Decision needed from maintainer:** deprecate now and schedule removal for a later alpha, break
  now in the alpha zero-legacy sweep, or keep both as intentional parallel builder surfaces.
- **Owner:** Fresh framework architecture.
- **Target:** Pre-1.0.
- **Created:** 2026-06-23.
- **Status:** open, DECISION_PENDING.
- **Gate:** If removed, scoped check/lint/fmt plus `deno doc --lint` for Fresh, surface-test update,
  `arch:check`, `publish:dry-run`, and a named grep over templates/docs/scaffold for `PageBuilder`.

## packages/fresh — FORMPAGEPROPS-PLAYGROUND-MIGRATION (`FormPageProps` transitional type)

- **Reason:** `FormPageProps` is a live transitional page-form props type consumed by playground
  routes while they migrate from legacy page builders. It is not a removable shim while those routes
  still depend on it.
- **Decision needed from maintainer:** schedule and complete the playground form migration off
  legacy page builders, then retire `FormPageProps`. Tie sequencing to
  `PAGEBUILDER-LEGACY-COMPAT-TREE`.
- **Owner:** Fresh framework architecture.
- **Target:** Pre-1.0, after the page-builder decision.
- **Created:** 2026-06-23.
- **Status:** open, DECISION_PENDING.
- **Gate:** none until migration is scheduled.

## packages/kv — REDIS-LEGACY-VALUE-FALLBACK (pre-`StoredValue` envelope read path)

- **Reason:** `packages/kv/adapters/redis.adapter.ts` has a fallback for values stored before the
  current `StoredValue<T>` envelope write path.
- **Why it is debt:** removing the fallback can break reads of old un-enveloped Redis data. This is
  a data-migration concern, not pure hygiene.
- **Decision needed from maintainer:** keep the fallback, ship a one-time backfill that rewrites
  legacy values into the envelope and remove the fallback later, or declare a hard pre-1.0 data
  break and remove now.
- **Owner:** KV package + data-migration.
- **Target:** Pre-1.0.
- **Created:** 2026-06-23.
- **Status:** open, DECISION_PENDING.
- **Gate:** If removed, scoped check/lint/fmt, `deno task test` for KV, and a Redis read-compat test
  note.

## repo-wide — DEBT-1 version timing (`0.0.1-alpha.0` lockstep)

- **Reason:** PR-C removes public alpha-era compatibility surfaces, but per-package version bumps
  would break the repository's lockstep package version scheme.
- **Decision:** Hold all packages at `0.0.1-alpha.0` during this purge. The repo-wide breaking bump
  lands once during JSR publish preparation instead of per package/per slice.
- **Owner:** Release/JSR publish preparation.
- **Target:** JSR publish prep / task #36.
- **Created:** 2026-06-23.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when the repo-wide lockstep alpha version bump lands with the release notes that
  call out the PR-C breaking removals.

## cli e2e — DEBT-2 db-init e2e flake (pre-existing)

- **Reason:** The scaffold runtime/db-init lane has a known pre-existing flake observed during the
  alpha/JSR readiness program. GitHub Actions scaffold-runtime evidence was green separately, so
  this purge should not silently broaden scope to debug the flake.
- **Owner:** CLI E2E / scaffold runtime maintainers.
- **Target:** Follow-up stabilization task #68.
- **Created:** 2026-06-23.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when the db-init scaffold runtime E2E is deterministic across local WSL and GitHub
  Actions, with raw exit-code evidence recorded on the follow-up task/PR.

## packages/cli — scaffolded `aspire/package.json` ships no companion lock (`scaffold-aspire-npm-island-no-lock`)

- **Reason:** The CLI scaffold's TypeScript AppHost generator
  (`packages/cli/src/kernel/.../render-ts-apphost.ts:51-77`) emits an `aspire/package.json` npm
  island into generated projects with no companion lockfile (`package-lock.json` / `deno.lock`).
  Consumers must run a manual `npm install` in `aspire/` before the AppHost resolves, and the
  install is unpinned. This is a pre-existing generated-project DX gap, unrelated to the Deno 2.9
  toolchain adoption — Deno 2.9's lock/install changes do not seed a lock for an emitted npm
  package that has no foreign lock to import. The Deno 2.9 adoption plan (D5) decided this gap
  out-of-scope; this entry makes that "pre-existing arch-debt" citation verifiable per PLAN-EVAL
  finding F-3.
- **Owner:** CLI scaffold / Aspire AppHost generator maintainers.
- **Target:** Before advertising the generated TS AppHost as zero-manual-step; revisit alongside the
  generated-project task DX follow-up (Deno 2.9 plan C6).
- **Linked plan:** `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/plan.md` (D5);
  `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/research.md` (npm-island note).
- **Created:** 2026-06-25.
- **Status:** open, DEBT_ACCEPTED.
- **Gate:** Close when the scaffolded `aspire/package.json` ships with a pinned companion lock (or
  the npm island is removed) so a generated AppHost resolves without an unpinned manual
  `npm install`.
