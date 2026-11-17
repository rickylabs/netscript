# Slice 2 review: #2453 Pagefind reproducibility

**Slice content verdict: PASS.** I found nothing that needs fixing in slice 2. **Full IMPL certification is still pending.** The Utility browser suite has not run any application assertions yet: all 164 failures were launch failures from missing system libraries. Slice 3 (switching CI to strict mode) also hasn't been made, and the exact final head hasn't been proven. I'm not calling the browser result a pass or a regression until it is rerun.

**Reviewer:** the same separate-family session, read-only. **Reviewed:** the uncommitted slice 2 on top of `ed7d08a`, which is `1e4e58f` plus the run-only commits.

## What I checked independently

| Area | Evidence | Result |
|---|---|---|
| Pagefind 1.6.0 remap | `docs/site/deno.json` adds the exact key `"npm:pagefind@1.3.0": "npm:pagefind@1.6.0"`; the fixture asserts `entry.version === '1.6.0'` | Correct and minimal |
| Site lock | `docs/site/deno.lock`: no `pagefind@1.3.0` entries left (count 0). The 1.6.0 package and all 7 platform binaries are pinned. The integrity hashes for `pagefind`, `linux-x64`, `darwin-arm64` and `windows-x64` match the npm registry. No other package nodes changed. The root lock is untouched. | Correct. The hand-pruned entries are confirmed by the registry match and the frozen rerun. |
| Frozen build | The `lume` task now runs with `--frozen`. `drift.md` records that the remote-CLI form needs an explicit `--config deno.json` to apply the import map. | Correct |
| Sorting pages by URL | In `docs/site/_plugins/pagefind.ts`, an `.html` processor sorts `allPages` in place, then `site.use(pagefind({ ui: false }))` registers Pagefind straight after it. Lume runs processors in registration order, so Pagefind's filtered input inherits the sorted order. `_config.ts` only swaps the import and the call. | Correct. This matches the locked plan. |
| Real shuffle regression and negative control | `pagefind-fixture.ts` runs the real Lume processors and native 1.6.0 on ordered `[0,1,2]` and shuffled `[2,0,1]` input, and requires every output byte to be identical. It also requires that the native plugin without sorting produces *different* output. It checks HTML and Markdown-twin content is unchanged and that the twin is not indexed. `/Alpha/` vs `/bravo/` exercises code-unit ordering rather than locale ordering. | **Rerun: 1 passed.** The site lock was byte-identical afterwards. |
| Effect on other outputs | `drift.md` says 804 non-search outputs are identical. The only change is `catalog.json` `inputHash`, because it hashes `docs/site/deno.json`, and substituting the old field value reproduces the baseline SHA. | Expected source-fingerprint change. It is not an allowance in the repeated-build proof. |
| Contributor docs | `tools/docs-site/README.md` explains the remap, the lock, the frozen task, the ordering rationale (#1395), `test:pagefind`, and the negative control. | Adequate for slice 2 |
| Scope | Changes stay within the declared write surface. No S8 layouts, tokens or registry; no binary postprocessing. | Clean |

## Non-blocking notes

1. **The comparator uses UTF-16 code units, not code points.** `<`/`>` on strings compares UTF-16 code units, while `worklog.md` Design item 4 says "code-point". The order is still deterministic and independent of locale; it would only differ for URLs mixing characters above U+FFFF with characters in U+E000–U+FFFF. Either correct the wording or compare by code point. This does not affect reproducibility.
2. **Pages with the same URL keep their incoming order.** The sort is stable, so ties keep the pre-sort order. Lume page URLs are unique for written pages, so this is acceptable. A secondary key on `outputPath` would make it fully total, but this is optional.
3. **Items owned by slice 3:**
   - The bounded-mode paragraph in `tools/docs-site/README.md` (around lines 90–94) still describes `--allow-pagefind-metadata` as current behaviour.
   - `test:pagefind` and the `pagefind_test.ts` bridge are not wired into any CI workflow yet. Today, CI runs only the source-format test through the `docs-source-format-test` gate.

   The final IMPL review will check that slice 3 deletes the mode and adds the native ingestion test to Pages CI.

## Pending for final IMPL review (same session)

- Full Utility browser suite with the environment repaired, using a durable `fresh-ui-browser` receipt that contains real application assertions.
- Slice 3: remove the bounded mode from `.github/workflows/pages.yml`, `check-reproducible.ts`, the README and `.github/scripts/ci-classify-changes.test.ts`, and wire `test:pagefind` into CI.
- A strict two-build comparison at the exact final head, after any reconciliation with main.
- The CLI end-to-end result recorded accurately. It currently fails at `preflight.aspire` and cleanup because the Docker daemon is unavailable. That is an environment failure, not runtime proof, and must not be reported as a pass.

**Slice 2 content: PASS. IMPL verification: PENDING (browser gate and slice 3).**
