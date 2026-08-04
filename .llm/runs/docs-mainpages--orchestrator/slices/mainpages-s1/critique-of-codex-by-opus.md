# Critique of `outline-codex.md` — adversarial lane (Opus)

Slice: `mainpages-s1` · critique only · no `docs/site` edits, no commits.
Target: `.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s1/outline-codex.md`.
Comparator: `outline-opus.md` (same slice, generator A).

Every objection below is claim-level and checkable. Where verification refuted **my own** prior
position rather than Codex's, that is recorded as such (§1.1, §3.1) — the point of this lane is the
verdict, not the win.

Method note: all snippets were type-checked as standalone files against the real package
entrypoint (`packages/plugin-sagas-core/mod.ts`) outside the repo's `deno.json` exclude rules;
all route destinations were resolved against `docs/site/` with a four-shape probe
(`X.md`, `X.vto`, `X/index.md`, `X/index.vto`).

---

## 1. Objections

### 1.1 The homepage code moment omits `.compensate()` — the one feature that makes it a saga

**Verdict: the strongest substantive objection against Codex's outline.**

Codex's §3 snippet is `defineSaga → .state → .on → .on → sagaComplete`. It is a linear
forward path. Nothing in it distinguishes a saga from a two-step event handler with persistence.

The package's own README names compensation as the differentiator
(`packages/plugin-sagas-core/README.md:28`):

> **Compensation as a first-class handler** — `.compensate()` registers the unwind path next to
> the forward path, and `sagaCompensate` triggers it from any handler.

And the builder exposes it as a peer of `.on()` with identical phase gating
(`packages/plugin-sagas-core/src/builders/define-saga.ts:65-70`).

The damage is that Codex's own caption writes a cheque the snippet does not cash:

> "The process can die after payment and restart before inventory."

That is a *crash-recovery* claim. The snippet shows no failure path at all. Worse, Codex's own
`/why/` §3 argument text sells "sagas persist multi-step state **and compensation**", and its
homepage proof point 2 says "sagas persist multi-step state and compensation" — so the page's
single code moment fails to demonstrate a term the page uses twice. Codex correctly adds a
disclaimer that persistence must not be claimed from the snippet alone; it does not notice that
compensation is *shown-able* and simply absent.

The interesting failure mode: the current `why.vto` sample (L72) has exactly the same defect — it
uses `.on()` + `sagaFail()` and never compensates, which is precisely the "retry loop" the
surrounding prose insists a saga is not. Codex proposes deleting that sample (correct) but then
reproduces its central weakness on the homepage.

**Evidence:** `packages/plugin-sagas-core/README.md:28`;
`packages/plugin-sagas-core/src/builders/define-saga.ts:65-70`;
`docs/site/why.vto:72-73`; `outline-codex.md` §3 and §2 proof point 2.

### 1.2 Codex's Quickstart success criterion checks for a resource its own scaffold command does not create

Codex §Quickstart-4:

> "Confirm that the Fresh app **and service resources** are healthy"

after Codex §Quickstart-3 prescribes:

```bash
netscript init my-app --db postgres
```

`--service` defaults to **false** (`packages/cli/src/maintainer/features/init/init-command.ts:58`):

```ts
.option('--service [enabled:boolean]', 'Scaffold an example oRPC service', { default: false })
```

So on Codex's own happy path there is no example oRPC service resource to be healthy. The success
check is unfalsifiable-as-written at best and wrong at worst. This is a real gap because the same
outline (§"Non-negotiable authoring checks") demands the authoring slice verify generated files
against the scaffold fixture — the discipline is stated and then not applied to the command Codex
itself picked.

Note this is the same `--service` drift I flagged in `outline-opus.md` §1.4 (`index.vto` tab 3
scaffolds *with* `--service`; `quickstart.vto` step 2 *without*). Codex does not identify the drift
at all, and then resolves it silently in the direction that breaks its own success check.

**Evidence:** `packages/cli/src/maintainer/features/init/init-command.ts:58`;
`docs/site/quickstart.vto:73,131`; `docs/site/index.vto` tab 3.

