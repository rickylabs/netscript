# IMPL-EVAL Run Summary

## Summary

Executed IMPL-EVAL evaluation for PR #172 adapter relocation + `@netscript/kv` migration on branch `feat/scaffold-surface-167`. Verified five commits against the live tree: `6e907b4b` (S-b sagas), `6c8769c4` (S-c triggers), `87ecf8e6` (S-d workers), `6c7cdd8a` (docs), and `36d44f7c` (auth gate-fix). Evaluated against approved plan.md locked decisions (D-KV, D2, D3, D4), slice definitions (S-b/S-c/S-d incl. S-b.5/S-c.5), and risk register (R1–R5).

**Verdict: ✅ PASS** — All six verification categories satisfied. No blocking issues found.

## Changes

### Files Read
- `.agents/skills/netscript-harness/SKILL.md` — harness orchestration, evaluator protocol, verdict definitions
- `.agents/skills/netscript-doctrine/SKILL.md` — archetype-5 connectors, layering, fitness gates
- `.agents/skills/netscript-deno-toolchain/SKILL.md` — `deno doc`/`deno why` for migrated stores
- `.agents/skills/jsr-audit/SKILL.md` — publish bar for triggers-core `--allow-slow-types`
- `.llm/harness/evaluator/protocol.md` — IMPL-EVAL protocol
- `.llm/harness/evaluator/verdict-definitions.md` — verdict rules (PASS/FAIL_FIX/FAIL_RESCOPE/FAIL_DEBT)
- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/plan.md` — locked D-KV/D2/D3/D4, slices S-b/S-c/S-d, risks R1–R5
- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/plan-eval.md` — cycle-2 PASS
- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/worklog.md` — gate evidence
- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/commits.md` — commit list
- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/drift.md` — scope drift
- Git commit stats: `6e907b4b`, `6c8769c4`, `87ecf8e6`, `6c7cdd8a`, `36d44f7c`

### Files Verified (Live Tree Inspection)
- **KV migration soundness:**
  - `packages/plugin-sagas-core/src/stores/kv-saga-store.ts` — confirmed `@netscript/kv` imports, zero `Deno.openKv`
  - `packages/plugin-sagas-core/src/stores/kv-saga-runtime-stores.ts` — confirmed `@netscript/kv` imports, zero `Deno.openKv`
  - `packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts` — confirmed `@netscript/kv` imports, zero `Deno.openKv`
  - `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts` — confirmed `@netscript/kv` imports
  - `packages/plugin-sagas-core/src/stores/kv-saga-store_test.ts` — confirmed `DenoKvAdapter` test (line 111)
  - `packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores_test.ts` — confirmed `MemoryKvAdapter` imports
  - `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store_test.ts` — confirmed `MemoryKvAdapter` imports
  - `packages/plugin-triggers-core/src/testing/deno-kv-trigger-event-store-double.ts` — confirmed S-c.5 rename target
  - `packages/plugin-workers-core/src/domain/job-spec.ts` — confirmed pre-existing `Deno.KvKeyPart` (out of S-d scope)

- **Relocation correctness:**
  - `packages/plugin-sagas-core/src/stores/` — confirmed target layout (7 files + mod.ts)
  - `packages/plugin-triggers-core/src/{stores,adapters}/` — confirmed target layout (3 stores + 2 adapters + mod.ts)
  - `packages/plugin-workers-core/src/stores/` — confirmed target layout (2 files + mod.ts)
  - `plugins/sagas/src/runtime/mod.ts` — confirmed connector `./runtime` re-export dropped (no `KvSagaStore`, `PrismaSagaStore`, `resolveSagaStoreBackend`)
  - `plugins/triggers/src/runtime/mod.ts` — confirmed connector `./runtime` re-export dropped (no `KvTriggerEventStore`, `KvTriggerIdempotencyStore`, `KvTriggerDlqStore`, `CronTriggerSchedulerAdapter`, `WatchersFileWatcherAdapter`)
  - `plugins/workers/worker/mod.ts` — confirmed connector re-export dropped (no `KvWorkerIdempotencyStore`)
  - `plugins/sagas/services/src/main.ts` — confirmed composition root imports from `@netscript/plugin-sagas-core/stores`
  - `plugins/triggers/services/src/main.ts` — confirmed composition root imports from `@netscript/plugin-triggers-core/{stores,adapters}`
  - `plugins/workers/services/src/service-runtime.ts` — confirmed composition root imports from `@netscript/plugin-workers-core/stores`

- **S-b.5 / S-c.5 fence + rename:**
  - `docs/site/capabilities/durable-sagas.md` (lines 331-345) — confirmed fence split (`resolveSagaStoreBackend` imports from `-core/stores`, `createDurableSagaRuntime` stays in connector `/runtime`)
  - `packages/plugin-triggers-core/src/testing/deno-kv-trigger-event-store-double.ts` — confirmed S-c.5 rename target
  - Grep verification: zero stale refs to old `kv-trigger-event-store.ts` filename, zero relocated-symbol imports via connector `/runtime` path

- **Gate change `36d44f7c` soundness:**
  - `git show 36d44f7c -- .llm/tools/fitness/check-doctrine.ts` — confirmed scope (check-doctrine.ts + arch-debt.md + run artifacts only, no auth production/test source)
  - `.llm/tools/fitness/check-doctrine.ts` (lines 144, 151, 165) — confirmed auth contract-cast regex correction + test-path exemption

- **Gates green:**
  - `deno task arch:check` — executed live, EXIT=0, all 13 roots FAIL=0 (captured to `/tmp/arch_check.log`)

### Files Written
- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/evaluate.md` — full IMPL-EVAL verdict with six verification categories
- **PR comment:** https://github.com/rickylabs/netscript/pull/172#issuecomment-4839377288 — verdict summary posted to #172

