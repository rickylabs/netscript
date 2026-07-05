# Opus-CD Deep-Dive — Docs Cut (Topic C tutorials + Topic D positioning) at beta.7

**Agent:** Opus 4.8 deep-dive, Topics C+D combined (shared cut, shared #232 fork, shared IA
blocker, shared eis-chat backing). **Effort:** high. **Lane:** planning only — no framework code,
no docs authoring, no git/gh mutations. **Milestone target:** beta.7 (docs release cut, D3).

This is a concrete design proposal, not a survey. It advances the two Stage-C delegated precursors
(the #232 fork and the docs IA-reconciliation) from working positions to a locked design, resolves
the Topic-C track/mapping question and the Topic-D per-feature spine, and hands off decomposition
(`epic-and-issues.md`), briefs (`agent-briefs.md`), and owner items (`open-questions.md`).

---

## 0. Design headline (locked positions)

1. **#232 fork — recommend Option 2 (NEW docs-cut child epic under #301), not a rescope of #232.**
   #232's live body is 100% accuracy/coverage debt with **zero** overlap with rewrite/positioning
   scope (drift CD1; `analysis/C-tutorials/03-docs-cut-logistics.md`;
   `analysis/D-positioning/current-docs-audit.md`). A beta.7 milestone-scoped *cut* epic and #232's
   *rolling* accuracy debt are different animals; mixing them muddies the milestone. Both options
   drafted below; owner picks.
2. **IA-reconciliation (mandatory precursor): ONE IA — the 9 pillar folders are canonical;
   `capabilities/` is a retired orphan generation, promoted into the pillars with URL redirects.**
   Proven: `capabilities/` never appears in `_data.ts` nav or `index.vto`; it is reachable only via
   in-page `comp.xref` (audit §3). This is a **WSL Codex structural slice** (file moves + `_data.ts`
   + redirects + xref registry + build/`check:links`), not a prose workflow — it blocks all
   authoring fan-out.
3. **C = 5 track rewrites + 1 new minimal-eis-chat on-ramp** (not "4"). The site has 5 live tracks
   (drift C1); `chat` landed later (`2f643f49`) and teaches against `@netscript/ai` `publish:false`.
   Recommended scope = rewrite all 5 domain-diverse tracks (preserves the 8-hub nav diversity) +
   add the minimal on-ramp. Owner lever: **defer `chat`'s full rewrite** (it is `publish:false`-
   gated) to a fast-follow, shipping 4 rewrites + minimal + a light chat accuracy pass at beta.7.
4. **D = per-feature story pages inside the reconciled pillars**, one sharp factual competitor
   comparison per major feature (not per page), enforcing build-efficiency-not-throughput + the
   honesty-framing ban. Realized as **per-pillar Opus authoring supervisors** (9), each producing
   its feature story pages — the practical form of the owner's "one supervisor per feature."
5. **Lane law:** IA-reconciliation = WSL Codex; all prose authoring (C tracks, D pillars) = Opus
   dynamic workflows (Opus medium concept/story, Opus low mechanical, Sonnet 5 trivial), agents
   RETURN prose, Fable commits; **validation = OpenHands per-domain** (qwen 3.7 max, separate
   session). Never Fable in the fan-out.

---

## 1. The #232 fork — both options concrete

**Evidence recap.** `gh issue view 232` (captured in `03-docs-cut-logistics.md`) shows #232 =
docs *accuracy/coverage* umbrella: Run-2 storefront grounding fixes, DataGrid/Dropzone reference
depth, Aspire telemetry doc gaps, streams-scoping docs, workers-verification docs. **None overlaps
a ground-up narrative rewrite or per-feature positioning.** So "land under #232" (topic-C §7,
topic-D header) is not a bare addition — it forces a structural choice.

### Option 1 — Rescope #232 into the docs-cut epic; re-file its accuracy checklist

- **Action:** rewrite #232's title/body to `docs: beta.7 docs release cut — tutorial rewrites +
  per-feature positioning`. Move its current accuracy/coverage checklist verbatim into a **new**
  issue `docs: accuracy & coverage debt` (inherits #232's old scope + `status:` labels), milestone
  `Backlog / Triage` or `0.0.1-stable`.
- **Pro:** the docs cut inherits #232's number (already referenced from #301 program threads);
  single well-known docs anchor.
- **Con:** destroys a live, well-scoped accuracy tracker mid-flight; re-filing risks orphaning the
  **storefront Run-2 grounding debt**, which is load-bearing (the storefront rewrite partly
  supersedes it — see §3.1). Churns cross-references. Milestone semantics get muddy (rolling debt vs
  a dated cut).

### Option 2 — NEW docs-cut child epic under #301; #232 stays the accuracy umbrella *(RECOMMENDED)*

- **Action:** open `epic: beta.7 docs release cut (tutorial rewrites + per-feature positioning)` as
  a **sibling** of #232 under the Road-to-0.0.1-stable program epic (#301). Body references #232 as
  a *related, disjoint* track (`Part of #301`, `Related: #232` — **no** closing keyword on either).
  #232 keeps its accuracy checklist untouched; add one line to its storefront-Run-2 item: "partly
  superseded by the storefront ground-up rewrite in epic #NEW — reconcile at beta.7."
