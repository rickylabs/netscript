# NetScript Public-Doc Audit — Leakage, Diagrams, Bar-Raising

**Scope:** Every authored page under `docs/site/` on `origin/docs/user-site`
(capabilities/, tutorials/, how-to/, explanation/, index.vto, why.vto,
quickstart.vto, glossary.md, cli-reference.md, _data.ts). Build output
(`_site/`) and generated reference (`reference/`) excluded per brief. Auth is
treated as accurate-by-baseline and never flagged as doc-vs-reality.

## Executive summary (5 lines)

1. **Leakage is concentrated, not pervasive.** Total **19** distinct
   internal-speech / non-public instances. There is **zero** harness / OpenHands
   / Codex / Claude / WSL / agent / run-id / PR-number / `.llm`-path / raw-Vento
   leakage in any *rendered prose* — the front-door, quickstart, and tutorials
   are clean.
2. The single worst offender is **`explanation/architecture.md`** (and its
   siblings `plugin-model.md`, `durable-workflows.md`): they read as
   **framework-contributor doctrine** — "the doctrine recognizes six archetypes,"
   "doctrine axiom A12," "the publish gate is the doctrine gate" — wrong audience
   for a public Explanation zone.
3. The second pattern is an **internal debt-tracker ID leaked verbatim**:
   `(debt workers-scaffold-job-tools-noop)` appears on two public pages.
4. **Diagrams:** the site relies entirely on **ASCII** (architecture box,
   request-lifecycle arrow chain, several file-trees) with **no rendered
   diagrams and zero Mermaid** — ~11 high-value diagram slots, most missing,
   the rest currently-ASCII.
5. **Bar-raising:** the IA (Diátaxis + capability hubs + Learn/Do/Reference) is
   already strong, but the site is missing every modern docs affordance —
   in-site search, code-copy, on-page TOC, version switcher, ERD/flow visuals,
   feedback widget, examples gallery, troubleshooting blocks, and a file-tree
   component.

---

## Section A — Internal-speech / non-public leakage

**Total instances: 19.** Highest priority — this must reach **zero** after the
overhaul.

### A.1 — Doctrine vocabulary leaking into public Explanation prose (11)

The Explanation zone repeatedly cites the *internal architecture doctrine* by
name — axioms, "the doctrine," doctrine-internal package taxonomy — language
meant for framework contributors, not app authors. "kernel," "port," "adapter,"
"composition over inheritance" used as plain technical nouns are fine; the
problem is the explicit appeals to a private doctrine document.

1. `explanation/architecture.md` — "One folder layout does not fit every
   package, so **the doctrine recognizes six archetypes**." (Whole "Six
   archetypes, not one layout" section + table titled "The six package
   archetypes" exposes the internal package-classification taxonomy.)
2. `explanation/architecture.md` — section heading **"The publish gate is the
   doctrine gate"** plus "they are the mechanism by which every **axiom** above
   survives contact with real code."
3. `explanation/architecture.md` — "test the implementation **as a fitness
   function**" / "Tests are treated as **fitness functions**." (Internal
   architecture-testing jargon.)
4. `explanation/architecture.md` — "every term above — saga, trigger, stream,
   contract, contribution, **archetype, port**, AppHost — is defined in the
   glossary." (Surfaces `archetype` as user vocabulary.)
5. `explanation/durable-workflows.md` — "This is **doctrine axiom A12** in
   practice: *durable workflows are state machines*." (Cites a numbered internal
   axiom verbatim.)
6. `explanation/plugin-model.md` — "The split follows the **architecture
   doctrine's** separation of *behavior* from *integration*."
