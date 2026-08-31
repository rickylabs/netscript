# Research — fix-ai-usage-detail-passthrough--0.0.7

## Re-baseline

- Carried-in source: leaf brief for issue #1677. The issue's cited path was treated as stale input,
  not as repository truth.
- Re-derived against local `main` and branch base `0274c0a707e36ded3b4470a3911315f963e642d4` on
  2026-08-31. `HEAD`, `merge-base HEAD main`, and the clean branch base were all that SHA; the
  checkout is not shallow.
- Corrected locations:
  - the live bridge is `packages/ai/src/adapters/tanstack-chat-client.ts`, not the removed
    `src/providers/tanstack-bridge.ts` path cited by the issue;
  - `EventType.RUN_FINISHED` maps usage at line 255 of the base tree;
  - `toOwnedUsage` begins at line 362 and narrows its parameter at line 363.
- Base branch: `fix/ai-usage-detail-passthrough`, which conforms to the `netscript-pr` fix-branch
  convention. An eventual resolving PR must use `Closes #1677`, `type:fix`, `area:ai-core`, exactly
  one lifecycle `status:` label, and milestone `0.0.7`; S1 does not open or mutate a PR.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                                                                                                              | How to verify                                                                                                                                     |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | The defect is current. `toOwnedUsage` accepts a hand-written three-field object and constructs a new three-field object. TypeScript therefore cannot warn when `chunk.usage` carries more fields.                                                                                                                                                                                                                                    | `sed -n '246,375p' packages/ai/src/adapters/tanstack-chat-client.ts`                                                                              |
