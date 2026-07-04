# SUPERSESSION MAP — consolidated open-issue disposition (audit artifact)

> **The owner approves this map before any issue is closed.** Consolidated from the six
> `design/*/epic-and-issues.md` supersession sections and a live read-only `gh issue list` /
> `gh api milestones` / `gh label list` sweep (this session, against `rickylabs/netscript`).
> **NO GitHub mutation has occurred.**
>
> **Headline disposition of the 47 open issues + planned NEW issues:**
> - **KEEP: 41** open issues (of which 12 F-ai children + 8 A–E children re-sequence milestones).
> - **FOLD: 2** — #257 → #379 (F-ai) and #375 → #E2 (desktop), both via a **downstream PR closing
>   keyword at landing**, not a filing-time close.
> - **CLOSE-as-superseded at filing: 0.** No issue is manually closed during Phase-2 filing. Every
>   fold resolves when its resolving PR merges with `Closes #N`.
> - **NEW issues to file:** 2 new epics (`telemetry-revamp`, `dev-dashboard`) + 1 conditional
>   (`docs-cut`, if OF-2 Opt-2) + their sub-issues, 8 desktop `#E*`, and 3 F-ai (FAI-4/10/11). Full
>   list in `filing-manifest.md`.

## Live-state corrections (read-only sweep this session)

| Claim in design docs | Live reality | Consequence |
| -------------------- | ------------ | ----------- |
| "`0.0.1-beta.5` milestone does not exist" | **Exists** (10 open issues) | Create only beta.6/7/8. |
| "`.github/labels.yml` has no `wave:*` — add before filing" | `wave:v1`/`v1-min`/`defer` **already live on the repo** | Only the labels.yml *file* is stale; 3 NEW epic labels are the only repo-side `gh label create`. |
| #252 (FAI-6), #240-cluster (FAI-7) referenced | **Neither in the open set** | Reconcile #252/#240 state before FAI-6/7 file (secondary fork). |

---

## Full open-issue disposition

### Umbrellas / epics — NEVER a closing keyword

| # | Title (short) | Disposition | Milestone move | Evidence |
| - | ------------- | ----------- | -------------- | -------- |
| #301 | Road to 0.0.1-stable | **KEEP** (top umbrella; parent of all) | stable (unchanged) | plan LD-1 |
| #391 | beta.3→stable re-forecast | **KEEP** (umbrella) | stable | live |
| #389 | Harness V3 | **KEEP** (separate epic, out of roadmap-expansion scope) | beta.5 | live |
| #238 | AI-stack umbrella | **KEEP**; re-milestone **beta.3→beta.7**; backfill children `priority:`/`status:`; add F-ai re-sequence comment | beta.3→beta.7 | F-ai epic §Epic |
| #327 | Deployment epic | **KEEP**; rescope body adds **Tier-4** (#E1–#E8) | beta.5 (epic unchanged) | E-desktop §A |
| #232 | Docs coverage umbrella | **OF-2 Opt-2 (rec): KEEP** as accuracy-debt sibling (disjoint scope; storefront Run-2 partly superseded). Opt-1: rescope into docs-cut. **No close either way.** | stable | CD-docs §1 |
| #313 | Prisma Next DB epic | **KEEP** (umbrella; DDX-13/OF-13 stable edge) | Backlog | live |

### AI-stack children (#238) — F-ai re-sequence

| # | Title (short) | Disposition | F-ai slice | Milestone move | Evidence |
| - | ------------- | ----------- | ---------- | -------------- | -------- |
| #388 | plugins/ai flagship parity | **KEEP** (load-bearing) | FAI-0…3 | **beta.3→beta.5** | F-ai FAI-0 (`stream-proxy.stub.ts:16-64`) |
| #219 | anchor (durable-CHAT) | **KEEP** (closes when fresh/ai doc lands) | — | beta.3 (unchanged) | F-ai map |
| #258 | FB5 generative-ui-renderer | **KEEP** (promote up, minimal scope) | FAI-5 | **stable→beta.6** | F-ai FAI-5 |
| #252 | FA3 MCP `ui://` sandbox | **KEEP** — but **NOT in live open set; reconcile state** | FAI-6 | beta.3→beta.6 | F-ai FAI-6; live gap |
| #379 | FA4 createMcpAppCallHandler | **KEEP** (+ backfill `status:`); absorbs #257 | FAI-8 | **beta.3→beta.6** | F-ai FAI-8 |
| #257 | FB4 mcp-ui-widget | **FOLD → #379** at landing (`Closes #257` on the #379 PR). Not a filing-time close. | FAI-8 | beta.4→beta.6 | F-ai map (1 FOLD) |
| #272 | FB6 interactive MCP-App bridge | **KEEP stable** (dependency-superseded by FAI-8; **NOT** a fold, retains its issue) | — | stable (unchanged) | F-ai map |
| #380 | E15 system-prompt assembly | **KEEP** (+ backfill `status:`) | FAI-12 | **beta.3→beta.7** | F-ai FAI-12 |
| #246 | E7 SkillLoaderPort | **KEEP** | FAI-13 | beta.4→beta.7 | F-ai FAI-13 |
| #290 | P2-follow --mcp/skill scaffolder | **KEEP** | FAI-14 | beta.4→beta.7 | F-ai FAI-14 |
| #269 | E10 MemoryPort | **KEEP** | FAI-15 | beta.4→beta.7 | F-ai FAI-15 |
| #270 | E11 RetrieverPort | **KEEP** | FAI-16 | beta.4→beta.7 (citation half→stable) | F-ai FAI-16 |
| #248 | E9 OTel adapter | **KEEP** (co-own Topic-B T9; add `epic:telemetry-revamp` cross-label) | FAI-17 | **beta.4→stable** | F-ai FAI-17 / OF-F1 |
| #247 | E8 orchestration | **KEEP stable** (re-sequence down; not parity-critical) | — | beta.4→stable | F-ai map |
| #262 | P5 --gateway | **KEEP stable** (re-sequence down) | — | beta.4→stable | F-ai map |
| #271 | E12 skill-authoring approval-gate | **KEEP stable** | — | stable (unchanged) | F-ai map |
| #256 | FB3 paced-reveal | **KEEP** deferred | — | beta.4→stable | F-ai map |
| #266 | usage/cost analytics | **KEEP track-only** (out of F-ai issue set) | — | Backlog | F-ai map |
| #263 | P6 doctrine (**closed**) | precedent only for FAI-4 | FAI-4 | — | F-ai map |

