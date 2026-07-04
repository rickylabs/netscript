# Roadmap re-forecast: beta.3 → 0.0.1-stable

Status: RATIFIED (pending final validation) — PLAN-EVAL **APPROVED** (OpenHands minimax-M2,
separate session, 2026-07-04). Owner ratifications **R1–R4 folded** 2026-07-04 (see §5 record);
**Q5 assumed deferred** pending explicit owner confirmation. Milestone/label moves in
§Reconciliation are reversible and applied on GitHub. Go-forward execution conforms to merged
harness V3 (§6).

Epic #391 · Draft PR #392 · baseline `1b42ba88` (post-beta.2). Evidence trail: `research.md`
(R1 open-issue sweep, R2 beta.2 delivery verification, R3 epic+code verification — all Opus 4.8,
code-verified against the `v0.0.1-beta.2` tag).

## 1. Where we actually are (evidence, not labels)

- **AI engine is real and shipped.** `@netscript/ai` (60+ files, 11 test files, ports/adapters,
  providers anthropic/openai-compat/ollama/openrouter, agent loop, MCP transports), `@netscript/
  fresh/ai` (MCP sandbox `createMcpSandboxHandler`), and the fresh-ui `ai` registry all landed and
  are published to JSR as of beta.2. This is the reusable AI layer eis-chat needs. **~85% complete.**
- **The AI *plugin* is a shell.** `plugins/ai` is scaffolder-only: **no `verify-plugin.ts`** (5/5
  reference plugins ship one), **no `ai` case in `scaffold.runtime`** (`extension-axes.ts` PLUGIN
  enum has no `ai`; `runtime-gates.ts` has no `ai` gate), and the `/v1/ai` oRPC contract
  (`plugin-ai-core/.../v1/ai.contract.ts`, genuinely typed) is **defined but unimplemented** — the
  scaffolded `stream-proxy.stub.ts` is a raw POST that bypasses the contract. This is #388. **~10%.**
