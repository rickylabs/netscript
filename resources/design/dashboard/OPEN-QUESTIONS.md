# Dashboard Revamp Brief — Open Questions

> Raised by the Stream-A brief author (2026-07-13). **Nothing here is guessed in the brief.** Items
> marked **BLOCKING** must be answered before the first canvas turn is spent. Owner column = who can
> answer.

---

## BLOCKING

### OQ-1 — Which IA is the canvas building? (owner: orchestrator)

My task brief named the `plan-roadmap-expansion--seed` proposal as "the ratified IA" and the
design-prototype plan's **LD-1** as the breadth lock ("shell + **7 panels** + 4 capability sections").
Three of those seven panels were **killed by a later owner ratification**:

| LD-1 panel | Fate | Evidence |
| ---------- | ---- | -------- |
| Flow / **Trace Waterfall** | scope killed; #418 rewritten to "S13 Live Flow — causal seam chain" | `dashboard-rescope--seed/ratification-summary.md` (owner: "yes to all, proceed", 32 mutations landed); epic #400 acceptance line 3 |
| **Logs** panel | #421 **closed, not planned** — logs deep-link to Aspire | same |
| **Resource Control** panel | #422 **closed, not planned** — delivered as `withCommand` *inside* Aspire | same |

The live epic #400 body says its screen set "**supersedes the pass-1 DDX panel list**", and the
2026-07-12 improvement-brief ("binding for all passes") restates the satellite doctrine as a standing
constraint. **I authored against the newer authority** (S1–S13 + `/ai` + `/extensions`, satellite
doctrine, locked route tree) and recorded the divergence as **drift D-4**.

**Confirm this is correct.** If the orchestrator instead wants LD-1's literal 7-panel set, say so — but
note that three of those panels are auto-reject surfaces under the epic's own acceptance lines, so the
prototype would ship defects by construction.

### OQ-2 — Canvas budget and pass staging (owner: orchestrator)

Full breadth under the locked route tree is **~16 screen roots + ~22 entity/sub-entity levels, each in
light and dark** ≈ 76 renders. LD-1's two-pass staging predates the routing resort and does not fit.

The brief (§8) proposes **five passes** (P0 frame → P1 investigation spine → P2 capability consoles →
P3 control plane + data → P4 AI + extensions), which maps 1:1 onto the existing
`design-prompts/01–06`. **Decide:**

- (a) all five passes are in scope for beta.10, or
- (b) beta.10 ships **P0 + P1** (frame + the two flagships) and P2–P4 are follow-on, or
- (c) some other cut.

Also: is every *entity-detail* level in scope, or do detail levels get **representative coverage** (one
job execution, one saga instance, one trigger event, one DLQ message) with the rest specified but not
drawn? Representative coverage is my recommendation — the routing hierarchy is proven by one worked
leaf per shape, not by 22 of them.

### OQ-3 — The screen file convention in the NS One project (owner: orchestrator / canvas agent)

