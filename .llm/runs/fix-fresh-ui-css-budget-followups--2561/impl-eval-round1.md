**Verdict: FAIL_FIX.** One required fix, which is small. The plan and scope are still valid, and none of the other findings block.

# IMPL-EVAL — #2561 / draft PR #2563 (feature tier, read-only Anthropic reviewer)

- **Head under review:** plan commit `2563bef`, plus the uncommitted working tree.
- **Baseline:** `6a6a82e15f2de2cd820cef9b879ce263aa7cb06f`.
- **Generator:** OpenAI. **Evaluator:** separate Anthropic session, requested `claude-opus-5-5`, effort high.
- **Write scope:** no repository writes, commits, pushes or comments.

## What I checked or reran myself

| Check | Result |
| --- | --- |
| SHA-256 of all 16 source files against `source-hashes.json` | **All 16 match**, including `utility-2558.json.gz` = `d75c4d0f…5ad8` and the manifest = `46efd890…b85d`. |
| Archive size | 87989 bytes on disk, matching the manifest's `compressedBytes`. |
| `deno task css:test` | **PASS.** Deno location/budget tests 3/3 (`exitCode 0`). Node browser regressions 12/12 in real Chromium. The fixture test calls `loadBaseline`, so it also checked the compressed SHA, the uncompressed SHA (`df228d7c…dd89`), the provenance, the before/after HTML hash, the Utility token hash, and the 52-sheet / 265-specimen counts. |
| Code review of all 16 files | Done. The new `.llm/tools/css` files were read in full; the modified files are covered by the diffstat plus their current contents (details below). |
| Grep of the current registry CSS for declarations directly inside `@media`/`@supports`/`@container`, or after a nested rule | No matches (heuristic multiline grep). |

**Limits on my independent checks:**
- My session was not allowed to run `git diff`, `git show`, ad-hoc probe scripts or decompression pipes.
- So I reviewed the 9 modified files from the diffstat plus their current contents, not as a line-by-line diff against the baseline.
- The archive's payload hash was confirmed through the rerun regression, not by a separate shell hash.
- I could not run a real-Chromium probe for finding R1. That finding rests on CSSOM semantics (below).

## Taken from recorded evidence, not rerun

These come from the run artifacts and private receipts; I did not rerun them:
- Full replay: 2388000 comparisons, 1161 rules, 0 drift, baseline input hashes match, about 93 s.
- Card-background mutation negative: 1 rule difference and a visual failure.
- Package suite 338 pass; focused suite 77 pass.
- TS checks: package 276; scoped 6 TS + 1 browser TS.
- Lint/fmt on 10 source files; broad quality/architecture; release preflight; JSR/native publish.
- Four canonical generators; all 14 root check tasks.
- Runtime: **UNPROVEN** (Aspire doctor exits 1 because Docker is unavailable). This is disclosed, and the run is validation-only, so the release-gate rule does not apply.

## Required fix

**R1. The rule comparator does not fail closed for nested declarations.** File: `.llm/tools/css/compare-css-rules.mjs`, the `else` branch of `visit()`.

- Chromium 130 and later (the evidence uses 153) represent declarations nested directly inside a style rule's `@media`/`@supports` block as `CSSNestedDeclarations` rules. Examples: `.a{@media (x){color:red}}`, or declarations that follow a nested rule, as in `.a{& .x{…} color:red}`.
- That rule type is not a `CSSStyleRule` and has no `cssRules`. It therefore lands in the `else` branch, which records `[conditions, cssText]` and drops `parent`.
- So `.a{@media (x){color:red}}` and `.b{@media (x){color:red}}` produce identical records. A parent-selector change would be reported as equal.
- This breaks plan item 4 ("Unsupported nesting must fail closed rather than produce an inferred equality"). It also contradicts the `.llm/tools/css/README.md` claim that "other nesting forms fail closed".
- **Current impact is limited.** The current registry CSS does not appear to use this form (grep above). Against a flat baseline, the form would show up as a difference rather than a false equality. The 2.388M computed-style comparisons and exact-PNG check also back the result up.
- **But the gap is real for the reusable command.** It hides drift whenever both sides use the form, for example after a baseline refresh. I could not inspect the archive's CSS to rule out that the frozen baseline already contains it.
- **Fix:**
  - When `parent` is set and a rule is not a `CSSStyleRule` but carries a `style` (that is, `CSSNestedDeclarations`), do one of two things:
    - throw `Unsupported nesting`, or
    - record `[conditions, parent, normalize(rule.style.cssText)]`, but only if `compound(parent)` holds. With one compound parent this is equivalent to the flat rule.
  - Add real-Chromium regressions to `compare-css-rules.browser.mjs`:
    - `.a{@media (width < 600px){color:red}}` vs `.b{…}` must not compare equal.
    - The trailing-declaration case `.a{& .x{color:blue} color:red}` vs `.b{…}` must not compare equal.
    - If you choose the record approach: flat `@media (…){.a{color:red}}` vs nested `.a{@media (…){color:red}}` should compare equal.
  - Then rerun `deno task css:test` **and** `deno task css:parity`. The rule contract code changes, so the replay must reconfirm 1161 rules / 0 differences, or show that the baseline does contain the form.
  - Update `source-hashes.json`, the worklog and context-pack.

