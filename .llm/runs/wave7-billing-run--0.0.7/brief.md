# Build the billing run — NetScript 0.0.7 stable

You are building a real product with **NetScript**, then writing about what building it taught you,
under your own name, in your own voice. You are the sole author of both. Nobody will fix your work
and credit you for it.

This is not a demo and not a game. Aim at something that could be shipped as a real product.

---

## 0. Version gate — do this first, and record it

NetScript **0.0.7 stable** was published **today**. That matters mechanically:

```bash
deno install --global --allow-all --name netscript --minimum-dependency-age=0 jsr:@netscript/cli@0.0.7
```

The `--minimum-dependency-age=0` flag is **required**, not decorative — Deno refuses dependencies
published in the last 24 hours by default. The generated workspace handles its own packages via
`minimumDependencyAge.exclude`, so you should not need the flag again inside the project. If you hit
an age error anywhere else (a `deno x` child process is the known risk), **record it as a finding**.

Read the complete Quickstart first: <https://rickylabs.github.io/netscript/quickstart/>
Reading it is Step 0. Do not skim it or plan while sections remain unread.

Record the requested version, the specifier actually used, and the resolved NetScript package graph.
They must agree. Every `@netscript/*` must resolve at `0.0.7`.

Two known environment notes, already observed: the generated `package.json` pins `engines.deno`
to 2.9.5 while this host runs 2.9.6 (warning only), and Prisma build scripts need
`deno approve-scripts` before database work.

## 1. The GitHub repository exists before the product does

Create a **private** repo under `rickylabs` and push the scaffold **before writing product code**.
Then commit and push **continuously** — at every meaningful step, not in one dump at the end. The
history is part of what you hand over. Nothing may be stranded if the machine dies.

`gh` is authenticated. Always pass an explicit `--repo`.

## 2. MCP is mandatory and mechanically enforced

Run the Quickstart's `agent init` step **with local docs enabled**. Both the `netscript` and
`aspire` MCP servers must be declared, attached, and answering. Your launcher verifies this before
every product turn and fails closed — you cannot proceed by substituting web fetches or grep.

**Before hand-rolling anything, ask the MCP.** The single most repeated finding across every prior
run in this series is agents rebuilding what the framework already ships, because they never asked.
For each product need, ask first: *what is the idiomatic way to do this in NetScript?* Most of the
time there is an answer. Record the lookups you made.

## 3. Research pass — before you design, find out what "best in class" means

**This is a gated phase. Do not start product design until it is written down.**

You are not building CRUD with a billing vocabulary. Research what the strongest products in this
market actually do, and what makes each of them feel like a *product* rather than a database with
screens. Look at how the leaders in subscription billing and metering handle things like: usage
metering and aggregation, plan versioning and mid-cycle proration, dunning and retry strategy,
revenue recognition, credit notes, entitlements, webhook delivery with replay, idempotency,
audit trails, and the operational surfaces finance teams actually live in.

Produce `MARKET-RESEARCH.md` in the repo containing:
- what you examined, and what each does that is genuinely distinctive;
- the capabilities that separate a serious billing product from a CRUD app;
- **your differentiation thesis** — one paragraph naming what *your* product does that makes it
  worth choosing, and which hard capabilities you will ship to earn that claim.

Then build to that thesis. Depth over breadth: cut entities and screens before cutting the
behaviour that makes the product worth building.

## 4. What you are building

**The billing run a subscription business closes its month with.** Customers sit on plans that
change mid-cycle; usage accrues; invoices are drafted, corrected and issued; payments succeed, fail
and are retried; refunds reverse work already counted. Someone in finance watches the run advance
and must be able to answer, at any moment, what has been charged and what has not.

The dashboard has multiple meaningful screens including charts and webhook management, in the
spirit of what Stripe ships.

**Stripe is the quality bar** — not its feature list, its *feel*. People tolerate that product
because the screen keeps up with them and the data underneath is never wrong.

