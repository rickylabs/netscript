# #172b/c/d Adapter Relocation + Primitive Migration — Plan

Branch: `feat/scaffold-surface-167` (PR #172). Depends-on: research.md (relocation map + dep facts +
`@netscript/kv` surface). Archetype: ARCHETYPE-5 connectors + sibling ARCHETYPE-2/3 `-core` packages.
Skills: `netscript-doctrine`, `jsr-audit`, `netscript-harness`. **PLAN-EVAL gate: hard stop — no slice
before PASS.**

## Scope

Two coupled objectives, completing the #172 thin-connector convergence:

1. **Relocate** reusable runtime stores/adapters from three connectors (`plugins/{sagas,triggers,
   workers}/src/runtime/`) into their `-core` packages, so each connector keeps **specifics only**.
2. **Migrate** the sagas + triggers KV stores off raw `Deno.Kv`/`Deno.openKv` onto the engine-agnostic
   `@netscript/kv` primitive, matching the workers `KvWorkerIdempotencyStore` reference. This unblocks
   Redis / in-memory / kvdex / reactive-watch backends for every KV-backed plugin, instead of locking
   them to Deno KV.

streams/auth are out of scope (no relocatable runtime adapters).

## Guiding principle (replaces the prior "D1" decision)

`@netscript/plugin-<kind>-core` **should** depend on NetScript primitives (`@netscript/kv`,
`@netscript/cron`, `@netscript/watchers`). Building on first-party primitives instead of hand-rolling
backends is the encouraged reference behavior we want community plugin/plugin-core authors to copy
(operating rule 3: "Wrap, do not reinvent"; the plugin-thinness/core-centralization law). There is **no**
"minimize `-core` deps" rule — a prior draft invented one and a relocate-vs-split "D1-A/D1-B" tradeoff;
both are deleted. Adding `@netscript/*` deps to `-core` is the intended outcome.

## Locked decisions (PLAN-EVAL to ratify or reject)

- **D-KV (primitive migration) → adopt `@netscript/kv` for sagas + triggers KV stores.** Rewrite
  `KvSagaStore`/`openSagaRuntimeKv`, `KvSagaAppliedKeyStore`/`KvSagaIdempotencyStore`, and the triggers
  `KvTriggerEventStore`/`KvTriggerIdempotencyStore`/`KvTriggerDlqStore` to depend on `@netscript/kv`
  (`KvStore` interface + `AtomicCheck`/`AtomicMutation`/`AtomicResult` types), receive the store handle
  by injection (engine selected at the composition root via `getKv()`/adapter/config), and mirror the
  workers structural-port pattern. The Deno-native optimistic-concurrency check
  (`kv.atomic().check({key,versionstamp}).set().commit()`) ports to `atomic(checks, mutations)`;
  prefix iteration uses `KvStore.list({prefix})`. Implementer must confirm the chosen `KvStore`/adapter
  exposes `list` + `atomic` with versionstamp checks before locking the port shape (workers proved
  get/set/delete/has/atomic; saga adds list).
- **D2 (surface break) → zero-compat, no shim.** Stores move from `@netscript/plugin-<kind>/runtime`
  to `@netscript/plugin-<kind>-core/{stores,adapters}`. Per alpha zero-compat the connector `./runtime`
  re-export drops them. Pre-flight grep (research.md "Pre-flight verification") found **exactly one**
  first-party consumer that imports a relocated symbol via the connector path:
  `docs/site/capabilities/durable-sagas.md:331` (a `{{ comp.tabbedCode }}` fence importing
  `resolveSagaStoreBackend` — D3-relocated — alongside `createDurableSagaRuntime`, which stays). Every
  other `@netscript/plugin-<kind>/runtime` reference imports symbols that STAY
  (`createDurableSagaRuntime`/`createSagaPublisher`) or is prose / a connector-internal manifest, so it
  is unaffected. Reference-page store mentions are the PORT interfaces (already in `-core/ports`), not
  the relocated concrete stores. The one broken fence is fixed in slice sub-step **S-b.5** (split the
  import; no shim). The break is recorded in the PR + arch-debt.
- **D3 (`saga-store-backend.ts`) → relocate to `-core/src/stores/`.** Env-driven backend selection over
  the core store classes is reusable composition and references the relocated classes, so it follows
  them. The connector keeps only the *call* to `resolveSagaStoreBackend` in its composition root.
- **D4 (re-export ergonomics) → userland/connector imports stores from `-core` directly.** Connector
  does NOT re-surface a `./runtime` store re-export (thinness). Connector composition root imports from
  `@netscript/plugin-<kind>-core/{stores,adapters}`.

## Target layout

