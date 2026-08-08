# Wave 5 / Wave 6 harness design, project catalog, and supervision methods

**Scope of this research pass.** All top-level `.md` files in the Drive agent-posts tree for
`wave-5/` and `wave-6/`, plus all of `wave-6/projects/`. Root path (abbreviated **DRIVE** below):

```
/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts/
```

Files read in full: `wave-5/{WAVE-5-PLAN.md, PLAN-TEMPLATE-v2.md, PLAN-TEMPLATE-v3.md,
01-deepseek-v4-flash-pilot-0.0.5-canary.2.md}`; `wave-6/{PLAN-WAVE6.md, ARTICLE-ANALYSIS.md,
PRIOR-RUNS-CAVEAT-MATRIX.md, CLAUDE-OPUS-5-SUPERVISION-METHOD.md,
CLAUDE-LOOPBACK-SUPERVISION-METHOD.md, KIMI-K3-MAX-SUPERVISOR-RUNBOOK.md,
MILESTONE-ORCHESTRATOR-HANDOVER-2026-08-06.md, MILESTONE-ORCHESTRATOR-PROMPT-2026-08-06.md,
01-deepseek-v4-flash-max-planning-board-0.0.4.md,
02-gemini-3.6-flash-high-review-desk-0.0.5-canary.13.md, codex-thread-ids.md, leak-report.md}`;
`wave-6/projects/*.md` (9 files). Sub-directories `wave-6/runs/` and `wave-6/tooling/` were listed
and spot-read only where they contradict the top-level documents (see §7 "State conflicts").

Facts are cited by file + line. Statements marked **[hypothesis]** are my inference, not sourced.

---

## 1. The harness design: brief templates, forces, rubric

### 1.1 Template lineage — v2 → v3 → PLAN-WAVE6

Three generations of builder brief exist, each a deliberate deletion of the previous one's
contamination:

| Gen | File | Lines | Key structural property |
|---|---|---|---|
| v2 | `wave-5/PLAN-TEMPLATE-v2.md` | 143 | `__DOMAIN__` slot; **names capabilities** (explicit "known broken in 0.0.3 — sagas"); enumerated 4-point force list; "what you did not use" section |
| v3 | `wave-5/PLAN-TEMPLATE-v3.md` | 205 | Domain **hard-coded** (planning board, Linear as bar); forces restated as *product feel* not capability; article evidence-checklist deleted; diagrams mandatory; `curl`-against-own-service banned |
| w6 | `wave-6/PLAN-WAVE6.md` | 211 | `__PROJECT__` + `__COMPARABLE__` slots; Quickstart as **Step 0**; version-gate; **capability map** artifact; visual-identity bar; built-in-vs-hand-rolled ledger; caps section |

**The v2→v3 lesson is capability contamination.** v2 lines 45–50 name the saga surface as broken and
tell the agent to route around it; `WAVE-5-PLAN.md:80-84` and `PRIOR-RUNS-CAVEAT-MATRIX.md:26`
record that naming a surface — even to steer *away* — makes it the first thing reached for.
`projects/README.md:25-28` states the rule categorically: "**Never name a capability.** Not in the
assignment, not in the comparable, not anywhere the agent reads."

**The pressure-not-feature principle is empirically validated once.** v3 stated
"filling something in and getting it wrong must not cost the work already typed"
(`PLAN-TEMPLATE-v3.md:47`) with no API named; the agent independently derived `withForm`
(`wave-5/01-…canary.2.md:99-109`). That is the single strongest evidence in the corpus that
behaviour-stated-as-feel is discoverable.

### 1.2 The six behavioural forces (PLAN-WAVE6 canonical list)

`PLAN-WAVE6.md:71-77`, restated verbatim in the acceptance matrices:

1. immediate action, still correct after reload;
2. two people see the same change without reloading;
3. invalid form input does not cost typed work;
4. something happens on a schedule with nobody watching, still right in the morning;
5. multi-step operation failing halfway leaves no half-changed world;
6. closing the laptop and coming back loses nothing already true.

Plus structural bars: **"One entity is not a product"** (`PLAN-WAVE6.md:79-81`) — several related
entities, a schema that evolved at least once; **distinctive visual identity**
(`PLAN-WAVE6.md:84-100`); **stranger-clone README**, **captured real behaviour**, **failing-capable
tests** (`PLAN-WAVE6.md:104-110`); **explicit auth/threat-model decision** with negative
authorization tests when identity/tenancy exists (`PLAN-WAVE6.md:111-113`).

`CLAUDE-LOOPBACK-SUPERVISION-METHOD.md:220-232` restates these as the supervisor-side product bar
and adds "integration boundaries use real dependencies where the claim requires them".

### 1.3 The capability map — the Wave-6 anti-compression artifact

`PLAN-WAVE6.md:44-48` requires, **before implementation**, a durable in-repo capability map:
for each product need → the relevant built-in primitive / plugin / CLI-MCP command / skill, its
canonical docs link, and the runtime evidence that will prove it. Discovery inputs are named:
generated app `AGENTS.md`, `WEB-LAYER.md`, `/design`, `/design/composition`. Two enforcement
clauses: **revisit rows before each slice "so context compression cannot silently erase the
framework's intended path"**, and **record why any built-in was rejected**.

The closing counterpart is the **built-in-versus-hand-rolled ledger** (`PLAN-WAVE6.md:150-153`),
which must cover MCP, CLI, Fresh-UI, SDK/page-builder, database-schema, plugin, Aspire and
observability surfaces as *used / deliberately rejected / never reached*, with the explicit rule
that **"I did not know it existed" is an adoption finding, not a framework defect**.

### 1.4 The version gate (Wave 6's hardest structural addition)

`PLAN-WAVE6.md:18-22`: the run tests the **supervisor-declared latest canary**, not what the public
Quickstart resolves. The agent must record requested canary, the CLI/scaffold specifier actually
used, and the resolved package graph — and **stop the run** if any resolved `@netscript/*` package
is stable or from an older canary.

Concrete gate format, `KIMI-K3-MAX-SUPERVISOR-RUNBOOK.md:97-114`:

```
target=0.0.5-canary.13
lane binary path=<fresh workspace>/.lane-bin/netscript
lane CLI output=netscript 0.0.5-canary.13
runner `command -v netscript`=<fresh workspace>/.lane-bin/netscript
global contrast=netscript 0.0.4
JSR metadata contains 0.0.5-canary.13
```
plus post-`netscript init` scan of `deno.json`/import maps/`deno.lock` **including generated
subprojects**, non-login shell for the launch (login PATH reintroduced `~/.deno/bin/netscript@0.0.4`
— `RUNBOOK:112-114`), and abort-and-rebuild on any mixed set.

**Why it exists:** the Wave-6 pilot silently installed stable 0.0.4 because the Quickstart's
`releaseSpecifier` resolves to last-published stable (`01-…planning-board-0.0.4.md:12-16`); that run
"says nothing about canary.9/10's fixes, MCP adoption, or `ui:add`". The loopback method records it
as supervisor failure #5 (`CLAUDE-LOOPBACK-…:264-267`): "version pin is a pre-write hard gate; that
run can never support canary conclusions."

### 1.5 The MCP-attachment gate

`PLAN-WAVE6.md:26-42` treats `agent init --with-docs` as checklist, not editor setup: generated
`AGENTS.md` + MCP config present; **the host has actually loaded** the NetScript and Aspire MCP
servers ("a configuration file on disk is not proof"); one harmless docs lookup succeeds through
MCP. Critically it names the **reload boundary**: generating MCP config does not reload a running
host — end the bootstrap turn, restart/resume through the documented launcher, then do the lookup,
and record both. If the host cannot expose the tools: stop and record the host failure; **do not**
substitute public-doc fetch or filesystem search.

