# Dev Dashboard Rescope — Owner Ratification Batch (v2)

> **✅ EXECUTED 2026-07-06** — owner ratified "yes to all, proceed" (D1–D7). All 32 mutations landed
> and were verified live. New issues: DDX-20 **#551**, DDX-21 **#552**, DDX-22 **#553**,
> TriggerDlqPort **#554**, DeadLetterStore **#555**, runtime-config mutation co-req **#556** (D6 7th
> issue), DDX-23 **#557**. Closed: #421/#422/#425 (not planned / superseded). `area:queue` label
> created. Decision corrections applied: **D5** — the `0.0.1-beta.7` milestone already existed, so
> #432/#556/#557 were assigned to it directly (not created/parked); **D6** — runtime-config is
> read+watch only, so S3/DDX-20 ships read-only in beta.6 with write-back gated behind #556. See
> `worklog.md` "BATCH EXECUTED" for the full mutation list. Follow-up NOT in this batch: `.github/labels.yml`
> `area:queue` sync commit; the Claude Design lane (Step 5).

Run: `dashboard-rescope--seed` · 2026-07-06, **amended same day (v2)** per owner feedback: restore the two seed-research pillars v1 dropped — Appwrite-style manage-through-UI and Encore-model seam-flow telemetry. This is the complete, ordered GitHub mutation batch; it ran in one pass (gh from WSL, bodies extracted from `issues-rescope.md` / `epic-rewrite.md`).

## Decision summary (what you are ratifying)

