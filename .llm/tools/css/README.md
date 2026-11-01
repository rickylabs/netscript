# Component CSS validation

The package's `tests/publish-size.test.ts` owns the component CSS limits: **220000 raw bytes and
28000 gzip bytes**, measured by Deno 2.9.7 CompressionStream in sorted registry path order. These
fixed limits do not increase with file count. The planned #2561 gzip raise gives about 1.5 KB above
#2558's measured 26527 bytes. A later raise must link its issue, report before/after raw and gzip
costs, and carry parity evidence for a mechanical rewrite or reviewed visual evidence for an
intentional design change. Do not quietly raise a limit to make CI pass. Authored and shipped CSS
inventories/bytes must agree first.

The source inventory excludes `registry/theme/` after paths are normalized relative to the package,
so a checkout directory named `theme` cannot change the measured payload. The location regression
executes the actual budget test inside ordinary and theme-named checkouts. It also proves
stale/unshipped CSS and excessive raw/gzip sizes still fail.

## Run the reusable proof

Install the existing pinned browser harness, then run from the repository root:

```sh
npm ci --ignore-scripts --prefix tools/fresh-ui-browser
npm exec --prefix tools/fresh-ui-browser -- playwright install --with-deps chromium
deno task css:test
deno task css:parity --output .llm/tmp/css-parity
```

No historical checkout, uncommitted fixture regeneration, backend or Aspire is needed. The command
checks parsed rule order, selectors, declarations and media conditions, then reuses
`tools/fresh-ui-browser/variant-parity.ts` for the original 265 specimens at 390/1280 pixels,
light/dark, rest/hover/focus/pressed and pseudo-elements. It reproduces 2388000 computed-style
comparisons and compares before/after PNG bytes on the same browser. It writes `parity.json`,
`rules.json`, detailed Utility reports and eight PNGs to the requested output directory.
Chromium-only coverage is explicit; screenshot hashes may differ between browser/platform versions
while the before/after equality contract holds.

Override inputs with `--baseline file.json.gz` and `--candidate package-root`. The default baseline
is `fixtures/utility-2558.json.gz`; its adjacent manifest pins compressed and uncompressed SHA256,
provenance and inventory. The 88 KB archive contains all 52 original component/island/layout
stylesheets, base and Utility tokens, and 265 rendered HTML specimens used in #2558. Its source SHA
and exact original input hashes are in the manifest. The original run's comparator and evidence
remain retained, not deleted.

A rule difference or a visual difference exits nonzero. So do a missing/changed inventory, corrupt
fixture, unsafe fixture path, empty proof or unsupported nesting. The comparator supports one
compound parent with leading `&` descendants; parent lists and other nesting forms fail closed
because naïve substitution can hide specificity differences. Real Chromium regressions test
color/selector/media drift, rule removal/order, quoted whitespace and unsupported nesting. The
`.browser.mjs` suffix keeps browser-only tests out of Deno's default repo suite; `css:test`
explicitly runs them after the Deno location tests.

## Maintain the baseline

Keep this historical fixture immutable for mechanical CSS rewrites. For intentional component or
token changes, refresh the fixture only in a reviewed PR that includes the new real rendered
specimens, all matching source CSS/token bytes, provenance, manifest hashes, and positive/negative
proofs. New CSS files must extend the fixture inventory; they cannot silently disappear from
comparison. Review changed rules and visual output before accepting the new snapshot.

The Fresh UI browser workflow runs both commands through durable gate receipts and uploads the
reports/screenshots even on failure. Changes to this directory, including compressed input fixtures,
select that lane. Reports and temporary extraction directories are never committed.
