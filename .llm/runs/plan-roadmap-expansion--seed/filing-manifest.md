# FILING MANIFEST — Phase-2 one-shot (machine-readable)

> The exact create/update set for the morning batch, after owner confirms OF-5/OF-10 + milestones +
> labels. **No mutation until then.** Authoritative issue **bodies** live in the referenced
> `design/*/epic-and-issues.md`; this manifest is the taxonomy/milestone/keyword/DAG index.
>
> **Closing-keyword law:** a resolving **PR body** carries `Closes #N`; issue bodies carry
> `Part of #<epic>` with **no** keyword. **NEVER** a closing keyword on an umbrella: **#301, #391,
> #238, #327, #232**, or the NEW epics `telemetry-revamp` / `dev-dashboard` / `docs-cut`.
> Every issue carries exactly one `status:` (= `status:plan` at filing).

## Pre-filing steps (in order)

1. `gh pr ready 397`; main merges #397.
2. Apply `proposed-labels-patch.md` to `.github/labels.yml` (reviewed edit on the merge, not the plan branch).
3. `gh label create` — **only these 3** (wave:* + epic:ai-stack/deployment already live):
   - `epic:telemetry-revamp` (color `5319e7`)
   - `epic:dev-dashboard` (color `5319e7`)
   - `epic:docs-cut` (color `5319e7`, **only if OF-2 Opt-2**)
4. Create milestones — **only these 3** (beta.5/stable/Backlog already exist):
   - `0.0.1-beta.6`, `0.0.1-beta.7`, `0.0.1-beta.8`.
5. File/update issues per the sections below.
6. Re-milestone + backfill the existing issues per the UPDATE tables.

---

## EPIC 1 — telemetry-revamp (NEW umbrella)  ·  `design/B-telemetry/epic-and-issues.md`

**Epic issue.** Title: `epic: telemetry-revamp — framework telemetry convention + ports/adapters +
dashboard query surface (Spine-1 enabler)`. Labels: `type:umbrella`, `epic:telemetry-revamp`,
`area:telemetry`, `priority:p1`, `status:plan`. Milestone `0.0.1-beta.6`. Body: `Part of #301`;
co-lands with `dev-dashboard`. **No closing keyword.**

| ID | Title | Labels (+ epic:telemetry-revamp) | Milestone | Deps | Keyword |
| -- | ----- | -------------------------------- | --------- | ---- | ------- |
| T1 | Framework telemetry convention (TC-1..14) + attribute-namespacing law | type:feat, area:telemetry, priority:p1, wave:v1, status:plan | beta.5 | none | PR `Closes` T1 |
| T2 | Package ports/adapters restructure (close Refactor arch-debt) | type:refactor, area:telemetry, priority:p1, wave:v1, gate:jsr, status:plan | beta.5 | T1 | PR `Closes` T2 |
| T3 | Thin-vs-SDK provider adapters + decouple `enabled` from `OTEL_DENO` | type:feat, area:telemetry, priority:p1, wave:v1, status:plan | beta.6 | T2 | PR `Closes` T3 |
| T4 | W3C hardening + triggers W3C-parenting bugfix | type:fix, area:telemetry, area:plugins, priority:p1, wave:v1, status:plan | beta.6 | T1, T2 | PR `Closes` T4 |
| T5 | Real span-links for fan-in (streams + sagas) | type:feat, area:telemetry, area:plugins, priority:p1, wave:v1, status:plan | beta.6 | T1, T2, T3 | PR `Closes` T5 |
| T6 | oRPC span-creation fix + AI port invocation | type:fix, area:telemetry, area:service, area:sdk, area:plugin-ai, priority:p1, wave:v1, status:plan | beta.6 | T1, T2 | PR `Closes` T6 |
| T7 | `@netscript/telemetry/query` dashboard surface | type:feat, area:telemetry, area:aspire, priority:p1, wave:v1, status:plan | beta.6 | T2 | PR `Closes` T7 |
| T8 | Real (non-mocked) grouped-trace e2e — Flow B (**epic merge-gate**) | type:test, area:telemetry, area:cli, priority:p1, wave:v1, gate:e2e, status:plan | beta.6 | T4, T5, T6, T7 | PR `Closes` T8 |
| T9 | AI OTel adapter (GenAI semconv) + Flow-A duckdb — **== FAI-17** | type:feat, area:telemetry, area:plugin-ai, area:ai-core, priority:p2, wave:defer, status:plan | stable | T3, T6 | file ONCE (see F-ai FAI-17) |

