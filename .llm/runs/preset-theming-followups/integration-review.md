# Independent integration-test repair review

**Integration-test repair: PASS.** Nothing blocks committing it together with the dated lesson, its manifest row and the run context.

I reviewed the diff and checked the referenced files, but didn't run the test myself; the 5/5 pass is your result.

The fix in `packages/cli/src/public/features/root/public-command-tree_test.ts` (`assertAppConventionsResolve`) is sound:

- **What it changes:** quoted doc slugs are only excluded from the app-path check when they follow the word `slug`. Every other backtick token still goes through the same app-path verification as before.
- **Line wrapping:** the pattern `\bslug\s+` matches a newline, so a slug that Markdown wraps onto the next line is still recognised.
- **Slugs are checked against the docs:** each one must exist as `docs/site/<slug>.md`. A typo or a removed guide makes the test fail rather than being silently skipped.
- **It fails closed:** if the template wording ever changes so the pattern no longer matches, the slugs fall back into the path check and fail it. The exclusion can't hide anything that hasn't been validated.
- **Paths:** the six `..` steps from `root/` reach the repo root correctly, and both target guides exist (`docs/site/web-layer/how-to/theme-your-app.md` and `customize-fresh-ui.md`).
- **Scope and quality checks:**
  - It's a test-only change with no effect on production code or the public surface.
  - The file isn't in the CLI baseline, so it is checked normally, and `quality:cli` passing it covers the edit.
- **Coverage:** the unit test in `agent-conventions_test.ts` still requires both exact quoted slugs, so the generated-output guarantee doesn't depend on this integration helper.

**Optional nit:** an explicit `assert(docSlugs.size > 0)` would make the intent obvious to future readers. The fail-closed behaviour above already covers it.

**Hygiene:** the new `memory-cli-native-environment.md` has no absolute paths and no injected library-path values.

**Next steps, as you described them:**
- Commit the test repair, the lesson and its manifest row, and the run context together.
- Start the canonical whole-CLI run on that clean commit, with the project-owned executable TMPDIR, the Chrome wrapper only where it's needed, and the longer timeout.
- Rerun `figma:ci` on the same commit (A4).
- Mark the earlier `ac85479e` CLI run as superseded exploratory evidence. Refresh `gate-evidence.json` and `pr-body.md` from the new receipts.

Terminal IMPL-EVAL follows once the whole-CLI result arrives.
