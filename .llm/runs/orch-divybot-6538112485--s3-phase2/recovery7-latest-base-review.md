# Independent recovery7 latest-base integration review

**PASS** on the Recovery 7 latest-base continuation. The parent is rebased (52 commits) onto main `f4aa307b` (#2549), with the committed source at `adc94477`. I found no blockers, and the failure streak stays at 0.

**The one maintained conflict** (`packages/fresh-ui/tests/registry-authoring.test.ts`)
- **Order is correct.** Main's first-party version normalization runs first (lines 25–39). It only rewrites `jsr:@netscript/*` pins from `@0.0.0-fixture` to the current `FRESH_UI_PACKAGE_VERSION`. After that come the topic's syntax delta (line 40), the named runtime repairs (lines 47–54) and the named registry repairs (lines 55–62).
- **CodeBlock's expected list is right.** The legacy entry has no `dependencies` (fixture lines 1418–1443), so the result is `['npm:highlight.js@^11', 'jsr:@netscript/fresh-ui@0.0.8']`. That matches the registry list I approved before.
- **The normalization doesn't weaken the comparison.** It only touches first-party `jsr:@netscript/` pins, and only the fixture placeholder. A stale or missing actual pin still fails the strict `assertEquals`. Line 160 still separately requires every internal pin to equal the package release version.
- **Every guard is still there:**
  - a missing legacy entry (`button`), emptied files, an unexpected addition, and a missing post-v1 addition (`toggle`);
  - the `render-ui` AI dependency removal and both `command-palette` repair mutants;
  - the missing-highlight.js negative;
  - main's shared CodeBlock/Markdown highlight.js range guard (lines 169–175).

**Fixture and README**
- The three legacy pins are `0.0.0-fixture` (fixture lines 2473, 2500 and 2550). The record says they're inherited from main unchanged, not rewritten by the topic.
- The internal registry README (lines 43–52) describes main's release-pin flow and the fixture substitution. It isn't a topic API claim.
- I can only read the current tree, not main's copy. My check that main's logic is reproduced is a behavioral reading of that tree, which agrees with the record that main's three files are unchanged.

**Evidence** (`recovery7-latest-base-evidence.json`, `recovery7-latest-base.md`, worklog and context)
- **Preservation:**
  - 620 of 623 UI and browser paths are byte-identical to the reviewed predecessor `49f3a178`;
  - the only differences are the three expected files, with 0 added;
  - renderer, CSS, tokens, browser code, behavior fixtures and the workspace, package and browser import maps are unchanged;
  - all three topic lock deltas are 0.
- **Browser results are reused, not rerun.** The 318 / 44 / 12 runs are marked `VERIFIED_IDENTICAL_RENDERED_SOURCES_AND_IMPORT_MAPS_NOT_NEW_EXECUTIONS`. The 622 package run is labelled historical. That's acceptable here because no rendering or public-API bytes changed. It doesn't replace the fresh full matrices slice 13 needs.
- **Current runs at `adc94477`:**
  - 63 affected tests pass 63/0/0: registry authoring, coordinated bump, GitHub release, release preparation and specifier tests;
  - check, lint and format on the changed test pass with 0 dropped;
  - quality/architecture passes (exit 0) and the native publish passes (0 slow types);
  - all six generate and check commands exit 0, including the four freshness checks.
- **No generated changes after the rebase.** The tracked diff was empty before the evidence edits, so the empty list is measured.
- **Doc-lint debt is unchanged.** The 124 diagnostics (the same 123 TypeScript plus 1 JSON) stay under #2531 and aren't reported as green, since no public-API source changed.
- **Not yet proven:** runtime at the new head and required CI. READY is false.

**Approved, in this order**
1. The evidence-only commit.
2. The mandatory public audit (zero added lines plus the whole run).
3. The parent force-push with an exact lease against `71d8df6f…`, re-checking first that the remote is still at that commit.
4. The PR comment, referencing #2416 only.

If main moves again before the push, rebase again and bring it back to this same review.

**Next**

The child `d0d8d922` restack comes back to me for review, with its own fresh gates and exact lease, before any 11b source work. Still required after that:
- **11b:** Toc, AnchorNav, RuledGrid, Hero, the Desktop audit and the original Shell Toc integration.
- **12:** the declared x-extensions and the all-style harness, under the locked additive style rule.
- **13:** the final runtime run, the whole-phase IMPL-EVAL and green CI at the exact head.

No READY, labels, closing keywords or early promotions of the 19 future items.
