# Slice 5 independent repair review

**Verdict: PASS** (slice 5 style-policy repair)

This covers this repair only and isn't a merge-readiness claim. These are still open:
- The design-system route fails (404) until #2437 is on `main`, with no skip or exemption.
- The new full browser matrix hasn't finished.
- The full CLI E2E is unproven (Aspire doctor preflight and no Docker daemon).

### B1 resolved
- **Shorthands written with `var(...)`:** `add()` now also reads the property names from the declaration's canonical `cssText` (`tools/docs-site/style-policy.ts:43-60`). Shorthands like `border-color: var(--x)` and `border-inline-start: 1px solid var(--x)` are read under their own names, even though the browser reports their longhands as empty.
- **More colour properties covered:** `colourProperty` now includes `background-image`, `filter`/`backdrop-filter`, the logical `border-block*`/`border-inline*` properties, `stop-color`/`flood-color`/`lighting-color`, `text-emphasis*` and `-webkit-text-fill-color`/`-webkit-text-stroke*` (`style-policy.ts:26-27`).
- **Checks run wider:**
  - Undefined `--ns-*` references are now checked in every property and every custom alias (`style-policy.ts:167-169`).
  - Red is now resolved in every property that uses a value, not only colour properties (`style-policy.ts:173-181`).
  - Raw-colour checks still cover only colour properties and custom properties, and the token layer is still the only place raw definitions are allowed.
- **Negative controls now cover the gaps:**
  - raw colour: gradients, `drop-shadow`, the SVG paint properties, text-emphasis and the WebKit text fill;
  - red outside an error state: `border-color`, `border-inline-start`, `border-block-color` and an alias to `--ns-block-pink`;
  - undefined roles: in `border-color`, through a custom alias, and in a non-colour property (`padding`).

  An allowed case for the logo and an error state must produce no findings (`tools/fresh-ui-browser/docs-tests/docs.spec.ts:394-457`).
- **Injected controls in the ordinary test:** the two environment-switched controls now use a gradient and `border-color: var(--ns-studio-signal-brand)`, which are exactly the cases missed before (`docs.spec.ts:370-383`). So the normal style-policy test itself fails on those cases.

### Lock and import-map change
- `docs/site/deno.json` maps four bare specifiers to the same pinned npm versions the code used before: `markdown-it-anchor@9.2.0` and the bash, json and typescript language files of `highlight.js@11.11.1`.
- `docs/site/deno.lock` keeps the existing resolutions (`:35-36`). Its `workspace.dependencies` gains only `npm:highlight.js@11.11.1` and `npm:markdown-it-anchor@9.2.0` next to the existing `npm:react@18.3.1` (`:500-505`).
- No versions change and nothing is deleted or re-resolved, so this is metadata that follows from the import-map move only.

### Not blocking
1. **Regex parsing of `cssText`.** The property-name regex splits `cssText` on `;`. A `;` inside a quoted string or a `url(...)` could produce a wrong property name, but nothing in the owned CSS has one today.
2. **Possible false positives later.** Red is now checked in every property, so a non-colour property that happens to reference a red role would be flagged. That's the safe direction for this rule.
