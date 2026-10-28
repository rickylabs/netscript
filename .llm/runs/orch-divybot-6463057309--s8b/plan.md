# Plan & Design — READY FOR REVIEW

Deliver #2436's Design system section in one PR from main. Apply SCOPE-docs; this is static documentation generation, with no package/plugin changes or runtime token resolver changes.

1. Bootstrap: record routing, research, design contract and plan; open draft PR.
2. Implement: build a source-driven Lume generator and section-scoped presentation, import the 34 provided WebPs unchanged, link from Fresh UI reference. Render all front-matter groups recursively (including component recipes), every body section, all Studio flavors, raw-source links, source-derived guidelines, section 2 token contract and section 7 authoring with both templates. Add fixture rendering tests including nested values, every section and source-link rewriting; add real corpus coverage. Tests exercise the actual renderer used in Lume. Source missing/invalid groups fail build. Contributing instructions live alongside the generator.
3. Gate and review: wrapper check/test/lint/fmt on new TS; all Pages workflow commands; full CLI E2E once; browser screenshots of landing, Studio and Tonal in both schemes plus mobile/interaction checks. Independent read-only IMPL-EVAL and slice sign-off, repair once if needed. Commit/push evidence and mark ready when proven. Canonical READY report via final-report file handoff.

The data asset import is one indivisible gallery of 34 images, exceeding the profile's target of fewer than 30 files without increasing code scope; all executable changes remain a small cohesive slice. Avoid arbitrary commits splitting image pairs just to hit a target.

## Design

Contract: parsed theme {id, metadata, body}; generated page {url, title, layout, content, order}; source text remains authoritative. Build adapters read canonical files and supply the configured Markdown renderer. Pure rendering is separately testable. All values HTML-escaped; only validated CSS colors become swatches. Relative source links resolve to generated routes or public GitHub sources. Images have dimensions, lazy loading and descriptive alt text. Section navigation connects all pages even before S8 adds its lane. CSS uses --ns-* tokens and no shared overrides.

## Acceptance and gates

- Landing guidelines summary and 17 preset image pairs, source links and Utility default.
- Eleven generated theme pages, Studio's seven flavors, complete YAML tables and Markdown sections.
- Guidelines, create-your-own-theme and token-contract generated from canonical source.
- Existing Fresh UI reference points to the section without duplicating design prose.
- Fixture test detects dropped sections/value groups; corpus guard covers real files.
- Docs build, links, caveats, exports drift, snippets, scoped wrappers and final E2E results recorded honestly.
- Six desktop scheme screenshots and responsive interaction evidence.
- Independent PLAN-EVAL / IMPL-EVAL; no merge/tag/release or labels.

## Deferred scope

S8 owns shared chrome/navigation. S1 owns actual DTCG tokens/resolver. S2/S9 own shipping installed themes/skills. This slice documents current provisional values and planned shipping directly from canonical prose.

## Locked decisions and risk register

No unresolved design decisions. Use the existing shared layout and Markdown helper; adding a plugin to shared config is unnecessary. Build only HTML from checked-in sources; no client fetching, dynamic theme backend or new framework abstraction. No architecture debt accepted.

- Complete body/table preservation: fixture has a distinct sentinel per section and value group; corpus tests enumerate source headings and leaf values, so omission fails.
- Template angle-bracket placeholders: display template source as escaped code, with raw GitHub links; never treat it as live HTML.
- Relative links and base path: resolve canonical-source links before final base_path rewrite; run built-site link checker and browser navigation under /netscript/.
- Source CSS injection: swatches accept only literal hex colors; typography/spacing/component values remain escaped text. No arbitrary front-matter styles execute.
- S8 concurrency: no shared edits; recheck main before final readiness and adopt its layout when present.
- Long theme pages: section TOC, responsive scrollable value tables, lazy-loaded images and no client JavaScript.
- Runtime E2E infrastructure: execute once and preserve exact failures; never claim a gate passed from CI expectations.

## PLAN-EVAL repair (before implementation)

Round 1 returned FAIL_PLAN; adopt these constraints:

- Preserve front-matter comments with an expandable, verbatim YAML source block next to the parsed value tables. This keeps inline provenance/contrast notes visible without inventing a comment parser. Fixture and corpus tests assert the whole escaped YAML block, including leading and inline comments.
- Reuse the configured markdown-it instance through Lume's documented `site.hooks.markdownIt` hook. The section adapter invokes it synchronously with raw HTML disabled, then restores options in `finally` before yielding; configured plugins/slugifier remain intact, and templates are shown as escaped source code. No concurrent async work may occur while renderer options are scoped. Test script markup and angle-bracket placeholders. Canonical HTML comments are metadata and remain non-visible.
- Give generated value headings `values-<group>` ids, never prose names. Page navigation uses its own `design-` namespace. Test unique heading ids on every complete generated page.
- Templates are escaped code examples with raw source links (not parsed as a theme). Theme SKILL.md files are source links only, exactly as the issue requires; no skill execution or separate skill pages.

| Source | Route / rendering |
| --- | --- |
| GUIDELINES.md introductory paragraphs + §1 | /design-system/ summary, intentionally repeated from full guidelines |
| GUIDELINES.md all §1–§8 | /design-system/guidelines/ full document, including planned shipping |
| GUIDELINES.md §2 | /design-system/token-contract/ exact requested projection; context links to §1 and §3 in guidelines make clear they also govern the contract |
| GUIDELINES.md §7 + both _template files | /design-system/create-your-own-theme/; full §7 plus verbatim escaped template source, with links to method/compatibility sections |
| themes/<id>/DESIGN.md | /design-system/themes/<id>/; complete front matter and prose, including every flavor H3 in Studio |
| themes/<id>/SKILL.md | Raw GitHub link on the relevant theme page and gallery card |

Duplication is generated projection only: every source section remains authoritative in the full guidelines and source theme file. No copied specification text lives in the site. Corpus tests account for every GUIDELINES H2 and all theme H2/H3, YAML leaves, comments and unique headings. Raw template source is tested verbatim as escaped code.

Risk register above was added while round 1 was still reading; its omission is now corrected. Raw-HTML disabling is a bounded synchronous adapter operation; the test verifies renderer options restoration. Gallery images are served unchanged with dimensions and lazy loading, not embedded as base64. The landing references live in the retained handoff run directory (not docs/), already inspected on current main.
