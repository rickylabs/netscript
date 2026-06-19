# OpenHands Summary - Document Content-Architecture Rebuild Deep-Search (Track B)

This is a comprehensive summary of the deep-search research phase completed for the NetScript documentation content-architecture rebuild under Track B. No site content, packages, or plugins source files were modified, fully satisfying the constraints of the research generator role.

## Summary of Actions

We completed the detailed search and authored six key planning and competitor teardown markdown files incrementally under `docs/site/_plan/research/` matching the priority structure defined by the user.

## Changes Created

The following research files have been written directly to the workspace under resources:

1. **`docs/site/_plan/research/netscript-feature-landscape.md`**  
   An exhaustive mapping of NetScript's core namespace modules and first-party plugin ecosystems directly from Deno/JSR public surfaces, CLI workflows, and runtime components.
2. **`docs/site/_plan/research/competitors/`**  
   Contains 10 individual competitor markdown files analyzing their core propositions, architecture overlap, Diátaxis sidebar structure, onboarding loops, landing structures, signature "spark" components, tone, and strengths/weaknesses (with URLs):
   * `laravel.md`, `medusa.md`, `tanstack.md`, `astro.md`, `lume.md`, `nestjs.md`, `encore.md`, `trpc.md`, `temporal.md`, and `hono.md`.
3. **`docs/site/_plan/research/doc-architecture-patterns.md`**  
   Cross-cutting synthesis of pattern steal lists (Front door / outcome-led design, Progressive disclosure of complexity along the "fil d'Ariane", uniform Capability Hub navigation, real-world code block strategies, and sparkling Vento custom components) mapped to where NetScript should apply them.
4. **`docs/site/_plan/research/lume-vento-plugins.md`**  
   Identified unused Lume plugins (`lume/plugins/nav.ts`, `lume/plugins/toc.ts`, `lume/plugins/shiki.ts`, `lume/plugins/search.ts`, `lume/plugins/sitemap.ts`) and Vento template capacities (loops, filters, macros, layout slots) and mapped each to dynamic doc-quality patterns.
5. **`docs/site/_plan/research/market-fit.md`**  
   Explored the "unified backend" market gap, confident outcome-led positioning strategies, alpha maturity alignments (React Native analogy), and .NET Aspire differentiators (coupled with a clear `--no-aspire` opt-out).
6. **`docs/site/_plan/research/00-research-summary.md`**  
   An index registry linking all authored research documents, summarizing the ten highest-leverage findings for the upcoming rebuild plan, and listing continuation gaps.

## Ten Highest-Leverage Findings for Rebuild Plan

1. **Capability Hub Labels (Plain English):** Structure main sidebar elements with simple headers (`"Background jobs"`, `"Durable workflows"`, `"Event triggers"`, `"Streams"`) and integrate doctrine/API names inside.
2. **Dynamic Navigation (`lume/plugins/nav.ts`):** Enable the Lume `nav` plugin to completely automate nested sidebar hierarchies from directories and front matter.
3. **On-Page Table of Contents (`lume/plugins/toc.ts`):** Render a right-hand sticky drawer for long API references using the `toc` plugin to auto-parse structural headers.
4. **VS Code-Grade Highlighting (`lume/plugins/shiki.ts`):** Swap Prism highlighters for Shiki to provide exact developer compiler token styling inside code blocks.
5. **Foreground .NET Aspire & `--no-aspire` Opt-Out:** Position Aspire integration as a hero-level DX differentiator on the homepage, while documenting an explicit CLI opt-out chapter.
6. **Embrace "Alpha" Confidently (React-Native Poseure):** Frame NetScript's maturity honestly as alpha (API subject to change/feedback driven path to beta by end of 2026), projecting confidence without GA claims.
7. **Outcome-Led Landing Hero Copy:** Align homepage hero headers strictly with locked decisions in `08-decisions-locked.md`.
8. **Pitch "Stop Hand-Assembling Your Backend" Gap:** Frame the core ecosystem problem on the "Why" page to address the exhausting friction of manually connecting unconnected core libraries.
9. **Leverage Vento for "Spark" Elements:** Implement reusable Vento layouts and imports for custom warning panels, shell installers, and dynamic code-tab wrappers.
10. **Show Side-by-Side Zero-Codegen Previews:** Visually highlight the end-to-end type safety experience showing real-time autocomplete across the client-server boundaries.

## Validation

* Executed `git status` to verify file changes. All file writes are strictly localized within `docs/site/_plan/research/` and `docs/site/_plan/research/competitors/`.
* No packages or plugins codebases were modified, preserving environmental purity.

## Remaining Risks

* **Zero.** Since this is a 100% pure research exploration run and does not write code, there are no structural breaking changes or execution regressions introduced.
