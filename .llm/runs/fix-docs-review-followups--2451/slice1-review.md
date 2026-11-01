**Verdict: PASS** (slice 1 source)

The earlier FAIL_FIX stays on record. It has been addressed by reverting the Pagefind override, not by keeping it. This is a review of the source only: the 52-case browser run and the HTML reproducibility gate haven't been rerun yet.

### Dependency record corrected
- `docs/site/deno.json` no longer maps any `pagefind` specifier.
- `docs/site/deno.lock` resolves only `npm:pagefind@1.3.0`, its package and its five platform entries (`:43,272-296,406-414`). Every `1.5.2` entry, including the extra platform packages and the workspace dependency, is gone.
- The lock still carries the measured Lightning CSS closure: the `lightningcss-wasm@1.29.2` specifier and package (`:37,363`) and the pinned Lume module hashes (`:656,677`).
- `drift.md:11` records honestly that the 1.5.2 trial didn't fix the problem, that it was reverted, and that the earlier FAIL_FIX was about the unmeasured record. Nothing claims a repair.

### Narrowing the acceptance scope is justified, and no gate was removed
- **The evidence supports it:** both builds produce identical HTML for all 251 pages. Only Pagefind's `filter`, `meta` and entry files differ, under both 1.3.0 and 1.5.2. The fragments that carry element anchors and the Markdown twins don't differ. So the deterministic IDs do reach the index and the twins, which was the point of the earlier B2. What's left is serialization variation inside Pagefind itself, not something this change caused.
- **The checker stays strict by default** (`tools/docs-site/check-reproducible.ts`):
  - It snapshots and hashes every output file.
  - The default mode fails on any differing file.
  - `--html-only` still compares every file, but fails only on `.html` differences. It prints every non-HTML difference in `changedNonHtml`, so nothing is hidden. It also fails if there's no HTML at all, and it rejects unknown arguments.
- **Nothing else is lost:** the plan keeps all the search, filter-count, hash-navigation, fallback, style and accessibility tests (`plan.md:20`). Adding a post-processing step for Pagefind's binary output, or upgrading the dependency for nothing, are both correctly ruled out, and the Pagefind variation goes to a separate issue.

### Not blocking, but needed before IMPL-EVAL
1. **CI wiring is still missing.** The only reference to `check-reproducible.ts --html-only` is in `tools/docs-site/README.md:84`, and no workflow runs it yet. Slice 2 has to add it to CI, as the corrected plan says, or IMPL-EVAL will fail on it.
2. **The plan still has outdated lines.** `plan.md:5,14,16` still describe the all-output, zero-exclusion gate and the 1.5.2 override as the plan. Mark them as superseded by the "acceptance-scope correction" section, so nobody later reads the outdated gate as the one in force.
3. **The new gate could be stronger with no exclusions.** In `--html-only` mode, also fail on differences in `**/*.md`, `llms*.txt` and `pagefind/fragment/**`, which are all stable today. Pagefind's `filter`, `meta` and entry files would then be the only reported-but-not-blocking differences. That keeps the twins and the anchor-bearing fragments protected against regressions.
