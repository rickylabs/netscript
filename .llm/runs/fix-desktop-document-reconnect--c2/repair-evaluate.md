# Independent IMPL-EVAL — fix-desktop-document-reconnect--c2 (F1 Review Repair)

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-desktop-document-reconnect--c2` |
| Issue / PR | Issue #2041, PR #2091, branch `fix/desktop-document-reconnect` |
| Evaluated HEAD | `37b8cd4af61b185f8d546aee69fbcf71be14380a` |
| Baseline | `20fa513a19a18873bd00785dba8443f14e84641b` |
| Merge Main | `587be0dd` (integrated in merge commit `676dcc7f`) |
| Workload Tier | `feature` (bounded review repair; no privileged tier authority required) |
| Archetype / Scope | ARCHETYPE-2-integration + ARCHETYPE-3-runtime-behavior, SCOPE-frontend/native |
| Evaluator Identity | Independent Google implementation evaluator session (owner-authorized Google fallback after primary GLM produced no review output) |
| Observed Model / Family | Gemini 3.8 Flash (High) / Google Gemini |
| Generator Identity | OpenAI (`gpt-6.1-sol`, lane C2); generator session and vendor family strictly independent from evaluator |
| Source State | Frozen at `37b8cd4af61b185f8d546aee69fbcf71be14380a`; zero source, branch, lock, or history mutations |

---

## Architectural and Contract Review (F1 Repair)

### 1. Synchronous Window Unbind and Shared Lifecycle Contract (`packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts`)
- **Synchronous Unbind Invocation:** `options.window?.unbind?.(bindingName)` is invoked synchronously within the call frame of `close()`, evaluating prior to returning the `closePromise`.
- **Pre-assigned Shared Promise for Reentry:** `const unbound = Promise.withResolvers<void>(); closePromise = unbound.promise;` assigns the shared cleanup promise before evaluating `options.window?.unbind?.(bindingName)`. Reentrant calls into `close()` during unbind execution immediately encounter `if (closePromise !== undefined) return closePromise;` and return the identical promise without re-triggering unbind.
- **Synchronous Throw Capture:** Synchronous errors during `unbind` invocation are caught in `try { ... } catch (error) { unbound.reject(error); }` and routed to promise rejection without escaping uncaught.
- **Asynchronous Cleanup Adoption:** Passing the result of `options.window?.unbind?.(bindingName)` into `unbound.resolve(...)` resolves the resolver with the return value; if `unbind` returns a Promise, `unbound.promise` automatically adopts that Promise and settles upon its completion.
- **Immediate Replacement Preservation:** Because window unbind executes synchronously during `close()`, a subsequent same-name `bindDesktopRpcWindow(options)` call without awaiting `close()` succeeds immediately and retains its replacement handler, preventing deferred microtasks from stripping the newly bound handler.
- **Public Signature Invariance:** The public signature `close(): Promise<void>` remains unchanged. No new types, abstractions, or configuration parameters are introduced.

### 2. Main Integration and Merge Resolution (`commit 676dcc7f`)
- Main baseline `587be0dd` integrated cleanly into repair branch.
- Fresh documentation in `packages/fresh/README.md` preserves both Desktop RPC document reconnection guidance and StreamDB recovery guidance.
- Architecture debt in `.llm/harness/debt/arch-debt.md` retains both `desktop-doc-baseline-2041` and `chat-send-doc-baseline-2068`.
- Generated carrier files were cleanly regenerated and committed in individual commits:
  - `5b807204`: `chore(assets): regenerate agent-docs-prose after main integration`
  - `9ad1759d`: `chore(assets): regenerate assets-barrel after main integration`
  - `d9332450`: `chore(assets): regenerate publish-assets after main integration`
  - `fb533ebc`: `chore(assets): regenerate mcp-export-corpus after main integration`

---

## Independent Verification Receipts

### 1. Focused Desktop Tests via Structured Wrapper
- **Command:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`
- **Raw Exit Code:** `0`
- **Output Summary:** `passed: 9, failed: 0, ignored: 0, totalResults: 9, uniqueFailures: 0`
- **Verified Assertions:**
  - `close unbinds synchronously and preserves a same-name replacement`: validates `window.unbindCalls === 1` and `window.handler === undefined` immediately after `original.close()`; validates `window.handler === replacementHandler` and `window.bindCalls === 2` after `await closing`; validates typed RPC client ping yields `'pong'`.
  - `reentrant close shares pending asynchronous unbind completion`: validates reentrant `close()` returns identical promise, idempotent invocation returns identical promise, `window.unbindCalls === 1`, and asynchronous completion settles properly.

