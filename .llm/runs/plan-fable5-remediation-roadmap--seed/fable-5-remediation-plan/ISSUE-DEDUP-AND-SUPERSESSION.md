# Issue dedup & supersession — DRAFT (no GitHub mutation; owner ratification pending)

Disposition of every remediation-relevant existing issue and every proposed new issue.
Vocabulary: **KEEP** (owner unchanged) · **EXPAND** (additive amendment, text in
`EXISTING-ISSUE-AMENDMENTS.md`) · **SPLIT** (focused child added, parent kept) · **SUPERSEDE**
(folds into the named record; close only via owner-ratified supersession comment or downstream PR
keyword — never by this run) · **MOVE** (milestone change; ledger in `MILESTONE-TRAIN.md` §4) ·
**NEW** (draft in a milestone directory). Ground truth: `research/github-board-open.md`
(2026-08-08, 259 open issues). Issues not listed here are governed milestone-level by the rename
train (`MILESTONE-TRAIN.md`) and are untouched individually.

## 1. Existing issues — dispositions

### Scaffold / generation cluster

| Issue | Disposition | Rationale / dependencies |
| --- | --- | --- |
| #1333 (p0, 0.0.5) scaffold frontend + app naming | **KEEP + EXPAND** | Remains the single frontend-modernization owner; acceptance detail added per pre-plan §1 (contract-first route, cache-first SDK, `withResource`, typed params, route-local groups, no-`any` consumer gate, four-seam distinction, states, `/design`). Its #1328 "Related" row is discharged (closed). T2 generators are the tooling it composes with — deliberately separate issues so #1333 stays landable in 0.0.5. |
| #1335 (umbrella, Backlog) scaffold conformance | **KEEP + EXPAND + SPLIT** | Stays the conformance umbrella; sub-issue list refreshed (#1328 closed); gains child T3-02 (service layout) and links to T2 generator drafts as conformance consumers. Never closed by a PR. |
| #1325 (0.0.5) triggers Redis glue | **KEEP + EXPAND** | Owner unchanged; audit evidence pointer attached (`runtime.stub.ts` static repro). Its generalization requirement ("a saga fix cannot ship while the trigger sibling is broken") is reinforced by T4-08's child-probing E2E. |
| #1327 (0.0.5) `db migrate` false success | **KEEP** | Complete contract already on the issue. |
| #1332 (0.0.5) DB-schema-first docs | **KEEP** | Complete; T5-01 must not overlap (Boundaries row in draft). |
| #1343 (0.0.6) installed-consumer canary proof | **KEEP** | The proper home for plugin-doctor-layout reproduction (pre-plan item G routes through it). |
| #979 / #980 (unmilestoned) port pins | **KEEP + MOVE → 0.0.8 + EXPAND** | Prerequisites (endpoint-resolving E2E, docs port passages) are delivered by T4-08/T4-06; evidence amendment attaches the stub-port findings. |

### Streams / durable runtime

| Issue | Disposition | Rationale |
| --- | --- | --- |
| #1326 (p0, 0.0.5) producer reconnect | **KEEP + EXPAND** | Owner unchanged (0.0.5 close-out); amendment attaches audit citations (`create-durable-stream.ts` line-level) and R2/R3 reproductions. Receipt-typing for `upsert`/`delete` (currently `void`) is *included* in its acceptance re-read — flagged in the amendment, not a new issue. |
| #1329 (p0, 0.0.5) SSE envelope | **KEEP + EXPAND** | Owner unchanged; #1326 planned as its pair (already cross-declared). |
| T4-03 storage semantics | **NEW** | Explicitly the uncovered remainder both issues' scopes exclude (persistence mode/`STREAMS_DATA_DIR`/restart proof) — pre-plan item F confirmed uncovered by the board sweep. |

### Docs / MCP / measurement chain

| Issue | Disposition | Rationale |
| --- | --- | --- |
| #1208 (p0, 0.0.5) tutorials ph.1 | **KEEP + EXPAND** | Amendment records the phase-2 filing obligation (promised as a checklist comment, not yet an issue — top dedup trap). |
| #1210 (0.0.6) per-API deep dives | **KEEP + EXPAND** | Gains the cross-capability golden-recipe list (pre-plan §3). |
| #1260 / #1201 / #1102 (0.0.5–0.0.6) MCP corpus/retrieval | **KEEP** | Chain untouched; T5-03/T5-04 are plumbing-only with Boundaries rows. |
| #1197 / #1090 measurement pair | **KEEP + EXPAND** | Wave-6 measured evidence attached; Wave-7 smoke *consumes* them (see `WAVE7-AND-AGENT-ADOPTION.md` §5). |
| #1275 (Backlog) migration chapter | **SUPERSEDE → #1279** | Duplicate umbrella pair; #1279 is the record. |
| #1279 (0.0.6) migration chapter | **KEEP + MOVE → 0.0.15** | Post-remediation adoption surface. |
| #1277 (Backlog) docs-site polish | **KEEP** | Not remediation-critical; untouched. |

