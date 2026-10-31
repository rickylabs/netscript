# Slice 1 review round 2

**FAIL_FIX**

The theme parity, version parity and 85-item baseline tests resolve the original finding. One new blocker:

**1. The preview parity test checks the wrong target prefix, so it fails on the current code.**

At `packages/fresh-ui/tests/registry-authoring.test.ts:42`, the test expects each preview target to be `` `~/static/${file}` ``. But:
- `registry.json` authors the preview targets as `static/presets/<id>.css` (for example `packages/fresh-ui/registry.json:1464`).
- `legacyRegistryManifest` in `src/registry/legacy-registry.ts:72` passes `file.target` through unchanged.
- Your own baseline, `tests/registry/legacy-v1.json:948`, records `static/presets/ns-one.css`. The original manifest also used `` `static/${file}` ``.
- `~/static` appears nowhere else in `packages/fresh-ui`.

So the projection returns `static/presets/ns-one.css` and the assertion expects `~/static/presets/ns-one.css`. As written, the test fails. Either it was not part of the passing run, or that evidence came from a different file state. Running only `tests/registry-authoring.test.ts` would show which.

**Fix:** change the expected target to `` `static/${file}` `` to match the original manifest and the baseline. Do not change the authored targets in `registry.json`, because that would break the 85-item baseline and change the paths existing scaffolds install to. Then re-run the focused tests and record the actual pass count.

The other repairs check out:
- **Theme parity** compares files, `registryDependencies`, tags, css and `meta.preset` against `generatedThemes`, using matching `registry/theme/...` sources and `@assets/...` targets.
- **Version parity** extracts the version correctly from `jsr:@netscript/<pkg>@<v>[/sub]`.
- **The baseline** has 85 entries and compares name, kind, files, dependencies, `registryDependencies`, css and tags. `tests/registry-doc-drift.test.ts` still covers layer and description.

I didn't check the doc-lint result.
