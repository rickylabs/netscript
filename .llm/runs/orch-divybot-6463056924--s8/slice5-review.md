# Slice 5 independent review

**Verdict: FAIL_FIX** (one blocker in the style policy)

This reviews the slice 5 code only. It does not certify that the branch is ready to merge. The browser matrix was still running, the design-system route needs #2437, and the full CLI E2E is unproven (Aspire doctor preflight and no Docker daemon), so none of those count as passing here.

### B1. The style policy silently skips some real ways of writing colour, including `border-color: var(...)`, which the CSS already uses
- **What it reads:**
  - It only looks at the longhand properties a browser reports for each rule, plus a fixed list of shorthands: `background`, `border`, the four `border-<side>` shorthands, `outline` and `text-decoration` (`tools/docs-site/style-policy.ts:43-65`).
  - It then only checks property names matched by `colourProperty` (`style-policy.ts:26-27,172`).
- **Gap 1: colours written as `var(...)` inside an unlisted shorthand.** When a shorthand like `border-color` contains `var(...)`, the browser reports its longhands (`border-top-color` and so on) as empty strings. Since `border-color` isn't in the extra list, the declaration isn't checked at all, either for red or for an undefined role. The same applies to the logical shorthands (`border-block*`, `border-inline*`). `border-color: var(--…)` is already used in the owned CSS:
  - `docs/site/styles/docs.css:212`
  - `docs/site/styles/components.css:118,433,441`

  So `.x { border-color: var(--ns-studio-signal-brand) }`, a red hairline the handoff explicitly bans, would pass. A misspelled `--ns-*` role in a `border-color` would pass too.
- **Gap 2: colour-bearing properties that are never checked.** `background-image` gradients, `filter: drop-shadow(...)`, `stop-color`, `flood-color`, `lighting-color`, `-webkit-text-fill-color`, `text-emphasis-color` and the logical border longhands aren't in `colourProperty`. A raw `#f00` in any of them goes through.
- **Why the controls don't catch it:** the negative controls only use `color`, `background` and a custom-property alias (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:390-420`), so they never exercise either gap.
- **Required fix:**
  - Check each declaration's own value, not just the longhands the browser reports. One way is to read every property listed in the rule's `cssText`. Another is to add `border-color`, `border-block*`, `border-inline*` and `background-image` to the extra list and widen `colourProperty` to the properties above. Undefined-role and red checks should also run on any value that contains `var(--ns-…)`.
  - Add negative controls that must fail:
    - `.x{border-color:var(--ns-studio-signal-brand)}` → red outside an error state;
    - `.x{border-inline-start:1px solid var(--ns-studio-signal-brand)}` → red;
    - `.x{background-image:linear-gradient(#f00,#f00)}` → raw colour;
    - `.x{border-color:var(--ns-missing)}` → undefined role.

### Checked
- **Policy behaviour that works:**
  - It uses real browser parsing of CSS, inline `<style>`, `style`/`fill`/`stroke`/`color` attributes and script style assignments.
  - Named colours count as raw.
  - Red is resolved through chains of custom properties with cycle protection. The token layer is the only place raw definitions are allowed. Red is exempt only on `.docs-logo`, the favicon, and error or destructive state selectors.
  - The B3 rendered diagram pages are included.
- **Browser suite:**
  - It runs four projects (Light/Dark × 390/1280) against the real `/netscript/` prefix with a 200-status check for each route.
  - The design-system route is included with no skip, which is correct: it should fail until #2437 lands.
  - It checks for no horizontal overflow and the right `data-theme` and `data-scheme`, takes full-page screenshots, and fails on page errors.
  - axe has no exclusions or baseline. Every violation is recorded, and serious or critical ones fail the test.
  - The B3 diagram checks are there: the hidden lazy image, the twin's canonical URL with no doubled base, accessible names, unique ids across two instances, and the `fileTree` compatibility check.
  - The keyboard, scrolled section-nav, Pagefind (filters, hash navigation, empty, blocked index, delayed response), clipboard, saved runtime, no-JavaScript and blocked-storage checks are all real assertions (`docs.spec.ts:68-323`).
- **Preview server:** `serve.ts` only serves under `/netscript/`, rejects `..`, backslashes and colons, and returns 404 for anything outside `_site` (`tools/docs-site/serve.ts`).
- **Workflow:**
  - Both trigger lists include the docs tooling and browser files, and the test pins this (`.llm/tools/docs/pages-workflow_test.ts:103-128`).
  - The existing build job still runs exports drift, snippets, the Lume build, links and caveats.
  - `utility-browser` builds the site on its own, checks token freshness without writing, runs TypeScript check, lint, format and the focused tests, installs the browser from the lock file, and runs through `run-gate.ts` with a receipt. Its upload runs with `if: always()` and fails if there are no files.
  - Deploy requires `utility-browser` to succeed.
- **Twin links:** `absoluteUrl` keeps a link that already starts with the site base as it is, so `/netscript/netscript/` can't happen (`docs/site/_plugins/ai-tooling.ts:149-161`).

### Not blocking, but worth knowing
1. **Pages deploys stop until #2437 is on `main`.** Deploy now depends on `utility-browser`, which checks the design-system route. If this PR merges first, every Pages deploy fails. That's intended as a merge-order dependency, but the PR description should say so.
2. **The workflow test doesn't protect the new job.** It only pins trigger paths and build steps. Removing the `utility-browser` job or deploy's dependency on it wouldn't fail any test.
3. **axe fails only on serious and critical violations.** Report it that way, not as zero violations.
