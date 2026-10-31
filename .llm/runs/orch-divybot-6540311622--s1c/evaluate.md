# S1c final IMPL-EVAL — PR #2507, Refs #2450

**Verdict: PASS**

There are no blockers. My earlier destructive-text finding is closed. Product source is committed at checkpoint `082b3bb6e184ff70884af747a9505bbae8094745`, and `packages/` has no uncommitted changes against it. The only uncommitted files are run evidence and the narrowed `tools/fresh-ui-browser/axe-baseline.json`.

## Source correctness

| Area | Finding |
|---|---|
| Figma snapshot from #2506 | All 11 files in `packages/fresh-ui/tokens/figma/` are byte-identical to the export at `af775ddd3`. `provenance.json` points to #2506 and that commit, with matching SHA256 values. `README.md` is now committed. |
| Accent | The `accent-fg/accent-solid-hover` pair is removed and the theme-aware `accent-fg/accent-hover` pair is kept. The raw Base `accent-solid-hover` variable stays in the source, and no component uses it. |
| Liquid | Only `liquid-primary-fg/liquid-material-tinted-primary` is measured: white on a 0.94-alpha blue. It passes 4.5:1 in both schemes. |
| NS One | Only five semantic values in `legacy.json` changed: primary/secondary hover, destructive, input-border and ring. The primitive palette ramps and geometry are unchanged, and the CSS prefix matches. Dark `destructive-text` maps to the original red-5 (`legacy-role-aliases.ts`). |
| Inactive policy | Exemptions need an explicit annotation. They apply only to text roles named `state-disabled-*` or `*-disabled`, at the 4.5 threshold. Exempt uses are still measured and still counted. Unknown or stale annotations fail validation. An exemption can't use up a source exclusion. The `exempt-active` negative control goes red through the real checker. |
| Prior blocker (destructive text) | **Closed.** All 8 `color:` declarations in the 6 stylesheets use `var(--ns-destructive-text)`, and the fill and border uses are unchanged. `tests/tokens/component-colors.test.ts` scans every component stylesheet; I ran it and it passed. Dark NS One `destructive-text` measures 5.197:1 on the page background and 4.553:1 on card. |
| Default preset | Unchanged. No change touches preset selection. |
| API and architecture | No new export, port, CLI command or dependency. The contract and report changes are additive (`exemption`, `exempt`, `contexts`), and the pair data stays at version 1. No new debt. |

## Contrast report

- All 48 preset/scheme rows (24 presets × 2 schemes) are present. Each has 0 failures, and `contrast-exclusions.json` is empty.
- There are 58 exempt uses, 56 of them below 4.5. I recomputed both counts from `failing-pairs.json`.
- The total reconciles. The S1b report recorded 9132 uses, and 9132 − 48 − 6 + 2 = 9080. The per-row checks also sum to 9080.

## Browser baseline

The `axe-baseline.json` diff removes exactly 12 color-contrast entries, plus 3 metadata lines that were updated (capture time, source head, review note):
- destructive button label ×4
- `var(--ns-destructive)` swatch `<strong>` ×4
- light `.ns-error-text` ×2
- light subtle destructive badge ×2

No entry was added or raised. The engine (axe-core 4.11.4) and the browser are unchanged, and the Utility preview cases are still `{}` (zero allowances). These removals match the fixes: the white label on the corrected fill, and error text that now uses `destructive-text`. `browser-verdict.json` records the browser gate and the contract gate as PASS at the checkpoint, with 24 browser tests (0 failed, 0 skipped), 5 contract tests and 12 matrix cases.

## Evidence

| Gate | Result |
|---|---|
| Token + native publish tests | 40/0 |
| CLI token tests | 10/0 |
| Consumer, component-policy and frozen token/registry tests | 5/0 |
| Re-run by me, read-only | contrast + report 9/0; component colors 1/0 |
| Scoped check / lint / fmt | 44 files, 0 findings each; registry lint 49 files, 0 findings; consumer fmt 1 file, 0 findings |
| Root structured check | 4016 files, 34 batches, 0 findings |
| Receipt gates at the checkpoint (8) | check, quality-gate, docs-accuracy, mcp-export-corpus, assets-barrel, agent-docs-prose, publish-assets, fresh-ui-tokens: all PASS with exit code 0, recorded head = actual head |
| Static root tasks | 11 tasks exit 0 (static-gates.json); review-threads PASS per worklog; 13 root check tasks claimed in total |
| Publish size | 142 files, 4,292,450 bytes, under the 5,000,000-byte budget |
| Lock churn | None: no `deno.lock` or `docs/site` diff since baseline |
| Runtime `scaffold.runtime` | **UNPROVEN.** Exit 1 at the Aspire/Docker prerequisites, as the owner allowed. 0 owned survivors, 0 resources mutated. |
| Artifact hygiene | Run directory and axe baseline contain no absolute paths or session identifiers. |

## Remaining limitations (not blocking)

1. **Runtime not exercised.** Runtime behaviour is UNPROVEN in this environment because Docker and Aspire are unavailable.
2. **Remote CI not certified.** Exact-head GitHub checks and the READY post are still pending by design; this verdict does not cover remote CI.
3. **Inherited debt, not newly green.**
   - Package doclint still has 124 diagnostics: 96 private-type-ref, 28 missing JSDoc.
   - The JSR `contracts.json` module tag and the existing cardinality and slow-type findings remain.
   - Other inherited axe color-contrast allowances in the gallery are unchanged, for example subtle success/secondary/primary/warning badges and the swatch `<code>` labels. They are tracked under epic #2412.
4. **Guard scope.** The component-colour guard covers only `registry/components/ui`. The CLI template `design.css.template:760` still uses `--ns-destructive` for an `aria-hidden` ✕ glyph. As an icon it needs only 3:1, and it measures 4.08 (dark) and 3.96 (light).
5. **Style mismatch.** The NS One semantic values written as bare `oklch()` in `tokens.css` have no hex fallback, unlike the primitives. A later generated block supplies the hex values, so this is only an inconsistency.
