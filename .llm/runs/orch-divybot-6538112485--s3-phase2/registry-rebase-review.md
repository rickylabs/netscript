PASS

The legacy-baseline blocker is fixed, and I found no new blockers in the correction.

- **Legacy check (`tests/registry-authoring.test.ts`):** `assertLegacyCompatibility` now takes every `legacy-v1.json` entry from the projection and compares them exactly with the baseline. Any item outside the baseline must exactly match the reviewed list in `tests/registry/post-v1-items.ts`: the 7 gap components and no support items.
- **The four negative tests each really fail when they should:**
  - Dropping `button` makes the baseline comparison unequal.
  - Emptying `button.files` changes an existing entry.
  - An unexpected `unexpected-post-v1` entry no longer matches the reviewed list.
  - Dropping `toggle` leaves a reviewed addition missing.
- **`legacy-v1.json` stays frozen**, so any change to an existing item still fails the test. New items need a deliberate edit to the reviewed list.
- **`gaps-install.test.ts`** now checks that the contract-tagged components exactly match `POST_V1_COMPONENTS` before installing anything. An empty list or a dropped tag can no longer pass by checking nothing.
- **Metadata:**
  - The `actions` collection now starts with `theme-seed`, like the others.
  - The JSDoc in `registry.ts` lists the expanded `forms-core` and the new `actions` collection, without a hard-coded item count.
  - `registry.json`, the projection and the CLI template stay consistent with what I passed in the previous round.

Two items still rest only on your report, because I can't run commands in this review:
- the fresh-ui registry, build and v2 test results;
- freshness of the regenerated compressed carriers, which `check:assets-barrel`/`registry:embed:check` will catch if stale.

For later slices: each new contract component has to be added to `POST_V1_COMPONENTS` in the same commit that registers it. That's the intended gate, so a forgotten entry fails both tests.

Generating the MCP corpus after the source commit leaves its dirty-read guard untouched, so I have no objection to that order.