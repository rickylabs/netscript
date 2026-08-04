# Adversarial critique of `outline-opus.md`

## Verdict

The rival correctly identifies the page-role collision, the CRUD-first positioning failure, the
missing web layer in Core concepts, the absent target consumer on Why, and the missing “first
change” in Quickstart. Its strongest editorial move is to make durability the first homepage proof
and use a saga rather than a CRUD contract as the only code moment.

It is not safe to adopt as written. Several repo claims are false, including its flagship claim
that the current saga samples do not type-check, its claim that two `cap:*` links loop through
`/capabilities/`, and its “32 tellings” count. Its replacement saga compiles but does not activate
the compensation it claims to demonstrate. Structurally, it also recreates the homepage bloat with
a nine-pillar grid and three extra promotional one-liners, keeps Quickstart as a tour rather than a
path, and preserves too much detailed exposition in Core concepts.

## 1. Factual objections

### 1.1 The `why.vto` saga state-mutation diagnosis is false

Rival claim (§3, lines 380–384):

> `saga.state` is not mutable ... Both current `why.vto` samples ... neither type-checks against
> the published surface.

This is contradicted by the public types and a direct worktree check.

- `packages/plugin-sagas-core/src/domain/saga-state.ts` defines `SagaState` as
  `Readonly<Record<string, unknown>>`, but the handler receives
  `saga: { state: TState }` in `src/domain/saga-context.ts`. The `state` property is assignable.
- `SagaBuilder.on()` supplies `SagaHandler<TState & SagaState, ...>`. Intersecting an inferred
  `{ paid: boolean }` or `{ attempts: number }` with a readonly string index signature does not
  make those explicitly declared properties readonly.
- A direct `deno eval --unstable-kv` against `packages/plugin-sagas-core/mod.ts` successfully built
  both current forms: `saga.state.paid = true` and `saga.state.attempts += 1`.
- The package itself includes a test named “native runtime persists transition from snapshot
  before in-place mutation” in `packages/plugin-sagas-core/tests/runtime/saga-store_test.ts`;
  mutability is an intentional supported behavior, not an accidental docs escape.

Reassignment with `{ ...saga.state, charged: true }` is valid, but it is an alternative style, not
a correction required for compilation. The critique must not label the current samples broken on
this basis.

### 1.2 The rival compensation example does not execute its compensation path

Rival claim (§3, lines 363–374): the `.compensate('fulfillment.failed', ...)` handler demonstrates
that fulfillment failure emits a refund and supports the caption that the saga resumes without
stranding a charge.

The repo runtime says otherwise:

- `.compensate(type, handler)` only registers a handler in the definition’s compensation map
  (`packages/plugin-sagas-core/src/builders/define-saga.ts`).
- `SagaCompensator.compensateCascaded()` looks up that handler by the type of the message carried by
  a `CascadedMessage<'compensate'>`.
- The canonical runtime test returns
  `sagaCompensate({ type: 'payment.refund', ... }, reason)` from a forward `.on(...)` handler and
  separately registers `.compensate('payment.refund', ...)`
  (`packages/plugin-sagas-core/tests/runtime/saga-store_test.ts`).
- The durable-sagas page states the same routing rule: a forward handler returns
  `sagaCompensate(...)`, which routes to the matching `.compensate(type, ...)` handler.

The rival snippet imports no `sagaCompensate`, has no `.on('fulfillment.failed', ...)`, and emits no
compensate cascade. Receiving a normal `fulfillment.failed` message therefore cannot call the
registered compensation handler. The snippet registers dead behavior while claiming to show the
product’s defining behavior.

A correct compact version needs a forward handler such as:

```ts
.on<'fulfillment.failed', Failure>('fulfillment.failed', (_saga, event) => [
  sagaCompensate(
    { type: 'payment.captured', payload: event.payload },
    event.payload.reason,
  ),
])
.compensate<'payment.captured', Payment>('payment.captured', (_saga, event) => [
  send('payment.refund', { orderId: event.payload.orderId }),
])
```

That is longer, which is a real homepage-budget trade-off. My simpler state-transition + explicit
completion sample is less ambitious but does not advertise an unconnected compensation path.

### 1.3 `.compensate()` is not “the whole point of a saga,” and `sagaFail()` is not a retry loop

