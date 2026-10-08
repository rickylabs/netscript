# IMPL-EVAL — Rich Chat Message Send (#2068), PR #2092

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-chat-rich-message-send--c2` |
| Branch / PR | `fix/chat-rich-message-send` / draft PR #2092 (Refs #2068) |
| Evaluated Current HEAD | `ffdb32a7d0bef56a8ecc37749d87e689beda6625` |
| Baseline SHA | `8aad14940c52cd3a4db7efa57d56d50ae131df6c` (current main) |
| Transitive Commits Evaluated | `12df198d6`, `b8f5a288b`, `5a8571436`, `4f429df3a`, `04bd92161`, `ffdb32a7d` |
| Evaluator Session | Independent Google Gemini evaluator (`gemini-3.8-flash-high`), session ID `74542e15-2e64-41dc-9653-be9ba2cff7f4` |
| Session History & Scoping | Initial relative-brief lookup was interrupted before verdict or source mutation; the same independent evaluator session resumed using the task-scoped absolute brief without operator paths or private commands in public artifacts |
| Vendor Separation | Independent vendor family from OpenAI generator/implementer (`gpt-6.1-sol` lane record); authorized owner fallback under `HARNESS.md` after primary GLM provider requests stalled without verdict (`evaluator-provider-fallback.json`) |
| Prior Plan Evaluation | Selected PLAN-EVAL PASS against immutable current main `8aad14940c52cd3a4db7efa57d56d50ae131df6c` preserved in `plan-eval.md` |
| Surface / Archetype | Archetype 2 (Keep integration) + Archetype 1 (Small owned contract) on `@netscript/fresh/ai` |
| Workload Tier | `feature` capped |
| Checkout State | Clean git working directory, exact frozen HEAD `ffdb32a7d0bef56a8ecc37749d87e689beda6625` |
| Operational Constraints | No branch/history/lock/config/dependency/source edits; no delegates/subagents/external inference; no CI polling or sleeps; no EIS access or mutation; unmerged handoff (`Refs #2068`) |

---

## Scope & Delta Verification

Inspection of the full commit delta `8aad14940c52cd3a4db7efa57d56d50ae131df6c..ffdb32a7d0bef56a8ecc37749d87e689beda6625` confirms exactly 15 files touched (703 insertions, 15 deletions) across five ordered slices:

1. **Production Framework Code (3 files):**
   - `packages/fresh/src/runtime/ai/create-chat-connection.ts`: Defines the owned structural union `NetScriptChatSendMessage`, updates `NetScriptChatConnection.send` signature to accept `readonly NetScriptChatSendMessage[]`, forwards messages array directly to upstream seam without lossy text projection, and preserves existing data and linked cancellation signals.
   - `packages/fresh/src/runtime/ai/mod.ts`: Re-exports `type NetScriptChatSendMessage`.
   - `packages/fresh/src/runtime/ai/README.md`: Documents complete client sends, structural boundaries, and separation between send input and the reduced rendering projection.

2. **Tests & Fixtures (3 files):**
   - `packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts`: Upstream native type compile fixture importing `UIMessage` from declared `@tanstack/ai-preact` and `ModelMessage` from declared `@tanstack/ai` (zero new package dependencies); verifies clean assignability to `NetScriptChatSendMessage` without casting and asserts compile-time rejections of malformed message inputs lacking valid parts/content.
   - `packages/fresh/src/runtime/ai/create-chat-connection_test.ts`: Adds injected identity and lifecycle regression verifying exact reference identity of rich messages and data across the adapter seam, linked caller abort, connection disposal, single active physical subscription across multiple logical readers, and idempotent teardown.
   - `packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts`: Adds real default native transport HTTP fixture (`Deno.serve`) verifying wire POST JSON preservation of multimodal parts, metadata, tool fields, reasoning, and data; verifies single live SSE connection shared by concurrent logical readers, in-flight caller and disposal cancellations, and bounded cleanup. Replaces stale expectation in existing fake durable lifecycle test from synthesized text parts to original Model content.

3. **Documentation, Corpus & Debt (2 files):**
   - `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`: Updates canonical MCP export surface corpus reflecting exactly 1 added public symbol (`NetScriptChatSendMessage`).
   - `.llm/harness/debt/arch-debt.md`: Records entry `chat-send-doc-baseline-2068` tracking pre-existing unchanged Fresh and MCP doc-lint baselines.

4. **Harness Run Artifacts (7 files):**
   - `.llm/runs/fix-chat-rich-message-send--c2/{context-pack.md, drift.md, plan-eval.md, plan.md, research.md, supervisor.md, worklog.md}`.

