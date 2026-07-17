You are an ADVERSARIAL design evaluator (opposite family from the designer). Be harsh. A designer just redesigned two dashboard routes — **Live Flow** (a causal journey) and **Run Inspector** (a run step-timeline). The owner's verdict: they look TOO SIMILAR — "a single round trip to take a few components and applied the same on both without even thinking." Your job: PROVE the structural sameness (or distinctness) from the CODE, and prescribe how to make each genuinely distinct per its feature.

## Read
- The prototype (single file): `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/prototype.dc.html` — grep it for the Live-Flow / Run-Inspector render sections and the CSS classes each screen uses. The component CSS is in `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/assets/ns-ext.css`.
- The bar + rules: `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/visual/ROLLOUT-DOCTRINE.md`, `HOME-SPEC.md`, `DESIGN-LANGUAGE.md`.
- The designer's own report: `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/render/_visual-reports/V3-investigation-spine.md`.

## Evaluate (assume template-reuse until disproven)
1. **Layout skeleton:** do both routes use the SAME grid (e.g. left rail + center + right rail, same column widths)? Same page-header pattern? List every shared layout structure with the class names / line evidence.
2. **Hero pattern:** do both lead with the same kind of hero (e.g. an arc-gauge summary band — `ns-flowhero` vs `ns-runhero`)? Are these two near-copies of one pattern? 
3. **Component palette:** which components are shared vs unique per screen? Is the "difference" only the data, not the composition?
4. **Feature fit:** Live Flow should read as a CAUSAL MAP (spatial/graph), Run Inspector as a DENSE CONSOLE (table-forward). Does each screen's DOMINANT composition actually differ, or is it the same template twice?
5. Bar check: per the doctrine, is each screen bespoke to its feature?

## Output
Write a prioritized FAIL list to `/home/codex/repos/netscript-beta10/.llm/runs/beta10--orchestrator/visual/_evals/V3-adversarial.md`:
- A VERDICT (too-similar / distinct-enough) with confidence.
- Every shared structure (with evidence: class names + approx line refs).
- Concrete DIFFERENTIATION DIRECTIVES: exactly how to re-architect each route so they read as different features (different grid rhythm, different hero, different dominant component) while keeping the shared kit (chrome/pills/tables) for consistency.
- Anything else below the reference bar.
Be specific and evidence-based. State your model name at the top.
