# P5 — Distributed AI Surface: Embedded Assists + AI Console

**Revamp the AI surface of the NetScript Dev Dashboard using the published "NS One" design
system**, inside the P1 shell and locked routes. The mandate: NOT a generic chat pane — AI
capability distributed across the product as actions, automations, context augmentation, and
embedded assists, all grounded in the live framework registry and joined to the correlation
spine. FINAL product framing throughout.

---

## ⚠️ Read this first — verified against the live prototype

**1. The SVG defect.** The Design Components runtime **does not fill `{{ }}` template holes inside
SVG subtrees.** Literal `{{ k.fill }}` / `{{ e.lx }}` strings survive into the DOM and throw browser
console errors (`<path> attribute d: Expected moveto path command…`). **Never put a `{{ }}` hole
inside an SVG element or attribute.** Either build the geometry post-mount in JS, or avoid SVG.
**Zero `{{ }}` may survive into the rendered DOM** — checked mechanically, in both themes.

*Where this bites in P5:* the `/ai` KPI strip uses `ns-kpi`, whose sparkline was an SVG `<path
d="{{ … }}">`. P1 has already replaced it with a token-driven `div` micro-column chart (`__spark` →
a flex row of `__bar` divs). **Reuse that; do not reintroduce the SVG.**

**2. The prototype renders raw `ns-*` CSS classes, not React components — keep it that way.**
Do not switch to `window.NSOne` React components. The class-based markup is deliberate: it
round-trips into the framework's Fresh/Preact source unchanged, which is the whole point of the
sync-back loop. This applies to the AI components too: **`ToolCallCard` is used as its CSS class
contract (`ns-tool-call` / `__*`), not as a React component.** Style **only** via `--ns-*` custom
properties and `ns-*` classes. No raw hex — derive missing shades with `color-mix()`.

**3. The bound design system was stale and has been refreshed.** `_ds/` now carries the current NS
One runtime and style closure (45 component units).

**4. Retired — rendering any of these is a defect, not a style choice.**

| Unit | Why | Use instead |
| ---- | --- | ----------- |
| **`ns-ai-summary`** | **Superseded — and P5 is the prompt that most wants to reach for it.** Its 135° `primary-subtle` gradient background is decoration, not data: it is the "AI = shiny gradient" trope, and this product is an instrument. | **`ns-assist`** (below) |
| `ns-waterfall` | An OTLP trace waterfall / span gantt is Aspire's. | — |
| `ns-preview-tag` | Violates final-product framing. | — (delete it) |
| `ns-log-stream` | The follow-mode log tail is Aspire's. | `ns-logstrip` |
| **`McpUiWidget`** | It is in the refreshed registry, and this prompt mentions MCP-backed tool sources — so the temptation is real. **MCP is a data *source*, not a render target.** The panel IA renders typed NetScript data. Describe MCP tool sources in the tool registry; never mount an MCP widget iframe on a dashboard screen. | — |
| `DataGrid` | Not a canvas block. | `DataTable` |

**`ns-assist` — the component this prompt is really about.** It is the *one* assist affordance,
declared once and reused on every surface. Its **law**:

> An assist **always** shows its **grounding** — which live calls / entities it read, each a
> deep-link — and **always** terminates in a **deep-link or a confirm+CLI action**. An assist that
> just talks is the Axis-5 failure mode.

Class contract: `ns-assist` / `__head` / `__summary` / `__grounding` / `__ground` / `__suggestion` /
`__actions` / `__meta`; `data-state="idle|thinking|ready|error"`. Visual: a calm card with a 2 px
`--ns-primary` left edge and a small ✦ glyph — **no gradient**. The ✦ AI accent is used
consistently and ONLY for AI artifacts.

**5. Model labels are neutral.** Render the model as `ops-model-large` — **never a real vendor model
id.** Same for any provider name.

---

## What P1 already locked — reuse it, do not redesign it

This is a **separate conversation** from P1, but it edits the **same project**. The shell is already
there. Reuse it exactly.

- **The route tree.** Yours:
  ```
  /ai              ?tab=activity|tools  ?ask=<seed>
  /ai/runs/:runId
  ```
  Plus **assist slots retro-fitted onto screens P2–P4 already built** (see "the four forms" below).
  The distributed affordances are **in-panel actions on other routes** — they get no routes of their
  own. Routing only needs the durable-run address.
- **The sidebar** — four groups; AI badge = **1** (running agent runs, primary tone).
- **Breadcrumbs derive purely from the pathname.** A *collection segment* absorbs the id after it:
  `/ai/runs/r_77` → **`AI / Agent run r_77`**.
- **The address strip** renders the live URL. The ⌘K "Ask" affordance seeds `?ask=<seed>`, so an ask
  is itself a shareable address.
