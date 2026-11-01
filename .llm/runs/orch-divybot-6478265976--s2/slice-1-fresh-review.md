# Fresh independent slice 1 review

Requested route: `claude -p --model claude-opus-5-5 --effort high`, read-only, closed stdin, blockers only.

**FAIL_FIX** — slice 1 at `cdbbe24e9` has one blocker: it breaks the existing design-sync tool. I changed no repository files.

### Blocker 1 — `deno task design:sync` crashes when it loads the registry

- **Cause:** `packages/fresh-ui/registry.manifest.ts:11` now has a second export, `freshUiRegistryJson`. Its items use the v2 shape: `files[].path`, with no `source`.
- **Who reads it:** `resources/design/dashboard/.design-sync/config.json` points `tools/design-sync` at `registry.manifest.ts`. At `tools/design-sync/src/registry-source.ts:67`, the tool takes the first exported value that has an `items[]` array (`Object.values(mod).find(isManifest)`).
- **What goes wrong:** a module's exports are listed in alphabetical order, so `freshUiRegistryJson` now comes before `freshUiRegistryManifest` and gets picked. The exclude-rule check at `registry-source.ts:75` then calls `fwd(f.source)` on an undefined `source` and throws `TypeError: Cannot read properties of undefined (reading 'replaceAll')`.
- **Reproduced:** I ran the same `FreshUiRegistrySource(config).load()` on copies of each tree. At HEAD~1 it returns 85 units. At HEAD it throws the TypeError above.
- **Required fix:** pick one.
  - (a) Keep `registry.manifest.ts` exporting only `freshUiRegistryManifest`. Move `freshUiRegistryJson` to its own module and re-export it from `registry.ts`.
  - (b) Make design-sync select `freshUiRegistryManifest` by name.
- **Test to add either way:** a regression test that loads `FreshUiRegistrySource` with the real dashboard config.

### Checked, no blockers

- **Compatibility:** I compared the full projected manifest against the HEAD~1 manifest. The top-level fields, item order and every field of all 85 items are identical. The only difference is the extra `meta.netscript` on each item, and nothing reads it.
- **Schemas:** the SHA-256 values of both schema snapshots match the README.
- **Rejection tests:** the three broken-item cases I checked against the item schema are each rejected for the intended reason: missing `target`, a number in `cssVars`, and missing `font`. Each fails on its own, so the tests aren't passing for some unrelated reason.
- **Drift checks:**
  - The theme and preview tests are correct.
  - The fixed `@netscript/*@0.0.8` versions in `registry.json` are covered twice: by the authoring test and by `check:netscript-jsr-specifiers`. That CI gate also scans `.json` files, exits 0 and reports no stale versions.
- **Packaging:** the publish includes, the `/registry-v2` export and the `npm:ajv@8.20.0` lock entries are fine.
- **Tests:** the Fresh UI registry authoring, v2 and doc-drift tests pass (12/12). The CLI `ui/registry.test.ts` passes (8/8).

## Coordinator-authorized repair

Move the portable JSON export to its own module so the legacy manifest module has only one runtime catalog export. Add a regression test loading the real dashboard design-sync config. This is the single authorized blocker repair; continuation proceeds after its local gates.
