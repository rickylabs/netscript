# IMPL-EVAL — #1458 typed chat-response completion mode

**Evaluator session:** OpenHands (separate from generator lane; implementation lane declined to
self-certify per drift.md) · **Head evaluated:** `520573e1f` (evidence head `96f9cea99`) ·
**Base (trusted, from trigger):** `584caa03f` · **PR:** #1810 · **Issue:** #1458

## Verdict: PASS

## Slice-point evidence

### 1. Ceiling honesty — VERIFIED
`git diff --name-only 584caa03f..520573e1f` outside `.llm/runs/` is exactly:
`packages/fresh/src/runtime/ai/create-chat-connection.ts` (+12),
`create-chat-connection_test.ts` (+83),
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` (regenerated
carrier, +8/-8 lines: sha256 `3a3ff013…`→`b9f23bd8…`, byte counts). Nothing else. `deno.lock`
byte-identical: sha256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`,
`git diff --exit-code -- deno.lock` clean; working tree clean at eval time.

### 2. Upstream fidelity — VERIFIED against pinned source (not the PR paraphrase)
Pinned `@durable-streams/tanstack-ai-transport@0.0.8` (deno.lock:1100; cache path
`…/registry.npmjs.org/@durable-streams/tanstack-ai-transport/0.0.8`):
- `dist/index.d.ts:26-27`: `type ToDurableStreamResponseMode = 'immediate' | 'await'`;
  `type WaitUntil = (promise: Promise<unknown>) => void`; `:80`
  `toDurableChatSessionResponse(options: ToDurableChatSessionResponseOptions): Promise<Response>`.
- `dist/index.js:391`: `const mode = options.mode ?? 'immediate'` — the **transport** owns the
  default; await → `200`; immediate → `202` + `options.waitUntil?.(backgroundTask)`; write errors
  surface only via rejection (await) or the background task (immediate).
Wrapper types (create-chat-connection.ts:247-249) match field names and types exactly.

### 3. Both seams — VERIFIED
- Default transport path: `defaultToResponse` (ts:549-565) forwards `mode: input.mode`,
  `waitUntil: input.waitUntil` into `toDurableChatSessionResponse`.
- Pluggable seam: wrapper (ts:467-474) passes `mode: options.mode`, `waitUntil: options.waitUntil`
  to `options.toResponse ?? defaultToResponse`; seam input type carries both (ts:267-268).
- No local defaulting: omission test asserts `input.mode === undefined` and
  `input.waitUntil === undefined` at the seam (test file ~700-710) — LD-4 honored.

### 4. Behavioral claims — VERIFIED against the real dependency
Test `real chat transport reports status and propagates write failures by completion mode`
(test file:712) boots a real `Deno.serve()` and drives the full real path
`toNetScriptChatResponse → defaultToResponse → pinned toDurableChatSessionResponse`:
awaited success `status === 200`; awaited mid-stream failure rejects with the exact error message
(`assertRejects`, message-matched); immediate mode with the same failing source returns `202`,
registers the background task via `waitUntil`, failure surfaces only on that task; protocol
sequence asserted (`PUT, POST ×3`). Not seam-mocked, not vacuous. Seam-substitution tests cover
forwarding by identity; deny-path test returns 403 without touching the stream.

### 5. Integration correctness — VERIFIED
`520573e1f` merges base `584caa03f` (parents `b818be147` + `584caa03f`); all main-side commits
(docs, sagas spans) arrive **via the base**, not re-applied by this branch. Sole branch-side
conflict was the corpus, resolved by regeneration from tooling — independently reproduced here:
`deno task check:mcp-export-corpus` (LD_LIBRARY_PATH cleared) → **exit 0**, sha256
`b9f23bd8248d0cf3755190bafd9c3770997a2feeec55dd48880dbe37d11d3e48` matches the committed carrier
(35 packages / 271 subpaths / 7677 symbols). Carrier diff is a pure regeneration (hash + counts +
gzip payload), never hand-merged. No product source moved by integration. The prior
`NotCapable: Requires --allow-run … LD_LIBRARY_PATH` failure was environmental (sandbox-injected
env var), not a code defect.

### 6. Receipt integrity — VERIFIED
All four receipts (check/fmt-check/lint/test) at `.llm/runs/…/receipts/`: `gitHead ==
actualGitHead == 520573e1f550950387a9714c3cc724a0ee8053eb`, `outcome: PASS`, `exitCode: 0`,
**non-empty stdout** 303 / 304 / 355 / 301 bytes (sha256 + tail present) — the zero-byte
`deno task` cache-replay trap (plan D-1) is excluded. argv are correctly scoped
(`--include ^packages/fresh/`; focused `packages/fresh/src/runtime/ai`), cut 2026-08-31T03:51-57Z
at the integrated head.

## Protocol checks
- `PLAN-EVAL: N/A` justification present in plan.md (and worklog.md) **before implementation**,
  backed by research.md upstream-source verification — protocol rule 2 satisfied.
- Design checkpoint present (worklog.md §Design: public surface, domain vocabulary, ports,
  constants, slices).
- Archetype 4 false-done states: none present (options-interface widening; consumer seam
  backward-compatible; no README/example drift; omission preserves behavior, tested).
- Consumer gates: seam-capture tests evidence. Exports drift: `deno task docs:exports-drift`
  → PASS at head (the earlier "569 pre-existing errors" context note predates the integrated
  head, where the check passes outright).
- Close-gate: PR #1810 carries `Fixes #1458`; issue #1458 acceptance fully met; the PR DoD's
  single unchecked box ("Separate-session IMPL-EVAL passes") is closed by this verdict itself.
  Issue body has no `gate:` checkboxes (#260 trap n/a).
- E2E/Aspire/Docker/browser gates: protocol-prohibited for this no-lease leaf — correctly not
  run; absence is not a finding.
- Debt: none created or deepened; no doctrine violation (no AP-1…AP-25 implicated); lock hygiene
  clean.

## Findings
1. [MINOR] `check:mcp-export-corpus` failed in the prior sandbox with
   `NotCapable: … LD_LIBRARY_PATH`; environmental, resolved by clearing the injected env var and
   independently reproduced here (exit 0, sha256 match). No action required on the branch.
2. [INFO] PR DoD checkbox "Separate-session IMPL-EVAL passes" intentionally unchecked pending this
   verdict — self-consistent, not a false-done state.
3. [INFO] Context-pack "569 symbol-drift errors (identical both sides)" refers to pre-integration
   triage; at `520573e1f` `docs:exports-drift` passes outright.

## Required action
None blocking. Merge path may proceed per close-gate once the IMPL-EVAL verdict comment lands.

OPENHANDS_VERDICT: PASS
