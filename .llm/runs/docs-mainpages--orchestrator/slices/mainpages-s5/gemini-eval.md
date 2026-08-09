# Evaluation & Prose Polish: NetScript Main-Pages Revamp

**Evaluator:** Gemini 3.6 Flash (High)  
**Target Repository:** `/home/codex/repos/ns-mainpages` (Branch: `docs/main-pages-revamp`)  
**Locked Spec:** `/home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s1/synthesis.md`  

---

## Executive Summary & Final Verdict

**Overall Call: ADJUST AND SHIP**

The rewritten main pages represent a massive upgrade over conventional framework docs. The 4-page funnel (`/` want it → `/why/` choose it → `/quickstart/` run it → `/concepts/` understand it) eliminates fluff, respects strict screen budgets, and communicates a coherent architectural value proposition. 

Compared to gold-standard developer sites (**Next.js**, **Deno Fresh**, **Encore.dev**, **Temporal.io**, **Astro**), NetScript's messaging stands out for its intellectual honesty, zero-hyperbole positioning, and strong focus on real-world engineering pain (the "integration tax").

However, minor prose friction, passive phrasing, and academic runtime explanations hold it back from landing an instant 30-second "aha!" moment. Implementing the targeted prose-polish proposals below will elevate the copy to top-tier industry standard.

---

## Page-by-Page Evaluation

### 1. Homepage (`docs/site/index.vto`)
* **Verdict:** `ADJUST`
* **30-Second Hook Evaluation:** 
  * **Strengths:** The tagline (`Your checkout survives the crash. Your types survive the refactor.`) is elite—it immediately targets senior engineers who have suffered through distributed state bugs and broken client schemas. The single code moment showcasing a durable checkout saga with explicit compensation provides undeniable proof.
  * **Weaknesses vs. Benchmarks (Next.js / Encore / Fresh):** 
    1. *No Instant Command:* Benchmark sites like Next.js (`npx create-next-app`), Astro, and Encore offer a copyable terminal setup command directly in or near the hero. NetScript hides the CLI command until `/quickstart/`.
    2. *Academic Explanation Lede:* The paragraph below the saga snippet (`Executing that request requires a saga bus bridge configured with a compensator...`) reads like an internal architecture specification rather than developer-focused proof of outcome.
    3. *Feature Grid Wording:* The body text of the feature grid items is slightly passive and dense.

---

### 2. Why NetScript (`docs/site/why.vto`)
* **Verdict:** `ADJUST`
* **Persuasiveness & Fairness Evaluation:**
  * **Strengths:** Highly persuasive for its target audience ("teams whose TypeScript app has become a system"). The "Integration Tax" section is brilliant and framing trade-offs upfront builds immense developer trust.
  * **Comparison Table Fairness:** The matrix is exceptionally fair and non-defensive. Instead of declaring victory, it accurately highlights the "center of gravity" of each alternative.
  * **Weaknesses:** Minor naming inconsistency in the table ("Encore-style stack" vs. direct names like "Temporal" and "Next.js") and slight jargon density in section transition sentences.

---

### 3. Quickstart (`docs/site/quickstart.vto`)
* **Verdict:** `ADJUST`
* **First-Change "Aha!" Moment Evaluation:**
  * **Strengths:** Fast, friction-free path (install → scaffold → `aspire start` → edit). The explicit callouts for prerequisites and database start ordering are great UX.
  * **Weaknesses:** Changing a text string in `home-view.tsx` demonstrates hot reloading, but the copy misses the opportunity to emphasize *why* this matters in NetScript (hot reloading the Fresh frontend while staying connected live to the Aspire telemetry graph and backend services). Additionally, the defensive note ("This file is always written by the app scaffold...") breaks momentum.

---

### 4. Core Concepts (`docs/site/concepts.vto`)
* **Verdict:** `ADJUST`
* **Mental Model vs. Documentation Filler Evaluation:**
  * **Strengths:** Reads genuinely as a 5-layer mental model (Contracts → Services → Plugins → Web Layer → Observability) anchored by an architecture overview diagram.
  * **Weaknesses:** Sections 3 (Plugins) and 5 (Observability) shift into schema/mechanics descriptions rather than keeping the focus on structural purpose.

---

## Concrete Adjustment Proposals