### 1.6 The scoring rubric

**Wave 5 rubric** (`WAVE-5-PLAN.md:110-121`) — six axes, explicitly *not* defect count:

1. **The behaviour four** — `withForm`, `staleTime`/cache-first, `withPolicy`, `withTelemetry` (all
   zero across wave 4);
2. **Composition** — layer count, island boundaries, query-factory use, absence of bespoke CSS;
3. **Surface breadth** — distinct capability surfaces genuinely exercised;
4. **Seam use** — wrote a plugin? adapted an unsupported backing service? reached subpath exports?
   (the "eis-chat axis", wave 4 scored ~zero);
5. **Toolchain use** — `plugin doctor` / `aspire otel` before declaring a defect; any MCP call at all;
6. **Honesty** — states what it did not use and why; splits unfamiliarity from defect.

Wave 5 also fixes the counting method: **agent-authored files only, excluding scaffold
`routes/examples/` and `(design)/`** — "where earlier counts were inflated"
(`wave-5/01-…canary.2.md:87-88`).

**Wave 6 rubric** shifts from counts to runtime forces. `KIMI-…RUNBOOK.md:145-170` is the canonical
non-de-scopeable acceptance matrix (force → required evidence → **rejected substitutes**), e.g.
live observation requires "two independent browser contexts receive server-originated progress
without reload" and explicitly rejects "polling, `BroadcastChannel` only, setTimeout theater".
Scope may cut node-type breadth or secondary screens; it **may not** cut canvas, durable run, live
observation, scheduled behaviour or failure/recovery proof.

Feature-loop counts are demoted to diagnostic context, not score:
`CLAUDE-LOOPBACK-…:293-295` — "a superior product may use fewer NetScript commands than another…
the product forces and actual framework-native behavior remain authoritative".

### 1.7 Evidence hierarchy

`CLAUDE-OPUS-5-SUPERVISION-METHOD.md:106-114`, in descending authority:

1. source + DB + HTTP/DOM;
2. deterministic tests that can fail the real rule;
3. logs / RECORD with exact commands;
4. PR diff / preview build;
5. **agent summaries / commit messages — lowest, often false.**

"False SUCCESS was observed twice on Gemini remediation" (same file, :114).

### 1.8 The measured smoke method (command taxonomy)

The recurring measurement block is a **taxonomised executed-command census** plus a verify-gate
position. Pilot example (`01-…planning-board-0.0.4.md:37-43`):

```
verify gate reached at command #13        deno task check ×16   health probe ×14
SETUP     init 2 · restore 1 · db init 2 · generate 2 · seed 6 · migrate 2 · agent init 0
LOOP      service add 2 · plugin install 3 · contract add 0 · add-handler 0 · ui:add 0
DIAG      aspire describe 18 · aspire logs 9 · curl 40 · plugin doctor 0 · aspire otel 0
REPO      117 source files · 2 commits · clean tree · derives_db_schemas 0
```

Gemini comparison block, same shape (`02-…canary.13.md:35-41`): verify gate at command **#61**,
LOOP all zero, `derives_db_schemas 2`, islands 7, largest 457 L.

Method rules for producing these numbers honestly:
- **Parse executed tool calls; never grep the transcript for command names** — documentation text in
  a log looks like an executed command (`CLAUDE-LOOPBACK-…:202-204`).
- **Track the real nested repo.** `netscript init <name>` initializes Git below the lane root;
  measuring the parent produced false `commits=0` in the pilot (`CLAUDE-LOOPBACK-…:205-207`;
  `01-…planning-board-0.0.4.md:106-108`).
- **Exclude scaffold examples/generated code** when attributing authored framework use
  (`KIMI-…RUNBOOK.md:278-280`).
- Measure the **first real verification gate and its repetition** (`CLAUDE-LOOPBACK-…:207`).

### 1.9 Standing brief-review pass

`WAVE-5-PLAN.md:177-180`: "Anywhere a brief contains an example of a good answer, check we are not
reading our own words back." Failed twice in one brief (the product menu; a worked Nest-DTO answer).
**Grep every new brief for worked examples before sending it.**

---

## 2. Project catalog (`wave-6/projects/`)

### 2.1 File shape and selection rules

`projects/README.md:8-17` — four sections per project; only **Assignment** (→ `__PROJECT__`) and
**Comparable** (→ `__COMPARABLE__`) reach the agent. "Why this project" and "What it should force"
are supervisor-only scoring material.

Selection rules, `projects/README.md:19-33`:
- **Name a category of two or three peers, never two domains.** Wave 4's PagerDuty/Vercel/Stripe was
  three *different domains* and read as a menu — two runs built the first item. Linear/Jira/Monday
  triangulates a bar and prevents 1:1 cloning.
- **Never name a capability** (see §1.1).
- **The domain must force several entities** — single-entity domains produce fixtures.
- **The interesting state must be watched** — that is what makes the web layer non-optional.
- **Retired domains stay retired:** on-call escalation (2× wave 4), deploy queue (3× waves 4–5).

### 2.2 Catalog — what each project is meant to prove

| Project | Comparable | Meant to prove | Named risk |
|---|---|---|---|
| `planning-board.md` | Linear · Jira · Monday (category) | Carried from wave 5 but **substantially harder**: keyboard-first interaction, saved views, sub-work roll-up, triage lane — "things that cannot be faked with a table and badges" (:23-30) | Scope; keyboard/roll-up/live multiplayer must survive the cut (:42-45) |
| `observability-console.md` | Grafana · Datadog | **Hardest UI on the slate**; charts and time-series "are impossible to hand-wave" — a badly drawn chart cannot look acceptable the way a status table can (:24-27). Also forces ingest volume + rollup + query rather than CRUD (:29-30) | Agent instruments *itself* instead of building the product; chart-library default sold as design (:44-46) |
| `workflow-builder.md` | n8n · Zapier · Make | **Hardest UI on the most demanding backend.** Node-graph editor needs drag, connection routing, hit-testing, pan/zoom, selection, reload-surviving layout — "No agent in five waves has attempted anything of this class" (:21-25). Both halves real simultaneously "has never actually been achieved" (:26-28) | Highest scope; permitted cut is fewer node types (three), never the canvas/durable run/live view (:42-45) |
| `review-desk.md` | Klippa · Rossum | **The concrete AI project, deliberately not a chatbot** ("eis-chat already exists; model returns text into a bubble tests almost nothing", :24-25). Forces structured output, confidence-driven routing, streaming into a real UI, cost/token accounting, retries on unusable output, a **human decision that must win and be recorded** (:27-31) | Drift into chat, or extraction with no review gate; needs a provider credential on the lane (:49-53) |
| `media-pipeline.md` | Frame.io · Cloudinary | **The polyglot project, written so the second language is necessary not decorative** — probing a container, proxies, frame extraction, image content reading "are genuinely worse in TypeScript" (:22-24). The assignment never says which language (:31-32) | Ad-hoc shell-out called polyglot (article must explain *how the boundary is managed*), or stub-everything; check lane has the media tooling before assigning (:45-52) |
| `billing-run.md` | Stripe | **Money makes half-completed work unacceptable**, so integrity is felt not imposed; refunds are a genuine compensating transaction, "the shape that cannot be faked with a status column" (:20-22). Held back from wave 4 while the durable-workflow surface was broken (:24-25). Assignment also asks for multiple meaningful screens incl. charts + webhook management (:10) | Money domains tempt breadth over one finished flow (:36-38) |
| `integration-hub.md` | Svix | Clearest "arrives from outside, must survive everything" domain; ingest and delivery are separate concerns with different failure modes, forcing a real boundary. Best test of an **operator-facing debugging screen** — "the thing every previous build reduced to a list" (:19-24) | Stopping at "receive and store" = a log table (:35-37) |
| `tenant-console.md` | Cloudflare | Only domain where correctness is **also a security property**; multi-tenancy makes single-entity impossible by construction. "Sharpest test of whether an agent reaches for the framework's authorization seam or hand-rolls checks in every handler" (:18-22) | Most likely to run out of time; "may suit a higher-capability lane" (:33-35) |

