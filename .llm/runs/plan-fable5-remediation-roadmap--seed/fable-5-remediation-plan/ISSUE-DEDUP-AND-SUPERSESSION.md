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

## 2. Proposed new issues (41 drafts + 2 RFC documents)

Full text: `milestones/<dir>/<draft-ID>-*.md` and `rfcs/`. Deps reference draft-IDs and live
issue numbers. Every draft carries `## Boundaries` naming adjacent owners.

### 0.0.6 — Verification, docs truth & RFC ratification (13 drafts)

| Draft | Title (short) | Prio | Depends on |
| --- | --- | --- | --- |
| T1-01 | rfc: SdkClientContribution tracking issue (RFC-A doc in `rfcs/`) | p1 | — |
| T3-01 | rfc: production command composition kit (RFC-B doc in `rfcs/`) | p1 | — |
| T5-01 | docs/sdk: one canonical client dialect (3 module names, 2 query APIs) | p0 | — (coord #1333/#1335) |
| T5-02 | test(docs): compile-the-docs gate replaces needle checker | p1 | T5-01 |
| T5-03 | fix(agent): emit `--docs-root` in `.mcp.json`; corpus visible | p1 | — |
| T5-04 | fix(mcp): `execute_command` version pin / local-host spawn | p1 | — |
| T5-05 | docs(reference): plugin-core pages, publish-gate path, README dialect | p2 | T5-01, T5-02 |
| T6-01 | chore(quality): `quality:scan` export-blind `any`, allowance ids, docs snippets | p1 | — (Part of #1278) |
| T6-02 | chore(ci): fresh-ui joins root check/lint; lock self-mutation | p1 | — (blocks T6-01 lock decision) |
| T6-03 | docs(doctrine): verdict refresh + `arch:check:repo` two mechanical fixes | p2 | — |

### 0.0.7 — Typed seams + generation (12 drafts)

| Draft | Title (short) | Prio | Depends on |
| --- | --- | --- | --- |
| T1-02 | feat(sdk): re-expose oRPC link seams (headers/interceptors/plugins/fetch/link) | p1 | T1-01, T1-04 |
| T1-03 | fix(sdk): `safe()` drops `TError`; docs example doesn't compile | p1 | T1-01 (file as Part of #1278 if its prose already names it — see ledger) |
| T1-04 | refactor(sdk): transport policy behind one owned function (pre-oRPC-v2) | p1 | T1-01 |
| T1-05 | feat(sdk/auth): auth contribution dogfood (`authClient`) | p1 | T1-01, T1-02, T1-04 |
| T1-06 | feat(sdk): trace-context as second, non-auth contribution | p1 | T1-01, T1-02, T1-05 |
| T2-01 | feat(cli): resource route-slice generator | p1 | T2-03 (hard), T2-02; RFC-A for contribution clause |
| T2-02 | feat(cli): contract-derived client/query/invalidation generator | p1 | T2-03; RFC-A clause |
| T2-03 | fix(cli): `resolveProjectRoot` app-root targeting + E2E/docs twins | p1 | — |
| T2-04 | fix(cli): `ui:add page` emits the advertised data-screen triad | p1 | T2-03 |
| T2-05 | chore(design): `/design` registry sync gate (50 vs 66) | p1 | — |
| T2-06 | fix(fresh): `crudExample` route alias defect (test asserts the bug) | p2 | — |
| T2-07 | fix(scaffold): wire `cachedAt`→`initialDataUpdatedAt`; consumer migration note | p2 | — (cites merged #1265) |

### 0.0.8 — Runtime truth + service slice (19 drafts)

| Draft | Title (short) | Prio | Depends on |
| --- | --- | --- | --- |
| T3-02 | fix(scaffold/service): service internal layering child (Part of #1335) | p1 | — |
| T3-03 | feat(service): command kit implementation | p1 | T3-01, T3-02 |
| T3-04 | docs: outbound webhook delivery recipe + template | p2 | T3-03 soft |
| T4-01 | fix(sagas): non-ignorable publish receipts; kill 8092 fallback | **p0** | — (seq. T4-06, T4-08) |
| T4-02 | fix(plugins): child liveness contract (workers/triggers bare; sagas partial) | p1 | T4-06, T4-08 |
| T4-03 | fix(streams): durable-storage semantics (`STREAMS_DATA_DIR`) | p1 | — (coord #1326/#1329) |
| T4-04 | fix(sagas): compensation telemetry call-sites + E2E span asserts | p1 | — |
| T4-05 | fix(plugins): WORKER_CONCURRENCY mismatch; always-throwing root exports | p2 | — |
| T4-06 | fix(plugins): pre-randomization port hardcodes in stubs + consumer stub | p2 | #979 prereq |
| T4-07 | verify(aspire): ServiceReferences injection claim (counter-evidence found) | p1 | — verify-first |
| T4-08 | test(e2e): child + streams probes; compensating/COMPENSATED status truth | p1 | T4-02, T4-06 |
| TA-01 | fix(scaffold): `/api` protected by default | **p0** | TA-02, T1-05 |
| TA-02 | fix(plugin): `createPluginService` auth seam (incl. remote authenticator port) | **p0** | — |
| TA-03a | fix(auth): signout revokes arbitrary session ids | **p0** | TA-02 |
| TA-03b | fix(auth): signin/callback discard `Set-Cookie` | **p0** | — |
| TA-03c | fix(service): default CORS `origin:'*'` vs credentialed calls | p1 | — |
| TA-04 | feat(service): typed principal + `$meta` policy metadata | p1 | — (consumed by T1-05/#934; prereq for #884) |
| TA-05 | test(e2e): authenticated + rejection auth gates | p1 | TA-01/02/03a |
| T7-01 | verify(0.0.8): Wave-7 measured adoption smoke (exit gate) | p1 | T2-01/02, T4-01, TA-01, #1197, #1090 |

## 3. Stage-E ledger — cross-pack items the packs flagged for supervisor decision

1. **Corpus corrections that must reach the master plan:** T4-07's wave-6 claim has worktree
   counter-evidence (drafted verify-first, never implementation); sagas runner *does* get a
   generated health check (workers/triggers don't) — T4-02 written against the corrected surface;
   auth arch-debt anchors exist in `.llm/harness/debt/arch-debt.md` (audit G13 first half false —
   no issue); `#1278` Inventory A is ~80% discharged and Inventory D counts 6 (not ~19) exempt
   soundness tests; `quality:scan:repo` already covers all packages (the gap is export-blind
   `any` + free-text allowances, not scope); `arch:check:repo` red = 52 A14 false positives + 1
   no-`--root` config bug — two cheap fixes, not package debt.
2. **Ownerless items needing a home (owner decision):** server-side plugin seam
   (`PluginContractRouter = object`, Hono-vs-oRPC middleware, G5/G8/G9) — recommend a 0.0.7
   companion draft or an explicit deferral; saga compensation *semantics* (no prior-step rollback,
   unpersisted compensation state, silent missing-handler on primary path) — candidate T4-09;
   dead `VALIDATE_TRACES_SCRIPT` + lost `validateOtlpExporterEndpoint()` (GAP-6) — p2 tooling row;
   harness read-first paths that don't exist (D12) — cheap fix, suggest fold into T6-03 at filing;
   MCP generation-surface tools (`list_generators`…) — defer to #1126/#1201 chain decision.
3. **Cross-pack dependency:** `ServiceQueryUtils` context/`TError` narrowing (S10) lives in T2's
   query work but bites T1-05/T1-06 at the TanStack layer — sequencing note for the handoff.
4. **Filing-time checks:** T1-03 files as `Part of #1278` if its live prose already names
   `safe`/`isDefinedError`; #451 gets an unblocked-by-T1-02 amendment; #1263 cross-references
   T1-03 (server-side twin); oRPC 1.14.15 bump folded in T1-04 acceptance (split if owner
   prefers a deps issue); TA-03a's "CLI sends a credential" box may move to #1243 as amendment.
5. **Verify-first rows carried (no drafts):** theme-island CORS, saga OOM, plugin-doctor layout
   (via #1343), `AUTH_API_SERVICE_NAME` `'auth-api'` vs `'auth'` runtime resolution (G16).