Product requirements, in a person's terms:
- An action feels immediate, and is still correct after a reload.
- Two people looking at the same screen see the same change, without either reloading.
- Getting a form wrong does not cost the work already typed.
- Something happens on a schedule with nobody watching, and it is still right in the morning.
- A multi-step operation that fails halfway does not leave the world half-changed.
- Closing the laptop and coming back loses nothing that was already true.

## 5. House rules

Defaults, not suggestions. Departing is allowed; departing **silently** is not — every departure
needs a line in your record naming what you did instead and why.

1. **Contract first, and the database comes before the contract.** Generated DB-derived schemas feed
   the contract. Do not hand-mirror a schema the framework already derives.
2. **Routes are contract-bound.** A route contract and a service contract are different things;
   both exist, neither substitutes for the other.
3. **Reads go through the typed SDK, cache-first.** Raw `fetch` from a page or island is a
   departure. Know your cache keys and invalidations.
4. **Shared request/context data flows through the resource/layer surface**, not prop drilling or a
   repeated loader in every route.
5. **Route params and search params are typed end to end.** No manual string parsing.
6. **Route-local code is collocated** in `(_components)`, `(_islands)`, `(_shared)`, `(_lib)`, and
   promoted app-wide only when a second route needs it. A route module is a small composition root.
7. **No type escapes.** `any`, `as unknown as`, non-null assertions to silence the compiler, and
   `@ts-ignore` are review blockers in a framework whose whole proposition is end-to-end type
   safety. If a shipped type genuinely blocks you, that is a framework finding — record it.
8. **Mutations use the managed form surface** with its CSRF and idempotent submission, and
   optimistic UI where the interaction warrants it.
9. **The component registry is app-owned: customize it, do not bypass it.**
10. **Services have a deliberate internal shape.** Pick one and hold it.
11. **Use the CLI to generate what the CLI generates.** If you decline a generator, name it and say
    why. Reaching for a generator that does not exist is also data — record the gap.
12. **Authentication is part of the product** — including negative authorization tests. If you
    install an auth plugin, *use it*; do not leave it unreferenced and hand-roll a token.

## 6. The look — where every prior build failed

Three previous builds of this exact assignment all failed the same way, and the evidence is a blob
hash: `routes/(design)/design/(_shared)/registry.ts` is **byte-identical scaffold in all three
repositories**. Not one product component was ever registered in the gallery. Two of the three never
touched `assets/tokens.json`, so their own published token page shows a palette the product never
uses. One credits its visual identity to a file `git diff` proves it never modified.

**Your product must be recognisably yours on sight.** There are two ways to fail this and every
prior build picked one: shipping the defaults with a stylesheet bolted beside the system, or going
rogue with hand-written HTML and CSS that throws away accessibility, theming and dark mode.

The path between them is the one the framework is built for: **customize through its seams.** The
token source is a file in your repository. Component styling can be overridden without forking a
component. Composed regions carry their own styling. Your `/design` routes show the result.

If you finish and your token source is unchanged from the scaffold's, you have not designed
anything. Light and dark must both work, and the two captures must be genuinely different images.

## 7. The bars — measured from the best result actually observed

| # | Bar | Best prior result |
| --- | --- | --- |
| 1 | `tokens.css` **and** `tokens.json` diverge from stock; ≥40 changed token entries; `/design/tokens` renders *your* palette | 2 of 3 never touched the JSON |
| 2 | `registry.ts` diverges; ≥6 product components in the gallery | byte-identical in all 3 |
| 3 | **Zero** type escapes in authored code | one build had 34 |
| 4 | ≥60 tests / ≥120 assertions; every mutating procedure has a test that can fail; delete the stock `tests/scaffold_test.ts` | 37/80; one build had 8/12 with its 812-line money module untested |
| 5 | ≥15 negative-authorization tests, as tests not curl transcripts | one build had none |
| 6 | A stranger following the README alone gets a credential and completes a privileged mutation | one required pasting an undocumented secret into `localStorage` |
| 7 | Zero scaffold leftovers, zero placeholder files | one shipped 15 example files + 4 empty stubs |
| 8 | 0 raw `fetch()` in product code; lists through the query factories; islands under ~4 KB | one shipped 10 KB islands hand-rolling refetch |
| 9 | Two-tab live update captured; a saga compensation reaching a **terminal** state | none has ever proved compensation |
| 10 | ≥20 models, DB-level enums, ≥3 migrations | 19/8/3; one had 15 models and **0** enums |
| 11 | ≥12 pages incl. ≥4 detail routes; ≥20 registry components used | 8 pages, 1 detail; 15 components |
| 12 | >6,000 authored TS lines across 80+ files; a record no `git diff` can contradict | 4,542–5,476 lines |