Rival claim (§3, lines 388–391): the current `.on()` + `sagaFail()` sample is “exactly the retry
loop” criticized by its prose.

Nothing in that code retries. `sagaFail()` creates a terminal failure cascade; the native runtime
persists terminal failed status (`saga-store_test.ts`, “persists terminal status from failure and
compensation cascades”). Durable state, correlation, terminal outcomes, scheduling, and explicit
effects remain saga properties even when a specific workflow has no compensation. Compensation is
important for the checkout pitch, but absence of `.compensate()` does not turn a state machine into
a retry loop.

### 1.4 The “type alias works, interface does not” assertion is false on this surface

Rival claim (§3, lines 393–395): `.state<T>()` accepts a type alias but not an interface because an
interface lacks an implicit index signature.

A direct worktree check succeeds:

```ts
interface Checkout { charged: boolean }

defineSaga('x')
  .state<Checkout>({ charged: false })
  .on('go', () => [])
  .build();
```

This was evaluated against `packages/plugin-sagas-core/mod.ts` with Deno 2.9 in the current
worktree. The proposed authoring warning should be deleted.

### 1.5 The replacement snippet does not “state ... the correlation key”

Rival claim (§3, line 372): “It states the failure mode, the compensation, and the correlation
key.”

The snippet never calls `.correlate(...)`, never supplies a `correlationKey`, and never reads the
handler context. It does not state a correlation rule or key. The only business identifier is
`event.payload.orderId`. This matters because the same outline correctly criticizes current prose
for confusing saga definition ID with instance/business identity; it then claims correlation proof
that its own replacement does not contain.

### 1.6 The `context.sagaId` objection is valid but incompletely framed

The rival is right that `context.sagaId` is the saga definition ID, not an order ID:
`SagaContext.sagaId` is `SagaId`, while `instanceId` and `correlationKey` are separate fields in
`packages/plugin-sagas-core/src/domain/saga-context.ts`.

However, “the business key is `context.correlationKey`” is not universally correct. A correlation
key is runtime routing identity; the domain order ID should remain in the typed event payload when
the effect payload requires an order ID. The rival’s later choice to use `event.payload.orderId` is
the correct fix. Adopt the finding, not the generalized replacement rule.

### 1.7 The capability-xref loop claim is false

Rival claims (§1.3 lines 110–112 and §2.4 lines 325–328) that `cap:services` and
`cap:runtime-config` resolve into `/capabilities/` and therefore bounce back to the homepage.

`docs/site/_data/xref.ts` currently maps:

- `cap:services` → `/services-sdk/services/`
- `cap:runtime-config` → `/orchestration-runtime/runtime-config/`

Both are direct deep pages. `cap:index` maps to `/`, and literal `/capabilities/` links hit the
redirect stub, but the two xrefs used as examples do not. The correct action is to remove or
replace literal `/capabilities/` calls-to-action on the four pages, not to audit/repoint already
correct `cap:services` and `cap:runtime-config` entries.

### 1.8 The duplication matrix totals 33, not 32

The rival’s matrix (§1.5) has ten rows with page counts:

`3 + 3 + 3 + 4 + 4 + 4 + 2 + 4 + 2 + 4 = 33`.

Its “Ten facts, 32 tellings” conclusion is an arithmetic error. Whether each checkmark survives a
semantic audit is separate; the count is internally wrong even on its own evidence.

### 1.9 The homepage component counts are not exact

Rival claim (§0, lines 17–18): `index.vto` carries nine `<h2>` elements and 30+ outbound links.

Repo counts:

- `rg -c '<h2>' docs/site/index.vto` → **8**, not 9.
- `rg -c 'comp.featureGrid'` → 5 and `rg -c 'comp.tabbedCode'` → 3, which are correct.
- Literal `href:` properties total **28**. There may be additional anchor links embedded inside
  prose, so “30+ outbound links” needs a defined counting method; it is not established by the
  outline.

The high-level bloat diagnosis stands without inflated counts. Use reproducible measures.

### 1.10 The CRUD tab has a sequencing dependency, not an import-ordering/API bug

