# Deep Review — Main Pages (S8)

Senior-editor whole-text review of the four main site pages. This is not a word scan; it judges
pages as complete arguments and as a set. Every finding cites the passage and proposes a full
replacement.

---

## index.vto — Homepage

### Arc assessment

The homepage has a three-beat structure: hero claim → three proof points → code moment → lede →
exit nav. The arc is sound in outline. The hero tagline ("Your checkout survives the crash. Your
types survive the refactor.") is the best two-sentence pitch in the set — concrete, parallel,
earned. The feature grid delivers three real differentiators. The code sample is substantial and
genuine. The exit nav is clean.

Where the arc weakens: the subhead is generic where the tagline is vivid, and the lede paragraph
reads as a post-code debrief rather than a close. The page peaks at the code sample and then
explains what the reader just saw, which deflates rather than builds. A homepage should end on
forward momentum; this one ends on recap.

### Findings

**F1. Subhead is generic against a vivid tagline.**

> `subhead: "NetScript is a framework for durable, typed, full-stack applications on Deno."`

The tagline earns attention with specifics (checkout, crash, types, refactor). The subhead retreats
to category language ("framework for X on Y"). A reader who responded to the tagline gets a
dictionary definition next.

Replace:

```
subhead: "NetScript gives you durable state machines, one typed contract across the stack, and an observed resource graph — on Deno, without a hosted platform."
```

**F2. Feature grid item 1 front-loads jargon before the contrast that earns it.**

> `"Define state transitions and compensation in TypeScript; the runtime records every step through its saga store instead of treating a multi-step flow as a retry loop."`

The contrast ("instead of treating a multi-step flow as a retry loop") is the persuasive part, but
it arrives after a semicolon and two undefined terms ("compensation," "saga store"). A reader who
hasn't used sagas bounces off the first clause before reaching the payoff.

Replace:

```
body: "A multi-step flow is not a retry loop. Define each step and its rollback in TypeScript; the runtime records progress through its saga store so a crash resumes, not restarts."
```

**F3. Feature grid items 2 and 3 use the same syntactic shape — "One X does Y" — creating a
mechanical couplet.**

> `title: "One contract crosses the stack"`
> `title: "One command starts the traced fleet"`

The anaphora is a real rhetorical device, but here it produces two of three items with the same
shape, which reads as a pattern the writer noticed and kept rather than a pattern the argument
demanded. Item 3's body also has a pronoun referent issue: "the dashboard then reports resource
health and carries logs and traces across it" — "it" refers to "the whole generated resource graph"
from the previous clause, but "across it" is vague (across the graph? across the dashboard?).

Replace item 3:

```
title: "The traced fleet starts with one command"
body: "aspire start brings up every generated resource; the dashboard shows health, logs, and traces for the whole graph from one page."
```

**F4. Lede paragraph reads as defensive prerequisite disclosure, not as a close.**

> "Executing that request needs a saga bus bridge with a compensator; surviving a restart needs a durable store. With that wiring, the registered handler emits `payment.refund`."

"With that wiring" is a subtle tell — it sounds like the framework requires plumbing the reader must
provide, rather than providing it. The two semicolon-joined clauses before it list needs without
saying who meets them. For a homepage lede, this is too much qualification and not enough ownership.

Replace the lede paragraph:

```html
<p class="ns-lede">
Both events are correlated by <code>orderId</code>. When <code>inventory.failed</code>
arrives, its handler returns a compensation request for <code>payment.captured</code> — and the
runtime resolves it to a <code>payment.refund</code> call. The saga store records each step so a
restart resumes in place; the saga bus bridge connects compensators across services.
<a href="{{ '/durable-workflows/' |> url }}">See the durability model</a>.
</p>
```

This version leads with what happens (correlation → compensation → refund), then names the
mechanisms (store, bus bridge) as things the framework provides, not things the reader must wire.

### Paragraph-level map

| Paragraph / block                 | Verdict   | Notes                                                    |
| --------------------------------- | --------- | -------------------------------------------------------- |
| Hero tagline + subhead            | REWRITE   | Subhead (F1); tagline is keep-as-is                      |
| Feature grid item 1 (durability)  | REWRITE   | Front-loaded jargon (F2)                                 |
| Feature grid item 2 (contract)    | KEEP      | Clean and specific                                       |
| Feature grid item 3 (fleet)       | REWRITE   | Mechanical coupling with item 2, pronoun referent (F3)   |
| Tabbed code sample                | KEEP      | Real, substantial, well-chosen                           |
| Lede paragraph                    | REWRITE   | Defensive qualification, not a close (F4)                |
| Exit nav cluster                  | KEEP      | "Run it / Understand it / Decide" is well-calibrated     |

---

## why.vto — Why NetScript

### Arc assessment

This is the strongest page in the set. The arc is real: disqualify the wrong reader → name the
problem → state the two decisions → compare alternatives → admit trade-offs → close. Each section
earns its position by building on the previous one. The anti-qualification opening ("If the product
is a static site... start with Fresh or Hono") is the best trust-building move in the four pages —
a page that tells you when to leave is a page you believe when it tells you to stay.

Where the arc weakens: section 2 ("The two decisions that are expensive to retrofit") buries its
key claim — that these decisions are irreversible — in the middle of a paragraph rather than
surfacing it as the section's thesis. The comparison table, while genuinely useful, is dense enough
to stop the page's forward motion. The trade-offs section recovers momentum, but the comparison
table is a speed bump in what should be a continuous argument.

### Findings

**F5. Hero subhead is a run-on that tries to do two jobs in one sentence.**

> `subhead: "NetScript fits long-lived products where request handling, background work, browser UI, and operations have become one application; it trades pick-any-library freedom for a coordinated Deno workspace."`

The semicolon joins two separate claims: (1) what NetScript fits, (2) what it trades. "Pick-any-
library freedom" is a compact phrase that repays rereading, but the sentence is too long for a
subhead. Subheads are scanned, not read.

Replace:

```
subhead: "NetScript fits long-lived products where request handling, background work, browser UI, and operations have become one application. The trade: pick-any-library freedom for a coordinated Deno workspace."
```

**F6. Section 2 buries its thesis and has a sentence that tries to do too much.**

> "We didn't invent new primitives. NetScript makes two early architecture choices and carries them through the workspace: callers derive their types from shared contracts, and multi-step work runs through explicit durable state. Logging can be added later. Replacing parallel client definitions or ad-hoc effects after they spread through an application usually means changing every caller and every workflow."

The buried claim is "Logging can be added later" — this is the reversibility argument, the real
reason these two decisions matter (you can defer everything else). It sits as the third sentence in
a four-sentence paragraph. The final sentence is 31 words with a compound subject and a hedged verb
("usually means").

Replace:

```markdown
We didn't invent new primitives. NetScript makes two early architecture choices explicit: callers
derive their types from shared contracts, and multi-step work runs through durable state. These are
the decisions you cannot retrofit after they spread through an application — replacing parallel
client definitions or ad-hoc effects means changing every caller and every workflow. Everything
else, including logging and telemetry, can be added later.
```

**F7. Trade-offs section has one euphemism and one unclear comparison.**

> "If you need a frozen surface today, wait or budget for upgrades."

"Budget for upgrades" is corporate-speak on a page that elsewhere is admirably direct.

> "A coordinated workspace is broader than a one-process app needs."

"Broader" is unclear — broader in scope? in surface area? The contrast with "one-process app" also
assumes the reader knows what a "coordinated workspace" means, which hasn't been defined on this
page.

Replace the first:

```markdown
- **The package family is pre-1.0.** APIs move, so scaffolded imports use exact
  `{{ releaseSpecifier }}` pins. If you need a frozen surface today, NetScript is not ready for you.
```

Replace the fourth:

```markdown
- **A coordinated workspace costs more than a one-process app needs.** Durability, plugin runtimes,
  and multi-resource operations pay the structure cost back; a small service pays it without
  collecting.
```

**F8. Comparison table row for Encore assumes knowledge of what "an adapter" means.**

> `"NetScript keeps a Deno/JSR workspace in the application and puts Aspire behind an adapter."`

A reader comparing NetScript to Encore may not know what Aspire is (Aspire is explained on the
concepts page, which this page links to only at the end of section 2). "Behind an adapter" is
meaningless without that context.

Replace:

```
desc: "NetScript keeps a Deno/JSR workspace in the application and uses .NET Aspire for local orchestration via an adapter. It provides less managed infrastructure, so deployment and operations remain your responsibility."
```

### Paragraph-level map

| Paragraph / block                 | Verdict   | Notes                                                    |
| --------------------------------- | --------- | -------------------------------------------------------- |
| Hero tagline + subhead            | REWRITE   | Subhead run-on (F5); tagline is strong                   |
| Anti-qualification paragraph      | KEEP      | Best trust-building move in the set                      |
| Section 1: integration tax list   | KEEP      | Concrete, well-phrased, builds                           |
| Section 1: closing definition     | KEEP      | "unrelated tools pretending to be one system" — vivid    |
| Section 2: the two decisions      | REWRITE   | Buried thesis, overloaded final sentence (F6)            |
| Section 2: operational paragraph  | KEEP      | Clean forward link                                       |
| Section 3: comparison table       | REWRITE   | Encore row assumes Aspire knowledge (F8)                 |
| Section 4: trade-offs             | REWRITE   | Euphemism and unclear comparison (F7)                    |
| Closing CTA                       | KEEP      | Conditional close is well-calibrated                     |

---

## quickstart.vto — Quickstart

### Arc assessment

The quickstart is the most disciplined page. It does exactly what a quickstart should: install,
scaffold, start, edit, stop, continue. No concept exposition leaks into the steps. The callouts are
well-placed ("Nothing runs until this step," "Aspire comes before any database command"). The
editing step (section 4) is specific enough to be verifiable — "find this sentence, replace it with
this, refresh, confirm."

The page has no arc problems because it doesn't attempt an arc — it's a procedure, and procedures
are sequential by nature. The only structural question is whether the prerequisites callout should
explain *why* Docker and .NET Aspire are needed, not just that they are.

### Findings

**F9. Prerequisites callout lists requirements without explaining their role.**

> "Install Deno 2.x, the .NET Aspire CLI, and start Docker before continuing. The default Postgres and cache resources run in containers."

A reader who doesn't know what Aspire is (and the concepts page hasn't been read yet at this point
in the funnel) sees ".NET Aspire CLI" on a Deno page and wonders if they're in the right place. One
clause would fix this.

Replace:

```html
{{ comp callout { type: "note", title: "Prerequisites" } }}
Install <strong><a href="https://docs.deno.com">Deno 2.x</a></strong> and the
<strong><a href="https://learn.microsoft.com/dotnet/aspire/">.NET Aspire CLI</a></strong>, and start
Docker before continuing. Aspire orchestrates the local resource graph — Postgres and cache run in
Docker containers that Aspire starts for you.
{{ /comp }}
```

**F10. Section 2 explanation of `--service` is framed negatively.**

> "The `--service` flag is explicit: without it, `netscript init` does not scaffold the example oRPC service."

Telling the reader what doesn't happen is weaker than telling them what does. The colon after
"explicit" promises an explanation but delivers a negation.

Replace:

```markdown
The `--service` flag scaffolds the example oRPC service alongside the workspace. `--yes` accepts the
remaining defaults without prompts, including the `dashboard` app name and shared Redis cache used
below.
```

**F11. Section 3 step list has a referent ambiguity in the final sentence.**

> "Wait until the Fresh app, example service, Postgres, and shared cache report healthy, then open the Fresh app from its resource link."

"The Fresh app" appears twice in one sentence — once in the wait condition, once in the action.
"The page heading should read `my-app`" follows, and the referent chain is: Fresh app → its resource
link → the page. This is parseable but not smooth.

Replace:

```markdown
Wait until all four resources report healthy — the Fresh app, example service, Postgres, and shared
cache — then open the Fresh app from its resource link. The page heading should read `my-app`.
```

### Paragraph-level map

| Paragraph / block                 | Verdict   | Notes                                                    |
| --------------------------------- | --------- | -------------------------------------------------------- |
| Opening sentence                  | KEEP      | Precise scope statement                                  |
| Prerequisites callout             | REWRITE   | Missing why for .NET Aspire (F9)                         |
| Section 1: install command        | KEEP      | Clean                                                    |
| Section 2: scaffold + explanation | REWRITE   | Negative framing (F10)                                   |
| Section 3: start + wait           | REWRITE   | Referent ambiguity (F11)                                 |
| Section 3: Aspire callout         | KEEP      | Good wayfinding                                          |
| Section 4: first change           | KEEP      | Specific, verifiable, well-paced                         |
| Stop + continue                   | KEEP      | Clean exit with two forward paths                        |

---

## concepts.vto — Core Concepts

### Arc assessment

The concepts page has the weakest arc of the four. It presents five numbered sections in a fixed
sequence (contracts → services → plugins → web layer → observability), each following the same
shape: define the concept in 2–3 sentences, link to the deep-dive. The sequence is logical —
request-time behavior depends on contracts, plugins extend services, the web layer consumes
contracts, observability watches the whole graph — but the page never states *why* the reader should
care about this layering.

The result reads as a reference index in prose form. Each section is self-contained, which means a
reader who has absorbed sections 1–3 can predict exactly what section 4 will look like. Predictable
shape kills momentum. The page needs a connective tissue — one sentence per section transition that
says why the next layer exists given what the previous layer established.

### Findings

**F12. Hero subhead uses the vague verb "carries" for everything.**

> `subhead: "Contracts define the boundaries. Everything else — services, plugin runtimes, the web layer, the observed resource graph — carries them somewhere."`

"Carries them somewhere" is meant to unify the four downstream layers, but "somewhere" is empty — it
tells the reader nothing about what each layer does with the contract. The tagline ("A NetScript app
is five connected layers") is fine but the subhead should earn its length.

Replace:

```
subhead: "Contracts define the boundaries. Services serve them at request time, plugins extend them across processes, the web layer brings them to the browser, and the observed resource graph keeps the whole system visible."
```

**F13. Section 1 buries the page's best sentence at the end of a paragraph.**

> "Contracts describe behavior, not just entity CRUD: `checkout.start` is as natural a boundary as a list or update operation."

This is the conceptual breakthrough the section exists to deliver — that a contract is not a data
shape but a behavioral boundary. It sits as the second sentence of a second paragraph, after a
paragraph of mechanics. It should lead.

Replace section 1:

```markdown
## 1. Contracts define the boundary

A contract describes behavior, not just data: `checkout.start` is as natural a boundary as a list
or update operation. The contract is the source of truth for an operation's input and output — a
service implements the oRPC contract, `@netscript/sdk` derives clients from the same contract map,
and the service runtime generates OpenAPI from the contract router. The TypeScript caller and the
HTTP description share one definition, not two hand-written shapes.

Read [contracts and type flow](/explanation/contracts/) for the schemas and router mechanics.
```

**F14. Section 2's first sentence is overloaded — a seven-item enumeration inside a single clause.**

> "`defineService()` turns a router into a running Hono and oRPC service with request logging, OpenAPI, Scalar docs, RPC, service information, and health endpoints configured by the preset."

Seven items ("request logging, OpenAPI, Scalar docs, RPC, service information, and health
endpoints" — that's six, plus "configured by the preset" as a seventh concern) in one sentence. The
reader cannot hold them. The list is also not parallel: "request logging" is an activity, "OpenAPI"
is a document format, "Scalar docs" is a UI, "RPC" is a protocol, "service information" is
metadata, "health endpoints" is an endpoint type.

Replace:

```markdown
`defineService()` turns a contract router into a running Hono and oRPC service. The preset wires in
request logging, OpenAPI generation, a Scalar docs UI, health endpoints, and service-info metadata —
so the service starts with its operational surface connected, not bare. SDK clients resolve
service URLs lazily from Aspire-injected environment values, so callers do not pin a local port
into application code.
```

**F15. Section 3 has the page's best two sentences but they're inside a paragraph that dilutes
them.**

> "The host is empty; plugins fill it."
> "'One plugin' is a packaging unit, not a runtime unit."

These are excellent — terse, contrastive, memorable. But the paragraph between them is dense
manifest-mechanics prose ("validated data that declares services, background processors, schemas,
topics, configuration, and telemetry contributions"). The excellent sentences are load-bearing; the
paragraph between them is filler wearing a technical costume.

Replace section 3:

```markdown
## 3. Plugins add runtime capabilities

The host is empty; plugins fill it. A plugin manifest declares what the plugin contributes —
services, background processors, schemas, topics, configuration, telemetry — and the CLI turns those
declarations into static workspace wiring.

"One plugin" is a packaging unit, not a runtime unit. Workers, sagas, triggers, and streams are the
durable examples; Aspire can materialize a plugin's API and background processors as separate
resources. The full manifest and registry mechanics live in
[the plugin-system explanation](/explanation/plugin-system/).
```

**F16. Sections lack transition — each ends with a link and the next begins with no connective.**

The page reads as five independent entries. Section 1 ends with "Read [contracts and type flow]";
section 2 opens with `defineService()`. Section 2 ends with "Go deeper in [Services & SDK]";
section 3 opens with "The host is empty." The sections are sequenced but not connected. A reader
who wants to understand the *system* gets five separate explanations instead.

Add one transition sentence at the start of sections 2–5:

Section 2 opening:
```markdown
## 2. Services execute request-time behavior

Contracts need a runtime. `defineService()` turns a contract router into a running Hono and oRPC
service...
```

Section 3 opening:
```markdown
## 3. Plugins add runtime capabilities

Services handle the request; plugins handle everything that outlives one. The host is empty;
plugins fill it...
```

Section 4 opening:
```markdown
## 4. The web layer carries the boundary to the user

The contract reaches the browser through the web layer. `@netscript/fresh` builds on Fresh 2 and
Preact...
```

Section 5 opening:
```markdown
## 5. Observability connects the resource graph

Every layer above runs inside a resource graph. The generated AppHost composes apps, services,
plugin processors, databases, and cache resources...
```

### Paragraph-level map

| Paragraph / block                 | Verdict   | Notes                                                    |
| --------------------------------- | --------- | -------------------------------------------------------- |
| Hero tagline + subhead            | REWRITE   | Subhead vague (F12); tagline is adequate                 |
| Diagram                           | KEEP      | Useful visual anchor                                     |
| Section 1: contracts              | REWRITE   | Best sentence buried (F13)                               |
| Section 2: services               | REWRITE   | Overloaded first sentence, no transition (F14, F16)      |
| Section 3: plugins                | REWRITE   | Excellent sentences diluted, no transition (F15, F16)    |
| Section 4: web layer              | REWRITE   | No transition (F16); content is sound                    |
| Section 5: observability          | REWRITE   | No transition (F16); content is sound                    |

---

## Whole-Set Analysis

### Voice drift

The four pages have four distinct voices, and the drift is noticeable:

| Page      | Voice character                                         | Quality           |
| --------- | ------------------------------------------------------- | ----------------- |
| Homepage  | Marketing-technical: punchy taglines, feature grid      | Good — earns it   |
| Why       | Argumentative-editorial: opinions, trade-offs, honesty  | Best in set       |
| Quickstart| Procedural-dry: steps, callouts, commands               | Right for purpose |
| Concepts  | Reference-manual: defines, enumerates, links            | Weakest — flat    |

The why page and the homepage feel written by someone with opinions. The quickstart feels written
by someone who has done the steps. The concepts page feels written by someone who was told to
explain the concepts. The voice difference is not a problem in itself — different pages have
different jobs — but the concepts page's flatness is conspicuous next to the why page's
argumentative energy.

### Information sequencing across the funnel

The homepage nav sends readers to three destinations in this order: "Run it" (quickstart),
"Understand it" (concepts), "Decide whether it fits" (why). This is backwards for a reader who
hasn't decided yet. The funnel should be: why (decide) → quickstart (try) → concepts (understand).
The homepage nav order subtly pushes action before understanding, which works for impatient readers
but confuses the careful ones.

The why page links to concepts at the end of section 2 ("The implementation details live in Core
concepts"), which is the right moment — the reader has just been told about two architectural
decisions and wants to know what they look like. But concepts doesn't pick up the thread: it
doesn't mention the "two decisions" from why, it starts fresh with "A NetScript app is five
connected layers." The hand-off drops.

The quickstart forward-links to both the storefront tutorial and concepts at the end. This is
correct — the reader who just ran the steps wants either to build something (tutorial) or to
understand what they ran (concepts).

### Content duplication between homepage and concepts

The homepage feature grid and the concepts page cover the same ground:

| Homepage feature                   | Concepts section               |
| ---------------------------------- | ------------------------------ |
| "Durability is a state machine"    | §1 Contracts + §3 Plugins      |
| "One contract crosses the stack"   | §1 Contracts                   |
| "One command starts the traced fleet" | §5 Observability            |

This duplication is partly unavoidable — the homepage must preview what the concepts page explains.
But the homepage feature grid bodies are dense enough that a reader who absorbs them has already
read a compressed version of concepts. The concepts page should feel like it's *deepening* the
homepage's claims, not repeating them at the same altitude.

### Sentence rhythm distribution

| Page      | Avg sentence length (est.) | Variation | Pattern                            |
| --------- | -------------------------- | --------- | ---------------------------------- |
| Homepage  | ~20 words                  | High      | Mix of punchy and long             |
| Why       | ~22 words                  | Highest   | Ranges from 6 to 35 words          |
| Quickstart| ~16 words                  | Low       | Mostly short, procedural           |
| Concepts  | ~24 words                  | Low       | Consistently medium-long           |

The why page has the most rhythmic variety, which contributes to its human feel. The concepts page
has the least variety and the longest average, which contributes to its reference-manual feel. The
quickstart's short sentences are right for a procedure. The homepage's variety comes from the
feature grid (long) vs. the nav and hero (short).

### Structural AI tells across the set

1. **Numbered sections with bold titles** on both why and concepts: "## 1. The integration tax,"
   "## 1. Contracts define the boundary." Both use the same section-opening move — bold title, then
   a defining sentence. The why page gets away with it because the sections argue; the concepts page
   doesn't because the sections enumerate.

2. **The "define-then-link" pattern** on concepts: every section ends with a link to a deep-dive.
   Five sections, five links, all in the same syntactic position (last sentence). This is
   structurally machine-planed even if individually correct.

3. **Triads** appear on the homepage (three feature grid items), the why page (three integration
   tax items), and the concepts page (three CTAs in the hero). The why page's triad is the most
   natural (three problems that build to a thesis). The homepage's is functional. The concepts
   page's hero CTAs are a pair, not a triad — the pattern is broken there, which is fine.

4. **Symmetrical hedging** on the why page comparison table: every row follows the same structure
   ("where X starts / what NetScript changes"). This is appropriate for a comparison table but
   contributes to the page's systematic feel.

5. **The "One X" anaphora** on the homepage (F3 above) is the most visible single pattern.

None of these is disqualifying. The set reads more human than most AI-generated documentation. The
tells are at the margin — a reader who is looking for them will find them; a reader who is not will
not notice.

---

## Verdicts

| Page       | Verdict     | Rationale                                                |
| ---------- | ----------- | -------------------------------------------------------- |
| index.vto  | SOUND       | Strong tagline, real code, four targeted rewrites        |
| why.vto    | SOUND       | Best page in set; five fixes, none structural            |
| quickstart | SOUND       | Disciplined procedure; three minor fixes                 |
| concepts   | RESTRUCTURE | Weakest arc; needs transitions, rebalanced openings, and |
|            |             | promoted best-sentences. Five findings, several structural. |

### Overall verdict: **SOUND with one RESTRUCTURE**

The set works as a product surface. Three of four pages are sound with targeted fixes. The concepts
page needs a structural pass — not a rewrite from scratch, but a re-sequencing that adds transition
sentences, promotes buried insights, and breaks the uniform section shape.

### Prioritized fix list

1. **Concepts page transitions (F16)** — the single highest-leverage fix. Adding one connective
   sentence per section transforms the page from a reference index to a guided tour. Cost: five
   sentences. Impact: changes the reading experience from "five definitions" to "one system."

2. **Concepts section 1 restructuring (F13)** — promote "Contracts describe behavior, not just
   entity CRUD" to the section lead. This is the concept the page exists to teach; it should not be
   buried.

3. **Concepts section 2 overload (F14)** — break the seven-item enumeration into two sentences.
   The current first sentence is unparseable on first read.

4. **Homepage lede (F4)** — rewrite from defensive qualification to confident close. The page peaks
   at the code sample; the lede should sustain, not deflate.

5. **Why section 2 thesis (F6)** — surface the irreversibility argument. "Logging can be added
   later" is the section's reason to exist; it should not be the third sentence.

6. **Why trade-offs (F7)** — replace the euphemism ("budget for upgrades") and clarify the unclear
   comparison ("broader than a one-process app needs").

7. **Homepage feature grid items 1 and 3 (F2, F3)** — fix the front-loaded jargon and the
   mechanical "One X" coupling.

8. **Quickstart prerequisites (F9)** — add one clause explaining why .NET Aspire appears on a Deno
   page.

9. **Concepts hero subhead (F12)** — replace "carries them somewhere" with specific verbs per
   layer.

10. **Why hero subhead (F5)** — break the run-on into two sentences for scanability.
