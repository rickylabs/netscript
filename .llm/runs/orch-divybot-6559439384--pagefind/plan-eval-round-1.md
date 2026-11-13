# PLAN-EVAL: #2453 Pagefind reproducibility (feature tier)

**Verdict: FAIL_PLAN.** This is cycle 1 of 2. The design is sound and minimal. Two checklist boxes fail on concrete, quickly fixable gaps.

**Evaluator:** independent separate-family session, Anthropic Claude Opus 5.5, high effort, read-only. I made no edits to the source, locks, run artifacts, git or GitHub. The only probe was a throwaway in `$TMPDIR`, since deleted.
**Head evaluated:** `1e4e58fcc0d3e9bd8ca32862adcde42e70a49b99`, with the run bootstrap staged and not yet committed.

## Spot-checks of the load-bearing claims

| Claim | Evidence | Result |
|---|---|---|
| Lume 2.5.4 pins `npm:pagefind@1.3.0` and indexes pages one at a time with `addHTMLFile`, then emits `getFiles` output unchanged | Upstream `deps/pagefind.ts` (lines 1–2) and `plugins/pagefind.ts` (lines 147–198) | Confirmed |
| The site uses `pagefind({ ui: false })` with no wrapper | `docs/site/_config.ts:385` | Confirmed |
| 1.6.0 is the latest stable release and is newly published | npm dist-tag `latest` = 1.6.0, published 2026-11-01T11:26Z (inside Deno 2.9's 24 h age window) | Confirmed |
| 1.6.0 includes #1124 | #1124 merge commit `0b56369` is an ancestor of `v1.6.0` (0 behind, 92 ahead); the release notes list it under "Indexing & Performance" | Confirmed |
| #1395 (page IDs depend on ingestion order) is separate and still open | Issue is open; it says `walk_for_files` on main does not sort | Confirmed |
| An exact import-map override can redirect the `npm:` specifier Lume imports | Temp probe: a `deno.json` import map with `"npm:pagefind@1.3.0": "npm:pagefind@1.6.0"` resolved to `npm:/pagefind@1.6.0`, plus the platform binaries | Confirmed |
| The strict baseline failed and only Pagefind metadata differed | `baseline-strict.md`; it matches the checker's metadata classifier at `tools/docs-site/check-reproducible.ts:37-40` | Consistent |

**Is the approach sufficient and minimal?** Yes, in principle.
- The exact override plus stable URL ordering ahead of Lume's existing processor is the smallest native fix.
- It needs no Lume fork, no binary postprocessor and no change to the root lock.
- #1124 addresses the run-to-run HashMap randomization that the local strict gate catches.
- URL ordering addresses #1395, where output differs between machines (filesystem walk order differs across CI runners). That is the cache and upload invalidation the issue describes.

## Checklist

- [x] **Research present and current.** `research.md` re-baselines against fetched main at `1e4e58f`. It re-checks the reverted 1.5.2 trial from #2451 and does not reuse it. The spot-checks above passed.
- [x] **Decisions locked.** `plan.md` "Locked decisions" names the exact 1.6.0 override, keeping Lume 2.5.4, code-point URL ordering (worklog Design item 4), no output rewriting, and keeping the CI allowance until there is exact-head proof. Each has a rationale.
- [ ] **Open-decision sweep: FAIL.** `plan.md` says "No unresolved design choices", but three are open and unflagged:
  1. **How the pages get sorted.** Lume's `Processors.run` (`core/processors.ts` lines 29–34) gives each processor a fresh filtered array (`pages.filter(...)`). Sorting the first argument (`filteredPages`) in a processor registered earlier therefore does nothing. The sort has to reorder the second argument (`allPages`, which is `site.pages`) in place. That also changes the order every later processor and listener sees (`basePath`, `aiTooling`, the permalink pass, the writer). The plan must lock the mechanism and state the expected downstream effect, or check it (for example, that `llms.txt` and the twins match main apart from intended changes). If it isn't locked, an implementation that does nothing can pass every gate the plan names (see the next box).
  2. "Remove obsolete tool mode **if appropriate**" in slice 3: decide whether `--allow-pagefind-metadata` stays in `check-reproducible.ts` or is deleted. Each choice touches different files: the README at `tools/docs-site/README.md:91` and the classifier test.
  3. "Strict checker regression coverage **only for meaningful fail-closed behavior**": decide yes or no, and which test file.
- [ ] **Commit slices: FAIL.** There are three ordered slices, each well under 30 files, but:
  1. **Slice 3 leaves out a file that will break.** `.github/scripts/ci-classify-changes.test.ts:618` asserts `browser.includes('check-reproducible.ts --allow-pagefind-metadata')`. Removing the flag from `.github/workflows/pages.yml:248` makes that test fail. The file is also outside the write surface in `supervisor.md`. Name it in slice 3 and record the write-surface expansion in `drift.md` before implementation starts.
  2. **No gate in slice 2 proves the #1395 ordering fix.** The strict checker builds twice on one machine and filesystem, where ingestion order is already stable. It cannot detect dependence on ingestion order, so the URL sort ships unproven. Add a focused proving gate. One option is a small helper under `docs/site/_plugins/` with a Deno test that indexes a shuffled page list through the helper and the native 1.6.0 API, then asserts byte-identical `getFiles` output. Another is a test showing that `site.pages` is sorted before Pagefind's processor runs.
  3. **The "frozen native build" has no command.** The `lume` task in `docs/site/deno.json` does not pass `--frozen`, and the site's `deno.json` has no frozen-lock setting. Name the exact command or config that proves the build resolves only from the reviewed `docs/site/deno.lock` without the age bypass. Also assert that no `pagefind@1.3.0` entry remains in that lock.
- [x] **Risk register.** It covers search/UI contract drift, randomization that persists, the fresh release, and unrelated main changes, each with a mitigation. (Recommended: add a risk for the effect of the in-place sort on downstream processors once item 1 above is fixed.)
- [x] **Gate set selected.** The docs scope overlay is applied, with workflow docs-tooling, check, lint, fmt and test wrappers; links and caveats; generated freshness; the full Utility Playwright suite through the durable `fresh-ui-browser` receipt; the strict all-output two-build check; and the classifier and workflow tests. CLI E2E runs once at readiness, with policy skips separated from runtime proof. Root quality and architecture checks are correctly limited to changes in `packages/` or `plugins/`, and none are planned. (Gate gaps are covered under the slices box.)
- [x] **Deferred scope explicit.** Explicitly out of scope: S8 layouts and tokens, #2450, #2574/#2573, registry work, binary transforms, an upstream fork, and the upstream native fix for #1395.
- [x] **jsr-audit: N/A.** This is docs build, tooling and workflow only; it touches no `packages/` or `plugins/` and no public JSR surface. `research.md` records this.

## Corrections needed before PASS

1. In `plan.md`, lock the sort mechanism: reorder `allPages`/`site.pages` in place inside a processor registered immediately before `pagefind()`, compare `page.data.url` by code point, and state the effect on later processors.
2. Add a slice 2 gate that proves the result does not depend on ingestion order, and name its file.
3. Name the frozen-lock command or config for slice 2, and assert that no 1.3.0 entry remains in `docs/site/deno.lock`.
4. Resolve the two "if appropriate / only for" choices in slice 3 and list every file each one touches, including `tools/docs-site/README.md`.
5. Add `.github/scripts/ci-classify-changes.test.ts` to slice 3 and to `drift.md` as a write-surface expansion recorded before implementation.

Each fix is a precise one-line edit to the plan or drift record. If they come back unchanged in substance, cycle 2 can PASS without re-litigating the design. Under the feature tier, the evaluator may edit a still-fixable plan directly on cycle 2.