**Hygiene and Dependency Audit:**
- Zero new package dependencies added.
- Zero package version bumps or lockfile changes (`deno.lock` untouched and byte-identical to baseline).
- Directory cardinality for `src/runtime/ai` remains at 13 immediate children (pre-existing, no added production files).
- No changes to public configuration, workflows, or runtime services.

---

## Architectural & Load-Bearing Verification (D1–D4)

### D1: Owned Structural Union & Projection Separation
- **Send Input Contract:** `NetScriptChatSendMessage` is defined as a NetScript-owned structural union in `create-chat-connection.ts` and re-exported from `packages/fresh/src/runtime/ai/mod.ts`. It models:
  - UI form: `{ id: string; role: 'system' | 'user' | 'assistant' | 'tool'; parts: readonly unknown[]; name?: string; metadata?: unknown; createdAt?: unknown }`
  - Model form: `{ id?: string; role: 'system' | 'user' | 'assistant' | 'tool'; content: string | null | readonly unknown[]; name?: string; toolCalls?: readonly unknown[]; toolCallId?: string; thinking?: unknown; error?: unknown; metadata?: unknown; structuredOutput?: unknown; createdAt?: unknown }`
- **Zero Upstream Leak:** Parts and content arrays are typed as `readonly unknown[]`, preventing upstream schema coupling and eliminating slow types on JSR exports.
- **Rendering Projection Preserved:** `NetScriptChatMessage` remains strictly `{ id: string; role: string; content: string }`, used exclusively by `projectChatSnapshot` and `resolveChatSnapshot` to guarantee the ONE-PROJECTION LAW. It is decoupled from `send`.
- **Server Response Convenience:** `toNetScriptChatResponse` retains `newMessages.map(toDurableMessage)` for intentional reduced server response formatting.

### D2: Direct Send Forwarding & Shallow Copy at Edge
- `createNetScriptChatConnection.send` invokes `upstream.send(messages, data, linkSignal(signal))` directly. No `map(toDurableMessage)`, deduplication, or element sanitization is performed.
- In `defaultCreateConnection`, `connection.send([...messages], data, signal)` shallow-copies the outer array solely to satisfy the upstream transport's mutable-array parameter contract while preserving every element, part, and object reference intact.
- App-supplied `data` and caller cancellation signals are forwarded without alteration.

### D3: Hub Multiplexing & Subscription Invariants
- `createChatSubscriptionHub` in `packages/fresh/src/internal/chat-subscription-hub.ts` is completely untouched.
- Multiple logical readers (`connection.subscribe()`) share exactly one underlying physical stream.
- Invocations of `connection.send` do not open extraneous subscriptions.
- Caller abort signal is linked with connection disposal via `AbortSignal.any([controller.signal, caller])`. Sends attempted after disposal reject immediately.

### D4: Real Default Native Transport & Network Wire Proof
- `default native chat transport retains rich POST bodies and one live SSE with send aborts` tests `durableStreamConnection` directly without mocking `createConnection`.
- Real local `Deno.serve` HTTP and SSE server verifies:
  1. POST JSON captures full multimodal attachments (images, audio, video, documents), tool calls/results, reasoning, structured output, metadata, creation timestamps, and app `data`. Wire assertions compare parsed JSON structural equality (`JSON.parse(JSON.stringify({ messages, data }))`), not byte-for-byte wire serialization.
  2. Initial JSON bootstrap catchup request is separated from the single persistent `live=sse` GET request shared across multiple logical readers.
  3. Real data and control SSE frames deliver chunks before and after sends.
  4. In-flight caller-aborted and disposal-aborted POST requests are caught and rejected as expected.
  5. Final disposal cancels the active SSE stream, terminates both readers, and shuts down cleanly with zero leaks.

---

## Causal Mutation Proofs

All three planned causal mutation gates were independently inspected and verified against recorded evidence:

| Test Gate | Causal Source Mutation | Mutant Behavior | Restored Behavior | Result |
| --- | --- | --- | --- | --- |
| **Native Compile Consumer** (`chat-send-consumer_type.ts`) | Reverted `NetScriptChatConnection.send` parameter from `NetScriptChatSendMessage[]` to reduced `NetScriptChatMessage[]`. | Compiler rejects assignability with `TS2345` on line 96 (`exitCode: 1`, 1 error). Primary type regression proven. | Clean compilation with zero diagnostics (`exitCode: 0`). | **PASS** |
| **Injected Identity & Lifecycle** (`create-chat-connection_test.ts`) | Inlined lossy `map(toDurableMessage)` into `createNetScriptChatConnection.send`. | `assertStrictEquals` fails on message parts, metadata, and future fields (`exitCode: 1`, 1 failure). | Strict reference equality holds across all message and data elements (`exitCode: 0`). | **PASS** |
| **Real Default Native Transport** (`create-chat-connection_integration_test.ts`) | Inlined lossy `map(toDurableMessage)` into `createNetScriptChatConnection.send`. | Wire POST JSON body mismatch on real HTTP request (`assertEquals` failure on parsed JSON structural equality, `exitCode: 1`). | Parsed wire JSON matches native structure with complete structural equality (`exitCode: 0`). | **PASS** |