- **⌘K** — Navigate / Act / Recent; plugin-contributed actions carry a provenance chip. The "Ask
  about your app" overlay is a ⌘K-family surface, **not** a persistent chat drawer.
- **`ns-confirm` — the five beats:** plan → diff → **exact CLI equivalent** → confirm → result.
  **The CLI block is a REQUIRED slot.** *This is the hinge of the whole AI story:* **AI never mutates
  directly — it fills in the same confirm dialog a human would.**

**There is NO persistent AI dock in the shell.** That was considered and rejected: a dock changes
every screen's right edge and cannot be retro-fitted cheaply. AI lives in-panel and in `/ai`. Do not
add one.

---

## The canonical fixture — one incident, every screen, no contradictions

```
POST /webhooks/stripe
  → trigger  webhook.payment      event      evt_2210
  → saga     PaymentWebhookSaga   instance   ch_3QK9dR2eZ   COMPENSATING, step 2 of 4
  → job      reserve-inventory    execution  job_4183       attempt 2 of 3, RETRYING
  → stream   payment-events       message    msg_88f        2/3 delivered · 1 failed (analytics)
```

**`ch_3QK9dR2eZ` is THE journey id**, and the AI run that investigated the incident carries it —
**AI joins the same spine.** The execution id is `job_4183` (not `exec_4183`); `msg_88f` is the
stream *message* id.

**AI derived stats (the `/ai` KPI strip):**

| Fact | Value |
| ---- | ----- |
| Agent runs (24 h) | **31** |
| Tool calls | **118** |
| Tool-failure rate | **4 %** |
| Median latency | **2.9 s** |
| Contract procedures exposed as agent tools | **12** |
| Running agent runs (= the sidebar badge) | **1** |

