# GLM 5.2 — agentic design/UX pass (lane re-run)

> Re-run of the earlier one-shot `glm-design-pass.md`, this time with real repo
> access. The one-shot worked from the catalog + axes only; this pass inspected the
> prototype's actual markup (`NetScript Dev Dashboard.dc.html`, 2982 lines) and both
> stylesheets (`proto.css`, `ns-ext.css`), then read the six locked design prompts
> (`design-prompts/01..06`) to avoid duplicating them. Every claim below cites a real
> class name, line, or grep result. No `.png` files were opened (endpoint has no image
> support).

---

## 1. VERDICT — 7/10

The prototype is a genuinely strong **component design system** wearing a broken
**information architecture**. Split the two and the score bifurcates: the DS layer is an
8.5, the IA/routing layer is a 4.

**What the CSS proves is excellent (the 8.5):**
- Token-only, theme-blind discipline is real, not aspirational. `proto.css` header
  states "nothing in this file branches on theme"; dark mode is carried entirely by
  `[data-theme='dark']` token overrides, with missing shades derived via `color-mix(in
  oklab, …)`. Every stateful primitive (`ns-step-timeline`, `ns-journey`, `ns-waterfall`,
  `ns-livedot`, `ns-toaster`) ships a `@media (prefers-reduced-motion: reduce)` fallback.
- Real responsive craft: `ns-waterfall` and `ns-stackmap` both use `@container` queries
  (`container: ns-waterfall / inline-size`, `@container ns-waterfall (max-width: 46rem)`)
  — not just viewport breakpoints. That is senior-level DS work.
- The causal-seam primitive `ns-journey` (`ns-ext.css:243`) is correctly specified as the
  anti-waterfall in-source: its comment reads "NOT a waterfall: no durations, no
  proportional widths — primitive badge + seam payload only." The doctrine is encoded in
  the component contract.
- Confirm-gated mutation has a real primitive: `ns-confirm` (`ns-ext.css:144`) with
  `__change` (from→to), `__cli-label`, and a `::backdrop` blur — the CLI-transparency
  pattern is a designed component, not prose.

**What the markup proves is broken (the 4):**
- **Zero nested routes.** `grep -cE "'/[a-z]+/[a-z]+/:"` on the prototype HTML returns
  **0**. The router is `location.hash` (`HTML:1890`) with 15 sibling `route === '...'`
  branches. Selection is in-memory class state (`aiSel: 'chat_311'`, `HTML:1819`), so a
  selected run/saga/flow has no address — the one-shot's #1 critique is confirmed and
  worse than stated: it is total, not partial.
- **Polyglot runtimes are absent, not "needs verify."** `grep` for `Python|Shell|
  PowerShell|\.NET|🐍|🐚|⚡` in the HTML returns **nothing**; `Deno` appears twice
  (`HTML:770, 2521`). The catalog hedged ("verify"); the markup shows the S7 task split
  and runtime badges simply do not exist. This is a flagship differentiator (per
  `POC-ground-truth.md §3`) missing entirely.
- **The AI surface is a chat pane.** `HTML:1476` renders `Agent runs · durable chat`;
  the center column is `ns-agent-turn` + `ns-tool-call` + `ns-avatar` transcript blocks
  with an `ns-ai-ask` prompt bar. Axis 5 explicitly rejects this shape, and P5 forbids a
  persistent chat drawer — so the single highest-visibility screen contradicts the locked
  revamp direction.
