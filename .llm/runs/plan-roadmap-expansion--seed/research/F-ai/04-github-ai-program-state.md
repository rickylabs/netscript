# F-ai Stage-B: GitHub program state for the AI suite

Cell scope: map the live GitHub state of Epic #238 (NetScript AI Stack) and #388 (plugin-ai
flagship parity), sweep all open AI-related issues, and flag supersede/keep candidates for the
new F-ai roadmap topic. PLANNING-ONLY — no issues/PRs touched, no git operations run.

Tooling note: Windows `gh` has no valid token in this environment; all reads went through
`wsl.exe -u codex -e bash -lc 'cd /tmp && gh ...'`. `gh api user` confirmed auth as `rickylabs`
before starting. All reads below are live as of 2026-07-04.

---

## 1. Epic #238 — "NetScript AI Stack — first-class AI runtime, chat & plugin seams (anchor #219)"

**State:** OPEN · **Labels:** `enhancement`, `type:umbrella`, `area:plugins`, `epic:ai-stack` ·
**Milestone:** `0.0.1-beta.3`.

### Scope (2-line digest)

A **five-home architecture** for AI in NetScript: (1) NEW standalone `@netscript/ai` engine core
(providers/agent-loop/tools/MCP/embeddings, adapter-by-subpath like `@netscript/kv`), (2) NEW
`@netscript/fresh/ai` subpath for durable-chat client/SSR/proxy runtime, (3) an extended
`@netscript/fresh-ui` `ai` registry for presentational chat components, (4) a thin
`packages/plugin-ai-core` contract package, and (5) an **optional** `plugins/ai` centralized
AI-gateway plugin — all grounded in a live dogfood consumer (`rickylabs/eis-chat`) whose
hand-rolled AI stack is being migrated onto these seams slice by slice, deleting the bespoke code
as each seam lands. Anchor bug is #219 (durable-CHAT primitive gap + a streams gzip-mislabel bug,
root-caused and fixed as #239/PR #265).

### Body structure

The issue body is a full architecture plan authored by "Fable 5" (rev. 2), citing concrete file
paths in both the NetScript reference plugins (auth/workers/streams/kv/sdk/fresh-ui) and the
live `eis-chat` repo. It resolves 6 open questions (token accounting, `outputSchema` vs
chart-fence, embeddings/vision adapter shape, `VectorStorePort` deferred out of v1, chat-route
authz hook, promoting plugin-thinness/base-contract law to doctrine ch.11) and ends with a
**Sub-issue DAG (rev.4)** carving #239 and #240–#263 into four clusters:

- **ENGINE** (`@netscript/ai`): #240–#248 (E1–E9, E7 SkillLoaderPort, E9 OTel)
- **`@netscript/fresh/ai`**: #249–#252 (FA0–FA3)
- **fresh-ui `ai` registry**: #253–#258 (FB0–FB5)
- **`plugin-ai` accelerator + doctrine**: #259–#263 (P1–P3, P5 deferred, P6 doctrine)

### Comment history (10 comments) — the live-state deltas that matter

1. **eis-chat POC/dogfood framing** — every sub-issue is annotated with the concrete hand-rolled
   eis-chat implementation as design input; the seam must "absorb the POC," and eis-chat is the
   designated dogfood-migration target per seam (delete the workaround once migrated).
2–6. **Five "AI-stack candidate" write-ups** posted from eis-chat, each a distinct seam NOT
   covered by #240–#263 at the time:
   - `MemoryPort` (vector-recalled distilled agent memory, per-turn relevance recall) → became
     **#269 (E10)**.
   - `RetrieverPort` (hybrid vector+keyword retrieval, title-boost, citation mapping) → became
     **#270 (E11)**.
   - Usage/cost rollups + message feedback (product analytics) → became **#266**, ruled
     **track-only, no impl** (product decision — NOT built as a framework seam).
   - Skill authoring tools (`create_skill`/`use_skill`, the *write* side of SkillLoaderPort) →
     became **#271 (E12)**, deferred to `0.0.1-stable`.
   - Interactive MCP-App bridge (bidirectional widget-action → `tools/call` → re-render) →
     became **#272 (FB6)**, deferred to `0.0.1-stable`.
