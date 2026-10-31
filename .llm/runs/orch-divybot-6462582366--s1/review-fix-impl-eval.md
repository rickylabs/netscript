# Final review-fix IMPL-EVAL

Independent Anthropic-family Claude Opus 5.5; requested high effort; read-only tools; closed stdin. Evaluated source head `ad53106e59d69cd7c3f81464d7f8103dbb18cdf0`.

**PASS.** No code, publish or startup blocker remains at `ad53106e`. Both review blockers and the ten cheaper findings are resolved. The full scaffold runtime is still **UNPROVEN**: the host lacks Docker/Aspire. That is a host limit, not a source defect. Under the owner's instruction the result is READY for review only: no merge, tag or release.

I only read files; I ran nothing. Every test result and gate receipt below comes from the run's evidence files, mainly `review-fix-validation.json`, `review-fix-cli-proof.json` and the two review-fix review files. As instructed, I did not write `evaluate.md`.

**Blocker 1 – published package too large: resolved**
- The published package is down from 28,186,585 bytes to 2,184,239 bytes across 91 files, against the 5,000,000-byte limit. The size test failed before the fix and passes now; the publish dry-run exits 0.
- Copy assets ship once, inside a generated compressed carrier, and decompress to the exact original bytes. The only raw registry files still published are `cn.ts` and `toast.ts`, which the runtime needs.
- The CLI loads the registry only inside commands, and `registry-startup_test.ts` proves it stays out of the static import graph.
- The earlier slice review passed this; the `assets-barrel` and `publish-assets` gates pass at this head.

**Blocker 2 – production app loading the full design manifest: resolved**
- Production routes import only `lib/theme.ts`, which reads the small `theme-preset.json` and `fonts.json`.
- The full `tokens.json` is reached only from the development-only design middleware, after its mode check. The preview theme is stored per request, in `state.themePreview`.
- `production-theme_test.ts` fails if any production route reaches `tokens.json` or a design module. The generated-app check is clean (31 files, 0 diagnostics).
- The preview helper now returns a checked manifest key, so the earlier type mismatch is gone.

**The ten cheaper findings: all resolved**
1. **Route binding:** the design tokens page binds once, with `.withRoute(appRoutes.designTokens)`.
2. **Opt-in previews:** preview stylesheets come only from the `theme-previews` registry item or `tokens build --previews`, and land in `static/presets/`. The browser CI workflow opts in explicitly with a `ui:add theme-previews` step after scaffolding.
3. **Raw JSON port:** the CLI passes raw JSON strings; only the external adapter parses them.
4. **Light clean:** `tokens clean` reads only the small `token-config` metadata. A test makes the compiler loader throw to prove clean never loads it.
5. **Preset kept on clean:** clean keeps `theme-preset.json`, and the CLI proof shows a non-default clean/rebuild is byte-identical.
6. **Forced init:** `init --force` checks the whole plan, then replaces only the managed source folder. The proof shows stale sources are removed.
7. **Density deduplication:** identical density contexts are compiled once and reused.
8. **App builds skip Figma:** app builds skip the Figma output, and their core files are byte-identical to the full build.
9. **Default CSS trimmed:** the default NS One CSS is 37,020 bytes, 4,308 gzipped, against the 6,000-byte budget. The legacy prefix and all 156 old names and values are unchanged.
10. **Bridge closure:** `formatThemeBridge` uses the same trimmed token set as the CSS. The closure test now checks both files together, and the three bridge references left in the shipped default are all declared.

**Evidence summary (from the run's records)**
- Tests: package 217, CLI 43, generated app 31, browser 24 with the accessibility baseline unchanged, all passing.
- The real CLI proof passes every case, including invalid input exiting 1 without writing anything and 18 opt-in previews.
- The quality and all four carrier-freshness gates pass at this head. Token quality also passes: 903 roles, 4,066 contrast uses, 406 exceptions, 0 unapproved failures.
- No review threads are unanswered.

**Still open (none of these block the verdict)**
- **Full runtime:** the one-pass `scaffold.runtime` run exited 1 at the Docker/Aspire host check (1 passed, 2 failed, 0 skipped). It is recorded as UNPROVEN, never claimed passed, and no gate or label was weakened. The CI runtime tiers were not opted in.
- **Browser repeat after the bridge fix:** the current-head receipt is still running. The 24-case pass came before the bridge fix. I don't expect a change, because the fix only removes unused bridge utilities and nothing in the scaffold or registry uses them. That receipt belongs in the READY handoff.
- **Release gates:** this is not a release cut, so the release-gate check does not apply.

## Evidence completed after the verdict

The receipt-backed browser repeat finished PASS at the same source head: 24 passed, 0 failed, unchanged axe baseline. Its command/child-report hashes are retained in review-fix-validation.json.

Inventory clarification: the verdict repeats the assignment’s count of 156. Direct comparison with current main finds 155 manifest/CSS names and 182 explicit light/dark value comparisons; every comparison is unchanged. The original 8,234 CSS bytes are an exact prefix. This does not change the compatibility conclusion.
