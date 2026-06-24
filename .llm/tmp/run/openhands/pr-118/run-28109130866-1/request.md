You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/google/gemini-3.5-flash provider=openrouter output=pr-comment iterations=1000

use harness

# PR3 Deep-Search Dispatch — NetScript ROOT README (framework-landing) research

You are a **research** agent (OpenHands, `openrouter/google/gemini-3.5-flash`, web-browsing). Your
job is to produce a single, NetScript-specific dossier that grounds the authoring of the **root
repository `README.md`** — the front door / landing page for the whole NetScript meta-framework.
This is PR3 of the "road to JSR publish" program; the bar is **stunning, enterprise-grade, and
truthful**. You are NOT authoring the README here — produce research, skeletons, and a checklist.

## SKILL

Activate and follow these repo skills before researching (read each `SKILL.md`; mandatory):

- `.agents/skills/netscript-harness` — harness run-artifact contract; where research lands; voice
  doctrine. You are the Research phase of a harnessed run.
- `.agents/skills/jsr-audit` — JSR rendering rules: what raw HTML/markdown survives the JSR registry
  renderer vs. GitHub-only devices (the root README also renders on the repo's JSR scope page).
- `.agents/skills/netscript-doctrine` — the package/plugin archetypes and the true public surface,
  so the landing page's architecture story and package map are accurate, not invented.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` to ground-truth any API/command claim you
  recommend surfacing on the landing page (e.g. the `@netscript/cli` scaffold command).

## What already exists (read FIRST, then go deeper — do NOT redo it)

A prior dual-track dossier lives at
`.llm/tmp/run/docs-readme-revamp/sota-readme-dossier.md`. Its **Track 2 — Best-in-Class Monorepo /
Framework Landing READMEs** already analysed 10 exemplars (Astro, Next.js, Remix, Hono, Bun, NestJS,
Turborepo, Medusa, Payload, Deno), a canonical framework-landing skeleton, 3 hero options, a
visual-design + JSR-compat toolkit, and landing anti-patterns. **Treat Track 2 as your seed/baseline.**
Your mandate is to go BEYOND it in three NetScript-specific directions it did not cover:

1. **NetScript-specific competitor head-to-head.** Track 2 surveyed famous frameworks generically.
   Now research the *closest-positioned* projects to NetScript — a Deno-native, JSR-published,
   plugin-architecture meta-framework over Hono + oRPC + Fresh with first-party workers/sagas/
   triggers/streams/auth plugins and .NET Aspire deployment. Study how these in particular present
   a *composable, plugin-centric, multi-runtime backend framework* on their landing page:
   **Encore (encore.dev), Wasp (wasp-lang.dev), RedwoodJS, AdonisJS, Medusa, Nitro/UnJS, Hono,
   Fresh (deno), Nx, Turborepo, Effect, Modern monorepo "platform" repos.** For each, capture what
   makes a *plugin/composable-backend* story land: how they show the plugin/module ecosystem, how
   they draw the architecture, how they sequence "what is it → why → 60-second start → architecture
   → package map → docs". Cite URLs and quote the specific device.

2. **Architecture-diagram treatment for THIS stack.** NetScript's defining hook is the plugin
   composition over Hono(router)+oRPC(typed procedures)+Fresh(UI)+Aspire(orchestration), with
   first-party plugins (auth, workers, sagas, triggers, streams) and `*-core` contract packages.
   Research how top framework READMEs render an architecture mental-model that renders on BOTH GitHub
   and JSR (ASCII vs. image vs. mermaid — note mermaid renders on GitHub but is stripped on JSR).
   Propose 2–3 concrete architecture-diagram options for NetScript specifically, with the
   GitHub-vs-JSR rendering trade-off stated for each.

3. **Ground-truth package map.** The landing page's monorepo table must use the REAL 31 published
   packages (below — authoritative, all `0.0.1-alpha.1`). Track 2's table invented names/blurbs; do
   not reuse it. Recommend how to GROUP these 31 into a scannable table (by layer: foundation /
   data / runtime plugins / `*-core` contracts / auth backends / app-surface) rather than a flat
   31-row dump, and design the column set (package · one-line · JSR badge · reference-docs link).

### Authoritative package map (ground truth — use these exact names/descriptions)

```
@netscript/contracts        — contract primitives, common schemas, CRUD generators, query/transform helpers
@netscript/config           — typed project config schemas, loaders, env helpers, scaffold constants
@netscript/logger           — structured logging for services/packages/workers/Hono+oRPC
@netscript/sdk              — service discovery, oRPC clients, cache-backed query factories
@netscript/runtime-config   — hot-reloadable runtime override types, loaders, watchers, diagnostics
@netscript/telemetry        — OpenTelemetry tracing for jobs, queues, RPC, SSE
@netscript/kv               — reactive key-value abstraction (Redis, Deno KV, in-memory)
@netscript/database         — DB adapter contracts, Prisma driver helpers, tracing, schema tooling
@netscript/prisma-adapter-mysql — Prisma driver adapter for MySQL/MariaDB on Deno
@netscript/queue            — provider-agnostic message queue (Fedify adapters: Deno KV, Redis, RabbitMQ)
@netscript/cron             — runtime-agnostic cron scheduling abstraction for Deno
@netscript/watchers         — composable file-watching runtime (strategies, filters, stability, stop)
@netscript/plugin           — plugin manifest, validation, discovery, host-context contracts
@netscript/plugin-auth-core — auth plugin contracts, backend ports, stream/config schemas, testing primitives
@netscript/plugin-workers-core  — job/task/workflow/runtime/config/testing primitives for workers
@netscript/plugin-sagas-core    — saga DSL, runtime ports, adapters, telemetry, config, testing primitives
@netscript/plugin-triggers-core — trigger DSL, runtime ports, adapters, telemetry, config, testing primitives
@netscript/plugin-streams-core  — schema/producer/config/telemetry/testing/diagnostics primitives for streams
@netscript/plugin-auth      — unified auth API, single-active backend selection, auth DB schema, session streams
@netscript/plugin-workers   — background job scheduling, task execution, worker API endpoints
@netscript/plugin-sagas     — durable saga orchestration, workflow APIs, saga runtime metadata
@netscript/plugin-triggers  — trigger ingress, scheduling, file watching, trigger runtime APIs
@netscript/plugin-streams   — durable Streams service, CLI, Aspire, E2E, scaffolding
@netscript/auth-better-auth — better-auth integration helpers
@netscript/auth-workos      — WorkOS AuthKit authenticators
@netscript/auth-kv-oauth    — KV-backed OAuth2/OIDC AuthBackendPort backend
@netscript/aspire           — Aspire TypeScript AppHost config parsing, ports, SDK-agnostic helpers
@netscript/service          — service bootstrap builders, health probes, Hono/oRPC runtime wiring
@netscript/fresh            — Fresh runtime extensions, builders, forms, defer primitives, route contracts
@netscript/fresh-ui         — Fresh UI registry seams and interactive foundations
@netscript/cli              — public + maintainer command-line tooling for NetScript workspaces
```

## Context (ground truth you write FOR — do not re-research these facts)

- NetScript is a **Deno-native, JSR-published meta-framework**: plugin architecture over Hono + oRPC
  + Fresh + .NET Aspire; first-party plugins workers/sagas/triggers/streams/auth; alpha maturity
  (`0.0.1-alpha.1`); install via `deno add jsr:@netscript/<pkg>`; scaffold via the `@netscript/cli`.
- Published docs site: **https://rickylabs.github.io/netscript/** with per-package reference pages at
  `/reference/<pkg>/`, plus capability hubs, tutorials, how-to, explanation. The root README links
  into that site with **absolute URLs** and must NOT duplicate it.
- The 31 per-package READMEs were just rewritten (PR2, merged). The root README should feel like the
  same family — read a few merged package READMEs (e.g. `packages/contracts/README.md`,
  `packages/cli/README.md`, `plugins/auth/README.md`) so the landing page's voice, badge style, and
  cross-link convention are consistent with them.

## Output (write to PR3's OWN run folder, then commit + push)

Write the dossier to `.llm/tmp/run/docs-root-readme/sota-landing-dossier.md` on the
`docs/root-readme` branch. Grow it incrementally; do not defer all writing to the end. It must contain:

1. **Competitor head-to-head** — ≥10 closest-positioned exemplars, each with URL + the specific
   landing device quoted/described, focused on the plugin/composable-backend story.
2. **NetScript canonical framework-landing skeleton** — the exact chapter order for `/README.md`,
   with per-chapter guidance, tuned to this stack (positioning → why → 60-sec quickstart via the CLI
   → architecture → grouped package map → docs/links → maturity/roadmap → community → license).
3. **Hero design** — 2–3 concrete hero options for NetScript (markdown/HTML), each with the
   GitHub-vs-JSR rendering caveat.
4. **Architecture-diagram options** — 2–3 concrete options for the Hono+oRPC+Fresh+Aspire+plugins
   model, each with GitHub-vs-JSR rendering trade-off (ASCII / image / mermaid).
5. **Grouped package-map table design** — column set + the layer grouping for all 31 real packages.
6. **Visual-design + JSR-compat toolkit** — devices that render on BOTH GitHub and JSR vs.
   GitHub-only; carried/refined from Track 2 but verified.
7. **Quality checklist** + **anti-patterns** specific to a framework landing README.

## Constraints

- Cite every exemplar with its URL and quote/describe the specific device — no vague generalities.
- Distinguish BOTH-GitHub-and-JSR techniques from GitHub-only ones (the root README renders on the
  JSR scope page too).
- Use the authoritative package map above; do NOT reuse Track 2's invented package names/blurbs.
- Honor repo voice doctrine: the words "honest/honesty/honestly" and candor-announcing framing
  ("to be transparent", "we won't pretend", apologetic alpha disclaimers) are BANNED. Signal
  alpha maturity as a factual noun-phrase callout with a roadmap link.
- Do NOT author the NetScript root README here — research + skeleton + checklist only.
- Lock hygiene: do not touch `deno.lock`, source, or any `packages/`/`plugins/` files. Only write
  the dossier under `.llm/tmp/run/docs-root-readme/` and commit just that file.


Issue/PR title: docs(root-readme): meta-framework landing README (PR3)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28109130866-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28109130866-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-118/run-28109130866-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 118
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/google/gemini-3.5-flash
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28109130866
