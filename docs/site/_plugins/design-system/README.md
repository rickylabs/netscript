# Design system documentation generator

Read this file to extend the section. `design-system/index.page.ts` is Lume's entry point;
`design-system.ts` loads and validates the canonical source, `design-system-render.ts` renders its
pages, and `design-system-markdown.ts` scopes safe HTML rendering to the existing configured
Markdown engine. Shared layouts, global data and styles remain independent of this section.

Edit `docs/design-system/GUIDELINES.md` and `docs/design-system/themes/<id>/DESIGN.md` rather than
copying their prose into the site. The complete guidelines document and its section 2 / section 7
projections update in the next build. Each theme's YAML supplies the value tables; its verbatim YAML
preserves comments and its body supplies the prose. Studio's Flavors headings supply the seven
preview names. Theme and template SKILL.md files are available through source links; template source
is also displayed verbatim in the authoring page.

To add a language, create its canonical DESIGN.md/SKILL.md pair and catalogue entry in the guidelines,
add `<id>--light.webp` and `<id>--dark.webp` under `assets/design-system/`, and record their intrinsic
width/height in that directory's `dimensions.json`. Studio uses `studio-<flavor>--<scheme>.webp`.
The build fails on missing pairs or dimensions. Gallery cards use 480px WebP thumbnails generated at build time from those originals, including the expandable comparisons; full specimens remain linked. Thumbnails are emitted into the build output only and are never committed. Images are checked-in source assets, never fetched
by the browser from the handoff branch. New YAML value groups and nested leaves render automatically.

Public HTML uses the existing `layouts/base.vto` and section-local
`_components/design/styles.css`, emitted once as `assets/design-system/section.css` and linked by every section page, whose UI colors and typography consume the site's `--ns-*` roles.
Swatch fills are validated literal hex samples of specification data. Generated tables sit under “Theme values” and use distinct “Values: Colors”, “Values: Typography”, etc. headings. Value heading IDs use the
`values-` namespace; generated section anchors use `design-`; prose anchors use the site's configured
slugifier. A synchronous render scopes `html: false` and restores it in `finally`, so no asynchronous
work belongs inside that adapter. Source metadata comments stay invisible.

From the repository root, run the structured test wrapper:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --cwd docs/site -- --frozen --allow-read _plugins/design-system/renderer-fixture.ts
```

Root CI discovers `design-system_test.ts`, a bridge that runs the same fixture with the standalone
site config (the root import map does not include Lume). Both commands use the reviewed site lock;
lockless resolution can reject a newly qualified exact dependency under Deno's age policy.
The fixture uses independent fixed H2 lists: all thirteen template sections for themes and sections 1–8 for guidelines. It asserts every required section, each value group, nested values, YAML comments, source links and safe markup. `THEME_SECTIONS` and `GUIDELINE_SECTIONS` are the production contracts; a changed template must match the explicit theme contract. Missing, duplicate or misordered sections stop the build. Fenced examples cannot satisfy a required heading. Guideline cross-links derive from the configured Markdown engine’s rendered IDs and must exist in the full rendered guidelines. Its negative controls deliberately remove a prose heading, a value group and a nested
row, proving that these omissions fail. The real-corpus test verifies all eleven themes, every
guidelines H2, 17 presets, both templates and unique complete-page anchors. Update explicit corpus
counts when intentionally adding a language or flavor.

From `docs/site`, `deno task verify` runs the normal build, links and caveat checks. The Pages workflow
also runs root `deno task docs:exports-drift` and `deno task docs:snippets` before building.

Regression tests delete Colors from a theme, delete section 5 from guidelines, and rename the referenced compatibility heading; each must fail validation. Additional controls reject every missing template H2, duplicates, reordered headings and fenced substitutes, and verify linked CSS, thumbnail URLs and distinct TOC labels. When intentionally revising the canonical heading contract, update both production constants and the independent fixture lists.
