# P5 — Distributed AI Surface: Embedded Assists + AI Console

**Revamp the AI surface of the NetScript Dev Dashboard using the published "NS One" design
system**, inside the P1 shell and locked routes. The mandate: NOT a generic chat pane — AI
capability distributed across the product as actions, automations, context augmentation, and
embedded assists, all grounded in the live framework registry and joined to the correlation
spine. FINAL product framing throughout.

## The four AI forms (design all four)

### 1. Embedded assist slots (everywhere)

A single reusable **assist affordance** that appears contextually on every failure/detail
surface (design the pattern once, show it on at least: a failed job execution, a compensating
saga instance, a halted journey node, a schema drift alert, a thin-coverage procedure row):
- **Assist chips** in context: "Explain this failure", "Draft a fix", "Propose override",
  "Compare with last success" — one click, no prompt writing.
- **Inline assist card** (the response): a compact `ns-ai-summary`-style card rendered IN
  PLACE (not a chat drawer): verdict sentence, evidence list (each item deep-linking to the
  entity URL it cites), the **captured context** disclosure ("used: this execution's payload ·
  saga history · override v43"), the **tool calls it made** (contract procedures as tools,
  each with duration), and — when the assist proposes a change — a **proposed-action block**
  that hands off to the standard confirm dialog (plan → diff → exact CLI → Execute). AI never
  mutates directly; it fills in the same confirm the human would.
- Every assist run is durable: a "view full run" link → `/ai/runs/:runId`.

### 2. Ask-about-your-app (global)

The topbar/⌘K "Ask" affordance: a command-palette-style overlay (not a persistent chat
panel) where a question ("why is the Stripe payment for ch_3QK9dR2eZ stuck?") returns the
same inline assist card anatomy, grounded in live registry/runs/overrides. Recent asks listed
below the input. Esc returns to work; the run persists to the console.

### 3. AI-authored automations (dynamic triggers)

Inside the trigger builder (P3), an "**Draft with AI**" path: describe the automation in a
sentence ("retry any payment job that fails with E_TIMEOUT, max 3, then page me") → the
assist fills the typed trigger form (type, filter, action chain) as a REVIEWABLE draft —
diff-style preview of the trigger definition + the CLI line — confirmed like any write.
Design the draft-review state (AI-filled fields visually marked until accepted).

### 4. The AI console `/ai` (?tab=activity|tools) → `/ai/runs/:runId`

- **Activity tab:** KPI strip (agent runs 24h, tool calls, tool-failure rate, avg latency),
  durable run list (assists, asks, automation drafts — kind chips), each row → run detail.
- **Tools tab:** the **tool registry** — every contract procedure exposed as an agent tool,
  grouped by plugin, with per-tool call counts/failure rates; provenance chips for
  plugin-contributed tools (ties into P6); a policy line per tool (read-only vs
  mutation-via-confirm).
- **Run detail `/ai/runs/:runId`:** transcript with tool-call cards (`ToolCallCard`), token/
  latency/model KV, the correlation id joining it to the spine ("this run investigated
  `ch_3QK9dR2eZ`" → `/flow/ch_3QK9dR2eZ`), links to every entity it touched, and the
  outcome (assist card it produced / action it proposed / trigger it drafted + whether the
  human executed it).

## Grounding & trust chrome (non-negotiable)

Every AI output shows: grounding sources (live calls made), model + timestamp, and a
confidence/verdict tone. AI copy never speculates without naming what it read. No
free-floating chat bubbles anywhere; every AI artifact is anchored to an entity, a run URL,
and (when it proposes change) a confirm dialog.

**Canonical fixture:** the Home incident summary, the halted-journey assist, and an
automation draft all reference the same Stripe correlation `ch_3QK9dR2eZ` story with
consistent ids.

**States:** assist idle chips / thinking (skeleton card, cancellable) / answered / proposed-
action pending / executed / failed (with the error and a retry); console empty state ("Ask
your first question — grounded in your live app"); tool-registry with a failing tool row.

**Reach for:** `ns-ai-summary`, `ns-ai-chip`, `ToolCallCard`, `ns-agent-turn`, `Message`
primitives (sparingly), `ns-kpi`, `data-table`, `ns-kv`, `code-block`, `ns-confirm`,
`badge`, `command-palette` (ask overlay), `skeleton`.

**Market bar:** every competitor now ships a chat sidebar; none ship *distributed, grounded,
action-producing* assistance where the AI fills the product's own confirm-gated writes and
every run is a durable, correlated, addressable object. That structural difference — assists
as product furniture, not a bolted-on chat — is the design's job to make obvious in one
screenshot.

**Non-goals:** no persistent chat drawer; no ungrounded "creative" AI; no AI-direct mutations;
no anthropomorphic personality chrome (it's an instrument, tone stays factual).

**Theme:** NS One tokens; the existing ✦ AI accent treatment (primary-subtle gradient) used
consistently and ONLY for AI artifacts; light+dark; reduced-motion.

## CLI dependency map (epic #701 — SHIPPED in beta.9; use these exact verbs)

| Surface | Shipped CLI verb |
|---|---|
| Tools tab (contract procedures as agent tools, per-plugin grouping) | `netscript plugin ai` (tools / agents / models / providers / MCP) |
| "Add tool / add agent" producing runnable, self-wired resources | `netscript plugin ai add tool <name>` · `plugin ai add agent <name>` |
| MCP-backed tool sources, models/providers panel | `netscript plugin ai` MCP + model/provider verbs |
| AI-drafted automations landing as reviewable trigger drafts | `netscript triggers add` · `triggers update` |
