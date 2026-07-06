# Dev Dashboard Rescope — Owner Ratification Batch

Run: `dashboard-rescope--seed` · 2026-07-06. **Nothing below has been executed.** This is the complete, ordered GitHub mutation batch; on owner approval it runs in one pass (gh from WSL, all bodies via `--body-file /mnt/c/...`, bodies extracted from `issues-rescope.md` / `epic-rewrite.md`).

## Decision summary (what you are ratifying)

1. **Kill the duplicative surfaces:** close #418 (trace waterfall → folds into #419), #421 (logs panel → Aspire deep-link), #422 (resource control → `withCommand` inside Aspire), #425 (design-sync → superseded by #507). Supersession comments only, no closing keywords.
2. **Rescope the survivors to the complementary-DX thesis:** rewrite #400 (epic, adds the mandatory non-duplication acceptance line), #411, #412, #413, #415, #416, #417, #419, #420, #423, #424, #426, #428–#431, #507.
3. **File the missing flagship + gap issues:** DDX-20 Runtime-Config Monitor (S3, beta.6 flagship), DDX-21 DB Migrations & Drift (S11), DDX-22 DLQ (S12, defer), plus two co-requisite thin API slices (TriggerDlqPort route; queue DeadLetterStore CLI/API).
4. **Keep as-is:** #410, #414, #509; keep-with-tightening-comment: #408, #427, #432.
5. **Design lane:** prototype the rescoped S1–S12 in Claude Design using `claude-design-prompts.md`; no more static in-repo screens; duplication is rejected at design review.

## Execution checklist (ordered)

### Step 1 — Close (comment first, then close; NO closing keywords)
- [ ] #418 DDX-8 waterfall — post supersession comment (text in `issues-rescope.md` §418), `gh issue close 418 --reason "not planned"`, clear milestone, remove `wave:v1`.
- [ ] #421 DDX-11 logs — same pattern (§421).
- [ ] #422 DDX-12 resource control — same pattern (§422); note seam work continues on #411.
- [ ] #425 DDX-15 design-sync — same pattern (§425); points to #507.

### Step 2 — Rewrite bodies (`gh issue edit N --body-file …`; labels/milestone per section)
- [ ] #400 epic — body from `epic-rewrite.md` **after Step 4 fills the #TBD numbers**; retitle to "…the Aspire/Scalar satellite dev console…"; set `status:plan`.
- [ ] #411 DDX-1 Seam A (`command`+`app` kinds) — ensure `area:aspire`, `priority:p1`.
- [ ] #412 DDX-2 core scaffold (TraceTree demoted to `TraceRef`).
- [ ] #413 DDX-3 correlation-only query port.
- [ ] #415 DDX-5 / S1 shell.
- [ ] #416 DDX-6 / S2 wiring graph (add `area:config`).
- [ ] #417 DDX-7 / S4 catalog (try-it deleted).
- [ ] #419 DDX-9 / S6 run inspector (absorbs #418; cross-ref comment).
- [ ] #420 DDX-10 / S5 plugin control (elevated).
- [ ] #423 DDX-13 `/_netscript/*` introspection (+ runtime-config SSE subtopic).
- [ ] #424 DDX-14 CLI + deep-link surface + generator emission.
- [ ] #426 DDX-16 E2E gate (assertions rewritten: no owned-waterfall assertion).
- [ ] #428 DDX-18a / S7 workers (+ scheduler-drift panel).
- [ ] #429 DDX-18b / S8 sagas.
- [ ] #430 DDX-18c / S9 triggers (DLQ tab gated; set after co-req filed).
- [ ] #431 DDX-18d / S10 streams (`priority:p2`; verify delivery read-model before beta.6 commit).
- [ ] #507 design prototype (rescoped screen set + duplication design-review gate).

### Step 3 — Tightening comments on keeps (`gh issue comment N --body-file …`)
- [ ] #408 T7 query surface — correlation/export-only non-goal addendum.
- [ ] #427 DDX-17 panel seam — non-duplication-bound-panels addendum.
- [ ] #432 DDX-19 codegen-from-UI — one-generator-two-callers addendum; confirm `wave:defer` + milestone `0.0.1-stable`.
- [ ] #410, #414, #509 — no action.

### Step 4 — File new issues (`gh issue create --body-file …`; capture numbers)
- [ ] DDX-20 / S3 Runtime-Config Monitor ⚑ — `type:feat area:config area:fresh-ui area:plugins epic:dev-dashboard priority:p1 wave:v1 status:triage`, milestone `0.0.1-beta.6`.
- [ ] DDX-21 / S11 DB Migrations & Drift — `type:feat area:database area:fresh-ui area:plugins epic:dev-dashboard priority:p2 wave:v1 status:triage`, milestone `0.0.1-beta.6`.
- [ ] DDX-22 / S12 DLQ — `type:feat area:service area:fresh-ui area:plugins epic:dev-dashboard priority:p2 wave:defer status:triage`, milestone `Backlog / Triage`. (Optional pre-step: add `area:queue` to `.github/labels.yml`.)
- [ ] co-req: `TriggerDlqPort` contract route — `type:feat area:service epic:dev-dashboard priority:p2 wave:defer status:triage`, `Backlog / Triage`.
- [ ] co-req: queue `DeadLetterStore` CLI/API — `type:feat area:service area:cli epic:dev-dashboard priority:p2 wave:defer status:triage`, `Backlog / Triage`.
- [ ] Back-fill the five new numbers into #400's body (the `#TBD` slots) and into #430's DLQ dependency line.

### Step 5 — Design lane kickoff (no GitHub mutation)
- [ ] Run the S1–S12 prompts from `claude-design-prompts.md` in the Claude Design project (NS One DS, post-#547 registry); enforce the duplication gate at design review under #507.

## Open decisions for the owner
1. **S10 Streams beta.6 commitment** — conditional on a delivery/fan-out read-model existing; if absent, S10 slips to fast-follow (label change on #431 at that point).
2. **`area:queue` label** — add to `labels.yml` or reuse `area:service` for the queue DLQ co-req.
3. **S11 wave** — beta.6-if-cheap as drafted, or defer outright.
4. **#418/#421/#422/#425 close reason** — drafted as "not planned (superseded)"; confirm.
