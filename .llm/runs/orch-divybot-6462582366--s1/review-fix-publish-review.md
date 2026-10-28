# Publish repair supervisor review

Separate Anthropic Claude Opus 5.5, high effort, read-only, closed stdin.

**PASS.** I found no blockers in the publish-size repair.

I only read the files. I ran nothing and couldn't diff against `cebe1c0d5`, so I checked the current files against the stated design. The green budget result (down from the 28,186,585-byte baseline) is your evidence, not something I reproduced.

- **Shipping one form:** `packages/fresh-ui/deno.json:22-41` publishes only `*.ts`/`*.tsx` and `src/**`. The only raw registry files kept are `registry/lib/cn.ts` and `registry/lib/toast.ts`. They have to stay because `mod.ts:44-45` and `src/presentation/data-grid.tsx:3` import them at runtime. Raw registry CSS/JSON and the token source JSON are no longer published; only their generated `.ts` carriers are.
- **Exact copy bytes:**
  - `renderFreshUiRegistryContent` (`generate-cli-assets-barrel.ts:178-207`) reads each manifest source file and stores it in a gzip+base64 JSON map. Decompressing it gives back the same strings, so copies match the source files.
  - The CLI reads every copied file and the theme `styles.css` from that one map, and fails if a key is missing (`registry.ts:343-352`, `registry-styles.ts:83-92`).
  - The freshness check, `check:assets-barrel`, re-runs `tokens:embed:check` and diffs `packages/fresh-ui/registry.generated.ts`. Gzip output is the same on every run because CI pins Deno 2.9.7.
- **Runtime publish completeness:**
  - No published module reads files at runtime, uses import attributes, or imports a JSON/CSS file. Every relative `registry/` import points at the two kept files.
  - `deno publish` refuses to publish if an included module imports an excluded one. The size test requires it to exit 0, so a missing runtime module would fail the test.
- **Lazy CLI startup:**
  - Every use of `@netscript/fresh-ui/registry` in `packages/cli/src/kernel/application/ui/registry.ts` is a dynamic `import()` inside a command (lines 84, 91, 136, 153, 178).
  - The rest of the CLI only imports it from tests or as plain strings. Token imports are type-only.
  - The manifest, the theme-items carrier and their decompression now load only when a registry command runs.
- **Test adequacy:**
  - `publish-size.test.ts` adds up the real sizes of the files that `deno publish` lists, against a named 5,000,000-byte budget. If the output format changes and no files are found, the test fails rather than passing.
  - `registry-startup_test.ts` follows only static imports from `registry.ts` and asserts the carrier is not among them. It also checks the carrier is still reachable through a dynamic import, so the test can't pass with nothing loaded at all.

None of these are blockers, but the final IMPL-EVAL should know them:
- The startup test starts from `registry.ts`, not the CLI's entry point. A future static import of `@netscript/fresh-ui/registry` from another CLI module would not be caught.
- `packages/fresh-ui/scripts/embed-token-assets.ts` calls `Deno.execPath()`, but its `tokens:embed` / `tokens:embed:check` tasks grant only `--allow-read=.` and `--allow-run=deno`. I couldn't confirm that call is allowed under those flags. Running `check:assets-barrel` once settles it.
