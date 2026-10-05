
## Registered public configuration

Add `packages/ai/anthropic.ts` to the mutation surface: its registered factory currently drops every configuration key except apiKey/baseURL, so a class-only fix would leave the public registry broken.

## Stream gate repair

The existing bridge let TanStack’s internal loop issue three requests per owned tool turn. Its module documentation promises client tools and an outer NetScript execution loop. The reported issue explicitly requires stream/tool regressions; restore that single-turn contract using public `maxIterations(1)`. Regression asserted six-versus-two requests before this change and now passes.

## Documentation and release

Add `packages/ai/anthropic.ts` for registered config and refresh the existing docs/carriers. Leave workspace/package versions and dependency graph unchanged; stable 0.0.8 publication is a dependent maintainer release gate. No independent fan-out work remains.

## Validation environment and evaluator isolation

Use an executable project worktree for Harness checks; /ephemeral is noexec. Temporarily relocate injected assignment outside docs checks and restore it byte-for-byte; never commit it. Correct source graph docs from the reported consumer0.52.3 to actual workspace0.52.0, while independently testing exact0.52.3. Discard automatic deno.lock peer-key normalization; dependencies and versions remain untouched. Repeat the same evaluator session in its detached checkout after its tool workdir pointed at author checkout. Required regenerated documentation carriers are part of the existing docs publication chain. Early drafts require a later evidence/carrier commit; do not rewrite published commit history.
