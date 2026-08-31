# Research — #1591 typed OpenAI Responses generation-options mapper

## Existing seam, already half-built

`packages/ai/src/adapters/openai-compatible.adapter.ts` already declares
`OpenAiCompatibleModelProviderConfig.api?: 'chat-completions' | 'responses'`, already threaded
verbatim into the underlying `@tanstack/ai-openai/compatible` `openaiCompatible({ ..., api })`
factory call. The gap is narrower than "no Responses support at all": the **generation-options
mapper** passed as `mapModelOptions` to `toTanstackChatClient` is unconditionally
`openAiCompatibleGenerationModelOptions`, which emits the Chat Completions request shape
(`reasoning_effort` flat, `max_tokens`) regardless of `api`.

## Wire shape, verified against the authoritative reference

Coordinator-supplied evidence, independently confirmed via
`https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create`:

- **Reasoning effort (request body):** `reasoning: { effort: "high" | "medium" | "low" }` — a nested
  object, not OpenAI-compatible Chat Completions' flat `reasoning_effort` string.
- **Output token limit (request body):** `max_output_tokens` — a differently-named field from Chat
  Completions' `max_tokens`.

Both match the issue's own "Expected" text (`nested reasoning effort and max_output_tokens`) and the
plan's LD-2 exactly.

## Response-side complexity exists — explicitly out of #1591's scope

The same coordination evidence describes the **response** side of the Responses API in real depth:
`response.output` is a discriminated-union array (`message` items with `content` parts such as
`output_text`; `function_call` items carrying `type`, `call_id`, `name`, a JSON `arguments` string,
and `status`; plus `file_search_call`/`web_search_call` item kinds), and streaming surfaces
`response.output_item.added`/`.done`, `response.output_text.delta`/`.done`, and
`response.content_part.added`/`.done` events keyed by `output_index`/`item_id`.

**This is a materially different, larger problem than #1591 asks for.** #1591's issue text is
explicit and narrow: "Publish a typed OpenAI Responses adapter/mapper that accepts NetScript
generation options and produces the Responses API request shape, including reasoning effort and
output-token limits." That is the request-side generation-options mapper only — the same shape as
the four sibling mappers already in this file, all of which are pure `GenerationOptions →
Record<string, unknown>` functions with no response-parsing responsibility.

Whether `@tanstack/ai-openai/compatible`'s existing `api: 'responses'` handling correctly parses the
discriminated response/streaming shape (preserving `call_id`/`type` correlation rather than
flattening unknown item kinds into a Chat-Completions-shaped delta) is **not verified by this
research and not addressed by this slice's plan**. If that seam is broken, it is a separate,
materially more complex problem — full response/streaming event mapping, likely warranting its own
issue and probably its own PLAN-EVAL given the discriminated-union correctness bar — not a ceiling
widening of #1591, which the coordinator's own guidance explicitly declined to authorize. Recording
this as a candidate follow-up rather than silently absorbing it.

## Conclusion

#1591's plan (`plan.md`) is unchanged by this research: one new pure function
(`openAiResponsesGenerationModelOptions`) plus one selection branch in `createChatClient`, verified
against the authoritative request-body field names. The response/streaming discriminated-union
concern is noted for a possible future issue, not folded into this one.
