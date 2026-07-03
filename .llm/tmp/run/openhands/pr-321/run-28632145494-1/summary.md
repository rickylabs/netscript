# Validation Summary — PR #321: docs(tooling) AI affordances

## Summary

Validated the docs-only build-tooling PR implementing AI affordances: per-page Markdown twins, tiered llms.txt, and copy-as-md functionality.

## Changes

**Confirmed docs-only diff** (no packages/ or plugins/ touched):
- `docs/site/_config.ts` — configured AI tooling plugin
- `docs/site/_includes/layouts/base.vto` — added "Copy as Markdown" UI affordance
- `docs/site/_plugins/ai-tooling.ts` — new plugin generating Markdown twins + llms.txt + llms-full.txt
- `docs/site/styles/docs.css` — styles for copy-as-md link

## Validation

### ✅ Core validation: `deno task verify` — exit code 0

All three subtasks passed:
1. **`deno task build`** — 441 files generated in 6.52 seconds
2. **`deno task check:links`** — 18,853 internal links across 131 pages all resolve
3. **`deno task check:caveats`** — 30 caveat markers across 23 pages all resolve

### ✅ Required build outputs present

- `_site/llms.txt` — 38KB tiered index (H1 + "For AI agents" note + IA-shaped H2 sections)
- `_site/llms-full.txt` — 1.5MB concatenated corpus
- **131 per-page `index.md` twins** — clean Markdown distilled from rendered HTML

### ✅ llms.txt structure

Correct format per llms.txt convention:
```markdown
# NetScript
> Deno-native, polyglot backend framework...

**For AI agents:** NetScript is Deno-native and pre-1.0...
Prefer the `.md` twins when reasoning about the docs...
A single concatenated corpus at https://rickylabs.github.io/netscript/llms-full.txt.
```

Sections include: Getting started, Tutorials, Capabilities, Reference, etc.

### ⚠️ Spot-check finding: link path duplication in Markdown twin

**File:** `_site/capabilities/streams/index.md` (496 lines, clean Markdown formatting)

**Issue:** Links within the twin use doubled path segments:
- Expected: `https://rickylabs.github.io/netscript/capabilities/triggers/`
- Actual: `https://rickylabs.github.io/netscript/netscript/capabilities/triggers/`

Example from the twin:
```markdown
[trigger](https://rickylabs.github.io/netscript/netscript/capabilities/triggers/)
```

**Likely cause:** The source HTML may contain links that are already absolute with the wrong base path, and the `absoluteUrl()` function in `ai-tooling.ts` doesn't rewrite existing absolute URLs (it only resolves root-relative paths).

**Impact:** These links will 404 on the deployed GitHub Pages site. The `check:links` task validates internal links in the HTML pages (which resolve correctly), but external/absolute URLs in the Markdown twins are not validated.

**Status:** Non-blocking — core functionality works, `verify` passes, all required outputs generated. However, this affects link quality in the Markdown twins and should be addressed in a follow-up.

## Responses to review comments

N/A — no prior review comments on this PR.

## Remaining risks

1. **Link quality in Markdown twins** — The doubled path issue may affect multiple pages beyond just `capabilities/streams/`. Recommend a follow-up task to:
   - Audit all Markdown twins for similar link duplication
   - Fix the `absoluteUrl()` logic to normalize absolute URLs against the canonical site base
   - Add validation for absolute URLs in twins (or exclude them from link checks if they're agent-facing only)

2. **No deno.lock changes** — Verified no lock file churn in this PR (task requirement met)

3. **Pre-1.0 API stability** — The llms.txt correctly notes all APIs are unstable (0.0.1-alpha.19), appropriate for the project phase