Each runtime test compiles cleanly under its mutation and fails on an explicit assertion mismatch; restoration returns the tests to green without skipping or deletion.

---

## Independent Gate Executions at HEAD

All required repository gates were independently executed at frozen HEAD `ffdb32a7d0bef56a8ecc37749d87e689beda6625`:

| Gate | Canonical Command | Exit Code | Measurement / Summary | Status |
| --- | --- | :---: | --- | :---: |
| **Compile Consumer Fixture** | `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/fresh/tests/type-fixtures/chat-send-consumer_type.ts --deno-arg --frozen` | `0` | 1 file selected, 0 errors | **PASS** |
| **Focused Unit & Integration Tests** | `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all packages/fresh/src/runtime/ai/create-chat-connection_test.ts packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts` | `0` | 21 passed / 0 failed / 0 ignored | **PASS** |
| **Native Integration Case** | `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --filter "default native chat transport retains" packages/fresh/src/runtime/ai/create-chat-connection_integration_test.ts` | `0` | 1 passed / 0 failed / 0 ignored | **PASS** |
| **Scoped Static Check** | `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx --deno-arg --frozen` | `0` | 225 files checked, 0 errors | **PASS** |
| **Scoped Lint** | `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | `0` | 225 files processed, 0 lint findings | **PASS** |
| **Scoped Formatting** | `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | `0` | 225 files checked, 0 formatting findings | **PASS** |
| **Full Fresh Test Suite** | `deno run --frozen --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --frozen --allow-all --unstable-kv packages/fresh/src packages/fresh/tests` | `0` | 285 passed / 0 failed / 0 ignored | **PASS** |
| **Repository Quality Gate** | `deno task quality:gate` | `0` | `quality:scan` + `arch:check` clean pass | **PASS** |
| **Fresh JSR Audit** | `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh --text` | `0` | 0 errors, slow-types OK (2 pre-existing warnings) | **PASS** |
| **Fresh Publish Dry-Run** | `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/fresh` | `0` | Dry run complete (publish dry-run qualification, not release publication) | **PASS** |
| **MCP Export Corpus Freshness** | `deno task check:mcp-export-corpus` | `0` | Checksum `1c1feb6b0b838298ffc52c67cd63fce6bd6685d81cace48d6ff9040cc8798546`, 7948 symbols | **PASS** |
| **Assets Barrel Check** | `deno task check:assets-barrel` | `0` | Generated barrels clean; `git diff --exit-code` exit 0 | **PASS** |
| **MCP Generated Corpus Check** | `deno run --frozen --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts --deno-arg --frozen` | `0` | 1 file checked, 0 errors | **PASS** |
| **MCP JSR Audit** | `deno run --frozen --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/mcp --text` | `0` | 0 errors, slow-types OK (3 pre-existing warnings) | **PASS** |
| **MCP Publish Dry-Run** | `deno run --frozen --allow-all .llm/tools/release/run-publish-dry-run.ts --member packages/mcp` | `0` | Dry run complete (publish dry-run qualification, not release publication) | **PASS** |
| **Committed Corpus Regressions** | `WT_ENFORCE=0 deno run --frozen --allow-all .llm/tools/run-deno-test.ts -- --frozen --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts packages/mcp/tests/embedded-export-surface-corpus_test.ts` | `0` | 14 passed / 0 failed / 0 ignored | **PASS** |
| **Fresh Doc-Lint (Baseline Check)** | `deno task doc:lint --root packages/fresh` | `1` | 45 combined findings (28 privateTypeRef, 17 missingJSDoc); `./src/runtime/ai/mod.ts` has 0 errors | **DEBT_ACCEPTED** |
| **MCP Doc-Lint (Baseline Check)** | `deno task doc:lint --root packages/mcp` | `1` | Combined 0, 2 entrypoints with 3 privateTypeRef each (`./cli.ts`, `./mod.ts`) | **DEBT_ACCEPTED** |

---

## Documentation Baseline & Architecture Debt Adjudication

### Documentation Baseline Verification
- Independent run of `deno task doc:lint --root packages/fresh` produced structured JSON output byte-identical to `chat-doc-baseline.stdout`.
- Across all 17 Fresh package entrypoints, the findings count remains exactly 45 (28 private type references, 17 missing JSDoc entries).
- The modified export surface `./src/runtime/ai/mod.ts` has **0 errors, 0 privateTypeRef, 0 missingJSDoc**. The new type `NetScriptChatSendMessage` is fully documented with complete JSDoc annotations and introduces zero diagnostics.
- Independent run of `deno task doc:lint --root packages/mcp` produced structured JSON output byte-identical to `baseline-doc-mcp.stdout` (combined total 0, with 3 privateTypeRef warnings each on `./cli.ts` and `./mod.ts`).