- **The acceptance record is unreliable.** beta.2 auto-closed #260/#261/#343 with their `gate:e2e`
  boxes unchecked (the #260→#388 exemplar is not isolated), and merged 4 full implementations under
  stale "planning-only / no product code" bodies (#359/#374/#363/#357). The diff is the only
  trustworthy delivery record. Process fix = #387 close-gate.
- **Deployment beta-tier is real; one lane is dead.** Deno Deploy, bare-metal systemd, `deno
  compile`, secrets/rollback/health seam all landed and runnable (S1–S8 #337-344 CLOSED). But the
  **Aspire Docker/Compose target is NOT registered** in `DEFAULT_DEPLOY_TARGETS` → `netscript deploy
  docker/compose` fails to resolve at runtime (dead lane). **No deploy target has any e2e.** Stable
  tier (k8s/Azure/HA, #345-348) not started.
- **DB is beta-adequate.** Prisma 7.8 classic Zod-gen path; pg/mssql/mysql adapters present; no
  Turso/libsql. Prisma-Next (#313) is a locked design, deliberately deferred — **not** a beta or
  stable blocker per #301/#313.
- **Repo/process maturity is mid-flight.** #301 ~35% (2/9 sub-epics closed; #332 172a-2-SOUND
  soundness DONE). Doctrine #305, stale-elim #307, release/API #309 open; harness-V3 #389's
  implementation **merged to main** (`eeaff336`, PR #390 — epic close-out + adoption remain).
  Bench/positioning #302/#303 proceed as a **post-stable fast-follow** (R1 ratified) — they prove
  the leadership claim but no longer gate the stable cut; the rest gate repo maturity, not eis-chat
  dogfoodability.

**The single load-bearing gap between here and a dogfoodable stable is #388** (+ the #387 guardrail
that let it be reported done). Everything else is either AI depth, production-infra, or the
leadership bench.

## 2. What defines each cut (Aspire-style — themes, not buckets)

| Cut | Theme | One-line rationale |
| --- | --- | --- |
| **beta.3** | **AI plugin flagship parity + acceptance integrity** | Close the one load-bearing dogfood gap (#388) and fix the process that let it hide (#387). Unblocks eis-chat. **eis-chat dogfood readiness IS the beta.3 acceptance bar (R3 ratified).** |
| **beta.4** | **AI depth + generative UI** | Once the plugin is dogfoodable, make the AI stack best-in-class: memory, retrieval, orchestration, skills, gateway, generative UI. |
| **beta.5** | **Deployment hardening + repo/process maturity** | The non-AI production-readiness infra: deploy stable tier, doctrine v2, stale-elim, harness V3 close-out. **Stays a distinct cut (R2 ratified)** — not folded into beta.4 or stable. |
| **stable** | **Production gates + release readiness** | API-stability/deployability CI gates (**bare-metal systemd path, R4 ratified**) + docs + zero unowned arch-debt. Bench leadership (#302) is a **post-stable fast-follow (R1 ratified)**, not a gate. |

### beta.3 — "AI plugin flagship parity + acceptance integrity"

**Acceptance bar (R3 ratified): eis-chat dogfood readiness.** beta.3 cuts when an eis-chat-shaped
app can build a chat product on the scaffolded AI plugin without hand-rolling AI logic — #388
flagship parity plus the #380/#379/#219 seams are that bar. Memory/retrieval (#269/#270) remain
beta.4 depth, not part of the bar.

Scope (the dogfood-unblock cut):
- **#388** flagship parity — `ai` case in `scaffold.runtime`, `verify-plugin.ts`, in-repo `/v1/ai`
  implementation of `aiContractV1` + contract-soundness test, scaffolder-golden + doctor tests,
  parity review. **[L, highest-criticality]**
- **#387** close-gate — enforce gate:e2e/acceptance-checked before auto-close. **[S, high-leverage]**
- **#380** E15 `composeSystemPrompt` seam — foundational for the plugin's prompt assembly. **[M]**
- **#379** FA4 `createMcpAppCallHandler` — completes the shipped FA3 sandbox + FB4 widget. **[M]**
- **#219** durable-CHAT anchor (the #238 anchor) — chat is the eis-chat use case. **[M]**
- **#376** workers health-check job unresolvable under thin-plugin surface — real correctness bug.
  **[S]**
- **#393** (filed) Aspire compose target unregistered — register in `DEFAULT_DEPLOY_TARGETS` so the
  docker/compose lane resolves. **[S, bug]**
- **#394** (filed) deploy e2e gate absent — add at least one deploy target to scaffold.runtime (or a
  deploy e2e suite), **bare-metal (`systemd` + `deno compile`) first (R4 ratified)** since that is
  the stable deployability-gate path. **[M]** (closes the "every deploy target has zero e2e" gap;
  partial-scope, tracks to stable's deployability gate.)
- **#238** AI-stack epic — terminal umbrella, stays until its last beta child lands.

### beta.4 — "AI depth + generative UI"
Scope (differentiation — makes the flagship state-of-the-art):
- **#247** E8 orchestration (fan-out + bounded-cycle) **[M]**
- **#246** E7 SkillLoaderPort (SKILL.md parser + progressive disclosure) **[M]** — moved from beta.3
  (depth, not floor)
- **#269** E10 MemoryPort · **#270** E11 RetrieverPort **[M each]** — moved from beta.3 (label↔body
  said post-v1)
- **#248** E9 OTel GenAI/MCP semconv adapter **[M]** — moved from beta.3 (depth)
- **#262** P5 `--gateway` centralized AI service **[M]**
- **#290** P2-follow `--mcp` scaffolder + e2e variant **[S]** — E5(#246)-gated; de-dup vs #388
- **#257** FB4 mcp-ui-widget island **[M]** — moved from beta.3
- **#256** FB3 paced-reveal streaming-UX hooks **[S]** — pulled from stable (belongs with AI-UX depth)

### beta.5 — "Deployment hardening + repo/process maturity"

**Stays a distinct cut (R2 ratified)** — not folded into beta.4 or stable; it keeps its own
milestone and scope as the staging boundary between the AI cuts and stable.

Scope (non-AI production-readiness infra):
- **#345** Deploy-S9 bare-metal HA · **#346** Deploy-S10 k8s/Azure/image [**L**] · **#347** S11
  CI/CD templates · **#348** S12 one-click + release-skill integration — with **bare-metal
  systemd as the priority lane (R4)**, since it graduates into the stable deployability gate
- **#305** S4 doctrine revamp · **#306** S5 harness+skills revamp · **#389** harness V3
  (implementation merged `eeaff336`/PR #390; epic close-out + program-wide adoption remain) ·
  **#307** S6 stale-elim wave-1 · **#303** S2 enterprise maturation
- **#327** deployment epic — terminal umbrella for the deploy children

### 0.0.1-stable — "Production gates + release readiness"
Scope (the release — #301's stable criteria as amended by R1):
- **#309** S8 release-eng — API/semver policy + public-surface-diff CI gate + deprecation policy
- **Deployability gate (R4 ratified)** — the "verified production deployment path" is **bare-metal
  (`systemd` + `deno compile`)**; the CI deployability gate proves that path (graduating from the
  beta.5 deploy work + #394's bare-metal-first e2e). **Deno Deploy remains a supported tier but is
  not the stable gate.**
- **#232** docs coverage & accuracy umbrella
- **#258** FB5 generative-ui renderer · **#271** E12 skill-authoring gate · **#272** FB6 MCP-App
  bridge — deferred AI depth that lands with the stable AI surface
- Zero unowned arch-debt
- **#302** S1 positioning + `netscript-bench` — **post-stable FAST-FOLLOW (R1 ratified), not a
  stable gate.** Run-1 leadership numbers + the cross-framework batch publish after the stable cut
  (work may proceed in parallel, but it must not block the cut). #301's "hard gate" framing is
  loosened accordingly (epic-body amendment tracked as an owner follow-up). Milestone moved
  stable → Backlog / Triage (reversible) to keep the stable milestone = the cut's true gate set.
- **#313** Prisma-Next (**Q5: assumed deferred** — see §5) + #314-318 gaps + #349/#350 deploy-WATCH
  — remain **Backlog** (deferred; not stable blockers)

## 3. ETA per milestone (with reasoning)

Cadence note (memory `incremental-beta-cadence`): 0.0.1 ships as rolling betas; beta = minimal
cuttable bar, cut ASAP; **stable is the real gate.** ETAs are scope-completion estimates for a
supervised multi-lane program (WSL Codex daemon slices + OpenHands eval), not calendar promises.

| Milestone | Scope size | ETA (from 2026-07-04) | Reasoning |
| --- | --- | --- | --- |
| **beta.3** | 1×L + 3×M + 3×S + 1 epic | **~1.5-2 weeks** | #388 is the pacing item (L) but the AI engine it binds to is already built + tested; the rest are M/S seams parallelizable across Codex lanes. Compose-fix + #387 are quick wins. |
| **beta.4** | ~6×M + 2×S | **~2-3 weeks after beta.3** | AI-depth seams are independent ports (memory/retrieval/orchestration/skills) — high parallelism, but each needs contract+impl+tests. Gateway (#262) is the integration risk. |
| **beta.5** | 1×L + several M | **~3-4 weeks after beta.4** | k8s/Azure (#346) is L and infra-heavy; doctrine/harness/stale-elim are process-M and can run parallel to deploy. |
| **stable** | gates + docs + deferred AI depth | **~2-3 weeks after beta.5** | With bench (#302) out of the gate path (R1), the pacing items are the API/surface-diff gate, the bare-metal deployability gate (R4, mostly graduating from beta.5), #232 docs, and the FB5/E12/FB6 AI-surface closeout — all M-sized and partly landable during beta.5. |

Rough end-to-end to stable: **~9-12 weeks** of program throughput. Bench leadership (#302) runs on
its own external-compute-bound track and publishes as a **post-stable fast-follow (R1)** — it no
longer sits on the critical path.

## 4. GitHub reconciliation (reversible — applied)

Sanity-check of pre-applied moves: #388/#387/#219→beta.3 ✓, #262/#290/#247→beta.4 ✓, #389→stable →
**re-forecast to beta.5** (harness V3 is repo-maturity infra, not a stable-release gate), #219→beta.3
✓.

Applied moves (all reversible; see worklog for exact `gh` calls):

| Issue | From | To | Reason |
| --- | --- | --- | --- |
| #246 E7 SkillLoader | beta.3 | beta.4 | AI depth, not the correctness floor |
| #248 E9 OTel | beta.3 | beta.4 | AI depth |
| #257 FB4 mcp-ui-widget | beta.3 | beta.4 | AI-UX depth |
| #269 E10 Memory | beta.3 | beta.4 | body says post-v1; label↔body contradiction |
| #270 E11 Retriever | beta.3 | beta.4 | body says post-v1; label↔body contradiction |
| #256 FB3 paced-reveal | stable | beta.4 | belongs with AI-UX depth cut |
| #345/#346/#347/#348 Deploy S9-S12 | stable | beta.5 | staged as the deploy-hardening cut before stable |
| #305/#306/#307/#303 maturity | stable | beta.5 | repo/process maturity infra cut |
| #389 harness V3 | stable | beta.5 | program maturity, not a stable-release gate |
| #327 deployment epic | Backlog | beta.5 | terminal umbrella for the deploy cut |
| #295 Aspire dogfood proof | beta.3 | Backlog | evidence-only, never merges to main; external-dep |
| #319/#320 Aspire Layer A/B | beta.3 | Backlog | gated on external microsoft/aspire#16218 — can't gate a beta |
| #309 release-eng | beta.3 | stable | API-stability/surface-diff gate is a stable criterion |
| #302 bench | stable | Backlog / Triage | **R1 ratified (2026-07-04): post-stable fast-follow, not a stable gate** — keeps the stable milestone = the cut's true gate set; reversible |

Ratification-driven reconcile (applied 2026-07-04, after PLAN-EVAL): the #302 move above; #394
stays beta.3 but its scope is re-pointed **bare-metal-first** (R4 — comment posted on #394); #313
confirmed already at Backlog (Q5 assumption); no other moves needed — R2 (distinct beta.5) and R3
(beta.3 dogfood bar) match the forecast as applied.

New milestone created: **`0.0.1-beta.5`** (staging boundary between AI depth and stable).

New issues filed (code defects found by the sweep — NOT fixed here):
- **#393** bug: Aspire compose deploy target not registered in `DEFAULT_DEPLOY_TARGETS` (beta.3, `type:fix`, `area:aspire`/`area:cli`, p1).
- **#394** test: no deploy target has a scaffold.runtime/e2e gate (beta.3, `type:test`, `area:cli`, `gate:e2e`, p1).
- Taxonomy fixes: #375 (`type:feat`/`area:aspire`/p3), #376 (`type:fix`/`area:plugins`/p2).

Resulting distribution (open, post-reconcile + post-ratification): **beta.3=9**
(219,238,376,379,380,387,388,393,394) · **beta.4=9** · **beta.5=10** · **stable=8** ·
**Backlog=15** (#302 moved per R1). Each milestone now reads as a coherent theme rather than a
leftover bucket.

## 5. Owner ratification record (2026-07-04, post-PLAN-EVAL)

The five strategic questions were surfaced (not self-finalized) at PLAN-EVAL; the owner ratified
R1–R4 on PR #392 after the PLAN-EVAL APPROVED verdict. Folded into §§1–4 above.

1. **Stable definition — RATIFIED: bench = FAST-FOLLOW.** Bench leadership (#302) is a post-stable
   fast-follow, **not** a hard stable gate; stable cuts on production-readiness. Any "hard gate"
   framing on #301 is loosened accordingly (epic-body amendment tracked as an owner follow-up).
   Applied: stable theme/scope + ETA reworked; #302 milestone stable → Backlog / Triage.
2. **Cut sequence / beta.5 — RATIFIED: KEEP DISTINCT.** beta.5 stays its own milestone with its own
   scope (deployment hardening + repo/process maturity); not folded into beta.4 or stable.
3. **eis-chat dogfood bar — RATIFIED: beta.3 IS THE BAR.** eis-chat dogfood readiness is the beta.3
   acceptance bar, anchored on #388 flagship parity + the #380/#379/#219 seams. Memory/retrieval
   stay beta.4 depth.
4. **Deployment stable gate — RATIFIED: BARE-METAL systemd.** The stable "verified production
   deployment path" gate is **bare-metal (`systemd` + `deno compile`)**, not Deno Deploy. #394's
   deploy e2e is reprioritized bare-metal-first as the gating path; Deno Deploy remains a supported
   tier but is not the stable gate.
5. **Prisma-Next — OPEN (assumed deferred).** #313 is assumed to stay fully deferred (Backlog,
   out of the beta.3→stable critical path — the multi-db guarantee holds on the existing
   pg/mssql/mysql adapters) **unless the owner says otherwise**. Not built into any cut's scope.

## 6. Operating model — harness V3 conformance (go-forward)

Every cut in this roadmap executes under the merged **harness V3** doctrine (`eeaff336`, PR #390,
epic #389); this run itself dogfoods it. The load-bearing patterns:

- **Tracked runs.** Each slice/epic runs from a tracked run dir `.llm/runs/<run-id>/` with a
  `supervisor.md` identity file (model, session, worktree, baseline, lane table). No untracked
  `.llm/tmp/run/` artifacts; `.llm/tmp/` is scratch only.
- **Tiered lane policy** (`.llm/harness/workflow/lane-policy.md`): Tier A Fable 5 supervisor
  (decisions/orchestration/GitHub surface) · Tier B Opus 4.8 sub-agents (research/analysis/doc
  prose) · Tier C Sonnet-5 Workflows (batch/mechanical; `workflow.js` committed to the run dir
  before execution) · Tier D WSL Codex (framework/plugin/tool source slices, daemon-attached) ·
  Tier E OpenHands evaluators (PLAN-EVAL minimax-M3 / IMPL-EVAL qwen-3.7-max). Invariants:
  **generator-session ≠ evaluator-session**, and the **A1 slice-review gate** — no implementation
  lane self-certifies; the Tier-A supervisor substantively reviews each slice before its sign-off
  commit.
- **Stage-labeled draft PRs.** Draft-PR-on-start with an explicit Definition-of-Done; exactly one
  `status:` label, moved in the same action as each structured phase comment
  (`status:research → plan → plan-eval → impl → impl-eval → ready-merge`).
- **#387 close-gate.** `status:ready-merge` requires IMPL-EVAL PASS evidence + a complete DoD
  checklist + every referenced issue's acceptance and `gate:` checkboxes checked with linked
  evidence. A plan-only artifact set never satisfies an impl DoD (the #260 failure mode this run
  was chartered to prevent).
- **Issue/milestone conventions** (netscript-pr): namespaced taxonomy
  (`type:`/`area:`/`priority:`/`epic:`/`gate:`/`status:`, exactly one `status:`); epics titled
  `Epic: <name>` (`type:umbrella` + `epic:<slug>`), children `[<epic-slug> S<n>] <slice>` resolved
  by exactly one PR carrying `Closes #N`; **never a closing keyword targeting an epic/umbrella** —
  epics close by hand when all children are done. All milestone scoping in this document uses the
  beta.3 / beta.4 / beta.5 / 0.0.1-stable / Backlog-Triage set per that mapping.
