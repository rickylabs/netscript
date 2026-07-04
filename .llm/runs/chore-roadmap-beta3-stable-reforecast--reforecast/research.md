# Research — beta.3 → 0.0.1-stable roadmap re-forecast

Status: COMPLETE — all 3 sweeps (R1/R2/R3) landed and reconciled 2026-07-04.

## Method

Three parallel Opus 4.8 evidence sweeps (Tier B), each reporting to the supervisor:

- **R1 — open-issue sweep**: every open issue → real remaining scope, dedup, mis-milestoned,
  stale, already-done-but-open. Label/milestone claims are NOT trusted; each verdict cites evidence.
- **R2 — beta.2 PR verification**: the merged PRs in `v0.0.1-beta.1..v0.0.1-beta.2` → what each
  actually delivered vs claimed; false-closed acceptance flags (pattern: #260/#388).
- **R3 — epic completion + code dive**: true state of #301, #238 (+#388 parity), #327, #389,
  Prisma-Next DB migration, docs overhaul; verify in code: `plugins/ai` e2e presence, `/v1/ai`
  implementation, deploy targets; blockers to a dogfoodable stable for eis-chat.

Findings land below as each sweep reports.

## Supervisor inputs (read first-hand, 2026-07-04)

### #301 locked acceptance criteria (the forecast spine)

- **beta.x = correctness floor + repo maturity**: self-bench Run-1 (t1+t2 pass-rate ≥0.90 median,
  t1 turns ≤ NestJS median, rubric ≥0.50, zero harness-level failures); `e2e-cli-prod` +
  `scaffold.runtime` green as hard gates; 172a-2-SOUND plugin-service type-soundness fixed; public
  surface doc-linted; machine-agnostic tooling; doctrine v2 ratified w/ fitness in `arch:check`;
  stale-elim wave-1; one-shot deterministic `release:cut` proven by the cut itself.
- **stable = leadership + production-readiness**: bench leadership (t2 turns < all bare routers,
  ≤ Encore.ts; rubric ≥0.80; pass ≥0.95 t1–t3; composite top-2; reproduced Sonnet 5 + Opus 4.8;
  t3b ≥0.90); full cross-framework batch published; continuous self-bench per release; API/semver
  policy + public-surface-diff CI gate; deprecation policy; **≥1 verified production deployment
  path + CI deployability gate**; zero unowned arch-debt.
- #313 Prisma-Next: locked design, **explicitly NOT a beta blocker** (spec + gap tracker only).
- #301 children: #302 bench · #303 enterprise maturation · #304 de-rickylabs (closed?) · #305
  doctrine · #306 harness (→#389) · #307 stale-elim · #327 deployment · #309 release-eng · #313 DB.

### Milestone map at start (47 open; full list in worklog evidence)

- beta.3 (16): 219 238 246 248 257 269 270 295 309 319 320 376 379 380 387 388
- beta.4 (3): 247 262 290
- stable (16): 232 256 258 271 272 301 302 303 305 306 307 345 346 347 348 389 391(−this epic)
- Backlog (12): 234 266 313 314 315 316 317 318 327 349 350 375
- Notable oddity: deployment epic #327 sits in Backlog while its stable-criteria dependency
  ("≥1 verified production deployment path") is a stable hard gate; deploy S9–S12 sit at stable.

## R1 — Open issues (Opus 4.8, 48/48 swept, code-verified)

Verdict: **evidence held in reverse** — every "port/file exists" candidate is a no-op stub, so
NOTHING open is actually landed on main; **zero done-but-open, nothing to close on evidence**.
`packages/ai/deno.json` exports have NO `./skills`, `./orchestrate`, `./otel` subpaths → the AI
"port" issues are NOT done despite stub files existing.

Key code-verified findings:
- **#388** flagship parity confirmed REAL blocker: no `plugins/ai/verify-plugin.ts` (5 other
  plugins have one), 0 `ai` gates in `runtime-gates.ts`, `/v1/ai` is only `stream-proxy.ts` raw POST
  bypassing the contract. This is the #260/#388 exemplar, verified in code.
- **#376** real correctness bug: `plugins/workers/jobs/health-check.ts` exists in framework but the
  thin-plugin surface doesn't copy it to userland → Module not found. Carries NO labels.
- **#246 E7 SkillLoaderPort / #269 E10 Memory / #270 E11 Retriever / #248 E9 OTel / #380 E15
  composeSystemPrompt** — all interface stubs or absent; unbuilt.
- **#234 HTTP/2** — listener ALREADY has cert/key + HTTP2 negotiate (service-listener.ts L56-116);
  only "by default" + dev-cert provisioning remains. Body is stale.
- **#379 FA4** absent, but FA3 `createMcpSandboxHandler` IS shipped in fresh/ai.

### Mis-milestonings to fix (reversible)
1. **#269 E10 Memory**: labeled wave:v1→beta.3 but body header says "deferred — post-v1" → **beta.4**.
2. **#270 E11 Retriever**: same label↔body contradiction → **beta.4**.
3. **#319 Aspire Layer A**: beta.3 but gated on external microsoft/aspire#16218 (MS 13.5, unmerged)
   — external-vendor merge can't gate a NetScript beta → **Backlog** (or stable).