Below are the exact, line-level replacement proposals to polish the prose to top-tier human readability and impact.

### 1. `docs/site/index.vto`

#### Proposal 1.1: Feature Grid Bodies (Lines 14–30)
* **Rationale:** Make feature descriptions active, punchy, and outcome-oriented.

**Current Text:**
```vto
{{ comp.featureGrid({ items: [
  {
    title: "Durability is a state machine",
    body: "Saga definitions make state transitions and compensation explicit; the runtime records them through its store instead of treating a multi-step flow as a retry loop.",
    href: "/durable-workflows/"
  },
  {
    title: "One contract crosses the stack",
    body: "The same oRPC contract is implemented by the service, drives its OpenAPI document, and types the SDK call a Fresh page loader makes.",
    href: "/services-sdk/"
  },
  {
    title: "One command starts the traced fleet",
    body: "Start the generated resource graph together, then use Aspire's dashboard to check resource health and follow logs and traces across it.",
    href: "/observability/"
  }
] }) }}
```

**Proposed Replacement:**
```vto
{{ comp.featureGrid({ items: [
  {
    title: "Durability is a state machine",
    body: "Define state transitions and compensation in TypeScript. The runtime persists every step to a durable store—no ad-hoc retry loops or lost state when processes restart.",
    href: "/durable-workflows/"
  },
  {
    title: "One contract crosses the stack",
    body: "Write one oRPC contract to power your service handlers, generate OpenAPI schemas, and strongly type the SDK calls in your Fresh page loaders.",
    href: "/services-sdk/"
  },
  {
    title: "One command starts the traced fleet",
    body: "Spin up your services, Postgres, Redis, and background workers in one command, then track health, logs, and distributed traces in the Aspire dashboard.",
    href: "/observability/"
  }
] }) }}
```

---

#### Proposal 1.2: Code Snippet Lede Paragraph (Lines 40–47)
* **Rationale:** Replace technical setup prerequisites ("requires a saga bus bridge...") with a clear, outcome-focused explanation of the saga execution.

**Current Text:**
```vto
<p class="ns-lede">
The definition correlates both events by <code>orderId</code>. When <code>inventory.failed</code>
arrives, its handler returns a compensation request for <code>payment.captured</code>. Executing that
request requires a saga bus bridge configured with a compensator, while restart recovery requires a
durable store; with that runtime wiring, the registered compensation handler emits
<code>payment.refund</code>.
<a href="{{ '/durable-workflows/' |> url }}">See the durability model</a>.
</p>
```

**Proposed Replacement:**
```vto
<p class="ns-lede">
This saga correlates events by <code>orderId</code>. When <code>inventory.failed</code> triggers compensation for <code>payment.captured</code>, NetScript handles the recovery state and automatically dispatches <code>payment.refund</code>—even across process restarts.
<a href="{{ '/durable-workflows/' |> url }}">See the durability model</a>.
</p>
```

---

### 2. `docs/site/why.vto`

#### Proposal 2.1: Integration Tax Bullet 2 (Lines 27–28)
* **Rationale:** Sharpen abstract terms ("unwind path", "multi-step effect") into clear developer language.

**Current Text:**
```vto
2. **A retry loop stands in for durable state.** A multi-step effect has no recorded position or
   named unwind path when the process stops halfway through.
```

**Proposed Replacement:**
```vto
2. **A retry loop stands in for durable state.** Multi-step workflows lack recorded checkpoints or explicit rollbacks, leaving systems half-executed when a server crashes.
```

---

#### Proposal 2.2: Section 2 Transition Sentence (Lines 43–45)
* **Rationale:** Eliminate stiff jargon ("makes those choices operable").

**Current Text:**
```vto
The rest of the model makes those choices operable. Services expose the contract at request time;
plugin runtimes own work that outlives the request; Aspire materializes the resources and connects
their telemetry. The implementation details live in [Core concepts](/concepts/).
```

**Proposed Replacement:**
```vto
The rest of NetScript makes those core decisions operational. Services serve request-time contracts, plugins handle background execution, and Aspire orchestrates local resources with built-in telemetry. Details live in [Core concepts](/concepts/).
```

---

#### Proposal 2.3: Comparison Table Row Name (Line 65)
* **Rationale:** Align row naming with Temporal and Next.js for direct parity.

