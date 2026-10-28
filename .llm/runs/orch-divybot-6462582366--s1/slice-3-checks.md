# Slice 3 — names and contrast evidence

Status: PASS. The same independent supervisor signs off after the single fix round; both verdicts are recorded in slice-3-review.md.

The independent `role-manifest.json` registers 903 CSS names and their DTCG types.
Neither import nor build writes it. Source and SD build paths reject unknown,
missing, duplicate, malformed and type-changed names. Official source validation
also checks semantic/context values before merging modifiers, so an overwritten
raw value cannot escape the alias-only gate.

`contrast-pairs.json` contains 381 explicit intended uses, with language ownership
and alpha paint stacks. All 36 effective preset/scheme contexts are measured,
covering 4,066 uses. Every foreground and named background requires coverage;
text thresholds cannot be weakened below 4.5, and core input/control/focus roles
require their 3:1 checks. Terminal's key tokens are a language variant. Fluent's
outer 2px ring is the indicator in its approved compound anatomy; the decorative
inner line is not misclassified as a standalone indicator.

The calculation port wraps Color.js 0.5.2, measures native oklch components with
CSS gamut mapping, composites alpha in sRGB, and uses upstream WCAG21 contrast.
Ratios are unrounded for the decision. Exact exclusions bind preset, scheme,
pair, threshold, twelve-decimal ratio, rendered colors, source and reason;
unused, stale and duplicate entries fail.

Current exclusions: 406 (389 Figma, 17 inherited S0). The full list is
`packages/fresh-ui/tokens/contrast-exclusions.json`. No Figma source values were
changed. New NS One text/boundary gaps use suitable existing legacy aliases;
all original declarations and current component colors retain their values.
The S0 entries explicitly preserve compatibility rather than claim those pairs
meet AA. No blanket disabled-state exception is applied.

Gate results:

- Frozen `tokens:validate`, including source freshness/schema/alias/name preflight:
  PASS, 72 inputs, 36 effective contexts, 903 names, 4,066 uses, 406 exact exclusions.
- Required negative commands: all three exit 1. Tests invoke the real checker
  for unknown-name, valid-DTCG raw semantic value, and a seeded AA failure.
- Policy tests also cover nested alpha, missing opaque ground, changed/unused
  exclusions, unpaired foreground/background, missing focus, and weakened text.
- Complete fresh-ui package suite: 209 PASS, zero failures.
- Frozen source/output build and read-only freshness: PASS, all 50 SD files.
- Structured type check: PASS, 33 TS files, frozen root lock, zero diagnostics.
- Structured lint/fmt: PASS, all 32 package files plus the gate catalog checked.
- Existing CI contract tests: 3 PASS; all original workflow gates stay present.
- Catalog-run repository quality/architecture: PASS, exit 0.
- Publish dry-run: PASS, including JSON registries and the contributor guide.
- Original Figma snapshot files and both lockfiles have zero diff in this slice.

The new CI step uses the allowlisted `fresh-ui-token-quality` receipt command.
Existing frozen token build, artifact freshness, package tests, private-lock
regression and browser steps are unchanged. CLI/migration/browser/runtime/final
IMPL-EVAL remain subsequent required slices.

Fix round: destructive-hover now aliases existing red-6 in both schemes. Removed its two exclusions. A new regression forbids excluding any new NS One gap as S0 and checks component colors against explicit legacy aliases. The positive frozen quality receipt and full 209-test rerun pass; all regenerated outputs reproduce under the frozen lock.