### 1.3 The Quickstart "first change" is deferred, not designed

Codex §Quickstart-5 proposes changing "one heading string" in "the scaffolded dashboard's visible
welcome route/file named in the current scaffold output", then hands the actual identification to a
later slice: "The authoring slice must verify the exact generated file against the current scaffold
fixture before publishing; do not guess a route path in prose."

The caution is right. The outline is still incomplete on the one section Codex correctly identifies
as the page's biggest missing piece. An outline whose novel contribution is "add a first change"
and which then does not name the change has moved the problem downstream, not solved it. It is also
the most brittle possible choice: a scaffolded welcome heading is exactly the string most likely to
churn between releases, so the doc acquires a permanent verification tax.

Compare `outline-opus.md` §2.3 step 5, which names a concrete target that already has an argument
for it on the existing page — open `/design`, edit a `--ns-*` token or a copied `fresh-ui`
component under `apps/dashboard/`, watch it reload. It needs no new concept and the current page's
"Start at `/design`" tip (`docs/site/quickstart.vto:194-198`) already makes the case; the step is a
promotion of existing verified copy rather than a forward reference.

### 1.4 Codex flags "the comparison does not make the locked contrasts" but misses the visible copy-paste defect

Codex's §Why/Duplication says the competitor table "fails to directly answer 'why not bare Fresh?',
'why not Next?'". That is correct and confirmed — there is no Fresh row and no Next row in
`docs/site/why.vto:113-124`.

What Codex misses is that the table contains a literal duplicated string. `NestJS` (L117) and
`Encore` (L118) carry the **same** `desc` clause verbatim:

> "NetScript is Deno-native and JSR-distributed, leads with oRPC contract-first typing end to end,
> and treats durable workflows as first-class — not a backend framework you bolt a workflow engine
> onto."

A reader evaluating NetScript against Encore reads the NestJS answer with the name swapped, and the
tell is visible on the page. This is a shipped-quality defect on the highest-intent page on the
site, and an inventory pass is exactly where it should have surfaced.

**Evidence:** `docs/site/why.vto:117-118`.

### 1.5 "Delete the Temporal row" discards the best available explainer for Codex's own thesis

Codex's kill list: "Delete the current competitor rows for NestJS, tRPC, Temporal, and
Hono-as-a-competitor. … Temporal is a durability reference point; neither answers the locked buyer
question."

But Codex's `/why/` §3 heading is *"Types describe the boundary; durability describes what happens
next"* and its hero is *"For teams whose TypeScript app has become a system."* For that buyer,
"Temporal's model, authored in plain TS builders inside your process, without operating a separate
cluster" is the single most information-dense sentence available — it conveys state machine,
correlation, compensation, and the operational trade in one line, to a reader who already knows
what Temporal is. The existing row (`docs/site/why.vto:121`) already says exactly this and says it
well.

Codex's argument for deletion is that Temporal is a "reference point" rather than a competitor.
That is the reason to **keep** it, relabelled — a comparison table's job on a decision page is
calibration, not only substitution. Deleting it removes the only anchor the page has for the
durability half of Codex's own thesis, leaving that half argued entirely in NetScript's own
vocabulary.

Same reasoning applies more weakly to Hono: Codex's replacement row already reinstates it ("NetScript
uses Fresh/Hono underneath"), so the kill-list entry and the §4 replacement contradict each other.

### 1.6 The `/deployment/` link is conditional in a document that forbids conditional links

Codex §Why-4 links: "`/deployment/` **if that route exists at authoring time**; otherwise link the
current deployment reference from site navigation."

Verified: `/deployment/` **does not exist** in `docs/site/` (probed `.md`, `.vto`, `/index.md`,
`/index.vto`). Meanwhile Codex's own non-negotiables say "Check every local destination exists."
The hedge is honest but it is the one destination the outline could have resolved in the time it
took to write the hedge, and it is the only miss in an otherwise clean set.