I could not verify this: the brief prohibits me from making Claude Design MCP calls, and the convention
is not documented in the repo. The synced **component cards** are `.html` files that link
`../../../styles.css` + `../../../_ns_styles.css` and load `../../../_ns_runtime.js`
(`tools/design-sync/templates/card.html`) — but the project's existing `screens/` files (8 of them) may
use a different shape (`.dc.html` + `support.js` is the platform's own Design-Components idiom).

**Brief's instruction to the canvas agent:** read an existing `screens/*` file **first** and copy its
convention exactly. That is safe. But if the orchestrator already knows the answer, pin it in the brief
and save a turn.

---

## NON-BLOCKING (but answer before the pass that touches them)

### OQ-4 — Fate of the 7 existing screens in NS One (owner: orchestrator)

The project holds `screens/01`–`04` + `S01`/`S03`/`S13`. `01-stack-map`, `02-flow-trace`, and
`04-run-inspector` encode the **retired framing** (a "Stack Map" panel; a trace waterfall). The OD-1
backup (`30404d40-…`) means nothing is lost. Overwrite in place, or delete and re-author under the new
route-derived names (`home`, `config`, `runtime`, `flow`, `runs`, …)? I recommend **re-author under
route names** — a screen file called `02-flow-trace` invites the retired shape back.

**Second reason to re-author, not patch.** Their in-repo counterparts
(`resources/design/dashboard/screens/*.html`) hard-code an **internal reference-app name** as fixture
data (a service node, a stream subscriber, a log line). That violates the public-repo naming rule and
the prompt-set's own leak guard. Whatever is decided about the canvas files, the in-repo screens are
either **deleted** (they are superseded pass-1 artifacts of a retired framing) or **scrubbed**. My
recommendation: delete — they are the waterfall prototype.

### OQ-5 — `mcp-ui-widget` in the re-synced inventory (owner: orchestrator)

The D-1 converter fix makes the registry's new `mcp-ui-widget` island bundle, so it will appear as a
**45th component / 4th island** in NS One after the re-sync. The ratified proposal (§5.1) puts MCP
components **out** of scope for the dashboard. The brief states it is present-but-not-for-dashboard-use.
Confirm — or confirm it should be **excluded from the sync config** instead (a one-line `exclude` entry
in `resources/design/dashboard/.design-sync/config.json`), which is cleaner.

### OQ-6 — Is there a persistent AI dock in the shell? (owner: owner)

Axis 5 says AI is distributed, not a chat pane. Two readings of that are live in the corpus and they
disagree on **chrome**:

- the GLM design pass proposes **demoting `/ai` to a global collapsible right-dock** available on every
  screen;
- the locked routing hierarchy keeps `/ai` + `/ai/runs/:runId` as routes and says the distributed
  affordances are **in-panel actions on other routes** (no dock in the tree).

The brief builds the **in-panel** reading (assist slots + the `/ai` console) and explicitly does **not**
build a dock. A dock is a shell decision that changes every screen's right edge — it cannot be
retro-fitted cheaply. **Decide before P0.**

### OQ-7 — Fixture ledger sign-off (owner: orchestrator)

`SCREEN-SPEC.md` §3 locks one incident and one set of derived stats so that no two screens contradict.
The **spine** (`ch_3QK9dR2eZ` / `evt_2210` / `job_4183` / `msg_88f` / `PaymentWebhookSaga` /
`payment-events`) is carried verbatim from the ratified prompt set. The **surrounding counts** (1,242
executions, 87 saga instances, 3,412 trigger events, DLQ depth 18, …) are **chosen by me** to be
internally consistent and to reconcile with the sidebar badges — they are fixture data, not measured
facts, and none of them is a benchmark claim. If the orchestrator or owner wants different numbers, this
is the one place to change them.

### OQ-8 — GLM 5.2 adversarial design pass is a merge gate, and it is blocked (owner: owner)

Per lane-policy invariant 5 and OD-5, the dashboard revamp **leads** on the Opus lane but **requires a
GLM 5.2 adversarial design pass before merge**. That lane is currently `credential: absent` —
`OPENROUTER_API_KEY` is not present under `~/.claude` (worklog, overnight run). This brief cannot clear
that gate and does not attempt to. Owner action: export the key or name the file that carries it.

### OQ-9 — Is a bounded correlated log strip legal? (owner: orchestrator)

Acceptance line 1 forbids an owned "structured/console log tail". The rescope simultaneously says "the
**correlated strip in S6** deep-links Aspire logs" — so a strip is intended. The brief draws the line as:
**read-only, bounded line count, no follow, no filters, no search, out-link required** (`ns-logstrip`).
Confirm that reading, or tighten it to "a link only, no lines at all".

### OQ-10 — DDX-0 / #410 scope amendment (owner: orchestrator)

DDX-0 (#410) scoped the fresh-ui L3 promotion at **7 blocks**. The revamped IA needs **20 new units**
(6 promote-set + 14 dashboard-specific) plus 5 variants/skins/layout objects — see
`PROPOSED-COMPONENTS.md`. That is a real scope amendment to the fresh-ui sync-back lane (WSL Codex), and
it should be reflected on the board *before* the canvas produces components nobody has budgeted to
implement. LD-6's inversion (prototype validates the promote-set **before** DDX-0 implements) is exactly
the loop that surfaces this — but the amendment still needs filing.

### OQ-11 — The two correlation keys (owner: orchestrator, then framework lane)

The framework has **two** correlation values in play: the trigger event id (a UUID — what a worker
execution's `correlationId` carries when trigger-originated) and the **saga's domain correlation value**
(here, the Stripe charge id `ch_3QK9dR2eZ`, from `webhookPayload.data.object.id` per `SAGA_MESSAGE_MAP`).
The locked routing says `/flow/:correlationId` is *the* journey URL, and its own examples use
`ch_3QK9dR2eZ` — but the trigger-event route resolves the journey by `eventId`.

The design assumes **one journey per incident, keyed on the domain correlation id**, with the trigger
event as a node inside it. For that to be true, `/flow/:correlationId` must **resolve either key to the
same journey**. That is a framework-side requirement, not a design choice. Flagging it here so it lands
in the implementation issue rather than being discovered when the deep-links don't resolve.

### OQ-12 — Is the design-system project the right home for the prototype? (owner: orchestrator)

The task targets *NetScript — NS One* (`ec262e10…`, `PROJECT_TYPE_DESIGN_SYSTEM`), which already holds
both the 44 component cards **and** 7 screens. The 2026-07-12 prompt set instead targeted a **separate
prototype project** (`4c19e768…`, `NetScript Dev Dashboard.dc.html`) with NS One attached as its design
system. Building a 38-screen prototype *inside* the design-system project mixes the system with its
consumer, and the design-system project type is immutable at creation (worklog OD-1 caveat).

I built the brief for the NS One project as instructed. **Confirm** — or redirect to a fresh prototype
project bound to NS One as its design system, which is the cleaner separation and matches how the
platform expects a design system to be consumed.
