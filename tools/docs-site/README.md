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
