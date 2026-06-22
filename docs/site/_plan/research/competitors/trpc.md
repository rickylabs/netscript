# tRPC Documentation Teardown

## Core Value Proposition & Audience
* **Value Prop:** tRPC is a lightweight tool for building end-to-end type-safe APIs without any code generation, schema compilation, or runtime translation overhead. It leverages TypeScript type inference to share API routes and types directly with the client.
* **Target Audience:** Full-stack TypeScript developers building React, Next.js, or Solid applications who want maximum speed and safety across client-server boundaries.
* **Ref URL:** [https://trpc.io/docs](https://trpc.io/docs)

## Feature Surface Relevant to NetScript
* **Overlap:** Zero-codegen, type-safe API contracts, schema validations (Zod), and query client integration (TanStack Query/React Query integration). NetScript uses oRPC, which extends tRPC's design patterns by applying standard OpenAPI models, health endpoints, and Deno-friendly JSR imports.
* **Differentiator:** tRPC is strictly an API boundary layer. It does not provide database connectivity, background worker runtimes, sagas, or host-orchestration containers. NetScript is a comprehensive backend system.

---

## Documentation Architecture & Design

### 1. Information Architecture (IA) & Sidebar Model
The sidebar is structured around core setup, routing mechanics, and integration wrappers:
* **Core Concepts:** What is tRPC? Quickstart, Core Concepts.
* **Server-side Usage:** Routers, Procedures, Context, Middlewares, Metadata.
* **Client-side Usage:** Vanilla Client, React Query Integration, Links, Routing, Mutations, Headers.
* **Ecosystem / Recipes:** Next.js, Fastify, Express, Cloudflare Workers, Auth, Testing.

**Diátaxis Usage:** Focuses heavily on *Quickstarts* and *Conceptual Guides*. Rather than separating tutorials from reference pages, it maps client-side setups directly to their server-side counterparts.

### 2. Onboarding & Learning-Curve ("Fil d'Ariane")
* **End-to-End Type Flow:** Onboarding showcases a split-pane layout: declaring a route on the left (server) immediately gives autocomplete suggestions on the right (client) of an editor panel, demonstrating the core value proposition instantly.
* **Minimalist Quickstart:** Features a simple "Vanilla TS" guide, showing that tRPC does not strictly require Next.js or React to operate.

### 3. Front door & Hero Landing Design
* High-contrast dark theme with animated typing sequences showing client-side autocompletion in real time.
* Prominently highlights the core benefit: "No code-generation, just TypeScript types."

### 4. Signature Components (The "Spark" Elements)
* **Split Editor GIFs:** Animations showing hover information and parameter validations running across client-server folders.
* **Integration Tab Boxes:** Instantly displays setups for App Router, Pages Router, or vanilla React.
* **Error Envelope Callouts:** Highlighted cards displaying exact JSON RPC schema payloads and standard error dictionaries.

## Strengths vs. Weaknesses (Doc Perspective)
* **What makes it excellent:** Superb communication of the core "zero-codegen" value. The visual representations of autocomplete features makes the developer immediately eager to try it.
* **What makes it weak:** The documentation is heavily biased towards React and Next.js. Finding straight-to-the-point guides for other JavaScript/TypeScript runtimes or vanilla environments requires navigating nested recipe pages.
