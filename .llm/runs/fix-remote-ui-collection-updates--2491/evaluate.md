# IMPL-EVAL round 2 for #2491 / draft PR 2567: **PASS**

All three round-1 findings are fixed, my reruns pass, and I found nothing new that blocks the commit.

## What I ran myself
- **Hashes:** all 5 files match the refreshed `source-hashes.json`. Since round 1, only `README.md`, `registry-lifecycle.ts`, `ui-remote-collection_test.ts` and `protocol-command_test.ts` changed; `registry-client.ts` did not.
- **Tests:** I ran the structured test runner on `ui-remote-collection_test.ts`, `ui-collection-lifecycle_test.ts`, `ui-lifecycle_test.ts` and the native `protocol-command_test.ts`. **19 passed, 0 failed** (exit 0, about 38 s). That includes the empty-lock test that failed in round 1.

## Round-1 findings
1. **Empty-lock test: fixed.** The built-in collection scan only runs when the lock has items again. On an empty lock, bare names never touch the built-in catalog, and the remote loop still gives the unknown/empty diagnostics.
2. **Uninstalled remote item error: fixed.** When no collection matches, the error is now "Registry item '@ns/x' is not installed and no remote collection matches. Use ui:add first." It keeps the old "Registry item '…' is not installed" opening; the ending changed from "Use ui:add to install it first." to "Use ui:add first.". A new test covers an uninstalled remote item with a populated lock: one catalog read, nothing written. The CLI test checks the new wording.
3. **README blank line: fixed.** The stray hunk is gone; the README diff is now just the new paragraph.

## Checked again after the repair
- **Unchanged and still correct:**
  - collection names and bare members are qualified with their namespace;
  - updates cover only the installed members, and uninstalled ones are never fetched;
  - locally edited copies are kept and missing copies restored;
  - mixed valid/invalid requests are refused in either order, with no writes and one catalog read;
  - the catalog uses that namespace's own headers and is read once;
  - a directly named installed item updates without a catalog request;
  - the built-in complete-only rule and the no-lock legacy path are unchanged;
  - no port, schema, lock-format, dependency, `ui:add` or CSS changes.
- **Not blocking:** for a configured namespace whose catalog can't be reached, updating an uninstalled item now shows the catalog fetch error instead of "not installed". Nothing is written either way, so this is a possible follow-up, not a fix needed for this commit.

## Recorded evidence I didn't rerun
- Repair focused tests: 18/18 PASS, which agrees with my run.
- Your report says the 15 carrier checks and 4 canonical generators pass with no generated or lock diff, and that scoped check/lint/fmt was refreshed. I accepted those as recorded and didn't open the raw files.
- **Still pending, so no verdict from me:** `ui-tests-frozen.json` was empty when I read it, so the larger 49+ UI suite on the frozen source is still delivery's to report. Delivery should confirm it finishes with zero failures before the commit.
- **Not proven:** full runtime and container cleanup, as you disclosed (Docker unavailable). They're outside this scope.
