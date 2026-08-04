# Main-pages revamp — outline (Opus, generator A)

Slice: `mainpages-s1` · analysis only · no edits to `docs/site`, no commits.
Pages read: `docs/site/index.vto` (167 L), `docs/site/why.vto` (142 L), `docs/site/concepts.vto`
(86 L), `docs/site/quickstart.vto` (285 L), `docs/site/quickstart/aspire.md`. Skimmed:
`docs/site/capabilities/index.md` (a 4-line redirect stub to `/` — **not** a hub; every "see the
capabilities" link on these four pages bounces the reader back to the homepage), and
`docs/site/durable-workflows/index.md`, `docs/site/services-sdk/index.md`,
`docs/site/web-layer/index.md`.

---

## 0. The diagnosis, sharpened

The owner's complaint is right, and the mechanism is specific enough to name:

1. **The homepage is the whole site in one scroll.** `index.vto` carries 9 `<h2>`s, 5 feature
   grids, 3 tabbed-code blocks, 1 diagram, 2 callouts and a learning path — 30+ outbound links.
   It is a table of contents wearing a hero. There is no "one screen" at all; the first *claim*
   the reader meets after the hero is "The contract is the product", and the first *code* is a
   CRUD contract.
2. **The three prose pages say the same three things.** "Contract is the source of truth",
   "plugins fill an empty host", "Aspire brings up many resources" appear on `index.vto`,
   `why.vto` **and** `concepts.vto` — three times, in three voices, at three lengths.
   `concepts.vto` is the only one of the three whose *job* is to say them.
3. **CRUD is the product's first impression.** `index.vto` tab 1 leads with
   `createCrudContract({ resource: 'users', entitySchema: UserSchema, … })`. The most generic
   thing NetScript can do is the first code a prospect sees. Worse: tab 1 does not even run on its
   own — it imports `@database/zod`, which tab 4 explains is emitted three steps later. The
   opening code moment is both boring *and* not runnable.
4. **The pages sell the *absence* of work, not the presence of capability.** "no docker-compose to
   babysit", "no codegen step", "no registry, no config file", "no black-box component". Every
   claim is framed as a negation of somebody else's pain. That reads as defensive, and it is why
   the prose slides into generic. The target consumer — a team shipping a long-lived
   service-shaped app — does not buy relief from `docker-compose`; they buy *a checkout that
   survives a crash and a refactor that fails at `deno check` instead of in production*.
5. **The hero is a category label, not a claim.** "One contract. A whole production backend."
   + "NetScript is the enterprise-grade meta-framework for Deno: contract-first, end-to-end typed,
   cloud-agnostic." — six adjectives, zero falsifiable statements. "enterprise-grade" on a pre-1.0
   `0.0.x` framework is the single least credible word on the site and it is in the `<title>`.

---

## 1. Inventory

### 1.1 `docs/site/index.vto` — homepage

| Block (line) | What it is | Verdict |
| --- | --- | --- |
| Hero (6–14) | tagline + 3-sentence subhead + 3 CTAs | **Rewrite.** Category label, not a claim. "enterprise-grade" is unearned pre-1.0. |
| Pre-1.0 callout (16–18) | pin your versions | **Keep**, shrink to one line, move below the code moment. |
| "The contract is the product" (20–33) | 4-tab block: CRUD contract → service → scaffold → bring-up | **Kill the CRUD tab (29).** Tabs 3–4 are the Quickstart, verbatim, duplicated. Tab 2 survives as a fragment. |
| "One contract, four moves" (35–47) | contract→service→plugins→platform prose + `architecture-overview.svg` | **Move to `concepts.vto`.** This *is* Idea 1+2+3 compressed — pure duplication of the concepts page, including the same SVG with the same `alt` and the same `caption` (byte-identical to `concepts.vto` L23). |
| Observability paragraph (49–53) | OTLP, zero-SDK, Aspire dashboard | **Keep the fact, cut to one clause** inside proof point 3. The "zero OpenTelemetry SDK dependency by default" detail is genuinely differentiating and is currently buried mid-paragraph. |
| "Batteries no frontend framework ships" (55–73) | plugin-system prose + `plugin install` output | **Split.** The 6-plugin grid becomes proof point 1's link row; the plugin *mechanism* prose (63–69) moves to `concepts.vto` Idea 2. The `plugin install` terminal output is real and good — move to `quickstart.vto` as the optional 4th step. |
| Plugin featureGrid (75–82) | workers/sagas/triggers/streams/auth/ai | **Keep, trimmed to 4** (workers, sagas, triggers, streams) as the "batteries" row. auth + ai move to the pillar row. |
| "Ship anywhere" (84–108) | deploy targets, adapters, desktop callout | **Cut to two sentences + one link.** 10 lines listing Docker/Compose/systemd/Deno Deploy/K8s/Azure/Cloud Run is reference material on a sales page. Move the enumeration to `/orchestration-runtime/`. |
| "Built for devs working with agents" (110–129) | `agent init`, MCP/skills/CLI grid | **Keep as one line + link.** This is a real differentiator but it is *not* one of the three proof points for the stated target consumer; three paragraphs and a 3-card grid is out of proportion. |
| "Build real systems, not just CRUD" (131–143) | 9-pillar grid | **Keep the grid, kill the heading.** The heading is the site apologising for its own tab 1. Fix the cause, delete the apology. |
| "Who it is for" (145–152) | 4 audience cards | **Move to `why.vto`.** Audience definition is the *argument* page's job; on the homepage it is filler. |
| Learning path + closing grid (154–167) | Quickstart/concepts/glossary/pillar + reference/GitHub/JSR | **Keep**, merge into one closing row. |

Worth keeping verbatim: the plugin featureGrid bodies (76–81) — each is concrete and factual
("at-least-once delivery keyed on `idempotencyKey`", "saga state persists, so a crash mid-flow
resumes"). That is the register the whole page should have been written in.

### 1.2 `docs/site/why.vto` — argument page

Structurally the strongest of the four; it already *is* an argument. Problems:

- **No target consumer named.** The page argues against an unnamed "you". The four audience cards
  that would fix it live on the homepage (§1.1, 145–152).
- **The 7-pain list (24–33) is excellent and should be kept nearly verbatim.** Pains 1, 3, 5, 6 are
  the load-bearing ones. Pain 4 ("A DI container you didn't want") is the weakest — it argues
  against a Java-shaped strawman most Deno teams never reached for.
- **Two tables that overlap.** "What you'd hand-assemble → what NetScript gives you" (40–52) and
  "How NetScript compares" (113–123) both do contrast. Merge into one.
- **Duplication with `concepts.vto`.** §1 "Contract-first, type-safe end to end" (58–65) is Idea 1
  with a near-identical code sample; §5 "Composable plugins" (89–91) is Idea 2; §4 "Orchestrated
  with Aspire" (85–87) is Idea 3 — the Aspire paragraph repeats `cd aspire && aspire start`, the
  `--db` engine list and the `--no-aspire` escape hatch that also appear in `concepts.vto` L56/L68
  **and** `quickstart.vto` L77–79/L140–144. That is a 3× duplication of the same four facts.
- **Honest trade-offs already exist and are good** — the "When NetScript is NOT the right tool"
  callout (127–134). This is the best block on the site. Promote it, do not bury it at the bottom.
- **Encore and NestJS get the same `desc` string, word for word** (117–118). Copy-paste. A reader
  evaluating against Encore learns nothing, and the tell is visible.
- **Bug to fix while here:** the saga sample (72) uses `context.sagaId` as an order id. `sagaId` is
  the *definition* id (`SagaId`), not the instance — the business key is `context.correlationKey`
  (`packages/plugin-sagas-core/src/domain/saga-context.ts:6–16`). The snippet is subtly wrong in
  the exact place where the page claims durability rigor.

### 1.3 `docs/site/concepts.vto` — core concepts

Already close to its target role, and the shortest page. It is being *starved* by the homepage and
`why.vto` saying its material first.

- Keep the three-idea spine (25, 36, 50) and the "How the three ideas connect" close (70–72) —
  that closing paragraph is the single clearest sentence on the site.
- Keep all three diagrams; `plugin-thread-isolation.svg` (46) and `aspire-resource-graph.svg` (54)
  appear **only** here and are the page's unique assets.
- It links out well already (`comp.xref` to `explain:architecture`, `explain:contracts`,
  `explain:plugin-system`, `explain:auth-model`, `explain:aspire`, `cap:services`,
  `cap:runtime-config`).
- Missing from the mental model: **the web layer**. The page goes contract → plugin → runtime and
  never explains that a Fresh page loader derives from the same contract object. That is the
  cross-layer type-safety story, and `web-layer/index.md` already tells it properly
  (`apps/dashboard/lib/example-service.ts` imports `UsersContractV1`). Concepts must absorb it.
- The `apiTable` port list (58–66) is operational detail, not a concept. It belongs in
  `/orchestration-runtime/`.
- Both `cap:services` and `cap:runtime-config` xrefs resolve into `/capabilities/`, which is a
  redirect to `/`. **Every capability link on this page is a round trip to the homepage.** Verify
  the xref map before relying on `/capabilities/` anywhere in the revamp.

### 1.4 `docs/site/quickstart.vto` — fastest path

285 lines for "three commands". The path itself is only ~40 of them.

- **The path is correct and honest** — install → `netscript init` → `cd aspire && aspire start`,
  with the genuinely important ordering constraint (Aspire before any `netscript db` command)
  called out twice.
- **Concept exposition that does not belong:** "See the framework code" (146–168), including a
  9-method fluent `createService(...).withCors().withLogger()…` chain in a tip callout. That is
  reference material, and it is the third time `defineService` appears across these four pages
  (`index.vto` 30, `why.vto` 82, here 157).
- **Workspace-layout section (200–221)** — 22 lines of directory roles and agent anchors. Useful,
  wrong page. It also contains `issue #1090`, an internal tracker reference, on a public page.
- **Four callouts in a row (77–89)** — engine picker, non-interactive flags, agent init, dry-run —
  before the reader has run anything. Classic quickstart bloat.
- **`--service` flag drift:** `index.vto` tab 3 scaffolds with `netscript init my-app --db postgres
  --service`; `quickstart.vto` step 2 uses `netscript init my-app --db postgres` (no `--service`).
  The two pages disagree about the canonical scaffold command. Pick one.
- Worth keeping verbatim: the terminal-output block (94–110), the "If something doesn't come up"
  warning (185–192), and the "Start at `/design`" tip (194–198). Concrete, verifiable, earned.

### 1.5 Duplication matrix

| Fact | index | why | concepts | quickstart |
| --- | :-: | :-: | :-: | :-: |
| Contract is one source of truth, client derived, no codegen | ✓ | ✓ | ✓ | |
| `defineService` wires CORS/logging/OpenAPI/RPC/health | ✓ | ✓ | | ✓ |
| Plugins register against an unchanging host | ✓ | ✓ | ✓ | |
| `cd aspire && aspire start`, Aspire before `netscript db` | ✓ | ✓ | ✓ | ✓ |
| `--db postgres` / mysql / mssql / sqlite engine list | ✓ | ✓ | ✓ | ✓ |
| `--no-aspire` escape hatch | ✓ | ✓ | ✓ | ✓ |
| Plugin ports `:8091`–`:8094` | | ✓ | ✓ | |
| Pre-1.0 / pin your versions callout | ✓ | ✓ | ✓ | ✓ |
| `architecture-overview.svg` (identical alt + caption) | ✓ | | ✓ | |
| Observability wired in, Aspire dashboard `:18888` | ✓ | ✓ | ✓ | ✓ |

Ten facts, 32 tellings. **The `--db` engine list and `--no-aspire` appear on all four pages.**

---

## 2. Per-page outlines to the target roles

### 2.1 Homepage — sells NetScript in one screen

Budget: **one hero, three proof points, one code moment, one link row.** Nothing else above the
fold, and the whole page should fit in roughly 60 lines of `.vto`.

**Hero claim (proposed wording):**

> ## Your checkout survives the crash. Your types survive the refactor.
>
> NetScript is a Deno meta-framework for apps that have to keep running: durable workflows,
> one contract from database to browser, and the whole fleet — services, workers, Postgres,
> traces — up with one command.

Rationale: two falsifiable promises, both of which the framework actually keeps, in the two areas
(durability, cross-layer typing) that separate NetScript from every "typed backend" competitor.
Zero adjectives. Drops "enterprise-grade" (unearned at `0.0.x`) and "cloud-agnostic" (a deploy
detail, not a reason to adopt).

Alternates, if the owner wants a different temperature:

- *"A backend framework that assumes your process will die."* — sharper, durability-only.
- *"Deno, for the app you will still be running in three years."* — longevity-first, closest to the
  "long-lived service-shaped app" consumer.

CTAs: **Quickstart — 5 min** (primary) · **Why NetScript** · **GitHub**. Drop "Browse the
reference" from the hero — nobody's first click on a homepage is generated API docs.

**Proof point 1 — Durability is a state machine, not a retry loop.**
One sentence: a saga's state persists, so a process death mid-flow resumes instead of stranding
half-applied effects; failure has a named compensation path. One 4-card row: workers · sagas ·
triggers · streams, keeping the existing bodies verbatim from `index.vto` 76–79.
Links: `/durable-workflows/` (primary), `/background-processing/`.

**Proof point 2 — One contract, every layer.**
One sentence: the service handler, the typed client, the OpenAPI document *and* the Fresh page
loader all derive from the same contract object — reshape it and the page that consumes it fails
`deno check`, not production. This is the one place the homepage should name the web layer, because
"full-stack" is in the hero and nothing else on the page earns it.
Links: `/services-sdk/`, `/web-layer/`. (`web-layer/index.md` already tells this story with a real
file path — the homepage should borrow its concreteness, not restate its argument.)

**Proof point 3 — One command brings up the fleet, already traced.**
One sentence: `aspire start` boots Postgres, the cache, every service and every background
processor in dependency order, and hands you distributed traces stitched scheduler → queue →
worker → RPC → SSE through Deno's built-in OTLP exporter — no OpenTelemetry SDK dependency, no
compose file. Include the `:18888` dashboard.
Links: `/orchestration-runtime/`, `/observability/`.

**The code moment** — see §3. One block, one tab, no tab bar.

**Closing link row (one grid, 9 pillars, existing bodies verbatim** from `index.vto` 133–143**)**,
under a neutral heading — *"Where to go next"*, not "Build real systems, not just CRUD".

**Below that, three one-liners** (not sections): pre-1.0 pin-your-versions · `netscript agent init`
equips your coding agent (→ `/ai/`) · deploy targets from a single binary to Kubernetes (→
`/orchestration-runtime/`).

Deleted from the page entirely: the four-moves prose + `architecture-overview.svg`, the plugin-
mechanism paragraphs, the deploy enumeration, the agent 3-card grid, the "Who it is for" grid, the
learning path. All relocated — see §4.

### 2.2 `why.vto` — the argument

1. **Hero** — keep the current tagline; it is the best line on the site. *"You shouldn't have to
   assemble a backend from a dozen libraries that have never met."*
2. **Who this is for** (new, opens the argument) — absorbs the homepage's "Who it is for" grid
   (`index.vto` 147–152), rewritten to name the consumer explicitly: **teams building long-lived,
   service-shaped applications** — a product that outlives its first deploy, has background work,
   webhooks, multi-step money-touching flows, and a UI over the same data. One sentence on who it
   is *not* for: a static site, a single-endpoint API, a weekend CRUD app.
3. **The problem: the integration tax** — keep 24–34 almost verbatim. Drop pain 4 (DI container),
   fold pain 2 (rotting scaffold) into pain 3. Five pains, harder-hitting than seven.
4. **The answer, in one table** — merge the two existing `apiTable`s (40–52 and 113–123) into a
   single *hand-assembled → NetScript → what you give up* three-column table. The third column is
   what makes this page honest rather than promotional.
5. **Honest contrasts** — one row each, and **rewrite Encore and NestJS separately** (they
   currently share a `desc` verbatim):
   - *bare Fresh* — Fresh gives you routing and islands; it has no service, contract, job, saga, or
     orchestration story. NetScript is what you would build on top of Fresh, already built.
   - *Next.js / server-actions stacks* — colocated data fetching without a contract boundary; type
     safety stops at the module edge and there is no durable-work model at all. NetScript's
     boundary is an object both sides import.
   - *Encore* — infra-from-code, Go-first, its own cloud and deployment story. NetScript is
     Deno/JSR-native, runs on infrastructure you already own, and treats durable workflows as a
     first-class plugin rather than a managed add-on.
   - *NestJS* — DI-first Node, module decorators, contract typing bolted on via codegen. NetScript
     derives the client from the contract with no codegen step and no container.
   - *Temporal* — borrow the state-machine, correlation and compensation model; author it in plain
     TS builders inside your process instead of operating a separate cluster.
   - *Hono* — wrapped, not replaced. `defineService` stands up a Hono/oRPC runtime and you are
     never cut off from it.
6. **The two properties that are actually hard to retrofit** — durability and cross-layer typing.
   Argue that both are architectural: you can add a logger later, you cannot add "the client is
   derived from the contract" later without rewriting every call site, and you cannot add "state
   survives the process" later without rewriting every multi-step flow. This is the page's real
   thesis and it is currently missing.
7. **Honest trade-offs** — promote the existing "When NetScript is NOT the right tool" callout
   (127–134) into a full section, and add two more: *pre-1.0 means the surface moves*, and *one
   active auth backend at a time, only kv-oauth is fully interactive* (currently buried in the
   maturity callout at 105–107).
8. **Close** → Quickstart.

Removed from `why.vto`: §1 contract sample (→ concepts), §4 Aspire paragraph (→ concepts Idea 3),
§5 plugins paragraph (→ concepts Idea 2), §3 telemetry code tabs (→ `/observability/`), §6 fresh-ui
copy-source (→ `/web-layer/fresh-ui.md`), §7 auth code tab (→ `/identity-access/`). `why.vto`
should carry **prose and tables, and at most one code block** — it is an argument, not a tutorial.

### 2.3 `quickstart.vto` — fastest honest path

Target: **under 120 lines.** Four numbered steps, one troubleshooting block, one exit.

1. **Prerequisites** — one callout: Deno 2.x, the `aspire` CLI, a running Docker daemon (currently
   only stated on `quickstart/aspire.md`, not on the main Quickstart — a real gap: the default path
   fails without Docker and this page never says so).
2. **Step 1 — Install** — keep 41–52 (global + ad-hoc tabs) and the swap-the-command tip. Verbatim.
3. **Step 2 — Scaffold** — one command, one canonical form. **Resolve the `--service` drift with
   `index.vto`**; recommend `netscript init my-app --db postgres --service` so the workspace the
   reader gets matches the code moment on the homepage. Keep the terminal-output block (94–110)
   verbatim. Collapse the four callouts (77–89) into **one** "other options" callout: engine
   choice, `--dry-run`, `--ci --yes`, `--no-aspire`, each one clause with a link.
4. **Step 3 — Bring it up** — keep 130–138 verbatim (`cd aspire` / `restore` / `start`), keep the
   "Aspire comes before any database command" note (116–121), keep the detached-process note.
   Then `netscript db init && netscript db generate && netscript db seed` from the workspace root.
5. **Step 4 — Make your first change** (new; currently absent — the page ends at "you now have").
   The honest fastest first change: open `http://localhost:8000/design`, edit a `--ns-*` token or a
   copied `fresh-ui` component under `apps/dashboard/`, and watch it reload. It is the only change
   that needs no new concept, and the existing "Start at `/design`" tip (194–198) already argues
   for it — promote it from a tip to the step.
6. **What you see** — keep 172–183 verbatim. Trim `/examples/crud` from the bullet or list it last;
   leading the reader's first tour with the CRUD example repeats the homepage's original sin.
7. **If something doesn't come up** — keep 185–192 verbatim, add "Docker isn't running".
8. **Next** → Storefront tutorial (primary) · Core concepts · Reference.

Everything else deleted or moved — see §4.

### 2.4 `concepts.vto` — the mental model, once

Grows from 3 ideas to **4 links in one chain**, absorbing what the homepage stops duplicating.
Opening line stays close to the current one; the chain is stated up front and then walked:

> **contracts → services → plugins → web layer → observability.** Each link derives from the one
> before it, which is why drift cannot open up between them.

1. **Hero + "read this once" callout** — keep 8–19 verbatim.
2. **The picture** — keep `architecture-overview.svg` (23). It is now the *only* place this diagram
   appears.
3. **Idea 1 — The contract is the source of truth.** Keep 25–34, including both code tabs and the
   closing "one definition, many consumers" paragraph, verbatim. → `explain:contracts`,
   `/services-sdk/`.
4. **Idea 2 — Services implement contracts; the host implements nothing.** Absorbs `index.vto`
   35–45 (the "four moves" prose, including the environment-variable service resolution detail,
   which appears nowhere else and is genuinely good) and `why.vto` 89–91. Keep the existing
   manifest code tab (41), the fixed-contribution-axes paragraph (44), and
   `plugin-thread-isolation.svg` (46) verbatim. → `explain:plugin-system`, `/durable-workflows/`,
   `/identity-access/`.
5. **Idea 3 — The web layer derives from the same contract** (NEW — the missing link). Short:
   `definePage()` binds a typed route contract, its server loaders call the typed SDK client built
   from the same contract object the service implements, and only `islands/` ship JS. Name the real
   file the way `web-layer/index.md` does — `apps/dashboard/lib/example-service.ts` imports
   `UsersContractV1`. Reuse `fresh-page-model.svg` (already used on `web-layer/index.md`).
   → `/web-layer/`, `/web-layer/builders/`, `/web-layer/server/`.
6. **Idea 4 — One runtime, many resources, all traced.** Keep 50–56 and `aspire-resource-graph.svg`
   (54) verbatim. **Move the port `apiTable` (58–66) out** to `/orchestration-runtime/` — ports are
   operations, not mental model. Fold in the one-clause telemetry fact (Deno's built-in OTLP
   exporter, spans stitched scheduler → queue → worker → RPC → SSE). → `explain:aspire`,
   `/observability/`, `/orchestration-runtime/`.
7. **How the ideas connect** — keep 70–72 verbatim. It is the best paragraph on the site.
8. **Where to go next** — keep the 3-card grid (74–78) and the pre-1.0 callout (80–82).

Before landing: **verify `/capabilities/` xrefs.** `docs/site/capabilities/index.md` is a redirect
to `/`, so `cap:services` and `cap:runtime-config` currently send readers back to the homepage.
Either repoint those xrefs at the pillar pages (`/services-sdk/`, `/orchestration-runtime/`) or fix
the hub — but do not ship a concepts page whose "go deeper" links are a loop.

---

## 3. The single homepage code moment

**A saga with a compensation handler.** Not the contract, not `defineService`, not CRUD.

Reasoning: the homepage's job is one screen that says *why this and not Fresh/Next/Hono*. The
contract sample is duplicated on two other pages and any tRPC user shrugs at it. `defineService`
looks like every framework's `createApp()`. A saga with a named compensation is the one snippet
that is impossible to mistake for a website framework, it is short, and it directly cashes the hero
claim "your checkout survives the crash".

Verified against `packages/plugin-sagas-core/src/builders/define-saga.ts` (builder interface
L34–89: `.durability()`, `.state()` phase-gated to `initial`, `.on()` and `.compensate()` gated to
`state-set | handler-set`, `.build()` gated to `handler-set`; `defineSaga(id)` at L297),
`packages/plugin-sagas-core/src/public/messages.ts` (`send` L35, `schedule` L52, `sagaComplete`
L82, `sagaFail` L90), and `packages/plugin-sagas-core/src/domain/saga-context.ts` (`SagaHandler`
L19–23 — `(saga, event, context) => readonly CascadedMessage[]`; `SagaContext` L6–16 exposes
`sagaId`, `instanceId`, `correlationKey`, `state`, `message`, `attempt`, `now`, `traceparent`).

```ts
// The process can die on any line. The saga picks up where it stopped.
import { defineSaga, sagaComplete, send } from '@netscript/plugin-sagas-core';

type Checkout = { charged: boolean };

export const checkout = defineSaga('checkout')
  .state<Checkout>({ charged: false })
  .on<'payment.captured', { orderId: string }>('payment.captured', (saga, event) => {
    saga.state = { ...saga.state, charged: true };
    return [send('fulfillment.request', { orderId: event.payload.orderId })];
  })
  .on('fulfillment.confirmed', () => [sagaComplete()])
  // Fulfillment failed after the card was charged. A refund is not a retry.
  .compensate<'fulfillment.failed', { orderId: string }>(
    'fulfillment.failed',
    (saga, event) =>
      saga.state.charged ? [send('payment.refund', { orderId: event.payload.orderId })] : [],
  )
  .build();
```

Sixteen lines. It states the failure mode, the compensation, and the correlation key, and every
symbol in it is real. Caption underneath, one line: *"State persists between handlers. A crash
between `payment.captured` and `fulfillment.confirmed` resumes; it does not strand a charge."*
Link out to `/durable-workflows/sagas/` and the storefront checkout-saga chapter.

**Three corrections this snippet embeds** (all three are defects in the current `why.vto` sample at
L72–73, and none may be carried forward):

1. **`saga.state` is not mutable.** `SagaState = Readonly<Record<string, unknown>>`
   (`packages/plugin-sagas-core/src/domain/saga-state.ts:18`); the handler advances state by
   *reassigning* `saga.state = { ...saga.state, … }`. Both current `why.vto` samples do
   `saga.state.paid = true` and `saga.state.attempts += 1` — **neither type-checks against the
   published surface.** The site's flagship durability sample does not compile.
2. **`context.sagaId` is the *definition* id (`SagaId`), not the instance.** The business key is
   `context.correlationKey`, or — better, as above — the message payload. `why.vto` uses
   `context.sagaId` as an order id.
3. **`.compensate()` exists on the builder and is the whole point of a saga.** The current
   `why.vto` sample never calls it — it shows only `.on()` + `sagaFail()`, which is exactly the
   "retry loop" the surrounding prose says a saga is *not*. The homepage sample must show
   compensation or the durability claim is unsupported by its own code.

Also note for whoever writes the prose: `.state<T>()` constrains `T extends SagaState`, so a type
**alias** works and an `interface` does not (no implicit index signature). Handlers are
**synchronous** and return `readonly CascadedMessage[]`. The builder is typestate-guarded —
`.state()` only in phase `initial`, `.on()`/`.compensate()` only after `.state()`, `.build()` only
after at least one `.on()`. Reference implementation to copy from:
`packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts:12`.

Out-of-scope reference-page defects surfaced by the same verification (log, do not fix in this
slice): `docs/site/reference/sagas/index.md:170` types `sagaComplete(result: unknown)` — actually
optional; `:172` types `sagaCompensate(message, reason: string)` — actually optional; `:164` elides
the typestate parameters on `defineSaga`'s return.

**Fallback, if the owner wants typing rather than durability as the lead:** a two-line pair — the
contract object, and a `definePage()` loader calling `clients.users.list(...)` derived from it —
showing the same object on both sides of the network. It is a better fit for the "full-stack" half
of the hero but needs two files to land, which breaks the one-screen budget. Recommend durability.

---

## 4. Kill list

### Delete outright

| What | Where | Why |
| --- | --- | --- |
| `createCrudContract` tab | `index.vto` 29 | The owner's core complaint. Boring, non-differentiating, and not runnable standalone (imports `@database/zod`, generated three steps later). |
| Scaffold + bring-up tabs | `index.vto` 31–32 | Verbatim duplicate of Quickstart steps 1–3. The homepage should link, not re-teach. |
| `architecture-overview.svg` (homepage copy) | `index.vto` 47 | Byte-identical `src`/`alt`/`caption` to `concepts.vto` 23. Keep one. |
| "Build real systems, not just CRUD" heading | `index.vto` 131 | The site apologising for its own tab 1. Delete the cause, delete the apology. |
| Deploy-target enumeration | `index.vto` 92–102 | 10 lines of adapter inventory. One sentence + link to `/orchestration-runtime/`. |
| Pain 4, "A DI container you didn't want" | `why.vto` 29 | Argues against a strawman Deno teams never adopted. Weakest of the seven. |
| Duplicate Encore/NestJS `desc` | `why.vto` 117–118 | Same string twice. Rewrite both separately or drop one. |
| Fluent `createService(...).withCors()…` chain | `quickstart.vto` 166–168 | 9-method chain in a quickstart tip. Reference material. |
| `issue #1090` reference | `quickstart.vto` 221 | Internal tracker id on a public marketing-adjacent page. |
| Port `apiTable` | `concepts.vto` 58–66 | Operations detail, not mental model. |
| 3 of the 4 pre-scaffold callouts | `quickstart.vto` 77–89 | Four callouts before the reader has run anything. Collapse to one. |

### Move (destination named)

| What | From | To |
| --- | --- | --- |
| "One contract, four moves" prose incl. env-var service resolution | `index.vto` 35–45 | `concepts.vto` Idea 2 |
| Plugin-mechanism prose (manifest → contributions → host) | `index.vto` 62–69 | `concepts.vto` Idea 2 |
| `netscript plugin install worker` terminal output | `index.vto` 71–73 | `quickstart.vto`, optional step |
| Agent 3-card grid (MCP / skills / CLI) | `index.vto` 125–129 | `/ai/` — homepage keeps one line + link |
| "Who it is for" 4 cards | `index.vto` 147–152 | `why.vto`, as the opening "who this is for" section |
| Desktop-lane "coming next" callout | `index.vto` 104–108 | `/orchestration-runtime/` (roadmap-flavoured, not a homepage claim) |
| Contract code tabs | `why.vto` 62–65 | already in `concepts.vto` 29–32 — delete the `why.vto` copy |
| Aspire paragraph | `why.vto` 85–87 | `concepts.vto` Idea 4 |
| Composable-plugins paragraph | `why.vto` 89–91 | `concepts.vto` Idea 2 |
| Telemetry code tabs | `why.vto` 80–83 | `/observability/` |
| fresh-ui copy-source paragraph | `why.vto` 93–95 | `/web-layer/fresh-ui.md` |
| Auth backend code tab + maturity callout | `why.vto` 101–107 | `/identity-access/` — `why.vto` keeps the one-line trade-off |
| "See the framework code" `defineService` block | `quickstart.vto` 146–168 | `/services-sdk/services/` |
| Workspace layout + agent anchors | `quickstart.vto` 200–221 | `/ai/agent-tooling/` and a new workspace-layout reference page |

### Fix in place

- **Pre-1.0 callout appears on all four pages** in four different wordings. Make it one shared
  component, one wording, one line, rendered identically everywhere.
- **`--db` engine list and `--no-aspire`** appear on all four pages. Canonical home:
  `quickstart.vto` step 2 (one clause each). Everywhere else: link.
- **`--service` drift** — `index.vto` scaffolds with `--service`, `quickstart.vto` without. Pick
  one; recommend `--service` so the scaffold matches the homepage code moment.
- **Docker prerequisite** is stated on `quickstart/aspire.md` but not on `quickstart.vto`, whose
  default path fails without it.
- **`/capabilities/` is a redirect stub to `/`.** Audit every `cap:*` xref and `/capabilities/`
  link on these four pages before shipping — currently several "go deeper" paths are loops back to
  the homepage.
- **`why.vto` saga sample** — `context.sagaId` → `context.correlationKey`, and add a
  `.compensate()` call so the sample demonstrates the thing the prose claims.
- **`<title>` on the homepage** — "the enterprise-grade meta-framework for Deno" is the least
  credible string on a `0.0.x` site and it is what search results show. Replace.