- sagas: `prisma-saga-store.ts`, `kv-saga-store.ts`, `kv-saga-runtime-stores.ts`,
  `saga-store-backend.ts` → `packages/plugin-sagas-core/src/stores/` (extend existing `./stores`
  barrel). KV stores rewritten onto `@netscript/kv`. Add `@netscript/kv` to sagas-core `deno.json`
  imports. Connector composition root imports from `@netscript/plugin-sagas-core/stores`.
- triggers: `kv-trigger-runtime-stores.ts` → `packages/plugin-triggers-core/src/stores/` (new barrel +
  `./stores` export), rewritten onto `@netscript/kv`; `cron-trigger-scheduler-adapter.ts`,
  `watchers-file-watcher-adapter.ts` → `packages/plugin-triggers-core/src/adapters/` (extend existing
  `./adapters` barrel). Add `@netscript/kv` + `@netscript/cron` + `@netscript/watchers` to triggers-core
  `deno.json` imports.
- workers: `worker-idempotency-store.ts` → `packages/plugin-workers-core/src/stores/` (or `adapters/`).
  Already on `@netscript/kv`; add `@netscript/kv` to workers-core `deno.json` imports.

## Slices (dependency-ordered, each: commit → push → PR comment → commits.md)

1. **S-b sagas** — sub-steps:
   - S-b.1 relocate `prisma-saga-store.ts` (dep-free structural delegate) into `-core/src/stores/`.
   - S-b.2 relocate + rewrite `kv-saga-store.ts` (`KvSagaStore`/`openSagaRuntimeKv`) and
     `kv-saga-runtime-stores.ts` (`KvSagaAppliedKeyStore`/`KvSagaIdempotencyStore`) onto `@netscript/kv`
     (D-KV); add `@netscript/kv` to `packages/plugin-sagas-core/deno.json` imports.
   - S-b.3 relocate `saga-store-backend.ts` (`resolveSagaStoreBackend`) into `-core/src/stores/`; extend
     the `./stores` barrel; the connector keeps only the *call* in its composition root.
   - S-b.4 rewrite the connector composition root to import from `@netscript/plugin-sagas-core/stores`;
     drop the connector `./runtime` store re-exports (D4).
   - **S-b.5 doc-fence rewire (D2 surface fix):** edit `docs/site/capabilities/durable-sagas.md:331`
     so `resolveSagaStoreBackend` imports from `@netscript/plugin-sagas-core/stores` while
     `createDurableSagaRuntime` keeps importing from `@netscript/plugin-sagas/runtime` (split the
     fence's `import { … }`). No shim. Then re-run the connector-path grep across
     `docs/ops/e2e/tests/packages/{cli,sdk,service,plugin}/plugins-services`; paste the resulting
     **zero-match** for relocated symbols into `worklog.md`.
   - S-b.6 move the store tests with the files + add a `MemoryKvAdapter`-backed test proving
     engine-agnostic behavior.
   - Gates: scoped check/lint/fmt on `packages/plugin-sagas-core` + `plugins/sagas`; `deno test
     --unstable-kv --allow-all`; `deno publish --dry-run --allow-dirty` (no new slow types); arch:check.
2. **S-c triggers** — sub-steps:
   - S-c.1 relocate + rewrite `kv-trigger-runtime-stores.ts` (`KvTriggerEventStore`/
     `KvTriggerIdempotencyStore`/`KvTriggerDlqStore`) onto `@netscript/kv` (D-KV) into
     `-core/src/stores/` (new `./stores` barrel + export).
   - S-c.2 relocate `cron-trigger-scheduler-adapter.ts` + `watchers-file-watcher-adapter.ts` into
     `-core/src/adapters/` (extend existing `./adapters` barrel).
   - S-c.3 add `@netscript/kv` + `@netscript/cron` + `@netscript/watchers` to
     `packages/plugin-triggers-core/deno.json`; verify the 3 workspace deps resolve (`deps:why`) and the
     lock gains entries via normal resolution (no hand-edit).
   - S-c.4 rewire the connector composition root + `plugins/triggers/services/src/main.ts:39,145` (which
     constructs `new KvTriggerEventStore({ kv })`) to import the relocated store from
     `@netscript/plugin-triggers-core/stores`; drop the connector `./runtime` store re-export
     (`runtime/mod.ts:6`).
   - **S-c.5 name-collision deconflict (mandatory):** `packages/plugin-triggers-core/src/testing/
     kv-trigger-event-store.ts:5` already exports a `Deno.Kv`-typed test-double `KvTriggerEventStore`
     (re-exported `testing/mod.ts:4`), which would collide with the relocated production store. **Rename
     the testing fixture `KvTriggerEventStore` → `MemoryTriggerEventStore`** (aligns with the documented
     taxonomy in `.llm/harness/profiles/triggers/extension-axes.md:18`: `KvTriggerEventStore` is the real
     KV store; `Memory*`/`Recording*` are the test doubles). Update `testing/mod.ts:4`, every in-package
     test importer, and `extension-axes.md` if it pins the old name; then grep zero remaining
     `KvTriggerEventStore` references to the testing path. The relocated `@netscript/kv`-backed
     production store becomes the single canonical owner of the `KvTriggerEventStore` name.
   - S-c.6 add a `MemoryKvAdapter`-backed test for each migrated trigger KV store.
   - Gates as S-b; triggers-core dry-run keeps its existing `--allow-slow-types` (must not add new slow
     types).
3. **S-d workers** — relocate `worker/worker-idempotency-store.ts` (`KvWorkerIdempotencyStore`, already
   engine-agnostic) into `packages/plugin-workers-core/src/stores/`; add `@netscript/kv` to
   workers-core imports; rewire the connector composition root. Gates as above.

## Gates (merge bar)
- Per touched package: scoped `run-deno-check/lint/fmt --ext ts,tsx`, targeted tests (incl. a
  `MemoryKvAdapter`-backed store test per migrated KV store), `deno publish --dry-run --allow-dirty`.
- `deno task arch:check` — **the task now enumerates the 3 destination `-core` packages**
  (`packages/plugin-{sagas,triggers,workers}-core`) alongside `packages/plugin` + the 5 plugins, so the
  relocation's destination layering is gated, not just the connectors' (deno.json amended in commit
  `e999a9ea`, #164 S5a-2 / PLAN-EVAL fix #4; all 13 roots currently `FAIL=0`, full task EXIT=0). Layering
  bar: no connector→core leak; `-core` may import domain/ports + the primitive packages
  (`@netscript/kv`/`cron`/`watchers`).
- Zero new `any`/casts (only the 2 sanctioned repo-wide categories).
- No `deno.lock` hand-edit; new workspace deps land via normal resolution (report lock churn).
- Behavior parity: migrated KV stores keep identical optimistic-concurrency + idempotency semantics
  (the relocated tests must pass against both the Deno-KV and memory adapters).
- Final: this slice feeds the #173 adversarial E2E + IMPL-EVAL with the rest of #172.

## Risks
- **R1 — D2 surface break (zero-compat).** Dropping the stores from `@netscript/plugin-<kind>/runtime`
  breaks any importer of the old path. Mitigation: the pre-flight grep bounded the first-party blast
  radius to a single doc fence (S-b.5); userland consumers are alpha and the break is documented in the
  PR + arch-debt. *Residual:* an out-of-tree consumer not on the branch could still break — accepted
  under alpha zero-compat.
- **R2 — `KvTriggerEventStore` name collision.** The relocated production store and the existing
  testing fixture share a class name in one package. Mitigation: S-c.5 renames the fixture to
  `MemoryTriggerEventStore` per the documented taxonomy. *Risk if skipped:* a duplicate-symbol/
  shadowing defect or a silently-wrong test double; S-c.5 is mandatory and gated by the zero-ref grep.
- **R3 — KV-migration semantic drift (D-KV).** Porting the Deno-native fluent
  `atomic().check({versionstamp}).set().commit()` + `list({prefix})` onto `@netscript/kv`
  `atomic(checks, mutations)` could subtly change optimistic-concurrency or idempotency behavior.
  Mitigation: relocated tests must pass against **both** the Deno-KV and `MemoryKvAdapter` backends
  (S-b.6/S-c.6); the workers store is the proven structural-port reference. *Stop condition:* if
  `KvStore.atomic`/`list` cannot express a store's semantics, that store's migration is FAIL_PLAN — do
  not reintroduce a `Deno.openKv` escape hatch.
- **R4 — arch:check denominator.** Closed by fix #4: the 3 `-core` packages are now in the gate, so a
  post-relocation `-core` layering leak (e.g. a `-core` importing a connector) is caught. *Residual:*
  none for the relocation surface.
- **R5 — lock churn.** Three `-core` packages gain `@netscript/*` workspace deps; `deno.lock` re-resolves.
  Mitigation: no hand-edit — deps land via normal resolution; the slice reports the lock delta in the PR
  comment and `worklog.md` (per the known OpenHands lock-churn pattern).

## Debt
Arch-debt entry `PLUGIN-RUNTIME-ADAPTER-RELOCATION` records (a) the placement surface break (D2) and
(b) the KV-engine-lock defect + its migration onto `@netscript/kv` (D-KV); closes when all three slices
merge under #172.

## Design checkpoint
Every relocated/migrated file traces to a named doctrine concept: stores/adapters are ARCHETYPE-2/3
`adapters` layer artifacts binding ports to concrete backends; placing them in `-core/{adapters,stores}`
matches doctrine file 05 folder vocabulary. The KV migration replaces a hand-rolled Deno-KV binding with
the canonical `@netscript/kv` adapter port — strengthening, not introducing, layering. No new folder
roles. `-core`→primitive deps are an intended composition, not a layering violation.