### Deployment children (#327)

| # | Title (short) | Disposition | Milestone | Evidence |
| - | ------------- | ----------- | --------- | -------- |
| #375 | desktop app support | **FOLD → #E2** at landing (`Closes #375` on the #E2 PR); promoted from Backlog p3 | (folded) | E-desktop §A/#E2 |
| #349 | Deploy-S13 tier-3 serverless | **KEEP WATCH sibling** — scope **NOT** merged into desktop Tier-4 (OF-4) | Backlog | E-desktop §A; LD-12 |
| #350 | Deploy-S14 Pulumi WATCH | **KEEP** | Backlog | live |
| #345–#348 | Deploy-S9…S12 | **KEEP** (deployment children) | beta.5 | live |
| #393 / #394 | compose-target / deploy-e2e | **KEEP** (foundation; deps for #E7) | beta.3 | E-desktop DAG |

### Standalone — KEEP, out of roadmap-expansion re-sequence

| # | Disposition |
| - | ----------- |
| #387 process guardrail | **KEEP**, cross-ref only (harness lane) |
| #376 plugin-workers health-check bug | **KEEP** (unrelated p2 bug) |
| #234 HTTP/2 feasibility | **KEEP** (Backlog RFC) |
| #295 Aspire dogfood proof | **KEEP** (Backlog) |
| #319 / #320 Aspire Layer A/B | **KEEP** (Backlog) |
| #314–#318 Prisma Next gaps | **KEEP** (Backlog, under #313) |
| #302 S1 positioning | **KEEP** (Backlog) |
| #303 / #305 / #306 / #307 S2/S4/S5/S6 | **KEEP** (beta.5, under #301) |
| #309 S8 release-eng | **KEEP** (stable) |

---

## Fold ledger (2 folds; both resolve downstream, no filing-time close)

| Folded | Into | Mechanism | When |
| ------ | ---- | --------- | ---- |
| #257 (FB4 mcp-ui-widget) | #379 (FA4) | `Closes #257` in the **#379 resolving PR body** | at FAI-8 landing (beta.6) |
| #375 (desktop app support) | #E2 (desktop generator) | `Closes #375` in the **#E2 resolving PR body** | at #E2 landing (beta.8) |

## Close-list (manual "superseded by #X" closes at filing) — **EMPTY**

No issue is closed during Phase-2 filing. This is the reversible-by-design outcome: the only two
folds both carry their close in a **downstream PR closing keyword**, so at filing time there is
nothing to close and nothing to reverse. If the owner later wants either issue closed immediately as
"superseded by #X" instead of at PR-merge, that is a one-line reversible `gh issue close` — but the
default and recommended path is to let the resolving PR do it.

## NEW issues summary (detail in `filing-manifest.md`)

- **NEW epics:** `epic:telemetry-revamp` (umbrella + T1–T9), `epic:dev-dashboard` (umbrella +
  DDX-0…19 = 23), and — **if OF-2 Opt-2** — `epic:docs-cut` (umbrella + S0 + C1–C6 + D1–D9 + V-C/V-D
  = 18).
- **NEW desktop sub-issues:** #E1–#E8 (under #327).
- **NEW F-ai sub-issues (issue-centric accounting):** FAI-4 (doctrine backstop, beta.5), FAI-10
  (reasoning, beta.7), FAI-11 (BYOK, beta.7). Slice→issue cardinality for FAI-0–3/FAI-6/FAI-7/FAI-9
  is a secondary reconcile (see brief).
