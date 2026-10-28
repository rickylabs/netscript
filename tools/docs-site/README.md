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
collection manifest. Each alias resolves using the target collection's active mode: Studio,
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
To see the real gate go red, run either control below (expected exit: non-zero):

```sh
DOCS_UI_NEGATIVE_CONTROL=raw-colour npm test -- --config docs.playwright.config.ts --project light-1280 --grep 'style policy: authored'
DOCS_UI_NEGATIVE_CONTROL=red-role npm test -- --config docs.playwright.config.ts --project light-1280 --grep 'style policy: authored'
```

Pages CI preserves the existing docs gates, adds this browser gate, and uploads screenshots,
axe/keyboard reports, traces and a durable command receipt even on failure. A real Design system
page from the parallel section is required; there is no placeholder or link exemption.