Status table (`projects/README.md:37-48`) marks planning-board as used (wave 5, easier version) and
**all seven others "unused"** — stale, see §7.

**Reservation:** `observability-console` / Grafana is explicitly **ring-fenced** by the human for a
later frontier-model run and must not be assigned as a free-choice next project
(`CLAUDE-OPUS-5-…:47`, `KIMI-…RUNBOOK.md:9-10`, and gate row `RUNBOOK:166`).

### 2.3 The wave-5 topic slate (superseded but informative)

`WAVE-5-PLAN.md:71-79` listed six topics with **one primary capability surface each, no two
sharing** — the corrective to wave 4 funnelling into sagas "because the four pressures are all
answerable by sagas alone" (:59-61). Note the wave-5 slate still names surfaces in the *supervisor*
table (sagas+compensation, triggers+workers, durable streams+database, plugin-ai+workers,
telemetry+cron+streams, auth+database+metering); Wave 6 removed capability naming even from the
project file's agent-facing half.

### 2.4 The eis-chat bar

`WAVE-5-PLAN.md:92-101`: `rickylabs/eis-chat` is a real production product built on
**`0.0.1-beta.9`** that still reaches further than anything wave 4 produced on 0.0.3 — its own plugin
(`plugins/channel-sync`), an officially unsupported DB through the adapter seam (Turso/libSQL), AI
hand-built pre-framework, deep subpath imports, optimistic UI, a native desktop shell. It was scoped
and steered so it is **not a fair comparison — it is the target**: "how much closer to that shape did
an autonomous agent get?"

The milestone handover restates the eis-chat ceiling as a concrete feature list
(`MILESTONE-ORCHESTRATOR-HANDOVER-2026-08-06.md:134-146`): app-owned UI registry + interactive
primitives; layered `definePage`, `withForm`, route contracts, error contracts; QueryIsland, query
factories, cache-first hydration, optimistic rollback; Fresh partial navigation;
`createNetScriptStreamDB` + `useLiveQuery`; generated DB schemas imported into versioned contracts;
resource-local `(_components)`/`(_islands)`; a living `/design` gallery.

---

## 3. Milestone-orchestrator handover method

Source: `wave-6/MILESTONE-ORCHESTRATOR-HANDOVER-2026-08-06.md` (228 lines) and the launch prompt
`MILESTONE-ORCHESTRATOR-PROMPT-2026-08-06.md` (64 lines). These are **not** builder-wave documents —
they are the NetScript 0.0.5 release-milestone lane.

### 3.1 Provenance-first handover shape

`HANDOVER:3-18` — the handover opens with machine-checkable provenance: original Claude session UUID
`c9b9bb3e-a283-4481-9d6f-7444ce5ef674`, remote history URL, transcript path, existing `/compact`
continuation UUID, authoritative run dir `/home/codex/repos/ns-005/.llm/runs/release-0.0.5--orchestration/`,
branch/worktree, last observed local harness commit `8399126ef` with divergence counts (ahead 155 /
behind 71 from `origin/main`; `origin/orchestrator/0.0.5` at `229de5e23`) and the instruction to
**re-baseline before use**. It also negates a stale affordance: "No live `ns005` tmux session
currently exists. Do not advertise the historical attach command."

Prescribed resume order (`HANDOVER:16-18`): `context-pack.md` → final ~200 lines of `worklog.md` →
`drift.md` D1–D21 → `owner-brief.md`, `research.md`, `plan.md`, `supervisor.md`, `cut-trace.md`,
`slices/`.

**Explicit anti-compaction judgement** (`HANDOVER:38-39`): the existing `/compact` summary is already
rich and its post-compact state is carried into run artifacts — "a second compact/fork is not needed
and would add risk without material context gain."

### 3.2 The Claude orchestration method, condensed

`HANDOVER:20-26`: classify every milestone issue by **close semantics**; require separate PLAN-EVAL
and explicit owner ratification when the loop limit is reached; commit a per-PR brief with files,
archetype, overlays, doctrine, debt and gates **before dispatch**; one supervisor per PR cluster;
retain merge/canary authority centrally; prove launches with thread/artifact evidence; merge only
after current named contexts, real job/artifact evidence, zero unresolved threads, box-indexed
acceptance evidence, and close-reference verification.

Release lessons (`HANDOVER:28-31`): cut coherent **content-derived** canaries; treat registries as
publish truth; use same-semver exact-tag republish **only** to complete a partial immutable publish
then fix forward; measure JSR quota before all-package trains; keep pinned production E2E green
pairs. Latest recorded evidence: `0.0.5-canary.13`, 35/35 packages, content `57c9b5ab3`, publish run
`31051176983`, pinned E2E `31051492054`, green Quickstart 1–7, `scaffold.runtime`, PGDATA teardown.

Recorded unresolved work at handover (`HANDOVER:33-36`): gate/retarget train PRs **#1315–#1318**
(base name collides with published canary.13); **#1316 box 5** still needs isolated AppHost runtime +
OTEL evidence; revoke the temporary JSR token; reconcile remaining p0/p1 scope before further
train/canary/stable action.

### 3.3 The milestone-rollover procedure (owner rule)

`HANDOVER:41-56`, restated in `PROMPT:17-24`:

1. Rename every existing **future** milestone (not `0.0.5`) **upward by one semver, highest→lowest**
   so names never collide.
2. Create the newly freed `0.0.6`.
3. Move every issue that cannot realistically land in `0.0.5` into `0.0.6`.
4. **Do not** bulk-shift issue assignments through intermediate milestones — renaming preserves them
   and avoids churn.
5. Audit titles, due dates, descriptions, open/closed state and issue counts before and after; record
   the mapping and evidence in the run artifacts.
6. "This operation changes shared GitHub state. Resolve the exact milestone mapping read-only first,
   then execute it once from the milestone-orchestrator authority lane."

**Milestone 24 split** (`HANDOVER:58-71`): live milestone 24 is titled `0.0.6` and mixes the
frontend-contribution epic with unrelated work. Rename it with the semver shift, then move the
non-frontend open issues into the *new* `0.0.6`. The 2026-08-06 read-only inventory names
**#1320, #1306, #1296, #1280, #1279, #1278, #1263, #1262, #1246, #1243, #1215, #1175, #1163, #1140**
as not carrying `epic:frontend-contrib` — with the explicit instruction to **re-query immediately
before mutation**. Keep epic **#922** and children **#923–#941** on the renamed future milestone;
preserve closed historical assignments.

### 3.4 Routing and launch contract