Credit where due: **every other route Codex names resolves.** All 28 others were probed and hit —
including the non-obvious ones (`explanation/durability-model.md`,
`data-persistence/how-to/database-migration.md`,
`orchestration-runtime/how-to/add-a-plugin.md`, `tutorials/storefront/04-checkout-saga.md`,
`tutorials/live-dashboard/index.md`, `web-layer/{server,builders,query}.md`,
`services-sdk/{services,sdk}.md`, `ai/agent-tooling.md`, `reference/contracts/index.md`). The
`#prefer-no-orchestration` anchor also resolves — `docs/site/quickstart/aspire.md:64` is
`## Prefer no orchestration?`. This is the most rigorously link-verified part of either outline.

### 1.7 Structural weakness: five concepts sections, no compression test

Codex replaces the concepts page's three ideas with five (contracts → services → plugins → web
layer → observability) and argues the three-idea framing "is what made the web layer disappear."

The diagnosis is right (see §3.2 — I concede this). The construction is not obviously right. Codex's
five stages include **services** as a peer of **contracts**, but its own §3 description of services
is largely "a service implements the contract and exposes oRPC, OpenAPI/Scalar, health, and
telemetry through the service runtime" — that is a *consequence* of the contract plus a pointer to
the runtime, not an independent idea a first-time reader needs as a top-level chapter. A reader
counting to five on a page whose stated job is "the model once" is being asked to hold more than
the model requires.

The tell is that Codex's own §7 recap collapses the five back into one sentence that mentions
services only as a transit point ("A typed checkout command enters a service; the service starts a
saga"). If the recap can drop a stage to a subordinate clause, the stage was not load-bearing at the
top level. Four links — contracts → plugins/runtimes → web layer → observability, with services as
the second half of the contracts section — carries the same content at lower cognitive cost.

### 1.8 Codex assigns the pre-1.0 notice inconsistently

Codex §Homepage-1 puts a pre-1.0 note "beside/below the CTAs"; §Quickstart-1 adds "One small
pre-1.0 pin note"; §Why-5 makes it a trade-off bullet; §Concepts kill list says "Delete the
duplicated Pre-1.0 block; one site-level/banner treatment is preferable." That is four different
treatments across four pages, in an outline whose whole thesis is de-duplication — and the
duplication it condemns on `concepts.vto` is reinstated on three other pages by the same document.
`outline-opus.md` §4 states the resolution Codex is groping toward: one shared component, one
wording, one line, rendered identically. Codex should have said it once, in one place.

---

## 2. Comparative calls

### 2.1 Hero claim — **Codex loses on the homepage, wins on `/why/`**

| | Homepage hero |
| --- | --- |
| Codex | "Build the Deno app that keeps working after the request ends." |
| Opus | "Your checkout survives the crash. Your types survive the refactor." |

Codex's line is well-constructed and its rationale is sound ("after the request ends" conveys
durability without naming Temporal). Its weakness is that it is **single-axis**. It sells durability
and says nothing falsifiable about typing — yet Codex's own subhead immediately claims "typed
full-stack", and its own proof point 1 is "Typed from page to process". A hero that its own first
proof point does not follow from is doing half its job.

There is a second, subtler cost: "keeps working after the request ends" is a description of
background jobs. Every queue library on earth clears that bar. The claim does not separate NetScript
from BullMQ + a cron, which is the actual thing the target buyer is choosing against.

The Opus line commits to both differentiating axes with two falsifiable promises and names the two
failure modes the buyer has personally experienced. Recommend the Opus hero.

**Why NetScript**, however, goes the other way. Codex's *"For teams whose TypeScript app has become
a system"* is better than anything in `outline-opus.md` §2.2, which keeps the existing tagline
("assemble a backend from a dozen libraries that have never met"). Codex is right that the existing
line is an *opening argument*, not a hero — it describes a problem, not a reader. "…has become a
system" names the consumer, names the inflection point at which NetScript starts paying, and
implicitly disqualifies the wrong reader in seven words. This is the single best line in either
outline. **Adopt Codex's `/why/` hero and demote the existing tagline exactly as Codex proposes.**

