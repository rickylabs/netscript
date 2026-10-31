**PLAN-EVAL, issue 2269 (read-only, blockers only)**

### What holds
- **Package seam is sound.** The CLI already depends on MCP (`packages/cli/deno.json:29`). No MCP source imports CLI code; the only `packages/cli` matches in MCP are path strings and tests. The CLI transport (`agent-docs-transport.ts`) depends only on `llms-policy.generated.ts`, so moving the transport, the policy and the page data under `@netscript/mcp/docs` creates no import cycle. The docs are put together in MCP's own `cli.ts:142-165`, which is where `ReleaseEmbeddedDocsCorpus` gets its data, so the full corpus replaces the curated `MCP_EMBEDDED_DOCS` cleanly. No new package is needed.
- **Full corpus and slug aliases.** The carrier holds all six issue slugs as `pages/<slug>/index.md`: `reference/kv`, `observability/telemetry`, `observability`, `data-persistence/kv-queues-cron`, `background-processing/workers` and `durable-workflows/streams`. The existing `normalizeDocsSlug` already strips `/index` and the extension. Adding equivalence with and without `pages/` makes every one of them resolve. The 4 MiB per-page limit is far above the largest page, and the measured sizes justify embedding everything rather than loading pages lazily.
- **Gates exist.** `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus`, `quality:gate` and `doc:lint` are all defined in the root `deno.json`.

### Blocking gap
**The `search_docs(withReadinessCheck)` case has no achievable expected outcome, and the research did not catch that the issue's premise is wrong.**
- The issue says `ServiceBuilder.withReadinessCheck` is "documented under `pages/services-sdk/services`". It is not. `withReadinessCheck` appears nowhere under `docs/`. It exists only in `packages/service/src/builder/*` and in the export-surface corpus, which does cover `@netscript/service`.
- `search_docs` tokenizes on `[\p{Letter}\p{Number}]+` and matches substrings in lowercase text (`filesystem-docs-corpus.ts:401-430`). So the query `withReadinessCheck` becomes the single term `withreadinesscheck`. That term occurs in no page, so the full corpus still returns `{count: 0, matches: []}` (`docs-flows.ts:46-55`).
- The plan gives an explicit low-confidence or no-seam answer only to `find_guidance`. For `search_docs` it adds nothing beyond citations on "release responses". An empty match list does not meet the acceptance requirement of "matching page/section or an explicit 'no seam documented' answer, with version citations".
- The plan also leaves a fixture "for API search" without saying what it expects. That invites either a fixture that asserts zero results and calls it a pass, or an off-scope edit to `docs/site`, which is outside the declared write surface.

**Required plan fix:**
1. Record in the research that `withReadinessCheck` is undocumented in prose but present in the `@netscript/service` export corpus.
2. Choose the `search_docs` behaviour for this case and make it a regression fixture with a negative control. Options are an explicit no-seam or low-confidence result that carries the release and corpus citation (and may point to the export-surface tools), or a defined split-token or export-corpus fallback that returns `services-sdk/services#health-readiness-liveness`.
3. Say that every `search_docs` response, including zero matches, carries the version citation.

Nothing else blocks.

VERDICT: FAIL_PLAN
