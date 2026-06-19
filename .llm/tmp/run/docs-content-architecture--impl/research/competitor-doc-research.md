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
