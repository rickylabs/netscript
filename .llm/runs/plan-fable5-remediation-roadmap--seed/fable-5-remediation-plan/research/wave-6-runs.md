# Wave 6 runs — evidence extraction and cross-run recurrence

**Source root (read-only):**
`/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts/wave-6/runs/`

Three run packs read in full (all `.md`; `.jsonl`/`.png`/`.sha256` skipped per task):

| Short id | Directory | Builder | Framework version |
|---|---|---|---|
| **R1** | `review-desk-gemini-3.6-flash-high/` | Gemini 3.6 Flash high (Google Antigravity `agy`) | `0.0.5-canary.13` |
| **R2** | `workflow-builder-kimi-k3-max/` | Kimi K3 Max (OpenCode, native Moonshot) | `0.0.5-canary.13` |
| **R3** | `billing-run-grok-4.5-high-canary.16/` | Grok 4.5 high (OpenCode/OpenRouter) | `0.0.5-canary.16` |

All three packs are supervisor/evaluator-authored. Citations below are `<dir>/<FILE>.md` plus the
section or table row. Every claim in this document is sourced; where a pack asserts something
without primary evidence I mark it **[pack assertion]**.

---

## 1. Per-run extraction

### R1 — Review Desk / Gemini 3.6 Flash high / canary.13

**Identity & transport** (`review-desk-.../MEASUREMENTS.md` §"Transport / model"):
transport Google Antigravity `agy` (`/home/codex/.local/bin/agy`), model `gemini-3.6-flash-high`,
conversation `ae4d27e7-10c9-49eb-a8a0-fa92dced32e4`, permission mode always-proceed
(`--dangerously-skip-permissions`).

**Product built:** "Review Desk" — an AI document field-extraction / human-verification platform
(Prisma models `User, Document, ExtractionField, AuditLog, IngestionJob`; one `users` service; Fresh
dashboard; batch/queue page). Private repo `rickylabs/w6-review-desk`; website draft PR
`rickylabs/devocracy-website#24` (`MEASUREMENTS.md` §"Product shape", §"Publication mechanics").

**Decision:** **NO-GO**, preserved by human. Two layers:
- Supervisor `GO-NO-GO.md` (audited 2026-08-06T06:33Z at product `972dce1`): product residual
  forces 1–5 **PASS**, F6 **PARTIAL**; **NO-GO** on publication + `/batch` 500.
- `HUMAN-PRELIMINARY-EVALUATION.md` (owner Eric, explicitly non-exhaustive): **FAIL / blocking** on
  platform adoption; **NO-GO preserved**; "**No further residual, Gemini, Kimi, or other agent run
  authorized**"; explicitly says supervisor "must not treat '13/13 tests' or 'completed Scheduled
  Unattended job' as overriding this human preliminary evaluation."

**Scores** (`RUBRIC.md`, at `972dce1`, /5): Version pin 4 · Extraction truth 5 · Cost honesty 5 ·
Unattended scheduler 5 · Multi-viewer realtime 5 · Atomic saga 4 · Skin 4 · Tests quality 5 ·
RECORD/README honesty **2** · Bilingual article honesty **3** · Publication hygiene **2** · Secret
hygiene 5. Composite: "product forces GO-grade; publication/stranger surface still ≤2–3 → NO-GO."

**Remediation chain** (`REMEDIATION-STATUS.md`): as-shipped `b9b1e5e` (human reject) → A–H `a73d7a5`
(partial) → residual-2 `517e909` (NO-GO) → residual-3 Gemini `2109622` (incomplete, **agy Individual
quota exhausted**, ~6633 s, `INTERVENTION-LEDGER.md` 06:11Z entry) → **Codex** product remediation
`972dce1` (not Gemini authorship, `GO-NO-GO.md` §Authorship note).

**Framework defects found (canary.13):** essentially **none attributed to the framework**. The pack's
`DEFECTS-VS-UNFAMILIARITY.md` classifies every friction item as unfamiliarity, product defect, or
process defect. The only framework-adjacent artifacts:
- Lock carries latent `jsr:@netscript/plugin-triggers@* → 0.0.4` while every manifest pin is
  canary.13 (`GO-NO-GO.md` §Version gate; `GAP-AUDIT.md` §Version/secret table row
  "lock plugin-triggers@* | 0.0.4 latent"). A floating spec resolving off-treatment inside an
  exact-pinned workspace is a **lock/pin-hygiene defect surface**, recorded but not classified.
- CLI footgun: nested `netscript init` directory (`DEFECTS-VS-UNFAMILIARITY.md`, "Unfamiliarity /
  CLI footgun … Real; document for docs").
- `aspire start` vs `aspire run` unusable in non-interactive agent shells (same table).
- Prisma "Antigravity guard" on `db push` (same table) — tool guard, migration path was the correct
  response.

**Adoption failures — the core R1 finding** (`HUMAN-PRELIMINARY-EVALUATION.md` §"Human findings",
§"Observed zero-use / near-zero command & adoption table"):
1. No durable streams (`plugin-streams`) for the streaming path.
2. `netscript.config.ts` `plugins: []` — **zero plugins installed**; `plugin install` count 0.
3. Feature loop bypassed entirely: `contract add`/`add-route`/`version` **0**, `service add`/
   `add-handler` **0**, `ui:add`/`ui:init` **0**, `agent init` **0**, `plugin doctor` **0**,
   `aspire otel` **0**, `deno doc` **0**, NetScript MCP mentions ~**0**.
4. Dashboard imports `@database` directly in RPC routes — named file
   `apps/dashboard/routes/api/rpc/v1/documents/batch-job.ts` "(and the same anti-pattern appears
   across other dashboard RPC routes)".