The rival is right that the first tab cannot run in a brand-new scaffold before database generation:
the tab itself says `@database/zod` is emitted by `netscript db generate` in tab 4. This is a real
homepage-code defect because the first sample depends on a later operational step.

But the `createCrudContract` import is correct at `@netscript/contracts/crud`. The package exports
it from `packages/contracts/crud.ts`, and its options match the tab’s entity/create/update schemas.
`deno doc --filter createCrudContract packages/contracts/mod.ts` fails only because the symbol is
intentionally on the `./crud` subpath, not the root entrypoint. Call this a generated-import
sequencing dependency, not a `createCrudContract` import-ordering or public-API bug.

### 1.11 “Keep the plugin bodies verbatim” conflicts with source alignment

The rival repeatedly recommends retaining homepage plugin bodies verbatim (§1.1 lines 63–65,
§2.1 lines 183–187), but it did not verify their operational claims. For example, the worker body
states “at-least-once delivery keyed on `idempotencyKey`” and lists four task runtimes; the stream
body makes a “no database required” storage claim. Under `SCOPE-docs`, concrete prescriptive/product
claims need code, reference, or RFC alignment. Their specificity is good, but “verbatim” cannot be
locked before that audit.

### 1.12 Several competitor claims are absolutes unsupported by this repo audit

Examples:

- “Fresh ... has no service, contract, job, saga, or orchestration story.”
- Next.js “type safety stops at the module edge.”
- NestJS has “contract typing bolted on via codegen.”
- Encore is “Go-first” and durable workflows are a “managed add-on.”

These claims concern current external products and were not sourced or verified in the outline.
They should not be carried into docs as factual absolutes. The safer, checkable comparison format
is about what NetScript itself includes and the buyer’s center of gravity: bare Fresh supplies the
web foundation NetScript builds on; a Next-centered choice prioritizes React/Next’s ecosystem;
Encore-style stacks prioritize their integrated infra model; DIY preserves component choice. Any
more exact competitor claim requires current primary-source verification during authoring.

### 1.13 The proposed fixed `:18888` dashboard URL is weaker than current Aspire guidance

The rival says homepage proof 3 should “Include the `:18888` dashboard” and Quickstart should keep
the fixed URL material. `quickstart/aspire.md` already gives the safer truth: open the dashboard URL
printed by `aspire start`, with `:18888` described only as conventional. The main Quickstart also
describes ports as collision risks. A fastest-path page should treat Aspire’s printed/resource URL
as authoritative, not turn a convention into the success criterion.

### 1.14 The `--service` recommendation is not justified by its stated reason

The rival recommends adding `--service` to Quickstart “so the workspace ... matches the code moment
on the homepage.” Its homepage code moment is a saga definition, not an example oRPC service, and
`--service` only scaffolds an example service (`packages/cli/src/public/features/init/init-command.ts`).
It does not install or demonstrate the saga plugin. The flag drift should be resolved by choosing
the smallest scaffold that supports Quickstart’s actual success criterion, not by tying it to an
unrelated homepage snippet.

## 2. Outline decisions weaker than the Codex proposal

### 2.1 It violates “one screen” immediately after declaring that budget

The locked homepage role is one hero, three proof points, one code moment, and links out. The rival
then adds:

- four durability cards under proof 1;
- a closing grid of all nine pillars with full bodies;
- three additional promotional one-liners for maturity, agents, and deployment;
- three hero CTAs including GitHub.

That is another capability directory, precisely the structure the owner rejected. Nine pillar
cards are not “one link row” in any meaningful visual or information-density sense. My proposed
three-link exit strip—Quickstart, Concepts, Why—better enforces the locked role. Deep capabilities
remain discoverable through the proof-point links and global navigation.

### 2.2 Its homepage subhead still overpacks the proposition

“Deno meta-framework,” “durable workflows,” “one contract from database to browser,” “whole fleet,”
services/workers/Postgres/traces, and one-command startup repeat the current habit of placing the
entire architecture in the hero. “One contract from database to browser” is also imprecise: a
database schema is not necessarily the oRPC contract object that types the browser boundary.

Its two-clause hero—“Your checkout survives the crash. Your types survive the refactor.”—is better
than its subhead and better than the current site. It should be paired with a narrower category
sentence, not another inventory.

### 2.3 Why remains two comparison tables in substance

