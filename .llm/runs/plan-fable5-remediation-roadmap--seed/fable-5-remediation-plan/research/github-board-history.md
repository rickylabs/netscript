# GitHub board history — the 0.0.5 release train (rickylabs/netscript)

Audit date **2026-08-08**. All GitHub reads are live via `gh api` / `gh issue|pr list` against
`rickylabs/netscript`; local git reads are `git tag`/`git log` in
`/home/codex/repos/netscript-fable5-remediation-plan`. Orchestration artifacts are read from the
**open draft PR #1337** branch `orchestrator/0.0.5-continuation` and from the legacy orchestrator
branch `orchestrator/0.0.5` (`b31c3c200b3f2a3362ec3dbded1b5f1c032555e3`) — those files are **not on
`main`**, so anyone re-deriving this must fetch the branches.

Read-only run: no issue, PR, label, milestone, or comment was mutated.

---

## 1. Milestone 0.0.5 — live state

| Fact | Value | Source |
| --- | --- | --- |
| Milestone number | 23 | `GET /repos/rickylabs/netscript/milestones` |
| Title / description | `0.0.5` — "Agent-surface release. Capability discovery and tooling that make the framework legible to autonomous agents — building on 0.0.4 stability." | milestone 23 |
| Created | 2026-08-03T12:04:25Z | milestone 23 |
| State | **open** | milestone 23 |
| Open rows | 22 = 21 issues + 1 PR (#1337) | `gh issue list --milestone 0.0.5 --state open` (21); `gh pr list --search milestone:0.0.5` |
| Closed rows | 160 = 77 issues + 83 PRs | milestone 23 `closed_issues`; verified 84 PRs total / 79 merged / 4 closed-unmerged (#1195, #1269, #1270, #1305) |
| Stable release | **not cut** — latest GitHub release is prerelease `v0.0.5-canary.16` (2026-08-07T17:16:52Z); last stable is `v0.0.4` (2026-08-03T19:01:55Z) | `gh release list` |

**Fact:** 0.0.5 is a milestone that has consumed 16 canaries over five days and has not shipped
stable. It is the largest milestone in repo history by closed rows (0.0.4 = 63 closed, 0.0.3 = 38,
0.0.2 = 53).

### 1.1 The 21 open 0.0.5 issues (what is still unshipped)

Grouped by the continuation plan's wave assignment (§4.2). Labels abbreviated.

| Issue | Pri | Area | Title (abridged) | Plan slice |
| --- | --- | --- | --- | --- |
| #1338 | p0 | agentic | make DeepSeek V4 Flash 0731 max the formal IMPL-EVAL default | observational T1 closure (PR #1339 merged 2026-08-06) |
| #1325 | p1 | plugins/aspire | **triggers**: generated background runtime omits Redis adapter, crash-loops on default Aspire cache | W2-A |
| #1329 | p0 | plugins/docs/telemetry | **streams**: documented SSE consumer shape ≠ wire protocol; no standard event/OTEL envelope | W2-B |
| #1202 | p1 | cli/database | users service Prisma binds a stale Postgres endpoint — DB health fails on clean `scaffold.runtime` | W2-C |
| #1327 | p1 | cli/database | `db migrate` reports success headless without creating the migration | W2-C |
| #1326 | p0 | plugins | **streams**: `DurableStreamProducer` permanently drops writes after initial connection failure; no reconnect | W3-A |
| #1102 | p1 | docs/tooling | make MCP capability discovery an intent-aware primary agent workflow | W3-B |
| #1197 | p1 | tooling/agentic | agent-init harness had **zero adoption** on 0.0.4 — 0 MCP calls, 0 plugin doctor, 0 aspire otel, 0 skills across a 452-call agent run | W3-B |
| #1119 | p2 | agentic | "canary" means two unrelated things — rename the AI-rollout pair | W3-C |
| #1333 | p0 | cli/fresh/fresh-ui | **scaffold/frontend**: default app must be an idiomatic eis-chat-grade reference; derive name from project | W4-A |
| #1208 | p0 | docs | no tutorial demonstrates the page builder; every tutorial underleverages NetScript | W4-B |
| #1108 | p1 | docs/tooling | verify generated package references against live export maps | W4-C |
| #1137 | p1 | service | [openapi-mcp S11] contract summary/tags enrichment | W5-A |
| #1138 | p2 | docs | [openapi-mcp S12] agent-facing OpenAPI→MCP reference | W5-A |
| #1332 | p1 | docs/database/contracts | show generated DB schemas as normative predecessor to API contracts | W5-B |
| #1334 | p1 | docs | complete the capability story on the homepage beyond "end-to-end typesafety" | W5-B |
| #1004 | p1 | tooling | canary lane has no same-semver republish path — a 503 forces a wasted canary.N | evidence hand-close |
| #1090 | p1 | cli/agentic | verify(wave-five): does the shipped agent surface actually change agent behaviour? | observational hand-close |
| #1166 | p1 | tooling | canary payload misses work landing behind a release PR via a merge commit | evidence hand-close |
| #1126 | p1 | tooling/service | Epic: OpenAPI→MCP service introspection | umbrella hand-close |
| #1169 | p1 | tooling | epic: guarantee a one-pass publish (0.0.4 took three canaries + six reruns) | umbrella hand-close |

**Fact:** every remaining p0 in 0.0.5 is a *product-surface* defect (#1326, #1329 streams; #1333
scaffold frontend; #1208 tutorials) — the tooling/release/agentic p0s (#1312, #1324, #1328, #1345)
all closed on canary.15/.16. The unshipped tail is exactly the "does the framework feel right to a
user/agent" tail.

---

## 2. Canary cadence — 0.0.5-canary.1 … .16

Payload derived from the `canary:0.0.5-canary.N` labels the release workflow applies to merged PRs
and closed issues (labels enumerated from `/labels`), cross-checked against local tag dates.

| Canary | Tag commit (UTC) | GH release published | Payload issues (label-derived) | Notes |
| --- | --- | --- | --- | --- |
| .1 | 08-03 22:32 | 08-03 22:34 | #1105 #1127 #1128 #1129 #1134 #1168 #1170 #1171 #1172 #1173 #1174 | wave-1 boundary; 10 PRs, `populated` derivation (legacy `cut-trace.md`) |
| .2 | 08-04 08:38 | 08-04 **08:45** | #1106 #1130 #1131 #1184 #1187 #1191 #1207 | out-of-order publish vs .3/.4 |
| .3 | 08-04 08:41 | 08-04 08:42 | #1187 (also .2) | overlapping/wasted cut |
| .4 | 08-04 08:47 | 08-04 08:49 | **none** | wasted canary — no issue or PR carries the label |
| .5 | 08-04 10:07 | 08-04 10:08 | #1109 #1132 | |
| .6 | 08-04 11:50 | 08-04 11:52 | #1133 (+PRs #1206 #1211 #1216 #1217) | pair went **red** on `runtime.aspire-restore` → filed #1227 |
| .7 | 08-04 12:51 | 08-04 12:53 | #1223 (+PRs #1218 #1221 #1222 #1224) | |
| .8 | 08-04 17:43 | 08-04 17:45 | #1104 #1135 #1136 #1235 #1236 #1240 #1247 #1250 #1253 #1254 #1267 | largest payload |
| .9 | 08-04 21:03 | 08-04 21:06 | #1225 #1228 #1229 #1230 #1231 #1234 #1248 #1251 #1252 | plugin/runtime batch |
| .10 | 08-04 23:11 | 08-04 23:16 | #1110 #1116 #1158 #1188 #1196 #1219 #1227 #1287 #1288 #1290 #1294 | |
| .11 | 08-05 05:04 | 08-05 21:16 | #1227 #1274 #1310 | **partial publish: 25 of 31 packages** — JSR weekly attempt cap hit → #1312 |
| .12 | 08-05 21:42 | 08-05 21:44 | (PRs #1313 #1321) | recovery cut, no issue closures |
| .13 | 08-05 22:04 | 08-05 22:07 | (PRs #1322 #1323) | recovery cut, no issue closures |
| .14 | 08-06 21:37 | 08-06 21:39 | #1115 #1117 #1189 #1295 (+#1331) | last aggregated-train cut (PR #1340); initial pinned E2E failed on a transient JSR 502 → tag-bound same-semver recovery run `31128595811`, child `31128614286`, **no canary.15 burned** |
| .15 | 08-07 16:15 | 08-07 16:18 | #1024 #1148 #1312 #1324 #1328 #1330 | W1 cluster; published 35/35 but pinned production E2E run `31196896495` **failed** → #1345 |
| .16 | 08-07 17:14 | 08-07 17:16 | #1345 | repair cut from PR #1346; 35 packages verified `complete`; pinned child `31201560939` **success**; `release/canary-pair` green |

**Facts about cost:** the plan budgeted **three** cuts (.14/.15/.16) and spent exactly three. The
first eleven cuts (08-03 → 08-05) are the expensive part: canary.3/.4/.12/.13 carry no issue payload
at all — four of sixteen cuts were pure release-machinery churn. Post-canary.13 evidence recorded
**1,076 / 4,000 JSR publish attempts used** with 35 publishable packages
(`research.md`, orchestrator branch); canary.11's partial publish (25/31) is the incident that
produced #1312's fail-before-mint preflight, landed in PR #1341 on canary.15.

**Hypothesis (well-supported, not documented as such):** the canary.2/.3/.4 cluster inside 11
minutes on 08-04, with .4 carrying no payload, is the concrete instance of open issue #1004
("a 503 mid-publish forces a wasted canary.N"). #1004 is still open.

---

## 3. Remediation-topic issues — what exactly landed, and where

### 3.1 Sagas (the #1064/#1065 → #1184 → #1190 → #1223 chain)

| Issue | State | Milestone | Canary | What landed |
| --- | --- | --- | --- | --- |
| #1065 `sagaCompensate` effects silently dropped — `createDurableSagaRuntime` wires no compensator | CLOSED 2026-08-03 | **0.0.4** | 0.0.4-canary.1 | pre-0.0.5 |
| #1184 generated runtime glue registers no KV adapter — saga runner crashes on default scaffold | CLOSED 2026-08-04T08:35 | 0.0.5 | canary.2 | PR #1193 `fix(sagas): register KV adapter in generated runtime glue`. Filed mid-run by the owner from a wave-4 DeepSeek run against **published 0.0.4** (legacy `cut-trace.md` R2); scheduled as W2-F into the canary.2 train. Its closure bar became the **seven-point saga verification protocol** — the standard for all saga work in 0.0.5. |
| #1190 `POST /publish` still hangs indefinitely outside the Redis path; "single-point primitives do not compose" | CLOSED 2026-08-04T12:49 | 0.0.5 | **no canary label** | Fix shipped as PR #1198 `fix(sagas): deliver published messages to the runner` (merged 08-04T06:33, `canary:0.0.5-canary.2`), but that PR carries only `Refs #1190` — closure was **hand-close on evidence**, 56 s after PR #1224 merged. Timeline confirms `closed` with no commit id. |
| #1223 Redis-persisted saga state reaches projection with unrevived dates — `saga_instances` never projected | CLOSED 2026-08-04T12:48 | 0.0.5 | canary.7 | PR #1224 `fix(sagas): revive persisted dates for projections`. Filed by the orchestrator *from the #1190 protocol run* — i.e. verifying one saga fix found the next. |
| #1225 stream mirror only reconciles at service start | CLOSED 2026-08-04 | 0.0.5 | canary.9 | PR #1284 `feat(sagas): mirror every durable transition` |

**Fact:** the sagas thread in 0.0.5 is four sequential defects, each discovered by verifying the
previous one, none of which was caught by the existing gates. **No saga issue remains open in
0.0.5.**

### 3.2 Streams — the largest open remediation surface

- #1235 `createNetScriptStreamDB` erases collection types to `unknown` — CLOSED, canary.8, PR #1238.
- #1326 (p0) `DurableStreamProducer` permanently drops writes after an initial connection failure —
  **OPEN**, plan slice W3-A, route Sol medium.
- #1329 (p0) documented SSE consumer shape differs from the wire protocol; no standard event/OTEL
  envelope — **OPEN**, plan slice W2-B, route Sol medium, and W3-A is declared *dependent* on
  W2-B's envelope (plan §Wave schedule).
- Plan records accepted debt: `plugin-streams-core` carries **AP-13 console-warning debt** plus
  streams-connector convergence debt; the plan explicitly requires #1326 to *replace* the misleading
  warning behavior, not deepen it (`plan.md` archetype table).

### 3.3 Triggers / workers / cron

- #1229 one-shot defer scheduler (DeferAction rejected to DLQ as unsupported) — CLOSED, canary.9,
  PR #1283.
- #1228 `createJobTools` trace/span/progress helpers were no-op stubs — CLOSED, canary.9, PR #1281.
- #1234 `generate plugins` cannot emit a job registry for a custom job — CLOSED, canary.9, PR #1239.
- #1104 cron retry/backoff contract honored — CLOSED, canary.8, PR #1226.
- #1325 (p1) triggers generated background runtime omits the Redis adapter and crash-loops on the
  default Aspire cache — **OPEN**, W2-A. Note this is structurally the *same defect class* as the
  already-fixed saga #1184 (generated glue omits an adapter), one plugin over.

### 3.4 Scaffold / CLI / database

Closed on 0.0.5: #1191 (SQLite `--allow-ffi`), #1254 + #1290 (`@database/zod` barrel, twice —
the first fix broke the generated contract), #1287 (`QueryClientPort` vs `QueryClient` — a fresh
workspace failed its own `deno task check`), #1251 (Aspire graph omitted SQLite / modelled deno-kv
as an unresolved parameter), #1196 + #1310 (ephemeral `db` AppHosts; second Postgres corrupting
PGDATA), #1236 (`plugin remove` non-atomic), #1247 (agent init hard-coded VS Code), #1264 (Windows
npm materialization), #1294 (no gate walked the Quickstart end to end), #1328 + #1024 (canary.15:
generated quality gates now own executable source; consumer `.llm/tools` bundle).

