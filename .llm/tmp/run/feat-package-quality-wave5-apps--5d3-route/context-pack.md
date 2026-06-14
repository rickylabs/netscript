# 5d3 route — context pack (PLAN phase)

Append-only reference bundle for the PLAN-EVAL session.

## Authority docs

- `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` — Wave 5d umbrella (binding).
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d3-plan.md` — this run's handover.
- `AGENTS.md` — operating rules.

## Reused phase-1 artifacts

- `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/research.md`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/deno-doc-lint.txt` (180 combined errors at baseline)
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/deno-doc-lint-raw.txt`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/deno-doc-route.json`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/dry-run-raw.txt`

## Code anchors

- `packages/fresh/route/mod.ts`
- `packages/fresh/route/contract.ts`
- `packages/fresh/route/manifest.ts`
- `packages/fresh/builders/define-page/navigation.tsx`
- `packages/fresh/builders/define-page/types.ts`
- `packages/contracts/versions/v1/`

## Related sub-gates

- 5d1 (PR #34): support spine / `./testing` / error taxonomy / docs scaffold.
- 5d2 (PR #35): builders consume route contracts; `define-page` types are upstream dependency.
