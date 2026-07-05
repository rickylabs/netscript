# Competitor positioning & comparison-page teardown — Topic D (positioning docs)

**Source:** Sonnet 5 B3 research pass. Step 1 read all 10 files in
`docs/site/_plan/research/competitors/` (encore, medusa, trpc, temporal + astro, hono, laravel,
lume, nestjs, tanstack — all pre-existing in-repo prior art). Step 2 extended with live WebSearch/
WebFetch against Encore, Medusa, tRPC, Temporal, NestJS, Convex, Supabase, Inngest, Trigger.dev,
AdonisJS. Quotes are verbatim from fetched pages unless marked as paraphrase.

**Filter applied throughout:** every "transferable technique" below has already been passed through
NetScript's locked positioning (`specs/01-ratified-decisions.md`) — AI-agent build-efficiency, not
throughput; no unshipped-capability claims; ban "honesty/candor" framing. See §3 Landmines for the
techniques explicitly rejected.

---

## 1. Per-competitor findings

### Encore.dev — sharpest overall AI-agent-positioning model
- **Hero (verbatim):** "Backend Infrastructure for Humans and Agents" / "Encore lets developers and
  AI agents define infrastructure in application code, run the real system locally and in preview
  environments, then provision production infrastructure automatically in your AWS or GCP." Section:
  "A platform that keeps up with you, and your AI."
- **`encore.dev/articles/nestjs-alternatives`:** *"TypeScript's backend ecosystem has too many valid
  ways to structure things. AI coding agents pick a different combination of validation library,
  database access pattern, and project layout on every prompt. NestJS makes this worse because its
  decorator-heavy approach ... means agents have to understand modules, providers, guards, and
  interceptors — too many moving parts for consistent generation."* Counter: *"With Encore, the
  project's API patterns, infrastructure declarations, and service structure are already defined. An
  agent reads the existing conventions and follows them."* Concrete before/after: a CRUD endpoint
  "shouldn't require five files and a module registration."
- **`encore.dev/use-cases/ai`:** names the gap explicitly — AI tools accelerate *code* writing but
  developers still hand-configure *infrastructure*. Claim (marketing, unverified): infra setup from
  "3+ days" to "~1 hour" — **do not borrow the number**, only the framing.
- **`encore.dev/blog/mcp-server`:** *"An agent only fixes what it can see before it stops, and a
  compile error is the one signal that always lands in time."* — structured, type-checked context
  shortens the agent's fix-loop. MCP lets an agent "verify its own work."
- **Transferable:** (a) name the AI-agent audience in the hero itself; (b) tie "fewer turns" causally
  to *conventions* (one way to declare an API/DB/cron), not raw speed; (c) MCP as the literal
  mechanism that lets an agent verify its own work; (d) concrete file-count/step-count before/after
  as a build-efficiency proxy.
- Citations: encore.dev/, /articles/nestjs-alternatives, /articles/nestjs-vs-express,
  /use-cases/ai, /blog/mcp-server, /use-cases/cursor, /docs/platform/ai-integration,
  encore.cloud/features/ai-development.

### Medusa — sharpest for plugins / AI-plugin-stack narrative
- **Hero:** "Open-Source Commerce Platform for Agents and Developers" / "10x your time-to-market
  with AI-enabled development" (do not borrow the multiplier, only the framing).
- **`medusajs.com/blog/building-and-operating-your-store-with-agents/`** — a three-tier
  capability-expansion narrative: **Build** ("with only a few prompts... a wishlist feature... an
  integration with your legacy ERP") → **Optimize** ("improve it to follow best practices for moving
  the needle on conversion") → **Operate** ("custom agents that operate and manage your store for
  you"). Closing: "make Medusa a platform where agents are first-class operators."
- **Agent Skills** (`docs.medusajs.com/.../agentic-skills`) — skills packaged as installable,
  framework-agnostic units usable directly as Claude Code plugins. **"Install a plugin" and "give an
  agent a capability" are the same action** — the single most directly transferable model for
  NetScript's plugin system + AI plugin stack.
- **Transferable:** (a) three-tier build → optimize → operate narrative instead of static feature
  bullets; (b) plugin = agent capability unification (one artifact, two framings — no extra claim
  needed); (c) legacy in-repo `medusa.md` teardown independently confirms visual workflow diagrams
  matching code step-for-step, reusable for sagas.
- Citations: medusajs.com/, /blog/building-and-operating-your-store-with-agents/,
  docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills,
  /blog/claude-code-ecommerce-storefront/, /blog/shopify-vs-open-source/.

### tRPC — sharpest for contract/type-safety visual proof (not AI-framed)
- **Hero:** "Move Fast and Break Nothing. End-to-end typesafe APIs made easy." No official REST/
  GraphQL comparison page exists at trpc.io (confirmed) — only third-party blog comparisons.
- The in-repo teardown's split-editor GIF technique (server route declared left, client autocomplete
  appears right instantly) is the real signature move.