The rival says to merge the two existing tables, then proposes:

1. “The answer, in one table” with hand-assembled → NetScript → what you give up; and
2. a separate six-row “Honest contrasts” section.

That preserves two long comparison surfaces and then adds “two properties hard to retrofit,” which
repeats the contract/durability argument a third time. A tighter Why page needs:

- target consumer;
- three integration failures;
- one connected types → durability → operations argument;
- one four-row buyer comparison;
- trade-offs.

My proposal removes the feature-answer table entirely because it is a renamed capability list.

### 2.4 Its Why trade-offs include a deep auth limitation that is not page-level

“One active auth backend at a time, only kv-oauth is fully interactive” is honest but applies only
to buyers selecting the auth plugin. Elevating it alongside framework maturity, Aspire/.NET, web
ecosystem, and hosted-platform boundaries makes one plugin’s current state look like a framework
selection constraint. Keep it on `/identity-access/`; Why should link there if it mentions auth.

### 2.5 Quickstart still does not stop at the first successful loop

The rival keeps:

- global and ad-hoc install tabs plus a substitution tip;
- simulated terminal output;
- a multi-option callout;
- detached-process and database-ordering notes;
- three database setup commands;
- a four-item “What you see” tour;
- a troubleshooting block;
- three next destinations.

That is a compressed version of the current tour, not the fastest honest path. My proposal keeps
one install form, one scaffold form, start, one verified visible edit, stop, and two onward links;
ad-hoc/CI/agent/database/troubleshooting branches move to the appropriate companion pages.

### 2.6 Its proposed first change is not concrete or verified

“Edit a `--ns-*` token or a copied `fresh-ui` component under `apps/dashboard/`” does not name a
file, token, component, expected rendered change, or reload behavior verified against current
scaffold output. It asks a novice to choose among an entire design system. It may also teach design
customization rather than the application’s primary development path.

The authoring slice should inspect the generated scaffold fixture, name one existing visible file
and one string-level edit, and state the expected browser result. My outline explicitly leaves the
path unresolved until that verification rather than inventing certainty.

### 2.7 Concepts contradicts both the locked chain and itself

The rival says “4 links in one chain” and then prints five nouns:

`contracts → services → plugins → web layer → observability`.

It combines services and the empty host/plugin model under “Idea 2,” so services never receive the
distinct mental-model section locked by the orchestrator. The page should have five short sections,
one per noun, in order.

It also says to keep the current hero and “Read this once” callout verbatim; both explicitly promise
**three ideas**, contradicting the proposed four/five-stage model.

### 2.8 Concepts keeps the duplication it is supposed to eliminate

The rival retains:

- the full contract/client code tabs;
- plugin manifest code and the fixed-axis paragraph;
- three diagrams, including `fresh-page-model.svg` already used on `/web-layer/`;
- large parts of current contract, plugin, and Aspire prose verbatim;
- the three-card navigation grid and Pre-1.0 callout.

That makes Concepts another collection of mini deep-dives. The target role is a mental model once,
with each concept linking outward. My proposal keeps only `architecture-overview.svg`, compresses
each layer to its boundary and consequence, and uses one prose checkout walkthrough to connect the
five layers.

### 2.9 “Each link derives from the one before it” is technically too strong

Contracts can type services and SDK callers, but plugins do not generally derive from a service,
the web layer does not derive from arbitrary plugins, and observability does not derive from the
web layer. The current concepts close is already too broad when it says every layer derives from
the previous one. The architecture is connected by contracts, manifests/registries, resource
materialization, and trace context—different mechanisms at different seams. The revamp should name
those mechanisms rather than assert one universal derivation relationship.

### 2.10 Moving plugin-install output into Quickstart expands the wrong path

The rival calls `netscript plugin install worker` an optional Quickstart step. The locked path ends
at first change and allows no concept exposition beyond what that path needs. Installing a worker
plugin adds a parallel capability, generated files, and Aspire resources without helping the user
prove the initial scaffold runs. Move it to a plugin/background-processing how-to, not Quickstart.

## 3. Rival ideas that beat mine and should be adopted

### 3.1 Adopt the two-outcome homepage hero, with one correction

The rival’s:

> Your checkout survives the crash. Your types survive the refactor.