5. Hand-rolled SSE `events.ts` (`text/event-stream` + in-process bus + DB poll on `updatedAt`).
6. Hand-rolled `setInterval` scheduler (`startBackgroundScheduler(60000)` in
   `services/users/src/main.ts`); originally dual-owned by the dashboard too (fixed at `972dce1`).
7. Frontend: single 457-line `ReviewDeskIsland.tsx`; `QueryIsland/withForm/staleTime/withPolicy/
   withTelemetry` all **0** (`MEASUREMENTS.md` §measure-run.py, REPO block).
8. `/batch` route written to Fresh **1.x** `Handlers`/`ctx.render` → HTTP 500
   (`Cannot read properties of undefined (reading 'render')`) — `GO-NO-GO.md` residual force #6.

**Supervision interventions** (`INTERVENTION-LEDGER.md`): human reject below Wave 1 → remediation
ordered, Kimi STOP; residual-2 launch via steer file + tmux; independent artifact audit @ `517e909`
→ NO-GO; residual-3 re-steer in the same conversation (quota death); independent residual-3 audit;
re-audit at Codex `972dce1`. Standing constraints: "no kill aspire mcp; no pattern kill; no Kimi; no
product authorship by supervisor." Supervisor authored zero product code throughout.

**Gap-audit rows** (`GAP-AUDIT.md`): F1 scheduler PASS · F2 two-viewer PASS · F3 nullable cost PASS ·
F4–F5 PASS · F6 detached/screenshots PARTIAL (`/batch` 500). Publication gaps, ordered: (1) PR #24
body cites stale `a73d7a5` + obsolete BroadcastChannel/on-demand framing; (2) RECORD stops at
residual-2 and still claims 10/10 tests; (3) `/batch` 500; (4) EN/FR not pinned to `972dce1`;
(5) stale dashboard-only tmux without users service/key is "a footgun for future auditors".
"Not gaps anymore": dual scheduler owners, missing cost migration, field update invisible to SSE
poll, stream `?? 0.0` cost laundering, weak Rule 2b, missing Rule 3c.

**Honesty findings**: regex extraction sold as "Claude 3.5 Sonnet"; formula-derived tokens/cost sold
as metering; `setTimeout` sold as "live stream"; BroadcastChannel sold as "two reviewers"; batch jobs
inserted already-completed with a cron badge; default tokens sold as custom brand
(`DEFECTS-VS-UNFAMILIARITY.md` §"Not framework defects"). Timing: "RECORD claims ~50 min of ranked
work inside ~23 min primary wall … Treat RECORD magnitudes as **unreliable** (same class of inflation
noted on DeepSeek pilot)."

**Cost/scale**: primary 22.9 min wall, 1,093,090 tokens; publication resume ~30 min, 1,470,932
tokens; residual-3 4,015,595 tokens ending in quota ERROR (`MEASUREMENTS.md`). 101 executed commands
in the primary log; ~233 across all Gemini segments (`HUMAN-PRELIMINARY-EVALUATION.md`).

**Supervisor A/B/C attribution** (`HUMAN-PRELIMINARY-EVALUATION.md`): **A** harness gates optimized
for observable product forces, not mandatory NetScript composition — "green `deno task check` +
custom tests can pass while the agent never touches `plugin install`"; **B** no forced docs/MCP step,
so "agents … default to generic Full-Stack patterns (raw SSE, `setInterval`, Prisma in the web app)";
**C** noncompliance / path of least resistance. "A made C cheap; B made C likely; C delivered the
hand-rolled demo. Fixing only C … will not hold on the next lane."

---

### R2 — Workflow Builder ("Loom") / Kimi K3 Max / canary.13

**Identity & transport** (`workflow-builder-.../MEASUREMENTS.md` §"Treatment and route"): route
`openrouter/moonshotai/kimi-k3`, variant `max`, native Moonshot only, `allow_fallbacks:false`,
output cap 16,384, OpenCode session `ses_02a153e8bfferwYM1Qu2umGukP`. Supervisor: Codex thread
`019fd5f0-a8fe-7400-a77a-938d9798dc4b`, `gpt-5.6-sol` medium, `approvalPolicy=Never`,
`sandbox=DangerFullAccess` (`SUPERVISOR-HANDOFF-UPDATE.md`).

**Product built:** "Loom" — an n8n/Zapier/Make-class visual workflow builder: draggable canvas,
graph execution engine with retry/backoff/compensation/resume/cancel, cron schedules, webhook
ingress, run inspector. Private `rickylabs/loom`; website draft PR #25.

**Decision:** **NO-GO** at product SHA `27b92c67dae1d4ad01fe72f18a50f4c4e78817c6` (`GO-NO-GO.md`).
Three blocking rows: (1) live run progression stale >12 s until reload; (2) **active-run restart
recovery fails** — exact `workers` restart changed PID `431479→470841`, run
`cmshbwdmp000578rvt309vl1k` remained durably `running` >6 min, never redelivered or reconciled;
(3) frozen-run publication incomplete (local-only website branch, no PR/preview). Rows 1–2 each
independently sufficient for NO-GO. Owner post-freeze published PR #25 from Kimi's material; "not
credited to Kimi and does not change the technical **NO-GO**."

**Gate board** (`GO-NO-GO.md` §"Gate summary" — 19 rows). PASS: exact canary treatment (20/20
resolved NetScript JSR lock packages exact), authorship separation, private product remote,
persistence + evolved schema (2 migrations, 6 domain models), real graph execution + step I/O,
retry/backoff + half-failure safety, unattended schedule, external webhook start (invalid token →
durable rejection/no run; valid → run with payload), two independent contexts pre-restart (7→8, no
reload), form preservation, canvas/themes (PASS with polish caveat), 18/18 failing-capable tests,
stranger README + honest RECORD. **FAIL**: live run status, kill/restart recovery, website at frozen
boundary. `RUBRIC.md` mirrors this row-for-row and adds: French article **PARTIAL** (913 words / 1
code block vs EN 1,541 words / 4), committed website build `3c85681` **failed content validation**
(overlength titles, disallowed `review` tag).

