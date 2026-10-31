# HOST-POLICY-PUBLISHED-GRAPH-2396 — closing-gate evidence (2026-10-31T22:06:56Z)

1. Exact canary published through the release workflow: `0.0.9-canary.1` (tag `v0.0.9-canary.1`), release-canary.yml run 41244658746 from main `f4aa307b5`; `release/canary-pair` = success ("Canary 0.0.9-canary.1 publish + pinned production E2E passed").
2. Both singular factory imports and consumer types against that package graph: `deno check --no-config --minimum-dependency-age=0 consumer.ts` exit 0 (deno 2.9.7), consumer below.
3. `e2e-cli-prod` for the same exact canary: run 41245117092 (Published CLI runtime smoke) success, dispatched by the canary workflow.

```ts
// Published-graph consumer proof for HOST-POLICY-PUBLISHED-GRAPH-2396 at 0.0.9-canary.1.
import {
  type PluginServiceContext,
  startWorkersService,
  type WorkersServiceOptions,
} from 'jsr:@netscript/plugin-workers@0.0.9-canary.1/service';
import { startStreamsService, type StreamsServiceOptions } from 'jsr:@netscript/plugin-streams@0.0.9-canary.1/service';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

// Workers: (context, options); Streams: (options). Parameters are exactly the published types.
export type WorkersContextMatch = Assert<Equal<Parameters<typeof startWorkersService>[0], PluginServiceContext>>;
export type WorkersOptionsMatch = Assert<Equal<Parameters<typeof startWorkersService>[1], WorkersServiceOptions>>;
export type StreamsOptionsMatch = Assert<Equal<Parameters<typeof startStreamsService>[0], StreamsServiceOptions>>;
// Both factories resolve to the same published running-service type.
export type SameRunningService = Assert<
  Equal<Awaited<ReturnType<typeof startWorkersService>>, Awaited<ReturnType<typeof startStreamsService>>>
>;

export const factories = { startWorkersService, startStreamsService };
```
