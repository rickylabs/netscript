# 2026-10-21 — Scaffold chrome on every page (#2406 items 1 + 4, PR #2407)

- **Outcome:** `routes/_layout.tsx` is opt-out (`chromelessRoutePrefixes`, default `/design`). The
  nav data lives in the app-owned `navigation.ts`. `ui:add page` links top-level pages
  (`--nav [label]` / `--no-nav`), starts them from `ns-shell` + `PageHeader`, and prints `Next:`
  lines. `ui:remove page` unlinks them. `styles.css` keeps its app tail across `ui:add`. The
  `netscript-build` skill is current. IMPL-EVAL PASS (Muse Spark 1.3, round 1).
- **Shared issue split:** #2406 was dispatched twice (harness #751 / #752). The two sessions split it
  by file over cross-session messages and agreed that the second PR to merge adds the cross-references.
  That avoided any overlap in edits.
- **What only a real scaffold showed:** the Fresh page-binding pass injects a duplicate
  `.withRoute(routes.<key>.$route)` into every page (#2409). That made `ui:remove page` unusable
  after any dev run. Unit tests on an in-memory FS could not see it.
- **What `ui:add` silently destroyed:** `writeStylesAggregator` dropped everything below the
  app-custom marker. Any theme recipe built on `styles.css` was unsafe until that was fixed.
- **Generated code must be fmt-canonical:** assert it with `DenoGeneratedSourceFormatter` over
  short and long names. A 49-char page name exposed a latent overflow in `.withLayer(...)`.
- **Run details:** `.llm/runs/orch-divybot-751--2406-scaffold-chrome/`.
