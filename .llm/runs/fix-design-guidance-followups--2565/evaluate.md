# Independent IMPL-EVAL

Separate Anthropic evaluator from the OpenAI implementer, resumed from the same leaf PLAN-EVAL. Requested/observed model: claude-opus-5-5, requested effort high. Read/Grep/Glob only; no edits. Evaluation covers the staged candidate before implementation commit; final-head receipts and hosted CI follow.

**IMPL-EVAL #2565: PASS.** I found no blockers. I checked each claim against the live staged source and made no edits.

**The three issue cells**
1. **Counts, section numbers, slugs and gallery link now come from source.**
   - The theme count is computed from the complete theme pairs (`The ${themeIds.length} complete`), and "eleven" is gone from GUIDELINES.md line 3.
   - Section numbers are read from unique headings (`heading()` / `section()` in `generate-design-skill.ts:59-67`). The generated skill now says §2.4 "Styles and token-only presets", fixing the old mislabelled §2.3.
   - The catalogue is found by its title, not as section 6.
   - Routes come from the xref manifest (`docTarget()`), using the new keys `howto:theme-your-app` and `concept:design-system` alongside `howto:customize-fresh-ui`. The lookup requires exactly one source file and fails on zero or more than one.
   - The gallery points to its MCP slug `design-system` plus `github.com/…/tree/<ref>/docs/design-system/`, not the Lume page generator.
2. **Links are pinned to the installed release.** The generator writes the `{{NETSCRIPT_RELEASE_REF}}` token everywhere, and agent init replaces it with `v<version>`. No `main` or Pages-latest links remain in the generated skill, and the embedded copy (`skills.generated.ts`) carries the token.
3. **The old S9 citation is corrected.** Each line range in `evaluate-refresh.md` is now a live test name, and all three tests exist:
   - generator test, line 109;
   - init-agent test, line 662;
   - integration test (one match).

   A maintenance note keeps the historical verdict and explains that its two-output statement predates the new metadata file.

**Install-time rewrite and its integrity**
- **Order** (`init-agent.ts:91-101`): the skill bundle hash is checked over the original bytes first, then all skill content is prepared without writing anything, then the tool bundle is checked, and only then do writes start.
- **Ordering test:** `original design bundle hash is verified before attempting release materialization` uses a tampered skill with no token, so it would report the token error if the order were reversed. It asserts the hash-mismatch message and that nothing was written.
- **Fail-closed rules** (`materializeSkillFiles`):
  - the token in `manifest.json` or any non-design file is rejected;
  - a design skill with no token is rejected;
  - the version must survive an `@std/semver` round-trip with no build metadata;
  - the token is replaced with `v${version}` everywhere.
- **Tests for those rules:** one covers missing and misplaced tokens, and another rejects `v0.0.8`, `01.0.0`, `0.0.8+build.1`, `0.0.8/main` and `0.0.8?ref=main`. Both assert the project directory stays empty.
- **Stable, canary and repeat installs:** `0.0.8` and a canary version are pinned across the theme specs, the theme-guide source and the gallery tree. GUIDELINES.md stays byte-exact and a second init changes no files. The S9 test also covers all three hosts and repeat init.
- **The `#1675` exact-bytes test:** every installed file must match the bundle exactly, except the design skill, which must equal the original with the token replaced.
- **Token source:** the token is defined once in the generator, written into the generated metadata file, and imported by the installer and both consumers. `check:design-skill` covers all three outputs. This is sound normal codegen.

**Drift checks and boundary**
- **Drift tests:** the generator tests cover renumbered headings (all outputs reported stale, with no repair), missing or duplicate headings, the token appearing in GUIDELINES, a relocated route (the metadata file changes, and a stale copy fails the check without being rewritten) and missing or ambiguous route sources.
- **Real slugs:** the three slugs are resolved against the real shipped MCP corpus, with a negative control.
- **CLI/docs boundary:** a test scans all of `packages/cli/src` for imports of `docs/site/**`, and its negative controls cover static, re-export, dynamic and side-effect imports.
- **Consumers:** `agent-conventions.ts` and `web-scaffold.ts` now take their slugs from the generated `DESIGN_GUIDANCE` data.
- **Carrier registry:** `generated-carriers.md` records that the design-skill generator owns all three outputs.

**Optional notes**
- `init-agent.ts:301`: the leftover-token check after `replaceAll` can never fire. A near-miss token such as `{{NETSCRIPT_RELEASE_REF}` would pass through unchanged. The generator controls what is emitted, so the risk is low; a check for leftover `{{NETSCRIPT_RELEASE` text would close it.
- The canary test uses `0.0.9-canary.20261101.1`. The repository's canary format is `<x.y.z>-canary.<N>` (`canary.ts` regex), so a case like `0.0.9-canary.5` would match real tags.
- The source links point at Lume Markdown with template syntax, so the MCP slug stays the readable entry point. This is already documented.
- **Still unproven:** the local `scaffold.runtime` run is UNPROVEN because Docker is inaccessible (exit 1, passed 1 / failed 2), which is not a pass. Hosted CI and immutable-head receipts are still needed after the implementation commit; today's evidence covers the staged working tree only.