### 2.2 Proof points — **near-tie, Codex marginally stronger on discipline, Opus on evidence**

Codex's three ("Typed from page to process" / "Work survives the worker" / "The whole system is
visible") are tighter as *headings* and Codex is right to forbid a card grid under them.

Two concrete places Opus's are stronger:

- **Codex's proof point 3 omits the one genuinely uncommon fact.** Both outlines cover Aspire
  bring-up + traces. Only `outline-opus.md` §2.1 surfaces "no OpenTelemetry SDK dependency by
  default" — currently buried mid-paragraph in `docs/site/index.vto:49-53`. On a page whose problem
  is that every claim sounds like every other framework's claim, a fact competitors *cannot* copy
  is worth more than the third restatement of "one dashboard".
- **Codex's proof point 1 links to `/explanation/contracts/` but names no artifact.**
  `docs/site/web-layer/index.md` already tells the cross-layer story with a real file
  (`apps/dashboard/lib/example-service.ts` importing `UsersContractV1`). Naming it costs six words
  and converts an assertion into something a skeptic can go verify.

Conversely Codex is right on one thing Opus got wrong: **`:18888` should not appear on the
homepage.** `outline-opus.md` §2.1 proof point 3 says "Include the `:18888` dashboard". Verified,
the port is configurable — `ASPIRE_DASHBOARD_PORT` (`env-file-values.ts:213`,
`env-file-content.ts:285`), defaulting to 18888. Codex's rule ("use the URL printed by
`aspire start`, not a hard-coded `:18888`") is correct and should override the Opus text
everywhere, including on `concepts.vto` where the port is currently hardcoded twice
(`docs/site/concepts.vto:56,61`).

### 2.3 Code moment — **same call, Codex's form is more canonical, Opus's is more persuasive**

Both outlines independently chose **a saga**, and both rejected the CRUD contract, `defineService`,
and scaffold output. That convergence is the most reliable signal in this slice: the recommendation
is safe.

**Where Codex is right and my prior analysis was wrong.** `outline-opus.md` §3 asserts that
`saga.state.status = 'paid'` "does not type-check against the published surface" and that "the
site's flagship durability sample does not compile." **That claim is false and is withdrawn.** Both
snippets were compiled as standalone files against `packages/plugin-sagas-core/mod.ts`:

```
==== CODEX ====   Check critsnip/codex.ts     (clean)
==== OPUS ====    Check critsnip/opus.ts      (clean)
```

The reasoning error was mine: although `SagaState = Readonly<Record<string, unknown>>`
(`src/domain/saga-state.ts:18`), the handler receives `saga: { state: TState }` where `TState` is
the caller's own type alias intersected with `SagaState`. Named mutable properties resolve against
the alias, not the readonly index signature, so property assignment is legal. It is also correct at
runtime: the engine hands the handler a **mutable structured clone**, not the frozen envelope —
`const saga = { state: cloneState(baseState) }` (`src/runtime/saga-engine.ts:238`) with
`cloneState = structuredClone` (`:466-468`). Codex's mutation form is additionally the
**canonical documented form**, matching `packages/plugin-sagas-core/README.md:58-84` line for line.

Codex therefore wins on fidelity: its snippet is the README's own shape, so it will not drift from
the package's canonical example.

The Opus snippet still wins on *argument*, for the reason in §1.1: it shows `.compensate()`, which
is what makes the block unmistakably not a job queue. It is also honest about a second real defect
Codex never flags — the current `why.vto` sample uses `context.sagaId` as an order id, but `sagaId`
is the **definition** id (`SagaId`), not the instance; the business key is `context.correlationKey`
(`src/domain/saga-context.ts:6-16`). Codex proposes deleting that sample without diagnosing why it
is wrong, so the lesson is not carried into S2/S3 authoring guidance.

