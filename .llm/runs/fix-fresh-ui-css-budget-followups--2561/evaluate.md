**Verdict: PASS.** R1 is fixed and confirmed in real Chromium. No required findings remain for this slice, and it is signed off for its commit.

# IMPL-EVAL round 2 — #2561 / draft PR #2563

- **Evaluator:** same independent Anthropic session as round 1; read-only; requested `claude-opus-5-5`, effort high.
- **Head:** plan commit `2563bef` plus the uncommitted working tree.
- **Baseline:** `6a6a82e15f2de2cd820cef9b879ce263aa7cb06f`.
- **Round 1:** `FAIL_FIX`, retained in `impl-eval-round1.md`.

## R1 check: done or rerun myself

| Check | Result |
| --- | --- |
| Comparator change | `compare-css-rules.mjs`: in the branch for rules that are not style rules and have no child rules, `if (parent && rule.style) throw 'Unsupported nesting: declarations require an explicit style rule'`. This fails closed, so the parent selector can no longer be silently dropped. It only affects rules nested under a parent, so top-level `@font-face`, `@property` and keyframes behave as before. |
| New regressions | `compare-css-rules.browser.mjs` compares `.a{…}` against `.b{…}` for two blocks: `@media (width < 600px){color:red}` and `& .x{color:blue} color:red`. Both must be rejected with exactly that message. |
| `deno task css:test` in real Chromium 153 | **PASS.** Deno 3/3 (`exitCode 0`), Node **14/14**, including both new cases. |
| Proof that R1 was real | The regressions match only the new error text. So Chromium really does expose both forms as parent-bound non-style rules carrying `.style` (`CSSNestedDeclarations`). The old `else` branch only pushed a record without the parent, so these cases would have compared equal and `assert.rejects` would have failed. R1 is confirmed and closed. |
| Source manifest | Recomputed SHA-256 for all 16 files; **all match** the refreshed `source-hashes.json`. Exactly 3 hashes changed since round 1 (`compare-css-rules.mjs`, `compare-css-rules.browser.mjs`, `.llm/tools/css/README.md`). The other 13, including the archive (`d75c4d0f…5ad8`) and the manifest, are unchanged. |
| Scope of change | `git status` and `git diff --stat` for tracked source are identical to round 1; only run files changed. The 7 files under `.llm/tools/css` are the same set. |
| O2 (README spacing) | Fixed. None of the joined-together forms remain. |

## Gaps from round 1, now closed

Git reads are allowed now, so I reviewed the line diffs I couldn't see in round 1:

- **`publish-size.test.ts`:** the absolute-path regex `skip: [/[/\\]theme(?:[/\\]|$)/]` is replaced by a `registry/theme/` filter on package-relative paths; gzip goes 27000 → 28000 with the policy comment; raw stays unchanged.
- **`variant-parity.ts`:**
  - `registry/styles/layouts.css` was hard-coded and is now read recursively. The current tree contains only `layouts.css` there (I checked), so the before/after input set is the same.
  - Directory sorting compares code units, which matches the old default `.sort()`.
  - `stableScreenshot` replaces the single screenshot. Before/after equality is still exact.
- **`ci-classify-changes.ts`, `catalog.ts`, `deno.json`:** match what I described in round 1.

## Taken from recorded evidence, not rerun

My attempt to rerun the full `css:parity` replay into a temporary directory was **denied by tool permissions**, so I did not work around it.

- **Public `parity.json`:** 52 files, 1161 rules, 0 rule differences, 265 specimens, 2388000 comparisons, `visualOk`, `baselineInputsMatch`. The `beforeCss`, `afterCss` and `utilityTokens` hashes equal the manifest. Browser 153.0.8010.12.
- **`gates.json`:** `css-parity` PASS, about 63 s, with a request hash and duration that differ from round 1, which is consistent with a post-repair rerun. `css-tests` PASS.
- **Why this is enough:** if either the frozen baseline or the current CSS contained the newly rejected form, the replay would now throw. The recorded post-repair PASS shows neither does. My round-1 grep of the current registry agrees.
- **Lint/fmt on the repair:** `repair-lint.json` covers 2 files with 0 findings; `repair-fmt.json` covers 3 files with 0 findings.
- **Not rerun and not affected by this repair:**
  - Package suite: 338 pass; focused suite: 77 pass.
  - TS checks: package 276; scoped 6 TS + 1 browser TS.
  - Quality/architecture, release preflight, JSR/native publish, the four generators and all 14 root checks.
  - The Card-background mutation negative.

## Whole-change status

- **All three #2561 cells are satisfied.**
  1. Fixed raw 220000 / gzip 28000 policy, documented in the code and the package README.
  2. Theme exclusion that doesn't depend on checkout location, proven by running the real test with positive and negative cases.
  3. A self-contained, provenance-hashed parity command wired into CI with durable receipts, plus regressions that fail closed. That includes the R1 repair.
- **No product CSS, token, markup, dependency, lock or generated carrier change**, so no architecture-debt entry is needed.
- **Runtime remains UNPROVEN** (Docker unavailable). This is disclosed and acceptable for this validation-only, non-release scope.
- **Still open, owned by delivery, not this sign-off:** remote CI green at the final pushed head, and the PR body/close-gate check (`Closes #2561`, #2412 stays `Refs`, Frontend Contribution milestone, no labels). Cockpit owns the merge.

## Optional notes still open (not required)

- **O1:** If the visual engine crashes before writing its report, the wrapper shows a bare file-not-found error. It still fails closed; a clearer message would help triage.
- **O3:** In the location test, the theme fixture is over the raw budget only, not the gzip budget. This is a wording point; coverage is fine.
- **O4:** The browser job's 25-minute timeout now also covers the replay (roughly 1–1.5 min locally). Watch the first CI run.