4. **#320 Aspire Layer B**: beta.3, upstream tracking issue not even filed → **Backlog**.
5. **#295 Aspire dogfood proof**: beta.3 but branch never merged (evidence-only, nothing on main) →
   **Backlog**.
- Taxonomy violations: **#375, #376** carry zero `type:`/`area:` labels; #376 is a real p1 bug.

### Dedup
- **#290 ⊂ #388**: #290 (`--mcp` scaffolder + e2e variant) is a subset of #388's missing `ai`
  scaffold case, but E5(#246)-gated so genuinely deferred. Keep #388 flagship; #290 tracks the
  E5-dependent `--mcp` tail only. De-conflict so both don't independently wire the `ai`
  scaffold.runtime case.

### Pre-applied-move sanity check
#388/#387/#219→beta.3 ✓ · #262/#290/#247→beta.4 ✓ · #389→stable ✓. ADD #269/#270→beta.4.

## R2 — beta.2 merged PRs (Opus 4.8, verified against v0.0.1-beta.2 tag)

Window: beta.1 (2026-07-03 10:29) → beta.2 (2026-07-04 08:31) — a ~1-day cut, 22 squash-merged PRs.
**Two distinct hygiene failures corrupt the label/body record; the diff is the only trustworthy
delivery record:**
- (a) **auto-closing issues whose `gate:e2e` box is unchecked** — #260 (PR #377, THE exemplar),
  #261 (PR #381), #343 (PR #363). All fold into #388 / new deploy-e2e scope.
- (b) **merging full implementations under stale "planning-only / no product code" bodies** — #359
  (Deno Deploy, 20 files), #374 (S5 secrets seam, 29 files), #363 (Aspire compose), #357 (doctrine
  entry). Bodies falsely say "no code"; code shipped.

### NEW critical code finding (file a bug)
- **#343 / PR #363: Aspire Docker/Compose deploy target is NOT registered.**
  `DEFAULT_DEPLOY_TARGETS` contains only `windows-service`, `linux-service`, `deno-deploy`. The
  adapter + CLI commands + config schema exist but are unwired, so `netscript deploy docker/compose
  <verb>` fails to resolve its target at runtime — the compose lane is **dead at beta.2**. Issue's
  E2E ("compose up boots") unmet. → file a beta.3 bug.
- **Zero e2e coverage for BOTH the AI plugin AND every deploy target** — no deploy target has a
  scaffold.runtime e2e anywhere in `packages/cli/e2e/`.

### False-close candidates (ranked)
1. **#260 → #377** — exemplar, confirmed (re-filed #388, OPEN).
2. **#261 → #381** — same `gate:e2e` unchecked; folded into #388.
3. **#343 → #363** — compose target unregistered + no deploy e2e → non-delivered runtime path.
4. **#372 → #373** — Docker-less **Garnet-executable** shared-cache arm (USER priority) unit-tested
   but never live-E2E'd (both hosts have Docker → Auto picks container). Only manual eis-chat proof.
5. (soft) **#342 → #359** — E2E met only via mocked adapter test (issue explicitly permitted); no
   live Deno Deploy push exercised.
- No orphan manual closes in the window; AI-core #240-#259/#263 sit in the beta.1 tree (beta.2
  published, didn't author).

