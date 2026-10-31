# PLAN-EVAL — round 1

Requested and observed evaluator route: Claude Opus 5.5, high, separate read-only process.

**Verdict: FAIL_PLAN**

There are two blockers. Both are open decisions that the plan marks "No blocking open decisions" (`plan.md:36`). Each one would force rework if it's left to implementation time.

### B1. How diagrams get themed isn't decided, and the likely approaches conflict with an existing gate or the writable surface
- The diagrams aren't hand-drawn SVGs. Mermaid generates them from `docs/site/_diagrams/*.mmd`, and `diagrams:check` re-renders them and fails on any byte difference (`docs/site/_diagrams/render.ts:101-131`, `docs/site/deno.json:12-13`). The surface manifest records them as "diagrams:render output; gate diagrams:check" (`.llm/tools/validation/aspire-surface-manifest.ts:444`). `research.md:7` calls them "authored SVG colours", which is wrong.
- The current palette is copper on dark only (`docs/site/_diagrams/mermaid.config.json:8-24`). The diagrams are embedded with `<img>` (`docs/site/_components/diagram.vto:11`), so they can't pick up `currentColor` or `--ns-*` tokens.
- The plan only says "themed diagram assets" or "themed embedded rendering" (`plan.md:12,19,31`). Each way of doing that breaks something:
  - Editing `assets/diagrams/*.svg` directly breaks `diagrams:check`.
  - Changing the Mermaid config needs `_diagrams/**`, which the supervisor's writable list doesn't include (`supervisor.md:10-18`).
  - CSS on an `<img>` can't produce the two-ink treatment.
- **Required fix:** pick one approach and record it. Either add `_diagrams/mermaid.config.json` (plus a light/dark render strategy) to the writable surface and regenerate with `diagrams:render`, or switch to inline SVG with CSS overrides. Add `diagrams:check` to slice 3's gates, and say how the raw-colour/red-policy check treats generated SVGs.

### B2. The token input location isn't decided, and the only copy is in a run directory
- The only checked-in Figma collections are under the sibling design-handoff run (`.llm/runs/docs-fresh-ui-design-system--design-handoff/figma-variables/*.json`). `plan.md:8` says "checked-in Figma collections" with a CI freshness check but never names the input path.
- Reading production CSS inputs from `.llm/runs/**` has three problems:
  - The owner can delete run directories after a stable release (AGENTS.md rule 7). Regeneration and the freshness gate would both break.
  - The CI classifier ignores `.llm/runs/` (`.github/scripts/ci-classify-changes.ts:264-267`), so changing a source file would never re-run Pages.
  - `tools/docs-site/**` isn't in the `pages.yml` trigger paths either (`.github/workflows/pages.yml:6-22`), so a change to only the generator wouldn't re-run Pages.
- **Required fix:** lock a durable input location inside the writable surface (a copy with provenance noted, or S1's output), and add the generator and source paths to the `pages.yml` triggers.

### Checklist
- [x] Research is present and re-baselined to `2560bf5`. The diagram description is wrong (see B1).
- [x] Decisions are locked with reasons, apart from B1 and B2.
- [ ] Open-decision sweep: fails on B1 and B2.
- [ ] Commit slices: there are five, in order, each with gates. However:
  - Slice 3 names no diagram file paths (B1).
  - Slice 4 says "browser enhancement modules" without paths. `_config.ts:63-67` only copies `styles`, `favicon.svg` and `assets`, so the module location needs stating.
- [x] Risk register is present.
- [x] Gate set: SCOPE-docs and SCOPE-frontend, a real browser suite, the existing docs gates, and the full CLI E2E run at readiness.
- [x] Deferred scope is explicit (S8b, tokens v2, logo, backend).
- [x] jsr-audit is N/A because no package or plugin surface changes.

Once B1 and B2 are fixed and the slice 3/4 paths are named, the plan should pass. This is the first FAIL_PLAN cycle.
