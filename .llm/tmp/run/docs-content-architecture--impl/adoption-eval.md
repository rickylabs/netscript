# ADOPTION-EVAL: PASS

**Decisive adoption factor:** The integration-tax framing on `why.vto` — six named, real pains a
senior TS engineer has lived — paired with concrete TypeScript code proofs for each of the six
pillars, makes the adoption case concrete and believable rather than aspirational.

---

## Question 1 — Feature landscape coverage

**Verdict: All six pillars are visible on the front-door path (index → why → quickstart).**

| Pillar | Index (`index.vto`) | Why (`why.vto`) | Quickstart (`quickstart.vto`) |
|---|---|---|---|
| Type-safe oRPC services | Feature grid #1: "Contract-first, type-safe end to end" | Section "1. Contract-first, type-safe end to end" w/ 2-tab code proof (contract def + typed client) | "shared oRPC contracts" in scaffold description; `defineService` snippet in "See the framework code" |
| Durable workflows (sagas/triggers/jobs) | Feature grid #3: "Durable workflows by design" — names sagas, triggers, jobs, compensation, crash boundaries | Section "2. Durable workflows by design" w/ 2-tab code proof (saga state machine + cascaded effects) | Plugin registry mentions "workers, sagas, triggers, and streams" |
| Observability-by-default (OTel) | Feature grid #4: "Observable by default" — "OpenTelemetry tracing and structured logs are wired in from line one" | Section "3. Observable by default" w/ 2-tab code proof (`withSpan` + `defineService`) | "OpenTelemetry-traced" in hero and tagline |
| Plugin model | Feature grid #5: "Composable plugins" — "Add workers, sagas, triggers, and streams in any combination. The host never changes." | Section "5. Composable plugins" | "plugin registry ready for workers, sagas, triggers, and streams" |
| .NET Aspire orchestration | Feature grid #2: "Orchestrated with Aspire" — hero-level per Q7 | Section "4. Orchestrated with Aspire" + `--no-aspire` opt-out explicit | Step 3 is the full Aspire flow; separate "Prefer no orchestration?" callout with `--no-aspire` |
| Copy-source fresh-ui | Feature grid #6: "You own your UI" — "copy-source: the CLI copies components into your repo" | Section "6. You own your UI" | Feature grid: "fresh-ui components copied into your repo… the code is yours to change" |

No pillar is invisible or buried. The index feature grid is a complete six-card map of the
capability surface; the why page backs five of them with working code; the quickstart connects
the scaffold output to each pillar in the "You now have" grid.

## Question 2 — Would a skeptical senior TS engineer adopt?

**Verdict: Yes — the adoption case is concrete and honest enough to convert.**

**What would land for a senior engineer choosing between NestJS / Encore / tRPC / Temporal / Hono:**

1. **The pain is named accurately, not hand-waved.** `why.vto` opens with six integration pains a
   senior TS backend engineer has actually shipped through: "a queue here, a tracer there," "a
   scaffold script that rots," "a `docker-compose.yml` and a prayer," "drift between the API and the
   client," "durable workflows faked with retries." This is not marketing — it's a diagnosis a
   senior engineer would nod at.
2. **The answer is working TypeScript, not framework adjectives.** The three code-proof sections on
   `why.vto` show `defineService`, `defineSaga`, and `withSpan` in idiomatic, commented TS. A senior
   engineer can see in 20 seconds that the API surface is small, builder-based, and not magic. The
   "This replaces ~40 lines of Hono setup" and "This replaces an ad-hoc 'mark paid, then hope the
   retry fires' flow" comments do the competitive work without naming competitors.
3. **The comparison table is honest rather than combative.** The table on `why.vto` names NestJS,
   Encore, tRPC-style stacks, Temporal, and Hono in a single frame — positions NetScript as the
   *fitted* answer that wraps rather than replaces (notably "We wrap it, not replace it" for Hono,
   and "closer to Temporal than to a job queue, but authored in plain TS builders inside your app"
   for sagas).
4. **Objections are head-on, not buried:**
   - **Alpha status** is a visible callout on all three pages with a concrete timeline ("beta by
     end of 2026") and actionable guidance ("pin your versions").
   - **`.NET` Aspire** is offered as a named differentiator with the `--no-aspire` escape hatch
     visible in the index hero code sample, the why page, and the quickstart's dedicated callout
     ("Prefer no orchestration?").
   - **Scope** is bounded explicitly in the "NOT the right tool" callout: "not a React-style
     frontend framework, and it does not host anything for you."
5. **The "NOT the right tool" callout builds trust.** Telling a reader when *not* to adopt is the
   fastest credibility signal a framework doc can send. This page does it.

**What could still lose them (non-blocking):**
- Quickstart has no framework-code snippet beyond `defineService` — a senior engineer doing the
  5-minute eval sees bash and URLs but not a saga or typed client until tutorial 2. The Stage-5
  P0 for a `defineSaga` snippet was actioned; the current `defineService` snippet in "See the
  framework code" partially addresses it.
- The `.NET` footprint in the *default* path (`aspire restore`, `aspire run`) may still spook a
  Linux/Mac TS-only shop. The `--no-aspire` path is documented but not demo'd end-to-end — the
  reader gets one line ("`deno task --cwd apps/dashboard dev`") versus the full Aspire walkthrough.

Neither is a blocker: both are addressable in follow-up content, not front-door copy.

## Locked-08 compliance (read-only check)

- Q1 hero/subhead — present verbatim on `index.vto` and `why.vto`.
- Q2 tone — warm "we", no hype adjectives, no body emoji.
- Q4 competitive framing — single honest table, no per-competitor sections.
- Q5 alpha — callout on all three front-door pages.
- Q7 Aspire — hero-level, with `--no-aspire` opt-out visible on quickstart and why.
- Q8 fresh-ui — USP card, not hero-level.

---

## Minimal adoption-blocking changes

**None.** The front door is sufficient to convert a skeptical senior TS engineer who reads all
three pages. No further changes are required to flip "interesting" to "I'd try this on a real
project."
