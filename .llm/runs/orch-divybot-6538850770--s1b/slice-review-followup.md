**TOKEN SLICE APPROVED.** One condition: `token-final-tests.json` is still empty, so the sign-off commit must wait until that full token/build/report/publish run finishes with 0 failures. If it fails, this approval no longer applies and I need to see the changes. This is the slice review only, not final IMPL-EVAL.

## Earlier findings, checked in the updated code

- **F1 (Italic emphasis style) — resolved as recorded debt.** The `.llm/harness/debt/arch-debt.md:3054-3063` entry is marked A1/A2 and has an owner, a target before the next stable release, a gate (split the style/weight names with a migration and keep the Figma round-trip) and a stated cost. The consumer limitation is in `tokens/README.md:246-251`. No Figma value or schema was changed.
- **F2 (tooltip kbd) — resolved.**
  - `tooltip-*-kbd` is now classified as a background (`check-token-contrast.ts:52`). Only `tooltip-*-muted` remains a text foreground (`:44`).
  - The pairs now measure `tooltip-*-fg` on the bg+kbd stack, and the l/d variants are filtered by scheme (`contrast-pairs.json:7903-7934`).
  - NS One maps `tooltip-kbd` to `inverse`, which is a fill (`preset-role-map.ts:112`).
- **F3 (NS One syntax failures) — resolved.**
  - The NS One `code-bg → muted` mapping is removed from `LEGACY_ROLE_MAP`.
  - The report now attributes NS One rows as Figma plus S0 compatibility values (`report-token-contrast.ts:36-38`).
  - Exclusions classify pairs made only of S0 compatibility values as S0, with a reason saying no Figma correction is implied (`:52-68`).
- **F4 (router alias targets) — resolved.** Every Theme set variable must alias `Theme/<same name>` in mode A and `Theme B/<same name>` in mode B, or the import throws (`figma-token-source.ts:64-71`). A negative test covers it (`theme-set.test.ts:132-136`).
- **F5 (orphaned name migrations) — resolved.** The import throws on a migration whose variable no longer exists (`:72-81`), and a negative test covers it (`theme-set.test.ts:137-142`).
- **F6 (test gaps) — resolved.**
  - Inactive collections are now tested in both directions: changing Theme/Studio leaves set-B presets unchanged, and changing Theme B/Bloom leaves set-A presets unchanged (`theme-set.test.ts:89-118`).
  - The app build is now compared against `full.contexts` instead of itself (`output.test.ts:403`).
  - Negative controls now cover the Cupertino, Liquid and Fluent chart surfaces and `studio-chart-*` (`contrast.test.ts:233-250`).
- **F7 (provenance) — resolved.** `scripts/figma-provenance.ts` checks the PR number and the 40-character commit, checks the collection inventory against `index.json`, and checks the SHA-256 of all nine snapshot files before the report runs (`report-token-contrast.ts:21`).
- **Run state — updated.** The worklog has the slice and reconcile notes, `context-pack.md` is current, and `drift.md` records the review follow-ups and the debt decision.

## No new source blockers

- **NS One CSS trimming.** Default NS One CSS now leaves out tokens routed through Theme set unless an emitted alias needs them (`format-css.ts:40-64`, `format-context.ts:161-164`). The dependency walk throws on an unknown dependency.
  - I checked public names that Theme set owns, such as `--ns-radius-checkbox`, `--ns-table-row-gap`, `--ns-font-eyebrow` and `--ns-weight-em`.
  - No component or registry CSS consumes them.
  - They were not declared in the prior default `tokens.css` either; I checked two pre-S1b sibling worktrees. So this is not a regression.
  - The doc comment on `sourceOnly` ("hidden Theme set input") understates it, because public roles such as `radius-checkbox` are also routed through Theme set. That is cosmetic.

## Evidence I read

- `core-final-tests.json`: exit 0, 20 passed, 0 failed (`theme-set`, `contrast` and `resolver` suites).
- The 264-file check and 37-file lint/fmt results match the worklog.
- `token-final-tests.json` and its `.stderr` are both empty, so that run is still pending.

## Carried to final IMPL-EVAL (not slice blockers)

1. The full token run must be green.
2. The four carriers must be regenerated and every `check:*` task must pass.
3. Required checks must be green at the exact head.
4. Add a check that the set of names declared in NS One `tokens.css` is a superset of main's. The current test only compares against the regenerated file.
5. `scaffold.runtime` stays UNPROVEN because the Docker daemon is unavailable.
6. The READY post must cite the head and the report paths `failing-pairs.json` and `failing-pairs.md` (531 failing pairs), with the burn-down left OPEN and the PR using Refs #2450 only.
