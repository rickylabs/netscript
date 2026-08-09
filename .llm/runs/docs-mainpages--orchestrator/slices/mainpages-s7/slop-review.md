---
slice: mainpages-s7
reviewer: prose-quality (anti-AI-slop + enterprise terminology)
scope: docs/site/{index,why,quickstart,concepts}.vto
date: 2026-08-04
---

# Slop & Terminology Review — PR #1216 main pages

Locked hero wordings, intentional short taglines, and accurate dense
technical conditions are excluded from findings per scope. Findings are
grouped per file with `fix` (clear defect) and `consider` (judgment call)
severities.

---

## /home/codex/repos/ns-mainpages/docs/site/index.vto

### F1 — terminology drift: "compensator" vs "compensation handler" (consider)

- **Current:** `Executing that request needs a saga bus bridge with a compensator; surviving a restart needs a durable store.` (index.vto:43)
- **Proposed:** `Executing that request needs a saga bus bridge with a compensation handler; surviving a restart needs a durable store.`
- **Why:** `explanation/durability-model.md:227` and `tutorials/storefront/04-checkout-saga.md:91` both refer to the handler surface as a "compensation handler"; `compensator` only appears as the `native.compensator` API port name in sagas.md. Marketing prose should use the surface name a senior reader will recognize.

### F2 — minor verb construction (consider)

- **Current:** `the runtime records every step through its saga store instead of treating a multi-step flow as a retry loop.` (index.vto:17)
- **Proposed:** `the runtime records every step in its saga store instead of treating a multi-step flow as a retry loop.`
- **Why:** "records every step through its saga store" reads transitively — records flow *through* the store; the store is the destination, so `in` is the correct preposition.

### F3 — slight overloading of "traced fleet" (consider)

- **Current:** `aspire start brings up the whole generated resource graph; the dashboard then reports resource health and carries logs and traces across it.` (index.vto:27)
- **Proposed:** `aspire start brings up the whole generated resource graph; the dashboard reports resource health and ties logs and traces to it.`
- **Why:** "carries logs and traces across it" is vague (across what boundary?); "ties logs and traces to it" matches the OTLP/trace-context mechanics on concepts.vto:66-67. Also: "then reports" implies a sequence the dashboard doesn't actually require — it reports live as resources start.

### F4 — passive subject inversion (consider)

- **Current:** `surviving a restart needs a durable store. With that wiring, the registered handler emits payment.refund.` (index.vto:43-44)
- **Proposed:** `the saga needs a durable store to survive a restart. With that wiring, the registered handler emits payment.refund.`
- **Why:** "Surviving a restart needs X" buries the agent; the surrounding prose already names "the registered handler" so naming the saga as the subject reads more cleanly.

---

## /home/codex/repos/ns-mainpages/docs/site/why.vto

### F5 — terminology drift: "background runtimes" vs "plugin runtimes" (fix)

- **Current:** `NetScript uses Fresh and Hono as foundations, then adds service contracts, background runtimes, and an Aspire workspace.` (why.vto:57)
- **Proposed:** `NetScript uses Fresh and Hono as foundations, then adds service contracts, plugin runtimes, and an Aspire workspace.`
- **Why:** Every other reference in the four pages and in `concepts.vto:44` calls these "plugin runtimes". Using "background runtimes" once — and only on the comparison row — splits the same concept across two terms.

### F6 — section heading style drift (fix)

- **Current:** `## The integration tax`, `## The two decisions that are expensive to retrofit`, `## Compare the center of gravity`, `## The trade-offs are real` (why.vto:20, 35, 47, 82)
- **Proposed:** numbered headings matching concepts.vto and quickstart.vto, e.g. `## 1. The integration tax`, `## 2. The two decisions that are expensive to retrofit`, `## 3. Compare the center of gravity`, `## 4. The trade-offs are real`
- **Why:** concepts.vto and quickstart.vto both use `## N.` numbering; why.vto is the only page that drops the number. The four pages are sibling entry points and should read in one voice.

### F7 — "not X but Y" claim (consider, NOT flagged as slop)

- **Current:** `The cost is not choosing them once; it is maintaining the seams between them:` (why.vto:23)
- **Status:** No change. The negation here carries a substantive distinction (one-time selection cost vs ongoing integration cost) and the prompt explicitly excludes accurate technical claims. Mentioned for the record only — do not rewrite.

