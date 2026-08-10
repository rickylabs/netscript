# Research — docs-1334-homepage-capability-story--leaf

## Re-baseline

- Carried-in source: issue #1334 brief and locked plan v2 decisions D10, D12, and D13.
- Re-derived against `origin/main` @ `714a4ef9b6541a2efe83b269cef2083e2edbfd1b` on 2026-08-10.
- `git fetch origin && git log --oneline -3 origin/main` confirmed L1 PR #1441 and L3 PR #1440.
- `git show 714a4ef9b -- docs/site/index.vto docs/site/_diagrams/contract-flow.mmd` confirmed the
  four-tab two-origin flow, generated DB predecessor, and wide diagram viewport already landed.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The homepage destination selector is a five-item lane chooser, not the capability surface. | `docs/site/index.vto`; `docs/site/_plugins/check-rendered-output.ts` |
| 2 | Capability outcomes can be inserted as `comp.cardsGrid` between type flow and “Where to go” without changing the five-item assertion. | `docs/site/_components/cardsGrid.vto` and checker |
| 3 | A card `href` wraps its body; nested body links are invalid. | `docs/site/_components/cardsGrid.vto:18`; rendered DOM probe required in slice 2.2 |
| 4 | L1 owns the generated-schema two-origin wording and the only `wide: true` diagram use on the page. | merge `714a4ef9b`; `docs/site/index.vto` |
| 5 | Canonical task destinations exist and `/capabilities/*` is redirect-only legacy. | supplied F1/F2 inventory plus source-path checks |
| 6 | Workers live at `/background-processing/workers/`; agent discovery lives at `/ai/agent-tooling/`. | canonical pages and warnings in `docs/site/ai/mcp.md` |
| 7 | New homepage claims must describe current seams; doctrine target-state restructuring is not a current capability claim. | `SCOPE-docs.md`; doctrine 08 and 10 |

## jsr-audit surface scan

- N/A: docs-only leaf; no package/plugin export or publish surface changes.

## Open questions

- None. The owner supplied canonical destinations, grouping constraints, mechanical gates, and
  the required validation matrix.
