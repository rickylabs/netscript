# Plan & Design — READY FOR REVIEW

One feature-tier leaf. Application/docs surface with SCOPE-docs and SCOPE-frontend; no package/plugin changes, no JSR audit required. Follow supplied leaf profile only.

## Locked decisions

- Keep Lume/Vento and server-rendered HTML; enhancements use native dialog, details, anchors, buttons and Pagefind's existing client API. No UI backend, framework migration or new runtime dependencies.
- Generate docs-local `--ns-*` CSS from checked-in Figma collections, selecting Studio, Utility, Neutral, Ink, Compact and Light/Dark; resolve aliases with cycle/missing-target checks and verify freshness without writing. Recheck S1 availability before final delivery and consume its compatible output if merged.
- Root context uses `data-theme=studio`, `data-flavor=utility`, `data-gray=neutral`, `data-accent=ink`, `data-density=compact`, `data-scheme=light|dark`. Migrate saved old scheme selection safely.
- Desktop topbar with six lanes; active-lane sidebar only; home without sidebar; article prose max 544px / wide blocks 720px, TOC rail; reference sticky section navigation. On small screens navigation becomes a modal drawer, TOC a sticky disclosure.
- Preserve every current component call signature. Add optional filename/eyebrow/ownership fields and signature components. API object rows become two-column name+type/description; generic tables remain generic. Native lists replace noninteractive tree ARIA.
- Monochrome links, syntax, markers and selection; red only logo and explicit errors. Authored diagrams use the two inks and themed embedded rendering.
- Search is a native modal dialog fed by lazy Pagefind JS; safe DOM text construction, lane filters, grouped results and subheadings, cancellation/stale response protection, keyboard navigation, focus restoration, honest loading/empty/error states and a static Pagefind fallback.

## Slices and gates

1. Tokens/fonts: `docs/site/styles/tokens.css`, token generator in `tools/docs-site/`, base font/root context; prove deterministic aliases, generated freshness and existing docs build.
2. Shell/layout: `_includes/layouts/base.vto`, `_includes/nav/menu-item.vto`, `_data.ts`, shell CSS and browser JS. Prove build/link checks and representative responsive renders.
3. Components/prose: all 16 owned `_components/*.vto`, added signature components, prose/component CSS, top-level index, themed diagram assets. Prove build/rendered output and browser routes with real components.
4. Search/mobile: browser enhancement modules and search markup/CSS. Prove Pagefind results, filters, keyboard dialog/drawer/TOC/tabs, storage-denied fallback and no-JS panels.
5. Checks/evidence: `tools/docs-site/**`, `tools/fresh-ui-browser/docs.playwright.config.ts`, `tools/fresh-ui-browser/tests/docs.spec.ts`, `.github/workflows/pages.yml`. Preserve all existing gates, add generated-token/raw-colour/red-policy negative controls, strict axe, screenshots and CI artifact upload. Run structured TS wrappers and docs verify; exports drift/snippets; required full CLI E2E once at readiness.

Each slice updates worklog/context and is committed/pushed with its gate evidence. Obtain separate Claude substantive review before sign-off; final mandatory IMPL-EVAL after gates.

## Risks and mitigations

- Another worker owns design-system content: never edit its directories or component names; test shell on those routes once available, otherwise test a generated acceptance fixture using public components.
- Pagefind base path: derive all module/result paths from built URLs; browser smoke under `/netscript/`.
- No-JS/storage failures: content visible by default; catch storage errors; preserve functional native links and static search.
- Dark contrast: inspect screenshots and run axe without exclusions at both widths and schemes.
- Raw authored SVGs: theme the presentation without changing source meaning; include assets in policy coverage.
- Environment gates may be unavailable: record exact command/failure as unproven, never weaken a check.

## Open decisions

No blocking open decisions. S1 integration safe to defer until final upstream check. Reference content remains unchanged; select representative route and fixture from existing public component contracts.

## Deferred scope

S8b theme/gallery content, framework components/tokens v2 implementation, logo redesign, backend services and deployment/merge are outside this leaf. No accepted architecture debt planned.

## Contributor path

`tools/docs-site/README.md` documents token regeneration, component styling, browser evidence and policy checks.
