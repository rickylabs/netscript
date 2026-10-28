# PLAN-EVAL — round 2

Requested and observed route: Claude Opus 5.5, high; same separate read-only evaluator, stdin closed.

**Verdict: FAIL_PLAN** (one blocker left)

This is the second FAIL_PLAN cycle, so `plan-gate.md:40` says it goes to the user now. The fix is a single plan line plus one check. The user can approve that amendment or waive the blocker in writing.

### B3. Inlining the diagrams removes them from the Markdown twins and llms.txt, and no gate would notice
- The locked decision (`plan.md:12`, slice 3 at `plan.md:19`) swaps the figure's `<img>` for inline `<svg>`.
- The tool that builds the Markdown twins only reads a figure through its `<img>`. `figureMd` looks for `fig.querySelector('img')` and turns it into `![alt](src)`; everything else in the figure except the caption is dropped (`docs/site/_plugins/ai-tooling.ts:340-356`). With no `<img>` left, all 21 pages that use diagrams lose the diagram link and its alt text from their twins and llms.txt. Only the caption survives.
- `research.md:11` lists Markdown-twin and llms.txt preservation as guidance. The handoff also adds "View as Markdown" to the breadcrumb and TOC. But no slice gate checks the twins, and no current test covers figures in them. The regression would ship silently.
- That tool lives in `_plugins/`, which isn't on the writable list, so the fix has to come from the diagram filter's output.
- **Required fix:** add one line to the plan saying how the inlined figure keeps a twin-readable image. One way: keep a real `<img src alt>` in the figure, hidden from view, and give the inline SVG `role="img"` plus an accessible name from the existing `alt`. Then add a slice 3 check: one built `.md` twin for a page with a diagram must still contain `![<alt>](…/assets/diagrams/<name>.svg)`, and the live page must still give the diagram an accessible name.

### Round 1 items now resolved
- **B1:** the generated SVGs stay byte-identical, `_diagrams/**` is untouched, `diagrams:check` is a slice 3 gate, and the policy only exempts the renderer-owned `assets/diagrams/*.svg` inputs (`plan.md:12,19`). Research now describes the diagrams correctly (`research.md:7`).
- **B2:** the tokens come from a durable copy in `tools/docs-site/figma-variables/` with provenance (`plan.md:8`). `tools/docs-site/**` and the docs browser-test files are added to both Pages trigger lists (`plan.md:21`).
- **Module paths:** the scripts go in `docs/site/assets/docs/{shell,tabs,toc,search}.js`, which the existing `site.copy('assets')` rule already ships (`plan.md:20`, `docs/site/_config.ts:67`).

### Checklist
- [x] Research is current.
- [x] Decisions are locked with reasons.
- [ ] Open-decision sweep: fails on B3.
- [x] Commit slices name files and gates.
- [x] Risk register is present.
- [x] Gate set is chosen.
- [x] Deferred scope is explicit.
- [x] jsr-audit is N/A because no package changes.

**Not blocking, for IMPL-EVAL:** every Mermaid SVG uses the same `id="my-svg"`, and its embedded `<style>` is scoped to that id (e.g. `docs/site/assets/diagrams/auth-flow.svg:1`). Today each page has at most one diagram, so nothing collides yet. The filter should still give each inlined SVG its own id, or two diagrams on one page will clash.