**Recommended synthesis:** Codex's README-aligned mutation style and typed-payload generics, plus
the Opus `.compensate()` branch and its caption. Concretely — keep `.state<T>()` with a type
**alias** (not an `interface`: `T extends SagaState` needs the implicit index signature), keep
`saga.state.x = …` since it matches the README, and add one `.compensate()` arm so the refund path
is visible. Reference implementation to copy from:
`packages/plugin-sagas-core/tests/runtime/checkout-saga-contract_test.ts` (note it uses the
spread-reassign form at `:16,33,48`; both forms compile, so prefer the README's for doc
consistency).

### 2.4 Kill list — **Codex is more aggressive; roughly two-thirds of that aggression is right**

Codex deletes more, and mostly correctly: the deploy matrix, the agent section with its volatile
counts, the nine-card grid, "Build real systems, not just CRUD", "Who it is for", both bottom
grids. Verified that the volatile-counts objection is real — `docs/site/index.vto:126,128` hardcode
"13 token-bounded tools", "17 allowed command prefixes, 6 explicit denies". Those are guaranteed to
rot and they are on the homepage. Codex's call to move them to `/ai/agent-tooling/` is right.

Three places Codex over-cuts:

1. **The nine-pillar grid.** Codex deletes it outright ("the homepage is not `/capabilities/`").
   But Codex's own §1.7-adjacent finding is that `/capabilities/` is a redirect — so deleting the
   grid removes the *only* surface on the site where the nine pillars are visible together, and
   Codex replaces it with a three-link exit strip that names none of them. `outline-opus.md` §2.1
   is better here: **keep the grid, kill the apologetic heading.** The heading was the defect; the
   grid is the site map.
2. **The plugin `featureGrid` bodies** (`docs/site/index.vto:76-81`). Codex deletes the grid and
   preserves only the phrase "Durable multi-step workflows with compensation". The other bodies are
   the best-written copy on the site — "at-least-once delivery keyed on `idempotencyKey`", "saga
   state persists, so a crash mid-flow resumes". That is the exact register both outlines say the
   whole site should adopt. Deleting it discards the style exemplar along with the section.
3. **The `netscript plugin install worker` terminal output.** Codex deletes it as homepage clutter
   (agreed) but assigns it nowhere. It is real, verifiable, and concrete; `outline-opus.md` §4
   relocates it to Quickstart as an optional step. Move, do not delete.

One place Codex under-cuts: it never proposes replacing the homepage `<title>`, which currently
carries "the enterprise-grade meta-framework for Deno". Codex bans "enterprise-grade" from the hero
(correct) but the `<title>` is what search results render, so the banned adjective survives in the
highest-impression string on the site. Codex's own kill list should have caught this.

### 2.5 Where Codex is simply better

- **`/capabilities/` handling.** Both outlines found the redirect
  (`docs/site/capabilities/index.md` is a four-line front-matter stub: `layout: layouts/redirect.vto`,
  `redirectTo: /` — confirmed). Codex draws the sharper operational conclusion and states it as a
  standing rule: "it is not a destination and must not be used as a catch-all link. Link directly
  to the real pillar pages," plus an explicit kill-list entry deleting the `/capabilities/` CTA.
  Opus flagged it as an audit item; Codex turned it into a constraint.
- **Route verification discipline.** 28 of 29 destinations resolve, and the one that does not is
  explicitly hedged. Neither outline should ship a link Codex did not check.
- **`/quickstart/aspire/` role reassignment.** Codex's instruction that the subsidiary page "must
  stop calling itself the shortest path once the main quickstart owns that role" is a real
  structural conflict Opus did not name at all.
- **Non-CRUD naming in concepts.** Codex bans `users.list` from the concepts contract example and
  requires an order/checkout-shaped boundary instead. Opus proposed keeping the existing contract
  tabs verbatim — which preserves the CRUD-shaped example on the very page whose job is to show
  that a contract is a cross-layer boundary rather than typed CRUD. Codex is right.

---

## 3. Adoption list — Codex ideas that should win

Ranked by how much they change the output.

1. **`/why/` hero: "For teams whose TypeScript app has become a system."** (§2.1) Best line in
   either outline. Adopt with its subhead, and adopt the immediately-following non-consumer
   sentence (static site / short-lived prototype / single request-response service → Fresh or Hono).
   Naming the non-consumer in the first screen is what makes the page a decision memo rather than a
   pitch.