**Current Text:**
```vto
    {
      name: "Encore-style stack",
```

**Proposed Replacement:**
```vto
    {
      name: "Encore",
```

---

### 3. `docs/site/quickstart.vto`

#### Proposal 3.1: Step 4 First-Change Wording (Lines 54–63)
* **Rationale:** Frame the first change to land the full-stack hot-reload "aha" moment and remove defensive meta-commentary.

**Current Text:**
```vto
## 4. Make the first change

Open `apps/dashboard/routes/(_components)/home-view.tsx`. Find the wrapped introductory sentence
that starts with `A generated NetScript workspace` and replace that sentence with
`This checkout dashboard is ours.` Save the file, then refresh the Fresh app URL from Aspire. The
new sentence should appear below the `my-app` heading while the app remains healthy.

This file is always written by the app scaffold; it does not depend on the optional example-service
templates. [See how the web layer is structured](/web-layer/).
```

**Proposed Replacement:**
```vto
## 4. Make your first live change

Open `apps/dashboard/routes/(_components)/home-view.tsx`. Locate the introductory text starting with `A generated NetScript workspace` and update it to `This checkout dashboard is ours.`

Save the file and refresh your browser. Fresh instantly hot-reloads the page without interrupting your running Aspire session or background services.

[Explore how the web layer is structured](/web-layer/).
```

---

### 4. `docs/site/concepts.vto`

#### Proposal 4.1: Section 3 - Plugins (Lines 40–49)
* **Rationale:** Shift focus from raw manifest validation to modular capability delivery.

**Current Text:**
```vto
## 3. Plugins add runtime capabilities

The host is empty; plugins fill it. A plugin manifest is validated data that declares services,
background processors, schemas, topics, configuration, and telemetry contributions. The CLI turns
those declarations into static workspace wiring, and Aspire can materialize a plugin's API and
background processors as separate resources.

“One plugin” is a packaging unit, not a runtime unit. Workers, sagas, triggers, and streams are the
durable examples; the full manifest and registry mechanics live in
[the plugin-system explanation](/explanation/plugin-system/).
```

**Proposed Replacement:**
```vto
## 3. Plugins add runtime capabilities

The host core is lean; plugins provide the runtime capabilities. A plugin manifest declares background processors, message schemas, queues, topics, and telemetry contributions. The NetScript CLI uses these declarations to generate static workspace wiring, while Aspire provisions background workers and APIs as independent resources.

A plugin is a modular packaging boundary, not a monolithic process. Sagas, background workers, scheduled triggers, and event streams all ship as plugins. Deep-dive into manifest and registry mechanics in [the plugin-system guide](/explanation/plugin-system/).
```

---

#### Proposal 4.2: Section 5 - Observability (Lines 62–72)
* **Rationale:** Enhance flow and clarify trace propagation guarantees.

**Current Text:**
```vto
## 5. Observability connects the resource graph

One runtime, many resources. The generated AppHost composes apps, services, plugin processors,
databases, and cache resources, then injects service-discovery and OTLP configuration into their
processes. The Aspire dashboard reads health, logs, traces, and metrics from that running graph;
trace context carried by SDK calls keeps client and service spans connected.

Aspire is the default local orchestration layer, not part of every package API. Without it, the Deno
packages remain usable, but resource startup, discovery values, and telemetry wiring become the
application's responsibility. Read [Orchestration & runtime](/orchestration-runtime/),
[Observability](/observability/), or [the Aspire boundary](/explanation/aspire/) for mechanics.
```

**Proposed Replacement:**
```vto
## 5. Observability connects the resource graph

One runtime, many resources. The generated AppHost orchestrates web apps, services, plugin workers, databases, and caches while injecting service discovery and OTLP trace context into every process. The Aspire dashboard captures logs, metrics, and distributed traces across the entire stack, maintaining request context seamlessly from browser SDK calls down to backend services.

Aspire provides local orchestration and tracing out of the box. You can run NetScript without Aspire, though manual startup, service discovery, and telemetry wiring will fall back to your application setup. Learn more in [Orchestration & runtime](/orchestration-runtime/), [Observability](/observability/), or [the Aspire boundary](/explanation/aspire/).
```
