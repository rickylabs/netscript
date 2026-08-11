# T9 — Supersession map for epic #400 and the Dev Dashboard record (charter Q10)

> **HISTORICAL EVIDENCE — frozen at authoring time.** Where this pack disagrees with
> `docs/architecture/rfc/rfc-0002-devtools-contribution.md`, **the RFC wins**. Notably the package
> boundary was later corrected from `A2 plugin-devtools-core` to **A1 `packages/devtools-core` +
> A6 CLI emission + A5 plugin**, and identity/ordering were unified on `(mountId, id, apiMajor)`
> and anchors-then-`(order, mountId, id)`. See `RFC-AUTHORITY.md` and `drift.md`.


> **NO GITHUB MUTATION.** This file is draft text only. Nothing here creates, edits, closes,
> retitles, re-milestones, labels, or comments on any issue or PR. Every `gh` command cited below
> was a read. Nothing is filed before the owner ratifies at stage H.

Stage-D deep-dive pack for run `plan-devtools-contribution--seed` (draft PR #1450), baseline
`main` @ `2256a67bf`. All live GitHub reads re-executed 2026-08-11 from this worktree; every
disposition below was deduplicated against that live state (issue/PR states, milestones, labels
re-read the same day — see Sources). Corpus authorities: `../../research/b1-dashboard-board.md`
(b1), `../../research/b2-doctrine-and-live-board.md` (b2),
`../../research/p1-rfc-890-frontend-contrib.md` (p1), `../../research.md` (F8–F10, F14),
`../../research/SYNTHESIS-NOTES.md` (S-6…S-12).

**Two live corrections to the corpus, found this pass:**

1. **`CR-DDX-HOSTAGNOSTIC` exists.** It is a real, owner-authored change request recorded as a
   comment on #400 (rickylabs, association `owner`, 2026-07-06T12:30:28Z), titled *"Change request
   from the process-manager epic (#510) — CR-DDX-HOSTAGNOSTIC"*, sourced from #510's stage-H
   design pack (`research/design/d4-cli-admin-console-surfaces.md` §4 on PR #504, PLAN-EVAL PASS).
   b1 OQ3 / D8 said it appeared "in no #400 body text and no ratified rescope artifact" — true of
   the body and the rescope batch, but the comment thread carries it. It has **never been
   resolved**: no later comment on #400 answers it (8 comments total; the last is 2026-07-19).
   Source: `gh issue view 400 --comments` (2026-08-11). See §Conflict resolutions C3.
2. **The last owner-ratified board event is NOT the 2026-07-06 rescope batch.** A later
   owner-ratified comment exists on #400: *"Train (owner-ratified 2026-07-19). The dev dashboard
   ships **after everything else** — umbrella tracked on **Backlog / Triage**; all children move
   to **0.0.1-beta.18**"* — which, after the 0.0.x rename (`00e3b047f`, b1 D5), is today's
   `0.0.15` ("Cascaded from beta.18", milestone description, live 2026-08-11). The 2026-07-06
   rescope remains the last ratified **content** rescope (32 mutations, `dashboard-rescope--seed/
   ratification-summary.md:1-12`); 2026-07-19 is a later ratified **scheduling** event. This
   materially changes the milestone question: the children sitting on `0.0.15` is deliberate,
   not drift — see §Recommended milestone home. The same comment also flags #734 for owner
   review ("may be worth pulling earlier if frontend-contrib needs them").

---

## Authority ledger

Per artifact: is it **committed evidence** (files/analysis with merge provenance) or a **ratified
decision** (an owner action that binds the board)? A map that conflates the two is wrong — #1446
itself declares the #400 record "evidence, not ratified architecture" (research.md F3;
`p2` RFC:516-519), and the charter agrees.

| Artifact | State (live 2026-08-11) | Authority class | Why |
| --- | --- | --- | --- |
| Epic #400 body (rescoped 2026-07-06) | OPEN, `Backlog / Triage`, `type:umbrella` `status:plan` | **Ratified decision** | Rewritten by the owner-ratified 2026-07-06 rescope batch ("✅ EXECUTED… yes to all, proceed", `dashboard-rescope--seed/ratification-summary.md:1-12`); carries the ownership thesis + 3 acceptance lines + killed-surfaces list (b1 F3) |
| `dashboard-rescope--seed/` run dir | on `main` | **Ratified decision (record of)** | The execution record of the 32-mutation batch, incl. corrections D5/D6 (b1 F7) |
| 2026-07-19 train comment on #400 | comment, owner-authored | **Ratified decision** | Self-declares "owner-ratified 2026-07-19"; moved all children to beta.18 (→`0.0.15`), epic to Backlog / Triage; live milestones match it exactly (`gh issue list --label epic:dev-dashboard`) |
| PR #685 + `dashboard-design--orchestrator/` corpus | **MERGED** 2026-07-12, label frozen at `status:research`, milestone `0.0.1-beta.10` | **Committed evidence only** | Self-labelled *"analysis only / no product code changed"* (`run-eval.md:3-5`); label never advanced past `status:research`; posted 20 issue comments so its analyses are *referenced from* the board without having *rewritten* it — #427 still describes a single panel member, not the 7-member family (b1 F5; live re-check of PR labels 2026-08-11). Its routing resort and 7-member union are **inputs to re-derive, never citable as ratified** |
| PR #780 + `render/`+`visual/` payload | OPEN draft, **no labels, no milestone**, stale since 2026-07-14 | **Uncommitted proposal** | 158 files all under `.llm/runs/beta10--orchestrator/{render,visual}/`, zero on `main` (verified: main's `beta10--orchestrator/` holds only `briefs/ canvas-prompts/ slices/ supervisor.md worklog.md drift.md kickoff.md MORNING-HANDOFF.md` — fs listing 2026-08-11; b1 F6) |
| PR #506 | CLOSED (superseded by #685) | Historical record | Value (`tools/design-sync/`) absorbed via #685 `5d905018`; closure comment 2026-07-12 (b1 F8) |
| RFC #890 + `plan-frontend-contrib--seed/` canonical record | **MERGED** 2026-08-03; epic #922 + 24 children all OPEN `status:plan` | **Ratified design, zero implementation** | Docs-only merge (32 files, no source — p1 F1); owner arbitration recorded for fork F8 only; F1/F2/F3/F5/F7/F9 unarbitrated (p1 F9, D-6). Its supersession rows for #427/#432/#400 are the merged, owner-visible layer this map inherits. **Caution:** its own `design/examples/dashboard.md` contradicts its ratified sibling-payload decision (p1 F11) — do not copy |
| PR #1446 (RFC-0001, runtime automation) | OPEN draft, `status:plan-eval` | **Proposal with a quotable mandate** | Unmerged; but its P-6 row and the two-hosts decision sentence (research.md F3) are the charter's own framing and are treated as a constraint, not as board authority |
| `CR-DDX-HOSTAGNOSTIC` | owner comment on #400, 2026-07-06T12:30:28Z; **unresolved** | **Recorded change request, undecided** | Owner-authored, sourced from #510's ratified stage-H pack; but no decision (accept/decline) was ever recorded on #400. #544 depends on the *resolution*, which does not exist yet |
| `plan-roadmap-expansion--seed/design/A-dashboard/` | on `main` | Committed evidence (**superseded in part**) | The original v1 design that generated #400/#410–#432; overtaken by the 2026-07-06 rescope (pillars/kills) and by #890 (pipeline). Still cited as "Design source" in several child bodies (b1 file table) |
| `resources/design/dashboard/` | on `main` | Committed evidence (pre-rescope) | 4-screen HTML prototype + specs, last content change at release `4d438ce1a` (b1 F1) |
| `tools/design-sync/` + `deno.json:80` | on `main`, live task | **Shipped product code** | The only shipped code of the whole program (b1 F1) |

---

## Issue-level map

Dispositions use exactly: `KEEP`, `AMEND`, `FOLD`, `SUPERSEDE`, `CLOSE-LATER`. Every row was
deduplicated against live GitHub state on 2026-08-11 (state / milestone / labels columns are the
live reads, matching b1's inventory with zero drift). "What must be true first" names the
precondition for the stage-H mutation. Dispositions marked *(b1 first-pass)* adopt
b1's recommendation unchanged; deviations are flagged.

**Counts: 15 KEEP (+3 already-closed no-action) · 13 AMEND · 2 FOLD · 1 SUPERSEDE · 1 CLOSE-LATER.**

| # | Title (short) | Live state · milestone · status | Disposition | Reason (one line) | What must be true before it changes |
| --- | --- | --- | --- | --- | --- |
| 400 | epic: Dev Dashboard | OPEN · Backlog/Triage · `status:plan` | **AMEND** | Ownership thesis + 3 acceptance lines + killed-list survive verbatim (b1 F3); the invent-your-own-discovery premise, dead `beta.6` prose, and screen list do not | RFC ratified at stage H; rewrite preserves the thesis as normative acceptance criteria (research.md R2) |
| 410 | DDX-0 fresh-ui L3 `blocks/` | OPEN · 0.0.15 · plan | KEEP *(b1)* | Host-agnostic, still unbuilt (`ls packages/fresh-ui/registry` → no `blocks/`, b1 F1/D9); unaffected by contribution redesign | — |
| 411 | DDX-1 Aspire `command`+`app` kinds | OPEN · 0.0.15 · plan | KEEP *(b1)* | The out-link/embed seam; independent of the contribution family; `withCommand` is a mirror, never the home (research.md F6) | — |
| 412 | DDX-2 `plugin-dashboard-core` seam | OPEN · 0.0.15 · plan | AMEND *(b1)* | Core package survives; its owned-model set must be re-derived from the RFC's family, not from the 7-member analysis draft (b1 D3) | RFC's contribution-family section (T2/T3 packs) locked |
| 413 | DDX-3 `TelemetryQueryPort` adapter | OPEN · 0.0.15 · plan | KEEP *(b1)* | Correlation-only port is the non-duplication thesis in code; largely shipped already as `@netscript/telemetry/query` (research.md F5) — body should note the shipped surface | — (the note rides the #400 amendment batch) |
| 414 | DDX-4 `plugins/dashboard` thin plugin | OPEN · 0.0.15 · plan | AMEND *(b1)* | Thin plugin survives; manifest/axis wiring re-baselines onto the RFC's axis decision (pointer axis, §C1) | Three-seam resolution ratified (C1) |
| 415 | DDX-5 shell + IA | OPEN · 0.0.15 · plan | AMEND *(b1)* | Shell survives; must adopt the RFC's IA (T8 pack) and host contributed nav; the `_app`/`_layout` split is re-derived, not inherited from the unratified resort | T8 IA locked |
| 416 | DDX-6 Stack Map | OPEN · 0.0.15 · plan | KEEP *(b1)* | Declared-vs-running wiring is uniquely NetScript-owned | — |
| 417 | DDX-7 Service & Contract Catalog | OPEN · 0.0.15 · plan | KEEP *(b1)* | Above the Scalar boundary by construction; degraded state for streams (no oRPC contract surface, b2 F8) must be stated in the RFC, not here | — |
| 418 | DDX-8 S13 Live Flow | OPEN · 0.0.15 · plan | KEEP *(b1)* | Flagship differentiator; already survived one supersession honestly (waterfall→flow rescope) | — |
| 419 | DDX-9 Run Inspector | OPEN · 0.0.15 · plan | KEEP *(b1)* | Only-NetScript run-state; cross-linked to #418 | — |
| 420 | DDX-10 Plugin Control host | OPEN · 0.0.15 · plan | AMEND *(b1)* | Becomes the host mount for the DevTools contribution family; scope grows toward the `/extensions` manager the coverage matrix says nobody owns (b1 F9) | RFC family + IA locked |
| 421 | DDX-11 Logs panel | CLOSED/NOT_PLANNED | KEEP (closed; no action) | Kill stays documented in the RFC non-goals so it cannot creep back (#400 killed-list) | — |
| 422 | DDX-12 Resource Control | CLOSED/NOT_PLANNED | KEEP (closed; no action) | Same — superseded by `withCommand` rendered inside Aspire | — |
| 423 | DDX-13 `/_netscript/*` introspection | OPEN · 0.0.15 · plan | AMEND *(b1)* | Survives as the read plane; must serve `GET /contributions` + entity reads and reconcile with #1446/#1390 data-plane decisions (T5 pack) | T5 data-plane design locked |
| 424 | DDX-14 CLI + URL scheme | OPEN · 0.0.15 · plan | **SUPERSEDE** *(b1)* | The board's one recorded outright contradiction: `coverage-matrix.md` marks its flat URL scheme "the one true contradiction" against the merged routing resort (b1 F9/D4) — and the resort itself is unratified, so *neither* is the contract; the RFC defines the URL contract and #424 re-files against it | RFC URL-contract section exists; re-filed issue drafted before #424 closes |
| 425 | DDX-15 design-sync artifact | CLOSED/NOT_PLANNED | KEEP (closed; no action) | Settled by the rescope batch; the `Closes`-on-closed-PR lesson stays recorded (b1 F8) | — |
| 426 | DDX-16 E2E join + panel smoke | OPEN · 0.0.15 · plan | AMEND *(b1)* | Gate survives; add contribution-render + quarantine-state assertions; keep the "no owned waterfall" assertion | RFC gate section locked |
| 427 | DDX-17 `DashboardPanelContribution` | OPEN · 0.0.15 · plan | **FOLD** *(b1)* | #890's merged map already re-baselined it to "kinds + host, not pipeline" (`plan-frontend-contrib--seed/rfc.md:236-240`); the RFC defines the family (host-agnostic per C3), so #427 becomes an implementation slice of the RFC, not an independent design | RFC family section ratified; fold recorded on #427 with the CR resolution (C3) |
| 428 | DDX-18a Workers console | OPEN · 0.0.15 · plan | AMEND *(b1)* | Survives as first-party dogfood consumer; body must state the #933 boundary (C2) and the delivery mechanism per the RFC | Two-epic boundary ratified (C2) |
| 429 | DDX-18b Sagas console | OPEN · 0.0.15 · plan | AMEND *(b1)* | Same, against #944 | Same |
| 430 | DDX-18c Triggers console | OPEN · 0.0.15 · plan | AMEND *(b1)* | Same, against #944; also inherits the triggers SOUND-convergence hole (b2 F8) as an explicit degraded state | Same |
| 431 | DDX-18d Streams console | OPEN · 0.0.15 · plan | AMEND *(b1)* | Same, against #944; streams has no oRPC contract surface at all (b2 F8) | Same |
| 432 | DDX-19 Codegen-from-UI | OPEN · 0.0.15 · `wave:defer` | KEEP *(b1)* | Acceptance line 2 in issue form; #890 already assigns its engine to FCB-17 `AppTarget` — the re-baseline note rides the #400 amendment, no body rewrite needed | — |
| 507 | Design prototype + design-sync | OPEN · 0.0.15 · plan | **CLOSE-LATER** *(b1)* | Its deliverables shipped via #685 (merged) and #780 (draft); stays open only until the RFC's design pack absorbs its duplication/flow≠waterfall design-review gate, then closes as delivered | RFC design pack carries the gate; owner confirms at stage H |
| 509 | fresh-ui registry revamp | OPEN · 0.0.15 · plan | KEEP *(b1)* | Orthogonal to contribution architecture; also the landing lane for #780's `DS-UPLIFT-BACKLOG` salvage (see file map) | — |
| 551 | DDX-20 S3 Runtime-Config Monitor | OPEN · 0.0.15 · `status:triage` | AMEND (**deviation from b1's KEEP**) | Survives, but must add the explicit #1446 Surface-1/Surface-2 boundary: read+watch diagnostics is DevTools; operator write-back must name its relation to the admin console's management plane (research.md F3; b1 OQ6). A body change is required, so AMEND is the honest label | #1446's fate known, or the boundary stated independently in the RFC |
| 552 | DDX-21 DB Migrations & Drift | OPEN · 0.0.15 · triage | KEEP *(b1)* | Migration/drift state is invisible to Aspire | — |
| 553 | DDX-22 Dead-Letter Queues | OPEN · 0.0.15 · triage | KEEP *(b1)* | Explicitly gated on #554/#555 — the board's own "no panel before its route" rule | — |
| 554 | `TriggerDlqPort` route (co-req) | OPEN · 0.0.15 · triage | KEEP *(b1)* | Thin backend slice, no UI; unaffected by contribution decisions | — |
| 555 | queue `DeadLetterStore` (co-req) | OPEN · 0.0.15 · triage | KEEP *(b1)* | Same | — |
| 556 | runtime-config mutations (co-req) | OPEN · 0.0.15 · triage | KEEP *(b1)* | One write path for S3 + CLI; prerequisite of #551's write-back | — |
| 557 | DDX-23 seam-event flow plane | OPEN · 0.0.15 · triage | KEEP *(b1)* | Upgrades S13 from correlation-join to boundary-event fidelity; pure backend | — |
| 734 | dashboard-panel axis **in the manifest** | OPEN · **0.0.10** · `status:triage`, **not** `epic:dev-dashboard` | **FOLD** *(b1)* | The third competing seam; its placement (fat manifest axis) loses to the pointer-axis decision (C1), but its requirement (a discoverable dashboard-panel contribution) is absorbed by the RFC. The 2026-07-19 owner comment already flags it for review | Three-seam resolution ratified; fold comment cross-refs #890 §2.3 + the RFC before closing |
| 544 | PM-33 Process Control panel | OPEN · 0.0.15 · plan · `epic:process-manager` | AMEND — **coordinate; body edit belongs to epic #510** | Un-dangles once the RFC resolves `CR-DDX-HOSTAGNOSTIC` (C3); the RFC records the CR resolution, #510's lane updates #544 | CR resolution ratified; #510 owner-ack |
| 922 / 933 / 944 | frontend-contrib epic + zone-panel children | OPEN · 0.0.9 / 0.0.9 / 0.0.11 | **coordinate, do not touch** (no disposition — another epic's children) | The RFC states the ownership boundary (C2) instead of re-scoping #922's children; charter directive | — |

*(Dedup note: `gh issue list --label epic:dev-dashboard --state all` on 2026-08-11 returned exactly
the 33 issues above — no new children since b1; #218 is the only closed historical "devtools" issue
and needs no disposition; `gh search issues "devtools"` returned no new open claimant.)*

---

## File-level map

| Artifact | Where it lives (verified 2026-08-11) | Disposition | Reason / handling |
| --- | --- | --- | --- |
| `.llm/runs/dashboard-design--orchestrator/` (routing resort, `plugin-extension-architecture.md`, coverage-matrix, screen catalog, prototype, prompts) | on `main` (via merged #685) | **KEEP** as committed evidence | Never cite as ratified (authority ledger); the RFC **re-derives** routing and the kind family from it. `analysis/plugin-extension-architecture.md`'s 7-member union and trust tiers are inputs to T2/T3/T6, not decisions (b1 F5, D3) |
| `.llm/runs/dashboard-rescope--seed/` | on `main` | **KEEP** | The ratified-decision record: thesis, kills, acceptance lines, D5/D6 corrections (b1 F7). The RFC quotes it |
| `.llm/runs/beta10--orchestrator/` (main portion: briefs, canvas-prompts, slices, supervisor/worklog/drift) | on `main` — **without** `render/`+`visual/` | KEEP | Orchestration record; no design authority claimed |
| `.llm/runs/beta10--orchestrator/{render,visual}/` (prototype.dc.html, 33 visual reports, 16 adversarial evals, DESIGN-LANGUAGE / ROLLOUT-DOCTRINE / HOME-SPEC / DS-UPLIFT-BACKLOG) | **only on PR #780's branch** `feat/dashboard-visual-revamp`, unmerged, stale since 2026-07-14 | **CLOSE-LATER** (the PR), **salvage first** | The visual passes encode the flat 15-screen hash-router IA the RFC will replace (b1 F6, OQ8); merging them post-RFC would import a dead IA. Salvage `DS-UPLIFT-BACKLOG.md` + `DESIGN-LANGUAGE.md` into the #509 lane (their own stated destination), then close #780 citing the RFC. *Inference:* revival is not worth it — 13 per-screen adversarial acceptances are sunk cost against a superseded IA |
| `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/` | on `main` | **SUPERSEDE** (as design authority; file stays) | The v1 design generating #400/#410–#432; overtaken twice (2026-07-06 rescope; #890 pipeline claim). Child bodies still citing it as "Design source" get the pointer corrected in the stage-H amendment batch. The file itself is history — no deletion |
| `resources/design/dashboard/` (4 HTML screens + specs) | on `main` | **SUPERSEDE** (as design authority; file stays) | Pre-rescope prototype; superseded by #685's corpus, which is itself evidence-only. Keep for provenance |
| `tools/design-sync/` + `deno.json:80` `design:sync` | on `main`, live task | **KEEP** | The program's only shipped code; still the fresh-ui→Claude-Design bridge the RFC's design lane would reuse (b1 F1, F8) |
| `.llm/runs/plan-frontend-contrib--seed/` (rfc.md + `design/canonical/`) | on `main` (via merged #890) | **KEEP** (ratified design layer) | The envelope/identity/registry spine is the pattern layer this RFC builds against (p1 F14) — with the standing caution that **`design/examples/dashboard.md` contradicts the ratified sibling-payload decision** (p1 F11/D-4) and must not be copied |

---

## Conflict resolutions

### C1 — Three competing seams, one contribution axis

| Claimant | Position | Authority |
| --- | --- | --- |
| #427 (DDX-17, `0.0.15`) | `DashboardPanelContribution` in `plugin-dashboard-core/contracts/v1`; `@netscript/plugin` gains **no** dashboard axis (thinness law) | Ratified by the 2026-07-06 rescope (tightened by comment), then re-baselined by merged #890 |
| #890 / #922 (`0.0.9`) | Pointer axis `.withFrontend()` = manifest learns only `{ export, framework }`; family payload lives in the pointed-to module; dashboard family = sibling payload on the shared envelope | **Merged RFC** — the only owner-visible arbitration layer on this seam (p1 C8; `rfc.md:236-240`) |
| #734 (`0.0.10`, `status:triage`, unlabelled for the epic) | A dashboard-panel contribution axis **in the plugin manifest** — the fat-manifest placement #427 forbids | Triage-only; never ratified; owner-flagged 2026-07-19 for review |

**Verdict: #890's pointer axis wins the axis question; #427 folds into the RFC as the family
definition; #734 folds and closes.** Reasoning: (a) #890 is the only merged, owner-arbitrated
layer, and its supersession row already re-scoped #427 to "kinds + host, not pipeline";
(b) #427's thinness law and #890's pointer axis **agree** with each other and jointly reject
#734's fat-manifest placement — there are really two positions, not three, and the merged one
subsumes the ratified-older one; (c) #734's *need* (a discoverable panel contribution) is met by
the pointer axis, so folding loses nothing. **Honesty caveat:** the winning seam is merged design
text with **zero implementation** (p1 F1/F5) — so the RFC's dependency fork (owner fork 1,
SYNTHESIS-NOTES: depend on #890's spine vs self-contained family) decides *when* this seam is
real, not *whether* it is the seam. #734 must not close until the RFC section that absorbs it is
ratified, and the fold comment must cross-reference #890 §2.3 and the 2026-07-19 owner flag.

### C2 — Two epics claim dashboard-zone panels (#933/#944 vs #428–#431)

**Verdict: both survive because they are different artifacts on different hosts; the RFC writes
the boundary; #922's children are not touched.** #933/#944 are **app-family zone panels** —
contributions mounted into the *scaffolded userland app's* declared zones
(`app.dashboard.panels` etc., `01-contracts.md:240-243`), filed as #922 dogfood at `0.0.9`/
`0.0.11`. #428–#431 are **DevTools-host console screens** — full per-capability surfaces inside
the DevTools shell at `0.0.15`. Subject overlap (workers/sagas/triggers/streams UI) is real;
artifact overlap is not, *provided the RFC states it*: epic #922 owns app-surface zone panels;
epic #400 owns DevTools-host consoles; the DevTools family is a sibling payload on the shared
envelope, exactly as #890's map already casts #400 ("CONSUMER: starts on this layer's pipeline…
instead of inventing discovery"). The AMEND rows for #428–#431 add one boundary sentence each
("consumes learnings from #933/#944; does not re-ship their zone panels"); nothing on #933/#944
moves. If the owner instead wants one epic to own *all* four-capability UI, that is an owner fork
(§Open questions Q3) — this map does not silently re-scope another epic's children (charter
directive; also the sequencing bill b2 F10 assigns to "whoever schedules #922's Wave 3").

### C3 — `CR-DDX-HOSTAGNOSTIC`

**It exists.** Owner-authored comment on #400, 2026-07-06T12:30:28Z (verbatim quote captured in
this pass): split `DashboardPanelContribution` so the panel descriptor
`{ id, title, icon, capability, component, slots, commands }` is **host-neutral** and `setup()`
receives a **host-provided context** rather than reaching into dashboard-core's Aspire-coupled
ports; acceptance = one contribution renders in two host shells; `@netscript/plugin` stays
dashboard-agnostic. Explicitly non-blocking for #510 ("if the CR is declined or unresolved, #544
simply slips"). **It has provenance (owner comment, sourced from #510's ratified stage-H pack)
but no resolution** — nothing on #400 accepts or declines it.

**Recommendation: the RFC resolves it by accepting it.** The CR's shape is independently what the
research already concludes the RFC needs: a host→panel context contract (research.md F4 —
RFC-A's "separate named extension axes" sentence licenses it), host-owned typed data flow to the
contributed component (`m3` M-7 via SYNTHESIS-NOTES S-21), and #890's `HostSurfaceDescriptor`
negotiation. Accepting it un-dangles #544 and gives the family its second host for free (the pm
console). The resolution is recorded in the RFC's family section and in the stage-H comment on
#400/#427; #544's own body edit belongs to epic #510's lane.

### C4 — Milestone incoherence

Facts, all live 2026-08-11: `0.0.14`'s description says *"Dev dashboard (thin,
contribution-based) + auth/deploy tail"* yet holds 11 open issues, **all** deploy (#915–#919) or
enterprise-auth (#881–#886) and zero dashboard issues; all 28 open `epic:dev-dashboard` children
sit on `0.0.15`; #400 sits on `Backlog / Triage`. **The live find resolves the incoherence's
direction:** the children's `0.0.15` placement is the owner-ratified 2026-07-19 train
("ships after everything else"; beta.18 → `0.0.15` per the cascade note in `0.0.15`'s own
description), and #400's Backlog/Triage placement matches both that comment and Backlog/Triage's
stated rule ("epic/umbrella issues"). So the **issues are right and the `0.0.14` description is
stale** — a leftover from an earlier train, contradicted by the later ratified event. See
§Recommended milestone home.

---

## Recommended milestone home

1. **Implementation children stay on `0.0.15`.** This is the last ratified scheduling decision
   (2026-07-19 train), and "GitHub wins on conflict" (b2 D4; `github-conventions.md:446-452`)
   applies to issue placements over milestone prose. Re-homing 28 issues to `0.0.14` would revert
   an owner decision on the strength of a stale description.
2. **Fix `0.0.14`'s description at stage H** — strip "Dev dashboard (thin, contribution-based)"
   (leaving the auth/deploy tail wording), so no future map re-derives this contradiction. One
   milestone-description edit, no issue moves. *(Owner may instead choose to pull the dashboard
   tranche into `0.0.14` to match the description — that is a deliberate reversal of the
   2026-07-19 train and is listed as fork Q2, not recommended.)*
3. **Epic #400 stays on `Backlog / Triage`** — matches its own ratified placement and the
   milestone's stated rule.
4. **The DevTools RFC tracking issue goes on `0.0.6`** — that milestone's description is "RFC
   ratification", and #1348/#1361 set the live precedent (b2 F11, D4). The RFC *document's* home
   is a separate, already-escalated owner fork (b2 F9 options A–D; pre-empts #1380's scheduled
   acceptance item — run-level fork 2, not re-argued here).
5. Any milestone consequences of the C1/C2 verdicts (e.g. if the owner pulls #734's requirement
   forward into the `0.0.9` frontend-contrib wave, as the 2026-07-19 comment itself floats) are
   stage-H decisions the RFC's DAG must expose, not silent moves.

---

## Open questions for the owner

1. **Ratify the three-seam verdict (C1):** pointer axis wins; #427 folds into the RFC's family
   section; #734 folds and closes at ratification. Also decide the linked run-level fork: does
   the DevTools family *depend on* #890's unbuilt spine (`0.0.9`) or ship self-contained?
2. **Ratify the milestone verdict (C4):** children stay `0.0.15` + `0.0.14` description edit —
   or deliberately reverse the 2026-07-19 train and pull the tranche into `0.0.14`?
3. **Ratify the two-epic boundary (C2):** #922 owns app-surface zone panels, #400 owns
   DevTools-host consoles — or consolidate all capability UI under one epic (which would mean
   touching #922's children — not recommended, not drafted)?
4. **Accept `CR-DDX-HOSTAGNOSTIC` (C3)?** Recommended accept; the RFC then owes the host-provided
   context contract and the two-host render test as acceptance criteria, and #544 un-dangles.
5. **#780 disposition:** salvage `DS-UPLIFT-BACKLOG`/`DESIGN-LANGUAGE` into #509 then close, per
   the file map — or keep the draft alive pending the RFC's IA (its 13 adversarially-gated screens
   encode the superseded flat IA)?
6. **#507 close-out trigger:** confirm CLOSE-LATER fires when the RFC design pack absorbs its
   design-review gate (duplication + flow≠waterfall), not before.
7. **Was the 7-member `DashboardContribution` family ever owner-ratified anywhere outside the
   analysis-only #685 corpus?** This map found no such event (b1 OQ4, D3; #427 unrewritten,
   live). If the owner considers it ratified, the authority ledger row for #685 changes and the
   T2/T3 packs must treat the union as an input constraint. *(unverified negative — absence of a
   ratification event was checked on #400's full comment thread and #427's live body, not on
   every issue thread in the repo)*

---

## Sources

**Live GitHub reads (all read-only, `gh` against `rickylabs/netscript`, 2026-08-11, this pass):**

- `gh issue view 400 --comments` and `gh issue view 400 --json comments` — full 8-comment thread;
  CR-DDX-HOSTAGNOSTIC comment (2026-07-06T12:30:28Z); `CommandInvokePort` first-definer ack
  (2026-07-06T12:30:30Z); PR #713 dependency-direction lock (2026-07-12); **train comment
  (2026-07-19T14:40:43Z, "owner-ratified")**
- `gh issue list --label epic:dev-dashboard --state all --limit 100 --json
  number,title,state,stateReason,milestone,labels` — 33 issues, live states in the issue map
- `gh issue view <n> --json …` for n ∈ {734, 544, 933, 944, 922, 510, 1380}
- `gh pr view <n> --json number,state,isDraft,mergedAt,milestone,labels` for
  n ∈ {685, 780, 506, 890, 1446, 1450}
- `gh api repos/rickylabs/netscript/milestones --paginate` — `0.0.14`/`0.0.15`/`0.0.9`/`0.0.6`/
  Backlog descriptions and counts
- `gh search issues --repo rickylabs/netscript "devtools" --limit 20` — dedupe sweep (no new
  claimant)

**Filesystem (baseline `main` @ `2256a67bf`, worktree `/home/codex/repos/ns-rfc-devtools-contribution`):**

- `ls .llm/runs/beta10--orchestrator/` — confirms no `render/`/`visual/` on `main`
- `ls -d` on all eight file-map artifacts (all present)

**Corpus (this run):**

- `.llm/runs/plan-devtools-contribution--seed/research/b1-dashboard-board.md` (F1–F10, D1–D9,
  first-pass dispositions, file table, OQ1–OQ10)
- `.llm/runs/plan-devtools-contribution--seed/research/b2-doctrine-and-live-board.md` (F9–F11,
  D4–D5, milestone table)
- `.llm/runs/plan-devtools-contribution--seed/research/p1-rfc-890-frontend-contrib.md` (F1, F5,
  F9–F14, C1–C9, D-1…D-9)
- `.llm/runs/plan-devtools-contribution--seed/research.md` (F3–F5, F8–F10, F14; R2/R3)
- `.llm/runs/plan-devtools-contribution--seed/research/SYNTHESIS-NOTES.md` (S-6…S-12, S-14, S-21;
  owner-fork list)

**Referenced merged records (on `main`):**

- `.llm/runs/dashboard-rescope--seed/ratification-summary.md:1-12`
- `.llm/runs/dashboard-design--orchestrator/{run-eval.md:3-5, coverage-matrix.md,
  analysis/routing-resort.md, analysis/plugin-extension-architecture.md}`
- `.llm/runs/plan-frontend-contrib--seed/{rfc.md:236-248, design/canonical/01-contracts.md,
  design/examples/dashboard.md}`
