# Research — feat-496-token-history--codex

## Re-baseline

- Carried-in source: issue #496 and the slice brief.
- Re-derived against baseline `955b4abf639522c7da50bd15d20c6e999acb808f` on 2026-07-11.
- Current `packages/ai/src/agent/history.ts` contains the pure, order-preserving `HistoryStrategy`
  seam and only `slidingWindowHistory`; `packages/ai/agent.ts` is the exported `./agent` entrypoint.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | Issue #496's acceptance line requires an additive exported strategy, leading-system preservation, unit tests, and a JSDoc example. | `gh issue view 496` |
| 2 | `HistoryStrategy.apply` accepts readonly messages and promises purity/order preservation. | `packages/ai/src/agent/history.ts` |
| 3 | Message content is either a string or ordered multimodal parts. | `packages/ai/src/contracts/content.ts` |
| 4 | `@netscript/ai/agent` already exports history vocabulary from `agent.ts`; the package export map itself need not change. | `packages/ai/agent.ts`, `packages/ai/deno.json` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/ai/agent.ts` (`./agent` export).
- Risks: exported options/estimator types and factory need explicit types and symbol docs; the new
  public factory needs the requested runnable JSDoc example. No export-map change is planned.

## Open questions

- None. The owner contract fixes preservation, estimator default/pluggability, and export location.