For reference, `rickylabs/eis-chat` — a production product on this framework — carries 156 design
tokens, 35 dark-mode semantic overrides, a `/design` sub-app of 1,694 lines, 50 UI primitives,
183 test files with 1,247 cases, and **zero** `@ts-ignore` across 619 source files. Its README is
243 lines where every capability section also names a limit. That is the standard.

## 8. What done means

1. **It runs.** A stranger clones it and gets it running from your README alone.
2. **The interesting behaviour is real.** You have seen it happen and captured it, not described it.
3. **The rules that matter are enforced and tested.** Not smoke tests that a module imports.

**Causal claims need causal proof.** A persisted state transition or a correlated trace that would
look different if the named seam were removed. A definition, a registry row, a green wrapper
process, an HTTP 200, or a screenshot is **not** proof.

**Verify the artefact, never the exit code.** `Healthy` with an empty report set means nothing was
checked. Enumerate every configured gate and run each separately.

Use the Aspire skill/MCP rather than treating Aspire as a process launcher. Acceptance evidence
includes the real resource graph, at least one correlated end-to-end trace across the interesting
boundary, logs or metrics, and the generated Scalar API surface.

## 9. Your record

Keep a running record in the repository. **Write a problem when you hit it**, with the exact command
and exact output — reconstructed at the end it is worth nothing. Separate *"I did not know how this
worked"* from *"this is broken."* Only the second is a defect.

Finish with a built-in-versus-hand-rolled ledger where every capability-map row carries one of four
dispositions and exactly one evidence pointer: `proved` (it ran, a named artefact shows it),
`simulated` (name the stand-in), `absent` (never reached), `rejected` (reason recorded). A row with
no disposition is a defect in your record.

**No claim may be falsifiable by `git diff`.** A prior build credited its skin to a file it never
touched. That is the failure mode.

At the end, rank what cost you time.

## 10. The post

Write the post you would want to read if someone handed you an unfamiliar framework and asked
*should we use this?* **If your section headings could be predicted from this brief, you have
written the wrong post.**

Open on the real-world problem, not on yourself. Say what you expected and where that expectation
was wrong. End by answering whether you would recommend it, naming exactly where your confidence
ran out. Write it positive if the honest account is positive — never at the cost of being true.

**Show your code.** The strongest post in this series carried six real samples from its own project.
**Draw something** — at least two diagrams you make yourself, of what a screenshot cannot show.
**Photograph the evidence, not just the hero screen**: the main flow, meaningful success and failure
states, and the operational surfaces. A caption must say what the image proves.

Publishing details are in `PUBLISHING.md` beside this brief. Follow it literally — it was audited
from the live repository and a wrong prop name costs a failed build.

## 11. Caps and machine

The owner has lifted the usual caps: **you may run overnight**, and you may fan out sub-agents for
anything independent — research, broad searches, verification. The build and your own record stay
with you; the post is first-person and must be written by the agent that hit the friction.

If you are stuck on the same thing for more than about fifteen minutes, say so plainly in your
output rather than burning the session on it.

## 12. Blind boundary

Do not read any prior run's product repository, article, or evaluator pack for this project. Reusing
a project is legitimate; inheriting its answers is contamination. The specific prior repositories
and website PR branches are off limits.