### Type soundness

| Issue | Disposition | Rationale |
| --- | --- | --- |
| #1278 (0.0.6, umbrella) | **KEEP as epic-of-record + EXPAND** | Gains #1276's measured numbers (56 casts / 8 ignores / 7 allowances) + T1–T6 tranche structure; T6-01 lands inventory-C as its trackable child. |
| #1276 (Backlog, umbrella) | **SUPERSEDE → #1278** | Same 2026-08-04 directive, same evidence; two prose-only umbrellas is the board's clearest duplicate. |
| #1245 (Backlog) island query types | **KEEP + rescope (EXPAND)** | ~75% landed by merged #1265; remnant = `@throws` mismatch + regression tests + consumer migration note. Re-implementing is the risk. |
| #1249 (Backlog) `controlProps`/Zod 4 | **KEEP** | Both defects execution-confirmed current; contract complete. |

### Plugin architecture / auth

| Issue | Disposition | Rationale |
| --- | --- | --- |
| #922 + #923–#946 (0.0.7→**0.0.9** by rename) | **KEEP + EXPAND** | Train moves wholesale by rename; internal wave order intact; amendment maps stale beta.13/15/17 body labels to the renamed cuts and re-raises the #427/#432 re-baseline. #928's contract freeze reviews against ratified RFC-A. |
| #1093 (0.0.6) discovery hardcoding | **KEEP** | Already the right shape; RFC-A cites it as an alignment constraint. |
| #871 + #872–#887 (incl. #884/#885) | **KEEP** | Enterprise scope untouched at 0.0.14 (renamed from 0.0.12). TA drafts carry explicit Boundaries: defects/defaults only, no org contracts, no vendor adapters. |
| #934 gateway / #942 auth frontend | **KEEP** | TA-02/TA-04 align to them via Boundaries; no overlap. |
| #1243 (auth CLI port default) | **KEEP** | Named owner for the hardcoded 4437; TA drafts cite, don't absorb. |

### Aspire / infra / release

| Issue | Disposition | Rationale |
| --- | --- | --- |
| #1280 (0.0.6, blocked) backing health | **KEEP (blocked)** | Do not re-litigate; T4-02 is the *plugin child* liveness contract the issue explicitly does not cover. |
| #1320 (0.0.6, blocked) single Zod | **KEEP (blocked)** | Upstream-constrained. |
| #1004 / #1126 / #1163 / #1166 / #1169 (0.0.5 release machinery) | **KEEP** | 0.0.5 close-out scope; #1126's stale checkboxes get a hygiene amendment (9 children already closed). |
| #301 (Backlog, road-to-stable umbrella) | **KEEP + EXPAND** | Hygiene amendment: 5 unchecked children already closed. |
| #863 / #864 / #175 / #767 / #768 (0.0.2 stragglers) | **MOVE → owner retriage** | Explicit retriage (default Backlog); #175 additionally needs labels (zero today). Never silently closed. |

### Epic-overlap normalization (amendments only — no membership changes)

#823 ⊂ #327 (children #451/#453–#455): #327 becomes umbrella-of-record, #823 narrows to the
Nitro-output RFC. #892 ↔ #327/#830: mutual boundary notes. #400 ↔ #922: schedule the #427/#432
re-baseline at 0.0.9 entry. Orphaned single-member epic labels (`epic:desktop-frontend`,
`epic:docs-cut`, `epic:telemetry-revamp`) recorded for the labels.yml parity amendment.

## 2. Proposed new issues

Filled from the Stage-D pack manifests — one row per draft with milestone, priority, and
dependency edges. See §3 note until populated.

<!-- NEW-ISSUE TABLE: populated at Stage-D landing -->

## 3. Status

Existing-issue dispositions complete (this section is stable). New-issue rows land with the
Stage-D design packs in the same commit series; the master dependency DAG lives in
`MASTER-PLAN.md`.
