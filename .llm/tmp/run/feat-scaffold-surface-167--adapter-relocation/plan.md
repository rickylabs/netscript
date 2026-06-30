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
  re-export drops them. Pre-flight grep proves no first-party consumer (scaffold emitter, e2e, docs
  fences) imports them via the connector path; the break is recorded in the PR + arch-debt.
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

1. **S-b sagas** — relocate 4 store files into `-core/src/stores/`; rewrite `Kv*` saga stores onto
   `@netscript/kv` (D-KV); add `@netscript/kv` dep; relocate `saga-store-backend.ts`; rewrite connector
   composition root + drop connector `./runtime` store re-exports; move store tests + add a
   `MemoryKvAdapter` test proving engine-agnostic behavior. Gates: scoped check/lint/fmt on
   `packages/plugin-sagas-core` + `plugins/sagas`; `deno test --unstable-kv --allow-all`; `deno publish
   --dry-run --allow-dirty` (no new slow types); arch:check.
2. **S-c triggers** — relocate KV stores (rewrite onto `@netscript/kv`, D-KV) + cron/file-watcher
   adapters; add `@netscript/kv` + `@netscript/cron` + `@netscript/watchers` to triggers-core. Gates as
   above; triggers-core dry-run keeps its existing `--allow-slow-types` (must not add new slow types).
   Verify the 3 workspace deps resolve (deps:why) and the lock gains entries via normal resolution.
3. **S-d workers** — relocate idempotency store (already engine-agnostic), add `@netscript/kv` to
   workers-core. Gates as above.

## Gates (merge bar)
- Per touched package: scoped `run-deno-check/lint/fmt --ext ts,tsx`, targeted tests (incl. a
  `MemoryKvAdapter`-backed store test per migrated KV store), `deno publish --dry-run --allow-dirty`.
- `deno task arch:check` over plugin + the 5 plugins (layering: no connector→core leak; `-core` may
  import domain/ports + the primitive packages).
- Zero new `any`/casts (only the 2 sanctioned repo-wide categories).
- No `deno.lock` hand-edit; new workspace deps land via normal resolution (report lock churn).
- Behavior parity: migrated KV stores keep identical optimistic-concurrency + idempotency semantics
  (the relocated tests must pass against both the Deno-KV and memory adapters).
- Final: this slice feeds the #173 adversarial E2E + IMPL-EVAL with the rest of #172.

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