- **Pro:** two clean trackers, each milestone-honest (cut epic = beta.7; #232 accuracy = rolling /
  Backlog); zero re-filing churn; the cut epic carries the C+D sub-issues + the IA precursor as
  first-class children.
- **Con:** one more umbrella number to track; the "land under #232" phrasing in the specs becomes
  "sibling of #232," which the owner must bless (it is the honest reading of the disjoint scope).

**Recommendation: Option 2.** The docs cut is a dated, milestone-scoped deliverable with a hard
precursor (IA-reconciliation) and ~16 authoring children; #232 is rolling accuracy debt. Keeping
them separate is cleaner for the board and the milestone, and avoids the re-filing hazard around the
storefront Run-2 debt. Decision stays with the owner; both are represented in `epic-and-issues.md`.

**Milestone gap (owner-facing):** neither `0.0.1-beta.6` nor `0.0.1-beta.7` exists yet (only
beta.3–beta.5, stable, Backlog/Triage per `03-docs-cut-logistics.md`). **The owner must create
`0.0.1-beta.7`** before any C/D issue can be filed per the AGENTS.md milestone obligation. No
mutation this run.

---

## 2. IA-reconciliation design (the mandatory precursor slice)

### 2.1 The problem, proven

`capabilities/` (16 `.md` incl. index) and the **9 pillar folders** are two unreconciled IAs from
different eras (audit §3, confirmed here against the live tree + `_data.ts`):

- `_data.ts` `navSections` lists the **9 pillars** (Web Layer, Services & SDK, Background
  Processing, Durable Workflows, AI & Agents, Data & Persistence, Identity & Access, Orchestration
  & Runtime, Observability). Each section's **"Overview & Concepts"** points at the pillar
  `index.md` (verified: `{ href: "/web-layer/", label: "Overview & Concepts" }`). **`capabilities/`
  never appears in `_data.ts` or `index.vto`.**
- `capabilities/` pages are reachable only via in-page `comp.xref({ key: "cap:..." })` — an
  orphan zone that calls *itself* "the hub of hubs" with no awareness the pillar layer sits above it.
- Pillars are inconsistent: `background-processing/` and `data-persistence/` route their Overview
  card *into* the capability hub; `web-layer/`, `services-sdk/`, `durable-workflows/` bypass it; only
  `observability/`, `orchestration-runtime/`, `ai/` label it a subordinate hub.
- Pillars split into 3 authoring tiers (thin card-shells: bg-processing, data-persistence,
  durable-workflows, identity-access, services-sdk, web-layer; narrative: observability,
  orchestration-runtime; best-in-class: `ai/index.md`).

The deep, non-obvious content lives in `capabilities/*` (real prose) while the *nav* lives in the
pillars (mostly thin shells). Reconciliation = **fuse the two: promote each capability page's
content into its pillar as that pillar's concept/story leaf, then retire `capabilities/` with
redirects.**

### 2.2 Target IA (one canonical tree)

Each of the 9 pillars becomes a nav section with a consistent shape:

```
<pillar>/
  index.md            ← pillar landing = story-driven overview + elevator pitch (D authors this)
  <feature>.md        ← per-feature story page(s), promoted from capabilities/* (D rewrites)
  <existing>.md       ← existing original pillar content, kept (web-layer/builders.md, ai/engine.md, …)
  (cross-links out to /reference/, /how-to/, /tutorials/ — never duplicate them)
```

**capabilities/ → pillar mapping (structural move, S0):**

