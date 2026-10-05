
## Registered public configuration

Add `packages/ai/anthropic.ts` to the mutation surface: its registered factory currently drops every configuration key except apiKey/baseURL, so a class-only fix would leave the public registry broken.

## Stream gate repair

The existing bridge let TanStack’s internal loop issue three requests per owned tool turn. Its module documentation promises client tools and an outer NetScript execution loop. The reported issue explicitly requires stream/tool regressions; restore that single-turn contract using public `maxIterations(1)`. Regression asserted six-versus-two requests before this change and now passes.

## Documentation and release

Add `packages/ai/anthropic.ts` for registered config and refresh the existing docs/carriers. Leave workspace/package versions and dependency graph unchanged; stable 0.0.8 publication is a dependent maintainer release gate. No independent fan-out work remains.
