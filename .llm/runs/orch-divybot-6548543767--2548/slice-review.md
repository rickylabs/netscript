## IMPL slice review for #2548 (source slice, before the commit): **FAIL_FIX**

The approach is sound. Option (a) adds the canonical registry to the coordinated bump, and the `0.0.0-fixture` isolation and specifier regression are both correct. But one blocking gap means a real stable or canary cut would still ship stale first-party pins to consumers. That is the #2548 symptom, just moved into a different file.

### Blocking

**F1. The regenerated embedded registry carrier is never committed by stable or canary releases.**

What now happens during a release:
1. The bump rewrites `packages/fresh-ui/registry.json` to the new version. This part is new and works.
2. `prepareRelease` runs `gen:assets-barrel` (`.llm/tools/release/prepare-release.ts:111-118`). That task runs `registry:embed` first (`deno.json:120`), which rewrites `packages/fresh-ui/src/registry/assets/registry.generated.ts`.
3. That carrier is a gzip+base64 blob of `registry.json` (`packages/fresh-ui/scripts/embed-registry-assets.ts:3-24`). The residue scan does plain text matching (`bump-version.ts:94-98`, `111-113`), so it cannot see pins inside the blob. Neither can `check:netscript-jsr-specifiers`.
4. The release only stages `bump.files`, which is the discovered version files plus `PREPARED_RELEASE_GENERATED_OUTPUTS` (`prepare-release.ts:37-40`, `PUBLISH_ASSET_OUTPUTS` at `generate-publish-assets.ts:15-38`). The `src/registry/assets/registry.generated.ts` path is **not on that list**. It is regenerated in the working tree but never `git add`ed (`canary.ts:186`, `cut.ts:169`).
5. The real publish runs from a detached worktree of `HEAD` (`publish-workspace.ts:229`). So the published `@netscript/fresh-ui` would embed the old pins.
6. Consumers read that blob at runtime: `src/registry/fresh-ui-registry.ts:1` → `registry.manifest.ts:1`. So `ui:add` would still install `jsr:@netscript/sdk@<old>/desktop` and the other stale pins.
7. The release commit would also be inconsistent with itself. The staged root `packages/fresh-ui/registry.generated.ts` is derived from the regenerated blob, so it would be current while the committed blob is stale. `registry:embed:check` / `check:assets-barrel` and `registry-authoring.test.ts:81-88` would fail on the tag commit.

**Why the current evidence missed it:** a dry-run never stages files. Residue and `publish:readiness` both ran against the regenerated working tree. And `bump-version-registry_test.ts` only checks that `registry.json` is in `discoverPreparedReleaseFiles`.

**Before this change the path was unreachable,** because `registry.json` never changed during a release. Including the registry is what makes it live.

**Required fix (within the authorized `.llm/tools/release/` surface):**
- Add `packages/fresh-ui/src/registry/assets/registry.generated.ts` to the prepared-release outputs. Either put it in `PREPARED_RELEASE_GENERATED_OUTPUTS` or add a registry-owned constant next to `RELEASE_ASSET_VERSION_FILES`.
- Assert in the regression test that `discoverPreparedReleaseFiles` includes it.
- Preferably also add a test that runs the bump, runs `registry:embed`, decodes `registryJson`, and asserts the pins equal the new version.
- Update the README sentence about release preparation to say the embedded carrier is also staged.

### Non-blocking (record in drift or fix cheaply)

**F2. Latent rewrite of `meta.version`.** `registry.json:4440` has `"meta": { "version": "0.1.0" }`, the registry's own version. `rewriteNetScriptVersion` rewrites any `"version": "<old>"` (`bump-version.ts:123`). So the first cut *from* workspace version 0.1.0 will silently change the registry's meta version. Before this change the residue scan would have failed loudly instead. It doesn't affect 0.0.8 → 0.0.9 or the cut to 0.1.0. Either record it as known drift or debt, or add a test that pins `meta.version` as unchanged across a bump.

### Verified correct
- **Discovery:** reuses the tracked-or-existing semantics (`bump-version.ts:214-223`). The test uses a real `git init`/`add` root, so the Git branch of discovery is exercised for both the stable and canary cases.
- **Rewrite coverage:** the JSR rewrite regex covers exact pins with export subpaths and leaves third-party ranges alone (`netscript-jsr-specifier.ts:49-56`). The test asserts `npm:preact@^10.29.2` is preserved.
- **Fixture:** `legacy-v1.json` is fully converted (3 pins, no `meta.version`). It sits under `/tests/`, so the specifier scanner already skips it. With `0.0.0-fixture` the residue scan can't match it, and no exclusions were widened.
- **Fixture test:** normalization touches only first-party `@0.0.0-fixture`. The independent live-pin assertion is kept (`registry-authoring.test.ts:81-88`).
- **Specifier regression:** covers both the stale and current cases on the authored path `packages/fresh-ui/registry.json`, which is not excluded.
- **Docs-site `r/*.json`:** only exists under `docs/site/_site/` (build output). Your inspection of 93 files with 6 current pins is adequate.
- **Doctrine:** no new public exports or dependencies. The tooling stays in Archetype 6.

### Gates still pending (not judged)
- Combined Fresh UI registry / `ui:add` / CLI init / preset tests, and the dry-run publish checks: still running.
- `scaffold.runtime`: **unproven**. Locally there's no Docker daemon and aspire doctor fails. The CI path needs opt-in labels, which the owner prohibits. Final IMPL-EVAL needs either a CI receipt or the owner explicitly accepting it as unproven for this reference-only draft.
- Non-dry canary: correctly not run. Note that F1 can't be caught by any dry-run, which is why a unit-level staging assertion is needed.

### For the resumed final IMPL-EVAL
- The F1 fix, plus a test that fails before it and passes after.
- An F2 drift/debt entry or test.
- Exit codes for the remaining combined test and publish-dry-run evidence.
- An explicit disposition for `scaffold.runtime`.
