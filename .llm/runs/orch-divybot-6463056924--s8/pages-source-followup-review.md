# Independent Pages source follow-up review

**Verdict: PASS** (Pages trigger and classifier addendum only)

This covers the trigger and classifier edits only. It's no new claim about runtime, rendering or merge readiness; the earlier broader evidence still applies only to `3a7a4a5`.

### Checked
- **Workflow triggers:** `docs/design-system/**` is now in both the `pull_request` and the `push` path lists (`.github/workflows/pages.yml:7-8,33-34`). `.llm/tools/docs/pages-workflow_test.ts:103-128` pins both lists, including the new entry.
- **Classifier:**
  - `docsSiteSource` is true for any path under `docs/site/` or `docs/design-system/` (`.github/scripts/ci-classify-changes.ts:215`).
  - It's used in all three places that decide whether Pages runs: nested Deno config and lock files (`:238`), docs-extension files (`:291`) and the general docs fallback (`:316`). That last one covers non-Markdown inputs such as `.json`.
  - Everything else is unchanged:
    - root `deno.json`, with its tasks-only handling (`:216-227`);
    - tier-defining workflows and other workflows (`:246-266`);
    - the run, design-reference, browser-tooling and design-sync carve-outs (`:267-277`);
    - the classifier self-escalation (`:279`);
    - code prefixes (`:296-309`);
    - the rule that any unrecognised path forces every gate (`:327-328`).
  - Side effect: `docs/site/deno.json` and `docs/site/deno.lock` now also schedule Pages through the nested-config branch. That's correct, because both are build inputs.
- **The right folder:** the design-system generator reads `../../design-system/` relative to `docs/site/_plugins/`, which is `docs/design-system/` (`docs/site/_plugins/design-system.ts:192-216`), the folder now covered. The only checked-in sources there today are `GUIDELINES.md`, `README.md` and the `themes/*/{DESIGN,SKILL}.md` files.
- **Tests:**
  - The new classifier test checks Markdown sources (`GUIDELINES.md`, a theme's `DESIGN.md` and `SKILL.md`), a JSON file and a nested `deno.json`. For each it asserts `classifyPath(...).pages`, and that `decide()` sets `needsPages` on both `pull_request` and `push` (`.github/scripts/ci-classify-changes.test.ts:539-555`).
  - The structural checks are still there: classify exports `needs_pages`, the build job's `RUN` reads it and fails closed when classify fails, and deploy requires `needs_pages != 'false'` (`ci-classify-changes.test.ts:631-646`).
- **What changed beyond the edits:** the only other change is the test's `@std/assert` import moving to the existing alias. No dependency or lock change, and no rendering, runtime or package change.

### Not blocking
1. **Mostly tested through a placeholder file.** The tests use `docs/design-system/figma-variables/index.json`, which doesn't exist in that folder yet. The rule is a prefix match, so the test is still valid, but a real future input (for example a copied Figma export) is covered only through the fallback branch, never the docs-extension branch.