| capabilities/ page | → pillar target | notes |
|---|---|---|
| `services.md` | `services-sdk/services.md` | worst reference-dump; oRPC-vs-tRPC comparison absent (audit §2) |
| `sdk.md` | `services-sdk/sdk.md` | |
| `background-jobs.md` | `background-processing/workers.md` | |
| `polyglot-tasks.md` | `background-processing/polyglot-tasks.md` | |
| `durable-sagas.md` | `durable-workflows/sagas.md` | the one page already hitting story+pitch+comparison — the template |
| `triggers.md` | `durable-workflows/triggers.md` | |
| `streams.md` | `durable-workflows/streams.md` | |
| `auth.md` | `identity-access/auth.md` | |
| `database.md` | `data-persistence/database.md` | |
| `kv-queues-cron.md` | `data-persistence/kv-queues-cron.md` | (secondary xref from background-processing) |
| `telemetry.md` | `observability/telemetry.md` | |
| `runtime-config.md` | `orchestration-runtime/runtime-config.md` | driest page on the site |
| `fresh-framework.md` | fold into `web-layer/index.md` | web-layer already bypasses the hub |
| `fresh-ui.md` | `web-layer/fresh-ui.md` | |
| `ai.md` | fold into `ai/index.md` | `ai/index.md` is already best-in-class; merge, don't duplicate |
| `capabilities/index.md` | delete after redirects | "hub of hubs" role dissolves into the 9 pillars |

**Net-new hub pages** (audit §1 asymmetry + D open-question 2): CLI/scaffold and MCP have no hub
today but are prime positioning material. Decision:

- **CLI/scaffold story page** → `orchestration-runtime/cli-scaffold.md` (strong story: Encore
  file-count before/after, AdonisJS "ship don't assemble" — teardown §2).
- **MCP grounding story page** → `ai/mcp.md` (Encore/Supabase's sharpest AI-agent story; eis-chat's
  real `legacy-archeo-mcp` boundary — elevator material item 8).
- **Deployment** → **out of Topic-D scope** (owned by the deployment epic, MEMORY
  `netscript-deployment-epic`); add only a one-paragraph positioning stub + cross-link from
  `orchestration-runtime/index.md`. Do not build a deployment hub here.

### 2.3 Migration / redirect plan (no broken links)

The nav blast-radius has **two independent surfaces** — do not conflate them:

1. **`capabilities/*` URLs (this slice's concern).** For every moved page, add a Lume redirect from
   the old `/capabilities/<x>/` URL to the new pillar path (Lume `url`-based redirect page or the
   redirect-frontmatter pattern already used in the site). Retarget every `comp.xref({ key:
   "cap:<x>" })` key in the xref registry to the new pillar path so in-page cross-links follow.
   Update the 3-of-9 pillars whose "Overview & Concepts" card points into `capabilities/` to point
   at the new in-pillar leaf. Gate: `deno task verify` (build → `check:links` → `check:caveats`)
   must stay green — this is the acceptance test that no link broke.
2. **Tutorial-chapter nav anchors (Topic-C's concern, §3.4 below).** The 8 capability-hub
   "Quickstart" anchors point at *tutorial chapters* (e.g. `storefront/02-catalog-service`), NOT at
   `capabilities/*`. IA-reconciliation must **not** touch these; they move only if the tutorial
   rewrite renames a chapter slug. Kept as a hard separation so the two slices don't collide.

**Why redirects, not just moves:** external inbound links and the generated `reference/` may point
at `/capabilities/*`. Redirects make the retirement non-breaking; `check:links` only covers internal
links, so redirects are the safety net for anything outside the tree.

### 2.4 Lane for the reconciliation slice

**WSL Codex, daemon-attached.** Rationale: this is structural TS/nav plumbing (`_data.ts` edits,
`url`-redirect frontmatter, xref-key registry, file moves) requiring real build + `check:links`
iteration — not prose authoring. It is docs-tree work (no `packages/`/`plugins/` source), but it is
mechanical/structural, so Codex is the correct mobile-visible lane; the Opus doc-authoring exception
is for *prose*. This keeps the exception clean and the precursor verifiable. (Alternative: Opus-low
workflow — recorded in open-questions as a lane choice, but Codex is recommended for the
build-loop.)

---

## 3. Topic C — tutorial rewrite design

### 3.0 Preserve the mechanic, replace the premise (the load-bearing finding)

Every current chapter already follows a rigorous, correct shape (learningPath nav, "What you will
build", "Before you begin" runnable verification, numbered `Step N — <verb>` with real code,
callouts, apiTable, "Verify your progress" checklist ending in a runnable command, "What you built",
nextPrev) — `01-current-tutorial-inventory-and-gaps.md`. **The owner's "doesn't tell a story"
complaint is about the synthetic, stakes-free premises (my-shop/my-workspace/my-erp/my-dashboard/
chat-app), not the pedagogy.** The rewrite therefore **keeps the mechanic and the component set**
(`04-lume-vento-authoring-observations.md`) and **replaces the premise with real, stakes-bearing
narratives** grounded in eis-chat's real domain and real seams. This is a content+IA change, not a
component-authoring exercise.

The Medusa/Rails/SvelteKit/Astro convergent rule holds throughout: **every step closes on a literal
observable checkpoint** (a URL, JSON body, log line, file diff, screenshot) — never a comprehension
checkpoint (`research/C-tutorials/medusa-inspired-writing-style-contract.md`,
`other-tutorial-ecosystems.md`). The style contract in that file is the per-chapter authoring bar.

### 3.1 The 5 tracks + minimal — scope resolution (Q1 + candidate-mappings A/B/C)

**Resolved: keep 5 domain-diverse tracks (Option B discipline-literal reuse), rewrite each with the
eis-chat build-discipline, add the minimal-eis-chat as a distinct 6th on-ramp.** I push back on the
corpus's leading Option C (replace erp-sync with an eis-chat-literal track): erp-sync is the weakest
track *but* it is the sole teacher of **polyglot tasks** (a distinctive NetScript capability and the
Background Processing hub's Quickstart anchor). Deleting it forfeits that surface. Better to **fix**
erp-sync than replace it (§3.3). Option B preserves the topical diversity that 8 capability hubs
depend on for their Quickstart anchors (`03-docs-cut-logistics.md`) and keeps nav blast-radius low.

**"Follow the eis-chat approach" = discipline-literal, not domain-literal** (drift D5): seam
ordering (contract → persistence → background → live delivery, the arc eis-chat itself proves and
the doctrine's own dependency order — `02-eis-chat-build-arc.md`), exercise-first pacing, literal
checkpoints, real screenshots as "what you built" evidence. Not "every track becomes a chat app."

**Owner lever surfaced:** if the owner wants scope literally bounded to "4 + minimal," the
lightest-touch deferral is `chat` (it is `publish:false`-gated anyway — §3.4): ship 4 rewrites +
minimal + a light chat *accuracy* pass at beta.7, and do chat's full rewrite as a fast-follow when
`@netscript/ai` publishes. This maps the owner's "4 + minimal" onto the 5-track reality cleanly.

### 3.2 Per-track real-project backing + exercise-first spine

Universal spine (from `02-eis-chat-build-arc.md`, matches doctrine A2/A3 contract-first order):
**Foundation (scaffold → first contract → typed SDK client) → Persistence → Background work →
Live/durable delivery → Deploy/Operate.** Each track wraps this in a real narrative:

- **Track 1 — storefront** *(keep commerce; real stakes via the playground-dogfood framing).*
  Premise: "build the example app the framework itself runs in anger" — `storefront/index.md`
  already says it is "the same spine the NetScript playground runs" (audit §4). Lean into that: the
  reader builds the framework's own reference shop. `04-checkout-saga.md`'s money-loss failure-mode
  narrative is already the strongest on the site — keep it as the anchor chapter. Chapters:
  `01-scaffold`, `02-catalog-service`, `03-cart-contracts`, `04-checkout-saga`, `05-shipping-webhook`,
  `06-deploy`. **Slug stability: keep all 6 slugs** (they are nav anchors — §3.4). Resolves the
  storefront Run-2 accuracy debt (#232) by rebuilding against a verified live scaffold as part of
  the rewrite.
- **Track 2 — workspace** *(team workspace + auth; ground in eis-chat's Project>Channel>Session +
  org-catalog dual-DB, EXCEPT auth).* eis-chat has **zero auth usage** (elevator material "confirmed
  gaps"; D open-q 4) — so the auth chapters (`02-auth`, `05-route-authz`) are backed by the
  **framework's own `builder-auth_test.ts` three-outcome (401/403/200) pattern** + package reference,
  not eis-chat. This is already the strongest technique in the current track
  (`01-current-tutorial-inventory-and-gaps.md`). Keep the honest `arch-debt:seamless-auth-roadmap`
  callout (no org/tenant/RBAC primitive) as a plain factual "here's how you extend it" note — Q2
  confirmed it is compliant with the honesty-framing ban. Chapters keep slugs
  `01-scaffold…06-deploy`.
- **Track 3 — erp-sync** *(polyglot import; ground in eis-chat's real VIF→CSB import pipeline —
  file-drop → import job → transform → queue/cron).* **Fix, don't delete:** rebuild
  `03-polyglot-transform` as a **runnable** exercise using the sandboxed **`deno` task runtime**
  (the one runtime that is sandboxed; `arch-debt:workers-non-deno-task-sandbox-boundary`), with the
  Python `runtime('python')` step as a clearly-caveated forward capability — converting the current
  "read-not-run" chapter (Q5, confirmed) into exercise-first. Fix the documented
  `WORKERS_CONCURRENCY` vs `WORKER_CONCURRENCY` footgun inline or flag it as a framework side-fix
  (WSL Codex, separate slice — docs-only cut cannot carry framework source). Keep slugs.
- **Track 4 — live-dashboard** *(orders/live dashboard; ground in eis-chat's real
  `notifications-stream` + the dashboard's real channel live-query).* Already the deepest, most
  complete track (`04-definePage-QueryIsland` is "the heaviest chapter"; `05-live-stream` delivers a
  no-polling self-updating table). Rewrite is mostly narrative re-grounding, not structural. Keep
  slugs.
- **Track 5 — chat** *(durable AI chat; ground in eis-chat's real `chat.turn` trace tree, tool
  calls, citations, MCP grounding).* **GATED — see §3.4.** Architecturally the closest analogue to
  an eis-chat build already (`02-eis-chat-build-arc.md`). Keep slugs `01-scaffold`,
  `02-durable-chat-route`, `03-chat-ui`, `04-tool-call`.
- **Track 6 (NEW) — minimal-eis-chat on-ramp.** Shape 2 (architecture-tour funnel,
  `candidate-tutorial-mappings.md`): single-sitting `scaffold → one contract → one worker → one
  stream → done`, narrated as "the smallest slice of what eis-chat actually is," closing with an
  explicit map back to eis-chat's full architecture and a funnel into the 5 deep tracks. **Tells the
  post-scaffold story only** (start from `netscript init`, never lift the pre-NetScript/Turso-native
  `PHASE-*.md` build order — `02-eis-chat-build-arc.md`'s critical reconciliation finding). No auth,
  no desktop, no dual-DB. New folder `tutorials/eis-chat/` (or `tutorials/minimal/`) + a 6th lane on
  `tutorials/index.md`'s `featureGrid`.

**Dual-DB pattern (Q7):** reserve eis-chat's org-catalog-Prisma + per-channel-tursodb dual-DB story
for the **workspace track** (natural fit) and as optional depth in the minimal on-ramp's closing
map — not forced into every track.

### 3.3 Exercise-first chapter list per track (design targets)

Structure is fixed by the proven mechanic (§3.0); the rewrite changes premise + prose. Keep chapter
**counts and slugs** stable to protect nav (§3.4). Chapter-granularity (Q6, SvelteKit atomic vs
Rails continuous): **keep the current ~5–6 broad chapters** (Rails "one continuous real build"
coherence beats SvelteKit atomicity here — the tracks are one continuous app, and finer slugs
multiply nav blast-radius). Per track the chapters map onto the universal spine; the acceptance bar
is exercise-first + literal checkpoint per step + a real screenshot/`curl`/log at each "What you
built."

### 3.4 Nav blast-radius handling (the load-bearing logistics fact)

`_data.ts` wires **6 tutorial chapter URLs** (not track indexes) into 8 capability-hub "Quickstart"
anchors (`03-docs-cut-logistics.md`, confirmed against live `_data.ts`): `storefront/02-catalog-
service`, `storefront/03-cart-contracts`, `storefront/04-checkout-saga`, `erp-sync/03-polyglot-
transform`, `workspace/02-auth`, + track-index anchors `live-dashboard`, `chat`. **Design rule:
preserve every existing chapter slug in the rewrite** (rewrite content in place; do not rename). Any
unavoidable slug change requires a paired `_data.ts` edit in the *unrelated* hub section — this must
be an explicit checklist item in every C authoring brief and in the OpenHands validation, per the
finding that a tutorials-folder-only diff silently breaks nav. The minimal-eis-chat track adds new
slugs only (no rename risk).

### 3.5 The `@netscript/ai publish:false` gate (chat track + AI positioning)

**Fact:** `chat/02-durable-chat-route` states the `@netscript/ai` *engine* "arrives in
0.0.1-beta.2" and is `publish:false` today; the track's *runnable* path uses the **shipped**
`@netscript/fresh/ai` surface (`toNetScriptChatResponse`, `resolveChatSnapshot`,
`createNetScriptChatStreamProxy`) + direct `@tanstack/ai` + `netscript ui:add ai`
(`01-current-tutorial-inventory-and-gaps.md`; elevator material item 10). So the load-bearing seam
is `@netscript/fresh/ai` (shipped), and `@netscript/ai` is a *forward-reference*.

**Gate handling (locked):**
- Author the chat track + the AI-stack positioning page **against the shipped `@netscript/fresh/ai`
  path only.** Every `@netscript/ai` *engine* mention is a clearly-caveated forward reference
  (`<!-- caveat: arch-debt:... -->` + "arrives in beta.X"), **never a runnable `import
  @netscript/ai` step.** This keeps the chat track shippable at beta.7 without waiting on the engine.
- **Verification obligation:** before authoring, confirm `@netscript/ai` publish state via `deno
  doc`/registry (it may have publish:true by the beta.7 window — the tutorial's "beta.2" claim has
  slipped, since it is still `publish:false` in the post-beta.5 era). If it has shipped, the engine
  content can become runnable; if not, it stays a caveated forward-ref. The authoring brief carries
  this as a pre-flight check.
- **Owner lever (restated):** if the owner prefers strict "4 + minimal" scope, defer chat's full
  rewrite until the engine publishes; ship a light accuracy pass at beta.7.

### 3.6 Docs-cut mechanics

- **Gate:** `docs/site` `deno task verify` (build → `check:links` → `check:caveats`) is the minimum
  per-page bar (`03-docs-cut-logistics.md`). `diagrams:render`/`check` only if a chapter adds a
  diagram (Windows-broken → render in WSL; not CI-enforced — verify manually).
- **Lume/Vento landmines** (`04-lume-vento-authoring-observations.md`): the `function`-keyword in a
  comp-tag arg aborts the build; 4 comp-syntax defects pass a tag-balance scan but break the build;
  **do not run repo-wide `deno task fmt`** (reflows `.md/.vto`); pre-flight every page with a real
  build, not a visual read. Bake into every brief + validation.
- **Release semantics:** "beta.7 docs cut" = docs complete and merged by the time beta.7 is cut, as
  a **docs-only PR/wave** (MEMORY `main-missing-jsr-readiness-umbrella`,
  `docs-authoring-lane-claude-workflows`) — **not** a `release:cut` (package-version) invocation.
  Docs land docs-only; any framework change a tutorial exposes (e.g. the `WORKER_CONCURRENCY`
  footgun, `createJobTools` no-op stubs) is a **separate WSL Codex slice**, never in the docs cut.

---

## 4. Topic D — per-feature storytelling / positioning

### 4.1 The defining gap and the constraint

Across ~40 capability/explanation/pillar/tutorial pages there are exactly **2** named-competitor
mentions site-wide (Temporal in `capabilities/durable-sagas.md`; .NET Aspire in `explanation/
aspire.md`, a disambiguation) and only ~4 of ~15 hubs open with an elevator pitch (audit §2, §6).
The owner brief is explicit: "storytelling — each feature told as a story, not a reference dump; an
elevator pitch per feature; prioritize, showcase, and compare with other frameworks."

**Tension resolved (owner-surfaced):** the task frames competitor mentions as "sparse by design — 2
today," but the owner brief asks to "compare with other frameworks." Resolution — **"sparse" governs
*taste*, not *whether*: one sharp, factual comparison per *major* feature page (Tier 1/2), never a
comparison on trivial pages and never a wall of vs-tables.** This raises named comparisons from 2 to
~13, all factual/falsifiable, honoring the locked positioning (build-efficiency not throughput; no
absolutes; no invented numbers; no honesty framing). This is within the delegated per-feature-story
scope, but it brushes the locked-positioning boundary, so it is surfaced to the owner in
`open-questions.md`.

### 4.2 Per-feature story template (every rewritten feature page)

Model: `tutorials/storefront/04-checkout-saga.md` (narrative) + `capabilities/durable-sagas.md` (the
one hub already hitting all three axes) + `why.vto`'s comparison table (positioning). Sections:

1. **Elevator pitch** — one punchy line, led by **eis-chat evidence** (D open-q 3 resolution: lead
   with the concrete/falsifiable eis-chat material from `elevator-pitch-raw-material.md`; the master
   `_plan/01-positioning-brief.md` is tone/structure guide only). Build-efficiency framing.
2. **Story spine** — a concrete failure mode or real workflow the feature solves (not a feature-
   bullet list). Ground in eis-chat's two richest spines: **PROSCO/Prolabel incident diagnosis**
   (the composability story — vision worker → single-writer DB → MCP boundary → OTel-traced chat →
   manual-promotion memory) and **VIF→CSB migration** (grounding/MCP story) — `elevator-pitch-raw-
   material.md`.
3. **Mechanism** — how it works, cross-linked (not duplicated) into `reference/` + `how-to/`.
4. **One factual competitor comparison** (Tier 1/2 only) — from the teardown §2 mapping, using the
   Trigger.dev/Convex **factual-table shape** (category rows, no adjectives in cells) or a single
   sharp sentence. Never a superlative, never an invented metric.
5. **Cross-links** to the backing tutorial + reference (Diátaxis stays the organizing principle —
   `authoring-constraints.md`).

### 4.3 Feature list, pillar home, competitor angle, priority

From audit §1 + teardown §2 (only the *sharpest* comparison per feature; blanks = no comparison, by
taste):

| # | Feature | Pillar page | Sharpest comparison (teardown §2) | Priority |
|---|---|---|---|---|
| 1 | Services / oRPC contracts | `services-sdk/services.md` | Encore `nestjs-alternatives` (AI-agent consistency) | **T1** |
| 2 | SDK / typed client | `services-sdk/sdk.md` | tRPC "declare once, typed everywhere" (reframed on turns) | **T1** |
| 3 | Sagas / durable workflows | `durable-workflows/sagas.md` | Inngest-vs-Temporal determinism-trap | **T1** |
| 4 | Telemetry / observability | `observability/telemetry.md` | Encore MCP + traces (agent self-verify) | **T1** |
| 5 | Plugin system | `orchestration-runtime/` (+ `explanation/plugin-system.md`) | Medusa Agent Skills (plugin = agent capability) | **T1** |
| 6 | CLI / scaffold *(new page)* | `orchestration-runtime/cli-scaffold.md` | Encore file-count + AdonisJS ship-don't-assemble | **T1** |
| 7 | AI stack *(gated)* | `ai/index.md` | Medusa Build/Optimize/Operate + Convex "LLMs love Convex" | **T1** |
| 8 | Streams / durable live-query | `durable-workflows/streams.md` | Convex "always in sync" | **T2** |
| 9 | Triggers / ingress | `durable-workflows/triggers.md` | Inngest homepage | **T2** |
| 10 | Background workers | `background-processing/workers.md` | Trigger.dev-vs-Temporal factual table | **T2** |
| 11 | Auth *(no eis-chat proof)* | `identity-access/auth.md` | Supabase Agent-Skills failure-modes (no invented %) | **T2** |
| 12 | Database (Prisma-next/Turso/PG/MSSQL) | `data-persistence/database.md` | Convex-vs-Supabase Yes/No matrix + TanStack toggle | **T2** |
| 13 | MCP grounding *(new page)* | `ai/mcp.md` | Encore MCP-server blog (causal fewer-turns chain) | **T2** |
| 14 | Polyglot tasks | `background-processing/polyglot-tasks.md` | (light / none) | T3 |
| 15 | KV / queues / cron | `data-persistence/kv-queues-cron.md` | BullMQ/Celery (light) | T3 |
| 16 | Aspire orchestration | `orchestration-runtime/index.md` | Encore local dashboard (generated, not hand-wired) | T3 |
| 17 | Fresh framework (web layer) | `web-layer/index.md` | (light) | T3 |
| 18 | Fresh UI (design system) | `web-layer/fresh-ui.md` | Astro tone + live sandbox | T3 |
| 19 | Runtime config | `orchestration-runtime/runtime-config.md` | (light / none) | T3 |
| 20 | Deployment | positioning stub only | Trigger.dev self-hosting table (defer to deployment epic) | out |

**Prioritization rationale (owner-delegated):** Tier 1 = the seven pages carrying the sharpest
AI-agent-build-efficiency story (contracts, sdk, sagas, telemetry, plugins, cli/scaffold, ai) — the
positioning spine of the whole cut. Tier 2 = the rest of the shipped-and-dogfooded surface. Tier 3 =
thin/secondary features (still get a pitch + story, comparison optional). Deployment is out (owned
elsewhere).

### 4.4 Auth without an eis-chat proof point (D open-q 4)

eis-chat has **zero** auth usage (elevator "confirmed gaps"). **Resolution:** author `identity-
access/auth.md` from the package's own reference docs/tests + the Supabase agent-skills *technique*
(name concrete agent failure modes a convention prevents — no invented percentage). Internally note
(not on the page) the missing dogfooding proof; do **not** block the rest of the fan-out on it; do
**not** imply eis-chat proves the auth story.

### 4.5 Landmine bugs folded into owning slices (D open-q 6)

- `explanation/plugin-system.md` under-claims "no auth telemetry/audit surface yet," contradicting
  `explanation/auth-model.md` + `explanation/observability.md` (which say the redacted audit surface
  via `createAuthTelemetry` **is** real). Fix inside the **plugin-system / identity-access** authoring
  slice.
- `concepts.vto` says "Still alpha… targeting late 2026" vs the site's "beta." Fix inside the
  **front-door** touch (whichever D slice touches `concepts.vto`), or as a Sonnet-trivial side-fix.

### 4.6 Locked-positioning enforcement (every D slice)

From `authoring-constraints.md` + `competitor-teardown.md` §3 landmines, baked into every brief:
- **No throughput/benchmark** (Hono router-ops landmine), direct or indirect ("X% faster").
- **No absolutes/superlatives** (Temporal "as reliable as gravity"; Trigger.dev "unbreakable";
  NestJS "world's fastest-growing").
- **No unshipped-capability claims** — every present-tense capability traceable to shipped code via
  `deno doc` (not `_plan/` prose, not research prose).
- **No honesty/candor framing** — the banned language lives **only** in unshipped `_plan/` files
  (`market-fit.md`, `08-decisions-locked.md` Q4/Q5, `07-questions-for-user.md`); it did **not** leak
  into any live page (audit §5). **Explicit brief instruction: do NOT lift `_plan/` copy verbatim**
  — it is the exact tree an authoring agent is tempted to mine, and it carries both the honesty
  framing and a "high-throughput" phrase.
- **No fabricated social proof / measured %** — no Supabase-style 58%→71% without NetScript's own
  data (`netscript-bench` #302 is post-stable, not available). Qualitative/mechanism-level build-
  efficiency claims only (D open-q 5 resolution).
- **Aspire framing:** `@netscript/aspire` is a TS AppHost inspection/diagnostics package
  (`inspectAspire`), NOT the .NET Aspire runtime — never conflate (existing `explanation/aspire.md`
  is the correct model).

---

## 5. Authoring + validation lane (both topics)

Per the documentation-authoring exception (CLAUDE.md, recorded 2026-06-18):

- **Authoring = Claude dynamic workflows.** Model/effort routing: **Opus medium** for concept/story/
  reference pages (all C track chapters, all D Tier-1/2 feature stories, pillar `index.md` landings);
  **Opus low** for mechanical standardization (T3 thin pages, cross-link stitching); **Sonnet 5** for
  trivial link-fix/cleanup (the `concepts.vto` alpha-drift fix, redirect-stub copy). **Never Fable in
  the fan-out.**
- **Agents RETURN prose; Fable (supervisor) commits** to the worktree (MEMORY `docs-authoring-lane-
  claude-workflows`, `workflow-subagent-worktree-pin` — workflow agents can't redirect Write to
  another worktree; return bodies, supervisor writes them).
- **Validation = OpenHands, qwen 3.7 max, separate session, per-page/per-domain verdict.** The
  workflow is generator-only; it does not self-certify (harness rule; doc-authoring exception).
  Validation checks: (a) `deno task verify` green (build + `check:links` + `check:caveats`); (b)
  every API/symbol claim traces to `deno doc` (accuracy-worklog line per `authoring-constraints.md`);
  (c) locked-positioning compliance (grep for honesty/throughput/superlative/`_plan`-lifted phrasing);
  (d) nav blast-radius: no `_data.ts` anchor broken (C); no orphaned page outside nav (D).
- **IA-reconciliation (S0) = WSL Codex** (structural, §2.4) — the exception is for prose, not
  nav/redirect plumbing.

---

## 6. Milestones

Everything targets **beta.7** (D3). **Missing GitHub milestone `0.0.1-beta.7`** (and `0.0.1-beta.6`
for the spine-1 epics) — **owner creates at ratification**; no C/D issue can be correctly filed
until `0.0.1-beta.7` exists (AGENTS.md milestone obligation; `03-docs-cut-logistics.md`). No
mutation this run.

---

## 7. Push-back on Stage-C working positions (with evidence)

1. **Endorse** Stage-C: docs cut gated by two precursors (#232 fork + IA-reconciliation), both
   mandatory before authoring fan-out. Confirmed against live `_data.ts` + tree.
2. **Refine** Stage-C's "#232 rescope vs new child epic": I recommend **Option 2 (new epic)** with a
   concrete reason Stage-C did not state — the storefront Run-2 accuracy debt in #232 is *partly
   superseded by* (not disjoint from) the storefront rewrite, so a rescope's re-filing step risks
   orphaning load-bearing debt. New-epic avoids that.
3. **Push back** on the corpus's leading tutorial Option C (replace erp-sync with eis-chat-literal):
   erp-sync is the sole polyglot-tasks teacher and a hub Quickstart anchor — **fix it (make the
   polyglot chapter runnable via the sandboxed deno task runtime), don't delete it.** Adopt Option B
   (5 diverse tracks, discipline-literal eis-chat reuse) + the minimal on-ramp.
4. **Sharpen** the `@netscript/ai` gate: the chat track's *runnable* seam is the **shipped**
   `@netscript/fresh/ai`, not the `publish:false` `@netscript/ai` engine — so the chat rewrite is
   **not hard-blocked** at beta.7; only the engine content is a caveated forward-ref. Stage-C treated
   the gate as a blanket scheduling constraint; it is narrower than that.
5. **Resolve** the competitor-mention tension Stage-C left implicit: "sparse by design (2 today)"
   governs taste, not whether — one factual comparison per Tier-1/2 feature (~13), honoring the
   owner's explicit "compare with other frameworks." Surfaced to owner as it brushes the positioning
   boundary.
6. **Add** the auth-gap handling Stage-C did not detail: eis-chat's zero-auth means the workspace
   track's auth chapters and the `auth.md` story are backed by the framework's own `builder-auth_test`
   pattern + package docs, never a fabricated eis-chat auth proof.