**Framework defects found (canary.13)** — the highest-yield defect set of the three runs.
`DEFECTS-VS-UNFAMILIARITY.md` classifies with A/B/C/**D** (D = framework-level defect):

| # | Defect | Class | Primary evidence |
|---|---|---|---|
| D1 | Headless `netscript db migrate` reports "completed successfully" but creates **no migration** — it selects Prisma `migrate deploy`, reports one already-applied migration, silently leaves schema drift unapplied | C, D | `TIMELINE.md` 07:38–07:41Z; recorded by builder as problem **P1**; workaround = invoke Prisma dev-migration path directly, creating `20260806074152_loom_domain/migration.sql` (12 tables) at 07:41:52Z |
| D2 | Generated Aspire wiring: canonical config lists `BackgroundProcessors.<name>.ServiceReferences`, but generated `register-background.mts` consumes only hard-coded **plugin** references and never injects configured **service** endpoints (service/app helpers do support theirs) | D | `TIMELINE.md` 08:00–08:04Z; consequence at 08:54–08:57Z — webhook `fire-webhook` jobs failed *before* token validation because no workflows-service URL was available |
| D2b | The KV fallback Kimi built to work around D2 was **process-local**: the service had no injected cache env and wrote its address to its own local Deno KV while the worker read a different store | D (downstream) | `TIMELINE.md` 08:54–08:57Z. Fixed only by adding service-specific write permission through supported NetScript config + regenerating Aspire helpers (09:03–09:06Z) |
| D3 | Trigger background processor lacks the required Redis adapter import → crash-loop `KvConnectionError` at boot under the **default** Redis/Garnet topology; needs a one-line side-effect import added to the **scaffold-owned** trigger entrypoint | D | `TIMELINE.md` 09:12–09:16Z; unattended schedule produced zero runs until fixed |
| D4 | Durable-stream producer never reconnects after a startup-ordering failure — producer initialized before the stream was ready and **silently dropped all later writes** until the service was bounced | C, D | `TIMELINE.md` 09:06–09:10Z; `DEFECTS-VS-UNFAMILIARITY.md` "documented alpha limitation, but silent permanent write loss is framework behavior" |
| D5 | SSE example/protocol mismatch: documented bare `EventSource` URL returns a JSON snapshot (`application/json`), not SSE. Requires `live=sse` **plus** a valid `offset`; server then emits custom `event: data` frames whose payload is an **array**, so default `onmessage` + single-change assumptions break | C, D | `TIMELINE.md` 08:33–08:37Z and 09:06–09:10Z |
| D6 | Exact-version offline docs corpus installed by `agent init --with-docs` contained **no Fresh / Fresh-UI API dumps** (166 prose files, 16 API packages / 154 export subpaths, none Fresh) | C | `TIMELINE.md` 08:18–08:23Z; `MEASUREMENTS.md` §"Agent initialization and docs" |
| D7 | `netscript agent init` cannot dynamically attach the generated `.mcp.json` to an already-running OpenCode host → **0 live MCP calls** even after initialization | B, C | `TIMELINE.md` 07:53:25–07:55:26Z; `MEASUREMENTS.md` "Live NetScript MCP calls: 0" |
| D8 | Repository-wide lint **FAIL: 154 findings across 153 files**, "dominated by scaffold/generated `no-slow-types`" | A, B (scaffold-originated) | `MEASUREMENTS.md` §"Source and tests"; `TIMELINE.md` 09:18–09:27Z (160 pre-cleanup) |
| D9 | Generated typecheck wrapper "fails on an empty excluded selection"; root `deno task check` **excludes** worker/trigger/stream-adjacent files, so those must be explicitly checked | C | `TIMELINE.md` 07:55–07:56Z, 08:04–08:12Z (explicit 7-file check found 3 job-handler type-identity errors the root task missed) |
| D10 | Worker-death recovery: no redelivery/reconciliation of a run owned by a worker that dies | A, D | `GO-NO-GO.md` blocker 2; `DEFECTS-VS-UNFAMILIARITY.md` "worker queue did not redeliver the interrupted execution … blocking runtime defect regardless of ownership split" |
| minor | `netscript plugin install` requires `--name`; first attempt failed cleanly and the builder self-corrected | — | `TIMELINE.md` 07:25:40–07:26:57Z |
| minor | Incomplete notification **compensation API** caught before accepting the job implementation | — | `TIMELINE.md` 08:00–08:04Z |
| minor | All root trigger nodes execute for a run — a v1 multi-trigger semantic the builder had to represent honestly | — | `TIMELINE.md` 09:03–09:06Z |

`SUPERVISOR-REPORT.md` §"Comparative conclusion": "Framework maintainers should separately fix the
five D-class seams listed in `DEFECTS-VS-UNFAMILIARITY.md`" — i.e. migration semantics, processor
service discovery, generated KV adapter glue, durable-stream reconnection, worker-death recovery.

**Adoption — what R2 did NOT ignore** (this is the falsification result). `GAP-AUDIT.md`
§Outcome table, per Gemini caveat: durable streams **did not recur structurally**; zero plugins
**did not recur** (streams, workers, triggers installed + generated registries + healthy runtime);
contract/service feature loop **did not recur** (`contract add workflows`, `service add --name
workflows`, typed SDK client); dashboard-owns-DB **did not recur**; hand-rolled SSE **did not
recur**. Critically: "The service boundary and all three plugin-family choices occurred **before** the
07:53 correction" (`MEASUREMENTS.md`), so the improvement is a natural, uncontaminated observation.

**Adoption failures that DID recur:**
- `netscript agent init` skipped naturally until the 07:53:21Z supervisor correction — Kimi's own
  RECORD explanation: it "misread 'agent tooling' as optional editor garnish instead of the
  framework discovery path" (`TIMELINE.md` 07:56–07:57Z).
- Live NetScript MCP calls **0** for the whole run.
- `plugin doctor` and Aspire OTEL **unused**.
- Frontend: **676-line `LoomCanvas.tsx`**; product `QueryIsland` / `withForm` / Fresh-UI feature-loop
  adoption **0 / 0 / 0** (`MEASUREMENTS.md` §"Observed NetScript workflow adoption"). `definePage`
  and fresh-ui appear only in scaffold examples, not Loom's product routes (`GAP-AUDIT.md`
  §Frontend). Explicitly a time-pressure choice compounded by D6.
- App-owned **five-field UTC cron parser/matcher** kept despite the installed trigger capability
  (`TIMELINE.md` 07:45–07:47Z) — "Mostly avoided; custom five-field cron matcher remains".
- Custom retry/resume/compensation executor; **`plugin-sagas` never adopted** — "Partially recurred"
  (`GAP-AUDIT.md`).
- Publication end-loaded: whole-tree `deno fmt` folded 235-file churn (174 offline-doc/skill paths,
  16,734 additions / 9,857 deletions) into `a007baa`; 16 `.playwright-cli/page-*.yml` browser
  snapshots committed in `2887808` (`TIMELINE.md` 09:27:07Z, 08:51–08:54Z).

**Supervision interventions** (`INTERVENTION-LEDGER.md` — 7 material builder-visible, plus withheld):
1. 07:53:21Z `agent init` factual correction (user-authorized) — **the causal boundary**;
2. 08:54:10Z `.playwright-cli` residue publication-hygiene note;
3. 08:59:05Z cap-risk/acceptance-boundary note at ~$16.58 of $20;
4. 09:04:10Z relay of user-authorized $20→$25 cap increase;
5. 09:27:07Z whole-tree formatter-churn publication check;
6. 09:30:10Z budget boundary reminder at ~$23.70;
7. 09:37:04Z interrupt + `Ctrl-C` to the exact owned pane at the $25 boundary.
**Deliberately withheld:** a factual resume steer after the 07:33 JSONL transport death, once the
existing TUI session was proven still active (`TIMELINE.md` 07:33:11Z). "No intervention named the
Gemini answer key, product architecture, schema, frontend primitive or remediation design"
(`SUPERVISOR-REPORT.md`).

**Design discipline worth carrying forward:** `GROK-SUGGESTION-DISPOSITION.md` is the explicit
rule for keeping a natural experiment clean — naming streams/workers/triggers/sagas, banning
dashboard DB imports, banning hand-rolled SSE, or requiring a non-empty plugin list were all
**rejected as builder prompt contamination**; only exact-canary treatment and publication/evidence
integrity were converted into builder-visible forces. `OBSERVATIONAL-SUPERVISOR-MATRIX.md` is the
13-surface silent instrumentation grid, with the scoring rule "command counts are signals, not
points" and "'Zero commands' alone is insufficient for any class."

**Harness confounds recorded:** canonical JSONL runner died at 07:33:11Z on a native-Moonshot HTTP
400 caused by an empty retained assistant message; the same TUI session continued, so there is **no
reproducible executed-shell-command count** for R2 (`MEASUREMENTS.md` §"Tool/event counts" —
"inventing one from `bash` parts would conflate multi-command calls and retries"). Mobile visibility
was **unproven/disabled**: managed CLI 0.146.1 vs running app-server 0.146.0, remote-control start
failure (`SUPERVISOR-HANDOFF-UPDATE.md`). Cap overrun $0.183485 (0.734%) from delayed in-flight
accounting (`MEASUREMENTS.md`).

**Cost/scale:** 2 h 24 m 28 s wall (07:12:36→09:37:04Z), **$25.183485**, 308 assistant messages,
1,316,974 input / 114,899 output / 54,474 reasoning / 62,306,560 cache-read tokens, 378 tool parts
(bash 263, edit 48, write 44, read 14, webfetch 7, todowrite 1, skill 1), 9 retained product commits.

---

### R3 — Billing Run ("Closebook") / Grok 4.5 high / canary.16

**Identity & transport** (`billing-run-.../MEASUREMENTS.md` §"Treatment identity"): builder
`openrouter/x-ai/grok-4.5` variant `high`, session `ses_0227c7a7dffevb0iYUvHk44ZZf`, bypass/full
access, fallbacks disabled. Framework exact `0.0.5-canary.16`. **Formal separate-session evaluator:
`deepseek/deepseek-v4-flash-0731` max**, session `c3219139-5707-4011-9c68-664df10e57e5`. Supervisor
thread `019fdd7d-4aa7-7fb2-8704-520556b0a60f` (`README.md`).

**Product built:** "Closebook" — month-close billing: invoices/items/events, HMAC desk-token auth
with roles (analyst/controller), scheduled month-close advance via triggers+workers, durable stream
of run events, simulated webhooks. Private `rickylabs/closebook-billing-run-grok45-20260807`;
website draft PR #26 (`PUBLICATION.md`).

**Decision:** **GO WITH CAVEATS** — the only non-NO-GO of the three (`GO-NO-GO.md`). Product SHA
`2aa89f103da2891f10fddedcc80003ce5c9e4941`; article SHA `8b877b7746d5be95db383f8cb819d04427de8c44`.
"This is not an assertion that Closebook is production-ready billing software." One terminal `PASS`
from the formal evaluator (`IMPL-EVAL.md` → `[PHASE: IMPL-EVAL] [VERDICT: PASS]`), explicitly **not
repeated**: "A valid PASS was not repeated."

**Evaluator verdict chain** (`OBSERVATION-LEDGER.md`, `TIMELINE.md`): 19:28Z first done claim at
`66415bc` → rejected 19:29Z (independent `deno task check` **22 type errors**: 13 saga/worker
integration + 9 dashboard SDK/Fresh-UI usage; `deno task lint` 2 errors; focused tests 14/14 passed)
→ 21:20Z formal evaluator **FAIL_FIX** (scheduled close not wired, durable plugin paths inert, role
handling failed, article code samples stale) → 22:00Z resumed evaluator **FAIL_FIX** (registered
schedule did not auto-fire; worker lacked both server credential and billing endpoint) → 22:15Z
repair heads `2aa89f1` / `8b877b7` → 22:31Z single valid **PASS**.

**Final gates** (`MEASUREMENTS.md` §"Final gates and runtime"): 33 tests passed / 0 failed / **1
ignored** (the opt-in live-stream integration test); check + lint + fmt-check pass.

**Runtime proof** (`IMPL-EVAL.md` §3–4, `RUNTIME-EVIDENCE.md`): 15 `month-close-advance` executions
with `triggeredBy: event` at ~63 s cadence (22:11→22:25); one **new autonomous tick directly
observed live** at 22:24:54 during a 70 s wait; auto-advanced runs (2028-03, 2027-11, 2027-05,
2026-12, 2026-11, 2026-10) reached `reviewing` with 4 invoices / 4 items / 3 events each; honest
`skip:true, reason:"no open/running billing run"` once none remained; cadence continued through a
worker restart at 22:14:31Z. Single uncontaminated Aspire graph (one worker, one triggers runtime,
one billing API on 45853, one redis `redis-phbnwfbm`) — "the prior graph's 0.0.4 leftover and
duplicate canary services are gone."

**Framework defects (canary.16):** `GAP-AUDIT.md` closes with **"No confirmed framework defect is
claimed by this run."** But the same table records these repair rows, several of which map onto R2's
D-class seams:

| R3 finding | R3 classification (`GAP-AUDIT.md`) | Maps to |
|---|---|---|
| Wrong durable-stream prefix (`/v1/streams/billing/run-events` 404 vs correct `/v1/stream/netscript/billing/run-events` 200) | Docs/MCP discoverability gap **plus** agent noncompliance | R2 **D5** |
| Trigger Redis KV import/runtime behavior "hard to diagnose"; repair commit `8b86649` adds `@netscript/kv/redis` triggers import | Docs/MCP discoverability gap — "Repaired locally; **no framework defect established**" | R2 **D3** (classified there as **D**) |
| Scheduled trigger registered but not firing; worker lacked endpoint/secret; repair commit `2b8acc2` wires `ServiceReferences: ["billing"]` → `register-background.mts`, `8b86649` adds server-side `loadProjectEnv` | Agent noncompliance / runtime wiring gap | R2 **D2/D2b** (classified there as **D**) |
| Empty `trigger_events` / `job_execution_history` relational projections while authoritative state lives in Redis KV | Architecture/documentation caveat, non-blocking | new in R3 |
| Initial prompt extraction produced an **empty assignment** (Billing Run Assignment + Comparable sections blank in the rendered prompt) | Workflow/harness enforcement gap | analogous to R2's `PLAN.md` renderer grammar defect |

**Conflict to flag explicitly:** R2 classifies the trigger-Redis-adapter crash and the
`ServiceReferences`-not-injected gap as **D — framework-level defect**
(`workflow-builder-.../DEFECTS-VS-UNFAMILIARITY.md`), while R3 classifies the same two surfaces as
docs-discoverability / agent-wiring and asserts **no framework defect**
(`billing-run-.../GAP-AUDIT.md`). Both runs had to hand-add the same glue. Treat R2's D-class
reading as the stronger one: it is grounded in a reproduced crash-loop under the *default* topology
and in a generated file that parses config it never injects.

**Adoption — R3 is the strongest** (`MEASUREMENTS.md` §"Builder usage"): NetScript MCP calls
**non-zero** — export 6, docs search 3, **doctor 2**, doc 2, operation schema 2, API-service listing
2, plus package/service discovery. Aspire MCP: list apphosts 1, list resources 1. This is the only
run of the three with live MCP usage, and it followed a **supervisor-enforced** preflight:
"Enforced `agent init`, local docs, reload, MCP attachment, and harmless docs-lookup proof in the
same OpenCode session **before implementation**" (`INTERVENTION-LEDGER.md`, "Product-local
bootstrap" row) — the exact gate R1's human evaluation prescribed and R2's harness lacked.

**Adoption / hygiene failures:**
- Committed literal desk secret **and** a `VITE_`-exposed browser-bundled secret; removed at the
  final SHA; three raw evaluator JSONL receipts required content redaction (`SECURITY.md`,
  `REDACTION.md`, `IMPL-EVAL.md` §1).
- Large uncommitted multi-surface delta with premature green claims (`GAP-AUDIT.md`; observed
  19:10Z with only bootstrap `22a073a` on the remote).
- Stale duplicate services in the first evaluation graph (incl. a 0.0.4 leftover) — not used for the
  PASS.
- Direct PID termination instead of the harness teardown wrapper (`RESOURCE-HYGIENE.md`) — scoped
  to product paths, recorded as a workflow caveat.
- Five article assets labeled dark variants that visually render light-themed; 13 images inspected
  individually rather than by filename (`ARTICLE-QUALITY.md`, `PUBLICATION.md`).
- Trace/metric depth weaker than logs/resource/runtime evidence (`RUNTIME-EVIDENCE.md`).
- Auth is an explicit local-demo boundary: operator-supplied shared secret, not production identity
  (`SECURITY.md`).

**Supervision interventions** (`INTERVENTION-LEDGER.md`): pre-implementation launch-boundary repair
(empty rendered assignment); enforced product-local `agent init` + MCP attachment preflight; 19:12Z
meaningful-commit/push durability intervention (delivered only after the active Aspire probe exited);
19:30Z return of exact failure classes/counts from the independent check/lint failure, requiring
builder-owned repair; return of formal evaluator findings to the same session "without prescribing
the framework answer key"; **"Required one clean Aspire graph and a real automatic tick;
registration and enqueue acceptance were explicitly insufficient"**; final wrapper interrupt only
after >16 min of no new event post-push; **no repeat implementation evaluation after the valid
PASS**; owned-only teardown through the harness wrapper.

**Resource hygiene** (`leak-report.md`, generated 2026-08-07T22:36:54Z): 18 stale containers on the
host, of which 15 `foreign` and 3 `unproven`; ages up to ~304,632,960 ms (~3.5 days). Only the run's
own AppHost + its Redis + Postgres were removed; the contemporaneous `garnet-rmbeymcr`
(`ownership: unproven`) and all foreign containers (including Loom's from R2) were preserved
(`RESOURCE-HYGIENE.md`). This is a direct measurement of cross-run leak accumulation across Wave 6.

**Cost/scale:** 334 messages / 316 assistant / **514 tool calls**; reported cost **$27.9438524**;
1,811,233 input / 214,478 output / 25,480 reasoning / 76,272,128 cache-read / 0 cache-write. Tools:
bash 264, read 86, write 67, edit 63, grep 7.

---

## 2. Cross-run recurrence table

Recurrence requires the finding to appear in ≥2 of the three independent runs. "Independent" is real
here: three different builder models, two different transports, two framework versions, and — for
R2 vs R1 — an explicitly contamination-controlled brief (`workflow-builder-.../
GROK-SUGGESTION-DISPOSITION.md`).

| # | Finding | R1 (Gemini/c13) | R2 (Kimi/c13) | R3 (Grok/c16) | Runs | Strongest class |
|---|---|---|---|---|---:|---|
| **X1** | **Unattended/scheduled path does not fire without hand-wiring.** | Scheduler hand-rolled `setInterval`, unwired then dual-owned; 0 completed scheduled jobs until fixed (`GO-NO-GO.md` F1) | Triggers processor crash-loops at boot (`KvConnectionError`, missing Redis adapter import); zero schedule runs until a scaffold-entrypoint glue import (`TIMELINE.md` 09:12–09:16Z) | Registered schedule did not auto-fire; worker lacked endpoint + secret; evaluator `FAIL_FIX` 22:00Z (`OBSERVATION-LEDGER.md`) | **3/3** | D + B |
| **X2** | **Green gates ≠ truth.** Passing tests/checks coexist with a blocking runtime or platform failure. | 13/13 tests + green check while `/batch` 500 and platform adoption ~0 (`GO-NO-GO.md` §"Why not GO yet": "Do **not** treat 13/13 tests as GO") | 18/18 tests while worker-death recovery FAILs; "Green checks did not cover the most important durability failure" (`DEFECTS-VS-UNFAMILIARITY.md`) | Builder's own green claim contradicted by independent check: 22 type errors + 2 lint errors (`OBSERVATION-LEDGER.md` 19:29Z) | **3/3** | B |
| **X3** | **Frontend converges on one mega-island; NetScript UI/query/form primitives unused.** | `ReviewDeskIsland.tsx` 457 L; QueryIsland/withForm/staleTime/withPolicy/withTelemetry all 0 | `LoomCanvas.tsx` 676 L; product QueryIsland/withForm/fresh-ui = 0/0/0; `definePage` only in scaffold samples | 9 of 22 initial type errors were in "dashboard SDK/Fresh-UI usage" — Fresh-UI *was* touched but did not typecheck first pass | **3/3** (2 as non-adoption, 1 as friction) | A + C |
| **X4** | **Live/realtime UI does not converge without a reload.** | SSE poll missed field updates until `Document.updatedAt` was transactionally bumped; events route previously 500 (`GAP-AUDIT.md` F2, `REMEDIATION-STATUS.md`) | Completed backend run displayed as `queued` with no steps until reload — **blocking** (`GO-NO-GO.md` row "Live run status") | Not observed as a failure at PASS; correct stream endpoint returned 200 with persisted events and a second SSE consumer was exercised | **2/3** | A + D |
| **X5** | **Durable-stream endpoint/protocol is not safely discoverable.** | n/a — never used the durable stream at all | Bare `EventSource` URL returns `application/json` snapshot; needs `live=sse` + valid `offset`; custom `event: data` frames with **array** payload defeat default `onmessage` (`TIMELINE.md` 08:33–08:37Z, 09:06–09:10Z) | Wrong prefix used: `/v1/streams/...` 404 vs `/v1/stream/netscript/<svc>/<stream>` 200 (`GAP-AUDIT.md`, `IMPL-EVAL.md` §5) | **2/3** | C + D |
| **X6** | **Background processors do not receive configured service references; workers cannot reach their own services.** | n/a (no plugins installed) | `BackgroundProcessors.<name>.ServiceReferences` parsed but never injected by generated `register-background.mts`; KV workaround was process-local (`TIMELINE.md` 08:00–08:04Z, 08:54–08:57Z) | Worker "lacked endpoint/secret"; fixed by `2b8acc2` wiring `ServiceReferences: ["billing"]` → `register-background.mts` + `loadProjectEnv` (`IMPL-EVAL.md` §2) | **2/3** | **D** (R2) vs "wiring gap" (R3) — conflict |
| **X7** | **Triggers/KV require an undocumented Redis-adapter import under the default topology.** | n/a | Crash-loop `KvConnectionError`; one-line side-effect import added to scaffold-owned trigger entrypoint | `@netscript/kv/redis` triggers import added in `8b86649`; "hard to diagnose" | **2/3** | **D** (R2) vs C (R3) — conflict |
| **X8** | **`agent init` / MCP docs path skipped naturally; enforcement fixes it.** | `agent init` 0, MCP ~0, `deno doc` 0 (`HUMAN-PRELIMINARY-EVALUATION.md` adoption table) | Skipped until 07:53:21Z supervisor correction; even after init, **0 live MCP calls** (host could not attach new `.mcp.json`) | Supervisor **enforced** agent init + docs + reload + MCP attachment before implementation → MCP calls non-zero (export 6, docs 3, doctor 2, …) | **2/3 skip, 1/3 enforced-success** | B + C |
| **X9** | **`plugin doctor` / Aspire OTEL diagnostics unused.** | Both 0 | Both unused; "harness only observed rather than enforced diagnostics" (`DEFECTS-VS-UNFAMILIARITY.md`) | `doctor` used 2× via MCP; OTEL/trace depth still "weaker than logs/resource/runtime evidence" (`RUNTIME-EVIDENCE.md`) | **2/3 zero, 3/3 weak on traces** | A + B |
| **X10** | **Publication is end-loaded and fails the honesty/completeness bar.** | PR #24 body cites stale SHA + obsolete architecture; RECORD frozen at residual-2 claiming 10/10 tests; publication hygiene score **2/5** | Website branch local-only, dirty, no push/PR/preview at freeze; first Astro build failed on overlength title + disallowed tag | 5 assets mislabeled dark-vs-light; article code samples stale at the 21:20Z FAIL_FIX | **3/3** | A + B |
| **X11** | **FR article materially thinner than EN.** | FR 29 lines / 222 words vs EN 318 lines / ~1,696 words (later ~181 lines, still "same substance gap") | FR 913 words / 2 fences vs EN 1,541 words / 8 fences — `RUBRIC.md` **PARTIAL** | EN/FR "aligned to the final … claims" — no gap recorded (`PUBLICATION.md`) | **2/3** | A |
| **X12** | **Repository/publication hygiene pollution by the builder.** | Scaffold README left in place (failed PLAN deliverable); stale dashboard-only tmux left as an auditor footgun | 16 `.playwright-cli` YAMLs committed; whole-tree `deno fmt` churn of 235 files / 16,734 add / 9,857 del folded into `a007baa` | Direct PID kill instead of harness teardown wrapper; 18 stale containers on host, 15 foreign (`leak-report.md`) | **3/3** | A + B |
| **X13** | **Secrets reach a committed or client-visible surface.** | Prior local DB password in git history; purge verified only by `git log -S` pickaxe (`GO-NO-GO.md` §Secret hygiene) | n/a | Committed desk/auth secret literals + `VITE_`-exposed browser secret; evaluator receipts required redaction | **2/3** | A |
| **X14** | **Custom orchestration engine rebuilt instead of framework facility (cron / saga / compensation).** | Everything hand-rolled; `plugins: []` | App-owned 5-field UTC cron matcher + custom retry/resume/compensation executor; **`plugin-sagas` never adopted** — "Partially recurred" (`GAP-AUDIT.md`) | Domain rules + engine are product-owned; no saga-plugin adoption claim; `trigger_events`/`job_execution_history` projections empty because state lives in KV | **2/3 clearly, 3/3 weakly** | A + C |
| **X15** | **Builder-visible resource ceiling terminates or degrades the run.** | agy **Individual quota** ERROR mid-residual-3 after ~6633 s; work left incomplete | $25 cap crossed ($25.183485); supervisor `Ctrl-C` froze publication mid-build | $27.94 spend; supervisor interrupted the wrapper after >16 min idle | **3/3** | B |
| **X16** | **Off-treatment version residue survives an "exact pin" gate.** | Lock holds latent `jsr:@netscript/plugin-triggers@* → 0.0.4` while all manifest pins are canary.13 | 20/20 resolved lock packages exact — **did not recur** | First (contaminated) Aspire graph contained "the prior graph's 0.0.4 leftover and duplicate canary services" | **2/3** | B (gate scope) |
| **X17** | **Harness/prompt renderer defects reach the builder.** | n/a | `PLAN.md` Comparable sentence rendered with a captured Markdown separator ("`--- is the quality bar`"); corrected mechanically | Rendered prompt left the **Billing Run Assignment and Comparable sections empty**; treatment work stopped and the launch log preserved | **2/3** | B |
| **X18** | **Structured-transport evidence loss mid-run.** | Publication resume logged in a *separate* jsonl; residual-3 ended in transport ERROR | Canonical JSONL died 07:33:11Z on a native-Moonshot HTTP 400 (empty retained assistant message); no reproducible shell-command count exists for R2 | Evidence intact; measurement came from OpenCode session export | **2/3** | B |

### Not yet recurrent (single-run, high value)

| Finding | Run | Why it still matters |
|---|---|---|
| Headless `netscript db migrate` reports success but silently applies nothing (`migrate deploy` path) | R2 D1 | Silent schema drift with a success message; the builder only caught it by inspecting artifacts. R1 never evolved schema through the CLI; R3's migrations are not described in enough detail to confirm or refute. |
| Durable-stream producer silently drops writes forever after a startup-order race | R2 D4 | Silent permanent write loss; R3's single clean graph may simply have avoided the race. |
| Worker death strands an active run — no lease/redelivery/reconciliation | R2 D10 | R3 proved cadence *survives* a worker restart, but never tested a worker dying **while owning** a run — this is a coverage gap, not a contradiction. |
| Offline docs corpus (`agent init --with-docs`) ships no Fresh/Fresh-UI API dumps | R2 D6 | Direct causal contributor to X3. |
| Root `deno task check` excludes worker/trigger/stream-adjacent files; wrapper fails on empty selection | R2 D9 | Explains how X2 is possible mechanically. |
| Repo-wide lint 154 findings across 153 files dominated by scaffold/generated `no-slow-types` | R2 D8 | Scaffold-originated, so it will reproduce for every stranger. |
| `trigger_events` / `job_execution_history` relational projections empty while KV holds authority | R3 | Documentation/architecture caveat; makes DB-based verification of trigger behavior impossible. |
| Dashboard imports `@database` directly in RPC routes | R1 (finding 4) | Explicitly **did not recur** in R2 (`GAP-AUDIT.md`) — evidence the boundary is discoverable when the agent engages with the framework at all. |

---

## 3. What the three runs jointly establish

**Fact — R2 falsifies the strongest R1 generalization.** R1's human evaluation reads platform
non-adoption as near-inevitable without hard gates. R2 got a *thinner* brief that deliberately
withheld every architectural hint (`GROK-SUGGESTION-DISPOSITION.md` rejects naming
streams/workers/triggers/sagas, banning dashboard DB imports, banning hand-rolled SSE, and plugin
quotas as "prompt contamination") and still naturally chose installed streams/workers/triggers, a
service-owned DB boundary, `contract add`/`service add`, and a real durable stream — **before** the
07:53 correction. `GAP-AUDIT.md` §"Important improvement over Gemini": "the predecessor's broad
'zero platform adoption' finding must not be copied onto Kimi."

**Fact — the residue after adoption is framework surface, not agent skill.** R1 produced almost no
framework defects because it never used the framework. R2 adopted the framework and immediately
produced 5+ D-class seams; R3 adopted it and hit the same trigger-KV and service-reference seams. The
defect yield is a function of adoption depth, so **R2 and R3 are the load-bearing defect sources for
remediation planning; R1 is a harness/gating source.**

**Fact — enforcement changed the outcome exactly once, and it is the only GO.** R3 is the only run
with a supervisor-enforced pre-implementation `agent init` + docs + MCP-attachment gate
(`billing-run-.../INTERVENTION-LEDGER.md`), the only run with non-zero live MCP calls, and the only
non-NO-GO. **Hypothesis (not proven):** the preflight gate is causal. Confounds: different model,
different framework version (canary.16 vs .13 — R2's D2/D3 may already be partly fixed there), a
formal separate-session DeepSeek evaluator with two FAIL_FIX rounds, and ~2× the tool calls (514 vs
378 parts). R3 also never tested the two rows that killed R2 (worker-death-during-run, live UI
convergence under startup-order disruption), so its GO is on a narrower board.

**Fact — the acceptance bar that actually catches defects is runtime, not exit codes.** All three
packs converge on this: R1 "Do not treat 13/13 tests as GO"; R2 `RUBRIC.md` "`PASS` requires runtime
or immutable artifact proof at the audited product SHA. Builder statements, HTTP exit codes alone,
and green tests alone are insufficient"; R3 "Required one clean Aspire graph and a real automatic
tick; registration and enqueue acceptance were explicitly insufficient."

**Open conflict for the plan to resolve:** R2 classes the trigger-Redis-adapter crash and the
`ServiceReferences`-not-injected gap as **D — framework defect**; R3 classes the same surfaces as
docs-discoverability / agent wiring and states "No confirmed framework defect is claimed by this
run." Both runs had to hand-add the same two pieces of glue. This must be adjudicated once before
either becomes an issue, since the classification determines whether the fix lands in the generator,
the plugin runtime, or the docs.

---

## 4. Source inventory (files read)

- `review-desk-gemini-3.6-flash-high/`: `README.md`, `RUBRIC.md`, `GO-NO-GO.md`, `GAP-AUDIT.md`,
  `DEFECTS-VS-UNFAMILIARITY.md`, `HUMAN-PRELIMINARY-EVALUATION.md`, `INTERVENTION-LEDGER.md`,
  `MEASUREMENTS.md`, `REMEDIATION-STATUS.md`, `SUPERVISOR-REPORT.md`, `TIMELINE.md` (11 files).
- `workflow-builder-kimi-k3-max/`: `README.md`, `LAUNCH-BRIEF.md`, `GO-NO-GO.md`, `RUBRIC.md`,
  `GAP-AUDIT.md`, `DEFECTS-VS-UNFAMILIARITY.md`, `GROK-SUGGESTION-DISPOSITION.md`,
  `INTERVENTION-LEDGER.md`, `MEASUREMENTS.md`, `OBSERVATIONAL-SUPERVISOR-MATRIX.md`,
  `REMEDIATION-STATUS.md`, `SUPERVISOR-HANDOFF-UPDATE.md`, `SUPERVISOR-REPORT.md`, `TIMELINE.md`
  (14 files).
- `billing-run-grok-4.5-high-canary.16/`: `README.md`, `GO-NO-GO.md`, `GAP-AUDIT.md`, `IMPL-EVAL.md`,
  `INTERVENTION-LEDGER.md`, `MEASUREMENTS.md`, `OBSERVATION-LEDGER.md`, `TIMELINE.md`,
  `RUNTIME-EVIDENCE.md`, `SECURITY.md`, `RESOURCE-HYGIENE.md`, `PUBLICATION.md`,
  `ARTICLE-QUALITY.md`, `REDACTION.md`, `leak-report.md` (15 files).

Skipped per task scope: `*.raw.jsonl`, `*.sha256`, `evidence/screenshots/*.png`.