### Net beta.2 delivery (engineering terms)
- **AI foundation published to JSR first time**: `@netscript/ai` + `@netscript/plugin-ai-core`
  (revert of #362 publish:false). Core landed in beta.1 tree; beta.2 published + finished layers.
- New providers OpenRouter+Ollama w/ ReachabilityPort preflight (#382); embeddings+vision (#356).
- `@netscript/fresh/ai` MCP sandbox `createMcpSandboxHandler` (#336) — fully delivered + evaluated.
- `plugins/ai` userland shipped (manifest + 7 scaffolders + v1 contract + registry codegen
  #377/#381) but stays publish:false, no e2e / no verify-plugin / no in-repo /v1/ai impl (→#388).
- Deploy lane REAL + partially runnable: DeployTargetPort 7-op (#370); Deno Deploy adapter
  registered+runnable (#359); bare-metal systemd + `deno compile`, scaffold.runtime GREEN (#364);
  secrets/rollback/health/OTEL seam (#374). NOT runnable: Aspire compose (#363, unregistered).
- Aspire shared-cache provisioner CacheMode 5-union (#373); Garnet-executable path unproven in CI.
- Doctrine/harness housekeeping (#357/#358/#365/#361/#367/#369) + docs overhaul (#383).

## R3 — Epics + code verification (Opus 4.8, baseline-verified)

### Epic truth table
- **#301 Road-to-stable ~35%**: sub-epics #304 + #308 CLOSED, #332 (172a-2-SOUND) CLOSED (real win);
  OPEN #302 bench, #303 maturation, #305 doctrine, #306→#389 harness, #307 stale-elim, #309
  release/API, #313 DB. Only 2/9 sub-epics closed; beta-floor items S1/S2/S5/S6/S8 all open.
- **#238 AI stack — engine ~85%, plugin ~40%**: `@netscript/ai` is genuinely built + tested (60+
  files, 11 test files, ports/adapters, providers anthropic/openai-compat/ollama/openrouter all
  merged, agent loop, MCP transports); `@netscript/fresh/ai` + fresh-ui `ai` registry landed. The
  **plugin gateway parity bar is unmet** (#388).
- **#388 flagship parity ~0-10%**: all 5 acceptance items unchecked; none exist. Sharpest
  closed-but-absent case (mirrors #260 false-close).
- **#327 deployment — beta-tier ~90% REAL code, stable-tier ~5%**: beta S1-S8 (#337-344) all CLOSED
  with real adapters (Deno Deploy, Aspire Compose, systemd/Windows service, `deno compile`, full
  deploy command group). Stable S9-S12 (#345-348) open.
- **#389 harness V3 ~5%**: draft PR #390, bootstrap only, no DESIGN/PLAN-EVAL/slices.
  (NOTE: conflicts with V3 run dir I read — #390 body may be stale; the design-v3.md IS written.
  Reconcile: V3 design exists on the wt-harness-v3 branch, likely not yet reflected in #390.)
- **#313 Prisma-Next ~0% deliberately deferred**: gaps #314-318 all OPEN wave:defer; migration not
  started on main; still classic Zod-gen path.
- **Docs**: umbrella #232 OPEN; #383 is a MERGED beta.2 PR, not the epic.

### Code verification (file-cited)
1. **AI e2e ABSENT** (confirms #388): `packages/cli/e2e/src/domain/extension-axes.ts:30-36` PLUGIN
   enum = WORKER/SAGA/TRIGGER/STREAM/AUTH — no `ai`. `runtime-gates.ts` has no `ai` gate.
   scaffold.runtime adds only workers/sagas/triggers/streams. Zero e2e exercises `plugins/ai`.
2. **`/v1/ai` contract defined, impl ABSENT**: oRPC contract real+sound in
   `packages/plugin-ai-core/src/contracts/v1/ai.contract.ts` (chat SSE, models, invokeTool, embed,
   transcribe; `implement(...)` no erasure cast). But NOTHING implements it: grep
   `aiContractV1|.handler(|createPluginService` in `plugins/ai` = 0. Scaffolded route
   `stream-proxy.stub.ts` is a raw POST calling `@netscript/ai/agent` directly, bypassing the
   contract. `plugins/ai` is scaffolder/connector only — no running service, no gateway (#262).
3. **Plugin quality far below "meet-or-exceed" bar**: engine strong; plugin has NO
   `verify-plugin.ts` (5/5 reference plugins ship one), only 3 test files vs ~12 for workers/sagas,
   no plugin service, no contract-soundness test. #388 parity gap is real and large.
4. **Deploy targets REAL (beta tier)**: `packages/cli/src/kernel/adapters/deno-deploy/`,
   `aspire-compose-deploy-target.ts`, `{linux-service,windows-service}-deploy-target.ts` (systemd),
   full `public/features/deploy/*` command group. Stable-tier (k8s/Azure/HA/CI-gen) not started.
5. **DB: Prisma 7.8.0 classic path**; adapters pg/mssql/mysql present, NO Turso/libsql/sqlite;
   Prisma-Next migration not begun (consistent with wave:defer).
6. **#260 pattern confirmed**: marked [x]/CLOSED in #238 but `gate:e2e` never landed — v1-min AI
   slices closed on "code-landed-but-gate-unrun" — root cause of #388.

### Stable blockers (ranked; C=code P=process D=docs; size S/M/L)
1. **[C,L] AI plugin flagship parity #388** — the dogfood bar for eis-chat. HIGHEST code blocker.
2. **[P,S] False-closed-acceptance guardrail #387** — cheap, high-leverage; stops label drift.
3. **[C,M] Deployment stable tier #345-348** — beta-cuttable now; stable-gated (≥1 CI deployability
   gate + hardening).
4. **[C/P,L] Bench + positioning floor #302/#303** — gates stable "leadership" claims, not
   dogfoodability.
5. **[P,M] Harness V3 #389** — gates S5/S6 program-maturity, not eis-chat dogfood.
6. **[C,S] #332 172a-2-SOUND already CLOSED** — AI contract builds on de-erased base seam; beta-floor
   soundness item appears satisfied; verify at IMPL-EVAL, don't re-open.
7. **[note] Prisma-Next/Turso #313/#317** — deliberately deferred; NOT a beta or stable blocker.

**Bottom line**: the AI *engine* is genuinely built + tested and is the reusable layer eis-chat
needs. The single load-bearing dogfood gap is **#388** (plugin gateway/e2e/contract-impl parity) +
the process guardrail #387 that let it be reported done. Deployment + DB are beta-adequate;
bench/positioning + harness V3 gate the *stable leadership* claims, not dogfoodability.