### F8 — prepositional slide (consider)

- **Current:** `Aspire brings up the resources with their telemetry connected.` (why.vto:45)
- **Proposed:** `Aspire brings up the resources with telemetry connected.`
- **Why:** "their telemetry" anthropomorphizes the resource graph; the resource graph doesn't own telemetry — Aspire configures the OTLP endpoints into each resource's environment.

### F9 — idiom, borderline marketing-speak (consider)

- **Current:** `NetScript begins to pay for itself when the boundaries between processes, background work, and the browser have become part of the product.` (why.vto:17-18)
- **Status:** Defensible idiom in context (sets up a concrete threshold). Leave unless reviewer wants stricter tone; flag for the record.

---

## /home/codex/repos/ns-mainpages/docs/site/quickstart.vto

### F10 — page-level heading parity (fix)

- **Current:** `# Run a NetScript workspace, then change it` (quickstart.vto:7)
- **Proposed:** remove the H1 and let the hero (front-matter title `Quickstart`) carry the page title, matching index/why/concepts.
- **Why:** index/why/concepts all rely on front-matter title + hero block. quickstart is the only page that adds a body H1, and the four pages are meant to read as one entry-point set.

### F11 — "start Docker" phrasing (fix)

- **Current:** `Install Deno 2.x, the .NET Aspire CLI, and start Docker before continuing.` (quickstart.vto:13-15)
- **Proposed:** `Install Deno 2.x and the .NET Aspire CLI, and have Docker running before continuing.`
- **Why:** "start Docker" is ambiguous — readers can read it as `systemctl start docker`, `open Docker Desktop`, or "launch a container runtime". A senior reader will pause; "have Docker running" is the standard quickstart phrasing.

### F12 — sentence flow, pivot step in a list (consider)

- **Current:** `This path installs the CLI, scaffolds one example service, starts the generated resource graph, and makes one visible edit.` (quickstart.vto:9-10)
- **Proposed:** `This path installs the CLI, scaffolds one example service, starts the generated resource graph, and walks you through one visible edit.`
- **Why:** "makes one visible edit" reads as if the path *produces* an edit; the edit is reader-driven. "Walks you through" keeps the agent on the reader.

### F13 — verbosity in the "find and replace" sentence (consider)

- **Current:** `Find the wrapped introductory sentence that starts with A generated NetScript workspace and replace that sentence with This checkout dashboard is ours.` (quickstart.vto:56-58)
- **Proposed:** `Replace the introductory sentence starting with A generated NetScript workspace with This checkout dashboard is ours.`
- **Why:** Collapses the find-then-replace pattern into the imperative form a senior reader expects in a quickstart. The trade-off is removing "the wrapped" — if "wrapped" carries a real meaning (a layout component), keep it.

---

## /home/codex/repos/ns-mainpages/docs/site/concepts.vto

### F14 — terminology drift: "service discovery" vs "service-discovery" (fix)

- **Current (two forms in the same file):**
  - `[service discovery](/services-sdk/how-to/discover-services/).` (concepts.vto:38)
  - `then inject service-discovery and OTLP configuration into their processes.` (concepts.vto:65)
- **Proposed (pick one form, apply everywhere):**
  - `[service discovery](/services-sdk/how-to/discover-services/).` (concepts.vto:38)
  - `then inject service discovery and OTLP configuration into each process.` (concepts.vto:65)
- **Why:** The rest of the docs (`reference/sdk/index.md:38`, `services-sdk/sdk.md:32`, `data-persistence/how-to/choose-a-queue-provider.md:89`) all use the unhyphenated "service discovery". Two styles on the same page is a drift the page itself introduces.

### F15 — em-dash paragraph aside (consider)

- **Current:** `Contracts define the boundaries. Everything else — services, plugin runtimes, the web layer, the observed resource graph — carries them somewhere.` (concepts.vto:9)
- **Status:** Single instance, not overuse. Leave — the em-dashes here carry real parenthetical weight (one sentence is genuinely broken by the aside). Mentioned for the record only.

### F16 — preposition under "observed graph" (fix)

- **Current:** `the AppHost materializes the resources and their infrastructure under one observed graph.` (concepts.vto:16)
- **Proposed:** `the AppHost materializes the resources and their infrastructure as one observed graph.`
- **Why:** "Under one observed graph" reads as if the graph is a container placed under the resources; the AppHost materializes the resources *as a graph* that is observed. "As" matches the act of materialization.

