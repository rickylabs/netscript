# PLAN-EVAL — full chat send (issue #2068)

- **Plan evaluator session:** Independent Google evaluator (Gemini / `gemini-3.8-flash-high`), authorized owner fallback under `HARNESS.md` after primary GLM provider requests stalled without verdict (`evaluator-provider-fallback.json`); fresh session, different vendor family from OpenAI generator (`gpt-6.1-sol` lane record) — vendor-family and session separation satisfied.
- **Run ID / Branch:** `fix-chat-rich-message-send--c2` / branch `fix/chat-rich-message-send` (issue #2068)
- **Immutable main SHA evaluated:** `8aad14940c52cd3a4db7efa57d56d50ae131df6c` ("feat(contracts): command contracts, literal errors and canonical codecs (#2082)")
- **Plan under evaluation:** `locked-plan-draft.md` and `research-design-candidate.md` in `evidence/c2/item-2068/`
- **Surface / Archetype:** Archetype 2 (Keep integration) + Archetype 1 (Small owned contract) on `@netscript/fresh/ai`
- **Workload Tier:** `feature` capped (no privileged `complex` or `architecture` tier inference without explicit authority)
- **Mode:** PLAN-EVAL only. Implementation hard stop honored. No branch switch, no history/source/config/lock/public-metadata edits, no delegates/subagents/external inference, no CI polling or sleeps, no EIS access or mutation.
- **Checkout state during evaluation:** Checkout active on concurrent work streams (e.g., worker / route PRs); this evaluator performed no branch switch and no writes to tracked repository files. All source, skill, and doctrine inspections performed strictly read-only via `git show 8aad14940c52cd3a4db7efa57d56d50ae131df6c:<path>` against immutable main.

---

## Checklist results (Plan-Gate)

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| **Research present and current** | **PASS** | `locked-plan-draft.md` lines 11–16 and `research-design-candidate.md`. Re-baselined against immutable current main `8aad14940c52cd3a4db7efa57d56d50ae131df6c`. Verified problem statement in issue #2068 and read-only EIS PR #444 single-subscriber workaround. Source verification confirms `createNetScriptChatConnection.send` in `packages/fresh/src/runtime/ai/create-chat-connection.ts` (at line 434) already forwards app data and linked signal, but narrows messages through `toDurableMessage`, losing non-text message parts and metadata, preserving data. Installed types confirmed from declared imports: `@tanstack/ai-preact@0.14.4` (re-exporting `UIMessage` from client `0.29.2`) and `@tanstack/ai@0.52.0` (`ModelMessage`). |
| **Decisions locked** | **PASS** | `locked-plan-draft.md` lines 18–26 (D1–D4): D1 locks the owned structural union `NetScriptChatSendMessage` (UI shape with `id`, `role`, `parts: readonly unknown[]` and Model shape with `role`, `content: string | null | readonly unknown[]`), proven assignable from native `UIMessage` and `ModelMessage` without casting, while retaining `NetScriptChatMessage` strictly for reduced rendering/snapshot projection; D2 locks direct array, data, and signal forwarding to upstream transport seam without `toDurableMessage` mapping; D3 preserves existing `createChatSubscriptionHub` and single physical upstream subscription invariant; D4 locks validation against actual default native durable transport HTTP fixture (`Deno.serve`) and three causal tests with compile/failing source mutations. |
| **Open-decision sweep** | **PASS** | `locked-plan-draft.md` lines 28–30. Evaluator sweep confirmed no open architectural choices or deferred decisions that could force rework. Owned structural union avoids upstream type re-export; opaque parts prevent slow types and schema churn; direct forwarding maintains transport transparency; testing is locked to actual default native transport. |
| **Commit slices (< 30, gate + files each)** | **PASS** | `locked-plan-draft.md` lines 27–28. Exactly 5 ordered slices (S1–S5), each bounded well below 30 files: S1 covers research/locked PLAN-EVAL before source; S2 covers owning send-input type, exports, docs, source, and consumer fixture with adjacent regression and mutation (< 8 files); S3 covers actual default HTTP/live subscriber regression and mutation (< 4 files) plus full Fresh suite; S4 covers clean-source generated corpus and committed-source checks; S5 covers independent IMPL-EVAL report and unmerged handoff. Touch limits and proving gates are explicitly specified. |
| **Risk register** | **PASS** | `locked-plan-draft.md` lines 29–30. Enumerates 10 concrete failure modes with actionable mitigations: future part types dropped (opaque readonly parts + identity/wire assertions), native Model content arrays rejected (exact upstream compile consumer), UI role mismatch (role compatibility retained), malformed input overly permissive (union requiring valid parts or content), signal lost (caller/disposal in-flight checks), duplicate SSE subscriptions (request counter + hub unchanged), server response conversion break (response formatter retained), upstream envelope data dropping (wire JSON assertions), slow/private doc types (owned type without upstream re-export), fixture hangs (bounded waits and finally cleanup). |
| **Gate set selected** | **PASS** | `locked-plan-draft.md` lines 25–28. Required Archetype 2 + Archetype 1 gates selected: scoped frozen static checks (`run-deno-check.ts`), scoped lint (`run-deno-lint.ts`), scoped fmt (`run-deno-fmt.ts`), code-quality gate (`quality:gate` = `quality:scan` + `arch:check`), full Fresh test suite without deletion or skipping, three distinct causal mutation proofs, JSR publish dry-run (`deno publish --dry-run --allow-dirty`), all-entrypoint doc-lint baseline comparison, MCP export surface corpus verification (`check:mcp-export-corpus`), and independent IMPL-EVAL. Release-gates (`scaffold.runtime`, `e2e-cli-prod`) correctly marked N/A. |
| **Deferred scope explicit** | **PASS** | `locked-plan-draft.md` lines 28–30. Explicitly defers coordinated package publication and consumer release (owner work under no-merge authorization); PR marked `Refs #2068` until release qualification; downstream EIS rich send adapter and `singleSubscriberConnection` removal deferred until published package adoption; no static catalog, facade, upstream re-exports, or parallel connection implementation; no CLI, scaffold, runtime service wiring, or release cut changes. |
| **jsr-audit (pkg/plugin)** | **PASS** | `locked-plan-draft.md` lines 8, 19, 25, 29. JSR publishability rubric applied to planned `@netscript/fresh/ai` public export `NetScriptChatSendMessage`. Self-contained NetScript-owned structural union introduces zero upstream type re-exports (complies with F-15). Opaque parts `readonly unknown[]` eliminate slow types and external dependency leaks. All symbols require complete JSDoc documentation (F-7) and zero new doc-lint diagnostics. JSR publish dry-run mandated in S2/S3; canonical MCP export surface corpus check/regeneration mandated in S4. |

---

## Architectural & Load-Bearing Verification

### 1. Small structural owned UI/Model union assignability & opaque parts
The plan defines `NetScriptChatSendMessage` as an owned structural union in `packages/fresh/src/runtime/ai/create-chat-connection.ts` and re-exports it from `./mod.ts`:
- **UI form:** `{ readonly id: string; readonly role: 'system' | 'user' | 'assistant' | 'tool'; readonly parts: readonly unknown[]; readonly metadata?: unknown; readonly createdAt?: unknown }`
- **Model form:** `{ readonly id?: string; readonly role: 'system' | 'user' | 'assistant' | 'tool'; readonly content: string | null | readonly unknown[]; readonly name?: string; readonly toolCalls?: readonly unknown[]; readonly toolCallId?: string; readonly thinking?: unknown; readonly error?: unknown; readonly metadata?: unknown; readonly structuredOutput?: unknown; readonly createdAt?: unknown }`

Verification against immutable main `8aad14940c52cd3a4db7efa57d56d50ae131df6c` and installed package metadata confirms:
- In `packages/fresh/deno.json`, `@tanstack/ai-preact` (`^0.14.4`) is declared and re-exports `UIMessage` (from `@tanstack/ai-client@0.29.2`). `@tanstack/ai` (`^0.52.0`) is declared and exports `ModelMessage`.
- `native-send-shape-probe.ts` verified that real `UIMessage` and `ModelMessage` instances are assignable to `NetScriptChatSendMessage` without any type assertions or casting (`const inputs: readonly CandidateSendMessage[] = [ui, model];` compiles cleanly).
- Malformed shapes lacking both valid `parts` and `content` are rejected at compile time (`@ts-expect-error` verified).
- By typing parts as `readonly unknown[]`, multimodal attachments (images, audio, video, documents), tool calls, tool results, thinking blocks, and future app-specific fields pass through seamlessly without leaking upstream types or requiring brittle schema mirroring.

### 2. Direct unchanged send, forwarded data, and linked signal
- Currently, in `packages/fresh/src/runtime/ai/create-chat-connection.ts` at line 434 of immutable main `8aad14940c52cd3a4db7efa57d56d50ae131df6c`, `createNetScriptChatConnection.send` invokes `upstream.send(messages.map(toDurableMessage), data, linkSignal(signal))`. While `data` and the linked disposal/caller `signal` are already forwarded to `upstream.send`, `messages.map(toDurableMessage)` narrows each message to `{ id, role, parts: [{ type: 'text', text: message.content }] }`, stripping non-text message parts and metadata while preserving data.
- Decision D2 eliminates `map(toDurableMessage)` from `send`. In `defaultCreateConnection`, `connection.send([...messages], data, signal)` shallow-copies the readonly array for the transport's mutable API while preserving every element, part, and object reference intact.
- App-forwarded `data` and linked caller/disposal `signal` continue to be forwarded directly as-is to `upstream.send`.
- Caller cancellation signal remains linked with the internal connection disposal controller via `AbortSignal.any([controller.signal, caller])`, ensuring proper cancellation semantics without orphan requests.
- `toDurableMessage` is retained strictly for `toNetScriptChatResponse` when handling server-side `newMessages` response formatting where reduced text projection is intentional.

### 3. Existing reduced rendering projection & single physical subscription preserved
- `NetScriptChatMessage` remains strictly the reduced rendering projection (`{ id, role, content: string }`) used by `resolveChatSnapshot` and `projectChatSnapshot` to satisfy the ONE-PROJECTION LAW. It is neither widened nor overloaded as the send input schema.
- `createChatSubscriptionHub` in `packages/fresh/src/internal/chat-subscription-hub.ts` remains completely untouched. Multiple logical subscribers share a single underlying physical stream subscription.

### 4. Proposed three causal tests & real-transport validation
The plan mandates three distinct, non-mock-only test gates:
1. **Native compile consumer fixture:** Validates that native `UIMessage` (from `@tanstack/ai-preact`) and `ModelMessage` (from `@tanstack/ai`) assign to `send` without type casting, and verifies compile-time rejection of malformed inputs lacking both parts and content. Uses existing declared imports with no new direct dependencies or lockfile churn.
2. **Injected identity & lifecycle contract test:** Verifies exact reference identity of messages and data across the adapter seam, multimodal parts/attachments survival, linked caller abort and connection disposal, idempotent teardown, and that `send` does not create extraneous subscriptions. Causal source mutation (reintroducing text mapping) causes an immediate assertion failure.
3. **Actual default native durable transport HTTP fixture:** Uses an owned local `Deno.serve` HTTP/SSE endpoint to exercise `durableStreamConnection` directly without mocking `createConnection`. Verifies wire JSON POST payloads (`{ messages, data }`), active live SSE connection shared by multiple subscribers, caller-aborted and disposal-aborted in-flight sends, and clean connection termination. Causal mutation (reintroducing projection in `send`) causes wire JSON mismatch and real assertion failure.

---

## Open-decision sweep (evaluator-run)

Evaluator inspection confirms:
1. No open architectural decisions exist.
2. The owned structural union `NetScriptChatSendMessage` cleanly bridges native UI and Model message shapes without creating an upstream dependency coupling or introducing slow types.
3. Forwarding `data` and preserving linked signals directly aligns with the underlying `@durable-streams/tanstack-ai-transport` contract.
4. Preserving `toDurableMessage` for server-side response creation maintains backward compatibility for existing server routes while fixing the client send regression reported in #2068.
5. No decisions are deferred that would force rework during or after implementation.

---

## Risk register & architecture debt evaluation

### Risk mitigations
The plan identifies 10 concrete operational risks and couples each with a verifiable mitigation. Causal mutations for all three test gates guarantee that regressions in message shape, wire serialization, or subscription lifecycle cannot pass undetected.

### Architecture debt (`.llm/harness/debt/arch-debt.md`) & Doc Gate Evaluation
Review of `.llm/harness/debt/arch-debt.md` at immutable main `8aad14940c52cd3a4db7efa57d56d50ae131df6c`:
- The historical entry `packages/fresh — F-7 full package doc-lint residue after 5d1` (recorded resolved on 2026-06-14) does not prove that current full-package doc-lint on immutable main is green across all configured entrypoints without measurement. Prior historical resolutions cannot be used to claim the absence of raw existing doc findings before qualification.
- The plan therefore mandates all-entrypoint doc-lint baseline verification as a required gate before and during qualification (`deno task doc-lint` across all 17 package entrypoints).
- If unchanged raw doc-lint diagnostics exist in the unchanged baseline across the entrypoints, they must not be silently masked or assumed zero; instead, IMPL-EVAL must explicitly adjudicate them with designated owner, target release/milestone, and closing gate against the unchanged baseline.
- The planned changes to `@netscript/fresh/ai` must introduce zero new doc-lint diagnostics: `NetScriptChatSendMessage` must be fully documented with complete JSDoc tags, contain no unexported/private type references, and be cleanly re-exported from `./mod.ts`.
- No new architecture debt is introduced by this plan.

---

## Verdict

`PASS`

The locked immutable-main plan satisfies all eight Plan-Gate checklist requirements. Architecture decisions D1–D4 rigorously resolve issue #2068 by separating the rich send input contract from the reduced rendering projection, preserving full message parts, forwarded data, and subscription multiplexing without introducing upstream type leaks or scope creep. Implementation of Slice S1/S2 may proceed upon fresh-main re-baseline verification.

### Standing conditions
- **Fresh-main re-baseline equality:** Prior to implementation, `git fetch` and verify that the target branch re-baselines cleanly against `8aad14940c52cd3a4db7efa57d56d50ae131df6c`.
- **Sequential slice execution:** Slices S1–S5 must be executed in order with individual causal mutation proofs.
- **Doc gate baseline adjudication:** All-entrypoint doc-lint baseline verification is required; any pre-existing unchanged raw diagnostics must be explicitly adjudicated with owner, target, and closing gate at IMPL-EVAL rather than claiming raw zero beforehand.
- **Mandatory independent IMPL-EVAL:** Implementation must be evaluated by a separate vendor family upon completion before PR handoff.
- **PR unmerged handoff:** The resulting PR remains unmerged (`Refs #2068`), with downstream EIS chat adapter removal deferred until published package qualification.
- **Process hygiene:** No operator paths, hostnames, IP addresses, ports, tokens, or usage metrics in public artifacts or PR descriptions.
