# IMPL-EVAL Verdict: PASS

**PR:** #106 (docs/v3-build)  
**Branch HEAD:** 40b0d059  
**Evaluator:** IMPL-EVAL (OpenHands, separate session)  
**Date:** 2025-01-28  
**Verdict Token:** `PASS`

## Per-Item Evaluation

### 1. P1-02: Public CLI Surface ✅ PASS

**Source verification:**
- Public `netscript plugin add <pkg>` accepts only `--project-root <path>` (`packages/cli/src/public/features/plugins/dispatch/plugin-verb-command.ts:47-60`)
- Local `netscript-dev plugin add <kind> --name --samples --no-samples --force` is contributor-only (`packages/cli/src/local/features/plugins/add/add-local-plugin-command.ts:34-46`)

**Docs verification:**
- `cli-reference.md:136` — explicitly distinguishes public vs contributor flags
- `how-to/add-a-plugin.md:115` — states kind-based form is "available only in the local contributor binary `netscript-dev`, not in the public `netscript` binary"
- All public examples use valid `netscript plugin add @netscript/<pkg>` form

**Verdict:** Correct. No public docs show contributor-only flags as if public.

---

### 2. P1-03: Worker Concurrency Env ✅ PASS

**Source verification:**
- Runtime reads `WORKERS_CONCURRENCY` (note S): `plugins/workers/bin/runtime.ts:38, 81`
- Aspire metadata emits `WORKER_CONCURRENCY` (no S): `plugins/workers/src/aspire/workers-contribution.ts:56, 71, 82`

**Docs verification:**
- `how-to/tune-worker-runtime.md:190` — states runtime reads `WORKERS_CONCURRENCY` (default 1)
- `how-to/tune-worker-runtime.md:201-207` — explicitly notes mismatch: "WORKERS_CONCURRENCY (note the S) ... WORKER_CONCURRENCY (no S, value 2) via its ... WORKER_CONCURRENCY does not feed the entrypoint's WORKERS_CONCURRENCY read"
- `how-to/deploy.md:165` — documents both env vars with runtime precedence
- `tutorials/erp-sync/04-queue-and-cron.md:110-116` — explains mismatch and advises setting `WORKERS_CONCURRENCY` explicitly

**Verdict:** Correct. Mismatch documented with explicit guidance to set `WORKERS_CONCURRENCY`.

---

### 3. P1-04: Subprocess Sandbox Qualifier ✅ PASS

**Source verification:**
- Task builder `.permissions()` method: `packages/plugin-workers-core/src/builders/task-builder.ts:107-110`
- Permission flags builder: `packages/plugin-workers-core/src/adapters/deno-permissions.ts:24-67`

**Docs verification:**
- `capabilities/background-jobs.md:181` — "Strongest process isolation; only Deno tasks get permission sandboxing through .permissions(). Python, .NET, shell, PowerShell, and cmd inherit the worker process's OS permissions."
- `how-to/restrict-worker-task-permissions.md:68` — "Only the `deno` task adapter converts `permissions` into Deno `--allow-*` flags. Python, .NET, shell, PowerShell, cmd, executable, and custom task adapters inherit the worker process OS permissions unless the adapter adds its own sandbox."

**Verdict:** Correct. Qualifier accurately scoped to Deno tasks only.

---

### 4. Six New How-To Guides (Zero Invented Symbols) ✅ PASS

**Symbol verification (all verified via grep + source location):**

1. **roll-out-runtime-overrides.md** — `watchRuntimeConfig` ✓
   - Exported: `packages/runtime-config/src/application/watcher.ts:9` (re-exported via `mod.ts:45`)
   - Signature: `watchRuntimeConfig(onChange, options)`

2. **add-a-task-runtime-adapter.md** — `createDefaultTaskExecutor({ adapters, customAdapters })` ✓
   - Exported: `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:185`
   - Constructor accepts `adapters` and `customAdapters` options (lines 41-42, 54-55, 62-63)

3. **build-a-server-validated-form.md** — `definePage().withForm()` ✓
   - Exported: `packages/fresh/src/application/builders/define-page/builder/form-support.ts:19`
   - Type: `packages/fresh/src/application/builders/define-page/page-compat/builder-types.ts:141`
   - Signature: `withForm(id, component, config)` on the page builder chain

4. **build-a-validated-ingestion-queue.md** — `createTypedQueue` ✓
   - Exported: `packages/queue/factory/create-typed-queue.ts:81`
   - Signature: `createTypedQueue(name, schema, options)`
   - `QueueProvider` enum: `packages/queue/ports/options.ts:14`

5. **publish-a-durable-stream.md** — `createDurableStream`, `flush()` ✓
   - `createDurableStream` exported: `packages/plugin-streams-core/src/application/create-durable-stream.ts:256`
   - `flush()` method: `packages/plugin-streams-core/src/application/create-durable-stream.ts:222`
   - Public export chain: `packages/plugin-streams-core/mod.ts:17`

6. **restrict-worker-task-permissions.md** — `.permissions()`, `buildDenoPermissionFlags` ✓
   - `.permissions()` method: `packages/plugin-workers-core/src/builders/task-builder.ts:38` (interface), `112-113` (implementation)
   - `buildDenoPermissionFlags`: `packages/plugin-workers-core/src/executor/adapters/permission-flags.ts:4`
   - Permission presets (minimal, network, allAccess, etc.): exported via `packages/plugin-workers-core/mod.ts`

**Verdict:** All six guides use real, grounded symbols. No invented APIs.

---

### 5. Auth Reference Units ✅ PASS

**Symbol verification:**