### F17 — "Aspire-injected" compound (consider)

- **Current:** `SDK clients resolve service URLs lazily from Aspire-injected environment values, so callers do not pin a local port into application code.` (concepts.vto:33)
- **Proposed:** `SDK clients resolve service URLs lazily from environment values that Aspire injects, so callers do not pin a local port into application code.`
- **Why:** "Aspire-injected" is an ad-hoc compound; the codebase uses "Aspire service discovery" / "values injected by Aspire" elsewhere. Restating as a relative clause matches the surrounding prose register.

### F18 — scare-quoted ordinary noun phrase (consider)

- **Current:** `"One plugin" is a packaging unit, not a runtime unit.` (concepts.vto:47)
- **Proposed:** `A plugin is a packaging unit, not a runtime unit.`
- **Why:** "One plugin" isn't a project term of art (no canonical glossary entry in the four pages or in `glossary.md`) — the quotes call out a phrase that isn't actually named. Drop the quotes or replace with a real term like `plugin manifest`.

### F19 — heading style parity (informational)

- **Status:** concepts.vto uses numbered `## 1. ... ## 5.` headings; this matches quickstart.vto and (after F6) will match why.vto. No change needed on concepts.vto itself.

---

## Cross-file consistency notes (no fix proposed)

- **Hero subheads all end in periods.** Consistent across index, why, concepts. quickstart has no hero block (see F10).
- **Brand capitalization is consistent:** `Fresh`, `Fresh 2`, `Preact`, `oRPC`, `OpenAPI`, `Hono`, `Deno`, `.NET Aspire CLI`, `AppHost`, `OTLP`, `TanStack Query`, `Scalar` — all canonical across the four files.
- **Saga capitalization** is consistent (always lowercase "saga" except when naming the API surface `defineSaga`, `sagaCompensate`, `SagaCorrelationKey`).
- **Aspire terminology** is consistent across the four files: `Aspire` for the product, `AppHost` for the generated orchestrator, `the Aspire dashboard` for the UI, `aspire` lowercase for the CLI command.
- **Service-vs-plugin terminology** is consistent except for F5 (one row of the comparison table says "background runtimes").

---

## Findings summary

| #  | File        | Severity  | One-line                                           |
|----|-------------|-----------|----------------------------------------------------|
| F1 | index       | consider  | "compensator" → "compensation handler"             |
| F2 | index       | consider  | "records through" → "records in"                   |
| F3 | index       | consider  | vague "carries traces across it"                   |
| F4 | index       | consider  | "surviving a restart needs" → named agent          |
| F5 | why         | fix       | "background runtimes" → "plugin runtimes"          |
| F6 | why         | fix       | unnumbered section headings → numbered             |
| F7 | why         | n/a       | "not X but Y" — substantive, keep                  |
| F8 | why         | consider  | "their telemetry" anthropomorphizes resources      |
| F9 | why         | consider  | "begins to pay for itself" — borderline idiom      |
| F10| quickstart  | fix       | body H1 vs hero parity                             |
| F11| quickstart  | fix       | "start Docker" ambiguous                            |
| F12| quickstart  | consider  | "makes one visible edit" misattributes the actor   |
| F13| quickstart  | consider  | verbose "find then replace" pattern                |
| F14| concepts    | fix       | "service discovery" / "service-discovery" drift    |
| F15| concepts    | n/a       | em-dash aside — single instance, keep              |
| F16| concepts    | fix       | "under one observed graph" → "as one observed graph" |
| F17| concepts    | consider  | "Aspire-injected" → relative clause                |
| F18| concepts    | consider  | scare-quoted "One plugin" isn't a project term     |
| F19| concepts    | n/a       | heading style matches after F6                     |

---

## Verdict

**FIX_LIST** — five `fix` items (F5, F6, F10, F11, F14, F16) plus nine
`consider` items. The pages read as one entry-point set in register,
brand capitalization, and hero voice, but they drift on: (a) the
section-heading numbering convention, (b) one comparison row's
"background runtimes" vs "plugin runtimes", (c) "service discovery" vs
"service-discovery" inside concepts.vto itself, (d) page-level heading
parity for quickstart, (e) one ambiguous quickstart prerequisite phrase,
and (f) two preposition/voice slips that a senior engineer will catch
in the first read.