# Independent implementation evaluation

I didn't edit any files or run any commands; this review used Read, Glob and Grep only.

**Verdict: PASS** for the exact two-finding scope of #2466, round 1. CI is still pending.

**Finding 1: the legacy ERROR alias now exports CAUTION**
- `tools/docs-site/callout-types.ts:14` maps `error` to `CAUTION`. Its label (`Error`), tone (`destructive`) and icon (`circle-x`) are unchanged, so the HTML still looks and reads the same.
- Markdown alerts authored as `> [!DANGER]` or `> [!ERROR]` used to skip that mapping. In `docs/site/_plugins/ai-tooling.ts:256-264` the converter now looks up the marker through `calloutType`/`CALLOUT_TYPES`. The HTML still keeps the original marker in `data-alert` (`docs/site/_plugins/callout.ts:44`).
- That lookup can't throw on real content. Unknown markers are already rejected when the alert is parsed, and they render as a plain blockquote (`docs/site/_plugins/markdown-alerts.ts:183-192`).
- This is the only code that writes alert markers. A search finds no other copy of the old converter and no `[!ERROR]` or `[!DANGER]` markers anywhere except test inputs and one inline-code mention in `docs/site/design-system/docs-kit/callouts.md:14`. The new twin scan ignores inline code because it only matches lines that start with `>`.
- The tests exercise the real code paths:
  - The new fixture in `docs/site/_plugins/markdown-render-fixture.ts:196-219` covers danger and error, through both the Markdown and component paths, with and without a custom title. It checks variant, tone, the `CAUTION` prefix, that the old marker is gone, and that body and title survive.
  - The roundtrip test (`:392-404`) changes only the expected marker; body, list and code expectations are unchanged.
  - `tools/docs-site/callout-types_test.ts:60-66` pins all types to the five GitHub markers.
  - `tools/fresh-ui-browser/docs-tests/docs.spec.ts:833-847` scans every built Markdown twin, skips fenced code, and fails if it finds 100 or fewer alerts, so it can't pass on an empty site.

**Finding 2: the red-colour exemption is narrowed to one token**
- `tools/docs-site/style-policy.ts:14` narrows the type to `--ns-studio-api-kind-number-text`. At runtime (`:143-156`) only that name's value is read, and only from token-layer sources. The exemption applies only when both the name and the exact value match, so other keys passed in can't hide red.
- The normal collector (`docs.spec.ts:520-545`) already supplied just that one name, with its orange-12 value read from `tools/docs-site/figma-variables/primitives.json`. Nothing that used to pass is now dropped.
- The new browser test (`docs.spec.ts:743-786`) checks:
  - the approved token still passes;
  - red in `--ns-primary` with a forged exemption fails, both directly and through an alias;
  - an override of the approved token with `red` fails;
  - the same approved value from a non-token layer fails (`#582d1d` counts as red by the hue check, so this test proves something).
- The existing negative cases (`:689-710`) are untouched and still fail.
- The new `red-token` switch (`:603-615`) fails the main policy test as intended.
- Raw-colour, role and generated-bundle checks are unchanged, and no new bypass was added.

**Not blocking**
1. The generated file `packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts` is modified but compressed, so I couldn't confirm it contains the new prose in `callouts.md`. Before sign-off, regenerate the four generated-file chain and check that it is unchanged afterwards.
2. `tools/docs-site/README.md:57-58` lists the `raw-colour` and `red-role` negative-control commands but not the new `red-token` one. It's worth adding one line.
3. Residual trust boundary: the analyzer still accepts whatever value the caller supplies for the approved token. It can't reject red values itself, because orange-12 counts as red by the hue check. That boundary already existed and is outside this scope.
4. Existing behaviour, not a regression: a Markdown-authored `[!ERROR]` with no custom title now produces `[!CAUTION]` with no "Error" line in the twin, while component callouts always write their label. The tone is preserved either way.

**Still needed before readiness:** all 15 check tasks, the reconciled generated-file chain, and the full CLI runtime run in CI. I didn't run any of these; only CI or a separate gate run can confirm them.

## Gate reconciliation

All15rootchecktasks subsequently passed, including allfourcarrierfreshness checks. Rebuilt browser
32/32 and broader tooltests25/25 passed. Allfourrealnegativecontrols returned exit1 with expected
findings. The new red-token control is now documented as suggested. Compressed carrier consistency
is proved by native generation/freshness commands; no runtime CI result is claimed yet.