## Cell-by-cell assessment (all pass apart from R1)

1. **Gzip growth policy — PASS.**
   - `COMPONENT_CSS_BUDGET = { raw: 220_000, gzip: 28_000 }`, with a comment giving the fixed roughly 1.5 KB allowance over 26,527 bytes, "never scale with file count", and what a future raise requires (issue, byte costs, parity).
   - The package README and the tools README say the same.
   - The failure message points reviewers to the policy rather than to the number.
2. **Theme exclusion independent of checkout location — PASS.**
   - Paths are normalised relative to the package root (`relative(fromFileUrl(root), …)` with backslashes converted to forward slashes) before the `registry/theme/` exclusion. The shipped inventory filters on registry keys, which are already package-relative.
   - The location test copies the real `publish-size.test.ts` into an `ordinary/checkout` and a `theme/checkout`.
   - Under the old regex on the absolute path, the theme checkout would have produced an empty inventory and failed, so the regression really catches the original bug.
   - Stale shipped bytes, an unshipped extra source, and oversized raw+gzip each fail with the expected message. I reran all of these.
3. **Reusable parity command — PASS apart from R1.**
   - The archive is self-contained. The manifest pins compressed and payload SHA, provenance, HTML/token hashes, the property list and `comparisonsPerScene: 597000`.
   - `SAFE_CSS_PATH` rules out `..` and absolute paths. Inventory enumeration recurses, rejects symlinks and non-file `.css` entries, and requires an exact match with the fixture.
   - `assertCompleteVisualProof` rejects empty or narrowed scenes, properties, specimens and counts.
   - The wrapper checks `beforeHtml/afterHtml/beforeCss/utilityTokens` against the manifest and checks each scene's differences, `pixelsEqual` and SHA equality, not just `ok`.
   - In the recorded parity output, `afterCss` equals the manifest's `afterCss`, which supports the claim that production CSS is unchanged since #2558.
   - `variant-parity.ts`:
     - `stableScreenshot` waits for `fonts.ready` and two animation frames, requires two consecutive identical full-page PNGs, retries at most 3 times, and throws on instability.
     - Before and after are captured the same way, and before/after equality remains exact (`png.equals`). There is no tolerance, masking or baseline reset.
     - The recursive enumeration sorts each directory by code units, which matches the old default `Array.sort()`. The recorded `beforeCss` hash matching confirms the order was preserved.
4. **CI — PASS.**
   - `css:test` and `css:parity` are root tasks and allowlisted gate-catalog entries.
   - The Fresh UI browser job runs both through `run-gate.ts` with durable receipts, and the `always()` upload includes `.llm/tmp/css-parity/`.
   - Both workflow event filters and `ci-classify-changes.ts` include `.llm/tools/css/**`, with classifier tests covering the `.gz` fixture.
   - The `.browser.mjs` suffix is outside Deno's default test discovery.

## Process and doctrine

- `PLAN-EVAL: N/A` is recorded with a reason before implementation, and the design checkpoint is in `worklog.md`.
- Drift is recorded: the stable-capture repair, duplicate specimen names, and type-resolution through `docs.deno.json`.
- No public API, runtime, product CSS/token/markup, dependency or lock change, so no `arch-debt` entry is needed. Not a release cut.
- The 24 resources with unproven ownership were left alone, which is correct.
- Remote CI at the final head is still pending, as you stated.

## Optional notes (not required)

- **O1:** If `variant-parity.ts` fails before writing `utility/parity.json` (for example on screenshot instability), the wrapper reports a bare file-not-found error from `readFile`. It still fails closed, but a clear "visual engine exited N without a report" message would make CI triage easier.
- **O2:** `.llm/tools/css/README.md` has missing spaces: "Deno2.9.7", "about1.5KB", "original265specimens", "2388000computed-style", "The88KB".
- **O3:** The theme fixture in the location test exceeds the raw budget only. Repeated text gzips to a small size, so "larger than the budget" holds for raw, not gzip. This is a wording point; coverage is still good, because inventory equality and the raw check would both catch theme inclusion.
- **O4:** The browser job's 25-minute timeout now covers about 1.5 more minutes of replay. Watch the first CI run.

## Re-review conditions

Fix R1 and add its regressions, rerun `css:test` and the full `css:parity`, and refresh the hashes. Then send it back to this same evaluator. If nothing else changes, a PASS should follow.