**The rest of the ledger** (so your assists' grounding is real): override `v43` disabled the schedule
on job `nightly-reconcile` (the drift is *explained*, not broken) · 1 doctor warning = the
**triggers** plugin's **DLQ port degraded** · 2 unbound routes · 7 of 38 procedures thin · 1 pending
migration `20260711_add_delivery_attempts` · DLQ depth 18 (KV 4 · Redis 11 · Postgres 3) ·
5 plugins installed (workers, sagas, triggers, streams, auth).

---

## When you finish this slice — write a completion report

**This is required, and it is how the build pipeline knows you are done.** As your final action,
write the file:

```
_reports/P5-complete.md
```

with exactly this shape:

```markdown
# P5 — complete

**File:** <the .dc.html you produced>
**Routes covered:** <list the routes/screens now implemented, and every screen you retro-fitted an assist slot onto>

## Self-check
- [ ] zero `{{ }}` in the rendered DOM (light AND dark)
- [ ] zero browser console errors
- [ ] zero 404'd subresources
- [ ] every screen designed in both light and `[data-theme='dark']`
- [ ] no raw hex — only `--ns-*` tokens
- [ ] no "coming soon" / preview / beta copy anywhere
- [ ] no owned waterfall, log tail, metrics chart, or resource start/stop
- [ ] every confirm dialog carries a populated CLI-equivalent line
- [ ] every assist shows its grounding AND ends in a deep-link or a confirm+CLI action
- [ ] no persistent chat drawer; no free-floating chat bubbles
- [ ] model rendered as a neutral label (`ops-model-large`), never a real vendor model id
- [ ] every number reconciles with the canonical fixture ledger

## New components I introduced
<name, class contract (`ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`), and what it does — these get synced back into framework source, so the class contract matters>

## Decisions / deviations
<anything you changed from this prompt, and why>

## Open questions
<anything you could not resolve from the brief>
```

Write it **last**, after the design is done and self-checked. Do not write it early.

---

## The four AI forms (design all four)

### 1. Embedded assist slots (everywhere)

A single reusable **`ns-assist`** affordance that appears contextually on every failure/detail
surface. Design the pattern once, then show it on at least: **a failed job execution** · **a
compensating saga instance** · **a halted journey node** · **a schema drift alert** · **a
thin-coverage procedure row**.

- **Assist chips** in context: "Explain this failure", "Draft a fix", "Propose override",
  "Compare with last success" — one click, no prompt writing.
- **Inline assist card** (the response) rendered **IN PLACE** — not a chat drawer:
  - a **verdict sentence** (terse, instrumental, no hedging and no candor-announcing phrasing);
  - an **evidence list**, each item deep-linking to the entity URL it cites;
  - the **captured context** disclosure ("used: this execution's payload · saga history ·
    override v43");
  - the **tool calls it made** (contract procedures as tools, each with a duration) — rendered with
    the `ns-tool-call` class contract;
  - and — when the assist proposes a change — a **proposed-action block** that hands off to the
    standard `ns-confirm` (plan → diff → **exact CLI** → Execute). **AI never mutates directly.**
- Every assist run is durable: a "view full run" link → `/ai/runs/:runId`.

### 2. Ask-about-your-app (global)

The topbar/⌘K "Ask" affordance: a command-palette-style **overlay** (explicitly **not** a persistent
chat panel) where a question — "why is the Stripe payment for `ch_3QK9dR2eZ` stuck?" — returns the
same inline assist-card anatomy, grounded in the live registry / runs / overrides, **naming its
grounding sources**. Recent asks listed below the input. Esc returns to work; the run persists to the
console. The ask is addressable: `/ai?ask=<seed>`.

### 3. AI-authored automations (dynamic triggers)

Inside the trigger builder (P3's `/triggers/:triggerId?tab=config`), a "**Draft with AI**" path:
describe the automation in a sentence ("retry any payment job that fails with `E_TIMEOUT`, max 3,
then page me") → the assist fills the **typed trigger form** (type, filter, action chain) as a
**REVIEWABLE draft** — a diff-style preview of the trigger definition + the CLI line — confirmed like
any other write (`netscript triggers add` / `triggers update`).

**Design the draft-review state explicitly:** AI-filled fields are visually marked *until accepted*.
A human accepts or edits every field before the confirm. This is the state that makes the pattern
trustworthy — do not skip it.

### 4. The AI console `/ai` (?tab=activity|tools) → `/ai/runs/:runId`

- **Activity tab:** KPI strip (agent runs 24 h **31** · tool calls **118** · tool-failure **4 %** ·
  median latency **2.9 s**), durable run list (assists, asks, automation drafts — kind chips), each
  row → run detail.
- **Tools tab:** the **tool registry** — **12** contract procedures exposed as agent tools, grouped
  by plugin, with per-tool call counts / failure rates; provenance chips for plugin-contributed tools
  (ties into P6); and **a policy line per tool: read-only vs mutation-via-confirm.** That policy
  column is the transparency surface — it is what makes "AI can act" safe to read.
- **Run detail `/ai/runs/:runId`:** transcript with tool-call cards, token / latency / model KV
  (model = `ops-model-large`), the correlation id joining it to the spine ("this run investigated
  `ch_3QK9dR2eZ`" → `/flow/ch_3QK9dR2eZ`), links to every entity it touched, and the outcome (the
  assist card it produced / the action it proposed / the trigger it drafted — **and whether the human
  executed it**).

## Grounding & trust chrome (non-negotiable)

Every AI output shows: **grounding sources** (the live calls it made), **model + timestamp**, and a
verdict tone. AI copy **never speculates without naming what it read**. No free-floating chat bubbles
anywhere; every AI artifact is anchored to an entity, a run URL, and — when it proposes change — a
confirm dialog.

## CLI dependency map (epic #701 — SHIPPED in beta.9; use these exact verbs)

| Surface | Shipped CLI verb |
|---|---|
| Tools tab (contract procedures as agent tools, per-plugin grouping) | `netscript plugin ai` (tools / agents / models / providers / MCP) |
| "Add tool / add agent" producing runnable, self-wired resources | `netscript plugin ai add tool <name>` · `plugin ai add agent <name>` |
| MCP-backed tool sources, models/providers panel | `netscript plugin ai` MCP + model/provider verbs |
| AI-drafted automations landing as reviewable trigger drafts | `netscript triggers add` · `triggers update` |
| An assist proposing a runtime override | `netscript config override set <path> <value>` |
| An assist proposing a re-run | `netscript workers trigger <job>` |
| An assist proposing a migration | `netscript db migrate` |

**Do not invent verbs.** An assist that proposes an action prints the *real* command that action
runs — that is the entire trust mechanism.

**States:** assist idle chips / **thinking** (skeleton card, cancellable) / answered / proposed-action
pending / executed / failed (with the error and a retry); console empty state ("Ask your first
question — grounded in your live app"); tool-registry with a **failing tool row**.

**Reach for:** `ns-assist`, `ns-ai-chip`, `ns-tool-call` (the `ToolCallCard` class contract),
`ns-agent-turn`, `ns-kpi`, `data-table`, `ns-kv`, `code-block`, `ns-confirm`, `badge`,
`command-palette` (the ask overlay), `skeleton`.

**Market bar:** every competitor now ships a chat sidebar; none ship *distributed, grounded,
action-producing* assistance where the AI fills the product's own confirm-gated writes and
every run is a durable, correlated, addressable object. That structural difference — **assists as
product furniture, not a bolted-on chat** — is the design's job to make obvious in one screenshot.

**Non-goals:** no persistent chat drawer; no ungrounded "creative" AI; no AI-direct mutations;
no anthropomorphic personality chrome (it's an instrument — the tone stays factual).

**Theme:** NS One tokens only (`--ns-*`); the ✦ AI accent used consistently and ONLY for AI
artifacts — **as an accent, not a gradient wash**; light + dark; reduced-motion fallbacks (a
"thinking" state must not rely on an infinite animation to be legible).
