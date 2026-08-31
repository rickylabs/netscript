# Worklog — #1591 typed OpenAI Responses generation-options mapper

Backfilled by the features supervisor after the IMPL-EVAL noted this file had never existed. Git
history confirms it was never created rather than lost; the design and gate evidence lived in
`plan.md`, `tier-a.md`, and the PR body throughout, so nothing is being reconstructed from memory —
this consolidates what those already record.

## Shape of the work

A single bounded slice. `OpenAiCompatibleModelProviderConfig.api?: 'chat-completions' | 'responses'`
already existed and was already threaded to the underlying TanStack client; the gap was that
`mapModelOptions` was hardcoded to `openAiCompatibleGenerationModelOptions`, which emits the Chat
Completions shape (flat `reasoning_effort`, `max_tokens`) regardless of `api`.

Added `openAiResponsesGenerationModelOptions` — nested `reasoning: { effort }`, `max_output_tokens`,
`'off'` omitting the key entirely, empty options → `undefined` — and selected it in
`createChatClient` only when `api === 'responses'`. Field names were verified against the official
OpenAI Responses `create` reference **before** dispatch, not after.

## Explicit non-scope

The Responses API's response/streaming side — discriminated output items, `call_id` correlation,
`response.output_item.*` events — is materially larger and is **not** touched. Whether the pinned
`@tanstack/ai-openai/compatible` handles that correctly under `api: 'responses'` is unverified and
recorded in `research.md` as a candidate follow-up rather than absorbed here.

## Evidence

Tier-A ACCEPTED at content head `ff7d2de60ef470c312d633b851975d67a6774471`; see `tier-a.md` for the
gate table. IMPL-EVAL `ACCEPTED_WITH_FINDINGS` at the same content head (`evaluate.md`), with no
blocking findings — it re-derived the wire shape from the authoritative `openai-node` sources rather
than from the sibling mapper, and independently re-ran every gate through the cache-bypassed route.

**D-1 was found on this leaf** (`drift.md`): `run-gate.ts`'s `check`/`lint`/`fmt-check` catalog gates
can return `PASS`/exit 0 with **zero-byte stdout** and a `(cached, inputs unchanged)` stderr marker,
certifying nothing. Re-verified via direct wrapper invocation. That finding has since been carried
into every subsequent leaf's brief in this lane.

## Integration

Integrated with `main` after Tier-A, to bring the post-#1792 evaluator allowlist into the worktree —
the model guard reads it from the checked-out tree, not from `main`, so without this the sanctioned
GLM route is denied at the proxy. **`git diff <content>..<evidence> -- packages/ai` is empty**: the
integration moved no product source, so the certified content is unchanged.

The MCP export corpus sha differs between the content head (`a3c4c91e…`, cited in `tier-a.md` and the
PR) and the evidence head (`4f33fd93…`). That is the integration changing the export surface **outside**
`packages/ai`, not drift in this slice — recorded here so it is not misread later.
