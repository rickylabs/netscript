<!-- PROVENANCE: This is the verdict-of-record authored by the independent OpenHands PLAN-EVAL
     run-28716441078-1 (minimax M3 via OpenRouter), a separate session from the Fable author and the
     WSL-Codex F1 reviewer. The run's agent exited 0 and wrote this file as plan-eval.md.new, but the
     CI "Commit changes back to PR branch" + "Commit run trace to PR branch" steps FAILED, so the
     evaluator's own commit never landed. Content recovered verbatim (line-reflowed from the
     soft-wrapped run log) and committed by the supervisor to restore the verdict of record. NOT
     re-authored, re-scored, or defended. The canonical clean copy is also preserved in the run's
     posted `<!-- openhands-agent-summary -->` comment on PR #397 and run artifact
     openhands-agent-28716441078-1. -->

# PLAN-EVAL — `plan-roadmap-expansion--seed`

- Plan evaluator session: OpenHands `run-28716441078-1` (minimax M3 via OpenRouter) — separate from
  the Fable 5 author session and from the WSL-Codex F1 adversarial reviewer
- Run: `plan-roadmap-expansion--seed` (branch `plan/roadmap-expansion`, PR #397, draft)
- Surface / archetype: **PLANNING-ONLY** — no framework code, no plugin or package surface, no
  GitHub mutations. Public surface of the run is the roadmap artifact set (`plan.md` +
  `design/<topic>/*` + `research.md` + `worklog.md` + `analysis/*` + per-topic addenda). The
  planned roadmap itself spans the universal A1–A7 archetype columns (`plugins/dashboard` = A4;
  `packages/plugin-dashboard-core` = A2; `packages/cli` desktop branch = A6; `packages/telemetry` =
  A2; `@netscript/sdk` `createInProcessClientLink` = A2/A4; `packages/fresh-ui` = A5; the docs
  delta = A1).
- Scope overlays: docs (planning artifacts only). Future runtime + jsr + arch-check + e2e
  validation deferred to IMPL-EVAL per-slice.
- Evaluator protocol: `gates/plan-gate.md` + `evaluator/plan-protocol.md` (separate-session
  discipline observed; this session did not author, defend, or re-edit the plan).

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` exists; re-baselined against `main` (`eeaff336`). 14-row Findings table covers Topic-A fresh-ui evidence (Finding #1, post-F2 softened to "5/37 pairs sampled-identical; 32 require DDX-0 full-tree-diff gate" — verified), Topic-B oRPC tracing no-op (Finding #3/4/5), Topic-C missing milestones (Finding #14, post-F2 extended to beta.5/beta.6/beta.7/beta.8 with `gh api` evidence), and the jsr-audit surface scan rows for DDX-0/2/4/17 + #E1 (Findings #6–#11, see also "jsr-audit" row below). Spot-checked Finding #1 against `analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md` lines 85–89/117–123 — the post-F2 rewording is honest, and the FULL-TREE-DIFF proving gate now lives on DDX-0 acceptance (epic-and-issues.md lines 73–80) rather than being claimed on LD-2 itself. |
| Decisions locked | PASS | `plan.md` lines 56–73 carry LD-1…LD-12 with rationale and source column. Spot-checks: LD-2 (post-F2 softened to "sampled L0–L2 verified byte-identical; remaining 32 pairs asserted in DDX-0 scripted full-tree diff") ✓; LD-4 (telemetry posture: zero-dep default, `@opentelemetry/sdk-*` opt-in fan-in adapter under `adapters/otel-sdk/`) ✓; LD-10 (tier-4 desktop deploy ladder: option (a)→(b)→(c) with (c) as the publish target) ✓; LD-12 (`#349` stays WATCH sibling, not folded into tier-4; `design/E-desktop/epic-and-issues.md` lines 11–12) ✓. |
| Open-decision sweep | PASS | `plan.md` lines 107–130 carry OF-1…OF-13 with three explicit columns: Status, Rework if deferred? (Yes/No), and Notes. Post-F2 (commit `6b12225d`) the two real "must resolve now" forks are correctly named: **OF-5** (opt-in OTel-SDK dep posture — Yes-rework with documented fallback to no-attribute fan-in) and **OF-10** (=OQ-11 per-capability IA — Yes-rework with documented fallback re-draft path that moves DDX-17 + DDX-18a-d to stable). Both are technically pre-resolved in the drafted artifacts and the plan does not ship an *unresolved* decision that would force rework. The closing note (plan.md lines 130–135) is correct: "neither leaves an *unresolved* decision that forces rework." My independent sweep (below) found no additional rework-forcing deferrals. |
| Commit slices (< 30, gate + files each) | PASS | `worklog.md` lines 40–50 list **9 run-level slices** (well under 30) and explicitly mark each with gate + files. Per-epic slice counts (verified): dashboard **23** slices (DDX-0…17 + DDX-18a-d + DDX-19) — post-F2 fix to F1-07 (`worklog.md` line 84; `design/A-dashboard/epic-and-issues.md` line 285 milestone summary); telemetry **9** slices T1…T9; docs **13** slices S0 + C1–6 + D1–9 + V; desktop **8** slices #E1–E8. All four epics are < 30. DDX-16 post-F2 fix: `design/A-dashboard/epic-and-issues.md` line 271 now lists the explicit full beta.6 dep set ("DDX-0, DDX-1, …, DDX-15, DDX-17, DDX-18a-d; cross-epic hard: `telemetry-revamp` T4, T5, T6, T7.") — verified against F1-04. |
| Risk register | PASS | `plan.md` lines 137–162 (Drift Watch + Risk Mitigations) names six live risks with concrete mitigations: (R1) `app`-kind Aspire embedding → fallback Seam B `apps.dashboard`; (R2) `command` kind same Aspire pin; (R3) `withBrowserLogs` runtime-validity drift; (R4) tier-3 serverless mode (`#349` WATCH); (R5) T6 oRPC span no-op (the load-bearing beta.6 gate; T6 is on DDX-8/DDX-16 hard-deps post-F2); (R6) docs IA drift (S0 reconciliation block). All six have a slice-bound or contract-bound mitigation, not a hand-wave. |
| Gate set selected | PASS | `plan.md` lines 164–189 (Per-Epic Gate Matrix) names a coherent gate set per epic: dashboard `gate:jsr` + `deno task arch:check` + runtime e2e; telemetry same + e2e + a fresh-ui contract test; desktop `gate:jsr` + arch-check + signing/CI (deferred to stable); docs `deno task check` (root), `deno task lint` (scoped), `deno fmt --check --ext ts,tsx` (typed sources only). All gate families are drawn from `gates/archetype-gate-matrix.md`. The plan also names the per-slice `agent-briefs.md` lane discipline. This evaluator did NOT run any gate; the gates are correctly *named* for IMPL-EVAL to run per-slice. |
| Deferred scope explicit | PASS | `plan.md` lines 191–200 carry an explicit "Deferred Scope" block enumerating: stable-tier telemetry AI adapter + Flow-A duckdb (T9), desktop deploy-e2e/signing (#E7/#E8), dashboard depth (rerun-from-step, rich history, composite orchestration), schema-driven db tab (Directus precedent), and **out-of-program** baggage propagation, external dual-write, and `#349` serverless. Each deferred item is mapped to a stable-tier path or explicitly out-of-program. |
| jsr-audit surface scan (pkg/plugin) | PASS | `research.md` Findings #6–#11 plus `plan.md` Per-Epic Gate Matrix lines 168–174 enumerate the planned public-surface deltas: `@netscript/fresh-ui` (DDX-0, `registry/blocks/` subpath) → `gate:jsr`; `packages/plugin-dashboard-core` (DDX-2, new package) → `gate:jsr`; `plugins/dashboard` (DDX-4, new plugin) → `gate:jsr`; `DashboardPanelContribution` contract (DDX-17) → `gate:jsr`; `@netscript/sdk` `createInProcessClientLink` + `clearInProcessServices` (#E1) → `gate:jsr`. All five carry explicit `deno task doc:lint` (full export map) + `deno publish --dry-run` (allow-dirty) acceptance (verified at `design/A-dashboard/epic-and-issues.md` lines 83–86 / 121–123 / 158–160 / 291–293; `design/E-desktop/epic-and-issues.md` lines 69–70 + 86–88). Slow-type risk is named: `deno doc --lint` is the publish bar, structural mirrors only, no `any`, no upstream oRPC/Hono types leaked (#E1 acceptance 6/7). |

## Open-decision sweep (evaluator-run)

The plan's OF-1…OF-13 table is already complete, so this section is the **independent** sweep I
ran looking for any decision the plan *left out* of the OF table that would force rework if
deferred. I evaluated the lock table (LD-1…LD-12), the per-epic drafts, the DAG, the risk
register, and the gate matrix; the following are the candidate deferrals I considered and my
verdict on each.

| Candidate decision (not in OF table) | Verdict / Reasoning |
| --- | --- |
| `apps.dashboard` Seam B fallback for DDX-1 if Aspire `app` kind slips | Already captured as **R1** in the Drift Watch (`plan.md` line 159) with a named mitigation, not a lock-time open decision. Resolved-by-default with a named degraded path. No plan rework if the `app` kind slips. **Not a fail.** |
| Aspire `command` kind removal in a future pin | `plan.md` line 159 (R2) names the same Aspire pin (`13.4.6`) as the `command` kind's load-bearing assumption but does not name a fallback if the `command` kind itself becomes unavailable. Partly covered by the pin ceiling; a pin change is a much larger refactor than the dashboard roadmap. Drift Watch territory, not a plan-time lock. **Not a fail**, but a candidate to add to the Drift Watch in a future F-cycle. |
| `TelemetryQueryPort` concrete surface shape (DDX-3 ↔ T7) | Open question **OQ-1** is named ("cross-topic handshake, Stage D verification"), but the *abstraction* is locked: a port the dashboard queries and the telemetry core answers. The handshake decides the **wire shape**, not the **port shape**; panels are insulated. No rework. **Not a fail.** |
| `.withDashboardPanel` realization: contract-seam vs first-class core `definePlugin` axis | **OF-11** in the plan's OF table (`plan.md` line 121) — classified "should resolve before DDX-17 filing; no plan rework" because both realize the same panel-contribution capability. I agree: the seam LOCATION changes, but slice deps and milestones do not, and DDX-18a-d downstream is insulated. **Properly tracked; not a fail.** |
| DDX-19 codegen-from-UI "Add resource" stretch trigger at beta.6 | **OF-12** in the plan's OF table. Stable-tier default; beta.6 stretch only if DDX-4 scaffolders are cheap to expose. **Properly tracked; not a fail.** |
| Schema-driven `db` tab (Directus precedent) | **OF-13** in the plan's OF table. Stable-tier, gated on Prisma-Next DB-layer migration. **Properly tracked; not a fail.** |
| DDX-0 fresh-ui L0–L2 verified-equal "32 unsampled pairs" outcome | The decision (verified-equal vs drift) is IN-scope of DDX-0, not an external open decision. The plan correctly puts the FULL-TREE-DIFF proving gate on DDX-0 acceptance and refuses to claim universality in LD-2 (post-F2 softening). **Not a fail.** |
| `tursodb` option-(c) relocation: concurrent-load os-error-33 in prod | LD-10 picks option (c) with the (a)→(b)→(c) ladder (plan.md line 70). The ladder is itself the fallback discipline. A prod-time os-error-33 regression would force a fallback to option (b) + a follow-up issue, but not a plan rewrite. **Not a fail.** |

**No additional rework-forcing decisions found.** The plan's OF-1…OF-13 sweep is genuinely
complete; F2's reclassification of OF-10 from "safe to defer" to "must resolve now" correctly
captures the per-capability IA fork that the drafted beta.6 issue graph is already built on.

## Verdict

`PASS`

### Notes (non-blocking)

These are observations the author may want to consider in a follow-up F-cycle; they do **not**
affect the Plan-Gate verdict.

1. **Drift Watch could name a fallback if the Aspire `command` kind itself becomes unavailable**
   (R2 only covers the `app` kind fallback). Current mitigation = pin 13.4.6. Low-likelihood;
   action only if Aspire's roadmap signals a kind-removal.
2. **`#238` AI-on-codegen is a cross-epic edge to a flagship AI plugin** (`plan.md` line 122;
   OF-12 notes "owner must co-own so it is not built twice"). The plan correctly defers DDX-19 to
   stable and names the cross-edge; IMPL-EVAL should verify the #238 owner is looped in before any
   DDX-19 beta.6 stretch attempt.
3. **`.github/labels.yml` does not yet have a `wave:*` block** (verified: only
   `type:`/`status:`/`priority:`/`area:`/`ci:`/`gate:` blocks present). OF-1 (post-F2) tracks this
   as an owner action before issue-filing. **Not a plan-time fail**; the obligation is correctly
   placed on the owner, not the author.
4. **Lane discipline** (WSL Codex for framework/plugin/sdk/db, Opus workflows for docs prose,
   OpenHands for validation) is referenced via `agent-briefs.md` in the per-epic drafts; the
   per-slice handoff briefs live in `design/*/agent-briefs.md` (referenced, not in the scope of
   this evaluation). The lane law is consistent across LD-11 / `worklog.md` / DDX Lane columns.

### Summary for PR comment

Verdict: **PASS** on `plan/roadmap-expansion` (PR #397). All eight Plan-Gate checklist items
satisfied; all ten F1 findings (3 BLOCKER + 5 MAJOR + 1 MINOR + 1 NIT) verified fixed at F2
(commit `6b12225d`) without introducing new gaps. The plan's OF-1…OF-13 open-decision sweep is
genuinely complete: the two ratify-now forks (OF-5 SDK-adapter dep posture, OF-10 per-capability
IA) are both technically pre-resolved in the drafted artifacts with documented fallback re-draft
paths, so no decision is silently deferred. Independent evaluator-run sweep found no additional
rework-forcing deferrals. Plan is ready for owner ratification; PR #397 stays draft until the owner
picks OF-5 and OF-10 and creates the missing milestones + `wave:*` labels per OF-1.
