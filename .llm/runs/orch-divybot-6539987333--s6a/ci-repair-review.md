**Verdict: PASS.** The alias probe is now a real test, and nothing else changed since the round-1 review.

**Hashes and timing:**
- All 7 files match `ci-repair-source-hashes.json`.
- Only `design.spec.ts` and `README.md` changed since round 1 (10:18:10). The other five files keep their earlier timestamps (10:06–10:12), and HEAD is still `e501f41` with no production changes.
- The full browser replay finished at 10:20:42, after the final edit.

**The new probe:**
- The iframe loads only `/presets/ns-one.css` and waits for it to load (a load error fails the test). The body reads `var(--ns-bg)` and `var(--ns-fg)`, which both exist in that file (4 declarations each).
- It reads four colour pairs in order:
  1. **explicit:** `data-theme=ns-one` plus the current scheme
  2. **opposite:** the other scheme
  3. **alias:** no `data-scheme`, `data-theme=light|dark`
  4. **fallback:** after setting `sheet.disabled = true` on the stylesheet it actually loaded
- It then asserts:
  - the explicit background is not transparent
  - explicit ≠ opposite
  - alias = explicit
  - alias ≠ fallback
- The iframe is removed in `finally`.

**These assertions can fail:**
- If the role names are wrong or the sheet doesn't apply, the background is transparent and the first assertion fails.
- If light and dark collapse to the same values, the second one fails.
- If the dark alias (`[data-theme='dark']`) is removed, the alias falls back to the `:root` light values. That differs from explicit dark, so the third one fails.
- The fourth proves the alias colours come from the loaded stylesheet.

**One known limitation, not a blocker:** the light alias can't be told apart from the `:root` light default, because NS One's light block also matches `:root`. A legacy light page renders correctly either way, and the old in-page test had the same limit.

**Replay evidence** (`ci-repair-browser-r2/results.json`):
- 32 tests: 32 passed, 0 failed, 0 flaky, 0 skipped, no retries.
- That covers the 20 axe cases (5 routes × 4 width/scheme projects) and the 12 navigation cases.
- The alias probe ran in all 8 explicit NS One cases (tokens and components × light/dark × 390/1280), so both schemes are covered.
- The baseline contract receipt shows 5 of 5 passing at `e501f41`.
- The alias-file check, lint and fmt receipts are present.

**The README** now names `--ns-bg`/`--ns-fg` and describes the opaque, distinct-scheme and stylesheet-disabled controls, which matches the code.

**Unchanged from round 1 and still correct:**
- the three CLI test-contract fixes
- the golden-hash update, which follows S1's semantic `QueryResult` island
- the axe migration: the old default cases now sit identically under explicit NS One, the Utility component gallery is now scanned with only the 3 DesktopTrayMenu findings, and no fingerprint was added or increased

Runtime and leak hygiene stay **UNPROVEN**. This PASS covers only the local test and evidence repair. It doesn't certify remote CI, runtime, merge readiness or READY; exact-head CI must pass after the sign-off commit. The terminal-failure streak resets to 0.