7. `explanation/plugin-model.md` — "The plugin package is a thin integration
   layer (**the doctrine's *Plugin Package* archetype**)."
8. `explanation/plugin-model.md` — "This is the **doctrine's principle of
   registration over inheritance**."
9. `explanation/plugin-model.md` — "Load order is deterministic. Plugins must
   not depend on the order … **the doctrine forbids order-dependence** and
   asserts against it."
10. `explanation/auth-model.md` — "This is the **doctrine's *composition over
    inheritance*** applied to identity."
11. `capabilities/auth.md` — "The design follows the **framework's
    contracts-first doctrine**: a core seam package …"

> Note: `_data.ts` header comments contain `(US-8)` and "the 0a authoring wave"
> (internal user-story / wave IDs), and `how-to/author-a-plugin.md` uses
> "doctrine-true way to assemble a manifest" and "Decide which **archetype** your
> plugin is." These are author-facing-but-borderline; `_data.ts` is a non-rendered
> code comment so it is excluded from the count, but the overhaul should scrub the
> `US-`/wave IDs from the comment and the `archetype`/"doctrine-true" phrasing
> from `author-a-plugin.md` for consistency.

### A.2 — Internal debt-tracker IDs leaked verbatim (2)

12. `capabilities/background-jobs.md` — "a **known, tracked limitation with a fix
    planned** **(debt `workers-scaffold-job-tools-noop`)**, not a permanent
    design choice."
13. `explanation/observability.md` — "**known, tracked limitation with a fix
    planned (debt `workers-scaffold-job-tools-noop`)**, not a permanent design
    choice."

`workers-scaffold-job-tools-noop` is an internal debt-tracker slug; users have
no debt board to look it up in. Keep the honest caveat, drop the ID.

### A.3 — Over-hedged / notes-to-self-style alpha disclaimers (6)

These read like author asides rather than honest user caveats. The *information*
(job-tools helpers are no-op) is legitimate and should stay — but the framing
("Honest reality," "honest caveat," "Do not say …," and the count of times it is
restated) reads internal. The same caveat is repeated **~7 times across the
site**, which itself signals notes-to-self.

14. `glossary.md` (OTel entry) — "**Honest reality:** job dispatch, execution,
    step events … emit *real* spans … The one remaining gap is the scaffold
    `createJobTools(ctx)` … (**tracked debt, fix planned**)."
15. `glossary.md` (stream entry) — "**Honest reality:** the
    `@netscript/plugin-streams` manifest helpers … are intentional stubs that
    *throw* …".
16. `capabilities/background-jobs.md` — callout titled **"Honest about the alpha
    runtime"** + "**Do not say** 'worker tracing is a no-op': that is …".
17. `capabilities/telemetry.md` — "Never read 'the job-tools helpers are stubs'
    as 'worker tracing is a no-op'" (instructional aside addressed at the reader's
    misreading, note-to-self register).
18. `explanation/architecture.md` — "The honest caveat is narrow: the scaffold
    `createJobTools(ctx)` helpers … are currently no-op stubs — a tracked
    limitation with a fix planned".
19. `why.vto` — callout **"Auth is alpha — and honest about its edges"** +
    `index.vto` "Alpha — API subject to change" / `quickstart.vto` repeated
    "NetScript is in alpha … Pin versions" : the alpha hedge is restated on
    nearly every top page. One honest, well-placed alpha banner is right;
    five variants reading as self-reassurance is over-hedging.

### A.4 — Categories with ZERO hits (explicitly confirmed)

- **harness / "use harness"** — zero in rendered prose.
- **OpenHands / Codex / Claude / WSL** — zero.
- **agents / supervisor / evaluator (as authoring machinery)** — zero. ("saga
  supervisor" / "process supervisor" / "bring-your-own-supervisor" appear but are
  legitimate runtime/ops terms, not authoring-agent references.)
- **run-ids / `wf_*` / `jobs/<hash>` / `tmp/run`** — zero.
- **`.llm/` / `.agents/` paths** — zero.
- **PR # / issue # numbers** — zero.
- **TODO / FIXME / XXX / "placeholder" as a leak** — zero. (`background-jobs`
  ASCII and `fresh-ui.md` say "**not** a placeholder" — that is reassurance prose,
  not a leaked TODO.)
- **Raw un-rendered Vento / `{{ comp … }}` leaking into prose** — zero. All
  component tags are inside `.vto`/templated `.md` and render normally; none
  appear as literal text in a content body.