### Architecture Debt Adjudication (`arch-debt.md`)
- Debt entry `chat-send-doc-baseline-2068` is recorded in `.llm/harness/debt/arch-debt.md`:
  - **ID:** `chat-send-doc-baseline-2068`
  - **Owner:** Fresh and MCP package public-surface maintainers.
  - **Target:** Before the next stable Fresh release, no later than 2026-10-15.
  - **Closing Gate:** F-7 full Fresh and MCP doc-lint has zero diagnostics across every export entrypoint.
- **Evaluator Ruling:** **DEBT_ACCEPTED**. The baseline is verified strictly unchanged from pristine main; no new doc-lint findings or debt were introduced; the raw task exit code 1 is reported honestly and not falsely masked as green.

---

## Canonical Export Surface Corpus Provenance

1. **Source Integrity:**
   - Canonical export surface corpus was generated strictly from clean committed S3 source commit `4f429df3a`.
   - The comparison baseline was generated using `buildExportSurfaceCorpus` against an immutable git archive of main `8aad14940c52cd3a4db7efa57d56d50ae131df6c` in task-local temporary storage (clean ordinary files, finally removed).
2. **Semantic Delta (`canonical-corpus-delta.json`):**
   - Packages: 35 (unchanged).
   - Subpaths: 277 (unchanged).
   - Total Symbols: 7947 → 7948 (+1 symbol).
   - Added Symbol: `["@netscript/fresh", "./ai", "NetScriptChatSendMessage", "typeAlias"]`.
   - Removed Symbols: 0.
   - Changed Normalized Declarations: 0.
   - Compressed Checksum: `1c1feb6b0b838298ffc52c67cd63fce6bd6685d81cace48d6ff9040cc8798546`.
3. **Commit Order:**
   - Corpus artifacts were committed at `04bd92161`, preceding the execution of the 14 committed-tree generator and embedded corpus regression tests.

---

## Downstream Scope & Unmerged Delivery

- **Scope & Issue Status:** Refs #2068, PR #2092. GitHub closing keywords (`Closes #2068` / `Fixes #2068`) are intentionally withheld because issue acceptance is still outstanding, not merely because the PR is delivered unmerged.
- **Boundaries of this PASS Verdict:** This evaluation PASS covers the implemented framework source and locked plan at HEAD `ffdb32a7d0bef56a8ecc37749d87e689beda6625`. It does not certify every end-to-end issue acceptance box or published-consumer adoption:
  1. Coordinated package publication and actual release publication (publication gates executed here are dry-runs only).
  2. Published native-consumer verification across consumer environments.
  3. Live one-SSE-per-pane downstream verification before `singleSubscriberConnection` removal and full issue closure.
- **Downstream EIS Remediation:** The downstream workaround in `rickylabs/eis-chat` (PR #434 rich send adapter and `singleSubscriberConnection`) remains removable once the published package is adopted.
- **Release Qualifications N/A:** Scaffold runtime (`scaffold.runtime`) and CLI E2E release gates are correctly marked N/A as this change touches no CLI scaffolding, service wiring, or release cut mechanisms.

---

## Findings

None. All constraints, type boundaries, invariant preservations, causal mutations, and documentation requirements have been verified without discrepancy.

---

## Verdict

**PASS**

The implementation at frozen current HEAD `ffdb32a7d0bef56a8ecc37749d87e689beda6625` rigorously fulfills the contract of the locked plan for issue #2068:
1. Complete native UI and Model message structures (multimodal attachments, tool calls/results, reasoning, metadata, timestamps, and application fields) are forwarded unchanged alongside app data and linked abort signals.
2. The owned structural union `NetScriptChatSendMessage` provides a clean, fully documented transport boundary without leaking upstream types or requiring schema duplication.
3. The reduced rendering projection `NetScriptChatMessage` and the single-stream `createChatSubscriptionHub` multiplexing invariant are strictly preserved.
4. All three causal mutation gates (one type-level compiler diagnostic and two runtime behavioral assertions) demonstrate unambiguous detection of lossy regressions. Real HTTP transport verification asserts parsed JSON structural equality.
5. All 16 independent test, lint, format, quality, corpus, and publication dry-run gates are green, and pre-existing documentation baselines are honestly adjudicated under `DEBT_ACCEPTED`.

**Qualification Boundary:** This verdict qualifies the framework source and locked plan. Coordinated publication, published native-consumer verification, and live one-SSE-per-pane remain owner gates before full issue closure or EIS `singleSubscriberConnection` removal; closing keywords remain withheld (`Refs #2068`).