### 2. Full Owning Suite Regression
- **Command:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --frozen packages/sdk packages/fresh`
- **Raw Exit Code:** `0`
- **Output Summary:** `passed: 541, failed: 0, ignored: 0, totalResults: 541, uniqueFailures: 0`
- **Skips / Ignores:** Zero skipped or ignored tests across both owning packages.

### 3. Static Type Check, Lint, and Format
- **Type Check:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts --file packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts --deno-arg --frozen`
  - **Raw Exit Code:** `0` (2 files selected, 0 failed batches, 0 errors)
- **Lint Check:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-lint.ts --file packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts --file packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`
  - **Raw Exit Code:** `0` (2 files processed, 0 findings)
- **Format Check:** `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-fmt.ts --file packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts --file packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`
  - **Raw Exit Code:** `0` (2 files processed, 0 findings)

### 4. Quality and Architecture Fitness Gates
- **Command:** `deno task quality:gate` (`quality:scan` and `arch:check`)
- **Raw Exit Code:** `0`
- **Receipt:** `../runs/2026-10-08-pr-repairs/2091-quality-gate-receipt.json`
- **Findings:** Zero suppressions, zero illegal `any` casts, architecture fitness checks pass.

### 5. Asset Freshness and Canonical Carriers
- **Gate `agent-docs-prose`:** `deno run -A .llm/tools/gates/run-gate.ts --gate agent-docs-prose --id 2091-agent-docs-prose` -> Raw Exit Code `0`
- **Gate `assets-barrel`:** `deno run -A .llm/tools/gates/run-gate.ts --gate assets-barrel --id 2091-assets-barrel` -> Raw Exit Code `0`
- **Gate `publish-assets`:** `deno run -A .llm/tools/gates/run-gate.ts --gate publish-assets --id 2091-publish-assets` -> Raw Exit Code `0`
- **Gate `mcp-export-corpus`:** `deno run -A .llm/tools/gates/run-gate.ts --gate mcp-export-corpus --id 2091-mcp-export-corpus` -> Raw Exit Code `0`

### 6. JSR Audits and Packaging Dry-Runs
- **Fresh Audit:** `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text` -> Raw Exit Code `0`
- **Fresh Publish Dry-Run:** `deno task publish:dry-run --member packages/fresh` -> Raw Exit Code `0`
- **SDK Audit:** `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text` -> Raw Exit Code `0`
- **SDK Publish Dry-Run:** `deno task publish:dry-run --member packages/sdk` -> Raw Exit Code `0`
- **MCP Audit:** `deno run -A .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text` -> Raw Exit Code `0`
- **MCP Publish Dry-Run:** `deno task publish:dry-run --member packages/mcp` -> Raw Exit Code `0`

### 7. Documentation Gates and Pre-existing Debt
- **Fresh Documentation Gate:** `deno task doc:lint --root packages/fresh` -> Raw Exit Code `1`
  - Analysis: `./src/runtime/desktop/mod.ts` exhibits 0 diagnostics and entrypoint exit `0`. 45 diagnostics (28 privateTypeRef, 17 missingJSDoc) are byte-identical to baseline debt.
- **SDK Documentation Gate:** `deno task doc:lint --root packages/sdk` -> Raw Exit Code `1`
  - Analysis: 3 diagnostics byte-identical to baseline debt.
- **MCP Documentation Gate:** `deno task doc:lint --root packages/mcp` -> Raw Exit Code `1`
  - Analysis: 0 package diagnostics; per-entrypoint diagnostics byte-identical to baseline debt.
- **Adjudication:** `DEBT_ACCEPTED` (`desktop-doc-baseline-2041` in `.llm/harness/debt/arch-debt.md`). No new diagnostics or signature modifications introduced.

### 8. Native Protocol and Scaffolding Status
- Independent native rerun is N/A: epoch protocol and native fixture are unchanged by this bounded F1 repair.
- Original real-native review evidence (`test:desktop-reload-native` passing real CEF `BrowserWindow.reload()` with strict receipt) remains valid and verified in run history.
- Release and scaffolding gates are N/A (no release cut, scaffolding, or CLI packaging changes).

---

## Causal Mutation Analysis

- **Re-defer Unbind Mutation:** Modifying `close()` to re-defer unbind to a microtask via `Promise.resolve().then(() => options.window?.unbind?.(bindingName))` causes the immediate unbind assertion in `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts` to fail:
  - Command: `deno test --reporter=tap --allow-all --frozen --filter "close unbinds synchronously" packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`
  - Raw Exit Code: `1` (`AssertionError: Values are not equal. Actual: 0, Expected: 1` at line 54 `assertEquals(window.unbindCalls, 1)`)
  - Receipt: `../runs/2026-10-08-pr-repairs/2091-mutation-red.json`
- **Restored Source:**
  - Command: `deno test --reporter=tap --allow-all --frozen packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`
  - Raw Exit Code: `0` (9 passed, 0 failed, 0 ignored)
  - Receipt: `../runs/2026-10-08-pr-repairs/2091-restored-green.json`

---

## Gate Summary Table

| Gate | Raw Exit | Evidence Source | Status |
| --- | --- | --- | --- |
| check | 0 | `../runs/2026-10-08-pr-repairs/2091-check.log` | PASS |
| lint | 0 | `../runs/2026-10-08-pr-repairs/2091-lint.log` | PASS |
| fmt | 0 | `../runs/2026-10-08-pr-repairs/2091-fmt.log` | PASS |
| focused-desktop-tests | 0 | Independent structured wrapper run (9 passed) | PASS |
| owning-tests | 0 | `../runs/2026-10-08-pr-repairs/2091-tests.log` (541 passed) | PASS |
| quality-gate | 0 | `../runs/2026-10-08-pr-repairs/2091-quality-gate-receipt.json` | PASS |
| agent-docs-prose | 0 | `../runs/2026-10-08-pr-repairs/2091-agent-docs-prose-receipt.json` | PASS |
| assets-barrel | 0 | `../runs/2026-10-08-pr-repairs/2091-assets-barrel-receipt.json` | PASS |
| publish-assets | 0 | `../runs/2026-10-08-pr-repairs/2091-publish-assets-receipt.json` | PASS |
| mcp-export-corpus | 0 | `../runs/2026-10-08-pr-repairs/2091-mcp-export-corpus-receipt.json` | PASS |
| audit-fresh | 0 | `../runs/2026-10-08-pr-repairs/2091-audit-fresh.log` | PASS |
| publish-fresh | 0 | `../runs/2026-10-08-pr-repairs/2091-publish-fresh.log` | PASS |
| docs-fresh | 1 | `../runs/2026-10-08-pr-repairs/2091-docs-fresh.log` | DEBT_ACCEPTED (`desktop-doc-baseline-2041`) |
| audit-sdk | 0 | `../runs/2026-10-08-pr-repairs/2091-audit-sdk.log` | PASS |
| publish-sdk | 0 | `../runs/2026-10-08-pr-repairs/2091-publish-sdk.log` | PASS |
| docs-sdk | 1 | `../runs/2026-10-08-pr-repairs/2091-docs-sdk.log` | DEBT_ACCEPTED (`desktop-doc-baseline-2041`) |
| audit-mcp | 0 | `../runs/2026-10-08-pr-repairs/2091-audit-mcp.log` | PASS |
| publish-mcp | 0 | `../runs/2026-10-08-pr-repairs/2091-publish-mcp.log` | PASS |
| docs-mcp | 1 | `../runs/2026-10-08-pr-repairs/2091-docs-mcp.log` | DEBT_ACCEPTED (`desktop-doc-baseline-2041`) |
| mutation-re-defer | 1 | `../runs/2026-10-08-pr-repairs/2091-mutation-red.json` | PASS (Causal Fail) |
| restored-regression | 0 | `../runs/2026-10-08-pr-repairs/2091-restored-green.json` | PASS (Restored Green) |

---

## Final Verdict

| Field | Value |
| --- | --- |
| **Verdict** | **PASS** |
| Reviewed Head SHA | `37b8cd4af61b185f8d546aee69fbcf71be14380a` |
| Baseline SHA | `20fa513a19a18873bd00785dba8443f14e84641b` |
| Merge Main SHA | `587be0dd` |
| Documentation Debt | **DEBT_ACCEPTED** (`desktop-doc-baseline-2041`) |
| Rationale | F1 review repair requirements are fully satisfied in `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts`. `close()` synchronously evaluates `options.window?.unbind?.(bindingName)`, pre-assigns the shared cleanup promise before invoking unbind to handle reentrant cleanup safely, captures synchronous exceptions, and adopts asynchronous cleanup promises. Immediate same-name rebinding without awaiting close retains the replacement handler and typed RPC. Focused desktop regression tests pass (9/9), full owning test suite passes (541/541), causal mutation re-deferring unbind fails (exit 1) and restored passes (exit 0). Static check, lint, format, quality, asset freshness, JSR audits, and publish dry-runs all exit 0. Pre-existing documentation diagnostics match baseline debt and are accepted. Source remains frozen. |