| 2  | The loss occurs at the package's documented single anti-corruption boundary. Consequently cache-hit/cache-write accounting, reasoning detail, provider-reported cost, cost breakdowns, and provider details cannot reach the owned per-turn finish event.                                                                                                                                                                            | Module JSDoc in `tanstack-chat-client.ts`; `ChatFinishEvent.usage` in `src/ports/chat-client.ts`                                                  |
| 3  | The resolved upstream package is `@tanstack/ai@0.39.0`; its canonical type is `TokenUsage<TProviderDetails = ProviderUsageDetails>`. `RunFinishedEvent.usage` is `TokenUsage                                                                                                                                                                                                                                                         | undefined`.                                                                                                                                       |
| 4  | Upstream `TokenUsage` contains core totals, both detail objects, `durationSeconds`, `unitsBilled`, `providerUsageDetails`, `cost`, and `costDetails`.                                                                                                                                                                                                                                                                                | The `deno doc` commands above plus filters for `PromptTokensDetails`, `CompletionTokensDetails`, `UsageCostBreakdown`, and `ProviderUsageDetails` |
| 5  | The owned `Usage` contract already has typed homes for all originally reported lost fields: core totals; prompt cached/cache-write/audio/image/text/document; completion reasoning/audio/image/text; cost; the three cost-breakdown fields; and provider details. No public contract change is needed for #1677.                                                                                                                     | `packages/ai/src/contracts/usage.ts`                                                                                                              |
| 6  | Upstream has expanded beyond the brief: prompt `videoTokens`; completion `videoTokens` and `documentTokens`; and top-level `durationSeconds` and `unitsBilled` have no typed owned home. Returning the upstream object unchanged retains these properties at runtime without exporting an upstream type. Typed access is deferred; copying or renaming them into `providerUsageDetails` would invent policy beyond this mapping fix. | Compare the four upstream `deno doc --filter` results with `src/contracts/usage.ts`                                                               |
| 7  | Structural compatibility makes a zero-copy mapping possible: TanStack's required core fields and every owned nested/cost/provider field are compatible with `Usage`; TypeScript permits the upstream-only optional properties. Import `TokenUsage` as a type and return the same object.                                                                                                                                             | Upstream and owned declarations cited above; planned package check                                                                                |
| 8  | `src/mcp/adapters/tanstack-connector.ts` maps tools/resources and has no usage field or usage mapper. It does not share the defect.                                                                                                                                                                                                                                                                                                  | `rg -n 'usage                                                                                                                                     |
| 9  | The direct OpenAI embeddings and vision adapters parse separate, unknown wire payloads into core usage fields. They do not accept `TokenUsage` and are not the typed narrowing at issue. Provider-specific wire-detail support there is separate scope.                                                                                                                                                                              | `parseUsage` in `openai-embeddings.adapter.ts` and `openai-vision.adapter.ts`                                                                     |
| 10 | The agent loop forwards each `finish` usage object unchanged in a per-turn `usage` chunk. Its terminal `done.usage` is a separate, documented multi-turn accumulator that sums only the three additive totals. Extending aggregate semantics for cache, cost, and provider bags is not mechanical and belongs to a separate leaf.                                                                                                    | `packages/ai/src/agent/loop.ts:194-198,291-322`; `packages/ai/docs/architecture.md:121-123`; `packages/ai/tests/agent_loop_test.ts`               |
| 11 | No consumer or documentation asserts that a per-turn `ChatFinishEvent.usage` has exactly three fields. Three-field assertions concern direct embeddings/vision payloads or the deliberately core-only terminal aggregate. No docs need changing for this leaf.                                                                                                                                                                       | Package-wide `rg` for `usage`, `promptTokens`, `completionTokens`, and `totalTokens`                                                              |
| 12 | A dedicated boundary test can exercise the real `chat()` bridge with a fake `AnyTextAdapter` that yields `RUN_FINISHED`; this tests translation without provider/network runtime. Existing request-context tests demonstrate the fake-adapter pattern.                                                                                                                                                                               | `packages/ai/tests/request_context_test.ts:196-292`                                                                                               |

## Upstream-to-owned field map

Resolved upstream source: `@tanstack/ai@0.39.0`, whose `TokenUsage` declaration is re-exported from
`@tanstack/ai-event-client@0.6.8`.

| Upstream field                            | Owned home                   | S2 treatment                                                                                                                          |
| ----------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `promptTokens`                            | `Usage.promptTokens`         | Preserve unchanged.                                                                                                                   |
| `completionTokens`                        | `Usage.completionTokens`     | Preserve unchanged.                                                                                                                   |
| `totalTokens`                             | `Usage.totalTokens`          | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.cachedTokens`        | same path                    | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.cacheWriteTokens`    | same path                    | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.audioTokens`         | same path                    | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.imageTokens`         | same path                    | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.textTokens`          | same path                    | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.documentTokens`      | same path                    | Preserve unchanged.                                                                                                                   |
| `promptTokensDetails.videoTokens`         | no typed owned home          | Retain in the unchanged runtime object; defer typed contract support. Do not invent a field or re-key it into `providerUsageDetails`. |
| `completionTokensDetails.reasoningTokens` | same path                    | Preserve unchanged.                                                                                                                   |
| `completionTokensDetails.audioTokens`     | same path                    | Preserve unchanged.                                                                                                                   |
| `completionTokensDetails.imageTokens`     | same path                    | Preserve unchanged.                                                                                                                   |
| `completionTokensDetails.textTokens`      | same path                    | Preserve unchanged.                                                                                                                   |
| `completionTokensDetails.videoTokens`     | no typed owned home          | Retain at runtime; defer typed contract support.                                                                                      |
| `completionTokensDetails.documentTokens`  | no typed owned home          | Retain at runtime; defer typed contract support.                                                                                      |
| `cost`                                    | `Usage.cost`                 | Preserve unchanged.                                                                                                                   |
| `costDetails.upstreamCost`                | same path                    | Preserve unchanged.                                                                                                                   |
| `costDetails.upstreamInputCost`           | same path                    | Preserve unchanged.                                                                                                                   |
| `costDetails.upstreamOutputCost`          | same path                    | Preserve unchanged.                                                                                                                   |
| `providerUsageDetails`                    | `Usage.providerUsageDetails` | Preserve the entire provider bag unchanged.                                                                                           |
| `durationSeconds`                         | no typed owned home          | Retain at runtime; defer typed contract support.                                                                                      |
| `unitsBilled`                             | no typed owned home          | Retain at runtime; defer typed contract support.                                                                                      |

## Sibling-boundary disposition

- In scope: only the TanStack `RUN_FINISHED` → owned `ChatFinishEvent` boundary.
- Separate leaf if desired: aggregate detail semantics for terminal `AgentChunk` `done.usage`.
  Summing cache counts may be meaningful, but cost/provider bags and unit/duration fields need an
  explicit aggregation contract. Pulling that into #1677 would exceed a mapping repair.
- Not the same defect: MCP tool/resource conversion and raw OpenAI embeddings/vision parsers.

## Consumer and documentation impact

- The public `Usage` contract, `ChatFinishEvent`, exports, README, and architecture page already
  describe real provider usage and do not promise a three-field per-turn shape.
- Existing aggregate examples and assertions remain correct for `done.usage`; they must not be
  rewritten to imply detail aggregation.
- No consumer or docs file is in the product path ceiling.

## jsr-audit surface scan

- Surface scanned: all 13 `packages/ai/deno.json` exports using the package audit and full-export
  doc-lint wrapper.
- Public symbol-count baseline (must remain byte-for-byte equivalent by export count/signature):
  `.=28`, `./anthropic=2`, `./openai-compatible=5`, `./openai-embeddings=3`, `./openrouter=5`,
  `./ollama=7`, `./mcp=11`, `./agent=7`, `./skills=6`, `./contracts=10`, `./ports=17`, `./tools=4`,
  `./testing=12`.
- `audit-jsr-package` base result: exit 0, dry-run OK, one slow-type warning, two findings total:
  existing `src/ports` cardinality 13 (cap 12) and existing slow-types output.
- Full export doc-lint base result: exit 1 with 9 failing entrypoints and 128 `private-type-ref`
  diagnostics distributed as `agent=20`, `anthropic=5`, root `mod=26`, `ollama=5`,
  `openai-compatible=8`, `openrouter=5`, `ports=35`, `testing=17`, `tools=7`; all other entrypoints
  are zero. This is a measured pre-existing red and is an exact non-increase contract, not a
  promised green.
- Slow-type / surface risk from this plan: none added. `TokenUsage` remains a type-only internal
  adapter dependency; `toOwnedUsage` remains internal; no `deno.json`, entrypoint, contract, or
  corpus file changes.

## Measured base gates

All commands were run at base SHA `0274c0a707e36ded3b4470a3911315f963e642d4` and were static,
package-scoped, and read-only.

| Gate                        | Base result                                                                                                                 | Locked non-increase contract                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Scoped check                | PASS, 100 files, 0 occurrences                                                                                              | PASS, 0 occurrences.                                                                                             |
| Scoped lint                 | PASS, 100 files, 0 findings                                                                                                 | PASS, 0 findings.                                                                                                |
| Scoped format               | PASS, 100 files, 0 findings                                                                                                 | PASS, 0 findings.                                                                                                |
| Code-quality scan           | PASS, 0 findings, 0 allowances                                                                                              | PASS, 0 findings and no new allowance.                                                                           |
| Doctrine scan               | exit 0, one warning: F-16 `src/ports` has 13 children                                                                       | No additional warning; existing count must not increase.                                                         |
| JSR audit / publish dry-run | exit 0; dry-run OK; 1 slow-type warning; 2 findings                                                                         | Exit 0; slow warnings ≤1; findings ≤2; no surface-count/signature change.                                        |
| Full-export doc lint        | exit 1; 9 entrypoints / 128 private refs; 0 missing JSDoc                                                                   | Exit may remain 1, but no entrypoint count may increase, no new failing entrypoint, and missing JSDoc remains 0. |
| Focused regression test     | New test path absent; package census has 20 test files. Not executed in S1 because this phase permits static commands only. | New focused test passes in S2; package test count becomes 21 only because of the ceiling-listed regression file. |
| Lock hygiene                | `deno.lock` SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`                                      | Byte-identical hash.                                                                                             |

## Open questions

All implementation-forcing decisions are closed. Typed owned homes for the five newer upstream
fields are safe to defer because the zero-copy mapping retains them at runtime and #1677's stated
cache/reasoning/cost/provider fields already have owned homes. A future contract leaf may decide
whether to add typed fields or document an opaque access convention.