1. **Three-pillar thesis** (supersedes v1's observe-only framing): **Observe** (only-NetScript state), **Manage** (Appwrite-style per-capability create → configure(tabs) → monitor loop mirroring the CLI — one generator, two callers), **Follow** (Encore-model live seam-flow — S13 — never re-rendered OTLP).
2. **Kill the genuinely duplicative surfaces:** close #421 (logs panel → Aspire deep-link), #422 (resource control → `withCommand` inside Aspire), #425 (design-sync → superseded by #507). Supersession comments only, no closing keywords. **v2 change: #418 is NOT closed** — it flips to a REWRITE (S13 Live Flow); only its waterfall scope dies.
3. **Rescope the survivors:** rewrite #400 (epic — three pillars + acceptance lines 1–3), #411–#413, #415–#417, **#418 → S13 Live Flow ⚑ flagship #2**, #419 (run-centric, cross-links S13, drops "absorbs #418"), #420 (+ marketplace-lite install entries), #423 (+ `/_netscript/flows` SSE), #424, #426 (+ S13 flow-chain E2E assertion), #428–#431 (each + management-loop addendum: gated rerun/cancel/replay/redeliver where routes exist), #507 (S1–S13), **#432 → REWRITE-elevate** (beta.7 management keystone, was KEEP-defer).
4. **File the missing issues (6):** DDX-20 Runtime-Config Monitor **& Control** (S3 ⚑, beta.6, + gated write-back), DDX-21 DB Migrations & Drift (S11, + migrate/seed actions), DDX-22 DLQ (S12, defer), **DDX-23 seam-event flow plane** (v2 co-req: unified envelope + HTTP boundary events, recommend beta.7, framework-source = WSL Codex slice), plus two co-requisite thin API slices (TriggerDlqPort route; queue DeadLetterStore CLI/API).
5. **Keep as-is:** #410, #414, #509; keep-with-tightening-comment: #408, #427.
6. **Design lane:** prototype S1–**S13** in Claude Design using `claude-design-prompts.md` (v2: S3 gains write controls, S13 prompt added); duplication rejected at design review; flow ≠ waterfall enforced there too.

## Execution checklist (ordered)

### Step 1 — Close (comment first, then close; NO closing keywords)
- [ ] #421 DDX-11 logs — post supersession comment (text in `issues-rescope.md` §421), `gh issue close 421 --reason "not planned"`, clear milestone, remove `wave:v1`.
- [ ] #422 DDX-12 resource control — same pattern (§422); note seam work continues on #411.
- [ ] #425 DDX-15 design-sync — same pattern (§425); points to #507.
- [ ] ~~#418~~ — **removed from the close list in v2**; see Step 2.

### Step 2 — Rewrite bodies (`gh issue edit N --body-file …`; labels/milestone per section)
- [ ] #400 epic — body from `epic-rewrite.md` (**v2 body wins** over the copy embedded in `issues-rescope.md`) **after Step 4 fills the #TBD numbers**; retitle to "…the Aspire/Scalar satellite that drives the framework…"; set `status:plan`.
- [ ] **#418 DDX-8 → S13 Live Flow** — full replacement body from `issues-rescope.md` §418; retitle "DDX-8 / S13: Live Flow — request journey across framework seams"; labels `type:feat area:fresh-ui area:telemetry area:plugins epic:dev-dashboard priority:p1 wave:v1 status:plan`, milestone `0.0.1-beta.6`.
- [ ] #411 DDX-1 Seam A (`command`+`app` kinds) — ensure `area:aspire`, `priority:p1`.
- [ ] #412 DDX-2 core scaffold (TraceTree demoted to `TraceRef`; + `FlowRecord`).
- [ ] #413 DDX-3 correlation-only query port (v2 note: S13 does **not** widen this port).
- [ ] #415 DDX-5 / S1 shell (+ quick-action strip).
- [ ] #416 DDX-6 / S2 wiring graph (add `area:config`; + live-traffic edge overlay).
- [ ] #417 DDX-7 / S4 catalog (try-it deleted).
- [ ] #419 DDX-9 / S6 run inspector (v2: run-centric; cross-links S13; "absorbs #418" dropped).
- [ ] #420 DDX-10 / S5 plugin control (elevated; + v2 management addendum).
- [ ] #423 DDX-13 `/_netscript/*` introspection (+ runtime-config SSE; + **`/flows` + `/flows/subscribe`**).
- [ ] #424 DDX-14 CLI + deep-link surface + generator emission.
- [ ] #426 DDX-16 E2E gate (no owned-waterfall assertion; + v2 S13 flow-chain assertion: one HTTP request → chain with ≥3 primitive-labeled seam nodes + per-node Aspire out-link URL).
- [ ] #428–#431 DDX-18a–d / S7–S10 consoles (+ v2 management-loop addenda: gated rerun/cancel, replay/compensate, DLQ, redeliver — each only where the shipped contract exposes the route; #430 is the loop reference).
- [ ] **#432 DDX-19 codegen-from-UI** — REWRITE-elevate body from `issues-rescope.md` §432 (management keystone; one generator two callers; template-gallery create entries for S5/S7–S10); raise `priority:p3→p2`; **wave/milestone per owner decision D5 below**.
- [ ] #507 design prototype (S1–S13 + duplication design-review gate).

### Step 3 — Tightening comments on keeps (`gh issue comment N --body-file …`)
- [ ] #408 T7 query surface — correlation/export-only non-goal addendum.
- [ ] #427 DDX-17 panel seam — non-duplication-bound-panels addendum (Directus-validated contribution axis).
- [ ] #410, #414, #509 — no action.

### Step 4 — File new issues (`gh issue create --body-file …`; capture numbers)
- [ ] DDX-20 / S3 Runtime-Config Monitor **& Control** ⚑ — `type:feat area:config area:fresh-ui area:plugins epic:dev-dashboard priority:p1 wave:v1 status:triage`, milestone `0.0.1-beta.6`.
- [ ] DDX-21 / S11 DB Migrations & Drift — `type:feat area:database area:fresh-ui area:plugins epic:dev-dashboard priority:p2 wave:v1 status:triage`, milestone `0.0.1-beta.6`.
- [ ] DDX-22 / S12 DLQ — `type:feat area:service area:fresh-ui area:plugins epic:dev-dashboard priority:p2 wave:defer status:triage`, milestone `Backlog / Triage`. (Optional pre-step: add `area:queue` to `.github/labels.yml`.)
- [ ] **DDX-23 seam-event flow plane** — `type:feat area:telemetry area:service epic:dev-dashboard priority:p2 wave:defer status:triage`, `Backlog / Triage` (pull to the beta.7 milestone if D5 creates one). Framework-source → WSL Codex slice.
- [ ] co-req: `TriggerDlqPort` contract route — `type:feat area:service epic:dev-dashboard priority:p2 wave:defer status:triage`, `Backlog / Triage`.
- [ ] co-req: queue `DeadLetterStore` CLI/API — `type:feat area:service area:cli epic:dev-dashboard priority:p2 wave:defer status:triage`, `Backlog / Triage`.
- [ ] Back-fill the six new numbers into #400's body (the `#TBD` slots), #418's dependency line (DDX-23), and #430's DLQ dependency line.

### Step 5 — Design lane kickoff (no GitHub mutation)
- [ ] Run the S1–S13 prompts from `claude-design-prompts.md` in the Claude Design project (NS One DS, post-#547 registry); enforce the duplication gate **and the flow≠waterfall gate** at design review under #507.

## Open decisions for the owner
1. **S10 Streams beta.6 commitment** — conditional on a delivery/fan-out read-model existing; if absent, S10 slips to fast-follow (label change on #431 at that point).
2. **`area:queue` label** — add to `labels.yml` or reuse `area:service` for the queue DLQ co-req.
3. **S11 wave** — beta.6-if-cheap as drafted, or defer outright.
4. **Close reason for #421/#422/#425** — drafted as "not planned (superseded)"; confirm.
5. **#432 promotion target (v2)** — drafted as the beta.7 management wave keystone; no `0.0.1-beta.7` milestone exists yet — create it, or park at `Backlog / Triage` with `epic:dev-dashboard` + a "beta.7 management wave" tracking note until the beta.6 cut.
6. **S3 write-back scope (v2)** — in-scope for beta.6 if the runtime-config store already exposes set/unset use-cases; otherwise ship read-only + file the thin mutation-route co-req. Needs a quick store-surface check before the batch runs.
7. **S13 beta.6 fidelity commitment (v2)** — drafted as correlation-join over the four already-shipped SSE/history streams (no new instrumentation); the DDX-23 envelope upgrades fidelity in beta.7. Confirm you accept join-fidelity for the beta.6 cut.
