# IMPL-EVAL — fix-desktop-document-reconnect--c2

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-desktop-document-reconnect--c2` |
| Issue / PR | Issue #2041, Draft PR #2091, branch `fix/desktop-document-reconnect` |
| Evaluated HEAD | `510856423f270333499f7e8e3639a117c6d7a6ff` |
| Baseline | `8aad14940c52cd3a4db7efa57d56d50ae131df6c` (branch bootstrap main baseline) |
| Workload tier | `feature` (no privileged tier authority required or used) |
| Archetype / Scope | ARCHETYPE-2-integration + ARCHETYPE-3-runtime-behavior, SCOPE-frontend/native |
| Evaluator Identity | Independent Google implementation evaluator session (Gemini 3.8 Flash High route authorized by owner `HARNESS.md` after GLM model requests stalled empty without verdict) |
| Generator Identity | OpenAI (`gpt-6.1-sol`, lane C2); generator session and vendor family strictly independent from evaluator |
| Source State | Frozen at `510856423f270333499f7e8e3639a117c6d7a6ff`; zero source, branch, lock, or history mutations |

---

## Architectural and Contract Review

### 1. SDK Default Native Adapter (`packages/sdk/src/desktop/adapters/bind-channel.ts`)
- `resolveDesktopBindingInvoke` captures `performance.timeOrigin` once during adapter initialization and validates that `Number.isFinite(documentEpoch) && documentEpoch > 0` (throws `TypeError` on invalid epoch).
- The resolved native invoke appends `documentEpoch` as the third argument in `Reflect.apply(binding, bindings, [operation, payload, documentEpoch])`.
- The public `DesktopBindingInvoke` signature remains strictly unchanged as a two-argument contract `(operation, payload?) => Promise<unknown>`. Explicit invoke callers and custom adapters retain their original signature and seam.

### 2. Fresh Desktop Window Binder (`packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts`)
- Stable physical binding: binds to the native window once via `options.window.bind`.
- Upgradable logical slot: maintains `server = createServer()`, upgraded synchronously when a strictly newer epoch arrives (`epoch > documentEpoch`).
- Synchronous retirement: `server.close()` is invoked synchronously prior to creating the replacement slot, immediately settling pending `RECEIVE` calls with `{ status: 'closed' }` and freeing parked waiters.
- Stale call protection: monotonic epoch enforcement returns `{ status: 'closed' }` for `epoch < documentEpoch` without mutating the active slot.
- Dispatched slot capture: `const current = server;` captures the logical slot before awaiting `current.handler(operation, payload)`, ensuring in-flight calls cannot span into or corrupt subsequent document slots.
- Input validation: invalid non-numeric, non-finite, or non-positive epochs reject with `TypeError` without mutating server state.
- Lifecycle finalization: `close()` sets `isClosed = true`, closes the active server slot, and unbinds the window handler idempotently through `closePromise`.
- Protocol integrity: preserves standard MessagePort channel, oRPC `RPCHandler`, and existing JSON serializers without custom authentication or protocol deviations.

### 3. Public Types and Export Surface (`packages/fresh/src/runtime/desktop/types.ts`)
- `DesktopBindableWindow.bind` updates handler parameter typing to accept optional `documentEpoch?: unknown` with full JSDoc documentation.
- No slow types or erased types introduced.

### 4. Native Task and CI Workflow Integration
- Pinned native CI workflow `.github/workflows/e2e-cli.yml` incorporates `Real document reload reconnects SDK and Fresh native RPC` running `xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" deno task test:desktop-reload-native` under `if: env.RUN == 'true'` directly before the packaging suite.
- Step has no `continue-on-error`, ensuring native reload failure halts the job independently of pre-existing packaging exceptions.
- Root `deno.json` wires `test:desktop-reload-native`; `packages/fresh/deno.json` delegates to the root task and explicitly excludes `tests/desktop-reload/` and `**/*_native.ts` from JSR publishing (`publish.exclude`).

---

## Independent Verification Receipts

### 1. Mandatory Native Desktop Reload Acceptance
- Command: `deno task test:desktop-reload-native`
- Execution: Executed through a private qualified display and library launcher providing isolated Xvfb display and native CEF dependencies (raw actual launcher invocation retained privately in sibling task evidence; `LD_LIBRARY_PATH` unset for other Deno/corpus gates).
- Raw Exit Code: `0`
- TAP Summary: `passed: 1, failed: 0, ignored: 0, totalResults: 1, uniqueFailures: 0`
- Strict Receipt Verification: Real CEF `BrowserWindow.reload()` executed on same window; initial document parked `RECEIVE` waiter closed with `retiredClosed: 1`; second document with strictly newer epoch successfully performed typed oRPC (`native-pong`); final assertions confirmed `bindCalls: 1, unbindCalls: 1, pending: 0`.