- **Axis-1 violations are confirmed in markup, not just cataloged.** Footer
  `netscript 0.0.1-beta.6` (`HTML:48`); `beta.7` appears 5× (incl. `HTML:362-363` "lands
  in beta.7"); `HTML:1369` carries the seam-prose "correlation join — boundary events
  land in beta.7"; `ns-preview-tag` and `Preview` framing appear at `HTML:2644, 2697,
  2932`.
- **The "confirm-with-CLI on every mutation" signature is sparse in practice.**
  `grep -cE "netscript [a-z]+ (override|plugin|queue|db|triggers|workers|config)"` returns
  only **3** real CLI lines. The pattern is real as a component (`ns-confirm`) but
  under-deployed across screens — it is aspirational coverage, not a realized invariant.

**Net:** the bones (tokens, theming, motion, the `ns-journey`/`ns-confirm`/`ns-achain`
primitives) are publish-grade; the body (routing, AI shape, polyglot, write coverage,
beta honesty) is not. Hence 7/10 — one notch below the one-shot's 7.5, because the gaps
the one-shot treated as hypothetical ("verify polyglot," "selection may be in-memory")
are confirmed real and total in the markup.

---

## 2. TOP-10 redesign proposals (ranked by impact, deduped against prompts 01–06)

Each proposal is something the six prompts do **not** already cover, or a concrete
sharpening of where they are vague. Axis tag + exact screen/component in each.

### 1. Purge `ns-waterfall` from the design system entirely. *(Standing constraint / Axis 2)*
`proto.css:470-636` defines a complete `ns-waterfall` primitive — axis ticks,
proportional `__bar` widths, `__duration` labels, running-pulse. This directly contradicts
the doctrine encoded 30 lines above it in `ns-journey` ("NOT a waterfall") and the P2 hard
constraint. A design agent reaching into the DS **will** be tempted by it. P2 names the
*behavioral* constraint but never names the **component to delete**. **Sharpen:** add an
explicit "forbidden primitives" list to P2 — `ns-waterfall` is retired; the only causal
primitive is `ns-journey`. Remove it from the sync-back candidate set in `proto.css`'s
header comment so it does not get promoted into the published DS.

### 2. Retire `ns-preview-tag` as a component. *(Axis 1)*
`ns-ext.css:344-347` ships `ns-preview-tag` — a dashed warning pill whose **entire purpose**
is beta.6 read-only gating. Axis 1 / P4 say "no preview banners," but the component still
exists in the DS, so a designer will reach for it the moment they want to soften a
half-built surface. **Sharpen:** P4 and P6 should name `ns-preview-tag` on a removal list
(like proposal 1 names `ns-waterfall`). The honest-empty-state pattern (`empty-state` +
the scaffold CLI line, which P3 already specifies) replaces it everywhere — including the
S12 DLQ "Preview — contract routes pending" framing (`HTML:2697`) and S5 "create from
template" gating.

### 3. Genericize the model ids in AI run fixtures. *(Axis 1 + Axis 5)*
The prototype hardcodes vendor model ids in the AI console fixtures: `claude-sonnet-4-5`
(`HTML:1821, 1833, 2094, 2770`) and `claude-haiku-4-5` (`HTML:1828`). This is an Axis-1
violation in spirit: a "FINAL product" screenshot that prints a specific dated model id
will look stale within months and leaks a vendor into the design. **Gap in prompts:** P5
requires "model + timestamp" in grounding chrome but never says *how to label the model*.
**Proposal:** P5 should specify a neutral model-label convention (e.g. `ns-model--fast` /
`ns-model--flagship` tokens, or provider-agnostic labels like "fast model · 1.1k in")
for all AI-run KV and transcript fixtures. Real product, real neutral labeling.

### 4. Make CLI-line presence a hard `ns-confirm` invariant, not a convention. *(Axis 3)*
The catalog claims "confirm-with-CLI-equivalent on every mutation," but the markup
contains only 3 real `netscript …` CLI lines and P3/P4/P5/P6 each say "confirm+CLI"
without enforcing it. **Sharpen:** every prompt that names a write should state the
invariant: a `ns-confirm` without a populated `__cli-label` + CLI code block is a **defect,
not a styling choice**. Model it as a required slot in the `ns-confirm` contract
(`ns-ext.css:160` `__cli-label` exists but is optional). This is what turns "the dashboard
mirrors CLI capability" (Axis 3) from aspiration into a testable design gate — and it
closes the gap between the 3 CLI lines that exist and the ~15 writes the prompts add.

### 5. Flag the `Console`/`Consoles` sidebar label collision as load-bearing. *(Axis 2)*
The prototype's sidebar (`HTML:2225-2232`) has two adjacent groups literally named
`Console` and `Consoles` — a scannability collision where the second group is a
near-duplicate of the first. P1's rename to **Overview / Capabilities / Data / System**
fixes this, but P1 presents the rename as a vocabulary refresh, not as the fix to a real
defect. **Sharpen:** P1 should say explicitly "the current sidebar has two
near-identical group labels (`Console`/`Consoles`); the rename is **not cosmetic** — it
removes an active collision." A designer adopting the prompt otherwise might preserve a
"Console"-style prefix and reintroduce it.

### 6. Forbid the synthetic `Console /` breadcrumb prefix crumb. *(Axis 2)*
The catalog and markup show the breadcrumb as a fixed `Console / <title>` string — a
synthetic root crumb that has no relationship to the route tree. P1 says breadcrumbs
"derive purely from the pathname," but does not explicitly **delete the synthetic
prefix**. A designer could keep `Console` as a friendly root and still claim
"derived from pathname." **Sharpen:** P1 should state the first crumb is either `Home`
(`/`) or the route-group label (Overview/Capabilities/Data/System) — and that there is
**no constant prefix crumb**. Breadcrumbs must reflect the URL segments and nothing else.

### 7. Make container-query column count a `stats-grid` / `ns-kpi` DS invariant. *(Cross-cutting density, P2–P4)*
`proto.css:125-131` contains a screen-local hack: `.ns-rail-grid [class~='xl:grid-cols-4']
{ grid-template-columns: repeat(2, minmax(0,1fr)); }` — forced 2-column override because
`stats-grid` overshoots inside the ~28rem rail column (the comment routes the real fix to
issue #509). This is a **component-level bug papered over at the screen level**. Every
rail in P2 (`/flow/:id` detail rail), P3 (execution-leaf right rails), and P4 (override /
version detail rails) will re-hit it. **Gap in prompts:** P1–P4 all `Reach for:
stats-grid` / `ns-kpi` without flagging this. **Proposal:** before the revamp, the
`stats-grid` and `ns-kpi` components must switch from viewport breakpoints (`xl:grid-cols-4`)
to `@container`-query column counts (the DS already uses this technique in
`ns-waterfall`/`ns-stackmap`, so it is proven). State this as a DS prerequisite in P1.

### 8. AI-run fixture discipline: no placeholder correlation ids. *(Axis 5 + standing constraint)*
The prototype's AI runs are keyed by synthetic `chat_309`/`chat_311` ids
(`HTML:1819-1833`) with `corr` as a side field — and one running run carries
`corr: 'a7c2e910-uuid'` (`HTML:1828`), a placeholder that splinters the spine away from
the canonical `ch_3QK9dR2eZ`. P5 says AI runs "join the spine" and the canonical fixture
is the Stripe `ch_3QK9dR2eZ` story — but P5 does not forbid placeholder correlation ids on
non-canonical runs. **Sharpen:** P5 should state that **every** AI run fixture references
either the canonical `ch_3QK9dR2eZ` or a deliberately-real second domain correlation
(e.g. a `CsvImportSaga` `contentHash`) — never `*-uuid` / `chat_*` placeholders. The spine
is the product's thesis; placeholder ids on the AI screen quietly undermine it.

### 9. Add a sheet-vs-route-page rule for the ~22 new detail levels. *(Axis 2)*
The routing resort adds ~22 entity-detail / sub-entity levels (jobs→executions,
sagas→instance, triggers→event, etc.) plus `ns-sheet-head` / `ns-sheet-body` glue already
exists in the CSS (`ns-ext.css:33-38`). But no prompt states **which detail levels are
full route pages vs. side sheets vs. dialogs**. Without a rule, a designer will mix them
inconsistently (some entity details as pages, some as sheets) and the addressability
promise (P1: "nothing selectable is in-memory-only") gets fuzzy at the seams.
**Proposal:** add to P1 a depth rule — *entity identity is always a full route page*
(shareable, Back-safe); *transient inspection* (payload peek, AI assist card, tool-call
detail) *is a sheet*; *every mutation is the `ns-confirm` dialog*. Sheets never carry
identity, only peeks.

### 10. Define the write-toast contract: deep-link + undo-via-inverse-CLI. *(Axis 3)*
`ns-toaster` exists (`ns-ext.css:367-377`) and P3/P4 say writes end in "a result toast +
the new execution appearing live." But the prompts are vague on the toast's content and
on **undo** — a surprising gap given the NetScript signature is "safer than CLI because it
shows the CLI." **Sharpen:** every write toast carries (a) a deep-link to the
created/affected entity URL (`/runs/:correlationId` for a re-run, `/dlq/:queueId` for a
reprocess), and (b) an **Undo** action where reversible, which opens the *same* `ns-confirm`
pre-filled with the inverse CLI (`netscript config override unset …`). Undo is not a
separate mechanism — it is the confirm pattern applied to the reverse operation. This
makes the CLI-transparency loop bidirectional and is something no competitor console does.

---

## 3. DELTA vs the one-shot pass

Where the one-shot (`glm-design-pass.md`) was wrong, generic, or missed evidence — now
that I have repo access:

1. **Polyglot badges — the one-shot hedged ("Verify"); reality is they are absent.**
   The one-shot's S7 proposal #1 was "Ensure runtime badges (Node, Python, etc.) are
   explicitly rendered per job/task." The HTML proves **none** exist (only `Deno`, twice).
   The gap is not "verify and polish"; it is "build the entire task split + 5 runtime
   badges from scratch." The one-shot understated the work by treating it as a fix.

2. **Routing shape — the one-shot invented divergent route names.** It proposed
   `/journey/:correlationId`, `/sagas/instances/:sagaId`, `/sagas/instances/:id`. The
   locked `routing-resort.md` tree is `/flow/:correlationId`, `/sagas/:sagaName/
   :correlationId`, `/runs/:correlationId`. The one-shot, lacking the locked doc, would
   have sent the design agent to wrong URLs. The agentic pass aligns to the LOCKED tree
   verbatim and flags the breadcrumb/sidebar-collision sharpenings the one-shot never had.

3. **AI direction — the one-shot's headline AI proposal directly contradicts the locked
   direction.** It proposed "Move the prompt bar and agent-run rail into a global,
   collapsible right-dock" (wow-idea #1: "demote the `ai` screen to a global dock"). P5
   explicitly forbids a persistent chat drawer ("no persistent chat drawer") and mandates
   distributed assists + an ask overlay. The one-shot would have produced the exact
   surface P5 rejects. The agentic pass drops the dock idea and sharpens the four-form
   model instead.

4. **"Live Flow Time-Travel" (one-shot wow-idea #2) is doctrine-hostile.** A time-slider
   that scrubs SSE backward to "replay the exact state" leans toward a timeline/waterfall
   mental model — exactly the owned-telemetry pattern the standing constraint forbids
   ("Live Flow stays a causal seam chain, never a waterfall"). The agentic pass recognizes
   the constraint and does not propose it; raw-time replay belongs in Aspire (out-link).

5. **The one-shot never inspected CSS, so it missed four evidence-based findings.** (a)
   `ns-waterfall` is a dead, doctrine-violating primitive still in `proto.css:470-636`;
   (b) `ns-preview-tag` is a beta-gating component that should be retired
   (`ns-ext.css:344-347`); (c) the `stats-grid` container-query hack
   (`proto.css:125-131`, issue #509) will haunt every new rail; (d) `ns-sheet-*` / `ns-toaster`
   glue exists with no usage rule. None of these appear in the one-shot — they are only
   visible by reading the stylesheets.

6. **Score calibration.** The one-shot gave 7.5/10. With the markup confirming that
   routing has 0 nested routes, polyglot is fully absent, and the AI screen is a chat
   pane, the structural gaps are more severe than the one-shot's "held back by three
   flaws" framing allowed. I lower to 7/10 — but I also raise the DS-layer credit above
   what the one-shot gave it (container queries, theme-blind tokens, motion fallbacks are
   genuinely publish-grade), so the net is a redistribution, not just a markdown.

---

## 4. FINAL CONCLUSION (5 sentences)

The locked revamp direction is correct: the six prompts correctly target the three real
structural diseases — flat in-memory routing, read-only bias, and a siloed chat-AI screen —
while preserving the prototype's genuine strengths (the `ns-*` token system, the
correlation spine, the confirm-with-CLI signature). The single biggest remaining design
risk is that **the six prompts share no binding canonical-fixture / derived-stats
contract**, so six independently-generated screens will silently diverge on ids, stat
numbers, model labels, and the correlation spine — undoing the product's central "one id,
numbers that reconcile" thesis (the prototype already splinters this with `a7c2e910-uuid`
and hardcoded `claude-*` model ids). Before the owner pastes the prompts, add a short
**shared preamble** that all six reference: one canonical fixture (the Stripe
`ch_3QK9dR2eZ` → `PaymentWebhookSaga` → `reserve-inventory` → `payment-events` story), one
derived-stats source-of-truth (counts + successRate, per `POC-ground-truth §3-§5`), one
neutral model-label convention, and an explicit retire-list (`ns-waterfall`,
`ns-preview-tag`) plus the `ns-confirm` CLI-invariant. With that preamble and the
sheet-vs-page rule (proposal 9) added, the prompts are ready to paste. Without it, the
design will look right screen-by-screen and be incoherent as a product.
