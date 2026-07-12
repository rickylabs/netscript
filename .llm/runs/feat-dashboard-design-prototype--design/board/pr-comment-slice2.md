## Slice 2 — Dashboard design brief + proposed components

**Commit:** (see this push)

**Scope:** the two canvas-facing design artifacts distilled from the ratified seed-run proposal (`design/A-dashboard/proposal.md` §3/§5.1/§9.1):

- `resources/design/dashboard/CLAUDE-DESIGN-BRIEF.md` — the locked IA (cross-cutting panels + per-capability create→configure→monitor sections + Plugin Control host), hard design-system rules (tokens-only, light-default/dark override, compose-before-inventing, native-first primitives), voice constraints, and the two-pass prototype scope.
- `resources/design/dashboard/PROPOSED-COMPONENTS.md` — seeded-system inventory (44 cards + 8 primitives), the DDX-0 promote-set validation table (7 blocks, per-panel "validated when" criteria), both negative verdicts (data-grid duplicate, MCP components OUT), and the opinionated net-new candidate set: **4 compose · 2 new-block (`step-timeline`, `log-stream`) · 2 new-component (`trace-waterfall`/`ns-waterfall`, `stack-map`/`ns-stackmap`)** — each with class contract, props, and `data-state` vocabulary as sync-back candidates.

**Lanes (owner directive):** supervisor drafted + orchestrated; a **Fable-5 medium sub-agent** authored PROPOSED-COMPONENTS.md and applied two factual fixes to the brief (flagship-trace composition corrected to the Flow B shape; A2 command-`arguments` dialog constraint added).

**Gate:** supervisor slice review **PASS** against proposal §3/§5.1/§9.1; voice-rule scan clean (0 banned framings). Noted for the record: 6 of 7 promote-set blocks are not in the current sync — this is the ratified DDX-0↔DDX-15 inversion (the canvas authors them against the block contract; the slice-7 sync-back spec then feeds DDX-0), not a gap.

Next: slice 3 — re-run `design:sync` (with the delegated preview stories) and seed the `NetScript — NS One` canvas project.
