
## Registered public configuration

Add `packages/ai/anthropic.ts` to the mutation surface: its registered factory currently drops every configuration key except apiKey/baseURL, so a class-only fix would leave the public registry broken.

## Stream gate repair

The existing bridge let TanStack’s internal loop issue three requests per owned tool turn. Its module documentation promises client tools and an outer NetScript execution loop. The reported issue explicitly requires stream/tool regressions; restore that single-turn contract using public `maxIterations(1)`. Regression asserted six-versus-two requests before this change and now passes.

## Documentation and release

Add `packages/ai/anthropic.ts` for registered config and refresh the existing docs/carriers. Leave workspace/package versions and dependency graph unchanged; stable 0.0.8 publication is a dependent maintainer release gate. No independent fan-out work remains.

## Validation environment and evaluator isolation

Use an executable project worktree for Harness checks; /ephemeral is noexec. Temporarily relocate injected assignment outside docs checks and restore it byte-for-byte; never commit it. Correct source graph docs from the reported consumer0.52.3 to actual workspace0.52.0, while independently testing exact0.52.3. Discard automatic deno.lock peer-key normalization; dependencies and versions remain untouched. Repeat the same evaluator session in its detached checkout after its tool workdir pointed at author checkout. Required regenerated documentation carriers are part of the existing docs publication chain. Early drafts require a later evidence/carrier commit; do not rewrite published commit history.

## Continuation audit — standard streamed usage

The full objective remains open: requested-scope item5 requires a stable publish and actual released consumer proof. Registry metadata fetched through Deno confirms latest0.0.7 and no0.0.8; source PR2078 and delivery PR602 are open and ready. Previous turn made progress by committing/shipping; it did not prove complete upstream acceptance.

Anthropic's current primary streaming example sends input usage only in message_start and output usage in message_delta (https://platform.claude.com/docs/en/build-with-claude/streaming, retrieved2026-10-05). The existing mock repeated input_tokens in the final delta. Installed adapter0.18.3 processAnthropicStream ignores message_start usage (src/adapters/text.ts:1006), then normalizes only event.usage from message_delta (:1420). Source acceptance item4 and the named stream-usage gate require the standard stream too. Replace that fixture repetition with the standard output-only delta, prove assertion failure, and preserve reported cumulative usage via the public TanStack debug Logger provider-frame hook. The observer filters usage fields and emits no raw logs. No SDK mutation, private import or dependency change. Extend the existing Anthropic/bridge mutation surface only; after scoped gates, re-steer the same independent GLM session for the changed source.
