## Repaired source slice review for #2548: **FAIL_FIX**

F1's staging fix is correct, and F2's disposition is acceptable. But adding the carrier to `PREPARED_RELEASE_GENERATED_OUTPUTS` creates a new source blocker. That list also controls the stable-publication gate, and the carrier is now waived through it without its freshness ever being checked.

### F1 (staging): resolved ✅
- **Fix:** `prepare-release.ts:40` adds `packages/fresh-ui/src/registry/assets/registry.generated.ts`. `collectPreparedReleaseFiles` (`:44-54`) carries it into `bump.files`, so `canary.ts:186` and `cut.ts:169` now `git add` it. The published detached-`HEAD` tree will therefore contain the regenerated blob.
- **Test strength:** the new `discoverPreparedReleaseFiles(...).includes(REGISTRY_EMBEDDED_PATH)` assertion would genuinely fail without line 40, so the red-before-fix result you report is credible. Running the production `embed-registry-assets.ts`, decoding the gzip+base64 `registryJson` and deep-comparing it to the bumped `registry.json` is the right end-to-end proof. It no longer depends on text matching inside the blob.
- **Other updates:** the enumeration test in `prepare-release_test.ts` is updated consistently, and the README now says the carrier is staged.

### F2 (`meta.version`): accepted as drift ✅
`drift.md:11` states the limitation accurately. The generic `"version"` rewrite will advance the catalog's `meta.version` at a future bump *from* 0.1.0, and fixing that needs a field-aware writer and residue policy. It doesn't affect 0.0.8 → 0.0.9. I'm not asking for more in this slice.

### New blocker F3: the stable-publication gate now accepts the carrier without proving it fresh
`PREPARED_RELEASE_GENERATED_OUTPUTS` is also the allowlist for the gate that lets a stable cut reuse its parent canary's green evidence:
1. `verifyGreenCanaryPair` (`github-release.ts:198-217`) accepts any changed file in this list as long as generated-output freshness is proven (`:213-215`, `:290-295`).
2. That proof is `assertPreparedReleaseGeneratedOutputsFresh` (`:537-560`). Its doc comment promises to "reproduce … every downstream generated release asset from HEAD". It runs only four commands:
   - `check:agent-docs-prose`
   - `gen:publish-assets --check`
   - `check:mcp-export-corpus`
   - `generate-cli-assets-barrel.ts --check`
3. None of them checks the carrier against `registry.json`. `gen:publish-assets` never reads it. `generate-cli-assets-barrel.ts` imports `freshUiRegistryJson` *from* the carrier (`:16`), so it only checks things derived from the carrier, never the carrier against its source. `registry:embed:check` (`packages/fresh-ui/deno.json:65`) is not called.
4. **Result:**
   - **Before the fix:** a changed carrier wasn't on the allowlist and isn't an exact text version replacement, so a stable cut that changed it failed closed and needed a new canary.
   - **After the fix:** the carrier is waived wholesale. A stable commit could carry an embedded registry that differs from the canary-verified `registry.json` in more than versions, and still reuse the parent's green evidence.

   That is fail-open in a production publish gate, introduced by this slice.

**Required fix (inside the authorized `.llm/tools/release/` surface):**
- Add the carrier's freshness check to `assertPreparedReleaseGeneratedOutputsFresh`: `deno task --cwd packages/fresh-ui registry:embed:check`, or an equivalent `runDeno` args form. It must run before the `generate-cli-assets-barrel.ts --check` step, which consumes the carrier.
- Update the expected command list in `github-release_test.ts:474-479`.
- Preferably add a negative case where a stale carrier rejects with "did not reproduce the generated release outputs".

### Pending final checks (not judged here)
- Final disposable canary `--dry-run` on the exact final code: still running.
- The freshness change above needs its own focused run: the `github-release_test.ts` plus `prepare-release_test.ts` suites, then the 52 release/specifier tests again.
- Required core CI: starts after the push, and stays draft.
- `scaffold.runtime`: **UNPROVEN**. Locally there's no Docker daemon. Ordinary PRs need opt-in labels (`e2e-cli.yml:30-36`), which the owner prohibits, and the owner allows workflow-policy skips. Final IMPL-EVAL will record it as a policy skip, not a pass.
- Already reported as passing: combined registry / `ui:add` / init / preset 83/83, the earlier dry-run, carrier and quality gates, scoped check/lint/fmt, and the negative control.

Once F3 is fixed with its test, I expect to return PASS for the source slice.