`HANDOVER:75-86` / `PROMPT:38-43`: fresh orchestrator = Codex GPT-5.6 Sol **high**, bypass
permissions, owner-authorized override of the default Fable orchestrator route. Focused
implementation = Sol **low**; medium only for real research/decision-heavy work. Claude subscription
exhausted until Saturday ⇒ no Anthropic-plan review lanes; ordinary adversarial review uses
owner-authorized OpenRouter Grok 4.5 or Kimi K3, recorded as temporary drift. Formal evaluators are
**phase-specific**: PLAN-EVAL `minimax/minimax-m3`; IMPL-EVAL `qwen/qwen3.8-max`. "Never use a
generator session as its own evaluator."

Launch contract (`PROMPT:45-52`, `HANDOVER:98-106`): every Codex lane bypass-enabled and launched
only through `.llm/tools/agentic/`; before claiming success record worktree, branch, thread id,
observed model/effort, remote-control connection proof, same-thread steering command, draft PR, and a
tmux attach command showing the actual Codex CLI. **"A tmux pane is not phone visibility"**
(`HANDOVER:103-104`) — verify daemon-attached thread connectivity or record it as failed.

`codex-thread-ids.md` is the machine-generated instance of that contract (written by
`.llm/tools/agentic/codex/launch-codex-slice.ts`): thread `019fd77c-f583-7b01-aed8-c8665ac09230`,
rollout jsonl path, worktree `/home/codex/repos/ns005-milestone-orchestrator`, branch
`orchestrator/0.0.5-continuation` @ `2508eb8c9` with **no upstream by design**, explicit-refspec push
rule, requested vs **observed** route both `openai · gpt-5.6-sol · high` and a "route verdict:
matched" line, runtime `approval=never · sandbox=dangerFullAccess`, and the same-thread steering
command.

### 3.5 Issues filed from the Kimi/Loom audit

`HANDOVER:148-167` — twelve new issues, the direct output of one builder run's audit:

| Issue | Subject | Priority |
|---|---|---|
| #1324 | OpenCode ignores generated MCP config | P0 |
| #1325 | triggers generated runtime misses Redis adapter | P1 |
| #1326 | durable stream producer never reconnects | P0 |
| #1327 | headless `db migrate` succeeds without creating migration | P1 |
| #1328 | scaffold check misses TSX/plugin runtimes; 154 lint findings | P1 |
| #1329 | SSE docs/wire/event/OTEL envelope drift | P0 |
| #1330 | OpenCode resume forwards empty assistant turns | P1 |
| #1331 | evaluator routing migration (PLAN-EVAL Minimax M3; IMPL-EVAL Qwen 3.8) | P0 |
| #1332 | document DB-generated schema as optional normative predecessor to contracts | P1 |
| #1333 | eis-chat-grade frontend scaffold + project-derived app name | P0 |
| #1334 | homepage capability story completeness | P1 |
| #1335 | umbrella: whole-scaffold conformance inventory | Backlog/Triage |

Existing issues that received **evidence comments (do not duplicate)**: #1071, #1073, #1090, #1189,
#1197, #1208, #1210, #1252, #1277, #1324, #1328 (`HANDOVER:163-164`). #1335 is an umbrella and "must
never be closed by one PR" (`HANDOVER:196-197`). Unresolved worker death/redelivery stays
investigation-only until a minimal repro separates visibility timeout, idempotency TTL, retry/DLQ,
process-kill semantics and product reconciliation (`HANDOVER:166-167`).

Active prerequisite slice #1331 metadata (`HANDOVER:169-186`): worktree
`/home/codex/repos/ns1331-qwen-evaluator`, branch `chore/qwen-3-8-evaluator`, base `57c9b5ab3`,
Codex thread `019fd71b-df96-78b0-80a1-bc2e518a161b`, run dir
`.llm/runs/chore-qwen-3-8-evaluator--1331/`. Two recorded hazards: launch observed
`remoteControl/status = disabled` with an unmanaged app-server, and **the launcher mutated
`deno.lock` during dependency resolution — unrelated churn that must not be staged**.

### 3.6 Post-canary PR topology correction (owner directive)

`HANDOVER:210-228`: after the in-progress canary cut, **retire the aggregated
canary/orchestrator-branch implementation topology** — it existed only because the JSR publish cap
blocked normal cadence, and that cap has been raised. For every later implementation group: one draft
PR **directly against `main`** per coherent cluster of tightly connected issues; CI/integrity/quality/
test/review/repair bounded to that PR; flip to ready-for-review immediately after independent
IMPL-EVAL passes and current-head checks are green; **do not accumulate waves into a train or
orchestrator code PR** (the orchestrator branch may remain as coordination/history only). This must
be reconciled through run plan, context pack, worklog, drift, phase/dependency registry, PR base/head
instructions and the brief before dispatching any post-cut work.

### 3.7 Wave-6 workflow changes owned by the orchestrator

`HANDOVER:108-130` records that Drive `wave-6/PLAN-WAVE6.md` and the local mirror
`/home/codex/repos/.briefing/agent-posts-mirror/wave-6/PLAN-WAVE6.md` are **byte-identical** and
carry the new gates (Quickstart Step 0; `agent init --with-docs` + host tools/list + one MCP lookup;
persisted capability map; app `AGENTS.md`/`WEB-LAYER.md`/`/design`/`/design/composition`; Fresh-UI-
first with recorded justification for hand-rolling; auth/threat-model decision with negative
authorization tests; Aspire skill/MCP with resource graph + correlated E2E trace + Scalar;
built-in-vs-hand-rolled ledger; article evidence incl. failure states, Scalar, Aspire graph/traces,
redaction and bilingual render validation).

**Frontend comparison result** (`HANDOVER:132-136`): Loom *did* receive the Fresh-UI scaffold,
`/design`, app `AGENTS.md`/`WEB-LAYER.md` and advanced examples, but product code ignored them —
hand-rolled tables/buttons/forms/CSS, direct calls, a 676-line editor island. **"This is
adoption/activation failure, not absence of scaffold."**

**Non-negotiable quality interpretation** (`HANDOVER:205-209`): the Loom backend is genuinely strong
(workers, triggers, durable streams, typed SDK, service-owned DB, persisted graph/runs/step I/O,
retries/compensation, observability); the failed verdict is driven by **durability/publication and
frontend-adoption gaps**, not by the product being poor. "Preserve this nuance in issues,
evaluations, and release notes."

---

## 4. Prior-runs caveat matrix

Source: `wave-6/PRIOR-RUNS-CAVEAT-MATRIX.md`. Its governing rule (:8): "a run's own journal is
evidence of what the agent **believed**; source/runtime/publication inspection determines whether that
belief was correct." Mandatory pre-read before launching another Wave-6 builder (:3).

### 4.1 Cross-wave baseline (:11-16)

| Period | Worked | Recurrent caveat |
|---|---|---|
| Waves 1–2 articles | Strongest Grok post 3,211 words / 6 code samples / 4 figures; two memorable custom skins | The writing/identity bar, not proof product forces were implemented |
| Wave 3 | One 2,340-word article, 3 code samples, 2 figures | No consolidated run report in Drive — do not invent precise comparisons from prompt files |
| Waves 4–5 | Better instrumentation, repeatable private repos/PRs, explicit drift | Default-theme regression, giant-island/manual-state, **zero diagnostics adoption**, repeated false cleanup claims, article code samples decayed to zero |
| Wave 6 | Thin pressure-based brief broke the entity ceiling once | First pilot ran on the wrong stable version; first canary.13 pass packaged simulations and was human-rejected |

### 4.2 Run-by-run rows (:22-31) — carry-forward gates