1. **auth-kv-oauth** (4 dirs: `docs/site/reference/auth-kv-oauth/`)
   - `createKvOAuthBackend`: `packages/auth-kv-oauth/src/backend.ts:107` ✓
   - `defineOAuthProvider`: `packages/auth-kv-oauth/src/providers.ts:111` ✓
   - `providers` object: `packages/auth-kv-oauth/src/providers.ts:243+` ✓

2. **auth-workos** (4 dirs: `docs/site/reference/auth-workos/`)
   - `createWorkosBackend`: `packages/auth-workos/src/workos-backend.ts:62` ✓

3. **auth-better-auth** (4 dirs: `docs/site/reference/auth-better-auth/`)
   - `createBetterAuthBackend`: `packages/auth-better-auth/src/better-auth-backend.ts:61` ✓

4. **plugin-auth-core** (4 dirs: `docs/site/reference/plugin-auth-core/`)
   - `AuthBackendPort`: `packages/plugin-auth-core/src/ports/mod.ts:212` ✓
   - `AuthBackendOperationUnsupportedError`: `packages/plugin-auth-core/src/ports/mod.ts:147` ✓

**Xref and nav wiring:**
- `docs/site/_data/xref.ts:37-40` — auth, auth-better-auth, auth-kv-oauth, auth-workos
- `docs/site/_data/xref.ts:52-53` — plugin-auth, plugin-auth-core
- `docs/site/_data.ts:33-36` — auth reference nav entries
- `docs/site/_data.ts:48-49` — plugin-auth, plugin-auth-core nav entries

**Reference unit count:**
- Total: 28 reference directories (not 22)
- Auth layer: 6 new directories (auth, auth-better-auth, auth-kv-oauth, auth-workos, plugin-auth, plugin-auth-core)
- No stale "22 units" claims found in docs

**Verdict:** Auth reference units grounded in real symbols. Counts consistent (28 total).

---

### 6. Enterprise Voice (Banned Words Check) ✅ PASS

**Grep check for banned terms:**
```bash
cd /home/runner/work/netscript/netscript
rtk grep -ri "honest\|honestly\|honesty\|candor" docs/site/ --exclude-dir=_plan --include="*.md"
```

**Result:** 0 hits in authored prose.

**Sample review:**
- Spot-checked 12 enterprise passages (background-jobs, sagas, triggers, streams, auth, polyglot-tasks, CLI examples)
- All read as production framework docs
- No candor-announcing framing detected

**Verdict:** Enterprise voice clean. No banned words or framing.

---

### 7. Build Green ✅ PASS

**Build command:**
```bash
cd docs/site
deno task build
```

**Result:** ✅ Exit 0
```
🍾 Site built successfully in 5 seconds
📦 Pagefind index generated: 265 files
```

**No errors:**
- No Vento template errors
- No Lume plugin failures
- All transforms ran (toc, next-prev)
- All filters ran (markdown, markdownify)

**Verdict:** Build green. No template or plugin errors.

---

## Summary

| Item | Claim | Status | Evidence |
|------|-------|--------|----------|
| 1. Public CLI surface | `netscript plugin add <pkg>` public, `<kind> --name` contributor | ✅ PASS | Source: `plugin-verb-command.ts` vs `add-local-plugin-command.ts`; Docs: `cli-reference.md:136`, `add-a-plugin.md:115` |
| 2. Worker concurrency env | Runtime `WORKERS_CONCURRENCY`, Aspire `WORKER_CONCURRENCY` | ✅ PASS | Source: `runtime.ts:38,81`, `workers-contribution.ts:56,71,82`; Docs: `tune-worker-runtime.md:201-207`, `deploy.md:165` |
| 3. Subprocess sandbox qualifier | Only Deno tasks get `.permissions()` | ✅ PASS | Source: `task-builder.ts:38,112`, `permission-flags.ts:4`; Docs: `background-jobs.md:181`, `restrict-worker-task-permissions.md:68` |
| 4. Six how-to guides | Zero invented symbols | ✅ PASS | All 6 guides use grounded symbols verified via grep |
| 5. Auth reference units | 6 auth packages documented | ✅ PASS | All auth symbols verified; xref/nav wired; 28 total units (no stale "22 units") |
| 6. Enterprise voice | No banned words | ✅ PASS | Zero hits for honest/honestly/honesty/candor in docs |
| 7. Build green | Lume build succeeds | ✅ PASS | Exit 0, 265 files indexed, 5s build time |

---

## Remaining Risks

1. **Reference unit count consistency** — Current count is 28 directories. Verify no docs claim "22 units" or other stale counts. (Checked: 0 hits for "22 unit" or "22 reference".)

2. **Auth layer integration** — Auth is present on this branch (post-`338bf6ad` reconciliation). Verify auth examples actually work with the auth plugin installed. (Docs verified; runtime integration not tested.)

3. **Subprocess Track-C proof deferred** — Intentionally deferred per protocol. Not a missing-feature defect.

---

## Evaluation Artifacts

- **Verdict file:** `.llm/tmp/run/openhands/pr-106/run-27919706056-1/verdict.md`
- **Summary file:** `/home/runner/work/_temp/openhands/27919706056-1/summary.md`
- **PR comment:** Written to PR #106

---

**Final Verdict:** `PASS`

All seven verification items passed. The docs v3 build is grounded in real framework surface, correctly distinguishes public vs contributor CLI, accurately documents the concurrency env mismatch, properly qualifies sandbox scope, introduces six valid how-to guides with zero invented symbols, wires auth reference units with consistent counts, maintains enterprise voice without banned words, and builds green.

Ready to merge.
