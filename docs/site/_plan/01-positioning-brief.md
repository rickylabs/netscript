# Positioning & Narrative Brief

Public/marketing-facing. This is the source of truth for tone, the one-liner, the "why," and the
audience. Everything authored later should ladder up to this brief. Internal jargon (archetypes,
"fitness functions," "composition root") stays in Explanation, never in the hero.

## The one-liner (seed, then sharpened)

**JSR seed tagline:**
> "The contract-first, standards-first Deno meta-framework for enterprise backends: services,
> polyglot tasks, durable workflows, and a Fresh UI — fully type-safe, observable, and
> Aspire-orchestrated."

That seed is accurate but dense. Candidate sharpened heroes (pick/adjust with the user — see
question Q1):

- **A (capability-led):** "Build durable, observable backends in TypeScript — services, background
  jobs, sagas, and a Fresh UI — wired together and orchestrated out of the box."
- **B (contract-led):** "A Deno-native backend framework where the contract *is* the product:
  type-safe services and durable workflows, observable by default, orchestrated with Aspire."
- **C (outcome-led):** "From `netscript init` to a running, type-checked, OpenTelemetry-traced
  backend — services, durable workflows, and a design-system UI in one workspace."

## What NetScript IS (grounded)

NetScript is a **Deno-native, JSR-distributed meta-framework for building production backends**. It
is not a single library; it is a coordinated **family of `@netscript/*` packages** plus a CLI that
scaffolds a complete, opinionated workspace. A scaffolded project ships (confirmed from the scaffold
pipeline + asset templates):

- A **Fresh 2 app** with an app-owned UI (copied fresh-ui design system, `/design` token + component
  reference routes, example CRUD/service/telemetry routes, health + dashboard).
- **oRPC + Hono services** defined contract-first, with health probes, OpenAPI/Scalar docs, CORS, and
  request logging available as one-line builder calls.
- A **plugin system** for capability composition — workers, sagas, triggers, streams — each a
  publishable plugin over a sibling `-core` package.
- **.NET Aspire orchestration** (AppHost, ServiceDefaults, TS helpers) for local + deployed multi-
  resource wiring and a dashboard.
- A **database workspace** (Prisma + generated Zod) wired through typed adapters.
- **OpenTelemetry tracing**, structured logging, KV, queues, and cron — all provider-agnostic with
  auto-detecting adapters.

The throughline from the doctrine: **the published surface is the product.** Every `mod.ts` is a
designed contract; `deno doc` reads like a manual; the type checker, JSR doc score, and publish gate
enforce the surface. For a user, that translates to a promise the docs should *sell*: **the types
you import are the documentation, and they are designed before the implementation.**

## Who it is for (audience)

Primary persona — **the backend/full-stack TypeScript engineer at a small-to-mid product team or
agency** who:

- is fluent in TypeScript and wants to stay there end-to-end (no Go/Java/C# context-switch for the
  backend), but
- is building **real, durable systems** — background jobs, webhook ingestion, multi-step workflows,
  event streams — not just CRUD, and
- is tired of hand-assembling a backend from a dozen unrelated libraries (a queue here, a tracer
  there, a scaffold script, a Docker-compose, a DI container) and wants a **coherent, opinionated,
  observable baseline** that still lets them own their code.

Secondary personas: **platform/infra engineers** evaluating a Deno+Aspire stack for standardizing
internal services; **Deno-curious teams** coming from Node who want a batteries-included backend
story; **framework authors / plugin builders** extending NetScript.

Audience anti-persona to name implicitly (sets scope): NetScript is **not** a front-end framework, a
no-code tool, or a hosted PaaS. It is a backend framework and a workspace generator.

## Core values (the doctrine, translated for the public)

| Internal axiom | Public-facing value |
| --- | --- |
| Public types designed first; `mod.ts` is a contract | **Type-safe to the edges.** The API you import is designed, documented, and enforced. |
| Simple over easy; 80% case is one chained call | **Approachable, not magic.** Common things are one call; advanced things unfold one method deeper. |
| Web Platform + `@std/*` first; wrap don't reinvent | **Standards-first.** Built on `fetch`, `URL`, streams, Temporal — skills you already have. |
| Durable flows are explicit state machines | **Durable by design.** Sagas, triggers, and jobs survive crashes; failure handling is named, not bolted on. |
| Telemetry owned by supervisors; OTel primitives | **Observable by default.** Tracing, structured logs, and health probes are wired in, not an afterthought. |
| Aspire orchestration in the scaffold | **Orchestrated out of the box.** One workspace, many resources, a dashboard — local and deployed. |
| Plugins register contributions; no host edits | **Composable.** Add workers, sagas, triggers, streams in any combination; the host never changes. |

## Unique selling points (the "why NetScript" vs. alternatives)

1. **The only opinionated, full-stack-typed backend meta-framework on Deno + JSR.** Not a microlib —
   a coordinated package family + CLI that scaffolds a coherent workspace.
2. **Contract-first end to end.** oRPC contracts flow from service definition → typed client → query
   factories → Fresh islands with no codegen drift. The type system is the integration test.
3. **Durable workflows as a first-class citizen.** Sagas/triggers/streams are state machines with
   correlation, persistence, compensation, and supervised crash boundaries — closer to Temporal/
   Erlang than to a job queue, but authored in plain TypeScript builders.
4. **Aspire-orchestrated.** Borrows .NET Aspire for multi-resource local dev + deploy + a real
   dashboard — unusual and powerful in the TS ecosystem.
5. **Observable from line one.** OpenTelemetry tracing and structured logging are built into the
   primitives (jobs, queues, RPC, SSE), not retrofitted.
6. **You own your UI code.** fresh-ui is copy-source: the CLI copies components into your app; after
   that the code is yours to evolve. No black-box component dependency.
7. **The published surface is the product.** Every package passes a doc/export/publish gate, so the
   reference docs are exhaustive and trustworthy by construction.

## Tone (proposed — confirm in Q2)

Confident, precise, engineering-credible — in the register of TanStack ("we admit the problem is
hard, here's the working code") and Astro (warm, progressive, example-first), with the polish of
Laravel/Medusa. Avoid hype adjectives ("blazing", "magical"); avoid internal doctrine vocabulary in
marketing surfaces. Lead with the developer's problem, then show working code fast.

## Elevator pitch (cold, ~40s)

> NetScript is a Deno-native backend framework for teams who build real systems in TypeScript —
> services, background jobs, durable workflows, event streams, and a Fresh UI — and are tired of
> bolting them together by hand. One `netscript init` gives you a type-safe, OpenTelemetry-traced,
> Aspire-orchestrated workspace where the contract you define is the client you call. Durable
> workflows survive crashes by design, observability is built in, and the UI components are copied
> into your repo so you own them. The published API surface is the product: what you import is what's
> documented and type-checked.