- **W4 Fable 5 high (Vigil):** 11 slices, real saga/compensation pressure, exported primitives allowed
  a local replacement when the plugin failed. Builder **falsely claimed cleanup**; product repo never
  published (classifier). Gate: *do not infer cleanup from `aspire stop` — prove the process tree; do
  not require sagas specifically.*
- **W4 Grok 4.5 max (Nightbell):** 43 min / $6.38; typed query factories + `QueryIsland`; 8 tests. FR
  placeholder; scaffold CSS; false cleanup with two orphan trees. Domain converged on on-call because
  the brief listed PagerDuty first. Gate: *assignment fixed before launch; comparable = peers in one
  category; verify French and skin independently.*
- **W4 DeepSeek max (Shipdeck):** three bounded islands, 12 commits, real FR, ~9 tests. Durable-stream
  delivery downgraded to polling; no `withForm`/cache/policy/telemetry; screenshot never visually
  inspected. Gate: *pressure never capability names; visual supervisor must inspect images; exact
  ownership proof before cleanup; never pattern-kill or touch MCP.*
- **W4 control DeepSeek on 0.0.4 (DeployLane):** durable streams genuinely worked; 9 failing-capable
  tests; 3 verified issues. Two Postgres containers survived; preview initially failed on unverified
  git email. **Deleting the saga warning changed behaviour and cost ~75 min, confounding the speed
  comparison.** Gate: *preconfigure resolvable git identity; record confounds; a test definition not
  executed at runtime cannot support product claims; provide a real steer channel or drop the promise.*
- **W5 DeepSeek canary.2 (planning board):** 1,956-word article, 4 figures, 2 diagrams, real FR, green
  preview first try. One **772-line island** caused manual reconciliation; 4 tests; no code samples;
  `withForm` attempted then abandoned after a real hydration failure. MCP/doctor/OTEL zero against 38
  curls; **`agent init` pre-run by the supervisor**, changing harness salience; `:3000` Windows hijack
  cost ~30 min. Gate: *split into bounded regions; code samples mandatory; consistent `agent init`
  ownership; preflight host ports; inspect **why** a surface was abandoned.*
- **W6 pilot DeepSeek (Trestle):** broke the entity ceiling (2 services, 8 models, 7 islands, 13
  integration tests); found #1310. Hand proxy; browser stream unproven (UI polled); policy/form/cache/
  telemetry zero; only 2 end-loaded commits. **Invalid canary experiment** (Quickstart installed
  stable 0.0.4); supervisor measured the wrong parent repo and had removed commit guidance;
  supervisor's DB-order advice caused the #1310 collision it later corrected; run self-report
  exaggerated time cost. Gate: *hard-gate exact CLI and every generated pin before product code;
  resolve the nested Git root; commit-as-you-go is workflow guidance and stays.*
- **W6 rejected Gemini 3.6 Flash high (Review Desk as shipped):** exact canary.13 lane, isolated
  six-file PR, green preview mechanics. Regex "AI", formula cost/tokens, setTimeout "stream",
  BroadcastChannel only, fake completed cron row, no atomic failure proof, default tokens, scaffold
  README, shallow tests, FR stub, one 457-line island, feature-loop/doctor/OTEL all zero. Primary
  build ~23 min was implausibly shallow; the initial supervisor **treated packaging and green checks
  as success** and omitted matrix/measurements/timeline/ledger/rubric/adjudication/GO-NO-GO. Verdict
  **NO-GO**; builder repairs in its own conversation; Kimi paused.
- **W6 Gemini remediation:** at `a73d7a5` real OpenRouter path, real SSE transport, non-stream schema
  correction retry, deterministic DI tests, distinctive Emerald/Obsidian/Copper skin, stranger README
  — still blocked on unattended durable schedule, server push to two independent clients, nullable
  cost laundered to zero, main stream path lacking correction retry, and unre-proven article/screens.
  Gate: *do not flip GO on an agent summary or a dirty tree.*

### 4.3 Recurring defect themes (:35-74)

**Product:** (1) **simulation presented as infrastructure** — polling as live, `BroadcastChannel` as
multi-user, timer text as streaming, an inserted completed row as a scheduler, formula cost as
measured AI usage; (2) **one giant island** — 772 L and 457 L examples centralize cache, stream,
mutation, selection, forms and reconciliation, suppressing framework boundaries and failure
isolation; (3) **default/superficial visual identity** — layout CSS does not replace scaffold tokens;
(4) **weak failure proof** — a transaction helper or saga definition is not evidence; (5)
**diagnostics avoidance** — "counts are a clue; lack of artifact-level proof is the real failure".

**Article:** brief-shaped headings; code samples 6 → 0 across waves; declared FR placeholder is still
a quality gap; screenshots present but blank/error/stale — **bind captures to the final SHA/runtime**;
claims must preserve uncertainty about untested forces.

**Supervision (seven named contaminations):** green-check substitution; **authorship contamination**
(supervisor fixes then credits the builder); **version contamination**; **branch contamination**;
**measurement contamination** (grep counts doc mentions; parent dir hides Git; generated examples
inflate framework-usage metrics); **cleanup overreach** (`pkill -f` endangers protected sessions and
MCP); **missing intervention ledger**.

### 4.4 Required comparative checks (:78-87)

Eight questions, each with a *minimum comparison*: canary-not-stable (version gate format + CLI /
`deno.json` / import map / lock scan); exceeded the shallow pass; avoided the UI regression
(largest-island/region responsibilities, no god-canvas state owner); **"live" genuine** (two
independent clients receive server-originated updates; no polling/BroadcastChannel substitution);
**scheduling genuine** (time-controlled unattended trigger causes durable DB side effects without
clicking an endpoint); **failure safety genuine** (injected mid-run failure proves durable state and
compensation/idempotency after retry/restart); **article Wave-1-or-better** (≥6 useful code samples,
2 authored diagrams, real final captures, full FR); **supervision honest** (full intervention ledger
and independently produced evaluator pack; every steer marked as a confound).

---

## 5. Supervision methods

### 5.1 The Opus-5 loopback method (`CLAUDE-LOOPBACK-SUPERVISION-METHOD.md`)

Reconstruction of protected Claude session `ca149e35-6a96-436f-a8cd-0f6d49129cdd` from
`/home/codex/.claude/projects/-home-codex-repos/<uuid>.jsonl`, written 2026-08-06 by a separate Codex
Sol lane. It explicitly labels statements **Evidence** vs **Inference** (:8-11).

Role: "Opus did not build the benchmark products. It established the experimental lane, watched the
build, checked the builder's claims against source and runtime evidence, intervened only when
warranted, then measured and evaluated" (:15-18). The ASCII workflow diagram at :22-43 is the
canonical shape: plan+project → supervisor preflight → isolated version/docs/transport lane → builder
owns product+RECORD+article → structured event stream → artifact audit → three-way routing (verified
defect → issue/release steer; process risk → minimal process-only intervention; builder defect →
builder repairs in its own conversation) → evaluator pack + honest GO/NO-GO.

Eight-step operating sequence (:47-172), each with transcript-line evidence:

1. **Verify the handoff; do not inherit it** (lines 10+, 24–38) — a status sentence is never authority
   when a registry/commit/process/source/artifact can answer directly.
2. **Establish a clean lane and make the treatment explicit** (lines 69–198, 1240–1337) — resolve the
   exact release commit, rebuild the matching docs corpus, verify every pin, install the intended CLI,
   quantify the prior baseline, smoke-test the exact transport/model route. Canary trap recorded:
   canaries were untagged and `main` still advertised 0.0.4.