is more concrete and memorable than my:

> Build the Deno app that keeps working after the request ends.

It names the two differentiated outcomes rather than describing a lifecycle boundary. Adopt it if
the durability implementation claim is scoped honestly in the subhead/proof: crash recovery
depends on running the saga through a configured durable runtime/store, not merely declaring the
builder object.

Recommended combined form:

> **Your checkout survives the crash. Your types survive the refactor.**
>
> NetScript is a typed full-stack framework for long-lived Deno applications, with durable
> workflows and an Aspire-operated resource graph built into the application model.

### 3.2 Put durability before typing in the homepage proof order

My outline ordered “Typed from page to process” before “Work survives the worker.” The rival is
right that durability is the sharper wedge and the owner explicitly rejected contract-first
positioning. Use this order:

1. Work survives the process.
2. Types cross service and browser boundaries.
3. Aspire makes the resource graph observable.

### 3.3 Adopt “the two properties that are hard to retrofit” as Why’s thesis

The rival’s best new argument is that cross-layer typing and durable state are architectural
choices, not add-ons. This is stronger than merely listing integration seams. Fold it into the
single connected Why argument:

> Logging can be added later. Making every caller derive from one boundary, or making every
> multi-step flow persist its state, usually requires rewriting the system that already exists.

Do not make it an additional repeated section after two tables; make it the spine of the answer.

### 3.4 Adopt the Docker prerequisite finding

The main Quickstart requires Aspire’s default container resources but names Deno and Aspire only.
`docs/site/quickstart/aspire.md` explicitly requires a running Docker daemon. The rival correctly
identifies this as a happy-path prerequisite gap. Add Docker to the single prerequisites sentence.

### 3.5 Adopt its `context.sagaId` correction

The current Why sample uses the saga definition ID as an order ID. Replace it with the typed event
payload (preferred) or an explicitly designed correlation value where routing identity is intended.
This is a real source-alignment defect independent of whether those code tabs survive the revamp.

### 3.6 Adopt the “enterprise-grade” title deletion

My outline rejected “enterprise-grade” in the hero but did not explicitly call out the frontmatter
`<title>`. The rival is right: `title: NetScript — the enterprise-grade meta-framework for Deno`
persists the unearned claim in search/browser metadata even if the visible hero changes. S2 should
replace both.

### 3.7 Adopt the environment-resolution fact, but link rather than transplant the paragraph

The rival correctly notices the useful current statement that service locations resolve at call
time from orchestrator-injected environment variables. It explains why one client can work across
local processes and deployed endpoints. My outline mentions service discovery more generally.
Core concepts should retain one precise sentence and link to
`/services-sdk/how-to/discover-services/`; it should not absorb the whole homepage paragraph.

### 3.8 Adopt the duplicated Encore/NestJS-row finding

The current `why.vto` gives Encore and NestJS the same description verbatim. That is a concrete
copy error and supports replacing the comparison surface. The final page should use the locked
Fresh/Next/Encore-style/DIY contrasts, with current external claims verified before publication.

### 3.9 Adopt the explicit line/page budgets as implementation gates

My outline enforced content shape but did not set measurable budgets. The rival’s approximate
homepage budget (~60 Vento lines) and Quickstart budget (<120 lines) are useful anti-regression
constraints, provided components are not compressed into giant one-line arrays to game them.
Pair line budgets with structural budgets:

- Homepage: one hero, three proof items, one code block, one three-link exit strip.
- Quickstart: prerequisites, install, scaffold, start, one edit, stop, two onward links.

## 4. Convergence recommendation

Use the rival’s concrete two-outcome hero, durability-first proof order, hard-to-retrofit thesis,
Docker prerequisite, `context.sagaId` correction, and measurable page budgets. Use the Codex
structure for the rest:

- no nine-pillar homepage grid or promotional afterthoughts;
- no second feature-answer table on Why;
- one verified happy path in Quickstart;
- five distinct Core concepts with one shared architecture diagram;
- no code sample labeled “compensation” unless it emits `sagaCompensate(...)` and reaches the
  registered handler in the real runtime model.

That convergence preserves the rival’s sharper positioning while removing its factual defects and
the sections that recreate the current site’s duplication.
