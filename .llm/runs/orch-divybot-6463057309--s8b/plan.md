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
