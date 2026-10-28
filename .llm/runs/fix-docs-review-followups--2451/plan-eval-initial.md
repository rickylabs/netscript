**Verdict: FAIL_PLAN**

There are two blockers. Both need a few plan lines, not new scope. The deferral of token-source consolidation to #2450 is sound: it's waiting on S1 and the new Figma export, and the plan avoids a competing token authority.

### B1. How the style policy treats the bundled CSS isn't decided, and the obvious ways out weaken the gate
- **The plan:** stop copying `styles/` as-is and bundle the `@import`s with Lume's Lightning CSS plugin (`plan.md:5`). Today `site.copy('styles')` passes the files through unprocessed (`docs/site/_config.ts:65`).
- **The conflict:** the browser style policy reads every built stylesheet. Only the built `_site/styles/tokens.css` counts as the token layer, where raw colour definitions are allowed. Every other maintained built stylesheet gets the full raw-colour, red and undefined-role checks (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:395-404`).
- **What breaks:** once bundled, the built `_site/styles/docs.css` will include all of `tokens.css`'s raw hex definitions. The full checks then report raw colours, so the existing gate fails.
- **Why it matters now:** the easy fixes are marking the whole bundle as the token layer, or running only the undefined-role check on it. Either would quietly exempt every raw custom property in maintained CSS. That is the gate weakening this project forbids, and the plan doesn't say which way it'll go.
- **Required fix:** pick a non-weakening rule now and add it to the slice 1 gate, along with the files it touches (`docs.spec.ts`, and `tools/docs-site/style-policy.ts` if needed, which is also outside the declared write surface in `supervisor.md:5`). For example:
  - keep the full checks on every source file;
  - in the bundle, allow raw custom-property definitions only when the name and value exactly match a declaration in the generated `tokens.css`, and keep the red and undefined-role checks on every use;
  - add a negative control with a raw custom property inside a maintained partial, which must still fail after bundling.

  Also say whether the imported partials are still emitted as standalone files, and that the policy covers whatever ships.

### B2. The determinism check doesn't cover the outputs the plan says the stable IDs must reach
- **The claim:** the plan installs page-URL plus DOM-index IDs in `afterRender` "before twin extraction/indexing" (`plan.md:5`).
- **The problem:**
  - Today the `afterRender` identity listener is registered after `site.use(pagefind(...))` (`_config.ts:131,134`).
  - Pagefind records elements with `id`s as anchors in its fragments, so a random or wrongly ordered id changes the fragment content and file names.
  - The proving gate only byte-compares HTML between two builds. That can't show that the Pagefind index and the Markdown twins (`*.md`, `llms*.txt`) saw the final ids.
- **Required fix:**
  - State that the identity pass is registered before both Pagefind and `aiTooling`.
  - Widen the gate to build twice and byte-compare the whole `_site`, including `pagefind/**`, `**/*.md` and `llms*.txt`. If some unrelated file turns out to vary between builds, list the exact exclusions and why, and record them in drift.

### Not blocking
- **CI precision:**
  - It keeps the shared `decide()` conservative for non-PR events.
  - Push diffs are an explicit opt-in that only the Pages workflow uses.
  - Empty, unknown or unavailable diffs fail closed (worth naming the all-zero `before` case on new-branch pushes among them), as do dispatch, release and `ci:full`.
  - When classification fails, the browser job runs.

  Deploy's conditions stay consistent with that: if the browser job is skipped because `needs_pages` is `false`, deploy is skipped too. If classification fails, its output is empty, which isn't `'false'`, so deploy still requires build and browser success.
- **Reader fixes:** per-heading permalink names, choosing the reference lane by identity instead of position, registering dotenv as plain text, the chip-stack spacing, and swapping the made-up fixture for a real tracked file all close earlier review notes.
- **Lightning CSS lock changes:** measure the new lock entries and list them, as `supervisor.md:5` already asks. Also note the plugin's default `targets` and minification in drift, because they change the shipped CSS text that the policy reads.