- **Transferable (needs reframe):** demonstrates type-safety, not AI-agent efficiency — reframe as
  "the agent writes the contract once; the client, the docs, and the OpenAPI surface all update — no
  separate turn to keep them in sync."
- Citations: trpc.io/, trpc.io/docs.

### Temporal.io — sharpest for sagas/durable-workflow AI framing (and biggest landmine source)
- **Hero:** "The world's best AI runs on Temporal" / "Write code as if failure doesn't exist" / "As
  Reliable as Gravity." All three are absolute/superlative — **landmines**, do not imitate the
  register.
- **Checkpointing pitch** (`temporal.io/blog/durable-execution-meets-ai...`): event sourcing records
  "every single time code in the Workflow is run, every single time an Activity is called or
  returned." "It's just regular code" for orchestrating LLMs/Actions/UX.
- Cites OpenAI Codex, Cursor, Replit, Lovable, Retool as running on Temporal — strong third-party
  social proof **NetScript cannot fabricate** (no case studies yet).
- Citations: temporal.io/, /blog/durable-execution-meets-ai-why-temporal-is-the-perfect-foundation-
  for-ai, /blog/of-course-you-can-build-dynamic-ai-agents-with-temporal, /solutions/ai.

### NestJS — useful mainly as the "who NOT to be" foil
- **Hero:** "the world's fastest-growing Node framework..." / "Built for teams that can't afford
  mistakes" — both unverifiable superlatives (landmine family).
- No AI-agent angle anywhere on NestJS's own site (confirmed by direct fetch) — the gap Encore's
  critique exploits. This absence is itself informative: NestJS's positioning has not adapted to the
  AI-agent-authoring era.
- Citations: nestjs.com/, docs.nestjs.com/ (cross-ref: encore.dev/articles/nestjs-alternatives).

### Convex — sharpest for streams/reactive-data narrative and AI-plugin building blocks
- **Hero:** "Build with confidence" / "The backend building blocks for your agents" / "Always in
  sync" / "LLMs love Convex."
- **`convex.dev/compare/supabase`** — a clean **Yes/No feature matrix** (Datastore, Open-source,
  Cloud functions, Realtime native, Built-in schema enforcement, etc.) — the cleanest comparison-
  table *shape* found in this whole research pass, directly reusable structurally.
- **Transferable:** "Always in sync" maps almost directly onto NetScript's **streams** feature
  (durable live-query streams) — strong candidate headline phrase. Reuse the Yes/No matrix shape for
  NetScript's own comparison pages (content differs, shape doesn't).
- Citations: convex.dev/, /components/agent, /compare/supabase, docs.convex.dev/agents.

### Supabase — sharpest for auth conventions + measured-agent-accuracy technique
- **Hero:** "Build in a weekend. Scale to millions." / "open source Firebase alternative built on
  Postgres."
- **`supabase.com/alternatives/supabase-vs-firebase`** — clean factual table (Database type, Data
  model, Transactions, API access, Self-hosting).
- **`supabase.com/blog/supabase-agent-skills`** — the single most important find for NetScript's
  **auth** feature: "knowing about Supabase and using it correctly are two different things," lists
  concrete agent failure modes (skip RLS policies, hallucinate CLI commands, create views without
  `security_invoker = true`). Measured: **"Claude Code (Sonnet) improved from 58% task completion
  without the skill to 71% with it."** "They knew how to implement it. They just didn't know when."
