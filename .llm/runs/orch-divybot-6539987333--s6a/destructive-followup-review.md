**Verdict: PASS.** The follow-up does exactly what was asked, and the widened test is proven to catch the actual case.

**Hashes and scope:**
- All 101 paths match `current-source-hashes.json`. HEAD is `5fbc309`, and PR2507 (`7ee9c3e`) is an ancestor.
- The pending production and test diff is three staged files:
  - `design.css.template`: `.ns-rules-dont > span` now uses `color: var(--ns-destructive-text)`. The `.ns-rules-dont` left border keeps `var(--ns-destructive)`.
  - `embedded.generated.ts`: a character-level diff of the carrier string shows a single insertion of `-text` at that rule and nothing else, so the carrier matches its source.
  - `component-colors.test.ts`: the widened regression test.
- No token values, API, contrast exclusions, runtime code or lockfiles changed.

**The widened test:**
- **Registry scope:** `walk` over `registry/components/ui/` with `maxDepth: 1` and `/\.css$/`. That's the same immediate-children coverage as the old `readDir`.
- **CLI scope:** `walk` over `packages/cli/src/kernel/assets/` with no depth limit and `/\.css\.template$/`, so nested files like `app/assets/design.css.template` are included.
- **Each scope must scan at least one file** (`scanned > 0`), so a wrong path can't make it pass by finding nothing.
- **The matcher is unchanged**: `(?<![-\w])color\s*:\s*var\(--ns-destructive\)`. It only flags the text `color` property, so border and background uses stay allowed as intended.
- **Findings are repo-relative paths and sorted.**
- **Resolution and permissions:**
  - `jsr:@std/fs@1` is already in both lockfiles, matching an existing `walk` import style in the fresh-ui tests.
  - The package test task grants unrestricted `--allow-read`, so reading the CLI path is allowed in CI.
- **No new helper or framework.**

**Evidence:**
- **Negative control:** with the source template temporarily back on the solid role, the test failed. It reported exactly `["packages/cli/src/kernel/assets/app/assets/design.css.template"]` (1 failed, no other failures). That proves both the nested path coverage and this specific request.
- **Positive run:** after restoring the template and formatting, the test passes. The run (10:42:11) postdates the template (10:41:31) and the test file (10:42:09). I re-ran it read-only and it passes, 1 of 1.
- **Carrier freshness:**
  - `check:assets-barrel` and `check:publish-assets` ran after the edits. The carrier's 10:43:03 timestamp is the barrel check regenerating identical bytes, and its hash matches.
  - All 13 root `check:*` tasks exit 0.
- **Broad gates:** the quality, docs-accuracy and token-quality receipts pass at `5fbc309`. `release:preflight` passes (native command evidence only).

**Note:** `origin/main` now has three newer commits (workers, streams, sagas) that this branch doesn't include. They don't touch this scope, but the required CI must run on the PR's exact pushed head or merge ref.

Runtime and leak hygiene stay **UNPROVEN** locally. This PASS doesn't restore READY: commit, push, and require green CI at the new exact head first. The terminal-failure streak stays at 0.