7. **"rev.5 scope ruling landed — DAG updated"** — folds the eis-chat candidates in: #239 merged
   (PR #265); files **#267 (SR2, CRITICAL, `wave:v1-min`)** — `STREAM_NOT_FOUND` fresh-session
   race, and **#268 (SR1, `wave:v1`)** — client-abort propagation, both siblings to #239 in the
   same `proxyHandler`. Both are now **CLOSED**. Elevates two plane-level invariants
   (content-encoding-must-describe-bytes-sent; one-projection law).
8. **Off-topic spam comment** (a dependency/security tooling pitch for "VulnLedger" scanning
   Python AI deps) — **not signal**, ignore for roadmap purposes.
9. **"Epic delta — eis-chat reference-implementation gate closed (2026-07-04)"** — a mandatory
   re-sweep of eis-chat at a newer HEAD (`b65094a`, pinned to NetScript 0.0.1-beta.1) plus both
   repos' issues/PRs found the epic ~25 eis-chat PRs behind current. **No structural
   invalidation** of the five-home split, but:
   - **New sub-issues filed:** **#378 (E2b)** openrouter+ollama providers (CLOSED, shipped in
     beta.2), **#379 (FA4)** `createMcpAppCallHandler` (widget action → `tools/call`, OPEN,
     `wave:v1`), **#380 (E15)** composable system-prompt assembly seam (OPEN, `wave:v1`).
   - **Re-prioritized UP** from deferred to `0.0.1-beta.3`/beta.4 depth: #269 (E10 MemoryPort)
     and #270 (E11 RetrieverPort) — eis-chat proved memory/retrieval are its *primary* context
     strategy, not a nicety.
   - Scope corrections recorded against #241, #245, #246, #252, #257, #258, #260, #261.
   - Cross-lane flags routed OUT of the AI epic to the deployment/apphost lane (multi-process KV
     self-provisioning #371/#349, Aspire `WithMcpServer` apphost gap).
10. **"Correction: the AI plugin is a flagship, not a thin-by-design afterthought"** — the owner
    directive (2026-07-04) that also became the whole body of **#388** (see §2). Explicitly
    corrects language in this epic and in `plugins/ai/README.md` that had treated `plugins/ai`'s
    missing e2e/hardening as acceptable because it is "deliberately thin." Consequence: baseline
    parity/hardening (#388) is now flagship beta.3 work, not deferred; #262 (centralized gateway)
    and #290 (`--mcp`/skill scaffolder) move `stable`/`wave:defer` → up to **beta.4**. Names the
    root-cause process gap: #260 was closed with its `gate:e2e` box unchecked and the gate never
    wired — tracked as companion issue **#387** ("process: gate issue closure on verified
    acceptance").

### What remains open under #238 (18 open issues incl. #238 and #219 anchor)

See the full issue-map table in §3 — every open AI issue in the repo already carries the
`epic:ai-stack` label, so the epic-scoped list below IS the complete open-AI-issue sweep (see §4
for the confirming negative sweep).

---

## 2. #388 — "[AI-stack] plugins/ai: state-of-the-art flagship parity"

**State:** OPEN · **Labels:** `type:feat`, `gate:e2e`, `epic:ai-stack`, `area:plugin-ai`,
`status:plan`, `priority:p1` · **Milestone:** `0.0.1-beta.3`.

**One-line scope:** close the gap between `plugins/ai`'s current "deliberately thin" state and
the workers/sagas/triggers quality bar — a `scaffold.runtime` e2e case for `ai` (default +
`--persist-threads` + `--mcp`), a `verify-plugin.ts`, an in-repo `/v1/ai` contract
implementation + contract-soundness test (currently the contract exists in `plugin-ai-core` but
is unexercised — the scaffolded `stream-proxy.stub.ts` bypasses it with a raw POST handler),
scaffolder golden tests for all 7 emitters, a `plugin doctor` test, and a recorded parity review
vs. workers/sagas.

**Relation to #238:** #388 IS the epic's flagship-correction comment (§1, comment 10) made into
its own tracked issue — it is the direct consequence of the owner's "thin is a layering choice,
not a quality-bar exemption" ruling. It supersedes the framing (not the content) of the epic's
original P2/P5 slices: #260/#261 already shipped the manifest/scaffold/registry-codegen, but with
`gate:e2e` falsely checked off — #388 is the fix for that false-closed acceptance, paired with
the process guardrail **#387** (unlabeled `epic:ai-stack` but tightly coupled — files the
"gate issue closure on verified acceptance" process fix so this class of gap can't recur).

---

## 3. Full open-issue map — `epic:ai-stack` label (18 open, confirmed complete — see §4)

| # | Title (short) | Labels (non-epic) | Milestone | Scope (1 line) | Relation to #238 |
|---|---|---|---|---|---|
| 238 | Epic: NetScript AI Stack (anchor #219) | `type:umbrella`, `area:plugins` | beta.3 | The umbrella itself | — |
| 219 | streams: no durable-CHAT integration (anchor bug) | `wave:v1`, `area:ai-core`, `type:feat`, `area:service` | beta.3 | Root anchor: StreamDB-shapes vs Durable-Sessions confusion + gzip bug | Epic's anchor; #239/#265 shipped the gzip fix, #267/#268 shipped the sibling race/abort fixes — anchor issue itself stays open pending the `@netscript/fresh/ai` doc table (§2.1 of the plan) landing |
| 246 | E7 SkillLoaderPort (SKILL.md parser + progressive disclosure + triggers) | `wave:v1`, `area:ai-core`, `gate:jsr` | beta.4 | Read-side skill loading; scope corrected to also ship the E4 tool-triad (`use_skill`/`read_skill_resource`/`create_skill`) as built-ins | ENGINE cluster |
| 247 | E8 orchestration primitives (fan-out + bounded-cycle) | `wave:defer`, `area:ai-core`, `gate:jsr` | beta.4 | Multi-agent fan-out/cycle orchestration | ENGINE cluster, deferred |
| 248 | E9 OTel GenAI/MCP semconv telemetry adapter (`./otel`) | `wave:v1`, `area:ai-core`, `area:telemetry`, `gate:jsr` | beta.4 | Tracing spans for AI calls (NOT product analytics — see #266) | ENGINE cluster |
| 256 | FB3 fresh-ui paced-reveal streaming-UX hooks | `wave:defer`, `area:fresh-ui` | beta.4 | Copy-source streaming-reveal hooks | fresh-ui registry cluster, deferred |
| 257 | FB4 fresh-ui mcp-ui-widget (themed sandboxed `ui://` iframe) | `wave:v1`, `area:fresh-ui` | beta.4 | Render MCP-UI widgets; now depends on FA4 (#379) to be interactive | fresh-ui registry cluster |
| 258 | FB5 fresh-ui generative-ui-renderer (recursive JSON→DS vocabulary) | `wave:defer`, `area:fresh-ui` | stable | Generic JSON-tree-to-widget renderer; scope note: LIFT `ui-spec.ts` verbatim, fold in raw-HTML escape hatch | fresh-ui registry cluster, deferred |
| 262 | P5 plugin-ai opt-in `--gateway` centralized AI service | `wave:defer`, `gate:e2e`, `gate:jsr` | beta.4 | Optional multi-app centralized-key gateway topology | plugin-ai cluster; **moved UP** from stable/defer to beta.4 by the flagship-correction comment |
| 266 | AI stack: usage/cost rollups + feedback (product analytics) | `wave:defer`, `area:telemetry` | Backlog/Triage | Billing/analytics rollups — **track only, no impl** (explicit product-owner call) | Rejected-as-framework-seam; stays a tracking issue only |
| 269 | E10 MemoryPort — vector-recalled distilled agent memory | `wave:v1`, `area:ai-core` | beta.4 | Relevance-recall memory store+recall over embeddings | ENGINE cluster; **re-prioritized UP** — eis-chat's primary context strategy |
| 270 | E11 RetrieverPort — hybrid vector+keyword retrieval + citation provenance | `wave:v1`, `area:ai-core` | beta.4 | Chunk store + hybrid fusion + citation mapping | ENGINE cluster; **re-prioritized UP**, LIFT eis-chat's scorer/chunker/query-cache |
| 271 | E12 skill authoring approval-gate contract (`create_skill`/`use_skill`) | `wave:defer`, `area:ai-core` | stable | Write-side of SkillLoaderPort w/ a safety/review gate | ENGINE cluster, deferred to stable |
| 272 | FB6 interactive MCP-App bridge (bidirectional widget-action) | `wave:defer`, `area:fresh-ui` | stable | Host-side `tools/call` routing + client `AppBridge` reconnect discipline | fresh-ui registry cluster, deferred to stable; superseded in dependency terms by FA4 (#379) landing first |
| 290 | P2-follow: plugins/ai `--mcp`/skill scaffolder + e2e variant | `wave:defer`, `area:plugin-ai` | beta.4 | Scaffolder flags depending on E5 (SkillLoaderPort/#246) | plugin-ai cluster; **moved UP** from stable/defer to beta.4 alongside #262/#247 |
| 379 | FA4 `createMcpAppCallHandler` route | `wave:v1`, `area:fresh` | beta.3 | The ACT half of interactive MCP Apps (widget action → `tools/call`, allowlist, stdio fallback, OTel) | `@netscript/fresh/ai` cluster; new from the epic-delta re-sweep |
| 380 | E15 composable system-prompt assembly seam | `wave:v1`, `area:ai-core` | beta.3 | Ordered SYSTEM-prompt sections (catalog/skills/memory/instructions) | ENGINE cluster; new from the epic-delta re-sweep |
| 388 | plugins/ai flagship parity (e2e/verify-plugin/`/v1/ai` impl/scaffolder+doctor coverage) | `gate:e2e`, `area:plugin-ai`, `status:plan`, `priority:p1` | beta.3 | See §2 | plugin-ai cluster; the flagship-correction consequence |

**Closed (21) — confirms the ENGINE/fresh-ai/fresh-ui/plugin-ai/doctrine foundation already
shipped:** #239 (anchor gzip fix, PR #265), #240–#245 (E1–E6), #249–#255 (FA0–FA2, FB0–FB2),
#259–#261 + #263 (P1–P3, P6 doctrine), #267/#268 (SR1/SR2 sibling proxy fixes), #278 (docs
capstone), #378 (E2b openrouter/ollama providers).

**Adjacent, not `epic:ai-stack`-labeled but directly coupled:** **#387** — "process: gate issue
closure on verified acceptance (stop false-closed acceptance)," `type:chore`, `status:triage`,
`priority:p2`, milestone beta.3. Filed as the process guardrail alongside #388 because #260's
`gate:e2e` box was checked off without the gate ever being wired. Relevant to F-ai only as
context for why #388 exists — it is a repo-process issue, not an AI-stack feature issue, so it
should NOT be pulled into the F-ai roadmap topic's issue set, only cross-referenced.

---

## 4. Confirming sweep — no orphan AI issues outside `epic:ai-stack`

Ran independent title/label searches beyond the epic label to catch anything mis-labeled:

- `"ai in:title" state:open` → same 18 issues as the `epic:ai-stack` label list (exact set
  match).
- `"chat in:title" state:open` → #219, #238 only (already covered).
- `"mcp in:title" state:open` → #257, #248, #290, #272 (already covered).
- `"genai in:title" state:open` → #248 only (already covered).
- `label:area:ai-core state:open` → #380, #271, #270, #269, #248, #247, #246, #219 (already
  covered — confirms `area:ai-core` is fully inside the epic).
- `label:area:plugin-ai state:open` → #388, #290, #262 (already covered).
- #278 (docs capstone, referenced in the beta.3 milestone description) → **CLOSED**, no open
  docs-only AI issue outstanding.

**Conclusion: the open-AI-issue surface in the repo is exactly the 18 rows in §3, plus the
process-guardrail #387 as a cross-reference.** There is no AI-related issue hiding outside
`epic:ai-stack`/`area:ai-core`/`area:plugin-ai`.

---

## 5. Supersede vs. keep — candidates for the F-ai roadmap (flagged, not decided)

This section flags candidates only; final supersession mapping is a later Stage-C/D decision.

**Likely KEEP as-is (already right-sized, just needs to be threaded into the new roadmap doc):**
- #388 (flagship parity) — freshly filed (2026-07-04), correctly scoped, `priority:p1`,
  `status:plan`. This is almost certainly the single highest-signal open issue for F-ai; the new
  roadmap should treat it as load-bearing, not supersede it.
- #379 (FA4), #380 (E15) — freshly filed from the epic-delta re-sweep, still `status:` unlabeled
  (no `status:triage`/`status:plan` yet — worth flagging for Phase-2 taxonomy pass), well-scoped,
  no rework needed.
- #269 (E10 MemoryPort), #270 (E11 RetrieverPort) — re-prioritized up, well-evidenced against the
  live eis-chat reference, should stay as-is.
- #267/#268/#239 (closed) — historical record, no action.

**Candidates the new F-ai roadmap may want to RE-SEQUENCE or MERGE (flag for Stage-C):**
- #262 (P5 `--gateway`) and #290 (P2-follow `--mcp`/skill scaffolder) were both bumped from
  `wave:defer`/stable to beta.4 by the same flagship-correction comment, alongside #247 (E8
  orchestration). If the new roadmap restructures beta.3/beta.4 boundaries, these three should
  move together — they were bumped as a single decision, not independently re-scoped.
- #271 (E12 skill-authoring approval-gate) and #272 (FB6 interactive MCP-App bridge) are both
  `wave:defer` → `0.0.1-stable`, both explicitly named as the harder/riskier half of a feature
  whose easier half already shipped or is in-flight (E7/#246 read-side skill loading; FA3/#252 +
  FB4/#257 one-directional MCP-UI render). Consider whether the new roadmap collapses these into
  a single "MCP-UI interactivity" and "skill write-path" tracking pair rather than two independent
  backlog issues, to keep the DAG legible.
- #258 (FB5 generative-ui-renderer) has an explicit scope note ("LIFT `ui-spec.ts` contract
  verbatim... fold in the sandboxed raw-HTML widget escape hatch") that reads like it may absorb
  scope from #257/#272 once those land — flag for a dependency-graph sanity check before Phase-2
  filing duplicates anything.

**Definitely KEEP, not superseded, but out-of-scope for F-ai's own issue set:**
- #266 (usage/cost analytics) — explicit product ruling to track-only. The new roadmap should
  reference it (so nothing re-proposes it as an AI-stack feature) but not re-open or reassign it.
- #387 (process guardrail) — cross-reference only, belongs to the process/harness lane not F-ai.

**No candidates found for outright supersession/closure** — every open issue in §3 was either
freshly filed post-re-sweep (2026-07-04) or explicitly re-validated by the epic-delta comment.
The epic's own "no structural invalidation" verdict on 2026-07-04 means the F-ai roadmap topic is
almost certainly an **additive/organizing** layer over this DAG, not a replacement for it.

---

## 6. netscript-pr taxonomy currently applied (for Phase-2 filing consistency)

Observed on the 18 open + 21 closed AI issues:

- **`type:`** — `type:umbrella` (#238 only), `type:feat` (everything else), `type:fix` (#267,
  #268 — closed), `type:chore` (#387, not epic-labeled), `type:docs` (#278 — closed).
- **`epic:`** — `epic:ai-stack` on every AI issue except #387 (cross-referenced, not labeled).
- **`area:`** — `area:ai-core` (the `@netscript/ai` engine cluster), `area:plugin-ai` (the
  plugin/gateway cluster), `area:fresh-ui` (registry cluster), `area:fresh` (the new #379),
  `area:plugins` (#238 umbrella only), `area:service` (#219, in addition to `area:ai-core`),
  `area:telemetry` (#248, #266), `area:docs` (#278, closed).
- **`wave:`** → milestone mapping observed in the wild, consistent with the netscript-pr skill's
  documented table: `wave:v1-min` → beta.1-ish critical (#267 closed), `wave:v1` → beta.3
  (#219, #246, #248, #257, #269, #270, #379, #380), `wave:defer` → beta.4 or stable depending on
  how "deferred" the item is (#247/#256/#262/#290 → beta.4; #258/#271/#272 → stable; #266 →
  Backlog/Triage). **Note:** this repo's actual wave→milestone mapping is finer-grained than the
  skill's 2-row table (`wave:v1` alone maps to beta.3 here, and `wave:defer` splits across
  beta.4/stable/Backlog depending on an explicit product ruling per issue) — Phase-2 filing
  should follow the observed per-issue precedent here over the skill's simplified table when the
  two disagree, since this is the live epic's own convention.
- **`priority:`** — only #388 carries an explicit `priority:p1`; #387 carries `priority:p2`.
  Most AI-stack issues carry no `priority:` label at all — Phase-2 may want to backfill this.
  s
- **`gate:`** — `gate:e2e` (#388, #262), `gate:jsr` (#246, #247, #248, #262) — flags which issues
  block on the e2e/JSR release gates specifically.
- **`status:`** — only #388 (`status:plan`) and #387 (`status:triage`) carry a `status:` label;
  every other open AI issue has **no `status:` label at all**. This is a taxonomy gap worth
  flagging for Phase-2: per the netscript-pr skill, every open issue should carry exactly one
  `status:`, and this epic's sub-issues largely predate that discipline being applied.
- **Milestones** — all open AI issues carry a real milestone (`0.0.1-beta.3`, `0.0.1-beta.4`, or
  `Backlog / Triage` for #266); none are milestone-less among the open set (only the two closed
  SR1/SR2 issues show `milestone: null`, presumably cleared on close).
