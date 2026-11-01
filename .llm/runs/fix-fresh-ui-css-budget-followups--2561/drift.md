# Drift

No implementation drift at intake. The owner's newer request to continue after merge
supersedes the previous assignment's stop-at-READY for #2524. Its completed artifacts
and canonical report remain untouched. This run handles only the direct #2561 follow-up.
- Reproducibility follow-up: a repeated unchanged replay had zero computed/rule differences
  but151changed text pixels in the last popover in one PNG. Capture now waits for fonts/
  animation frames and requires two consecutive identical images, bounded to three retries.
  The before/after equality threshold remains exact; instability fails rather than passing.
- Baseline fixture retains duplicate human-readable names from the original two inventories;
  the existing browser's data-case index is specimen identity. Do not rename/deduplicate them.
- Browser script type-check uses the existing docs.deno.json with its explicit installed Node
  type declarations. --no-config/manual alone could not resolve the @types/node reference.
- Canonical carriers regenerated after README/test changes; all resulting writes remain generated
  evidence for this scope. No product CSS/token/markup or dependency/lock change is intended.
- Independent R1 found implicit-parent CSSNestedDeclarations were not rejected. Added
  conservative rejection and two real-browser regressions; original supported rewrite remains.
- CI caught tracked-only inventory missing the new CSS README before git add. Regenerate
  Aspire manifest after staging additions; one generated tooling-doc row is the repair.
