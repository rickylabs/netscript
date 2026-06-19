# Competitor Documentation Research & Architecture Dossier

**Track B: Content-Architecture Rebuild Research**
**Run ID:** `docs-content-architecture--impl`
**Phase:** Research

---

## Executive Summary
This dossier forms the deep-search research foundation for the NetScript documentation rebuild (PR #59). Guided by the research requirements, it provides:
1. An exhaustive, citation-backed **Documentation Architecture Teardown** of Medusa, TanStack, Laravel, Astro, and Lume.
2. A comprehensive **Value/Features & Market Fit** strategic analysis against NestJS, Encore, tRPC-stacks, Temporal, and Hono.
3. A technical mapping of **Lume + Vento + Plugin Leverage** to identify achievable milestones with existing and newly recommended components/plugins.
4. An actionable **Output Contract** synthesizing these learnings into a recommended deep, multi-level IA outline, a page-type catalog, and a prioritized design system gap list.

---

## Section A: Documentation-Architecture Teardown of Reference Sites

To build an industry-leading content architecture for NetScript, we must disassemble and analyze the live, state-of-the-art developer documentation portals. Below is an exhaustive teardown of five pivotal reference sites, focusing on Information Architecture (IA), Page Types, Large Feature Decomposition, Components, Wayfinding, Depth Signals, and NetScript-applicable takeaways.

---

### 1. Medusa (https://docs.medusajs.com/)
Medusa documents a highly modular node/TS commerce framework, balancing structural architecture with modular expansion and business workflows.

#### A. Full IA & Sidebar Tree
*   **Top-Level Global Nav**: Framework (Core Dev Guides), Commerce Modules (Specific APIs), User Guide (Merchant Admin UI), References (REST API, JS/TS SDK, CLI).
*   **Tree Architecture**:
    *   **Framework Section**:
        *   *Fundamentals*: Architecture (Overview, Modules, Workflows), Development Resources.
        *   *Main Concepts*: Data Model, Customization, Dependency Injection.
        *   *Business Logic*: Workflows (Introduction, Steps, Compensation), Events & Subscribers.
    *   **Commerce Modules Section** (Flat list of 16 core engines, e.g., Product):
        *   *Product Module*:
            *   Overview (Introduction, Architecture Map, Quickstart)
            *   Data Models (Entities overview, diagram of schema relationships)
            *   Main Service (Detailed API of `IProductModuleService`)
            *   Guides & Recipes (Customizing Product Module, defining associations)
    *   **References Sections**:
        *   REST API (Admin, Storefront endpoints)
        *   JS/TS SDK (Client initiation, usage)
        *   Medusa CLI (Command-by-command reference)
        *   UI Library (Component-level React UI system)

#### B. Distinct Page Types & Section Order
1.  **Conceptual / Architectural Overview**:
    *   *Section Order*: Page Title + Subhead -> Rich Architectural Diagram (SVG/Mermaid) -> High-level explanation (Why) -> Core Pillars (3-4 cards explaining modular boundaries) -> Step-by-Step "How it works" process -> Key Invariants/Rules table -> "Next Steps" navigation block.
2.  **Commerce Module Landing Page**:
    *   *Section Order*: Module Title + Description -> Architecture Schema (Visual representation of tables and links) -> Quickstart installation command (`npm run medusa db:migrate`) -> Code snippet showing standard module initialization -> "Main Service Reference" button/link -> Categorized list of task-oriented guides (Card grid format).
3.  **Step-by-Step Recipe / Workflow Guide**:
    *   *Section Order*: Guide H1 + Objective -> Prerequisites list (installed plugins, correct schema) -> "What you will build" paragraph -> Sequenced Steps (H2 with clear numbers e.g. "Step 1: Define the Step", "Step 2: Define the Workflow") -> Full code blocks with highlighted rows -> "How to execute" callout -> "How to handle failure (Compensation step)" -> Next reading cards.
4.  **Auto-Generated Service / SDK Reference**:
    *   *Section Order*: Signature heading (`interface IProductModuleService`) -> Method list sidebar -> Individual Method Details (Description, Input interfaces table with types and required flag, Output/Response interface JSON sample, Complete code snippet showcasing query options/linking).

#### C. Large Feature Decomposition & Cross-Linking
*   *Example Feature*: **Setting Custom Promotional Pricing per Region on a Cart Checkout**.
*   *Decomposition across pages*: This flows through **Cart Module** (initializing cart), **Pricing Module** (defining context-based prices), and **Promotion Module** (generating campaign discounts). These distinct systems are bound together via **Workflows** (a dedicated framework paradigm).
*   *Cross-linking strategy*: Each module guide features a persistent "Related Modules" warning/info block on its sidebar. Inside the cart steps, whenever a calculation is executed, the docs link to `/references/pricing/` and `/framework/workflows/create-workflow/`. Code blocks explicitly show imports from multiple modules (e.g. `@medusajs/pricing-service` and `@medusajs/cart-service`), validating the decoupling.

#### D. Visual / Interactive Components & Code-Sample Patterns
*   **Components**: Interactive entity-relationship diagrams (ERD) with collapsible tables, tabbed setup code blocks (NPM vs Yarn vs PNPM), visual warning/info banners (grey/light orange), Copy Code button, on-scroll highlighted right-hand-side panel (On This Page), global Search Modal (Algolia powered), "Was this helpful?" quick-feedback widget (thumbs-up/down) with feedback input field on click.
*   **Code-Sample Patterns**: Type-safe TypeScript. File paths are annotated on the very first line of code blocks as double-slash comments (e.g., `// src/workflows/my-workflow.ts`). Extensive usage of builder-style chains is documented with inline comments pointing to database states.

#### E. Wayfinding & Versioning
*   **Wayfinding**: Sidebar depth spans 3 sub-levels max, with auto-fold/unfold animations for sibling nodes. Top breadcrumbs show global category path. Standard Prev/Next buttons at the bottom of the article.
*   **Versioning**: Clean version toggle (`v1` vs `v2`) at the leftmost section of the top-bar that preserves current page context when resolving the counterpart in the target version, failing back to index if that specific page was introduced only in `v2`.

#### F. Depth Signals & Production-Grade Qualities
*   **Entity-Relationship Visuals**: Every module starts with their underlying schema representation.
*   **Production Checklists**: Comprehensive "Production Deployment" guide covering DB optimization, Redis clustering, and SSL configurations.
*   **Performance Metrics / Benchmarks**: Documented throughput performance of workflows and database queries.

#### G. WHAT TO STEAL FOR NETSCRIPT
*   **"Componentized Workflow Recipes"**: Create unified multi-module guides showing how NetScript's oRPC contracts, PostgREST/Prisma database connections, and Workers/Sagas are choreographed inside a single folder.
*   **Module Schema Visualizations**: Direct maps detailing the database layout for Sagas or Cron engines.
*   **Imports with File Paths**: Always prefix code block snippets with `// <app_root>/apps/dashboard/services/payment.ts` to solidify file-system layout context.

---

### 2. TanStack Router & Query (https://tanstack.com/router/latest/docs)
TanStack has established the gold standard for multi-library, multi-framework client-side utility documentation, known for visual adapters and exhaustive TypeScript types.

#### A. Full IA & Sidebar Tree
*   **Top-Level Global Nav**: Select Libraries (Query, Router, Table, Form), Select Adapter (React, Vue, Solid, Svelte), Guide, API Reference, Examples, Blog, GitHub.
*   **Tree Architecture**:
    *   **Getting Started**: Overview, Installation, Quick Start (Framework specific), Bundler plugins.
    *   **Guide (Functional chapters)**:
        *   Routing Concepts (Routes, Route Matching, Nested Routes).
        *   Data Loading (Loaders, Preloading, Cache Control).
        *   Search Params (Validation, Serialization, Typed Search Params).
        *   Code Splitting & Performance.
    *   **API Reference**:
        *   High-level exports (`createRoute`, `createRouter`, `RouterProvider`).
        *   Hook/Component level docs (`useLoaderData`, `Link`, `Outlet`).
    *   **Examples Gallery**: Full-page interactive stackblitz instances indexed by scope (Basic, File-routing, Authentication, Search-Params).

#### B. Distinct Page Types & Section Order
1.  **Framework Adapter Landing Page**:
    *   *Section Order*: Target Framework Hero (e.g. TanStack Router x React) -> Multi-step terminal installation -> Scaffording a basic router (Complete TS snippet with comments) -> "Run the app" CLI block -> "What's Next" links.
2.  **API Class / Function Reference Page**:
    *   *Section Order*: Function/Class Name + Version Addition Badge -> Full TypeScript Type Signature block (showing generics, types) -> Option Fields detailed parameter list (Subheadings per option with its types and defaults) -> Return Value description and properties -> Code Usage Example -> Common Caveats callout.
3.  **Examples Directory Hub**:
    *   *Section Order*: Grid of interactive sandbox links -> Brief summary per example -> "Open in Stackblitz / CodeSandbox" CTAs -> Embedded iframe playground showing the live app.

#### C. Large Feature Decomposition & Cross-Linking
*   *Example Feature*: **Search Parameter Validation & Typing**.
*   *Decomposition*: Broken into: (1) Theory of URL-based state, (2) Validation schemas via Zod, (3) Merging default params, (4) In-app route linking (`<Link search={{ ... }}>`).
*   *Cross-linking strategy*: The core Search Params guide links directly to the `createRoute` API options list. When writing code snippets in the "Loaders" section, the loaders are shown receiving typed search params, cross-linking back to the "Search Params validation" page.

#### D. Visual / Interactive Components & Code-Sample Patterns
*   **Components**: Framework Adapter Tabs (toggle react/solid/vue/svelte to rewrite the entire text context and code samples), Github-edit buttons, floating quick-index table of contents, customizable theme toggle, real-time code highlighting, search overlays.
*   **Code-Sample Patterns**: Highly advanced TypeScript types. Code samples are littered with inline TS assertions, complex generic types, and `.d.ts` schema comments.

#### E. Wayfinding & Versioning
*   **Wayfinding**: Ultra-compact sidebar with minimal padding allowing ~40 items to sit on screen simultaneously. Active elements are highlighted with solid left borders. Breadcrumbs are omitted to optimize space; on-page navigation is strictly anchored on the right-hand TOC.
*   **Versioning**: The topmost dropdown permits version selector paths (`latest`, `v1`).

#### F. Depth Signals & Production-Grade Qualities
*   **TypeScript Diagnostics**: Custom typing/linting error guides ("If TS throws error 2322...").
*   **Edge-case Recipes**: Dedicated guides for SSR, Streaming, ISR, and multi-tenancy pathing.

#### G. WHAT TO STEAL FOR NETSCRIPT
*   **Interactive Code Tabs**: Use tabs to switch between Deno run commands and traditional Node adapters or swap database layers.
*   **TypeScript Signature Focus**: For each NetScript core interface (`SagaContext`, `ServiceContext`), display the exact types, fields, and default values clearly before showing sample usage.

---

### 3. Laravel (https://laravel.com/docs)
Laravel is widely considered the undisputed king of backend framework documentation, managing massive feature depth with clean, readable prose and chronological sequencing.

#### A. Full IA & Sidebar Tree
*   **Global Layout**: Sidebar-driven navigation with a highly polished search experience.
*   **Tree Architecture**:
    *   **Prologue**: Release Notes, Upgrade Guide, Contribution Guide, API Documentation.
    *   **Getting Started**: Installation, Configuration, Directory Structure, Deployment.
    *   **Architecture Concepts**: Request Lifecycle, Service Container, Service Providers, Facades.
    *   **The Basics**: Routing, Middleware, CSRF Protection, Controllers, Requests, Responses, Views, Blade Templates, URL Generation, Session, Validation, Error Handling, Logging.
    *   **Digging Deeper**: Artisan CLI, Cache, Collections, Events, File Storage, Helpers, Mail, Notifications, Queues, Task Scheduling, Processes, Verification.
    *   **Security**: Authentication, Authorization, Email Verification, Encryption, Hashing, Password Reset.
    *   **Database**: Getting Started, Query Builder, Pagination, Migrations, Seeding, Redis.
    *   **Eloquent ORM**: Getting Started, Relationships, Collections, Mutators, Serialization, Factories.
    *   **Testing**: Getting Started, HTTP Tests, Console Tests, Database Tests, Mocking.
    *   **Packages / Ecosystem**: Official libraries (Breeze, Jetstream, Sanctum, Scout, Pulse, Horizon).

#### B. Distinct Page Types & Section Order
1.  **Conceptual / Abstract Guide**:
    *   *Section Order*: H1 + Concept abstract -> Flow chart or step-by-step Request Lifecycle blueprint (numbers 1-10) -> Core Architecture breakdowns -> Deep-dive on underlying classes -> "When to use" vs "Alternative patterns".
2.  **Breadth Feature Guide (e.g., Queues)**:
    *   *Section Order*: H1 + Description -> Installation/Prerequisites -> Configuration parameters -> Creating Jobs CLI commands -> "Writing the Job" (Code template) -> "Dispatching Jobs" (Different contexts: delayed, synchronous, chain of jobs, batching) -> Running the Queue Worker (Daemon configurations) -> "Failed Job Handling" (Retries, dead letter queues, alerting) -> Event triggers.

#### C. Large Feature Decomposition & Cross-Linking
*   *Example Feature*: **Laravel Queues**.
*   *Decomposition*: Laravel resists scattering. It keeps almost the entire Queue ecosystem on *one massive page* (~30 screens high).
*   *Cross-linking strategy*: Internal cross-links use anchor targets (`#dispatching-jobs`). If another system interacts with queues (e.g. Mailers or Notifications), they reference the main Queue page using direct links: `You may configure this to run on your [configured queues](/docs/11.x/queues#delayed-dispatching)`.

#### D. Visual / Interactive Components & Code-Sample Patterns
*   **Components**: Minimalist aesthetic. Large, highly readable typography. Sticky right-side table of contents highlighting the current scrolled H2. Global search with real-time excerpt snippets. Code copy button. Simple blockquotes with a left warning color bar.
*   **Code-Sample Patterns**: Idiomatic PHP with fluent interface builders. Highlights are rare; instead, small, highly descriptive method calls are chained.

#### E. Wayfinding & Versioning
*   **Wayfinding**: Breadcrumbs are absent, utilizing the huge right-side H2/H3 TOC instead. Left sidebar remains fully expanded per major section.
*   **Versioning**: Prominent version selector on top-right. Switching versions translates the path exactly or falls back neatly.

#### F. Depth Signals & Production-Grade Qualities
*   **Production Deployment Guides**: Each major feature includes specific deployment gotchas (e.g., Supervisor configurations for Queue Workers, Redis cache eviction policies).
*   **Security Out-of-the-Box**: Exhaustive CSRF, XSS, and SQL injection explanations are integrated directly into standard onboarding pages.

#### G. WHAT TO STEAL FOR NETSCRIPT
*   **Sequential IA Folders**: Mirror Laravel's categorization progression: `Getting Started` -> `Architecture Concepts` -> `Core Capabilities` -> `Advanced/Digging Deeper`.
*   **Complete Single-Page Deep Dives**: Keep individual engines (like Cron, Sagas, or Streams) highly consolidated in singular, exhaustive files with deep on-page TOC anchors, rather than segmenting them across 10 minor files (satisfying D-DOCT-5 cardinality guidelines).

---

### 4. Astro (https://docs.astro.build/)
Astro excels in developer delight, featuring an optimized Diátaxis structure, exhaustive UI components, interactive checklists, and a community integration directory.

#### A. Full IA & Sidebar Tree
*   **Tree structure categorized by Diátaxis Framework roles (Tutorial, How-To, Reference, Explanation)**:
    *   **Welcome**: Why Astro, Installation, Editor Setup, Upgrade Guide.
    *   **Tutorial**: Build your first Blog (extremely comprehensive step-by-step game).
    *   **Core Concepts**: Basics (Project Structure, Components, Pages, Layouts).
    *   **Guides**: Routing, Markdown & MDX, Images, Scripting, Server-Side Rendering, Server Islands.
    *   **Recipes**: Add Tailwind CSS, Build Custom Fonts, Deploy to Vercel/Netlify.
    *   **Reference**: Configuration (`astro.config.mjs`), CLI Reference, API Reference, Markdown Parser.
    *   **Integrations**: Astro Integration Index (React, Tailwind, MDX).

#### B. Distinct Page Types & Section Order
1.  **Diátaxis Tutorial Step**:
    *   *Section Order*: Step Number/Title + Completion Badge -> High-level goal -> "Before you begin" state check -> Step actions (numbered with file path indicators above codes and exact lines to add) -> "Verify your progress" validation step -> Interactive checklist checklist box -> "Next Step" button.
2.  **Astro integration / Recipe Page**:
    *   *Section Order*: Subhead specifying target engine (e.g., Tailwind) -> Automated execution command (`npx astro add tailwind`) -> "Manual Installation" guide (for advanced scenarios) -> Configuration setup -> Usage snippets inside Astro files -> Troubleshooting list -> "See also" cards.

#### C. Large Feature Decomposition & Cross-Linking
*   *Example Feature*: **Server-Side Rendering (SSR)**.
*   *Decomposition*: Divided into "Enabling SSR" (configuration and adapters), "Rendering dynamic parameters", "Streaming responses", and "Deploying SSR apps".
*   *Cross-linking strategy*: Adapter setup pages link to Astro's custom integration directory. Page rendering guides link back to "Pages & Routing" concepts.

#### D. Visual / Interactive Components & Code-Sample Patterns
*   **Components**: Highly visual styled elements: custom tabs, beautiful interactive File Trees (drawn with CSS), colorful Callout cards (Tip, Caution, Danger with customized icons), Progress bars for tutorials, inline Badges (e.g. `New`, `SSR Only`), dark/light mode switches, multi-select search directories.
*   **Code-Sample Patterns**: File-system paths on top tabs of code blocks. Code blocks use visual highlighting to mark exact added/deleted lines.

#### E. Wayfinding & Versioning
*   **Wayfinding**: Beautiful left sidebar with custom SVG icons adjacent to sections. Dynamic right-side TOC highlighting current text block. Prev/Next navigation cards with custom text summaries of the target links.
*   **Versioning**: Dropdown selector leading to target branch translations.

#### F. Depth Signals & Production-Grade Qualities
*   **Editor Integration**: Setup guides specifically for VSCode, Neovim, and WebStorm, with recommended plugin configurations.
*   **Community Showcase & Integrations**: Community-contributed themes, plugins, and production sites directly indexed.

#### G. WHAT TO STEAL FOR NETSCRIPT
*   **File-Tree Visualizer**: An interactive or crisp CSS-based directory structure component to show the scaffold layout of a NetScript oRPC/Fresh project.
*   **Visual Badges for APIs**: Tag code reference blocks with indicators such as `Deno Native`, `Prisma Engine`, or `OTel Wired`.
*   **Line-Level Code Diffing**: Visual code blocks highlighting lines of code added when adopting NetScript features.

---

### 5. Lume (https://lume.land/)
Lume is Deno's native static-site builder. Knowing Lume's own documentation is critical since NetScript's site is built on Lume.

#### A. Full IA & Sidebar Tree
*   **Tree structure**:
    *   **Getting Started**: Introduction, Installation, Configuration, Page structures, Layouts, Assets, Formats.
    *   **How-to / Write Pages**: Markdown, Vento, Liquid, Nunjucks, JSX.
    *   **Features / Plugins**: Exhaustive list of official plugins (CSS, Images, Pagefind, Basepath, Code Highlighting).
    *   **Advanced**: Custom plugins, custom loaders, Site lifecycle events.
    *   **API Reference**: Auto-generated Deno API reference.

#### B. Distinct Page Types & Section Order
1.  **Plugin Setup Page**:
    *   *Section Order*: Plugin Title + Category -> Overview & Purpose -> Import command -> `_config.ts` configuration hook template -> Features enabled on page (how to invoke) -> Full config option API table -> "Examples in the wild".

#### C. Large Feature Decomposition & Cross-Linking
*   Lume maintains short, highly independent pages. Features (e.g. handling markdown vs processing pages) split into separate files and cross-linked inside recipes.

#### D. Visual / Interactive Components & Code-Sample Patterns
*   **Components**: Clean syntax highlighting, light/dark mode, page-specific copy button, Pagefind Search Bar at the bottom/top, direct links to plugin source code on GitHub.
*   **Code-Sample Patterns**: Clean TypeScript/Deno `import` statements demonstrating modern module paths.

#### F. WHAT TO STEAL FOR NETSCRIPT
*   **Native Pagefind UI integration**: Use Lume's native `pagefind` configuration for static, performant offline user search indexes.
*   **Deno-optimized Markdown & Vento mappings**: Implement direct template setups taking advantage of Lume's compilation pipeline.

---

## Section B: Value, Features, and Market Fit

NetScript is a modern, Deno-native, contracts-first backend framework engineered to eliminate the "integration tax" of assembling isolated systems. Below is a comparative strategic market positioning of NetScript against major competitor patterns, the developer adoption psychology, and our documentation led market-fit strategy.

---

### 1. Headline Positioning vs. Competitors

To establish NetScript's design credibility, our documentation must articulate a precise, differentiated headline value compared to established technologies:

| Competitor / Stack | Headline Value | What Developers Evaluate Before Adopting | Adoption-Driving Doc Patterns to Replicate |
|---|---|---|---|
| **NestJS** *(Node/TS enterprise)* | Robust OOP-driven backend structure; robust class decorator-based modular architecture. | Boilerplate inflation, cold-start latency, strict class model rigidity, decorator magic, complex injection hierarchies. | • Step-by-step recipes for deep integrations (Kafka, Redis, WebSockets).<br>• Clear modular file structures. |
| **Encore** *(Go/TS cloud engine)* | Out-of-the-box infrastructure provisioning with compiler-analyzed microservice tracing and queues. | Vendor-locked compile boundaries, lack of runtime escape hatches, new TS support maturity, infrastructure lock-in. | • Architectural diagrams illustrating flow state.<br>• Heavy emphasis on the total removal of configuration files. |
| **tRPC Stacks** *(E2E type safety)* | End-to-end client-server type safety in unified TS monorepos without any compile-time schema generation. | Monorepo isolation limit (incompatible with external clients in Go/Swift/Python), lack of design guidelines for database/queues. | • Visual side-by-side examples illustrating a server modification instantly updating client bindings.<br>• Simplistic initialization code snippets. |
| **Temporal** *(Durable workflows)* | Fully deterministic durable execution framework ensuring arbitrary workflow survivability over scale. | Mandatory hosting overhead (Temporal clusters, Cassandra, Postgres queues), complex non-TS standard runtime limits, high conceptual overhead. | • Visual logic flow charts showing crash survivability.<br>• Detailed breakdowns of the Workflow state machines vs. SDK patterns. |
| **Hono** *(Ultralight edge router)* | Ultra-fast, edge-optimized standardized router running anywhere (Deno, Cloudflare Workers, Node). | Minimalist features (developers must integrate and maintain own DB layers, queues, workers, schema validation, and logging). | • Inline raw performance benchmarks and cold-start comparison grids.<br>• "Deploy to Edge in 10s" tutorials. |

---

### 2. The NetScript "Market-Fit Angle"

NetScript's documentation should lead with a unified positioning anchor: **The Elimination of the Integration Tax.**

Rather than forcing developers to spend the first 3 weeks choosing, configuration-mapping, and wire-routing databases (Prisma), queues (PG-boss/Deno KV), contracts (tRPC/oRPC), traces (OpenTelemetry), and telemetry dashboards—only to struggle with hosting environments—**NetScript natively integrates them in a stable, unified host on a Deno runtime, unified via local .NET Aspire orchestration.**

This targets a highly specific developer persona: **The Skeptical Senior TS Architect.**
This developer does not want marketing fluff or hand-waving "rapid velocity" promises. They want:
1.  **Deno-Native modern defaults**: Native ESM, no tsconfig/build pipelines, fast startups, secure by default.
2.  **Explicit Contracts-First structure (oRPC)**: Client-server models bound automatically without schema-generation passes.
3.  **Local orchestration parity (Aspire)**: Zero-friction local development replicating production dependencies, with a fully portable fallback (`--no-aspire`).

---

### 3. Feature-Coverage Checklist (Credibility Anchors)

To win adopting teams, the NetScript documents must explicitly showcase the following features using verifiable, real code proofs:

- [ ] **Contract-to-Client Binding (oRPC)**: Demonstrate a side-by-side contract-oriented service definition and instant client call. This establishes that the "schema is the documentation".
- [ ] **Transactional Sagas with Compensation Logic**: Display a clean `defineSaga` builder showcasing how failing downstream calls (e.g., flightbooking failure) automatically fire compensations (e.g., refund payment) without hosting massive External Orchestrator engines.
- [ ] **OTel Propagation Proof**: Show how a service call automatically propagates a `traceparent` context down through a Worker thread and into low-level Prisma database logs.
- [ ] **The "Esepcially-No-Aspire" Portability Escape Hatch**: Explicitly document that while .NET Aspire simplifies local telemetry and service discovery, the application is fundamentally portable and can run on bare metal or containers without Aspire using raw `deno task` targets.
- [ ] **Copy-Source UI Ownership**: Prove that the Fresh-UI scaffolding operates via copy-source, ejecting code directly into their repository so the developer owns every pixel and logic flow.

---

## Section C: Lume + Vento + Plugin Leverage

NetScript structures its external documentation portal on Lume v2.5 accompanied by the Vento template engine. Since `base.vto` layout templates and core CSS stylesheet styles are centrally controlled, our strategy emphasizes leveraging existing components and recommending target components/plugins to match the benchmark.

---

### 1. Architectural Alignment with Existing Components

Today's NetScript Lume stack features several high-quality components. Here is how they map directly to our retrieved competitor patterns to maximize reuse:

-   **`comp.hero`**: Mirrors Medusa and TanStack landing patterns. Used on `/info` index entries to establish our contracts-first proposition above the fold.
-   **`comp.featureGrid`**: Maps to Astro's feature highlights. Used to break down NetScript's 6 foundational pillars cleanly on the `/` page.
-   **`comp.tabbedCode`**: Serves as our primary tool to showcase multi-environment commands (e.g., `Deno Run` vs `npm build`) or side-by-side contract vs client calls.
-   **`comp.apiTable`**: Perfect for representing complex API properties of primary interfaces (`SagaContext`, `ServiceContext`). Matches TanStack's options tables.
-   **`comp.callout`**: Replicates Astro's warning/tip cards. It features an HTML-safe inner container and is optimized for highlighting architectural invariants or alpha timeline constraints.
-   **`comp.learningPath`**: Adapts Astro's tutorial progressions. Renders visual boxes guiding the reader through consecutive learning routes.
-   **`comp.breadcrumb` & `comp.nextPrev`**: Leverages Lume auto-generators to build standard wayfinding paths dynamically.

---

### 2. High-Priority Component & Plugin Additions (Recommendations)

To close the Gap with market-leading portals, the following new Lume/Vento elements and plugins should be introduced into the central repository template stack:

1.  **File-Tree Visualizer (`comp.fileTree`)**:
    *   *Need*: Showcase scaffold structures of NestScript projects without relying on fragile monospaced text.
    *   *Implementation*: A Vento component converting nested JSON structures into an HTML list with distinct CSS classes and SVGs mimicking files/folders.
2.  **On-This-Page TOC Generator (Plugin)**:
    *   *Need*: Laravel/Astro dynamic scroll-tracking on-page navigators.
    *   *Implementation*: A Lume build post-processor plugin or client-dev script that crawls output HTML headings (`h2`, `h3`), formats them into a sticky right-side list, and uses IntersectionObserver to highlight headings during scroll.
3.  **Code-Block Copy Button (JS Script)**:
    *   *Need*: Standard quick-copy of terminal directives and framework code.
    *   *Implementation*: Vanilla JS injected into raw page footers. It iterates over `<pre>` nodes, wrapping them in containers with absolute-positioned hover copy-buttons.
4.  **Synchronized Runtime/DB Selector Tabs (`comp.tabbedRuntime`)**:
    *   *Need*: TanStack-style global code selectors.
    *   *Implementation*: An extension of `tabbedCode` that syncs selection state via `localStorage` (changing tab "Deno KV" in one block automatically redirects all subsequent blocks on the page).
5.  **Multi-Column Cards Grid (`comp.cardsGrid`)**:
    *   *Need*: Medusa-style task-oriented grid layouts.
    *   *Implementation*: A simple layout box rendering flexible container grid paths ensuring children cards reside in neat columns.
6.  **Visual API Badges (`comp.badge`)**:
    *   *Need*: Astro-style tag identifiers (`oRPC`, `Deno-Native`, `Prisma-Backed`).
    *   *Implementation*: High-contrast inline pills featuring localized themes matching site tokens.

---

## End-of-Dossier Synthesis

The final output synthesizes competitor teardowns, market analysis, and stack capabilities into an actionable blueprint for NetScript's architecture rebuild.

---

### 1. Recommended Deep Multi-Level Information Architecture (IA)

We recommend a structural layout based on the Diátaxis framework, supplemented by explicit high-value focus portals:

```
netscript.dev/
├── (Start Here / The Approachable Ladder)
│   ├── /                          # Home/Hero: 6 USP cards, oRPC code proofs
│   ├── /quickstart/               # 5-Min Walkthrough: Scaffold, run, check /design endpoints
│   └── /why/                      # The Integration Tax, NestJS vs Hono comparison tables, "Not to adopt"
├── Learn / Tutorials (Diátaxis: Learning-oriented)
│   ├── /tutorials/index.md        # Map of progression paths
│   └── /tutorials/checkout/       # Multi-step project: "Build an E-commerce Cart Checkout with Sagas"
│       ├── 01-scaffold.md         # Inits Deno and boots local .NET Aspire environment
│       ├── 02-contracts.md        # Defines oRPC contracts and types
│       ├── 03-sagas.md            # Writes transactional sagas with compensation
│       ├── 04-telemetry.md        # Wire traces and test via Fresh UI
│       └── 05-deploy.md           # Deploying the setup to production
├── How-To Guides (Diátaxis: Problem-oriented recipes)
│   ├── /how-to/index.md           # Index of structured recipes
│   ├── /how-to/services/          # oRPC Services (Auth, multi-routes)
│   ├── /how-to/data/              # Database & Adapters (Prisma, Postgres config)
│   ├── /how-to/scheduling/        # Background Jobs (Crons, manual queue workers)
│   ├── /how-to/ui/                # Fresh UI Integration (Ejecting assets, customizing CSS)
│   └── /how-to/deployment/        # Portability (Deploying with Docker, bare-metal '--no-aspire')
├── Explanation (Diátaxis: Understanding-oriented theory)
│   ├── /explanation/index.md      # Glossary & Mental Models
│   ├── /explanation/orpc.md       # Under the hood: Client-server contract validation loop
│   ├── /explanation/sagas.md      # Deterministic state-management & crash boundaries
│   ├── /explanation/aspire.md     # Local orchestration vs. Production environment mappings
│   └── /explanation/plugins.md    # The thread-isolated background execution pool
└── Core API Reference (Diátaxis: Information-oriented facts)
    ├── /reference/index.md        # Complete index of the 22 packages
    └── /reference/<package>/      # Auto-generated from 'deno doc'
        ├── functions.md
        ├── classes.md
        └── types.md
```

---

### 2. Page-Type Catalog

To enforce structural consistency across contributors, every page in NetScript dev documentation must align with its specific catalog type:

#### A. Multi-Pillar Hub / Front-Door Page
*   *Audience*: Skimmers, Decision Makers, Skeptical Architects.
*   *Tone*: Warm, direct, technically precise (no fluff).
*   *Layout Structure*:
    1.  **Direct Value Title**: Verify the exact problem solved in 2 lines.
    2.  **Interactive Code Tabs**: Side-by-side Contract vs Client execution.
    3.  **Comprehensive Card Grid**: Visual representation of the 6 pillars.
    4.  **Target Personas Breakdown**: Split developer onboarding paths cleanly.
    5.  **Exhaustive Comparison Matrices**: Unified table honest about weaknesses.

#### B. Sequential Tutorial Step
*   *Audience*: Devs in training, students.
*   *Tone*: Encouraging, structured, sequential.
*   *Layout Structure*:
    1.  **Progress Indicator / Breadcrumb**: Visual indicator of total steps.
    2.  **Objective Section**: "In this step, you will buy..."
    3.  **Prerequisites State Check**: Code state validator command.
    4.  **File-Path Named Code Blocks**: Every block starts with exact target file paths.
    5.  **Manual Check Checkbox**: User-interactive step validation.

#### C. Task-Oriented "How-To" Recipe
*   *Audience*: Working developers solving instant challenges.
*   *Tone*: Direct, concise, practical.
*   *Layout Structure*:
    1.  **Scope Statement**: One sentence explaining what is cooked.
    2.  **Prerequisites Table**: Inputs or active setups needed.
    3.  **Code templates**: Clear highlights of added framework lines.
    4.  **In-Production Pitfalls**: Warning boxes highlighting footguns (ports, locks, timeouts).

#### D. Theoretical "Explanation" Page
*   *Audience*: Senior engineers evaluating internals.
*   *Tone*: Discursive, architectural, analytical.
*   *Layout Structure*:
    1.  **Mental Model / Analogy**: Broad outline of the topic.
    2.  **ASCII Architecture flow-charts**: Layer-by-layer sequence mapping.
    3.  **State Transition Tables**: Inputs vs Output states.
    4.  **Design Trade-offs**: Discussion on why this design was chosen and the alternatives considered.

---

### 3. Prioritized Component & Design-System Gap List

The following elements must be engineered to reach production-grade, enterprise documentation standard (ordered by critical need):

#### Priority 0: Mission-Critical Wayfinding & Usability
-   [ ] **On-Page Scrolling TOC Plugin**: Generates right-hand floating list tracking scrolling headers automatically so skimmers navigate massive pages.
-   [ ] **In-Header Search box (Pagefind Integration)**: Offline index processing, optimizing search result rendering directly inside the sidebar layout.
-   [ ] **One-Click Code Copy Hook**: Appends a copy utility to all fenced markdown code snippets.

#### Priority 1: Clear Capability Explanations
-   [ ] **File-Tree Layout Generator (`comp.fileTree`)**: Custom visual components rendering directory scaffolds rather than fragile plain text blocks.
-   [ ] **Synchronized System Toggle Tabs (`comp.tabbedRuntime`)**: Injects identical global localstates so toggling "Deno-KV" or "oRPC Client" rewrites the active language blocks on all subsequent pages.
-   [ ] **Interactive Badge Indicators (`comp.badge`)**: Adds pills (`OTel Wired`, `Contracts First`, `Prisma adapter`) next to headings.

#### Priority 2: Technical Polish & Refinements
-   [ ] **ASCII Box Layout Canvas**: Structured CSS panels hosting monospace flowchart sequences without layout shifts.
-   [ ] **Flex Grid Card Container (`comp.grid`)**: A framework-friendly 3-col styling layout to host plugin directory listings.
-   [ ] **Persistent Version Switcher (`comp.version`)**: Preserves context on active packages when jumping between major alpha/beta endpoints.

---