3. **Prove launch mechanics before spending the run** (line 273, 185–225) — smoke-test model
   resolution, permissions, cost reporting, exact invocation; launch under tmux; write launch scripts
   and messages to disk; **structured logs, not pane text, are the measurement source**.
4. **Monitor behaviour, not liveness** (line 306, 355–364) — ~15-min cadence reporting elapsed/cap,
   event and executed-command counts, commits and journal growth, last meaningful activity/idle,
   *which framework surface is being used*, whether the run is building product or trapped in
   infrastructure, deviations and prior-run comparison. "A heartbeat was a prompt to inspect, not
   itself proof of progress."
5. **Verify a finding before naming it a framework defect** (lines 364–397) — six-way classification:
   framework defect / unfamiliarity / builder mistake / shared-host artifact / **supervisor-caused
   confound** / unverified hypothesis. The same rule applies to success: `Healthy`, exit 0, `aspire
   stop` success, green Vercel and the builder's summary do not establish the behaviour happened.
6. **Intervene narrowly and preserve authorship** (Wave-4 Fable: exactly one process-only steer; lines
   386–497 for the #1184 workflow) — file evidence-rich issues, steer the **release orchestrator**,
   not the demo builder; upgrade acceptance criteria from unit proof to fresh-scaffold end-to-end
   behaviour with traces/spans and failure paths.
7. **Treat publication as a separate evidence surface** (:139-152) — repo visibility and history;
   tree==remote SHA; no secrets/runtime debris; **article branch ancestry from current website
   `origin/main`, not another agent's branch**; only that run's EN/FR MDX and assets; frontmatter/
   byline; authored diagrams and real code samples; light/dark genuinely different and showing a
   running product; preview builds and images render; claims match behaviour actually exercised.
8. **Produce an evaluator pack, not a celebratory paragraph** (:156-167) — ten required outputs.

Intervention philosophy (:176-197). **Intervene when:** an invariant is about to invalidate the
experiment; the run is stalled/over cap/foreground-blocked/carrying uncommitted work; the builder asks
for unavailable supervision and a factual answer unblocks it; a verified defect needs issue/release
coordination; a destructive action risks another lane; the builder is about to publish a claim
contradicted by evidence. **Do not intervene when:** the builder is choosing architecture within the
assignment; the supervisor merely prefers another implementation; **a capability name would bias the
experiment**; a finding is still only the builder's diagnosis; the intervention would make the
supervisor the author; a green check is the only reason to stop auditing. Every intervention records
time, trigger, exact action, authorization, result, and interpretation impact — "if the supervisor
supplies a workaround or directs a capability, that is a treatment/confound and must be disclosed."

Monitoring mechanics worth preserving (:201-216) — tmux for survivability, JSONL for evidence; parse
executed tool calls not transcript greps; track the nested product repo; measure the first
verification gate and its repetition; event-driven wake ("a notification-only deadline is not a
control system"); **make deadline fallback self-executing** — Opus lost a night to a vanished timer;
protected sessions read-only; never pattern-kill; never touch `aspire mcp start`; after exit check
AppHost descendants, containers, `aspire nuget search` strays and foreign resources.

**Opus's six admitted supervisor failures** (:252-270) — mandatory lessons:
1. notification-only fallback (line 1353);
2. **capability contamination** — deleting/naming a saga paragraph changed what the model tried first;
3. **wrong database-order guidance** — asking lanes to run DB ops while Aspire was live created the
   exact PGDATA collision later filed as #1310; fix: smoke-test the documented sequence and **retract
   wrong guidance publicly**;
4. wrong measurement root (parent workspace measured; Git in a scaffold child);
5. **false version acceptance** — noticed at 15 minutes, allowed completion (line 3362);
6. over-crediting apparent progress on the rejected Gemini pass.

Declared inferences (:288-295): Opus's advantage was accumulated verified prior-run context + a habit
of checking causal claims, reproducible by a Grok or Codex supervisor given the same durable record;
15-minute cadence is useful but not sacred (event-driven phase-change reporting is better);
feature-loop counts are diagnostic, not a score.

### 5.2 The Opus-5 handoff doctrine (`CLAUDE-OPUS-5-SUPERVISION-METHOD.md`)

Written by a **Grok 4.5 high/bypass fork** of the protected loopback supervisor (:4-6), addressed to a
future Codex Sol medium supervising Kimi K3 Max. Declares itself "durable process doctrine… **not** a
GO claim for any product" (:10).

Prior lessons already settled and not to be rediscovered (:20-30), each anchored to a named memory:
one agent / one session with research included (`demo-wave-must-be-single-session`); unfamiliarity ≠
defect; complex backend **and** frontend, never reverse; posts lead with working product screenshots
(the only standing content directive from the human); tooling discovery gap → #1023 skills; standing
CLI rules (`standing-cli-authorization`, `orchestration-hard-won-rules`); verify artefact never exit
code; **judge independence** — "Opus judges; never accept relayed reversals as final"; harness
PLAN-EVAL lane ≠ changing the external judge.

Role boundary table (:64-68): implementation agent is **sole author** of product and article and
writes no evaluator pack and launches nothing; supervisor writes **no** product/article body, writes
the evaluator pack, and launches the next model only on GO + open human gate; the human overrides,
rejects, authorizes and finally accepts. "Supervisor does not 'fix the product to green' by editing
application source or MDX body" (:70).

Monitoring cadence (:74-79): continuous `stream-json`/jsonl tail, not vibes; ~15-minute standing
reports when the human is away overnight, including quiet stretches reported as quiet; **sample stalls
over ≥60 s windows** because max-effort models think silently and 10 s samples false-alarm; foreground
stall policy — if the CLI is frozen ~15+ min while AppHost/dashboard is healthy, detach **only** the
foreground CLI, preserve the AppHost, never pattern-kill, never kill `aspire mcp start`, kill only by
exact PID from a pidfile the agent owns; intervention ledger for every real steer.

Six intervention triggers (:83-89) incl. **"scope cosplay"** — renaming badges or adding "ON-DEMAND"
honesty labels instead of implementing forced behaviours when the human forbade de-scoping. Three
non-triggers (:93-95): long silent reasoning, green CI alone, agent self-grading.

Canonical evaluator pack (:120-131): `MEASUREMENTS.md`, `TIMELINE.md`, `INTERVENTION-LEDGER.md`,
`GAP-AUDIT.md`, `RUBRIC.md`, `DEFECTS-VS-UNFAMILIARITY.md`, `GO-NO-GO.md`, `SUPERVISOR-REPORT.md`,
`REMEDIATION-STATUS.md` (in repair loops), plus a top-level `0N-<model>-<project>-<version>.md` index
card. "Flip GAP-AUDIT / RUBRIC / GO-NO-GO **only from final artifacts**, never mid-edit working trees
unless labeled 'in flight / not audited'" (:133).

Especially fatal quality failures (:139-147): formula cost/fake tokens sold as provider metrics;
stream theater; fake schedule; BroadcastChannel as multi-user realtime; FR placeholder while claiming
bilingual depth; scaffold README; a RECORD that collapses all pain into "unfamiliarity" or invents
timings.

Branch/repo isolation (:151-153) and lane env: sticky `.lane-env`, lane-private canary install, **strip
`/mnt/c` from PATH**, non-login shells for version gates ("`bash -lc` once lied 0.0.4").

What the Grok fork initially failed to carry (:176-181): it optimized for **mechanics** — accepted
product lies, under-produced the evaluator pack until after human rejection, risked treating green
Vercel + clean file count as quality, and allowed honesty cosplay. Remediation changes (:185-192):
gap-audit first then steer; keep the same builder conversation for authorship; adversarial source
audit after **every** claimed SUCCESS; a **non-de-scope list** when PLAN forces are explicit; DI tests
must hit the real path (return-path-only tests insufficient); detached durable dev for screenshots
with fail-fast HTTP/DOM before capture; canary re-proof after every dep touch (watch lock lines like
`plugin-triggers@*` resolving to 0.0.4); supervisor writes zero product body.

Residual-audit tables (:198-206, :299-308) demonstrate the method in use: a six-row force table with
PASS/FAIL/PARTIAL per SHA (`517e909`, `2109622`, `972dce1`), each FAIL naming the mechanism
(`startBackgroundScheduler` zero callers; events HTTP 500 with an in-memory cross-process bus;
`stream.ts` still `?? 0.0`). **"Residual-2 exit=0 is not GO"** (:196). One-page doctrine at :284-293,
ten numbered rules, ending "**When Vault (`/mnt/g`) drops, trust the mirror and keep working.**"

### 5.3 The Kimi K3 Max runbook (`KIMI-K3-MAX-SUPERVISOR-RUNBOOK.md`)

The most operational of the three: a nine-section production runbook, "preparation only — do not
launch until the Gemini Review Desk remediation is GO and human acceptance permits" (:3-4).

- **§0 authorization/predecessor gate** (:21-35) — seven checkboxes; if any is false Kimi is paused,
  supervisory prep may continue, **no builder invocation or product scaffolding**.
- **§1 fresh lane without destroying evidence** (:37-53) — prior incomplete Kimi attempts are evidence
  only; preserve old logs, "do not delete them to create an appearance of freshness"; assert
  `/home/codex/repos/w6-workflow-builder` **does not exist** before launch; product repo with no
  inherited `.git`/copied sources/prior commits; website branch fetched fresh from exact current
  `origin/main` with ancestry proof before the first article commit.
- **§2 exact transport** (:57-90) — runner
  `/home/codex/repos/ns-docs006/.llm/tools/agentic/opencode/opencode-run.ts`, provider/model
  `openrouter/moonshotai/kimi-k3`, variant `max`, **native Moonshot only with
  `allow_fallbacks: false`** (an earlier Morph fallback rejected multi-turn conversations). The runner
  places the message immediately after `run` so OpenCode's multi-value `-f` cannot swallow it, and gets
  OpenRouter auth via the agentic environment helper without logging the key. Known config trap: the
  supervisor-local `opencode-kimi-k3-budget.jsonc` carries a temporary `output: 2000` cap from an
  exhausted-key period — must be re-tested and reset, and the chosen cap **recorded as a treatment**.
  Do not reuse abandoned OpenCode conversation IDs.
- **§3 canary isolation gate** — see §1.4 above.
- **§4 builder message and contamination boundary** (:118-144) — the builder reads only the rendered
  `PLAN.md` plus the canary-version constraint. The supervisor may state **workflow** constraints
  (verify first, commit as you go, keep a live record, publish privately, isolate the article branch,
  respect caps) but "must not prescribe workers, sagas, streams, a canvas library or a particular
  schema to obtain a preferred result". Kimi may learn from prior failures but must not copy prior
  product or prose.
- **§5 non-de-scopeable acceptance matrix** — see §1.6.
- **§6 supervision loop** (:172-220) — launch artifacts outside the product repo (rendered launch
  message, model/provider/variant/config evidence without secrets, version gate, start timestamp,
  structured JSONL, supervisor heartbeat log, initial requirement matrix and ledger); event-driven wake
  plus ~15-min maximum silence; five allowed interventions that do not change authorship; "if a
  supervisor runs a diagnostic or publishing command, attribute it to the supervisor and **do not count
  it as model behavior**"; safety rules (protected tmux `loopback`, `ns005`, `docsorch`, `ns1158`
  untouched; never `pkill -f`; never kill `aspire mcp start`; resolve exact PIDs by workspace path and
  process ancestry; read-only cleanup preview; do not delete lock files or caches to escape a
  dependency problem).
- **§7 adversarial completion audit** (:222-280) — "Kimi's 'done' message starts the evaluation; it does
  not end the run." Runtime: **two independent browser contexts, not two tabs sharing client
  broadcast**; control time for schedule/backoff; inject failure and restart rather than reasoning from
  code. Article gate: ≥6 useful code samples, ≥2 authored diagrams, real inspected light/dark captures
  from the final SHA, correct `Figure` usage, green preview with rendered images, byline is the builder
  not the supervisor.
- **§8 decision rule** (:282-298) — GO only when every non-de-scopeable force is runtime-proven,
  remotes match audited local state, publication is isolated and rendered, the full pack agrees,
  hygiene is proven, and no required work remains. On NO-GO, the builder owns remediation; re-audit
  from artifacts after **every** remediation SHA. "Do not silently lower the bar because Workflow
  Builder is the hardest project."
- **§9 self-audit** (:300-315) — a requirement-coverage table mapping each user requirement to the
  section that satisfies it. Evidence anchors at :317-327 mark prior version-gate/log files as
  **evidence only, not launch proof**.

### 5.4 Resource hygiene as measured, not asserted

`wave-6/leak-report.md` (generated 2026-08-06T15:43:20Z from
`/home/codex/repos/ns005-milestone-orchestrator`) is the machine output that replaces "I cleaned up":
24 entries, each with an **Ownership** verdict (`foreign` / `unproven`), apparent-owner path, age,
stale flag, and the exact user command to remove it. Foreign owners span
`ns005-cachetiers`, `w6-workflow-builder`, `w6-review-desk`, `ns005-genjobs`, `w6-planning-board`,
`ns005-streamdb`, `ns005-verify1250`, `wave5-deepseek` — i.e. **every prior wave leaked Postgres/Redis/
Garnet containers**, the oldest ~193,419,131 ms (~2.2 days) at generation. Three entries are
`unproven`/unknown owner and therefore must be left alone under the AGENTS.md hygiene rule.

---

## 6. Wave-5 pilot results worth carrying (the measured deltas)

From `wave-5/01-deepseek-v4-flash-pilot-0.0.5-canary.2.md`:

- **Three-run same-model table** (:20-36): tokens in 961,931 → 2,540,727 → **5,319,722**; steps 359 →
  416 → 487; `deno-doc` reads 0 → 17 → 19; **MCP 0/0/0, `plugin doctor` 0/0/0, `aspire otel` 0/0/0**
  against `curl` 41/35/38.
- **Article delta** (:42-48): 1,003 → 1,956 words; `<Figure>` 0 → 4; images 2 (both broken) → 7 (all
  rendering); authored diagrams 0 → 2 light/dark pairs; headings liftable from the brief **5 of 7 → 0
  of 5**. Cause named: "**Deleting the evidence checklist from the article section is what did it**"
  (:54).
- **The two tested levers for toolchain adoption both failed** (:71-80): wave 4 shipped better tooling
  (#1023 three-skill split, #1024 tooling bundle) → zero; wave 5 instructed its use and banned the
  alternative by name → zero. "Under time pressure the agent reaches for what it already trusts. The
  only untested lever left is **#1201**: give the MCP a capability with *no bash equivalent*… Doc
  search will always compete with `grep`; 'which subpath exports this helper' will not."
- **The `withForm` reframing** (:99-109): the first agent to actually reach for `withForm` found its
  failed-POST round-trip loses values and errors under hydration (20 min). "So the wave-4 zeros may
  never have been a discovery problem… **That reframes #1071 entirely.**"
- **Drift log ranked by time lost** (:126-133): `:3000` WSL hijack + stale DB address + cosmetic
  `/health` (~30 min, **environment not framework**); `netscript generate plugins` cannot emit a
  registry for a real custom job (~25 min); `withForm` hydration round-trip (~20 min, canary gap);
  custom stream through `useLiveQuery` refuses `.from` inference, multi-`from` returns flat union rows
  (~15 min); `netscript plugin remove sagas` fails on a bare alias (~3 min).
- **Adversarial review as a distinct lane** (:166-217): Codex GPT-5.6 Sol low, given the builder's
  brief, journal and the same docs bundle, told to **rank by capability left unused rather than code
  quality**. Its ranked findings traced four of six to the single 772-line island; it credited skipping
  sagas as correct for a single idempotent scheduled operation; it self-scored the build at **about
  two-thirds** of the eis-chat shape. The supervisor's own note: "That is a better diagnosis than mine.
  I flagged the 772-line island as a size problem; it identified the island as the *cause* of four of
  the other five findings."
- **Three stated measurement caveats** (:153-160): `agent init` was run by the supervisor, not the
  agent (wave-4 runs invoked it themselves 2× and 4×) — "plausibly reduces harness salience"; the
  `:3000` hijack is pure environment noise; **the OpenCode lane has no mid-run steering channel** — at
  1.5 h the agent explicitly asked for help and nothing could answer.

---

## 7. State conflicts and staleness (current-state-wins notes)

These are conflicts **within the Drive tree itself** — I did no GitHub reads in this pass, so all
issue/PR statements above are as-recorded, not as-verified.

1. **`projects/README.md:37-48` status table is stale.** It marks `billing-run`, `review-desk` and
   `workflow-builder` as "unused". Run packs exist for all three:
   - `runs/review-desk-gemini-3.6-flash-high/` — terminal **NO-GO** (`GO-NO-GO.md` tail: PR body
     false, RECORD false-complete, `/batch` 500, article unsynchronized; "Do not treat 13/13 tests as
     GO"; "Do not launch Kimi until GO + human authorization").
   - `runs/workflow-builder-kimi-k3-max/` — **NO-GO** at product SHA `27b92c67…` (`README.md:3`,
     `GO-NO-GO.md:1-40`): live run progression fails (open run page stayed queued >12 s, no steps until
     reload); active-run restart recovery fails (named-resource restart of `workers` PID 431479 →
     470841; interrupted run neither redelivered nor reconciled >6 min later); frozen-run publication
     incomplete (owner later committed Kimi's two frontmatter fixes as `43ee69a2…`, pushed
     `w6-loom-netscript`, opened draft PR **#25** — explicitly **not credited to Kimi**).
   - `runs/billing-run-grok-4.5-high-canary.16/` — **GO WITH CAVEATS** (`README.md`, `GO-NO-GO.md`):
     builder `openrouter/x-ai/grok-4.5` high, framework **`0.0.5-canary.16`**, product "Closebook" at
     `2aa89f103d…` == private `origin/main`, article `8b877b77…` as draft PR **#26** with green Vercel;
     formal **DeepSeek V4 Flash 0731 max** evaluator returned one terminal PASS, directly observing a
     new autonomous scheduled event in a 70-second window, 15 event-triggered month-close executions at
     ~63 s cadence surviving worker restart; 33 tests passed / 0 failed / 1 ignored.
2. **Canary drift.** Every top-level Wave-6 document pins **canary.13**
   (`KIMI-…RUNBOOK.md:8`, `CLAUDE-OPUS-5-…:226`); the newest run pack is on **canary.16**. Any plan
   built from the top-level docs alone will pin a stale canary.
3. **Kimi gate ordering was not honoured as written.** `PRIOR-RUNS-CAVEAT-MATRIX.md:91-94` and
   `KIMI-…RUNBOOK.md:21-35` state Kimi must not start before a Gemini GO. The Gemini pack is still
   NO-GO, yet a Kimi workflow-builder run completed and was audited. **[hypothesis]** a human override
   lifted the gate; the top-level documents do not record it, so the caveat matrix's "current decision
   boundary" section is superseded and should not be quoted as live policy.
4. **No top-level index card exists for the Kimi or Grok runs.** The `0N-<model>-<project>-<version>.md`
   convention (`CLAUDE-OPUS-5-…:131`) stops at `02-gemini-…`. Wave-6's top-level surface therefore
   under-reports its own state by two runs.
5. **Evaluator routing.** `HANDOVER:82-85` sets PLAN-EVAL `minimax/minimax-m3` and IMPL-EVAL
   `qwen/qwen3.8-max` (pending #1331); the billing-run pack used **DeepSeek V4 Flash 0731 max** as the
   formal implementation evaluator. Treat the routing table as unstable and re-read
   `.llm/harness/workflow/lane-policy.md` before quoting it.
6. **`PRIOR-RUNS-CAVEAT-MATRIX.md:14`** self-flags a gap: Wave 3 has no consolidated run report in
   this Drive folder — "do not invent precise comparisons from the prompt files alone."
7. **`MILESTONE-ORCHESTRATOR-HANDOVER` numbers are explicitly perishable**: local history ahead 155 /
   behind 71 (:13-14), milestone-24 issue list "re-query immediately before mutation" (:67-68),
   `ns-docs006` detached at `f7bcf77` while audited `origin/main` was `57c9b5a` (:95-96).

---

## 8. Load-bearing items for a Fable-5 remediation plan

Not recommendations — extraction of the items in this corpus that a remediation roadmap must resolve,
each with its source claim.

| Item | Evidence | Status in corpus |
|---|---|---|
| **#1201 — give MCP a capability with no bash equivalent** | `wave-5/01-…:78-80`; two adoption levers already failed | Named as "the only untested lever left" |
| **#1071 reframed** — `withForm` zeros may be a defect, not discovery | `wave-5/01-…:99-109` (hydration round-trip loses values/errors) | Reframing recorded; issue disposition unknown |
| **#1310 PGDATA collision** — third failure from one unchanged decision (`db` rebuilds the resource graph) after #1011 (fixed 0.0.4) and #1196 (fixed canary.10) | `01-…planning-board-0.0.4.md:57-82`; verified structurally against generated `apphost.mts`/`appsettings.json` | **open** as of that card |
| **#1333 eis-chat-grade frontend scaffold** + **#1335 whole-scaffold conformance umbrella** | `HANDOVER:160-161`; frontend failure diagnosed as *adoption/activation*, not missing scaffold (:132-136) | P0 / Backlog-Triage |
| **#1329 SSE docs/wire/event/OTEL envelope drift** and **#1326 durable stream producer never reconnects** | `HANDOVER:151-154` | P0 |
| **#1324 OpenCode ignores generated MCP config** | `HANDOVER:149` — directly undermines the PLAN-WAVE6 MCP-attachment gate | P0 |
| **`ui:add` / `contract add` / `service add-handler` / `derives_db_schemas` all zero for six waves** | `01-…planning-board-0.0.4.md:50-52` | unresolved |
| **Post-canary PR topology return to per-cluster draft PRs against `main`** | `HANDOVER:210-228` (owner directive) | must be reconciled into run plan/context pack/briefs before any post-cut dispatch |
| **Milestone rollover mechanics** (rename future milestones highest→lowest, free `0.0.6`, split milestone 24) | `HANDOVER:41-71`, `PROMPT:17-24` | read-only mapping first, execute once |
| **Container leak across every wave** | `leak-report.md` — foreign containers from 8 distinct worktrees, oldest ~2.2 days | reported, not remediated |