- **First-person-plural authoring asides** — the editorial "we" in `why.vto`
  ("we ship the boring integration seams," "We didn't invent new primitives") is
  a *deliberate brand voice* on the marketing page, not an authoring-machinery
  leak; left uncounted. No "we recently," "the team," or "our team" anywhere.

---

## Section B — Diagram opportunities

The site has **no rendered diagrams and no Mermaid**. Everything is ASCII or
prose. Each row: target page · what it should depict · current state.

| # | Target page | Diagram should depict | Current state |
|---|-------------|------------------------|---------------|
| 1 | `explanation/architecture.md` | **Overall architecture** — Aspire on top, plugin services (workers :8091 / sagas :8092 / triggers :8093 / auth :8094 / streams :4437) in the middle, kernel platform packages underneath, Postgres+Garnet at the base | **Currently ASCII** (a large box-drawing diagram) — convert to a clean rendered figure |
| 2 | `tutorials/build-a-service.md` | **Request lifecycle** — oRPC contract → `implement()` → router handler → `defineService` → typed client/island over `/api/rpc/*` | **Currently ASCII** (arrow chain) |
| 3 | `capabilities/durable-sagas.md` / `explanation/durable-workflows.md` | **Saga state machine + compensation** — states, message-driven transitions, `sagaComplete`/`sagaFail`/`send` effects, compensation-as-effect, kv/prisma checkpoint store | **Missing** (prose + code only) |
| 4 | `explanation/plugin-model.md` | **Plugin thread-isolation model** — API service vs. background processor as separate Aspire processes; in-process vs. web-worker vs. subprocess boundaries | **Missing** |
| 5 | `capabilities/background-jobs.md` | **Queue → worker → scheduler flow** — trigger HTTP `POST …/trigger` → dispatch span → worker pool execution → scheduler/cron loop → result | **Missing** |
| 6 | `capabilities/background-jobs.md` / a polyglot how-to | **Polyglot task execution** — subprocess worker spawn + traceparent propagation into the child process | **Missing** (only referenced in prose) |
| 7 | `explanation/aspire.md` | **Aspire resource graph** — AppHost wiring Postgres, Garnet, every service + processor, env-var injection, OTLP collector | **Missing** (prose "conductor" metaphor only) |
| 8 | `capabilities/auth.md` / `explanation/auth-model.md` | **Auth flow** — `AuthBackendPort` seam, the three pluggable backends (kv-oauth interactive / workos / better-auth), service-middleware `.withAuthn()/.withAuthz()`, five-endpoint surface on :8094 | **Missing** |
| 9 | `capabilities/streams.md` | **Durable streams producer → server → consumer** — `createDurableStream` producer → :4437 durable-stream service → HTTP/SSE consumer (and the manifest-stub redirect) | **Missing** |
| 10 | `capabilities/database.md` | **Database per-plugin schema aggregation** — root `schema.prisma` + each plugin's `.prisma` aggregated under `schema/plugins/<plugin>/` → generated client | **Currently ASCII** (file-tree) — promote to an ERD/aggregation figure |
| 11 | `tutorials/first-workspace.md` | **Scaffold project file-tree** — the generated `apps/ contracts/ services/ plugins/ aspire/ appsettings.json …` layout | **Currently ASCII** (file-tree) — keep as a styled file-tree *component* rather than raw code block |

---

## Section C — Bar-raising vs. competitors (Medusa / Astro / Laravel / TanStack)

The IA is competitive; the **affordance layer is not**. Page/feature-level gaps:

| Gap | Competitor pattern worth stealing | Where it applies to NetScript |
|-----|-----------------------------------|-------------------------------|
| **In-site search** | Astro & Medusa ship **Pagefind** (static, zero-backend full-text search) | No search box anywhere — add Pagefind to the Lume build; indexes capabilities/tutorials/how-to/reference |
| **On-page TOC** | Astro/Laravel right-rail "On this page" TOC with scroll-spy | Long pages (architecture, glossary, cli-reference, every capability hub) have no in-page nav; readers can't jump within a page |
| **Code-copy buttons** | Every competitor has one-click copy on code blocks | `tabbedCode`/code blocks render but have **no copy affordance** — critical for the install/`netscript init` commands |
| **Version switcher** | TanStack & Laravel version dropdown in the header | Site is alpha and explicitly says "pin versions," yet there is **no version selector** — add one keyed to JSR versions (even a single "alpha" pill now, real switcher at beta) |
| **"Was this helpful?" feedback** | Astro/Medusa per-page feedback widget | No feedback mechanism — add a lightweight thumbs widget per page to find weak docs |
| **ERD / schema visuals** | Medusa & Laravel ship ERDs for data models | `capabilities/database.md` and `auth-model.md` describe tables (`auth_users/sessions/accounts/verifications`) in prose/ASCII — render a real ERD (ties to Section B #10) |
| **Production-deploy checklist** | Laravel "Deployment" + Medusa "Production checklist" pages | `how-to/deploy.md` covers Windows-Service/`--no-aspire` but lacks a **checklist** (env vars, secrets, migrations, health, observability endpoints) |
| **Per-capability Learn/Do/Reference triplet** | (NetScript already has this — keep it) | Already present and strong; competitors lack this — **lean into it** as a differentiator, make the triplet a visible badge row |
| **Badges (status/version/runtime)** | TanStack/Medusa status + version badges on feature pages | Capabilities are at different maturity (streams consumer = stub, job-tools = debt); add **"stable / alpha / partial" status badges** per capability instead of repeating the prose caveat 7× (also fixes Section A.3) |
| **File-tree component** | Astro/Starlight `<FileTree>` component | Scaffold layout + database aggregation are raw ASCII code blocks; a real file-tree component renders cleaner and is collapsible (ties to Section B #11) |
| **Prev/Next continuity** | (Partially present via `nextPrev`) | `nextPrev` exists on some pages but is inconsistent — guarantee prev/next on **every** tutorial and how-to so the learning ladder never dead-ends |
| **Examples gallery** | Medusa "Recipes" + Astro "Themes/Examples" gallery | The scaffold ships `/examples/crud`, `/examples/service`, `/examples/telemetry` but the docs have **no gallery page** surfacing runnable examples |
| **Troubleshooting sections** | Laravel/Medusa per-feature "Troubleshooting" | Only `quickstart.vto` and `cli-reference.md` have failure callouts; capabilities/how-to pages have **no consistent troubleshooting block** (e.g., "aspire start failed," port-in-use, db-can't-connect should appear per relevant page) |
| **API option tables** | TanStack/Medusa exhaustive option tables per API | `apiTable` is used well in `cli-reference.md`/`why.vto`, but capability hubs describe builder options in prose — add **option tables** for `defineService`, `defineSaga`, `defineWebhook`, `createQueue` config |
| **Tabbed runtime/polyglot examples** | Astro framework-tab pattern; TanStack adapter tabs | `tabbedCode` exists — extend it for **polyglot task** and **queue-provider** (KV/Redis/RabbitMQ/Postgres) variants so the four-backend story is tab-switchable rather than buried in glossary prose |

---

## Notes for the overhaul

- **Leakage fix is mostly the Explanation zone.** Rewriting `architecture.md`,
  `plugin-model.md`, `durable-workflows.md`, and the `auth-model.md` doctrine
  sentence from *contributor-doctrine* register to *app-author-explanation*
  register clears 11 of 19 instances. Replace "the doctrine recognizes / axiom A12
  / publish gate is the doctrine gate / fitness function" with plain user-facing
  rationale; keep "kernel/port/adapter/composition" as ordinary nouns.
- **Debt-ID fix is mechanical:** delete the two `(debt
  workers-scaffold-job-tools-noop)` parentheticals; keep the honest "no-op today,
  fix planned, call `@netscript/telemetry` directly" caveat.
- **Over-hedging fix:** consolidate the ~7 restatements of the job-tools caveat
  into **one** canonical callout (Observability) + a per-capability **status
  badge**, and drop the "Honest reality / Do not say …" framing for neutral
  user-caveat wording. Keep exactly one alpha banner pattern across top pages.