Still open: #1202 (stale Postgres endpoint in the users service), #1327 (`db migrate` false
success headless), #1333 (default app is not an idiomatic reference).

**Fact:** #1335 `Epic: Scaffold conformance — generated surfaces match current docs, exports and
idiomatic usage` (p1, umbrella) exists and sits in **Backlog / Triage**, unmilestoned. PR #1342
explicitly declares "#1335/W1-C whole-scaffold inventory" out of scope. This is the natural parent
for a scaffold-remediation milestone.

### 3.5 Auth / SDK

Thin. #1106 auth session-lifecycle docs — CLOSED, canary.2, PR #1200. #1252 fresh/SDK cache-tier
divergence (`queryOptions` bypasses `CacheQuery`, `IslandQueryOptions` rejects
`initialDataUpdatedAt`) — CLOSED, canary.9, PR #1265. #1243 (`auth session list --stream-url`
pins a dead `localhost:4437` after #1211 randomized ports) — **OPEN, moved to 0.0.6**. No auth code
work landed in 0.0.5.

### 3.6 MCP / agentic

Epic #1126 (OpenAPI→MCP) ran S1–S12 as issues #1127–#1138: S1–S3 proofs and S8 on canary.1, S4/S5 on
canary.2, S6 on canary.5, S7 on canary.6, S9/S10 on canary.8, S11/S12 (#1137/#1138) **still open**,
S13 (#1139, F2-gated) and S14 (#1140) **moved to 0.0.6**. #1117 (scaffolded OpenAPI surface as MCP
tools) closed on canary.14 via PR #1317. #1218/#1253 export-corpus work closed on canary.7/.8.

The adoption question is unresolved: **#1197** records that the agent-init harness had *zero*
adoption on 0.0.4 (0 MCP calls, 0 plugin doctor, 0 aspire otel, 0 skills across 452 agent calls),
and **#1090** ("does the shipped agent surface actually change agent behaviour?") is still open as an
observational row. #1324/#1330 (OpenCode ignored generated MCP config; resume forwarded empty
assistant turns) closed on canary.15 via PR #1344 — that PR's evidence is the first recorded
non-zero NetScript MCP use in a measured session (`ses_023871aaeffehRNSqFc3I43Fvc`).

### 3.7 The #1340–#1346 PR train (post-canary.14)

| PR | Merged | Closes | Canary | Content |
| --- | --- | --- | --- | --- |
| #1340 | 08-06 21:34 | #1295 #1189 #1117 #1115 | .14 | umbrella that squash-merged train branch `canary/0.0.5-canary.14` (PRs #1315–#1318) to `main`; carries an inline ```acceptance-evidence``` block; declared "the final use of the temporary aggregated train" |
| #1341 | 08-07 06:53 | #1312 #1148 | .15 | fail-before-mint JSR budget preflight; partial-publication classified distinctly from pinned-E2E failure; version-residue scan widened to generated `.ts`. PLAN-EVAL waived by owner; IMPL-EVAL mandatory |
| #1342 | 08-07 12:54 | #1024 #1328 (Refs #1343) | .15 | generated `.netscript` quality runner covering owned `.ts`/`.tsx`/`.mts`; fixes generator defects rather than excluding source; installed-consumer observation deferred to #1343 |
| #1344 | 08-07 14:37 | #1324 #1330 | .15 | OpenCode MCP attachment + fail-closed preflight + provider-valid resume normalization; PLAN-EVAL Minimax M3 PASS, IMPL-EVAL DeepSeek V4 Flash max PASS |
| #1346 | 08-07 17:12 | #1345 (Refs #1343) | .16 | repairs the two scaffold assumptions that failed canary.15's pinned production E2E (formatted Flow-B rewrite; quickstart's premature whole-project check) |
| #1343 | — | open, **0.0.6** | — | deferred installed-consumer scaffold smoke against a post-fix canary |

(#1339 merged 08-06 20:46 into the train, closing nothing; #1338 retained open as an observational
row.)

---

## 4. How the milestone-orchestrator grouped PRs into waves

Two complete, *different* orchestration plans ran against milestone 0.0.5. Both are on branches, not
`main`.

### 4.1 Plan v2 — legacy run (`orchestrator/0.0.5`, `b31c3c200`)

`/.llm/runs/release-0.0.5--orchestration/plan.md` @ `b31c3c200`, "Wave plan v2 — 0.0.5 (stage B)",
2026-08-03. Revised against a PLAN-EVAL **FAIL** (v1 at `79a28e612`).

- **Disposition table first:** every one of the 44 open issues placed in exactly one class —
  PR-closable (33), PR+evidence hand-close (3: #1166, #1168, #1004), observational hand-close (2:
  #1149, #1090), epic/tracking with *no closing keywords* (3: #1126, #1169, #1117), gated-out (1:
  #1139), moved to 0.0.6 (2: #1140, #1175). Totals are asserted and check-summed (`= 44 ✓`).
- **Seven waves, 31 PRs covering 36 issues.** Each row is `PR-id | issues | scope | lane | proving
  gates`. Lanes are `Sol · low|medium|high` (Codex GPT-5.6) plus one serialized `agy` docs lane per
  wave.
- **Four canary points at wave boundaries 1, 3, 5, 7** — owner-decided "6 if strictly needed
  otherwise 3-4"; "a red canary blocks only the cut, never the next dispatch".
- **Canary = content unit, wave = dispatch unit.** Membership derived from actual merge history, not
  from the plan; version strings come from `release-canary.yml` output, "never typed".
- **Re-planning is logged, not re-numbered.** `cut-trace.md` records R1 (three PRs landed externally
  before wave-1 dispatch → remainder re-clustered), R2 (#1184 filed mid-run → scheduled W2-F into the
  *canary.2 train*, "one canary train, not a train of its own"), R3 (#1189 filed → W6-A on the
  canary.4 train, sequenced after #1093 because they share plugin-core surface). Ten more mid-run
  additions (#1187, #1188, #1219, #1223, #1227, #1234–#1236, #1246–#1254) are each dispositioned in
  the same table with a route and a lane, taking the plan from 44 to 51 rows.
- An explicit **owner onboarding-verification wave** (added 2026-08-04 evening) added 8 rows sourced
  from a real Windows/Zed onboarding against canary.7 plus an independent Codex verification pass;
  route directive `Sol · medium`; three lanes W6-Q/W6-R/W6-S.
- Refuted findings are recorded as *do-not-schedule*: "withForm hydrated-POST value loss —
  independently refuted (form modules byte-identical 0.0.4→canary.2); never schedule."

Reality diverged: 16 canaries were cut, not 4.

### 4.2 Plan v3 — continuation run (PR #1337, `orchestrator/0.0.5-continuation`, open draft)

Baseline `origin/main` `2508eb8c9` on 2026-08-06. Legacy checkout `8399126ef` was declared "evidence,
not an implementation base" (ahead 155 / behind 72). Separate **Minimax M3 high** PLAN-EVAL session
`567e3125-…` returned PASS (comment on #1337, 2026-08-06T15:10Z).

Shape:

- Scope cut **38 open issues → 30**; eight rows moved to a newly created 0.0.6 with per-issue written
  reasons (#1085, #1093, #1112, #1139, #1201, #1210, #1260, #1293).
- **18 supervisor-owned PR clusters**, one supervisor per cluster, **max 3 active supervisors per
  wave**, dependencies only across waves: `T1-A/T1-B`, `T2-A/T2-B`, `W1-A/B/C`, `W2-A/B/C`,
  `W3-A/B/C`, `W4-A/B/C`, `W5-A/B`, plus stage `F` for evidence closures.
- Each slice row carries: issues, *what it proves*, expected paths, decisive gates, and a route
  (`Sol low` default; `Sol medium` only for #1329 and #1326 and #1333; #1333 additionally takes a
  GLM 5.2 xhigh design review).
- **Exactly three canary boundaries** — C14 after W1, C15 after W3, C16 after W5 — with a six-step
  cut ritual (freeze membership from first-parent history → pre-merge/close/review-thread/docs gates
  + one-pass `scaffold.runtime` → merge umbrella → dispatch OIDC workflow, never publish locally →
  verify every package at the exact version + pinned `e2e-cli-prod` + `release/canary-pair` →
  record in `cut-trace.md`).
- A per-cluster **archetype/doctrine/JSR table** naming existing accepted debt that a slice may cite
  but not widen, and a **risk register** and **open-decision sweep** classifying each unresolved
  decision as must-resolve-now vs safe-to-defer with a named owner.
- **Evidence rows never get closing keywords.** #1004/#1090/#1126/#1166/#1169 are hand-close only;
  the risk register lists "observational rows are auto-closed by code" with mitigation "no closing
  keywords; GraphQL closing-reference audit before every merge".

**The mid-flight pivot (this is the most transferable lesson).** Drift entry **C-D25** (2026-08-06):
"The temporary aggregate canary/orchestrator-branch PR mechanism outlived the JSR publish-cap
workaround. Owner retired it after C14. Every post-cut meaningful connected cluster targets `main`
directly and owns independent CI/review; the orchestrator branch retains coordination history only."
The plan carries a superseding section (`## Post-C14 owner correction`) that explicitly overrides its
own earlier train-target, W1-before-C14, always-PLAN-EVAL and Qwen-default statements. Post-C14 the
model is: **one tightly-connected cluster = one small draft PR directly against `main`**, PLAN-EVAL
conditional (only for genuinely complex/decision-heavy work), IMPL-EVAL always mandatory
(`deepseek/deepseek-v4-flash-0731` max default per #1338/#1339, C-D20/C-D23).

`drift.md` on that branch is 27 entries, most about *agent-runtime* failures rather than product
work — duplicate thread writers (C-D11, C-D13, C-D14, C-D17, C-D27), evaluator sessions launched
twice and failed closed (C-D10, C-D15), launcher wrappers rewriting `deno.lock` (C-D16, C-D21),
OpenRouter budget exhaustion mid-verdict (C-D18), and a merge-helper that could only see
OpenHands-authored verdicts (C-D24, merged with `--no-eval-gate`). That is the real cost centre of
this milestone.

### 4.3 Delivery status of plan v3 as of 2026-08-08

| Stage | Status |
| --- | --- |
| T1 (#1295→#1315, #1189→#1316) | done, canary.14 |
| T2 (#1117→#1317, #1115→#1318) | done, canary.14 |
| **Cut C14** | done 08-06, green pair after tag-bound same-semver recovery |
| W1-A/B/C (#1312+#1148, #1024+#1328, #1324+#1330) | done as direct-to-main PRs #1341/#1342/#1344, canary.15 |
| **Cut C15** | published but pinned production E2E **failed** → repaired by #1346 |
| **Cut C16** | done 08-07, green pair, 35/35 verified |
| **W2, W3, W4, W5** | **not started** — 15 issues, including four p0s |
| Stage F evidence closures | not started (#1004/#1090/#1126/#1166/#1169 open) |

**Fact:** the continuation plan is ~40 % delivered. Everything remaining is W2–W5 plus stage F, and
those clusters are already specified with paths, gates and routes in `plan.md` — a remediation plan
that re-derives them from scratch will duplicate existing work; a remediation plan that *inherits*
them should cite the slice ids (W2-A … W5-B) so the mapping is auditable.

---

## 5. House pattern for milestone shifts

Milestones are **renamed in place, never recreated**, highest-to-lowest, and only then is the freed
title created as a new milestone. Verified twice.

### 5.1 The 2026-08-06 rollover (fully documented)

From `research.md` on `orchestrator/0.0.5-continuation` — the pre-mutation inventory was read live,
the rename order was locked, execution ran 14:41:13Z→14:41:54Z, and a post-mutation verification
table proves nothing else moved:

| Milestone # | Before | After | Open before→after | Closed |
| --- | --- | --- | --- | --- |
| 21 | 0.0.12 | 0.0.13 | 44→44 | 0→0 |
| 20 | 0.0.11 | 0.0.12 | 11→11 | 0→0 |
| 19 | 0.0.10 | 0.0.11 | 10→10 | 0→0 |
| 18 | 0.0.9 | 0.0.10 | 2→2 | 0→0 |
| 17 | 0.0.8 | 0.0.9 | 15→15 | 0→0 |
| 16 | 0.0.7 | 0.0.8 | 50→50 | 4→4 |
| 24 | 0.0.6 | **0.0.7** | 34→20 | 6→6 |
| 25 | (created) | **0.0.6** | 0→14 | 0→0 |

Rules the artifact states and verifies: renames preserve **number, state, due date, description,
creation time, and every issue assignment** — only `title` and `updated_at` change; the new milestone
is created **only after** the old holder frees the title; **no closed historical assignment moves**;
**no issue traverses an intermediate milestone**; every moved issue gets a written per-issue reason;
and post-mutation counts are re-verified by REST pagination (milestone 23 = 35 open rows, milestone
25 = 22 open rows, milestone 24 = 20 open frontend rows + 6 closed historical PR assignments
#1217/#1222/#1241/#1272/#1286/#1291).

Confirmed independently from issue timelines:

- #1140: `milestoned 0.0.5` (08-03 14:04) → `demilestoned 0.0.5 / milestoned 0.0.6` (08-03 19:49) →
  `demilestoned 0.0.7 / milestoned 0.0.6` (08-06 14:41:53) — i.e. it never moved on 08-06; the
  milestone under it was renamed 0.0.6→0.0.7 and the issue was then moved into the *new* 0.0.6.
- #1320: `milestoned 0.0.6` (08-05) → `demilestoned 0.0.7 / milestoned 0.0.6` (08-06 14:41:34) —
  same signature.
- #922: `milestoned 0.0.1-beta.13` (07-19 14:21) → `Backlog / Triage` (07-19 14:39) → `0.0.6`
  (08-03 13:27), now reading as 0.0.7.

### 5.2 The earlier cascades (inferred from artifacts, consistent with timelines)

- Milestone 21's description still reads *"Cascaded from beta.18 when beta.12 became the
  stabilisation release."* — a record of a beta-line cascade written into the description.
- Issue #950 timeline: `milestoned 0.0.1-beta.13` (2026-07-31) → `demilestoned 0.0.3 / milestoned
  0.0.4` (2026-08-01). The same milestone object read as `0.0.1-beta.13` on 07-31 and as `0.0.3` on
  08-01 — i.e. the whole `0.0.1-beta.N` line was renamed to `0.0.N` around 2026-08-01. #950 today
  sits in milestone 16, titled `0.0.8`.
- Milestone 16 was therefore titled `0.0.4` on 2026-08-01 and is `0.0.8` today — **four renames in
  six days**. New milestones 22 (`0.0.4`, 08-03 05:41), 23 (`0.0.5`, 08-03 12:04) and 24 (08-03
  13:21) were inserted below it on 2026-08-03, and 25 (`0.0.6`) on 08-06.

**Hypothesis (strong, not directly documented):** the 2026-08-03 insertion of 0.0.4/0.0.5/0.0.6 used
the same rename-cascade mechanism as the 08-06 rollover; I have the creation dates and the resulting
titles but not a `research.md`-style pre/post table for that date.

**Implication for a remediation milestone:** inserting a new release slot is an established,
mechanically-specified operation with a written receipt. The precedent to copy is
`.llm/runs/release-0.0.5--orchestration/research.md` §"Milestone rollover pre/post-mutation" —
pre-inventory table, locked highest-to-lowest rename order, post-verification table, per-issue move
reasons, and REST-paginated count reconciliation.

### 5.3 Milestones ship with residual open issues

0.0.2 is stable-released (`v0.0.2`, 2026-08-01) yet still holds **5 open issues** (#175, #767, #768,
#863, #864). 0.0.3 and 0.0.4 hold 0 open. So the house pattern permits closing a release with a
non-empty milestone, but 0.0.4 shows the preferred end-state is empty.

---

## 6. Conflicts, gaps, and things a remediation plan must not get wrong

1. **The 0.0.5 orchestration record is not on `main`.** `plan.md`, `research.md`, `cut-trace.md`,
   `drift.md`, `post-c14-handoff.md`, `canary-16-recovery-receipt.md` and 30+ slice files live only
   on `orchestrator/0.0.5-continuation` (draft PR #1337, open since 2026-08-06). `.llm/runs/` on
   `main` contains `release-0.0.4--orchestration` but **not** `release-0.0.5--orchestration`. Any
   plan that assumes the 0.0.5 history is discoverable from `main` is wrong.
2. **#1337 must not acquire a closing keyword.** Its body says so explicitly; it is a coordination
   artifact for 21+ issues.
3. **Slippage is undeclared.** Nothing on the board yet says W2–W5 slip out of 0.0.5. The milestone
   is still open with 21 issues and no stable cut. Deciding "0.0.5 stable ships now, remainder moves"
   vs "0.0.5 continues" is an *open* decision, and §5 gives the exact mechanism for either.
4. **#1335 (Scaffold conformance epic) is unmilestoned in Backlog / Triage** while #1333/#1202/#1327
   sit in 0.0.5 and #1262/#1263/#1246 in 0.0.6. That epic is currently orphaned from its children.
5. **Duplicate-risk pairs** a remediation plan is likely to re-file: #1326/#1329 (streams reconnect +
   SSE envelope — already specified as W3-A/W2-B with a declared dependency), #1325 (triggers Redis
   glue — same defect class as closed #1184), #1333 (default app quality — already a p0 with a GLM
   design-review requirement), #1197/#1090 (agent-surface adoption measurement — two rows, one
   question), #1243/#1211 (dead default port), #1320/#1295 (Zod: #1295 landed the npm Zod-4
   alignment; #1320 remains **blocked** on `@ag-ui/core` hard `^3` and `kvdex`).
6. **The evaluator lane is the milestone's dominant failure mode.** 27 drift entries, of which
   ~15 are agent-runtime/evaluator/transport failures, versus a handful of product-scope drifts. A
   remediation roadmap that only counts product issues will under-budget the orchestration overhead
   that actually consumed 0.0.5.
7. **Label hygiene is real and enforced.** Every closed 0.0.5 row carries exactly one `status:`
   (terminal `status:shipped`), a `canary:0.0.5-canary.N`, and its milestone; the close-gate
   (#1188, #1303) verifies GraphQL `closingIssuesReferences` against body keywords. Draft issues
   produced by this run must carry the full namespaced taxonomy and an explicit milestone or they
   will be rejected by the same gates.
