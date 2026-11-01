**Verdict: PASS** (slice 2 source)

The slice 1 source PASS still stands. This is a review of the source only, not a claim about CI results at any particular head.

### Checked
- **Browser job follows the same rule as the build job.** `utility-browser` now `needs: classify` and runs when `!cancelled() && (needs.classify.result != 'success' || needs.classify.outputs.needs_pages != 'false')` (`.github/workflows/pages.yml:215-218`). That's the same run-on-failure rule as the build job's `RUN` (`:159`).
- **Deploy stays consistent:**
  - Deploy still needs `build` to succeed, `utility-browser` to succeed, and `needs_pages != 'false'` (`:200-202`).
  - When the browser job is skipped because `needs_pages` is `false`, deploy is skipped too.
  - When classification fails, its output is empty, which isn't `'false'`, so both jobs run.
- **Push diffs are opt-in, used only by Pages, and fail closed:**
  - Push events now compute a two-dot `before..sha` tree diff, and PRs keep the three-dot merge-base diff (`:103-124`).
  - `CLASSIFY_PUSH_DIFF` is `true` only when the event is a push and the diff was computed (`:145`). The script reads the diff file only for PRs or that opt-in (`.github/scripts/ci-classify-changes.ts:639-645`).
  - `decide()` stays conservative for every other non-PR caller and event (`:414-451`). It runs everything on an empty diff (`:453-460`), and `ci:full` still wins.
  - An all-zero `before`, a missing commit or any `git diff` error sets `diff_unavailable=true`. The decide step is then skipped, its output is empty, and everything runs.
- **Path rules are precise and justified:**
  - Markdown under `docs/site/_plan/` only sets the docs flag. Lume ignores that folder, and the source-format and caveat checks both skip it (`ci-classify-changes.ts:272-275`, `docs/site/_plugins/check-source-format.ts:8`, `.llm/tools/docs/check-caveat-refs.ts:153`). Non-Markdown files there still fall through to the docs-site rule and schedule Pages.
  - In `tools/docs-site/`, documentation files skip Pages and everything else schedules it (`ci-classify-changes.ts:276-284`). That includes the token generator, the Figma snapshot, the style policy and the reproducibility checker.
  - In `tools/fresh-ui-browser/`, the docs tests, the docs Playwright config, the docs Deno config and the npm manifest and lock schedule Pages (`:285-292`). The scaffold gallery's own files don't, which is correct because the docs spec only imports from `tools/docs-site`.
  - The classifier's own files still force every gate (`:298`), and any unrecognised path still forces everything.
- **Reproducibility check in CI** (`tools/docs-site/check-reproducible.ts`, run at `pages.yml:244-245`):
  - It builds twice and hashes every file.
  - `--allow-pagefind-metadata` lets only `pagefind/pagefind-entry.json`, `pagefind/filter/*.pf_filter` and `pagefind/pagefind.*.pf_meta` differ. Those are reported in `nonBlockingDifferences`.
  - Everything else fails on any difference: HTML, Markdown twins, `llms*.txt`, `pagefind/fragment/**`, `pagefind/index/**`, CSS and assets. The strict default mode is kept, and unknown arguments are rejected.

  This also carries out both earlier notes: the check is now wired into CI, and twins and fragments are protected.
- **Tests:** you report 71 classifier and workflow tests passing after the intended 3 red ones, with no old test removed. Real tracked files are used as source fixtures, and the hypothetical config case is kept separate.

### Not blocking
1. **The job got longer.** `utility-browser` now runs two full site builds before the browser suite, with a 20-minute timeout. Watch the first CI runtimes. If the timeout ever has to go up, raise it rather than dropping a build.
2. **The plan still has outdated lines.** If it hasn't been done yet, mark the original all-output and 1.5.2 lines in `plan.md` as superseded, so the gate in force (`--allow-pagefind-metadata`) is the only one that reads as current.