2. **No hard-coded `:18888` anywhere; the printed dashboard URL is authoritative.** (§2.2)
   Verified configurable via `ASPIRE_DASHBOARD_PORT`. This overrides `outline-opus.md` §2.1 and
   additionally requires fixing `docs/site/concepts.vto:56,61` and `docs/site/quickstart.vto:174`.

3. **`/capabilities/` is a redirect, therefore a banned link target.** (§2.5) Promote from audit
   item to hard authoring rule, including deleting the existing `/capabilities/` CTA on `why.vto`
   and repointing `cap:*` xrefs on `concepts.vto` at real pillar pages.

4. **Concepts must absorb the web layer as a first-class stage.** Codex's diagnosis is better than
   mine: the three-idea framing is not merely *missing* the web layer, it is the *cause* of the
   omission — three slots were already spent. Adopt the diagnosis. (Adopt four stages rather than
   five, per §1.7: contracts+services → plugins/runtimes → web layer → observability.)

5. **Codex's README-aligned snippet mechanics.** (§2.3) `.state<T>()` with a type alias, typed
   `.on<'Type', Payload>()` generics, and `saga.state.x = …` mutation matching
   `packages/plugin-sagas-core/README.md`. This corrects a false claim in `outline-opus.md` §3 and
   keeps the homepage snippet from drifting from the package's canonical example — but add the
   `.compensate()` arm per §1.1.

6. **Volatile counts off the homepage.** (§2.4) "13 tools / 17 prefixes / 6 denies"
   (`docs/site/index.vto:126,128`) → `/ai/agent-tooling/`. Correct and verified.

7. **Non-CRUD naming in the concepts contract example.** (§2.5) An order/checkout boundary, not
   `users.list` pagination. Enforces the slice's actual goal on the page most likely to undermine it.

8. **`/quickstart/aspire/` demoted to troubleshooting/alternative companion**, and it must stop
   claiming to be the shortest path. (§2.5)

9. **"Delete the redundant answer table" on `/why/`.** Codex is right that the eight-row table and
   the seven-pain list are the same content twice. Opus proposed *merging* them into a
   three-column table; Codex's deletion is cleaner, provided the "what you give up" column survives
   somewhere — fold it into the §5 trade-offs section Codex already keeps visible.

10. **The standing authoring rules in Codex's closing section.** "One proposition per page; one
    homepage code block; one architecture diagram across the four pages; no CRUD example above the
    fold anywhere," plus "do not add a feature merely because it is real." These are the right
    invariants for S2/S3 and neither outline states them more crisply.

### Rejected from Codex

- Homepage hero (§2.1 — single-axis; use the Opus two-promise line).
- Snippet without `.compensate()` (§1.1).
- Deleting the nine-pillar grid and the plugin `featureGrid` bodies (§2.4).
- Deleting the Temporal row (§1.5).
- Five top-level concepts stages (§1.7).
- Quickstart success criterion naming service resources under a `--service`-less scaffold (§1.2),
  and the unresolved "first change" (§1.3).

### Carried forward from Opus, not present in Codex

- `context.sagaId` → `context.correlationKey` in any saga sample (`src/domain/saga-context.ts:6-16`).
- Homepage `<title>` still says "enterprise-grade" (§2.4).
- `--service` scaffold drift between `index.vto` and `quickstart.vto` (§1.2).
- Docker prerequisite is stated on `quickstart/aspire.md` but not on `quickstart.vto`, whose
  default path fails without it.
- Duplicate NestJS/Encore `desc` string (`docs/site/why.vto:117-118`) (§1.4).
- One shared pre-1.0 component, one wording, all four pages (§1.8).
- Out-of-scope reference defects logged for later:
  `docs/site/reference/sagas/index.md:170` types `sagaComplete(result: unknown)` — actually
  optional; `:172` types `sagaCompensate(message, reason: string)` — actually optional.
