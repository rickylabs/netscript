# Market Fit & Positioning Research

Where NetScript fits in the modern backend ecosystem: the gap it fills, its unique developer value proposition, its honest strengths/weaknesses versus competitors, and the adoption story that connects with target developers.

---

## 1. The Market Gap: Stop Hand-Assembling Your Backend

Most modern JavaScript/TypeScript developers looking to build robust backends face a frustrating reality: **they must hand-assemble an infrastructure puzzle from a dozen unrelated libraries.**

* They install **Hono** or **Express** for routing.
* They add **Prisma** or **Drizzle** for databases.
* They hook up **BullMQ** or **Fedify** for background tasks.
* They wire up **tRPC** or **oRPC** for client-server type safety.
* They configure **Docker Compose** or write bespoke shell scripts for local database services.
* They spend hours configuring **OpenTelemetry** with Jaeger or Prometheus.

Each of these libraries is excellent on its own, but bridging their types, lifecycles, and environments is a chore that drains product velocity.

**NetScript solves this.** It is a **Deno-native, contract-first backend meta-framework** that unifies routing, type-safe API contracts, database persistence, background queues, and durable workflows into a single workspace. By using **.NET Aspire** for local orchestration, NetScript delivers an out-of-the-box local developer dashboard, instant service-to-resource discovery, and a unified telemetry trace panel without forcing developers to write complex configurations.

---

## 2. Core Positioning & Hero Strategy

Following the locked decisions in `_plan/08-decisions-locked.md`, the platform is positioned around three central pillars:

### A. The Outcome-Led Hero
* **Hero Headline:** "From `netscript init` to a running, type-checked, OpenTelemetry-traced backend — services, durable workflows, and a design-system UI in one workspace."
* **Sub-headline:** "A Deno-native backend framework where the contract *is* the product: type-safe services and durable workflows, observable by default, orchestrated with Aspire."

### B. Alpha Maturity Strategy ("Battle-Tested Before Versioned")
* **Honest Maturity Label:** Clearly positioned as **Alpha. The API is subject to change.** Target **beta by end of 2026.**
* **The React Native Analogy:** Just as React Native was widely adopted and treated as "stable in practice" before ever reaching version 1.0, NetScript’s core APIs are stable under real-world usage but labeled alpha to retain the freedom to evolve the framework based on enterprise feedback.

### C. .NET Aspire as a Hero-Level DX Win
* **What it solves:** Aspire is not a liability; it is an incredible asset for modern full-stack teams (especially within enterprise environments). It provides multi-resource local health monitoring, instant environment binding, and live telemetry tracking.
* **The Explicit Opt-Out:** For TypeScript-only developers or teams running on environments where they prefer not to run .NET, they can easily pass the `--no-aspire` flag to `netscript init` or opt-out in their configuration. The documentation must celebrate Aspire as a hero differentiator while guaranteeing that core Deno-native development works flawlessly without it.

---

## 3. Honest Competitive Landscape (The Sibling Matrix)

In alignment with locked decision Q4, NetScript avoids hostile combative marketing. Instead, the "Why" page presents a single, confident, and highly honest table mapping where NetScript is positioned:

| Capability | NetScript | NestJS | Encore | tRPC-Stacks | Temporal | Hono |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Runtime** | Deno (Native) | Node.js / Bun | Go / Node (Custom AST) | Node.js / Serverless | Node / Go / Java Cluster | Edge / Any Runtime |
| **API Contract Validation** | Zero-codegen oRPC | Class Decorators | Code Parsing (AST) | TS Type Inference | Dedicated SDKs | Manual / zod-validator |
| **Durable Workflows** | Built-in Sagas | Manual (BullMQ/Retry) | Built-in Pub-sub | None | Heavy Distributed Engine | None |
| **Local Orchestration** | .NET Aspire | Docker Compose / CLI | Custom Rust Engine | Docker Compose / Custom | Docker / Local binaries | Manual runtimes |
| **Background Processing** | Built-in parallel queues | High-config BullMQ | Pub-sub events | None | Activities / Workers | Cloudflare Queue/None |

### Honest Comparison Narratives

* **NetScript vs. NestJS:** NestJS is highly OOP, class-based, and relies on decorators and runtime Dependency Injection containers. NetScript is functional, lean, and leverages explicit oRPC contracts for zero-codegen service borders. NestJS uses external queues (BullMQ); NetScript has queues and durable Sagas built-in.
* **NetScript vs. Encore:** Encore provides excellent code-to-infrastructure visual mapping but compiles code via a custom proprietary compiler rust engine, forcing deployments to specific clouds. NetScript uses standard, native Deno/JSR modules, orchestrates with .NET Aspire, and deploys as pure standard systems.
* **NetScript vs. tRPC:** tRPC is a superb client-boundary tool but does not contain database, background processing, of orchestration layers. NetScript implements the RPC boundary (via oRPC) as just one layer within a full-stack backend metframework.
* **NetScript vs. Temporal:** Temporal is the gold standard for distributed, massive durable executions but requires running and monitoring heavy Temporal clusters and worker setups. NetScript offers lightweight, zero-setup durable Sagas designed to compile instantly and run locally on top of Deno KV/Redis databases.
* **NetScript vs. Hono:** Hono is an ultra-fast HTTP router and middleware provider. NetScript uses Hono as its Layer-1 server driver, adding queues, crons, DB adapters, and state Sagas on top.

---

## 4. The Developer Adoption Story

To convert a curious developer into an active adoptor, the documentation must tell a sequential, high-trust developer story:

```
[Phase 1: Local Setup]
   "$ netscript init"
   Creates a type-safe workspace. Aspire starts the local service dashboard.
          │
          ▼
[Phase 2: Define Contract]
   The developer writes a standard oRPC schema in "contracts/v1/users.ts".
   The API contract *is* the validation, types, and client definition.
          │
          ▼
[Phase 3: Implement Service]
   "defineService" binds the contract to a database and exports functional Hono handlers.
   The Client instantly autocompletes queries inside the Fresh 2 frontend app.
          │
          ▼
[Phase 4: Unleash Background Work]
   "defineJob" and "defineSaga" add high-throughput background tasks and transactional workflows.
   Saga checkpoints survive local machine crashes.
          │
          ▼
[Phase 5: Seamless Deployment]
   Builds Windows Services, compile a deployment CLI, or package Deno runtimes.
   Deploy to VM, AppHost, or Cloud containers with OpenTelemetry-traced logs.
```

This narrative frames NetScript not as an academic constraint, but as a practical, cohesive developer experience tool that scale with the team's needs.
