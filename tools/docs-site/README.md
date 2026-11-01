# Docs site Utility styling

The site is a static Lume/Vento application. Its shared shell lives in
`docs/site/_includes/layouts/base.vto`, component contracts in `_components/`, CSS in
`styles/`, and progressive enhancements in `assets/docs/`. Preserve existing component arguments
when extending the UI.

Regenerate the semantic token layer from the Figma source snapshot:

```sh
deno run --allow-read --allow-write tools/docs-site/generate-tokens.ts
deno run --allow-read tools/docs-site/generate-tokens.ts --check
```

The snapshot is a byte-for-byte copy of the 2026-10-28 export from Figma file
`pGRLnkPPRZJZy74evNcQBr`, originally supplied in the design handoff. `index.json` is its
collection manifest. Scheme, Studio flavor and Base accent aliases resolve through Theme set **A**, selecting Theme; Theme B remains available in the export. Each alias resolves using the target collection's active mode: Studio,
Utility, Neutral, Ink, Compact, and Light or Dark. Values belong in this generated layer;
component styles consume named `--ns-*` roles. Keep those names compatible with tokens v2.

The docs build preserves its existing source-format and rendered-output checks. Run
`deno task --cwd docs/site verify` for build, links and caveats. Browser evidence uses the
pinned dependencies in `tools/fresh-ui-browser`; the docs suite is separate from the scaffold
gallery and has no accessibility baseline exemptions.

The generator also emits the standalone SVG favicon. Its embedded semantic declarations are a
second serialization of the same generated token layer; the path fills consume those named roles.
Freshness checks verify both outputs. Renderer-owned diagram inputs stay byte-identical; the build
inlines a semantic-paint presentation and retains a hidden lazy source image for Markdown twins.

Run the full browser matrix after building the docs:

```sh
cd tools/fresh-ui-browser
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test -- --config docs.playwright.config.ts
```

The docs config uses a separate test directory; the scaffold gallery's suite and baseline remain
unchanged. Five page types run in both schemes at 390 and 1280 pixels. Every capture attaches a PNG,
full axe JSON and public source/browser provenance. Serious and critical findings have no allowances.
The suite also exercises keyboard lanes/drawer/TOC/tabs/search, Pagefind states and fallback,
clipboard/runtime persistence, no-JavaScript and denied-storage paths, diagram twins/names/IDs,
and the file-tree compatibility call.

`style-policy.ts` checks authored UI CSS/templates/scripts and rendered inline diagrams with the
browser's CSS grammar. Renderer-owned SVG inputs and sibling-owned design content are not UI style
sources; their inline presentation is checked. Generated CSS and favicon declarations are the token
layer, and read-only freshness covers both. Other properties must consume semantic roles. The red
check follows aliases in both schemes and permits only logo and explicit error contexts.

Normal tests prove rejection of hex, named/function colours, custom aliases and misplaced red.
To see the real gate go red, run one of these controls (expected exit: non-zero):

```sh
DOCS_UI_NEGATIVE_CONTROL=raw-colour npm test -- --config docs.playwright.config.ts --project light-1280 --grep 'style policy: authored'
DOCS_UI_NEGATIVE_CONTROL=red-role npm test -- --config docs.playwright.config.ts --project light-1280 --grep 'style policy: authored'
DOCS_UI_NEGATIVE_CONTROL=red-token npm test -- --config docs.playwright.config.ts --project light-1280 --grep 'style policy: authored'
```

The `red-token` control adds a red primary token and an unapproved exemption entry. The policy must still report red outside an error state.

Pages CI preserves the existing docs gates, adds this browser gate, and uploads screenshots,
axe/keyboard reports, traces and a durable command receipt even on failure. A real Design system
page from the parallel section is required; there is no placeholder or link exemption.

The generated layer also preserves the original spacing/type role names consumed by existing docs
components, resolving them through Utility density and typography roles. The browser policy checks
undefined shared roles in every shipped stylesheet, including generated third-party CSS. All maintained
UI styles, including the sibling section stylesheet, receive the raw-colour and red-context checks too. Design system
acceptance asserts visible navigation gaps so missing layout roles cannot pass on axe alone.


S8c semantic content uses the owner export at `b9dd32aac`: `code/bg`, seven `code/syntax/*`
roles and the violet `important/*` triplet. Code consumes those syntax roles directly; API badges consume generated `--ns-studio-api-kind-*-text` adapters selecting exported step 11/12 for AA on canvas and surface.
The pre-S8c declaration fixture proves every old role remains byte-identical in both schemes,
except the explicitly approved `--ns-input-border` change to Utility gray 9. The contrast test
computes unrounded WCAG ratios on code and table backgrounds. The browser suite verifies actual
computed token paint, syntax spans, IMPORTANT and zero serious/critical axe findings.

To add a language, register its existing-version highlight.js grammar in `docs/site/_config.ts`,
add its import-map entry and human label in `code-languages.ts`, then extend the Design system → Docs kit code
gallery. Unknown rendered fences fail the build. Internal pages declare `internal: true`,
which excludes them from Pagefind, Markdown twins and the AI documentation indexes. Header metadata
uses `data-twin-ignore` and headers/gutters use `data-pagefind-ignore`; code itself remains indexed.


CSS is bundled by Lume lightningcss before publication, avoiding the chained @import waterfall.
The style gate accepts bundled token definitions only when their selector, property and value
exactly match the separately verified token layer; authored custom colours still fail.

`deno run --allow-read --allow-run --allow-env tools/docs-site/check-reproducible.ts` builds twice
and compares every output. The default is strict. `--allow-pagefind-metadata` reports only the
known upstream Pagefind entry/filter/meta serialization variation separately; HTML, Markdown twins,
anchor fragments and all other assets remain byte-identical. Search behavior is verified by the
real browser Pagefind tests. The metadata issue remains #2453; token-source consolidation stays #2450.

The public callout and code galleries live under `docs/site/design-system/docs-kit/`, linked from the Design system navigation and indexed in that search lane. API badge mappings follow the Utility spec in `docs/design-system/themes/studio/DESIGN.md`; `api-kinds_test.ts` fixes that contract independently of the browser paint checks.

Callouts have one sentence-case type label (Note, Tip, Important, Warning, Caution) or an explicit custom title replacing it. The label uses Host Grotesk Medium at the callout body size; its tone also paints the icon. A line-height-sized icon box aligns with the first line, and the body shares the label's left edge. The accessible name retains the type and custom title. Markdown twins preserve a typed alert marker, label and body exactly once, including the legacy Error alias. Extend the default/custom gallery and its geometry/twin assertions together.


`callout-types.ts` owns the type, label, tone, icon shape and twin marker. Omitted types default to Note; explicit unknown types fail the build. Danger is destructive and canonicalizes to `[!CAUTION]`; Error remains destructive with a distinct circle-X. Only Caution and Danger share an icon. The authored-corpus and browser tests enforce this alongside the geometry assertions.

Commit `docs/site/deno.lock` when native Lume imports change: it pins the lightningcss plugin and WASM dependency used by `_config.ts`. Root `deno.lock` remains subject to the root no-churn rule. A build from clean git must leave status clean. The style policy recognizes the verified exported orange-12 badge role as orange, without exempting authored paint or red role overrides.
