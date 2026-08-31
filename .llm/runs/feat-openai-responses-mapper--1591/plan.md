# Plan — #1591 typed OpenAI Responses generation-options mapper

**PLAN-EVAL: N/A.** Small, mechanical, single-file addition with a complete contract/scope/
acceptance/gates record. The target wire shape is dictated by the real OpenAI Responses API, the
implementation pattern is already established five times over in the same file
(`anthropicGenerationModelOptions`, `openAiCompatibleGenerationModelOptions`,
`openRouterGenerationModelOptions`, `openRouterReasoningModelOptions`, `ollamaGenerationModelOptions`),
and the acceptance bar is pure-function unit-test parity with the existing
`packages/ai/tests/generation_options_test.ts` suite. No genuinely complex or critical design
decision is present.

## Problem (from #1591)

`OpenAiCompatibleModelProviderConfig.api?: 'chat-completions' | 'responses'` already exists and is
already threaded to the underlying `@tanstack/ai-openai/compatible` client
(`packages/ai/src/adapters/openai-compatible.adapter.ts`), but the generation-options mapper passed
as `mapModelOptions` is unconditionally `openAiCompatibleGenerationModelOptions`, which targets the
Chat Completions wire shape (flat `reasoning_effort`, `max_tokens`) regardless of `api`. A caller
targeting the Responses API today must hand-project `reasoning.effort` and `max_output_tokens`
through the `GenerationOptions.providerOptions` escape hatch themselves.

## Locked decisions

- **LD-1.** Add one new pure function, `openAiResponsesGenerationModelOptions(options:
  GenerationOptions): Readonly<Record<string, unknown>> | undefined`, in the same file as its four
  siblings. Exported, matching every existing mapper's visibility.
- **LD-2.** Mapping, mirroring `openAiCompatibleGenerationModelOptions`'s exact conditional
  structure: `reasoningEffort` (excluding `'off'`, same omit-on-off convention as every other mapper)
  → `reasoning: { effort }`; `maxOutputTokens` → `max_output_tokens`. Returns `undefined` when the
  options carry nothing OpenAI models, exactly like its sibling.
- **LD-3.** `OpenAiCompatibleModelProvider.createChatClient` selects the mapper by `this.#config.api`:
  `'responses'` → the new mapper; unset or `'chat-completions'` → the existing mapper (preserves
  current default behavior for every existing caller with zero change).
- **LD-4.** No change to `toTanstackChatClient`, retry/no-replay-after-output behavior, streaming,
  cancellation, or any other adapter concern. This slice is the mapping function and its one
  selection branch — nothing else.

## Ceiling

- `packages/ai/src/adapters/openai-compatible.adapter.ts`
- `packages/ai/tests/generation_options_test.ts`
- `packages/ai/tests/openai_compatible_test.ts`

No other file. In particular: no change to `packages/ai/src/contracts/generation.ts` (the neutral
vocabulary is already sufficient — this is purely an adapter-side mapping addition), no change to
`toTanstackChatClient`, no change to any other provider adapter.

## Required test coverage

In `generation_options_test.ts`, alongside the existing "openai-compatible" block: effort-tier
mapping to `reasoning: { effort }`, `off` omitting the `reasoning` key entirely (not
`reasoning: undefined` — prove with `Object.hasOwn` if that distinction matters, matching this
lane's established preference for absence-proving over equality-only assertions), `maxOutputTokens`
mapping to `max_output_tokens`, and the empty-options → `undefined` case — one test block per the
existing style, not merged into unrelated blocks.

In `openai_compatible_test.ts`: at least one test proving `createChatClient` actually selects the new
mapper when `api: 'responses'` is configured, and continues selecting the existing mapper when `api`
is unset or `'chat-completions'` — this is the one behavior this slice adds beyond a pure function,
and it needs its own proof, not just the pure-function tests.

## Tier-A stop

Scoped `check`/`lint`/`fmt` (`packages/ai`); `packages/ai` test suite; `docs:exports-drift` (the new
export is a public symbol); `mcp-export-corpus`; `deno.lock` hash check.

## Acceptance

- [ ] `openAiResponsesGenerationModelOptions` exported, matches LD-2's mapping exactly.
- [ ] `createChatClient` selects it only when `api: 'responses'`.
- [ ] All required test coverage present and passing.
- [ ] Ceiling respected exactly; `deno.lock` byte-identical.
- [ ] `Refs #1591` in the PR body; closing keyword only if this PR fully resolves the issue (it does —
      single bounded scope, no multi-slice plan).
