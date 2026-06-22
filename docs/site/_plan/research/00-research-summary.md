# NetScript Documentation Research Summary (Track B)

An authoritative index of the deep-search research artifacts compiled under `docs/site/_plan/research/`, highlighting the ten highest-leverage findings the documentation architecture plan must act on, and identifying gaps left for the content rebuilding.

---

## 1. Index of Research Artifacts

The following research documents have been authored incrementally under `docs/site/_plan/research/` to govern the NetScript content-architecture rebuild:

1. **[00-research-summary.md](./00-research-summary.md)** (This File)
   * The central inventory, executive findings, and continuation gaps configuration.
2. **[netscript-feature-landscape.md](./netscript-feature-landscape.md)**
   * Exhaustive architectural inventory of NetScript’s core `@netscript/*` namespaces (service, contracts, sdk, kv, queue, cron, telemetry) and first-party plugins (workers, sagas, triggers, streams).
3. **[competitors/](./competitors/)**
   * High-fidelity documentation architecture teardowns for 10 key competitors and framework ecosystems:
     * **[Astro](./competitors/astro.md):** The gold standard of Diátaxis, warm developer tone, and Pagefind.
     * **[Laravel](./competitors/laravel.md):** Task-centric, ecosystem pivots, Sail container quickstarts.
     * **[TanStack](./competitors/tanstack.md):** Dynamic query options, complete API parameters, framework code syncs.
     * **[Medusa](./competitors/medusa.md):** Beautiful flow-diagram-to-code animations for workflows.
     * **[Lume](./competitors/lume.md):** Fast Deno-native plugins and Vento templating filters.
     * **[NestJS](./competitors/nestjs.md):** Highly structured module references and lifecycle charts.
     * **[Encore](./competitors/encore.md):** Code-as-infrastructure maps and local runtime dashboards.
     * **[tRPC](./competitors/trpc.md):** Side-by-side client-server autocomplete editor panels.
     * **[Temporal](./competitors/temporal.md):** High consistency theory, replay loops, and non-determinism checkers.
     * **[Hono](./competitors/hono.md):** Zero-fat code recipes, edge-native onboarding syntax, route performance benchmarks.
4. **[doc-architecture-patterns.md](./doc-architecture-patterns.md)**
   * Cross-cutting synthesis mapping Front-Doors, Progressive disclosure patterns, Capability Hubs, Code-sample strategies, and Spark UI components directly to the NetScript Docs.
5. **[lume-vento-plugins.md](./lume-vento-plugins.md)**
   * Concrete leverage map of available Lume plugins (`nav`, `toc`, `shiki`, `search`, `sitemap`) and advanced Vento template integrations (`{{ include }}`, function blocks, macros, custom filters) to implement high-quality site patterns.
6. **[market-fit.md](./market-fit.md)**
   * Strategic positioning maps analyzing the unified backend gap, Confident Outcome-led Hero headlines, Alpha maturity analogies (e.g. React Native), .NET Aspire differentiators, the custom-flag opt-out (`--no-aspire`), and the developer's adoption narrative.

---

## 2. Ten Highest-Leverage Findings for the Plan

The rebuild plan **MUST** act on these ten strategic findings:

### 1. Structure the Sidebar with Capability Hubs Naming (Plain English)
Do not use esoteric internal terminology or package names in the navigation hierarchy. Use accessible, plain English titles on marketing and sidebar roots: **"Background jobs"**, **"Durable workflows"**, **"Event triggers"**, and **"Streams"**. Introduce doctrine and API names (workers, Sagas, triggers, streams) inline within the files.

### 2. Implement a Dynamic Sidebar Using `lume/plugins/nav.ts`
Do not manually maintain massive navigation objects in the main site configuration. Enable the Lume `nav` plugin to build a nested hierarchy automatically from the folder structure and front matter. Let Lume compile references, guides, and tutorials dynamically.

### 3. Establish a Sticky On-Page Table of Contents Using `lume/plugins/toc.ts`
Every API reference page and deep how-to guide must have a right-hand "On This Page" scrolling drawer. Use the `toc` plugin to auto-extract heading hierarchies (`h2` to `h4`) and inject custom anchor IDs without manual link construction.

### 4. Upgrade Syntax Highlighting to Shiki (`lume/plugins/shiki.ts`)
Swap the basic Prism-based `codeHighlight` out for Shiki. Shiki parses actual TypeScript type tokens using standard VS Code-grade textmate themes, showing developers exact highlights matching their local editors (e.g., Zed or VS Code), elevating the DX of code blocks immensely.

### 5. Foreground .NET Aspire as a Core USP with Explicit `--no-aspire` Highlights
Position NetScript’s tailored Aspire compilation as an elite enterprise differentiator that sets it apart from simple JS engines. At the same time, offer an explicit, highly visible opt-out page showing the `--no-aspire` flag so standard Deno/TS purists feel comfortable adopting the framework.

### 6. Frame the Maturity Confidently as "Alpha" (The React-Native Posture)
Be extremely transparent about NetScript's maturity: **"Alpha — API subject to change."** Never claim "Production-Ready" or "GA/Stable." Align the tone with early React Native: highly confident in capability and widely usable in practice, targeting a solid, feedback-driven Beta path by the end of 2026.

### 7. Build an Outcome-Led Hero and Sub-Headline on the Front-Door
Align the homepage hero directly with locked decisions:
* **Headline:** "From `netscript init` to a running, type-checked, OpenTelemetry-traced backend — services, durable workflows, and a design-system UI in one workspace."
* **Sub-headline:** "A Deno-native backend framework where the contract *is* the product: type-safe services and durable workflows, observable by default, orchestrated with Aspire."

### 8. Stop the "Hand-Assembling" Backend Puzzle (The Gap Pitch)
Anchor the core "Why NetScript" page with the universal problem: full-stack developers spend days hand-assembling routing, queues, schedulers, schema sync, database migrations, and OTEL spans from disconnected libraries. Pitch NetScript as the unified, contract-first metastructure that bridges this gap natively in Deno.

### 9. Use Vento Template Includes for Reusable "Spark" UI Components
Implement custom Vento includes (`_includes/templates/`) to build:
* Code tabbables (e.g. toggling database examples between Postgres, Deno KV, and SQLite).
* Shell package commands (toggling CLI commands between Bash, WSL, and Windows PowerShell).
* Elegant color-coded Callout panels (using a consistent layout for tip/warning alert borders).

### 10. Show Side-by-Side Zero-Codegen Autocomplete Proofs
Words cannot describe the power of zero-codegen contract safety. Use animated GIFs or side-by-side code blocks: showing contract changes in `contracts/v1` on the left immediately updating autocomplete type properties on a `useQuery` React hook or island component on the right.

---

## 3. Continuation Gaps for Future Phases

While this deep research establishes a complete architectural plan for the content-architecture rebuild, these gaps will be fully resolved when dynamic authoring is later authorized:

1. **Auto-Generated TypeDoc Engine:** Generating dynamic parameter-level API reference tables for the individual `@netscript/*` namespaces natively during Lume compilation.
2. **Visual Flowchart Diagrams Asset Compilation:** Creating SVG/vector files mapping Saga compensation lifecycles and background parallel queues directly to match Medusa-grade visual clarity.
3. **Multi-Framework Front-End Integrations:** Expanding the client query-SDK tutorials to explicitly detail Svelte, Solid, and Vanilla HTML/JS environments beyond the initial Fresh 2 and React focus.
