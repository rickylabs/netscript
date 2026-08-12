# Research — fix-1615-ranking--leaf

## Re-baseline

- Carried-in source: issue #1615 and the implementation dispatch brief.
- Re-derived against `main` @ `6aee2b41452cf30a7895a1be7b2eac69da815642` on 2026-08-12.
- Live issue #1615 matches the supplied defect, scope, five acceptance rows, priority P1, and 0.0.6
  milestone. Live sibling PR #1608 remains draft at `9e9a9b6f62129034185287e050b812bc7dcf5f41`.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `packages/mcp` is doctrine Archetype 2 with current verdict **Keep**; guidance ranking is internal domain behavior behind the existing docs corpus ports. | `docs/architecture/doctrine/06-archetypes.md`; `10-codebase-verdict-and-handoff.md`; `deno doc packages/mcp/mod.ts` |
| 2 | The current comparator uses corpus-wide BM25 document frequency and average section length, then applies stable section identity only to exact numeric ties. | `packages/mcp/src/domain/docs/guidance-index.ts` |
| 3 | Base candidate scores are direct `11.80343776647673`, plugin `11.721196841503339`; direct-minus-plugin gap `+0.08224092497339086`. | `.llm/tmp/measure-guidance-ranking-1615.ts` over the checked-in generated corpus; instrumentation top three cross-checked against `GuidanceIndex.find()` |
| 4 | Fresh PR #1608 candidate scores are direct `11.502244339113766`, plugin `11.804224537299888`; direct-minus-plugin gap `-0.3019801981861221` (absolute `0.3019801981861221`). | Same instrumentation over `git show 9e9a9b6f6:packages/mcp/src/publish-assets.generated.ts`; public and instrumented top three agree |
| 5 | Candidate-local evidence did not change: the direct section matches `direct`×2, `application`×6, `reusable`×2 over 1,055 tokens; the plugin section matches `application`×2, stemmed `versus`×2, `integration`×5 over 565 tokens. | Measurement output on both corpora |
| 6 | The fresh order re-derived from PR #1608 head is decision-rule → plugin explainer → unsupported example → direct ownership, so the live head has more movement than the issue's abbreviated rank-three table. | Instrumentation top-three output; recorded in `drift.md` |

## Score measurement

| Corpus | Direct score | Plugin score | Direct − plugin | Absolute gap |
| ------ | -----------: | -----------: | -------------: | -----------: |
| Base `6aee2b414` embedded corpus | `11.80343776647673` | `11.721196841503339` | `+0.08224092497339086` | `0.08224092497339086` |
| Fresh PR #1608 `9e9a9b6f6` embedded corpus | `11.502244339113766` | `11.804224537299888` | `-0.3019801981861221` | `0.3019801981861221` |

The fresh absolute gap is roughly 2.6% of either candidate score and reversed after unrelated corpus
movement. This is a near-tie. It does not support a new concept weight or a golden update.

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/mcp/deno.json` exports plus `deno doc packages/mcp/mod.ts`.
- Planned change: internal ranking policy/comparator and internal tests only; no `mod.ts`, subpath,
  type contract, permission, dependency, README, or generated publish asset change.
- Slow-type / surface risks: none introduced. Full export-map doc lint and package gates remain in
  the validation set; publish dry-run is not needed because the published file set and public
  declarations are unchanged.

## Open questions

- None before implementation. The measured near-tie selects the deterministic tie-break direction.