### 2. Full Owning Suite Regression
- Command: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/sdk packages/fresh`
- Raw Exit Code: `0`
- Test Summary: `passed: 525, failed: 0, ignored: 0, totalResults: 525, uniqueFailures: 0`
- Skips / Ignores: Zero skipped or ignored tests.

### 3. Scoped Static Type Check
- Command: `deno run --frozen --allow-all .llm/tools/run-deno-check.ts --root packages/sdk --root packages/fresh --deno-arg --frozen`
- Raw Exit Code: `0`
- Summary: 333 files selected across 3 batches, 0 failed batches, 0 type errors.

### 4. Lint and Code Formatting
- Lint Command: `deno run --frozen --allow-all .llm/tools/run-deno-lint.ts --root packages/sdk --root packages/fresh --ext ts,tsx`
  - Raw Exit Code: `0` (333 files processed, 0 findings)
- Format Check: `deno run --frozen --allow-all .llm/tools/run-deno-fmt.ts --root packages/sdk --root packages/fresh --ext ts,tsx`
  - Raw Exit Code: `0` (333 files processed, 0 findings)

### 5. Quality Scan and Architecture Fitness Gate
- Command: `deno task quality:gate` (chains `quality:scan` and `arch:check`)
- Raw Exit Code: `0`
- Findings: Zero `any` casting or illegal suppressions introduced; architecture fitness gates pass.

### 6. JSR Audits and Packaging Dry-Runs
- JSR Audits:
  - `deno run --frozen --allow-all .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text`: Exit `0`
  - `deno run --frozen --allow-all .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text`: Exit `0`
  - `deno run --frozen --allow-all .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text`: Exit `0`
- Publish Dry-Runs:
  - `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/sdk`: Exit `0`
  - `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/fresh`: Exit `0`
  - `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/mcp`: Exit `0`

### 7. Export Surface Corpus and Carrier Proofs
- Assets Barrel Freshness: `deno task check:assets-barrel` -> Exit `0`
- MCP Export Corpus Freshness: `deno task check:mcp-export-corpus` -> Exit `0`
  - Provenance Checksum: `aaaf38dd723deed345e1574fbf9203d237e72a1e1b95bf21a5ba69553fd45b17`
  - Cardinality: 7947 symbols, 35 packages, 277 subpaths (exactly 2 entry deltas for documentation/signature updates).
- Corpus Unit Regression: `deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts`
  - Raw Exit Code: `0` (14 passed, 0 failed, 0 ignored).

---

## Causal Mutation Analysis

All newly added regression tests have validated causal mutation fail/restore proofs:
1. `mutation-native-stamp`: Stripping epoch stamping from default native invoke causes `assertEquals` failure in `packages/sdk/tests/desktop/bind-channel_test.ts` (exit `1`); restored source passes (exit `0`).
2. `mutation-document-reset`: Disabling slot replacement on newer epoch causes timeout in `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts` (exit `1`); restored source passes (exit `0`).
3. `native-mutation-reset`: Disabling server replacement in host causes native timeout / deadline exceeded in `packages/fresh/tests/desktop-reload_native.ts` (exit `1`); restored source passes (exit `0`).

Historical initial compile/fixture-guard refusals during pre-commit phases are retained in worklog as expected progression evidence and not claimed as false-greens.

---

## Documentation Debt Adjudication

### Proposed Debt: `desktop-doc-baseline-2041`
- Location: `.llm/harness/debt/arch-debt.md`
- Owner: SDK, Fresh, and MCP maintainers
- Target Date: 2026-10-15
- Baseline SHA: `8aad14940c52cd3a4db7efa57d56d50ae131df6c`

### Diagnostic Comparison
- Baseline and final structured reports (`deno task doc:lint --root packages/<pkg>`) were verified byte-identical:
  - `@netscript/sdk`: Combined 3 private type references, 0 missing JSDoc; raw gate exit code `1`. Output is byte-identical to baseline.
  - `@netscript/fresh`: Combined 28 private type references, 17 missing JSDoc; raw gate exit code `1`. Output is byte-identical to baseline.
  - `@netscript/mcp`: Combined 0 diagnostics, but per-entrypoint `./cli.ts` (3 private refs) and `./mod.ts` (3 private refs); raw gate exit code `1`. Output is byte-identical to baseline.
- Analysis:
  - The desktop runtime export (`./src/runtime/desktop/mod.ts`) in Fresh exhibits zero diagnostics and exit code `0`.
  - Zero new diagnostics, type erasures, or suppressions were introduced.
  - The documentation diagnostics are entirely pre-existing and unrelated to the desktop reconnection scope.
  - A formal debt entry exists in `arch-debt.md` specifying owner, target date, and closing gate (`Repair the pre-existing all-export documentation findings and obtain raw documentation exit zero`).
- Adjudication: **DEBT_ACCEPTED**

---

## Final Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **PASS** |
| Documentation Debt | **DEBT_ACCEPTED** (`desktop-doc-baseline-2041`) |
| Head SHA | `510856423f270333499f7e8e3639a117c6d7a6ff` |
| Rationale | All architectural contracts (D1–D4) are satisfied without scope drift. Production SDK captures performance epoch once; Fresh manages slot lifecycle with synchronous close-before-upgrade, stale rejection, and clean unbind. Actual native reload test passes against real CEF BrowserWindow under qualified runner with strict receipt. Full owning suite passes (525/525), type check, lint, format, quality, JSR audits, and publish dry-runs are green. All mutations verified. Pre-existing documentation baseline failure is byte-identical and accepted as documented architecture debt. Source remains frozen. |
