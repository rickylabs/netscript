# Fresh UI browser evidence

This harness runs the real scaffold gallery through Chromium at 390 and 1280 CSS pixels in light
and dark mode, including the Studio Utility token preview (12 cases). Each route must return HTTP 200, show its heading, stamp language/scheme/density/flavor, hydrate the scheme island, and let
keyboard users reach and activate its theme toggle using Tab, Enter and Space. It captures a
full-page PNG and attaches the complete axe report. Serious/critical findings must match the exact
reviewed S0 baseline; this is not a claim that today’s gallery is axe-clean. CI uploads screenshots, traces on failure,
HTML/JSON reports, and a durable command receipt.

The existing `packages/fresh` browser lane continues to test runtime behavior through
`@playwright/cli`. This separate Playwright Test runner owns the design matrix and axe integration.
It does not need a database, service or Aspire host.

From the repository root, generate a local-source app:

```sh
deno run -A --frozen packages/cli/bin/netscript-dev.ts init fresh-ui-browser \
  --path .llm/tmp/s0/scaffold --app-name dashboard --db none \
  --no-aspire --no-git --editor none --ci --yes
deno run -A --frozen packages/cli/bin/netscript-dev.ts ui:add theme-previews \
  --project-root .llm/tmp/s0/scaffold/fresh-ui-browser/apps/dashboard
```

Then run from this directory:

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

Playwright starts and stops the app's dev task. The design routes are intentionally excluded from
production builds, so use development mode. A startup failure or missing browser fails the run.
The test runner never reuses an unrelated server.

## Point it at another app

| Environment variable | Meaning |
| --- | --- |
| `FRESH_UI_APP_DIR` | App directory, relative to this directory or absolute; must have a `dev` task |
| `FRESH_UI_BASE_URL` | Already running app; disables server startup and shutdown |
| `FRESH_UI_ROUTES` | Comma-separated app-relative paths; defaults to `/design/tokens,/design/components,/design/tokens?preset=studio-utility` |
| `FRESH_UI_PORT` | Port for an owned local dev server; change it if the default is busy |
| `FRESH_UI_OUTPUT_DIR` | Capture/report directory; defaults to ignored `test-results/` |
| `FRESH_UI_AXE_STRICT` | Set to `1` to require zero serious/critical axe findings |

For example, set `FRESH_UI_APP_DIR` to a different generated app, or export `FRESH_UI_BASE_URL` and
`FRESH_UI_ROUTES` to inspect routes in an app that is already running. Routes must expose the same
accessible theme control for the keyboard contract. Change `settings.ts` to extend the viewport or
theme matrix; change `tests/design.spec.ts` to add another interaction contract. Dependencies,
including the axe adapter's Playwright peer, are pinned in package-lock.json.

## Before screenshots

S0 captures screenshots as review evidence; it does not fail on pixel differences. A future pixel
comparison gate must generate its expected images inside the same pinned CI image as its tests.
Local Linux captures and CI captures have separate provenance and may differ in font rendering.

To save a new, dated baseline after a successful run:

```sh
npm run baseline
# Or choose an explicit new destination:
npm run baseline -- baselines/my-reviewed-before
```

The command runs the full matrix, requires every case to pass and all screenshots to exist, and
copies only those PNGs plus a manifest containing the source commit and browser/environment
versions. It refuses to overwrite an existing baseline. Normal `npm test` only writes ignored
results; it never rewrites the committed before images. Review every PNG change in a PR.

## Evidence and negative controls

The `fresh-ui-browser` CI job is selected by the existing `freshUi` classifier flag. Harness changes,
Fresh runtime changes, gallery app templates and their embedded assets all schedule it. Existing
package type-check, lint, lock regression and clean-worktree gates remain in place; package tests
and read-only token freshness are also required. Freshness runs before token generation can repair
an edit.

The token test in `packages/fresh-ui/tests/token-build.test.ts` verifies that hand edits and missing
artifacts fail without being repaired, and that a frozen build recreates all three artifacts.
`FRESH_UI_AXE_NEGATIVE_CONTROL` accepts `new-rule` (unnamed button), `new-target` (low-contrast text
under an already-known rule), `duplicate` (an extra copy of a scanned blocking node), and `stale`
(one fewer scanned blocking node). These deliberately make the same validator fail; use a
comma-separated list to exercise them in one server lifecycle. Never set it for normal captures.
`accessibility.contract.ts` also proves the multiset contract with deterministic fixtures.