## Validation

### Verification 1: KV Migration Soundness (R3 Hard Stop) — ✅ PASS
**Method:** `grep` over production stores (`packages/plugin-{sagas,triggers,workers}-core/src/stores/*.ts` excluding `_test.ts`) for `Deno.openKv` / `Deno.Kv` / `Deno.KvKey` escape hatches.

**Result:** Zero matches in production code. All three migrated stores use `@netscript/kv` exclusively:
- `kv-saga-store.ts:2-3`: `import { getKv } from '@netscript/kv'; import type { AtomicMutation, KvKey, KvStore } from '@netscript/kv';`
- `kv-trigger-runtime-stores.ts:1-2`: same pattern
- `kv-worker-idempotency-store.ts:8`: same pattern

**Semantic preservation:** Inspected `kv-saga-store.ts:66-69` (atomic CAS with `versionstamp`), `kv-saga-store.ts:105-111` (prefix scan with `list({prefix})`), `kv-trigger-runtime-stores.ts:129-141` (idempotency with three-tier active/completed keys). All preserve optimistic-concurrency + idempotency + prefix-scan semantics.

**Engine-agnostic tests:** Confirmed `MemoryKvAdapter` usage in test files:
- `packages/plugin-sagas-core/src/stores/kv-saga-store_test.ts:4`
- `packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores_test.ts:3`
- `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store_test.ts:2`

### Verification 2: Relocation Correctness — ✅ PASS
**Method:** Directory listing of target folders (`packages/plugin-{sagas,triggers,workers}-core/src/{stores,adapters}/`) + inspection of connector `mod.ts` files and composition roots.

**Result:** All four store/adapter sets landed in correct `-core/{stores,adapters}` folders:
- sagas: 7 files in `plugin-sagas-core/src/stores/`
- triggers: 3 files in `plugin-triggers-core/src/stores/`, 2 files in `plugin-triggers-core/src/adapters/`
- workers: 2 files in `plugin-workers-core/src/stores/`

Connector `./runtime` re-exports dropped (D4 zero-compat honored):
- `plugins/sagas/src/runtime/mod.ts` — no store exports
- `plugins/triggers/src/runtime/mod.ts` — no store/adapter exports
- `plugins/workers/worker/mod.ts` — no store exports

Composition roots import from `-core` (no connector→core leak):
- `plugins/sagas/services/src/main.ts` — imports from `@netscript/plugin-sagas-core/stores`
- `plugins/triggers/services/src/main.ts` — imports from `@netscript/plugin-triggers-core/{stores,adapters}`
- `plugins/workers/services/src/service-runtime.ts:8` — `import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';`

### Verification 3: S-b.5 / S-c.5 Fence + Rename — ✅ PASS
**Method:** Inspect `docs/site/capabilities/durable-sagas.md:331-345` + grep for stale refs.

