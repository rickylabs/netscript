# Documentation Architecture Patterns Research

A cross-cutting synthesis of high-leverage documentation patterns analyzed across industry-leading framework documentation sites (Astro, Laravel, TanStack, Medusa, NestJS, Encore, Hono, and Temporal) and how they should be integrated into the NetScript Docs Content-Architecture Rebuild.

---

## 1. Front-Door & "Why" Page Design

### Pattern Characteristics
* **The "Zero-to-One" Hook:** Homepage hero headers are outcome-driven, articulating *what* the developer will build, *how* it feels to write, and *why* they should adopt it over legacy alternatives.
* **Functional Visualizations:** Rather than displaying generic stock images or abstract branding icons, world-class front-doors show side-by-side clips of code next to their structural results (e.g., Encore's TS-to-Infra diagrams, Medusa's visual workflow charts, Hono's router performance charts).

### Application to NetScript
* **The Outcome-Led Hero:** Refrain from calling NetScript just another "meta-framework." The landing page hero must assert: **"Build resilient, contract-first backend architectures using Deno, type-safe RPCs, and durable workflows, managed under .NET Aspire."**
* **The Scaffold Visualization:** Display a visual file tree of a freshly run `netscript init` project side-by-side with an interactive diagram showing how HTTP Requests, database queries, background queues, and Sagas flow across those specific folders.
* **The Opt-Out Callout:** Directly address the ".NET Aspire" integration on the front door with an explicit command highlight showing the `--no-aspire` flag. This satisfies the locked decision in `_plan/08`, keeping NestScript welcoming to developers who prefer purely lightweight Deno-native workflows.

---

## 2. Layered Complexity & Progressive Disclosure

### Pattern Characteristics
* **Frictionless Introduction:** Avoid forcing developers to understand complex architectural concepts (such as dependency injection containers, transactional sagas, or non-deterministic replays) before they see simple outputs.
* **Progressive Onboarding (The "Fil d'Ariane"):** Organize content so that a developer takes small, sequential steps:
  1. **Scaffold & Serve:** Running a single CLI command to get a simple Hono-driven service up.
  2. **Introduce Safety:** Adding a versioned oRPC contract.
  3. **Incorporate Persistence:** Hooking up database tables via Prisma.
  4. **Unleash Durability:** Adding first-party plugins for background workers or state Sagas.
* **Conceptual Interleaves:** Introduce deep theoretical architecture concepts (e.g. non-deterministic rules in Sagas) only within advanced conceptual subsections, never on the main onboarding tracks.

### Application to NetScript
* **The Multi-Step Quickstart:** Build a clear, step-by-step path based on Astro's sequential design. Avoid jumping directly into the advanced CLI references. Under "Getting Started", guide the developer from `netscript init` to creating their first typed oRPC endpoint.
* **Separation of Concerns:** Keep advanced configurations (such as customizing database migrations or launching distributed worker queues under production Docker contexts) in lower-level "How-To Guides" rather than cluttering the initial "Core Basics".

---

## 3. Capability-Hub Navigation

### Pattern Characteristics
* **The "Two-Dimensional" Sidebar:** Leading doc systems (like Astro, NestJS, and Laravel) avoid flat sidebars. They cluster features around unified conceptual boundaries called "Capability Hubs."
* **Uniform Architectural Structures:** For each major framework capability, the docs provide a consistent page structure:
  * **Concepts:** Why does this feature exist? What are the building blocks?
  * **Quickstart:** Simple copy-paste code to get it running.
  * **How-To Guides:** Actionable solutions to common problems.
  * **API Reference:** Exact typing tables of the core functions.

### Application to NetScript
Apply this structural pattern to NetScript’s core capabilities:
* **Services Hub (oRPC + Hono):** Concepts of contract-first development, Layer 1 vs Layer 2/3 definitions, `createService` builders, and custom middlewares.
* **Durable Workflows Hub (Sagas):** Long-running state machines, checkpointing with correlations, `defineSaga`, and compensation steps.
* **Background Processing Hub (Workers/Tasks/Crons):** High-throughput queueing, parallel task processing, and sandbox execution constraints.
* **Orchestration Hub (.NET Aspire):** AppHost containers, local dashboard, configuration generators, and deployment targets.

---

## 4. Code-Sample Strategy

### Pattern Characteristics
* **No Theoretical Pseudo-Code:** Every code instance shown must be copy-pasteable, valid TypeScript that compiles without hidden side-effects.
* **Context Preservation:** Code samples should retain realistic imports (using JSR standards) and avoid omitting necessary structural declarations.
* **Error-First Highlights:** Always show realistic failure-handling code alongside happy-path sequences, ensuring developers understand error pathways immediately.

### Application to NetScript
* **JSR-First Imports:** Ensure every code sample uses realistic JSR imports matching the published `@netscript/*` namespace (e.g. `import { defineService } from "jsr:@netscript/service@^1.0.0"`).
* **RPC Autocomplete Previews:** Show client-server code samples side-by-side, displaying client-side database autocomplete suggestions directly adjacent to the server-side controller schemas to highlight the absolute power of oRPC's zero-codegen type safety.

---

## 5. Components-That-Spark

### Pattern Characteristics
* **Framework Code Switchers:** Tab systems allowing readers to toggle patterns between different options (e.g., Deno KV vs Postgres, or React vs Solid UI).
* **Interactive Terminal Blocks:** Elegant CLI block copy structures that support shell selection (bash, PowerShell, CMD) and show standard parameters clearly.
* **Pagefind client-side search:** Instant search indexing with rich previews and section matching.
* **Notice Callouts:** High-fidelity alerting boxes with standardized symbols representing tips, warnings, and security boundaries.

### Application to NetScript
* **Lume/Vento Custom Components:** Implement beautiful, reusable Vento components for:
  * Multi-tab switchers (e.g., Deno KV vs Redis settings).
  * Interactive shell blocks showing `netscript plugin add` configurations.
  * Deeply-styled custom callout containers with clear, colored category bars (e.g., Tip, Warning, Decision-Locked).
* **API Schema Tables:** Auto-render clean parameter-to-type tables for the core functions, mirroring TanStack's detailed API references.