- **Transferable:** (a) naming concrete agent failure modes for a security-sensitive feature is a
  credible, non-absolute build-efficiency argument — the shape NetScript's auth story should use once
  it has its own measured data; (b) the measured-percentage format is exactly the evidence-based
  metric NetScript's positioning calls for (turns/success-rate, not throughput) — **but NetScript
  must not invent a number it hasn't measured.**
- Citations: supabase.com/, /alternatives/supabase-vs-firebase, /blog/supabase-agent-skills,
  /docs/guides/ai-tools/mcp.

### Inngest — sharpest for triggers (event-driven) and background-workers "no infra" framing
- **Hero:** "Unbreakable Agents. Invisible Infra." ("Unbreakable" = landmine absolute; "invisible
  infra" framing itself is fine.) "No workers. No queues. No refactoring."
- **`inngest.com/compare-to-temporal`** — sharpest line in the whole corpus for sagas/workflows: *"
  Temporal's execution model requires workflow code to be strictly deterministic — it replays
  history to reconstruct state after failures. LLMs are inherently non-deterministic."* Countered:
  "Inngest was architected around steps from the start, with no determinism requirement on the
  orchestration layer." Positioning summary: "designed for AI, not retrofitted."
- **Transferable:** the determinism-trap argument is the sharpest available model for how NetScript
  narrates its own local-first, non-clustered saga/trigger engine relative to Temporal-style durable
  execution — technical and falsifiable, not a superlative. Already anticipated by the in-repo
  `temporal.md` teardown ("NetScript implements light, local-first saga mechanics ... without
  requiring complex Temporal clusters").
- Citations: inngest.com/, /compare-to-temporal, /uses/durable-workflows.

### Trigger.dev — best-structured comparison-page format found in this research
- **Hero:** "Build and deploy fully-managed AI agents and workflows." "Durable AI chat agent:
  survives refreshes, redeploys, and crashes."
- **`trigger.dev/vs/temporal`** — six discrete labeled tables (Developer Experience, Build & Deploy,
  Durability Model, AI Agent Capabilities, Infrastructure Management, Pricing, Self-Hosting &
  Licensing), plain factual rows, no marketing adjectives in the cells. Sample rows: "Time to
  production: ~5 minutes vs Days to weeks (self-hosted) or hours (Cloud)"; "Self-hosted minimum:
  Docker Compose vs Database + Elasticsearch + Server + Workers"; "Determinism required: No vs Yes:
  no `Date.now()`, `Math.random()`, or direct I/O." Opening frame states each side's real tradeoff in
  one neutral sentence before the tables.
- **Transferable:** the **multi-table, category-segmented comparison page** (dev experience / deploy
  / durability / AI capability / infra / pricing / licensing as separate tables) is the single most
  reusable *structural* technique in this whole research pass for a "NetScript vs X" page — factual
  row-by-row, safer under the no-absolute-claims constraint than persuasive prose.
- Citations: trigger.dev/, /vs/temporal, /vs/n8n, /vs/bullmq.

### AdonisJS — sharpest for CLI/scaffold "batteries-included, ship don't assemble" framing
- **Hero:** "The batteries-included TypeScript framework." "Built for teams who want to ship
  products, not assemble frameworks."
- No AI-agent angle found (same gap as NestJS).
- **Transferable:** "ship products, not assemble frameworks" is a clean X-not-Y rhetorical structure
  that maps directly onto NetScript's CLI/scaffold value prop — reusable generically across CLI
  positioning copy.
- Citations: adonisjs.com/, docs.adonisjs.com/stacks-and-starter-kits.

### In-repo prior art (already thorough, not re-fetched live) — quick relevance notes
- **Astro** (`astro.md`): tone model ("warm, speaks to the developer as an equal partner") + one-click
  sandbox — transferable to the fresh-ui page (live component preview).
- **Hono** (`hono.md`): **explicit landmine** — docs show router-benchmark charts vs Express/
  Fastify. This is precisely the throughput-benchmark style NetScript's locked positioning forbids.
  Its "under 30 seconds" onboarding demo is a good technique for the CLI quickstart, separate from
  the benchmark landmine.
- **Laravel** (`laravel.md`): one-command (`curl | bash`) onboarding into a running app — reusable
  for NetScript's scaffold+Aspire "one command to a running full backend" story.
- **Lume** (`lume.md`): categorized, searchable plugin-index grid — reusable for a NetScript plugins
  marketplace/catalog page.
- **TanStack** (`tanstack.md`): global framework-selector toggle (React/Vue/Svelte/Angular) that
  repivots all code samples — reusable for a Prisma-next/Turso/Postgres/MSSQL selector on the
  database-layer docs.

---

## 2. Feature-by-feature: sharpest competitor comparison

| NetScript feature | Sharpest comparison | Why sharpest | Transferable technique (post-filter) |
|---|---|---|---|
| services/oRPC contracts | Encore `nestjs-alternatives` | Frames API-definition style as an AI-agent-consistency problem, not just type-safety | "One way to define an API surface" so agent-generated client/docs/OpenAPI stay in sync without a manual turn. Secondary: tRPC's "declare once, typed everywhere instantly," reframed around turns saved. |
| database layer (Prisma-next/Turso/PG/MSSQL) | Convex vs Supabase (`convex.dev/compare/supabase`) | Cleanest Yes/No matrix format found | Reuse matrix *shape* for "same Prisma-next schema → Turso/Postgres/MSSQL" rows. Consider TanStack's toggle to flip the whole page between DB targets. |
| background workers | Trigger.dev vs Temporal | Concrete falsifiable "time to production"/"self-hosted minimum" rows | Build a NetScript row set (workers to deploy, boilerplate, time to first running worker) — factual only, matching real scaffold behavior. |
| sagas (durable workflows) | Inngest vs Temporal | Determinism-vs-LLM argument is the sharpest, most technically precise in the corpus; matches NetScript's own recorded local-first differentiation | Reuse the "no determinism constraint" argument to explain why NetScript's saga engine wraps arbitrary (incl. LLM-calling) steps without special isolation — technical, not throughput. |
| triggers (event/cron) | Inngest homepage | Matches NetScript's own feature name/framing directly | "Event declared once, no separate queue/worker to provision" — echoes AdonisJS's ship-don't-assemble structure. |
| streams (durable live-query) | Convex ("Always in sync") | Convex's core product is reactive live queries — closest conceptual analog | Borrow "always in sync" as a headline pattern; Trigger.dev's Realtime Streams framing as secondary. |
| plugins system | Medusa Agent Skills | Only competitor where "install a plugin" and "give an agent a capability" are the same action | Present each official plugin as both a runtime capability and an agent capability — one artifact, two framings. |
| telemetry/observability | Encore MCP + traces | Ties observability directly to the agent's own fix-loop, matching "fewer turns" | Frame telemetry as what lets an agent self-verify a change without asking a human to check logs. |
| auth (better-auth + adapters) | Supabase Agent Skills post | Only measured, non-absolute, agent-specific claim about a security-sensitive feature | Name concrete failure modes an ungrounded agent hits, then show the NetScript convention that prevents it — without inventing a percentage. |
| AI plugin stack | Medusa Build/Optimize/Operate + Convex "LLMs love Convex" | Only mature multi-layer narrative for what an AI-plugin-stack investment buys over time | Adopt the three-tier progressive-capability narrative shape (generate → optimize → operate a running backend). |
| CLI/scaffold | Encore file-count before/after + AdonisJS ship-not-assemble | Concrete countable before/after + cleanest rhetorical contrast | Literal file/step count for `netscript new` + `plugin add` vs hand-rolled equivalent, paired with a ship-don't-assemble line. |
| Aspire orchestration | Encore's local dashboard (auto-provisioned infra + visual map) | Same category of artifact Encore markets hardest | Show the Aspire dashboard as a diagram generated directly from declared services/resources — proof it isn't hand-wired. |
| fresh-ui (design system) | Astro tone + live sandbox | Best-in-class voice + live-preview mechanism | Embed a live, runnable component preview per fresh-ui component page; Astro's "equal partner" tone (minus banned framing). |
| deployment (bare-metal/Deno Deploy) | Trigger.dev vs Temporal "Self-Hosting" table | Best factual small-vs-large-infra table found | Equivalent factual table: NetScript bare-metal minimum vs a hand-rolled stack's typical footprint — rows only. |
| MCP (grounding/tools) | Encore MCP server blog | Most mature, most technically specific MCP-for-backend-framework story, causally linked to fewer turns | Reuse the causal chain (structured introspection → correct generation → agent self-verifies → fewer turns), substituting NetScript's actual exposed tools. |

---

## 3. Landmines — claims NetScript must NOT copy

1. **Any throughput/benchmark chart** (Hono vs Express/Fastify router ops/sec). Locked positioning is
   AI-agent build-efficiency, not runtime throughput — reject any form, direct or indirect ("X%
   faster").
2. **Absolute/superlative claims.** Temporal ("As Reliable as Gravity," "world's best AI runs on
   Temporal," "write code as if failure doesn't exist"), NestJS ("world's fastest-growing," "can't
   afford mistakes"), Trigger.dev ("Unbreakable Agents"). All unfalsifiable — disallowed.
3. **Unshipped-capability inflation.** Encore's "3+ days → ~1 hour," Medusa's "10x time-to-market" —
   marketing multipliers without visible methodology. NetScript's own rule: no unshipped-capability
   claims; never invent a similar number.
4. **"Honesty/candor" framing in borrowed competitor phrasing.** A third-party comparison title reads
   "...The Honest Comparison After Using Both in Production" — exactly the rhetorical move NetScript's
   docs voice bans. Watch for it creeping in via borrowed phrasing during drafting.
5. **Name-dropping unearned social proof.** Temporal's "the way OpenAI, Lovable, Replit, Cursor, and
   Retool do" works because those are verified customers. Do not fabricate or imply case studies/
   logos NetScript doesn't have.
6. **Measured-percentage claims without NetScript's own data.** Supabase's 58%→71% is compelling
   because it's measured. If NetScript ever wants a similar claim it needs its own benchmark (see
   `netscript-bench`, issue #302) — never borrow the number, only the technique.
7. **Vague enterprise-credibility padding.** Laravel/NestJS sponsor logos and community-size framing
   — not usable for NetScript pre-traction.

---

## 4. All citations, grouped by competitor

**Encore.dev:** encore.dev/, /articles/nestjs-alternatives, /articles/nestjs-vs-express,
/use-cases/ai, /blog/mcp-server, /use-cases/cursor, /docs/platform/ai-integration,
encore.cloud/features/ai-development; in-repo `docs/site/_plan/research/competitors/encore.md`.

**Medusa:** medusajs.com/, /blog/building-and-operating-your-store-with-agents/,
docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills,
/blog/claude-code-ecommerce-storefront/, /blog/shopify-vs-open-source/; in-repo `medusa.md`.

**tRPC:** trpc.io/, trpc.io/docs; in-repo `trpc.md`; third-party (non-official) dev.to/anttiviljami/
comparing-rest-graphql-trpc-12n8, directus.io/blog/rest-graphql-tprc.

**Temporal.io:** temporal.io/, /blog/durable-execution-meets-ai-why-temporal-is-the-perfect-
foundation-for-ai, /blog/of-course-you-can-build-dynamic-ai-agents-with-temporal, /solutions/ai;
in-repo `temporal.md`.

**NestJS:** nestjs.com/, docs.nestjs.com/; in-repo `nestjs.md`.

**Convex:** convex.dev/, /components/agent, /compare/supabase, docs.convex.dev/agents,
stack.convex.dev/lessons-from-building-an-ai-app-builder.

**Supabase:** supabase.com/, /alternatives/supabase-vs-firebase, /blog/supabase-agent-skills,
/docs/guides/ai-tools/mcp, /features/mcp-server, /blog/mcp-server.

**Inngest:** inngest.com/, /compare-to-temporal, /uses/durable-workflows.

**Trigger.dev:** trigger.dev/, /vs/temporal, /vs/n8n, /vs/bullmq.

**AdonisJS:** adonisjs.com/, docs.adonisjs.com/stacks-and-starter-kits.

**Other in-repo prior art (technique notes only, not re-fetched live):** `astro.md`, `hono.md`,
`laravel.md`, `lume.md`, `tanstack.md` — all under
`docs/site/_plan/research/competitors/` in the NetScript worktree.
