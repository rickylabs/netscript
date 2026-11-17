# IMPL-EVAL verdict for #2491 / draft PR 2567: **FAIL_FIX**

The design is right, but an existing regression test now fails and needs a small fix before the commit. Two smaller problems should be fixed in the same pass. No rescope or debt entry is needed.

## What I ran myself
- **Hashes:** all 5 files match `source-hashes.json`.
- **Tests:** I ran the structured test runner on `ui-remote-collection_test.ts`, `ui-collection-lifecycle_test.ts` and `ui-lifecycle_test.ts`. 16 passed, 1 failed:
  - The failing test is `ui-lifecycle_test.ts`: "named update refuses uninstalled items before copying or writing (empty lock)". It reports `catalogReads` actual 1, expected 0 ("Only local collection metadata may be read before rejecting an absent item").
- The recorded "12 focused PASS" is accurate for its two files, but that set left out `ui-lifecycle_test.ts`.

## Findings
1. **Blocking: an existing test now fails** (`registry-lifecycle.ts:23`). The patch removed the `installed.size` check from the preflight condition. Now a ui:update on an empty lock loads the built-in catalog for any uninstalled name, including bare built-in names. The existing test explicitly says that must not happen.
   - **Fix:** run the built-in collection scan only when `installed.size` is non-zero. The remote-namespace loop can still run on an empty lock, so the new tests that expect one catalog read still hold.
2. **Should fix: wrong error for an uninstalled remote item** (`registry-lifecycle.ts:36-37`). With a lock and a configured namespace, `ui:update @acme/foo` for an item that isn't installed now:
   - makes a catalog request, then
   - throws "Unknown remote registry collection: @acme/foo" instead of the old "Registry item '@acme/foo' is not installed. Use ui:add…".

   A mistyped or not-yet-added item is the more common case. Also, a failed catalog read (a registry with no `registry.json`, or an auth error) now replaces the "not installed" message with a transport error. Nothing is written, so this isn't a safety problem, but the error users see has regressed.
   - **Fix:** when no collection matches, fall through to the existing "not installed" error, or use a combined "not an installed item or known collection" message.
   - Add a test: an uninstalled remote item with a populated lock gives the "not installed" error and writes nothing.
3. **Nit: stray blank line in `packages/cli/README.md`** (around line 161). The patch adds a second blank line before "## Agent tooling". Delete it; it's unrelated to this change and a markdown fmt check would flag it.

## Checked and fine (code reading plus my test runs)
- **Namespace identity:** `collections(ns)` qualifies collection names and bare members. `@`, `http(s):` and `github:` references are left alone, using the same rule as `uiDependencyReference`. Namespaces are matched with `Object.hasOwn`, so inherited object keys can't match. Unconfigured `@x/...` names still get the "not installed" error.
- **Partial membership:** members are filtered to items in the lock and duplicates are removed. Uninstalled members are never fetched, which both the in-memory test and the CLI test check (`not-installed` never requested). Collection keys never enter the lock.
- **Local edits:** edited copies are kept with their lock baseline unchanged, and missing copies are restored. This goes through the existing `installUiRegistry` with `replaceManaged: false`.
- **Atomic refusal:** every name is validated before anything is installed. Mixed valid/unknown requests in either order are refused with no writes and only one catalog read.
- **Credentials and caching:** the catalog is read with that namespace's own headers through the request-scoped cache, so it's read once even when the name is repeated. Member updates use each item's own namespace headers. The CLI test checks the Authorization header on every request and that the credential never appears in output.
- **Exact item update:** still makes no catalog request (one item read in the test).
- **Unchanged behaviour:** the built-in complete-only collection rule and its tests still pass. The no-lock legacy path is untouched behind `if (lock && …)`. There are no port, schema, lock-format, dependency, `ui:add` or CSS changes.
- **CLI test:** the change that returns stdout+stderr only for expected failures is sound, so the diagnostics are now actually checked.

## Recorded evidence, not rerun
- Scoped check/lint/fmt, quality/architecture and CLI publish dry-run: recorded PASS, accepted as recorded.
- Full runtime: UNPROVEN (Docker unavailable). It's outside this scope and stays with delivery, as does container cleanup.
- **Still running, so no verdict from me:** `ui-tests.json` was empty when I read it, and the carrier checks hadn't finished. Both remain delivery's to report. Once finding 1 is fixed, the larger UI-v2 suite should reflect it, since it covers `ui-lifecycle_test.ts`.

After the repair, I'll re-check new hashes, rerun the three test files plus the CLI protocol test, and look at the new uninstalled-remote-item test.