**Result:**
- S-b.5 fence split: `resolveSagaStoreBackend` imports from `@netscript/plugin-sagas-core/stores` (line 334), `createDurableSagaRuntime` stays in `@netscript/plugin-sagas/runtime` (line 333)
- S-c.5 rename: `packages/plugin-triggers-core/src/testing/deno-kv-trigger-event-store-double.ts` exists (S-c.5 rename target)
- Zero stale refs: `grep -rn "kv-trigger-event-store\." packages/plugin-triggers-core/` → exit 1 (zero matches)
- Zero relocated-symbol imports via connector `/runtime` path: confirmed via inspection

### Verification 4: Gate Change `36d44f7c` Soundness — ✅ PASS
**Method:** `git show 36d44f7c -- .llm/tools/fitness/check-doctrine.ts` + inspection of diff.

**Result:** Scope held to fitness gate + run records:
- Changed files: `.llm/tools/fitness/check-doctrine.ts`, `.llm/harness/debt/arch-debt.md`, run artifacts
- No auth production source or auth test source modified
- `check-doctrine.ts:144` — corrected contract-cast allow-list regex from `/\bas\s+unknown\s+as\s+AuthContractV1\b/` to `/\}\s+as\s+unknown\s+as\s+Parameters\s*<\s*typeof\s+oc\.errors\s*>\s*\[0\]/` (matches actual sanctioned site at `auth.contract.ts:177`)
- `check-doctrine.ts:151,165` — added test-path exemptions (`/tests/`, `_test.ts`, `.test.ts`) for auth cast + `@ts-*` checks

Production auth source remains fully gated (no soundness regression).

### Verification 5: Gates Green — ✅ PASS
**Method:** Live execution of `deno task arch:check` + inspection of worklog evidence.

**Result:**
- `deno task arch:check` — EXIT=0, all 13 roots FAIL=0 (log captured to `/tmp/arch_check.log`)
- Scoped check/lint/fmt: worklog confirms exit 0 for all touched roots (sagas-core, sagas plugin, triggers-core, triggers plugin, workers-core, workers plugin)
- `deno test --unstable-kv`: worklog confirms sagas 75 passed, triggers 32 passed (12 ignored), workers 45 passed
- Dry-runs: worklog confirms warning-only (triggers-core `--allow-slow-types` preserved, no new slow types)
- `deno.lock`: worklog confirms no hand-edit, only workspace-dep additions
- Zero new production `any`/casts: confirmed via grep (only 2 sanctioned categories: auth contract cast + plugin-auth router exemplar)

### Verification 6: Scope Discipline — ✅ PASS
**Method:** Inspect plan.md scope boundaries + grep for out-of-scope additions.

**Result:**
- streams/auth out of scope: no streams/auth files in S-b/S-c/S-d commits
- Triggers feature-backing routes (#181 / `TRIGGERS-CONNECTOR-DEFERRED-ROUTES`) NOT folded in: `grep -rn "TRIGGERS-CONNECTOR-DEFERRED-ROUTES\|#181" packages/plugin-triggers-core/src plugins/triggers/src` → exit 1 (zero matches)
- Net-new triggers-core feature-backing routes not present

## Remaining Risks

All accepted per approved plan.md:

- **R1 — D2 zero-compat surface break:** Mitigated by S-b.5 doc-fence split. Accepted under alpha zero-compat policy (userland consumers documented in PR + arch-debt).
- **R2 — `KvTriggerEventStore` name collision:** Resolved by S-c.5 rename to `DenoKvTriggerEventStoreDouble`. Zero stale refs confirmed.
- **R3 — KV-migration semantic drift:** Mitigated by dual-backend tests (Deno-KV + `MemoryKvAdapter`). `@netscript/kv` `KvStore.atomic`/`list({prefix})` express required semantics (CAS + prefix scan).
- **R4 — arch:check denominator:** Closed by commit `e999a9ea` (S5a-2). All 13 roots FAIL=0 confirmed live.
- **R5 — lock churn:** Expected workspace-dep addition (`@netscript/kv`, `@netscript/cron`, `@netscript/watchers`). No hand-edit. Delta reported in worklog.

**No blocking residual risks. Ready to merge into `feat/scaffold-surface-167` for #173 adversarial E2E + IMPL-EVAL.**