**Note:** T9 and FAI-17 are the **same issue**, cross-labelled `epic:telemetry-revamp` +
`epic:ai-stack`. File it once (under the F-ai/#248 lane) — do **not** create both T9 and FAI-17.

---

## EPIC 2 — dev-dashboard (NEW umbrella)  ·  `design/A-dashboard/epic-and-issues.md`

**Epic issue.** Title: `epic: NetScript Dev Dashboard — Aspire-extension dev console (ships as a
plugin, beta.6)`. Labels: `type:umbrella`, `epic:dev-dashboard`, `area:plugins`, `area:aspire`,
`area:fresh-ui`, `area:telemetry`, `priority:p1`, `status:plan`, `wave:v1`. Milestone `0.0.1-beta.6`.
Body: `Part of #301`; cross-epic dep `telemetry-revamp` (T4/T5/T6/T7). **No closing keyword.**

**23 sub-issues.** All carry `epic:dev-dashboard`, `status:plan`, `wave:v1` (except DDX-19 =
`wave:defer`). Milestone `0.0.1-beta.6` unless noted stable. Each resolving PR `Closes` its issue.

| ID | Title (short) | Extra labels | Milestone | Deps |
| -- | ------------- | ------------ | --------- | ---- |
| DDX-0 | fresh-ui L3 `blocks/` promotion (LD-2 proving diff) | type:feat, area:fresh-ui, gate:jsr, priority:p1 | beta.6 | none |
| DDX-1 | `@netscript/aspire` seam ext (`command`+`app`) | type:feat, area:aspire, priority:p1 | beta.6 | none |
| DDX-2 | `packages/plugin-dashboard-core` scaffold + contract | type:feat, area:plugins, gate:jsr, priority:p1 | beta.6 | none |
| DDX-3 | `TelemetryQueryPort` + aspire-otlp-http adapter | type:feat, area:telemetry, area:plugins, priority:p1 | beta.6 | DDX-2 (soft: T7) |
| DDX-4 | `plugins/dashboard` thin plugin (manifest+scaffold+e2e) | type:feat, area:plugins, area:cli, gate:jsr, priority:p1 | beta.6 | DDX-2 |
| DDX-5 | Fresh build-console shell + app-registration + IA | type:feat, area:fresh, area:fresh-ui, priority:p1 | beta.6 | DDX-0, DDX-4, DDX-15 |
| DDX-6 | Stack Map panel | type:feat, area:fresh, area:aspire, priority:p1 | beta.6 | DDX-5, DDX-13 |
| DDX-7 | Service Catalog + API Explorer | type:feat, area:fresh, area:plugins, priority:p1 | beta.6 | DDX-5, DDX-13 |
| DDX-8 | Flow / Trace Waterfall ★flagship | type:feat, area:fresh, area:telemetry, priority:p1 | beta.6 | DDX-5, DDX-3, **T4/T5/T6/T7 (hard, cross-epic)** |
| DDX-9 | Run Inspector (list+detail beta.6; rerun+history stable) | type:feat, area:fresh, area:telemetry, priority:p1 | beta.6 / stable | DDX-5, DDX-3 (rerun: DDX-1) |
| DDX-10 | Plugin Control HOST/registry (renders contributed sections) | type:feat, area:fresh, area:plugins, area:aspire, priority:p1 | beta.6 | DDX-5, DDX-1, DDX-17 |
| DDX-11 | Logs panel | type:feat, area:fresh, area:telemetry, priority:p2 | beta.6 | DDX-5, DDX-3 (browser-logs: DDX-1) |
| DDX-12 | Resource Control (basic beta.6; composite stable) | type:feat, area:fresh, area:aspire, priority:p2 | beta.6 / stable | DDX-5, DDX-1 |
| DDX-13 | Introspection endpoint `/_netscript/*` | type:feat, area:cli, area:plugins, priority:p2 | beta.6 | DDX-2, DDX-4 |
| DDX-14 | CLI surface + auto-launch | type:feat, area:cli, priority:p2 | beta.6 | DDX-4 |
| DDX-15 | MANDATORY Claude design-sync artifact + panel prototype | type:feat, area:fresh-ui, area:docs, priority:p1 | beta.6 | DDX-0 (**lane: Claude**) |
| DDX-16 | E2E: dashboard join + panel smoke (**merge-readiness**) | type:test, gate:e2e, area:plugins, priority:p1 | beta.6 | full beta.6 set + **T4/T5/T6/T7** |
| DDX-17 | `DashboardPanelContribution` seam (`.withDashboardPanel`) | type:feat, area:plugins, gate:jsr, priority:p1 | beta.6 | DDX-2, DDX-5 |
| DDX-18a | workers per-capability section | type:feat, area:fresh, area:plugins, priority:p1 | beta.6 | DDX-17, DDX-5, DDX-3, DDX-1 |
| DDX-18b | sagas per-capability section | (same as 18a) | beta.6 | (same) |
| DDX-18c | triggers per-capability section | (same as 18a) | beta.6 | (same) |
| DDX-18d | streams per-capability section | (same as 18a) | beta.6 | (same) |
| DDX-19 | Codegen-from-UI "Add resource" (⇄ #238) | type:feat, area:cli, area:plugins, priority:p2, **wave:defer** | stable | DDX-4, DDX-17 |

> **OF-10 gate:** the beta.6 milestone of DDX-17 + DDX-18a-d **assumes per-capability (OF-10 = adopt)**.
> If OF-10 = flat list, move DDX-17 + DDX-18a-d → stable and drop DDX-10's DDX-17 dep before filing.

---

## EPIC 3 — docs-cut (NEW umbrella, **OF-2 Opt-2 only**)  ·  `design/CD-docs/epic-and-issues.md`

**Epic issue (Opt-2, recommended).** Title: `epic: beta.7 docs release cut — tutorial rewrites +
per-feature positioning`. Labels: `type:umbrella`, `epic:docs-cut`, `area:docs`, `status:plan`,
`wave:v1-min`. Milestone `0.0.1-beta.7`. Body: `Part of #301`; related `#232`. **No closing keyword.**

**Opt-1 alternative:** edit #232 title/body to the docs-cut, + file one NEW `docs: accuracy &
coverage debt` issue (labels `type:docs`, `area:docs`, `status:triage`, `wave:defer`, milestone
`Backlog / Triage`) holding #232's displaced checklist.

**18 sub-issues.** All: `type:docs` (S0 = `type:refactor`), `area:docs`, `status:plan`, milestone
`0.0.1-beta.7`, `Part of #<epic>`, `Depends on #S0`. Wave `wave:v1-min`. PRs `Closes` each.

| ID | Title (short) | Notes | Deps |
| -- | ------------- | ----- | ---- |
| S0 | reconcile `capabilities/` into 9 pillars (redirected) | type:refactor, priority:p1, **lane WSL Codex** (HARD precursor) | epic |
| C1 | rewrite storefront track | Opus workflow | S0 |
| C2 | rewrite workspace track (+auth) | Opus workflow | S0 |
| C3 | rewrite erp-sync track | Opus workflow | S0 |
| C4 | rewrite live-dashboard track | Opus workflow | S0 |
| C5 | rewrite chat track (**GATED** on @netscript/ai publish) | Opus workflow | S0 + ai pre-flight |
| C6 | NEW minimal-eis-chat on-ramp | Opus workflow | S0 |
| D1 | services & SDK stories | Opus workflow | S0 |
| D2 | durable-workflows stories | Opus workflow | S0 |
| D3 | background-processing stories | Opus workflow | S0 |
| D4 | data-persistence stories | Opus workflow | S0 |
| D5 | identity-access + plugin-system fix | Opus workflow | S0 |
| D6 | observability story | Opus workflow | S0 |
| D7 | orchestration-runtime + CLI/scaffold | Opus workflow | S0 |
| D8 | web-layer stories | Opus workflow | S0 |
| D9 | AI-stack + MCP stories (**GATED**) | Opus workflow | S0 + ai pre-flight |
| V-C | tutorial per-track validation verdict | status:impl-eval, **lane OpenHands** | C1–C6 |
| V-D | positioning per-pillar validation verdict | status:impl-eval, **lane OpenHands** | D1–D9 |

---

## EPIC 4 — #327 desktop rescope (existing epic — body edit + 8 NEW)  ·  `design/E-desktop/epic-and-issues.md`

**#327 action:** edit body to insert the **Tier-4** block (no closing keyword; epic stays open).
**#375 folds into #E2** (`Closes #375` on the #E2 PR body). **#349 stays a WATCH sibling.**

| ID | Title (short) | Labels (+ epic:deployment) | Milestone | Deps | Keyword |
| -- | ------------- | -------------------------- | --------- | ---- | ------- |
| #E1 | sdk in-process link-mode adapter | type:feat, area:sdk, gate:jsr, priority:p2, status:research | beta.8 | none | PR `Closes` #E1 |
| #E2 | desktop app-type in Aspire generator (folds #375) | type:feat, area:aspire, area:cli, priority:p2, status:research | beta.8 | none | PR `Closes` #E2 **and `Closes #375`** |
| #E3 | tursodb single-writer relocation + composition root | type:feat, area:database, area:cli, priority:p2, status:research | beta.8 | none | PR `Closes` #E3 |
| #E4 | true single-process mode (option c) | type:feat, area:cli, area:sdk, priority:p2, status:research | beta.8 | #E1, #E3 (#E2 shell) | PR `Closes` #E4 |
| #E5 | offline-first via Turso Sync | type:feat, area:database, priority:p3, status:research | beta.8 | #E4 | PR `Closes` #E5 |
| #E6 | 1-click packaging + release/update server | type:feat, area:cli, priority:p2, status:research | beta.8 | #E2, #E4 | PR `Closes` #E6 |
| #E7 | desktop/single-process deploy-e2e | type:test, area:cli, gate:e2e, priority:p2, status:research | stable | #393, #394, #E4, #E6 | PR `Closes` #E7 |
| #E8 | code-signing automation | type:feat, area:cli, priority:p3, status:research | stable | #E6 | PR `Closes` #E8 |

---

## EPIC 5 — #238 AI-stack re-sequence  ·  `design/F-ai/epic-and-issues.md`

**#238 action:** re-milestone **beta.3→beta.7**; backfill children `priority:`/`status:`; add an
epic comment recording the F-ai re-sequence. **No closing keyword.** No new `epic:f-ai` label.

**UPDATE existing issues** (re-milestone + backfill; disposition per `SUPERSESSION-MAP.md`):

| # | Re-milestone | Backfill / change |
| - | ------------ | ----------------- |
| #388 | beta.3→beta.5 | covers FAI-0…3 |
| #258 | stable→beta.6 | minimal scope note (FAI-5) |
| #379 | beta.3→beta.6 | + `status:`; absorbs #257 |
| #380 | beta.3→beta.7 | + `status:` |
| #246 | beta.4→beta.7 | FAI-13 |
| #290 | beta.4→beta.7 | FAI-14 |
| #269 | beta.4→beta.7 | FAI-15 |
| #270 | beta.4→beta.7 (citation half→stable) | FAI-16 |
| #248 | beta.4→stable | + `epic:telemetry-revamp` cross-label (== T9) |
| #247 | beta.4→stable | keep |
| #262 | beta.4→stable | keep |
| #256 | beta.4→stable | keep |
| #252 | (reconcile state first) | FAI-6 |

**NEW F-ai issues** (all `epic:ai-stack`, `status:plan`, `Part of #238`):

| ID | Title (short) | Labels | Milestone | Deps |
| -- | ------------- | ------ | --------- | ---- |
| FAI-4 | flagship-quality-parity law → doctrine-11 + README fix | type:docs, area:docs, area:plugin-ai, priority:p1, wave:v1 | beta.5 | none (**lane Opus docs**) |
| FAI-10 | reasoning-effort/token-cap per-call `modelOptions` passthrough | type:feat, area:ai-core, gate:jsr, priority:p2, wave:v1 | beta.7 | none |
| FAI-11 | BYOK per-request key/baseURL seam | type:feat, area:ai-core, gate:jsr, priority:p2, wave:v1 | beta.7 | FAI-10 |

**FAI-17 (== T9):** file once against **#248**, add `epic:telemetry-revamp`; milestone stable;
labels `type:feat`, `area:ai-core`, `area:telemetry`, `gate:jsr`, `epic:ai-stack`,
`epic:telemetry-revamp`, `priority:p2`, `wave:defer`. HARD deps Topic-B **T3 + T6**.

> **Cardinality reconcile (secondary fork):** FAI-0–3 share #388; FAI-6→#252 (verify state); FAI-7
> and FAI-9 are "new" slices in the DAG but the "3 NEW issues" headline counts only FAI-4/10/11.
> Confirm whether FAI-6/7/9 each get their own GitHub issue before filing.

---

## Milestone create-list

| Milestone | Action |
| --------- | ------ |
| `0.0.1-beta.6` | **CREATE** |
| `0.0.1-beta.7` | **CREATE** |
| `0.0.1-beta.8` | **CREATE** |
| `0.0.1-beta.5` | exists — do not create |
| `0.0.1-stable` | exists |
| `Backlog / Triage` | exists |

## Close-list

**Empty at filing.** #257 and #375 close via their downstream resolving-PR `Closes #N` keywords
(#379 and #E2 respectively). No manual `gh issue close` in the Phase-2 batch. See `SUPERSESSION-MAP.md`.