## Existing accessibility findings

`axe-baseline.json` records exact rule/impact/target counts for each route, theme and width. Every
rule still runs against the whole page; no subtree or rule is disabled. New targets under known
rules, extra copies, and new rules all fail. Missing or decreased counts also fail until the
allowance is lowered in a reviewed commit, so a resolved issue cannot silently return. Routes not
in this baseline have zero allowances. The engine version is checked at runtime, and the baseline
records source commit and Chromium provenance. Full plain `axe.json` reports, including minor and
moderate findings, are included in CI artifacts.

The existing serious `color-contrast` findings affect token specimens, badges, destructive
controls, form errors and navigation labels. They belong to the **tokens v2** slice of #2412. The
existing critical `aria-required-children` and serious `listitem` findings occur in the components
gallery’s **DesktopTrayMenu**; they belong to the epic’s component accessibility slice. The exact
case/target inventory is the baseline, not a rule-wide exemption.

When a later slice fixes these findings, generate a candidate from a complete normal run (which
may fail solely because the old allowance is now stale):

```sh
npm run baseline:axe -- test-results/results.json candidate-axe-baseline.json
```

The command requires a new output path and complete matrix, rejects negative-control results, and
writes a candidate marked pending review. Review all changed rule/target/count entries, update
provenance and debt notes, then replace `axe-baseline.json` in the same reviewed change. Normal
tests never update it. Use CI’s downloaded report and case directories when Linux font/rendering
inputs differ; the recorder supports relocated artifact paths.

Upstream references: [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing)
and [screenshots](https://playwright.dev/docs/screenshots).

The S1 matrix changes data-scheme through the keyboard while retaining data-theme
as the language. NS One remains the default. Utility has zero serious/critical
allowances; its authored token failures stay in the separate exact token contrast
report. Specimen captions use readable neutral surfaces without changing swatch
values. Original S0 screenshots remain untouched.

## Variant migration parity

`render-variant-cases.mjs` renders 187 cases from a supplied Fresh UI source root, including every
migrated modifier family, native disabled/error/checked combinations, both toggle islands and the
app shell, selection toolbar and command palette. `variant-parity.ts` compares baseline and migrated HTML with their actual registry CSS
and identical Studio Utility token bytes. It measures computed styles in rest, hover, focus and
pressed states, at 390/1280 in light/dark, and also requires identical full-page PNG bytes. It
records input hashes, the browser version, comparison counts, differences and screenshot hashes in `parity.json`.
The runner closes its browser on success and failure.

For a replay, extract the chosen baseline with `git archive` into project run evidence, render it
and the current package to separate JSON files, then run:

```sh
node tools/fresh-ui-browser/variant-parity.ts \
  <baseline-fresh-ui-root> packages/fresh-ui \
  <before.json> <after.json> <utility-token-output.css> <artifact-directory>
```

Both captures must use the package's same JSX precompile options. For an archive outside the
workspace, place an isolated Deno config beside the archive, copy `compilerOptions` from
`packages/fresh-ui/deno.json`, and use `variant-parity.imports.json` for its imports. Resolve those
imports to the already-installed versions from the workspace lock; cached-only replay can use
`--no-lock --cached-only` without changing a repository lock. Merely selecting a workspace member's
config does not apply its compiler options to an external archive. Classic JSX and precompile
serialize numeric inline line-height differently, so comparing them produces false differences.

Supply the Studio Utility CSS returned by `buildTokens({ preset: 'studio-utility' })` to both
captures. The renderer never changes token values, baseline sources, snapshots or a repository
lockfile. The S3 run record contains the measured result; screenshots are project artifacts.

Resolve the package self-import `@netscript/fresh-ui/interactive` to the corresponding source root
for each capture, and copy the workspace catalog when the isolated config needs it. A baseline
capture must use its own headless runtime, never the migrated runtime.

For the app-copy migrator itself, `render-migrated-css.ts` builds a CSS-only fixture from the same
baseline using the actual CLI transformer. Run it with `deno run -A --no-config --no-lock
--cached-only --node-modules-dir=manual` (the browser tool directory owns a separate npm config),
then supply that fixture as the after-root to `variant-parity.ts` with migrated HTML. This checks
the CLI's selector mapping independently of the authored component CSS. Preserve both parity
reports and their input hashes.
