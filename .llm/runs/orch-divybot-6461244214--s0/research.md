# Research

Rebased by fast-forward onto current main `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d` before implementation. The initial dispatcher checkout was an older shallow baseline; fetching full history was needed to establish ancestry. The current main lock reproduces the issue’s dependency graph, unlike the initial checkout.

No triage comment or existing covering PR was found on issue #2413. Issue milestone is 0.0.9.

NetScript stdio MCP was queried with `find_guidance`, `search_docs`, and `find_export`. Guidance points to `docs/site/web-layer/fresh-ui.md` and the customize-fresh-ui how-to: use a real local-source scaffold and its dashboard dev task, with copy-source components and thin UI. Do not invent a backend to host the gallery.

The existing token builder pins Style Dictionary 5.4.4 and deliberately formats original token values; verify all three generated artifacts after upgrading, particularly duration output. Existing `tokens:check` rebuilds before diffing, so a hand edit may be silently overwritten; its negative-control behavior must be repaired if reproduced.

The dedicated workflow only checks/lints the package, runs frozen-lock regression, and checks cleanliness. Add tests and token freshness without removing any gate. The classifier currently recognizes the workflow and package; the new harness must explicitly participate in both trigger paths and classification.

Archetypes: existing fresh-ui is Archetype 4 (Keep); new tooling is Archetype 6 with frontend overlay. No new published runtime API is planned. JSR review: scripts/tests are excluded, metadata and six exports remain intact; browser tooling stays outside the published package. No new slow-type risk.
