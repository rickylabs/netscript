## ISSUE #399 [OPEN] epic: telemetry-revamp — framework telemetry convention + ports/adapters + dashboard query surface (Spine-1 enabler) (milestone: 0.0.1-beta.6)
## Epic — `telemetry-revamp` (enabler half of Spine-1)

Part of #301 (Road to 0.0.1-stable). Co-lands with the `dev-dashboard` epic. **No closing keyword** — this umbrella closes by hand when all children land.

### Problem

Telemetry is a rich but internally-inconsistent package (forbidden `core/`, orphan module, no OTEL-adapter subpath), plugin instrumentation ranges A→F (workers reference; streams/ai from zero), a real W3C-parenting bug severs trigger traces, real span-links exist in exactly one place, and there is no typed query/export surface for the dashboard to consume. The dashboard (headline) cannot ship a trustworthy trace view until this enabler lands.

### Outcome

A framework-wide telemetry convention (TC-1..14), a doctrine-clean ports/adapters package with `./otel` + `./query` subpaths, every first-party plugin at TC-conformance, real fan-in span-links, the triggers bug fixed, a real (non-mocked) grouped-trace e2e assertion suite, and a NetScript-owned `@netscript/telemetry/query` contract the dashboard codes against.

### Non-goals

Baggage propagation (semconv Candidate only); dual-writing to an external backend (that's the app's OTLP-exporter choice); the Aspire resource-graph "what's running" surface (dev-dashboard / Aspire seam owns it).

### Acceptance (epic-level)

All child issues closed; `scaffold.runtime` e2e green including the new `BEHAVIOR_OTEL_TRACES` Flow-B assertions; `deno doc --lint` clean on the full export set; the arch-debt Refactor entry for `packages/telemetry` closed with F-3/F-5/F-6 evidence; the dashboard consuming `@netscript/telemetry/query`.

### Children

T1 convention · T2 ports/adapters restructure · T3 thin-vs-SDK adapters · T4 W3C + triggers bugfix · T5 fan-in span-links · T6 oRPC + AI port · T7 query/export surface · T8 real grouped-trace e2e (epic merge-gate). T9 (AI OTel adapter, stable) is filed once as the cross-labelled FAI-17 (== #248) under `epic:ai-stack` + `epic:telemetry-revamp`.

### Critical path to beta.6

**T1 → T2 → T3 → T5 → T8** (fan-in links need the SDK adapter need the restructure). T4/T6/T7 parallelize after T2. T8 is the epic merge-gate; T9 is the stable tail.

Design source: `design/B-telemetry/proposal.md` + `epic-and-issues.md`.

### Owner picks baked in

- **OF-5 = allow opt-in SDK** — telemetry may ship an opt-in `@opentelemetry/sdk-*` adapter (`adapters/otel-sdk`) on the messaging fan-in path; the default build stays zero-runtime-dep (`adapters/otel-deno`), SDK selected only via `NETSCRIPT_TELEMETRY_PROVIDER`.


---

## ISSUE #400 [OPEN] epic: NetScript Dev Dashboard — Aspire-extension dev console (ships as a plugin, beta.6) (milestone: 0.0.1-beta.6)
## Epic — NetScript Dev Dashboard (Spine-1 headline)

Part of #301 (Road to 0.0.1-stable). **No closing keyword** — this umbrella closes by hand when its children land.

The killer feature: an Encore-dev-equivalent local dev console for NetScript, delivered as an installable official plugin (`plugin add dashboard`) that dogfoods the plugin system. Thin `plugins/dashboard` + `packages/plugin-dashboard-core`; UI on `@netscript/fresh-ui`; live data from Aspire `/api/telemetry/*` converging on the telemetry-revamp query/export surface (co-land beta.6).

### Cross-epic dependency — `epic:telemetry-revamp`

The flagship Flow/Trace Waterfall (DDX-8) has **hard** cross-epic deps on telemetry-revamp **T4** (triggers W3C-parenting bugfix), **T5** (streams fan-in span-links), **T6** (oRPC span-creation), **T7** (`@netscript/telemetry/query` surface). The two epics are scheduled to **co-land** at beta.6, not sequenced.

### Owner pick baked in — OF-10 = per-capability (adopt)

At beta.6 the dashboard's plugin surface is organized as **per-capability sections** (workers/sagas/triggers/streams, each create→configure→monitor) contributed via the DDX-17 `DashboardPanelContribution` seam. DDX-17 + DDX-18a–d stay at `0.0.1-beta.6`.

### Slice count: 23

DDX-0…16 (17) + DDX-17 (1) + DDX-18a-d (4) + DDX-19 (1). DDX-19 is `wave:defer` / stable; all others `wave:v1`, beta.6 (with stable depth tails on DDX-9/DDX-12).

### Critical path

**DDX-0 + DDX-2 → DDX-3/DDX-4 → DDX-5 → DDX-8** with the telemetry-revamp fan-in-links / triggers-bugfix co-land. DDX-1 gates the "control" panels (10/12) and rerun-from-step (9). DDX-16 is the merge-readiness e2e.

Design source: `design/A-dashboard/proposal.md` + `epic-and-issues.md`.


---

## ISSUE #494 [OPEN] feat(ai-core): per-turn generation options + reasoning support across shipped chat adapters (milestone: 0.0.1-beta.6)
## Problem

eis-chat (reference consumer, validated read-only during the beta.5 Step-3 gate) drives per-message generation controls provider-natively: Anthropic `thinking:{type:'adaptive'}` + `output_config.effort`, OpenAI `reasoning_effort`, OpenRouter `reasoning:{effort}`, plus `max_tokens`/`maxCompletionTokens` caps (eis-chat `apps/dashboard/lib/models.ts:139-162`, `routes/api/chat.ts:92-162`). The thinking-effort picker is a first-class per-message UI axis there, and its default model config (`claude-sonnet-5` adaptive thinking) is unreachable through NetScript's shipped adapters.

In `@netscript/ai` today:

- `ChatClientRequest` (`packages/ai/src/ports/chat-client.ts:38-48`) carries only `messages/system/tools`; `AgentLoopOptions` only `signal/maxSteps` — no per-turn model options seam.
- `AnthropicModelProviderConfig` has only `apiKey/baseURL`; no thinking/effort/maxTokens mapping anywhere in the Anthropic or openai-compatible adapters.
- Only `OpenRouterModelProviderConfig.reasoningEffort` exists (`packages/ai/src/adapters/openrouter.adapter.ts:71`), static per provider instance — not per turn.
- The internal `toTanstackChatClient` already has a `modelOptions` passthrough (`packages/ai/src/adapters/tanstack-chat-client.ts:55-62,106`) but no adapter exposes it per turn.
- `AgentChunkType` (`packages/ai/src/contracts/chunk.ts:17-24`) has **no reasoning/thinking chunk** — the loop cannot surface a reasoning delta even if thinking were enabled.

The port-first escape hatch (hand-write a `ChatClientPort`) exists, but the flagship mandate is meet-or-exceed with *shipped* adapters. This fails the Step-3 bar "shipped AI seams could replace eis-chat's proven patterns" — flagged as the gate's sole blocker. **Owner decision (2026-07-06): ship beta.5 without it; this lands in 0.0.1-beta.6.**

## Acceptance criteria

1. An owned, provider-neutral per-turn options type (reasoning effort off/low/medium/high, `maxOutputTokens`, open provider-options record) threads `AgentLoopInput`/`AgentLoopOptions` → `ChatClientRequest`/call options → adapter `modelOptions`.
2. Anthropic, OpenAI-compatible, and OpenRouter adapters map it provider-natively (Ollama documented as no-op).
3. `AgentChunk` gains a reasoning-delta chunk; the zod contract schema in `plugin-ai-core` updated in lockstep.
4. Probe: an eis-chat-shaped per-message effort picker is expressible with shipped adapters only.
5. Doc-lint + adapter tests green; publish dry-run green.

Found by the beta.5 eis-chat validation gate (charter Step 3). Refs #219 #238.


---

## ISSUE #511 [OPEN] [process-manager PM-0] Wire linux-service/windows-service deploy targets + fix resolveTargetConfig key mismatch + de-gate flat verbs (milestone: 0.0.1-beta.6)
## Summary
Independent fix-forward precursor (OF-4): make the reserved `linux-service`/`windows-service` deploy targets actually reachable through the deploy router, and clean up the legacy flat-verb surface. Ships before the epic body of work.

## Scope
- Archetype / area: `packages/cli` deploy router + target registry + `packages/config` resolution
- Part of #510
- Depends on: — (independent) · Blocks: PM-18, PM-21

## Design source
- `research/design/d3-deploy-integration-os-adapters.md` §D3.2 · `plan.md` §4 PM-0

## Acceptance criteria
- [ ] gate: `netscript deploy up/down/status/logs` route to `linux-service`/`windows-service` targets (registry keys resolve)
- [ ] gate: `resolveTargetConfig` key→member mismatch fixed (registry keys `windows-service`/`linux-service` vs config members `windows`/`linux` — key→member alias; drift 5)
- [ ] gate: Windows-only flat verbs de-gated in place (no `WindowsRequiredError` on Linux) and marked deprecated in help text in favor of router verbs (E16)
- [ ] gate: stale R-DEPLOY-2 comment + "Windows service manager" copy fixed (drift 3/4b)
- [ ] gate: scoped check/lint/fmt wrappers green (`--ext ts,tsx`)

## Non-scope
- No new deploy-target key (E1); no renderer/OsServicePort changes (PM-15+).

## Drift / Debt
- none



---

## ISSUE #389 [OPEN] epic: Agentic Workflow Doctrine V3 (harness V3) (milestone: 0.0.1-beta.6)
Program epic for **harness V3 — Agentic Workflow Doctrine**: codify the operating model we have actually been running for weeks, and fix the recurring hygiene failures (skipped skills, stale artifacts, plan-only PRs shipped as "done", stranded issues). Everything must be reviewable from GitHub + mobile without cloning or diffing.

## Scope (V3 pillars)

1. **Tiered agent model** — Fable 5 feature supervisor (decides) · Opus 4.8 research/analysis sub-agents (report) · Sonnet-5 dynamic Workflows for batch/parallel work (generated `workflow.js` committed in the run dir, mandatory) · WSL Codex GPT-5.5 daemon-attached slices for long/deterministic implementation (skills + `.llm/tools` as the only interface).
2. **Adopt #306** ([S5] Harness + skills revamp): lane-policy, hard gates, stale-profile deletion, skill/tool hygiene — folded into the V3 spec.
3. **Tracked run dirs** (`.llm/runs/<run-id>/`) recording supervisor identity (agent id + disk path), kept current per slice.
4. **Draft-PR-on-start** with Definition-of-Done, run-dir path, per-slice commits + phase comments, and `status:` stage labels reflecting global state (research → plan → plan-eval → impl → impl-eval → ready-merge).
5. **Epic/sub-issue standard** — standard titles, sub-issues auto-closed by closing keywords on their resolving PRs; never a closing keyword on the epic.
6. **Guardrails** — a plan-stage PR is never mergeable as impl (enforces the #387 direction); post-slice reconcile of issues/comments/plan.
7. **Drop `commits.md`** — draft PRs + slices are the commit trail.
8. **Prune stale/duplicate** skills, harness docs, orphaned tools; make `.llm/tools` deno wrappers + deno-toolchain skill mandatory for checks/fmt/deps.

## Sub-issues

No separate GitHub sub-issues were filed for V3 slices — all 13 slices (S0–S10 + Amendments A1/A2)
landed as commits inside the design/dogfood PR #390, per the run worklog
(`.llm/runs/feat-agentic-workflow-doctrine-v3--v3/worklog.md`).

- [x] V3 design + doctrine spec — PR #390 (merged, squash `eeaff336`; IMPL-EVAL PASS)
- [x] Slice map — 13 slices S0–S10 + A1/A2, all landed in PR #390; finalize PR #398 (merged) retired residual "Harness v2" labels; closeout PR #396 (merged)

## Links

- Adopts: #306 · Coordinates: #305 · Enforces: #387 direction
- Design/dogfood PR: #390 (merged `eeaff336`) · Finalize: #398 · Closeout: #396
- Run dir: `.llm/runs/feat-agentic-workflow-doctrine-v3--v3/` (tracked, on the PR branch)

_Do not put closing keywords on this epic; it closes by hand when all children are done._



---

## ISSUE #303 [OPEN] [S2] Enterprise maturation + consolidation (milestone: 0.0.1-beta.6)
Child of the Road-to-0.0.1-stable umbrella. Consolidate the features shipped across recent waves into a coherent, mature, enterprise-grade surface and raise the whole codebase to production quality.

## Scope

- Consolidate recent waves: fresh-ui, plugins (workers/sagas/triggers/streams + `-core` layer), Aspire, auth (better-auth/kv-oauth/workos + auth-core), streams. AI stack (#238) folds in as it converges — **do not re-architect it mid-flight**.
- Fix plugin-service type-unsoundness (172a-2-SOUND: phantom-typed base contract seam) — this is a **beta gate**.
- Enterprise surface coherence: consistent public-surface verbs, doc-linted exports, no `--allow-slow-types` carve-outs at publish, coherent error surface.

## Acceptance criteria

- All plugin services type-sound; `deno task publish:dry-run` clean with no slow-types allowances.
- Public surface doc-lint passes for every package's full export map.
- `e2e-cli-prod` + `scaffold.runtime` green.

## Notes

Spans both milestones. Depends on S4 (doctrine) for the surface/error/versioning standards it enforces, and coordinates with S6 (stale elimination) so consolidation and deletion don't collide. DB layer carved out (ROUTE-TO-PRISMA).


---
Parent epic: #301



Part of #301


---

## ISSUE #306 [OPEN] [S5] Harness + skills revamp (milestone: 0.0.1-beta.6)
Child of the Road-to-0.0.1-stable umbrella. Fold all learnings from recently shipped features/processes into `.llm/harness/` + `.agents/skills/`; make the operating model sharp and current.

## Audit findings (corrected against origin/main)

The `.llm/harness/` spec was committed in one drop 2026-06-05 and never structurally updated since; recent learnings landed in skills + run artifacts but not the spec. (NOTE: the audit's "converge branch" headline was stale — origin/main already has 14 agentic tools, the `netscript-release` skill, and `impeccable` deleted. That step is largely done.) Real remaining content:

## Work

**Done (merged on main — mostly via harness V3 PRs #361, #369, #390, #398):**

- [x] **Rewrite `ARCHETYPE-5-plugin.md`** to the thin-plugin / #172 model: contracts-in-core, typesafe-glue `plugin install` codegen (#157/#167), base plugin-service seam, core-centralization law. — PR #361.
- [x] **Delete `.llm/harness/profiles/sagas/**` + `profiles/triggers/**`** (12 files) — PR #369.
- [x] **New `workflow/lane-policy.md`** — landed with the V3 rollout, including the #306 invariant + Amendment A1 (slice review gate); generator != evaluator **session** is the hard rule, lanes are configuration.
- [x] **Scrub Copilot/Augment residue** — verified zero hits across skills/harness docs.
- [x] `workflow/tooling.md` wiring the agentic suite + rtk + `watch-run.ts` wake; `deno task agentic:*` aliases.
- [x] Release phase added to the run-loop (`run-loop.md` §8).
- [x] Skill frontmatter `name != directory` fixes (`deno-fresh`/`design`).

**Remaining (open scope of this issue):**

- [ ] Doctrine-06 archetype-5 folder-shape reconciliation (deferred from PR #361, still unresolved).
- [ ] Wire the named release gates (`e2e-cli-prod`, `scaffold.runtime`, release-gate class) into `evaluator/protocol.md` + `gates/archetype-gate-matrix.md` (currently only in `run-loop.md` §8); dedicated `release-gates.md`.
- [ ] **Fold gotchas:** 5 JSR hardening gotchas into `jsr-audit` (stop treating `deno publish --dry-run` as authoritative); OpenHands concurrency-cancel (issue-comment↔main vs PR-comment↔PR-branch) + IMPL-EVAL lock-churn reconcile into `openhands-handoff` — verify vs current skill text.
- [ ] Reconcile `arch-debt.md` vs current `packages/` tree; document orphans `gh-watch.ts` + `gh-token.ts`.
- [ ] `SCOPE-frontend.md` add `fresh/ai`.

## Acceptance criteria

Harness spec + skills reflect the current operating model, gates, and shipped learnings; `sync-claude-skills --check` + `validate-claude-surface` green. **Beta gate.** Coordinate machine-specific skill overlaps with S3.


---
Parent epic: #301



Part of #301



---

## ISSUE #307 [OPEN] [S6] Stale-code + stale-file elimination (milestone: 0.0.1-beta.6)
Child of the Road-to-0.0.1-stable umbrella. NetScript was alpha — no backward-compat promises. Delete stale code and stale files. Every candidate is looked at before deletion (delete-safety rule).

## Baseline

All candidates verified against **origin/main (`f3d7f1dc`)** — not the working checkout, which ran 380 commits behind and still holds 216 files main already deleted. Cut every deletion branch from origin/main.

## Wave 1 — CERTAIN dead code (0 importers repo-wide; safe mechanical delete) — FIRST

16 files/symbol-groups + 1 vestigial dir:
- CLI: `runtime-override.ts`, `runtime-detect.ts`, `loggers/json-logger.ts`, `loggers/silent-logger.ts`, `runtime/clock/system-clock.ts` (+empties `runtime/clock/`), `ports/clock-port.ts` (dead cluster), `application/abstracts/cli-command-group.ts`, `presentation/abstracts/list-command.ts`, `constants/paths.ts`, `constants/platform.ts`, `public/templates/plugins/public-plugin-generators.ts`
- queue: `internal/mod.ts` + `internal/distributed-queue.ts` pair (keep `internal/parallel-queue.ts`)
- plugins: `plugins/workers/contracts/v1/workers.contract.ts` (compat re-export, bypassed)
- dead exports (edit-in-file): fresh `form/runtime/state.ts` (`createFormPageProps`/`resolveFormPageProps`), sdk `ports/client-link-factory.ts` (`ClientLinkFactory`), `ports/transport.ts` (`ServiceTransport`), `ports/metadata.ts` (3 types); whole-file `fresh-ui/src/presentation/data-grid.css`

## Wave 2 — LIKELY (~18; quick human glance)

CLI `extension-points.ts` barrel + `compile.test.ts` doublet; sdk `collections/*`, `openapi/helpers.ts`, `discovery/service-discovery.ts`, `query/composite-query.ts`, `query-client/kv-cache-persister.ts`; plugins `workers/bin/{combined,scheduler,worker}.ts`, `workers|sagas/services/src/routers/health.ts`; `plugin-streams-core/src/domain/errors.ts`; orphan public barrels (`plugin`, `plugin-workers-core`, `telemetry` `src/public/mod.ts`); `fresh-ui data-grid.tsx` `DataGrid`.

## Wave 3 — infra tooling orphans (20 scripts) — BLOCKED on doctrine drift

17-script CLI-fitness cluster + `check-architecture-gates.ts` + `generate-package-plans.ts` + `agentic/gh-watch.ts`, all unwired. **Prerequisite:** `fitness-gates.md` + doctrine `09-*` reference a phantom differently-named script set — reconcile which is canonical (ties to S4) before deleting. Keep `cli-fitness-shared.ts`.

## Wave 4 — `.llm/tmp` bulk purge

2799 tracked files that are git-excluded scratch; single `git rm -r` PR. **MERGE with S3 PR-3b.**

## Wave 5 — NEEDS-HUMAN-LOOK (per-item decision; not blind deletes)

`--legacy-aspire` C# AppHost removal (largest shim, genuinely wired; alpha = strong removal candidate → coordinated sub-epic, user approval); `packages/runtime-config` whole-package orphan (roadmap-or-retire); `packages/ai`+`plugin-ai-core` (HOLD — AI lane owns); auth presets/reference impls; fresh/fresh-ui transitional surfaces; plugin back-compat shims (sagas codemod, legacy job/saga config schemas, command-form fallback); kv redis pre-envelope fallback; `packagesAsWorkspaceMembers` simplification; dangling `plugins/sagas` `test:api` task ref.

## Carve-outs

ROUTE-TO-DOCS (6 items) → docs lane. ROUTE-TO-PRISMA (DB layer) → do not touch.

## Acceptance criteria

Waves 1-2 deleted with `deno task check` + `test` green per package; Wave 3 after doctrine reconcile; Wave 4 purged; Wave 5 items each carry an explicit decision. **Beta gate (wave 1).**


---
Parent epic: #301



Part of #301


---

## ISSUE #404 [OPEN] [telemetry T3] Thin-vs-SDK provider adapters + decouple enabled from OTEL_DENO (milestone: 0.0.1-beta.6)
Part of #399 · Part of #301

**Handle:** T3 · **Milestone:** `0.0.1-beta.6` · **Deps:** T2. **Load-bearing for** T5/T6.

## Scope

Proposal §3: implement `ports/TracerProviderPort|PropagatorPort|MeterPort|SpanLinkPort`; `adapters/otel-deno` (default, zero SDK dep) + `adapters/otel-sdk` (opt-in `@opentelemetry/sdk-trace-*` + HTTP-OTLP, `supportsLinkAttributes=true`, flush-on-exit); composition-root provider selection via `NETSCRIPT_TELEMETRY_PROVIDER`; `enabled = OTEL_DENO || NETSCRIPT_TELEMETRY_ENABLED || providerRegistered`; wire the `InstrumentationRegistry` as the real composition seam.

> **Owner pick OF-5 = allow opt-in SDK** — the `adapters/otel-sdk` path is authorized; default build stays zero-runtime-dep.

## Acceptance

- Default build stays zero-runtime-dep (SDK opt-in, not in the default graph — `deps:prod-install` proves it).
- SDK adapter produces attribute-bearing links + flushes observable meters on exit.
- `enabled` no longer hard-gated on `OTEL_DENO` (unit-tested both ways).
- Provider adapters preserve the #402 TC-1..14 convention contract, including the semconv opt-in and shared `netscript.*` attribute law.

Design source: `design/B-telemetry/epic-and-issues.md` (T3).


---

## ISSUE #405 [OPEN] [telemetry T4] W3C hardening + triggers W3C-parenting bugfix (milestone: 0.0.1-beta.6)
Part of #399 · Part of #301

**Handle:** T4 · **Milestone:** `0.0.1-beta.6` · **Deps:** T1, T2. **Correctness bug — on the Flow-B critical path.**

## Scope

Proposal §5 + §4-triggers. Fix the tracestate-drop in the `extractContext` fallback (+ test); validate version byte; **fix `create-trigger-ingress.ts` `#processAndRecord` to thread the captured `event.traceparent`/`tracestate` as parent context** so ingress→detect→process share one trace; add the SERVER ingress span; wire the dormant `TriggerInstrumentation` core; converge the triggers runtime off its private `getTracer('@netscript/triggers')` onto the shared facade (TC-13).

## Acceptance

- Regression test: trigger ingress span and process span share `traceId` (would have caught the bug).
- tracestate round-trips; triggers uses the shared facade; `plugin-triggers-core` telemetry passes TC-1..-9 from the #402 convention.
- Trigger attribute assertions use the #402 `netscript.*` namespacing law and deprecated-alias window where old keys shipped.

Design source: `design/B-telemetry/epic-and-issues.md` (T4).


---

## ISSUE #406 [OPEN] [telemetry T5] Real span-links for fan-in (streams + sagas) (milestone: 0.0.1-beta.6)
Part of #399 · Part of #301

**Handle:** T5 · **Milestone:** `0.0.1-beta.6` · **Deps:** T1, T2, T3 (needs SDK adapter for link attributes).

## Scope

Proposal §4-streams/§4-sagas/§5. Promote the database Prisma `addLinks`/`linkIds` pattern into the shared `SpanLinkPort` + `application` `createFanInLinks(messages)`; **streams from zero**: PRODUCER span + link-injection on publish, CONSUMER span + fan-in links on subscribe; **sagas**: converge off the private tracer, lift the 7 meter instruments into shared (TC-11), make the facade real-by-default, replace the test-mock "fan-in links" with real attribute-bearing links.

## Acceptance

- Streams emits PRODUCER/CONSUMER spans with real links (attributes present under the SDK adapter).
- Sagas cascade join carries real links (not mock no-ops); `db` link helper reused, not re-hand-rolled; both pass TC-14 from the #402 convention.
- Link attributes use the #402 semconv and `netscript.*` namespacing law.

Design source: `design/B-telemetry/epic-and-issues.md` (T5).


---

## ISSUE #407 [OPEN] [telemetry T6] oRPC span-creation fix + AI port invocation (milestone: 0.0.1-beta.6)
Part of #399 · Part of #301

**Handle:** T6 · **Milestone:** `0.0.1-beta.6` · **Deps:** T1, T2. oRPC fix on the Flow-B critical path.

## Scope

Proposal §4-services/§4-ai (beta.6 half). **oRPC:** make `TracingPlugin` create an INTERNAL/SERVER span when none is active (no longer silently inert), align `rpc.*` to semconv RC + shared `SpanNames`, add the missing client-side CLIENT span in `packages/sdk` service-client. **AI:** invoke the injected `TelemetryPort` in `packages/ai/src/runtime/mod.ts` with a minimal real span so the seam is live (F→C). workers: lift metrics via TC-11, resolve the `createJobTools` no-op.

## Acceptance

- oRPC hop produces a span even with Deno HTTP auto-instr off (unit + Flow-B e2e).
- `channelClient` callback appears in the Flow-B trace; AI runtime emits at least one real span through the port; workers has metrics.
- oRPC, AI, and workers telemetry assertions target the #402 TC-1..14 convention, including shared `SpanNames`, semconv keys, and `netscript.*` attributes.

Design source: `design/B-telemetry/epic-and-issues.md` (T6).


---

## ISSUE #408 [OPEN] [telemetry T7] @netscript/telemetry/query dashboard surface (milestone: 0.0.1-beta.6)
Part of #399 · Part of #301

**Handle:** T7 · **Milestone:** `0.0.1-beta.6` · **Deps:** T2 (subpath). **Co-lands with the dashboard epic (#400).**

## Scope

Proposal §7. Generalize the `telemetry-trace.ts.template` reader into `application/query` + `adapters/aspire-query` over Aspire `/api/telemetry/*` (traces/traces/{id}/logs/spans/resources, `?follow` NDJSON, `?resource` filter); the typed `TelemetryTrace`/`TelemetrySpan`/`TelemetryLog`/`TelemetryResource` contract; robust ephemeral-endpoint + api-key discovery (shared resolver); graceful `--no-aspire`/prod degradation; `exportTraces` → portable OTLP-JSON.

## Acceptance

- `@netscript/telemetry/query` exports the typed reader; resolves the live Aspire base URL in the scaffold.runtime e2e; returns grouped `TelemetryTrace` by ID; degrades cleanly with no local Aspire.
- The dashboard data layer (DDX-3) can switch onto it (co-land handshake).
- Query/export contracts preserve the #402 TC-1..14 field vocabulary so dashboard trace views do not invent parallel span or attribute names.

Design source: `design/B-telemetry/epic-and-issues.md` (T7).


---

## ISSUE #409 [OPEN] [telemetry T8] Real (non-mocked) grouped-trace e2e — Flow B (epic merge-gate) (milestone: 0.0.1-beta.6)
Part of #399 · Part of #301

**Handle:** T8 · **Milestone:** `0.0.1-beta.6` · **Deps:** T4, T5, T6, T7 (asserts their behavior). **Merge-gate for the epic.**

## Scope

Proposal §6. Generalize `otel-gates.ts` `BEHAVIOR_OTEL_TRACES` into the Flow-B assertion suite run under `scaffold.runtime`: single trace_id across all processes; parent/child edges (enqueue→dequeue, job.execute child of dispatch, callback child of job.execute); fan-in link present; no severed/fresh-trace (triggers regression guard); attribute floor (correlation.id + outcome). Wire a real streams consumer for the fan-in leg (do not rely on eis-chat's inert scaffold).

## Acceptance

- The suite runs against real processes + the real Aspire API (no span mocks) and is green.
- Each assertion maps to a TC from the #402 convention; failure of the oRPC/triggers fixes would make a named assertion red (proving the guard bites).
- Flow-B attribute-floor assertions use the #402 `netscript.*` namespacing law and semconv opt-in value.

Design source: `design/B-telemetry/epic-and-issues.md` (T8).


---

## ISSUE #463 [OPEN] [AI-stack FAI-7] MCP pooling primitive + ui:// resource extraction (milestone: 0.0.1-beta.6)
**Part of #238** (AI-stack umbrella). F-ai slice **FAI-7**.

## Summary

MCP pooling primitive + `ui://` resource extraction, built in `@netscript/ai` core.

## Justification

`createMcpTransport` builds a single transport with no pooling (`factory.ts:16-21`); eis-chat pools multi-server keyed by id with keep-alive + `ui://` extraction (`analysis/F-ai/02 §2`). This is new work over the now-closed #240 MCP-engine cluster — the existing `StdioMcpTransport`/`StreamableHttpMcpTransport` already carry reconnect backoff + lifecycle state, so this is a pool over them, not a rewrite.

## Acceptance

- A multi-server pool keyed by id over the existing transports; keep-alive across turns; tool-name prefixing; `ui://`-resource extraction surfaced to the render-ui seam.
- Built in `@netscript/ai` core (no `plugins/ai` consumer re-hand-rolls it).
- `gate:jsr`: `@netscript/ai/mcp` surface `deno doc --lint` clean on the full export map; `deno publish --dry-run` green.

## Dependencies

- **Dep:** none. **Blocks:** FAI-8, FAI-14.

## Milestone

`0.0.1-beta.6` (beta.6 flagship — MCP pooling + widgets).


---

## ISSUE #464 [OPEN] [AI-stack FAI-9] beta.6 capability e2e merge gate (generative-UI render + MCP widget round-trip) (milestone: 0.0.1-beta.6)
**Part of #238** (AI-stack umbrella). F-ai slice **FAI-9**.

## Summary

beta.6 capability merge gate — proves the generative-UI + MCP-widget capabilities land. Sibling to FAI-2's `ai` `scaffold.runtime` e2e.

## Scope note

FAI-9 is the **beta.6** capability merge gate **only** — it proves generative-UI + MCP-widget capabilities, not the beta.7 depth seams or the stable OTel adapter. Do **not** read it as gating FAI-10…17 (those tiers carry their own gates).

## Acceptance

- Extend the FAI-2 `ai` e2e (`--mcp` variant) with a generative-UI render assertion (a `render_ui` tree renders through FAI-6) + an MCP widget round-trip smoke (FAI-8).
- Fails if FAI-5…8 did not land. Cleanup on `--cleanup`.

## Dependencies

- **Dep:** FAI-5, FAI-6, FAI-7, FAI-8.

## Milestone

`0.0.1-beta.6` (beta.6 merge gate).


---

## ISSUE #379 [OPEN] [AI-stack FA4] @netscript/fresh/ai: createMcpAppCallHandler route (widget action -> tools/call, allowlist + stdio fallback + OTel) (milestone: 0.0.1-beta.6)
## Summary

Add **`createMcpAppCallHandler`** — a `@netscript/fresh/ai` server route factory that turns an interactive MCP-App widget's `tool` action back into a real MCP `tools/call`, with a same-server exposure allowlist, stdio live-client fallback, and OTel span continuation.

## Why (the missing half of interactive MCP Apps)

FA3 (#252, merged via #336) ships the sandbox **display** half (`createMcpSandboxHandler`: themed `ui://` sandbox + CSP). FB4 (#257) ships the client **widget iframe**. Neither ships the **call handler** — the server route that lets a rendered widget *act*. Without it, FA3 + FB4 render widgets that cannot do anything.

eis-chat proves the full round trip is required and shows exactly how (eis-chat #39/#41/#56, all closed):

Reference files (eis-chat @ HEAD b65094a):
- `apps/dashboard/routes/api/mcp-apps/call.ts` — native `createMcpAppCallHandler({ clients: pool })` primary path + **stdio fallback** through the live pool client (stdio transports are deliberately non-reconnectable in `@tanstack/ai-mcp`), same-server exposure allowlist re-enforced, OTel `mcp.tool.call` spans continuing the browser trace
- `apps/dashboard/lib/mcp.ts` — the keep-alive `createMCPClients` pool shared by chat turns AND the widget call route

## Contract shape

- `createMcpAppCallHandler({ clients })` → a Fresh route handler.
- **Allowlist:** a widget may only call tools on the *same* MCP server that produced its `ui://` resource (re-enforced server-side, never trusting the client).
- **stdio fallback:** when the resolved transport is a non-reconnectable stdio child, route through the already-live pool client instead of opening a new transport.
- **OTel:** emit `mcp.tool.call` spans that continue the browser trace (`parentFromRequest`).
- **Pool-sharing:** documents the FA3/E5 pattern — one keep-alive MCP pool serves both chat turns and widget action calls.

## Depends on

FA3 (#252, merged), E5 (#244, merged — MCP transport), FB4 (#257). `epic:ai-stack`, `area:fresh`, `wave:v1`. Part of epic #238.



Part of #238


---

## ISSUE #257 [OPEN] [AI-stack FB4] fresh-ui: mcp-ui-widget (themed sandboxed ui:// iframe) (milestone: 0.0.1-beta.6)
Add an `mcp-ui-widget` fresh-ui registry island that renders `ui://` MCP-UI resources in a themed, sandboxed iframe and remounts cleanly on theme change.

## Context

Part of epic #238 · cluster fresh-ui · wave v1 · depends-on FB0, FA3.

This slice sits at the top of the fresh-ui plane's DAG: it consumes FB0's `ai` collection registration and FA3's `ui://` origin/server handler to ship the actual consumer-facing widget. It cannot land before either, since there is no collection to register into and no origin to point the iframe at.

## Problem / motivation

eis-chat renders MCP-UI resources today via a hand-rolled iframe with no sandbox hardening, no theme propagation, and no defined remount contract, so a theme switch leaves a stale iframe showing the previous theme's injected styles (or, worse, a half-updated DOM). NetScript has no registry item at all for consuming `ui://` resources; fresh-ui's generative-UI story is incomplete without a themed, sandboxed widget that the renderer can hand a resource URL to and trust it will behave consistently across theme changes.

## Scope

### Ships

- `packages/fresh-ui/registry/islands/McpUiWidget.tsx` — Fresh island rendering an `<iframe>` against a caller-supplied `ui://`-resolved src (the FA3-owned origin), with a restrictive `sandbox` attribute (`allow-scripts` only; no `allow-same-origin`).
- Keyed remount: the iframe is keyed on the active theme value so a theme change forces a full unmount/remount instead of reusing a stale iframe document.
- `registry.manifest.ts`: new registry item `mcp-ui-widget` (`kind: 'island'`, `layer: 3`, tags `['ai', 'mcp-ui', 'iframe']`, `registryDependencies: ['theme-seed']`), appended to the `ai` collection's `items` list (the collection itself is created by FB0).

### Out of scope

- The `ui://` server handler / origin that actually serves MCP-UI resources — owned by FA3.
- Creating the `ai` collection and registering the 7 chat primitives — owned by FB0 (hard prerequisite for this slice).
- The generative-UI renderer that decides when to hand a resource URL to this widget, and the curated design-system vocabulary around it — owned by the fresh-ui renderer slice(s) tracked separately in the #238 DAG.
- Any postMessage/RPC bridge between host app and iframe content beyond the iframe boundary itself — not specified in this slice; flag as a follow-on if the widget needs bidirectional messaging.

## Public surface

- New file `packages/fresh-ui/registry/islands/McpUiWidget.tsx` exporting a default island component, approximate props `{ src: string; theme: string; title?: string; sandbox?: string }`.
- New `registry.manifest.ts` entry: `{ name: 'mcp-ui-widget', kind: 'island', layer: 3, files: [...], registryDependencies: ['theme-seed'], tags: ['ai', 'mcp-ui', 'iframe'] }`.
- `mcp-ui-widget` added to the `ai` collection's `items` array (collection object owned/created by FB0; this slice only appends its own item id).
- No new `@netscript/fresh-ui` subpath exports — registry items are copy-scaffolded files, not module exports.

## Acceptance & fitness gates

- [ ] F-5: `McpUiWidget.tsx` carries the same JSDoc/`@module` convention as existing registry islands (e.g. `Toast.tsx`); item stays within the manifest's per-item field conventions.
- [ ] F-6: `@netscript/fresh-ui` still publishes via `deno task publish:dry-run` WITHOUT `--allow-slow-types` after the new file and manifest entry land.
- [ ] gate:e2e — `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` covers `netscript ui:add ai` (or `ui:add mcp-ui-widget`) resolving and copying `McpUiWidget.tsx` plus its `theme-seed` dependency into a scaffolded Fresh app with no generated-workspace type errors.
- [ ] Keyed remount verified: changing the `theme` prop produces a distinct iframe mount (not a reused DOM node retaining the prior theme's injected content).
- [ ] Sandbox attribute is present and restrictive on every render path (`allow-scripts` without `allow-same-origin`), and `src` only ever resolves to the FA3-owned origin, never a same-origin app route.
- [ ] `deno task check` / lint pass on `packages/fresh-ui` with the new file and manifest entry included.

## Dependencies

Depends on FB0, FA3 (GitHub numbers tracked in the #238 DAG checklist). FB0 must land first to create the `ai` collection this slice appends into; FA3 must land first to provide the `ui://` origin this widget's iframe points at.

## Size

M



Part of #238


---

## ISSUE #258 [OPEN] [AI-stack FB5] fresh-ui: generative-ui-renderer (recursive JSON tree -> curated DS vocabulary) (milestone: 0.0.1-beta.6)
Add a generative-UI renderer to fresh-ui: a recursive JSON-tree interpreter that maps a `render_ui` payload onto a curated design-system vocabulary, with depth and tag whitelist guards.

## Context

Part of epic #238 · cluster fresh-ui · wave defer · depends-on FB0, E4

This is the consumer end of the generative-UI seam: E4 (plugin-ai) defines the `render_ui` tool schema an agent can call, FB0 registers the chat primitives fresh-ui renders into, and FB5 is the piece that actually walks a tool-call payload and produces DOM from it. It is deferred because it is only meaningful once both the schema and the primitive registry exist.

## Problem / motivation

Today there is no path from an AI tool call to rendered UI in fresh-ui: the `ai` collection does not exist in `registry.manifest.ts` (ends ~L891, confirmed empty of chat/ai entries), and there is no interpreter that turns a JSON UI description into safe, bounded markup. Hand-rolled agent UIs (the eis-chat pattern this program is retiring) inline ad-hoc `switch`-on-type rendering with no depth limit, no vocabulary whitelist, and no shared layout/viz/data block set — every consumer reinvents it, and a malformed or adversarial tool-call payload can recurse unbounded or render arbitrary tags. FB5 gives fresh-ui a single, doctrine-owned renderer so any plugin/app driving an AI agent gets the same safe generative-UI behavior for free.

## Scope

### Ships
- A recursive tree renderer in `packages/fresh-ui` (new module, e.g. `src/ai/render-ui.ts` or equivalent island) that consumes the `render_ui` schema shape exported from `@netscript/ai/tools` (E4) and interpolates it against the fresh-ui component/primitive set.
- A curated design-system vocabulary limited to three block categories: layout blocks (stack/grid/section-style containers), viz blocks (chart/metric-style display primitives), and data blocks (table/list/card-style structured display), each mapped 1:1 to existing or FB0-registered fresh-ui primitives.
- A depth guard (bounded max recursion depth, reject/short-circuit beyond it) and a tag/type whitelist guard (unknown node `type` values render a fallback, never arbitrary markup or raw HTML injection).
- Registry entries so the renderer and its block set are discoverable the same way other fresh-ui primitives are (`ui:add` surface), once FB0 has established the `ai` collection.

### Out of scope
- The `render_ui` tool schema itself (its shape, JSON-schema validation, and the tool definition consumed by the agent loop) — owned by E4 (plugin-ai).
- Registration of the 7 chat primitive components into the manifest `ai` collection — owned by FB0 (hard prerequisite, must land first).
- The gzip/content-encoding streams proxy fix — owned by #239, unrelated to this slice.
- Any provider-specific tool-calling wiring (Anthropic/OpenAI adapters) — owned by `@netscript/ai/<provider>` subpath slices.

## Public surface

- New export(s) from `packages/fresh-ui`: a `render-ui` (or equivalently named) renderer entry point plus its supporting block components, added under the existing fresh-ui public surface conventions (JSDoc + `@module` per file, exports kept within the mod.ts export-count ceiling).
- New `ai` (or extended) manifest collection entries in `registry.manifest.ts` for: the renderer itself, and the layout/viz/data block primitives it dispatches to.
- Consumes (does not export) the `render_ui` schema type from `@netscript/ai/tools` (E4) as its input contract.

## Acceptance & fitness gates

- [ ] F-3: renderer sits in the correct fresh-ui layering (domain/render logic does not reach into adapters); `deno task arch:check` passes.
- [ ] F-5: all new public exports carry JSDoc + `@module`, and `mod.ts`/entry files stay within the <=20 export ceiling.
- [ ] F-6/gate:jsr: publishes via `deno task publish:dry-run` WITHOUT `--allow-slow-types`.
- [ ] gate:e2e: a `scaffold.runtime` E2E case scaffolds a project with the `ai` fresh-ui collection installed, feeds the renderer a nested `render_ui` payload (layout containing viz and data blocks), and asserts correct DOM output.
- [ ] Depth-guard regression case: a `render_ui` payload nested beyond the configured max depth is rejected/truncated, not infinitely recursed.
- [ ] Whitelist-guard regression case: a payload with an unknown/unregistered block `type` falls back safely and does not render raw/arbitrary markup.
- [ ] `netscript ui:add ai` resolves and installs the renderer alongside the FB0-registered chat primitives.

## Dependencies

Depends on FB0 and E4 (GitHub numbers tracked in the #238 DAG checklist). FB0 is a hard prerequisite (the `ai` manifest collection and chat primitives must exist first); E4 supplies the `render_ui` schema this renderer consumes. Not blocked by #239.

## Size

L



Part of #238


---

## ISSUE #238 [OPEN] epic: NetScript AI Stack — first-class AI runtime, chat & plugin seams (anchor #219) (milestone: 0.0.1-beta.7)
# Epic: NetScript AI Stack — first-class AI runtime, chat, and plugin seams

> **Status:** architectural research complete (no implementation yet). This epic is the traceable basis from which we iterate into sub-issues → draft PRs → slices.
> **Anchor:** #219 (durable-CHAT primitive gap + streams gzip-mislabel bug).
> **Research author:** Fable 5 (principal-architect pass), delegating to Opus 4.8 / Sonnet 5 sub-agents. Grounded in the **live eis-chat repo @ HEAD `26e1b65`** (2026-07-02) and the NetScript reference plugins (auth / workers / streams / kv / sdk / fresh-ui).

## Why this epic exists

eis-chat (the flagship consumer) hand-rolled a large "AI stack" — provider/model routing, agent loop, tool + MCP registry, embeddings/vision, durable-chat transport, and the whole presentational chat surface — because NetScript did not yet expose the seams for them. It also carries a live workaround for a real framework bug (#219). This epic captures the architecture for lifting that stack into NetScript **better than the hand-rolled original**, using the auth plugin / workers / kv patterns as the quality bar.

The plan below is Fable 5's. It is **not** a locked decision set — it's the strong, grounded basis we now iterate on together (rough brainstorm → sub-issues → draft PRs). Items still needing a human **product** call are tagged `[PRODUCT SIGN-OFF]`.

## The shape, in one paragraph

A **five-home split** rather than one monolithic `plugins/ai`: (1) a **NEW `@netscript/ai`** standalone engine core (peer to `kv`/`sdk`, provider adapters by subpath), because the AI engine is used in-process by Fresh routes, workers, and services — not service-bound like auth; (2) a **NEW `@netscript/fresh/ai`** subpath for the durable-chat client/SSR/proxy runtime; (3) **extend the existing `@netscript/fresh-ui` `ai` registry** for the presentational surface; (4) a **thin `packages/plugin-ai-core`** holding only the optional gateway contract; (5) an **optional `plugins/ai`** centralized AI-gateway service. The #219 gzip fix ships first and standalone (~15 LOC).

---

## Traceability — sources, issues, PRs, external deps

**Anchor & related issues**
- #219 — durable-CHAT primitive gap + streams gzip-mislabel bug (the anchor; Slice 0 fixes the bug, Slice 1 ships the seam).

**NetScript reference surfaces the plan is grounded in** (emulation targets / precedents)
- Auth plugin — `packages/plugin-auth-core/`, `plugins/auth/`, `packages/auth-better-auth|auth-kv-oauth|auth-workos/` (contract-in-core + thin manifest + adapters).
- Workers plugin — `plugins/workers/` (gold-standard multi-axis manifest, `verify-plugin.ts`, registry code-gen).
- Streams — `plugins/streams/services/src/main.ts` (proxy — the #219 fix site) + `packages/plugin-streams-core/src/application/stream-url-resolver.ts` (`getStreamsUrl`/`getStreamsAuth`/`buildStreamUrl`).
- Fresh runtime — `packages/fresh/src/runtime/streams/create-stream-db.ts` (`createNetScriptStreamDB` — the sibling the new `./ai` subpath mirrors).
- Fresh-UI registry — `packages/fresh-ui/registry.manifest.ts:1102-1116` (the `ai` collection already shipping — extend it).
- Standalone-core precedent — `packages/kv/` + `packages/sdk/` (adapter-registration-by-subpath-import; the `@netscript/ai` shape).
- Doctrine — `docs/architecture/doctrine/{01-thesis-and-axioms,06-archetypes,07-composition-and-extension,09-anti-patterns-and-fitness-functions}.md`; harness `ARCHETYPE-5-plugin.md`; fitness fns F-3/F-5/F-6/F-13.

**External dependencies / prior art**
- `@durable-streams/tanstack-ai-transport@^0.0.8` — `durableStreamConnection`, `toDurableChatSessionResponse`, `ensureDurableChatSessionStream`, `materializeSnapshotFromDurableStream` (ElectricSQL "Durable Sessions").
- `@tanstack/ai@0.10.x` + `-anthropic` / `-openai` (`/compatible`) / `-preact` / `-mcp` — provider adapters + `useChat` + `chat()` agent loop.
- `@durable-streams/{client,server,state}` — the underlying durable-stream transport already used by NetScript streams.
- `@modelcontextprotocol/sdk` + `@mcp-ui/client` — MCP tool transport + `ui://` widget rendering.

**Live consumer reference (private)**
- eis-chat @ HEAD `26e1b65` (2026-07-02) — key files: `apps/dashboard/islands/ChatPane.tsx`, `routes/api/chat.ts`, `routes/api/chat-stream.ts`, `routes/api/streams/[...path].ts`, `lib/stream-loaders.ts`, `lib/chat-render.ts`, `components/ui/{message,markdown,mcp-widget,chart-block,code-block,tool-call-card}.tsx`, `lib/{models,paced-reveal,mcp}.ts`, `services/eischat/src/{embeddings,vision}.ts`, `packages/channel/mod.ts`. The three `Accept-Encoding: identity` #219 workaround sites (`chat-stream.ts:72`, `streams/[...path].ts:60`, `stream-loaders.ts:82`) are the Slice-0 acceptance test.

**Related tooling PR** (context, not a dependency)
- #237 — release-publish automation (merged) — unrelated feature, listed only because it landed in the same window.

---

# Architecture plan (Fable 5, rev. 2) — verbatim

_The remainder of this issue is the research artifact as delivered. Sub-issues will be carved from §7 (migration slices) and §6 (open questions)._

# NetScript AI Stack — Architecture Plan (rev. 2)

**Author:** Principal framework architect (Fable 5). Architecture/design pass only, **no implementation**.
**Anchor:** issue #219 (durable-CHAT primitive gap + gzip-mislabel bug).
**References:** auth plugin (emulation target), workers (gold-standard plugin), `@netscript/kv` (standalone-core precedent), `@netscript/fresh-ui` `ai` registry collection (already-shipping chat primitives).
**Scope basis:** the LIVE eis-chat repo @ HEAD `26e1b65` (2026-07-02), incl. mcp-ui DS-token theming, the react-markdown pipeline, paced-reveal streaming, hybrid KB retrieval.
**Every decision below is mine, with rationale.** Items needing eventual human *product* sign-off are tagged **[PRODUCT SIGN-OFF]**; I still give a recommendation.

---

## 0. The decisive re-architecture (what changed in rev. 2)

Rev. 1 put "everything in `plugins/ai`." That was wrong. The live-repo evidence forces three corrections:

1. **eis-chat runs the agent loop IN-PROCESS, not through a plugin HTTP service.** `apps/dashboard/routes/api/chat.ts` calls `@tanstack/ai` `chat({adapter, tools, mcp, agentLoopStrategy})` directly in the Fresh route, and workers jobs (`workers/jobs/embed-document.ts`) + the eischat oRPC service (`services/eischat/src/embeddings.ts`) call embeddings directly. This is fundamentally unlike auth, where the backend is *only* ever reached through the auth service. **The AI engine primitives are runtime-agnostic library code, used in-process across Fresh routes / workers / services — not service-bound.** ⇒ they belong in a standalone core package, not a plugin.

2. **`@netscript/fresh-ui` already ships the presentational chat surface.** Its `registry.manifest.ts:1102-1116` defines a named `ai` collection (`message`, `tool-call-card`, `code-block`, `chart-block`, `citation-chip`, `model-selector`, `prompt-input`, `command-palette`, `search`, `theme-seed`), and eis-chat's `apps/dashboard/components/ui/*` ARE those copy-source components — extended locally. ⇒ presentational primitives belong in the fresh-ui registry (extend the existing collection), NOT in a plugin or a new package.

3. **`@netscript/kv`/`@netscript/sdk` prove the standalone runtime-agnostic core-package pattern is idiomatic** (`packages/kv/deno.json`, `packages/sdk/deno.json` — zero `@netscript/*` deps, adapter-registration-by-subpath-import at `packages/kv/redis.ts:1-20`). ⇒ the AI engine should be a peer core package `@netscript/ai`, with provider adapters as *subpath-registered* adapters (`@netscript/ai/anthropic`), NOT a proliferation of `packages/ai-*` packages.

**Net topology (five homes, each justified in §3):**

| Capability | Home | Why |
|---|---|---|
| Provider routing, agent loop, tool + MCP registry, embeddings/vision ports + adapters, model registry, reasoning/token-cap normalization, telemetry | **NEW `@netscript/ai`** (standalone core, archetype 2) | runtime-agnostic; used in-process by Fresh routes, workers, services — like `@netscript/kv` |
| Durable-chat client connection, SSR snapshot/resume, the `/api/chat-stream` proxy recipe | **`@netscript/fresh` new `./ai` subpath** (archetype 4) | Fresh/island client-runtime; sibling to the existing `./streams` seam |
| Message renderer, markdown, tool-call card, chart/code block, citation chip, model selector, prompt input, mcp-ui widget, typing indicator, paced-reveal hooks | **`@netscript/fresh-ui` `ai` registry** (archetype 4, copy-source) | presentational; the collection already exists — extend it |
| The oRPC contract for an *optional* centralized AI-gateway service | **`packages/plugin-ai-core`** (archetype 2, thin) | only needed to back the plugin; re-exports `@netscript/ai` types |
| The *optional* AI-gateway plugin service (centralized BYOK key custody, shared tool/MCP registry, cross-app usage accounting, rate limiting) | **`plugins/ai`** (archetype 5) | multi-app / centralized-key deployment topology; NOT required for the single-app embedded case |

The plugin is now **optional infrastructure**, not the center of gravity. The center is `@netscript/ai` (engine) + `@netscript/fresh/ai` (chat runtime) + the fresh-ui `ai` registry (chat UI).

---

## 1. `@netscript/ai` — the standalone AI engine core (NEW package)

**Archetype 2 (integration): wraps `@tanstack/ai-*` + provider SDKs behind ports + adapters.** Modeled structurally on `@netscript/kv` (`packages/kv/deno.json:6-11`): a root port/lifecycle API plus subpath-registered adapters. Zero Fresh coupling — usable in Fresh routes, workers jobs, oRPC services, or standalone scripts, exactly as eis-chat uses `@tanstack/ai` today.

### 1.1 Exports map (kv-shaped, adapter-by-subpath)

```
@netscript/ai
  .                     → mod.ts   — createAiRuntime(), getAiRuntime(), ports, registries, model-registry, config, presets, telemetry
  ./anthropic           → anthropic.ts          — registers 'anthropic' ModelProvider adapter (side-effect, wraps @tanstack/ai-anthropic)
  ./openai-compatible   → openai-compatible.ts  — registers 'openai-compatible' adapter (wraps @tanstack/ai-openai/compatible; OpenAI/OpenRouter/LiteLLM)
  ./openai-embeddings   → openai-embeddings.ts  — registers embedding + vision adapters (OpenAI-compatible /v1/embeddings + vision)
  ./mcp                 → mcp.ts                 — McpTransport adapters (stdio/http) wrapping @tanstack/ai-mcp
  ./tools               → tools.ts              — defineAiTool(zod-input).server(fn), createToolRegistry
  ./agent               → agent.ts              — createAgentLoop(), maxIterations, AgentLoopPort (the @tanstack/ai chat() wrapper as a state machine)
  ./contracts           → contracts/mod.ts       — runtime-agnostic message/part types shared with the plugin contract
  ./testing             → src/testing/mod.ts     — in-memory ports
```

The `@netscript/kv/redis` self-registration pattern (`registerKvAdapter`, `packages/kv/redis.ts:1-20`, consumed by `getKv()` auto-detect at `packages/kv/mod.ts:11-22`) is copied verbatim: importing `@netscript/ai/anthropic` self-registers the provider so `createAiRuntime()` resolves it, and an app that never uses Anthropic never pays for `@tanstack/ai-anthropic`. **This is the key reason adapters are subpaths not packages** — AI provider SDKs are heavy optional deps, precisely kv's situation.

### 1.2 Ports (the `AuthBackendPort` analogue, cf. `packages/plugin-auth-core/src/ports/mod.ts:211-241`)

```ts
export interface ModelProviderPort {
  readonly name: string;                                 // 'anthropic' | 'openai-compatible'
  readonly capabilities: ModelProviderCapabilities;      // supportsReasoning, supportsVision, ...
  buildChat(opts: BuildChatOptions): BuiltChat;          // { adapter, modelOptions } — normalizes reasoning + token caps
}
export interface AgentLoopPort {
  run(input: AgentRunInput, signal?: AbortSignal): AsyncIterable<StreamChunk>;  // A12 state machine; F-13 AbortSignal + stop()
}
export interface ToolRegistryPort { register(t: AiToolDefinition): void; list(): readonly AiToolDefinition[]; resolve(name: string): AiToolDefinition | undefined; }
export interface McpTransportPort  { connect(cfg): Promise<McpSession>; /* keep-alive pools */ }
export interface EmbeddingProviderPort { embed(texts: string[]): Promise<number[][]>; }
export interface VisionProviderPort    { transcribe(bytes: Uint8Array, mime: string): Promise<string>; }
```

`createAiRuntime(config)` is the **composition root** (A10, `docs/architecture/doctrine/07-composition-and-extension.md:14-81`): constructor-injects the registered adapters, model registry, and telemetry; no module-load side effects except the opt-in adapter self-registration. Model registry = `ModelEntry {provider, id, label, reasoning?}` (from `apps/dashboard/lib/models.ts:17-26`), env-overridable via config, replacing eis-chat's `EISCHAT_MODELS` scraper (`lib/models.ts:43-57`). Reasoning normalization (Anthropic `thinking:{type:'adaptive'}` + `output_config.effort` vs OpenAI-compat `reasoning:{effort}` — `apps/dashboard/routes/api/chat.ts:90-126`) and token caps (`ANSWER_MAX_TOKENS=8192`/`REASONING_MAX_TOKENS=16384`, `chat.ts:66-67`) live in `-core` per the thinness law, hidden behind `buildChat`.

**No provider SDK type ever leaks to userland** — userland imports `@netscript/ai` + optionally `@netscript/ai/anthropic` (registration only). This is the auth invariant (adapters import only `@netscript/plugin-auth-core/contracts/v1`).

### 1.3 Why NOT fold this into `packages/plugin-ai-core` (the auth shape)?

Auth folds engine+contract into one `-core` because the auth backend is *only* invoked via the auth service. The AI engine is invoked **in-process, independent of any service** (three call sites in eis-chat prove it). Doctrine A9/A11: a package earns its own identity when its consumers are broader than one plugin. `@netscript/ai` has three non-plugin consumers already (Fresh routes, workers, services), so it is a peer core package, and `plugin-ai-core` shrinks to just the service contract that re-exports it. **This is the single most important structural call in this plan.**

---

## 2. `@netscript/fresh/ai` — the durable-chat client runtime (NEW subpath)

**Archetype 4, sits at `packages/fresh/src/runtime/ai/`, sibling to `runtime/streams/`.** It is the exact analogue of `createNetScriptStreamDB` (`packages/fresh/src/runtime/streams/create-stream-db.ts:100-114`): a Fresh-runtime factory that composes the streams URL/auth seam. Precedent that this dependency direction is allowed: `@netscript/fresh` **already imports** `buildStreamUrl/getStreamsAuth/getStreamsUrl` from `@netscript/plugin-streams-core` (`create-stream-db.ts:18`). Added to `packages/fresh/deno.json` exports (currently `.`, `./server`, `./streams`, `./query`, ... at `:6-17`; new dep `@durable-streams/tanstack-ai-transport@^0.0.8` + `@tanstack/ai-preact`; `@durable-streams/state` already present).

### 2.1 The distinction that must be documented (root-cause fix for #219)

NetScript ships two stream consumers; they are NOT interchangeable. The `@module` JSDoc (F-5 mandatory) must lead with this table:

| | **StreamDB shapes** (data tables) | **Durable Sessions** (AI chat) |
|---|---|---|
| Surface | `createNetScriptStreamDB` + `useLiveQuery` (`create-stream-db.ts:100-114`) | **NEW** `@netscript/fresh/ai` |
| Pkg | `@durable-streams/state/db` | `@durable-streams/tanstack-ai-transport` + `@tanstack/ai-preact` |
| Shape | rows keyed by PK, upsert/delete | ordered append-only chunk log, offset-addressed |
| Consumer | `{data, status, error}` | `{messages, sendMessage, isLoading, stop}` + optimistic + resume + multi-tab |
| **#219 failure if misused** | — | shapes-for-transcript ⇒ `TypeError: Decoding failed` (Electric `TextDecoder` on gzip'd multibyte) |

### 2.2 Surface

```ts
// @netscript/fresh/ai  (island-safe, preact/compat like ./streams)

// CLIENT — wraps durableStreamConnection with NetScript URL/auth resolution
export function createNetScriptChatConnection(opts: {
  sessionId: string;
  streamPath?: (id: string) => string;   // default '/ai/sessions/${id}/messages'
  baseUrl?: string;                       // default same-origin proxy
  initialOffset?: string;                 // from resolveChatSnapshot
  outputSchema?: unknown;                 // §6-Q2 typed structured-output passthrough
}): DurableStreamConnection;              // { subscribe, send } — satisfies TanStack SubscribeConnectionAdapter

// SERVER — wraps toDurableChatSessionResponse; resolves writeUrl via buildStreamUrl + getStreamsAuth
export function toNetScriptChatResponse(opts: {
  sessionId: string;
  streamPath?: (id: string) => string;
  newMessages: DurableSessionMessage[];
  responseStream: AsyncIterable<unknown>;         // AgentLoopPort.run() output
  mode?: 'immediate' | 'await';                    // default 'await'
  authorize?: (req: Request, sessionId: string) => Promise<boolean>;   // §6-Q5 ownership hook
}): Promise<Response>;

// SSR resume/snapshot
export function resolveChatSnapshot(sessionId: string, streamPath?): Promise<{ messages: UIMessage[]; offset?: string }>;
//   internally ensureDurableChatSessionStream({writeUrl,headers,createIfMissing:true})
//   then materializeSnapshotFromDurableStream({readUrl,headers}) → {messages, offset}

// the canonical /api/chat-stream proxy recipe (one impl, replaces eis-chat's 3 hand-rolled proxies)
export function createChatStreamProxyHandler(opts?: {
  streamPath?; authorize?: (req: Request, sessionId: string) => Promise<boolean>;
}): (req: Request) => Promise<Response>;

// MCP-UI sandbox route recipe (backs the fresh-ui mcp-ui-widget; §4)
export function createMcpSandboxHandler(opts?: { csp?: string }): (req: Request) => Promise<Response>;
```

**Verified transport API** (`@durable-streams/tanstack-ai-transport@0.0.8`): `durableStreamConnection({sendUrl,readUrl?,initialOffset?,...})→{subscribe,send}`; `toDurableChatSessionResponse({stream:Pick<DurableStreamTarget,'writeUrl'|'headers'|'createIfMissing'>, newMessages, responseStream, mode})→Promise<Response>` (202 immediate / 200 await); `ensureDurableChatSessionStream`, `materializeSnapshotFromDurableStream({readUrl,headers,offset?})→{messages,offset}`. `useChat({connection, initialMessages, live:true, forwardedProps})` (`@tanstack/ai-preact@0.10.1`); `live:true` holds the subscription open for the component lifetime (multi-tab + resume-in-progress). Offsets are opaque `<read-seq>_<byte-offset>`; the stream IS the log so a mid-generation reload catches in-flight tokens.

### 2.3 The proxy recipe (`createChatStreamProxyHandler`)

eis-chat hand-wrote three same-origin read proxies (`routes/api/chat-stream.ts`, `routes/api/streams/[...path].ts`, `lib/stream-loaders.ts`). Ship ONE that: maps `?id=`→`buildStreamUrl(chatStreamPath(id))`, forwards State-Protocol params (`offset/live/handle/cursor`) except `id` (`chat-stream.ts:54-56`); attaches `getStreamsAuth()` **server-side only** (the security reason the proxy exists — keeps `STREAMS_SECRET` off the browser); strips hop-by-hop + `content-encoding`/`content-length` on the way back (`streams/[...path].ts:24-31`); bridges disconnect via `cancel()` not `req.signal` (`chat-stream.ts:76-114`). After the §3 bug fix it drops the `Accept-Encoding: identity` request header but keeps the response-header strip as defense-in-depth.

---

## 3. #219 gzip-mislabel bug — root cause, fix, verification

**Root cause (empirically reproduced, Deno 2.9.0): decompress-but-don't-relabel at the streams proxy hop** (`plugins/streams/services/src/main.ts`). The engine (`@durable-streams/server@0.3.7`) gzips *correctly* only for bodies ≥1024 B; Deno's inner `fetch` transparently decompresses but retains `content-encoding: gzip`; the proxy returns it verbatim (`main.ts:70-85`, `return await fetch(proxyReq)` at `:81`, even CORS-exposes the header at `:110-123`). Compliant decoders then try to gunzip `[{...` → throw. Size-gated ⇒ intermittent (why it looked random). The `identity` workaround only makes the engine skip compression.

**Fix location: `plugins/streams/services/src/main.ts` `proxyHandler`** — after the inner fetch, rebuild the Response stripping `content-encoding`/`content-length`/hop-by-hop (exactly eis-chat's own client-proxy `STRIP` set, `routes/api/streams/[...path].ts:24-31`). NOT engine compression-disable (discards real wire compression, leaves the latent Deno bug), NOT a client change. The engine and client are both correct; the proxy is the wrong actor.

**Verification:** `curl -sD - --compressed '<front>/v1/stream/netscript/<path>'` on a >1KB snapshot (pre-fix: header says gzip, body magic `5b 7b` not `1f 8b`; post-fix: no header, valid JSON). Add a >1KB read case to the `scaffold.runtime` E2E with a compliant decoder. **Acceptance = deleting all three `identity` sites** (`chat-stream.ts:72`, `stream-loaders.ts:82`, `streams/[...path].ts:60`). Ships FIRST, ~15 LOC, standalone — unblocks eis-chat before any AI package exists.

---

## 4. `@netscript/fresh-ui` `ai` registry — the presentational surface (EXTEND existing)

**These are copy-source components** (`netscript ui:add <item>`) — an app owns the code after copying, which is exactly why eis-chat could extend them. Preact function components, `class?:string` merged via `cn()`, `@layer 2`, `@depends theme-seed`, themed only through semantic `--ns-*` CSS custom properties (`packages/fresh-ui/registry/theme/tokens.css`), never JS-side.

**Already shipping** (`packages/fresh-ui/registry.manifest.ts:1102-1116` + `registry/components/ui/`): `message.tsx` (+`TypingIndicator`, `renderInline`, `packages/fresh-ui/registry/components/ui/message.tsx:100-108`), `tool-call-card.tsx`, `code-block.tsx`, `chart-block.tsx`, `citation-chip.tsx`, `model-selector.tsx`, `prompt-input.tsx`.

**Gaps to add to the collection** (all proven-needed by the live eis-chat build, currently hand-rolled there):
- **`markdown` primitive** — the biggest gap. eis-chat added `apps/dashboard/components/ui/markdown.tsx` (react-markdown@9 under `preact/compat`, remark-gfm/math, rehype-katex/highlight/**sanitize**, a `remarkCitations` mdast plugin `[n]`→`<ns-citation>` `markdown.tsx:53-82`, mid-stream `stripIncompleteSyntax` `:287-303`). fresh-ui's `message.tsx renderInline` is inline-only (bold/code/citation); a real Markdown renderer belongs in the registry. **Decision:** add `markdown` as a registry item that emits the sanitize-hardened pipeline, with the citations plugin wired to the existing `citation-chip`.
- **`mcp-ui-widget` primitive** — eis-chat's `mcp-widget.tsx` + `mcp-sandbox.html.ts` (the new HEAD feature) render `ui://` resources in a themed sandboxed iframe. The DS-token theming (`?theme=` query → `mcp-sandbox.html.ts:351-354`, guest-token `<style>` injection + `data-theme` stamp `:229-251`, CSP header from `?csp=` `:356-376`, `MCPAppResource` keyed by theme to force remount `mcp-widget.tsx:144`) is generic and belongs in the registry as a copy-source widget + a companion sandbox-route recipe. **Decision:** add `mcp-ui-widget` (the island component) + ship the sandbox-proxy as the `@netscript/fresh/ai` `createMcpSandboxHandler` server helper (§2.2), since it needs the Fresh middleware + CSP-header machinery.
- **`paced-reveal` hooks** — eis-chat's `lib/paced-reveal.ts` (`useMinVisible`/`usePacedReveal`, thinking-min-duration + token pacing) is a reusable streaming-UX primitive. **Decision:** add as a registry lib item (copy-source hook), not a runtime export, since it is presentational polish an app will want to tune.

fresh-ui is standalone (no `@netscript/*` runtime deps), so these additions carry no dependency-direction risk. The `mcp-ui-widget` + `markdown` do pull heavy npm deps (`@mcp-ui/client`, `react-markdown` + unified stack) — acceptable because copy-source items only add deps to the app that runs `ui:add`, never to the library's own published graph (F-6 safe).

---

## 5. `packages/plugin-ai-core` + `plugins/ai` — the OPTIONAL AI-gateway service

This exists for one topology: **centralized BYOK key custody + shared tool/MCP registry + cross-app usage accounting + rate limiting**, where multiple apps hit one AI gateway instead of each embedding provider keys. The single-app embedded case (eis-chat today) does NOT need it — it uses `@netscript/ai` + `@netscript/fresh/ai` directly. Building it emulates auth precisely:

- **`packages/plugin-ai-core`** (archetype 2, thin): `aiContract` (oRPC) **extends `BasePluginContract`** with mandatory `describe`, spreads `...BASE_PLUGIN_CONTRACT_ROUTES` (`packages/plugin/src/contract-base/domain/base-contract.ts:76-122`), merges `oc.errors({...BASE_PLUGIN_ERRORS, ...AI_ERRORS})` — exactly auth (`packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:405-429`). Routes under `/v1/ai`: `POST /chat` (SSE agent-loop producer), `GET /models`, `POST /tools/:name`, `POST /embed`, `POST /transcribe`, `GET /describe`. Re-exports message/part types from `@netscript/ai/contracts` — never redefines.
- **`plugins/ai`** (archetype 5): `definePlugin('@netscript/plugin-ai', v).withType('api').withService({name:'ai-api', entrypoint, port}).withContractVersions([{version:'v1', loader:'./contracts/v1/mod.ts'}]).withRuntimeConfigTopics([{name:'ai'}])...build()` (auth manifest shape, `plugins/auth/src/public/mod.ts:23-57`). Service = `createPluginService(router, {name:'ai', context: () => ({runtime: getAiRuntime(), telemetry}), ...})` (the enforced builder chain, `packages/plugin/src/service/presentation/create-plugin-service.ts:125-181`; auth usage `plugins/auth/services/src/main.ts:70-83`). The service is a **thin HTTP shell over `@netscript/ai`** — it holds keys server-side and exposes the same ports over oRPC. `contracts/v1/mod.ts` = `export * from '@netscript/plugin-ai-core/contracts/v1'` (auth pattern). `verify-plugin.ts` asserts service + v1 contract + `ai` runtime-config topic (`plugins/workers/verify-plugin.ts:21-96`).

Optional `background-processor` contribution re-declaring embed/transcribe as plugin jobs (workers idiom `defineJobHandler` + `Object.assign(handler,{id})`) if the gateway owns ingestion; otherwise those stay app-side workers jobs.

---

## 6. Open questions — resolved (my recommendations)

**Q1 — Token accounting.** eis-chat uses a chars/4 estimate feeding `/usage` (`apps/dashboard/routes/api/chat.ts:203`) because it reads nothing from the stream. **DECISION: `AgentLoopPort.run()` must emit a real `usage` metadata chunk** extracted from the `@tanstack/ai-*` finish event (the adapters carry provider usage). chars/4 is a defect, not a design. **[PRODUCT SIGN-OFF]** only on whether usage is persisted/billed and at what granularity — the *seam* is my call and is required.

**Q2 — `outputSchema` vs chart-fence.** Not mutually exclusive. Fenced ```chart``` is a *rendering* affordance (fresh-ui `chart-block` already parses it, model-agnostic); TanStack `outputSchema` on `useChat` is a *typed data contract*. **DECISION: support both** — keep fenced blocks as the presentational convention in the fresh-ui registry, and expose `outputSchema` passthrough on `createNetScriptChatConnection` (§2.2) for apps wanting schema-validated structured output. No human decision needed.

**Q3 — Embeddings/vision one adapter or two.** **DECISION: one subpath `@netscript/ai/openai-embeddings` covering both** (both hit OpenAI-compatible endpoints; `services/eischat/src/{embeddings,vision}.ts` share `openaiKey()`), but **two distinct ports** (`EmbeddingProviderPort`, `VisionProviderPort`) so a non-OpenAI vision provider can register independently later (A11 — name the axis now, split the package only when a second impl appears). Also fixes eis-chat's inconsistency where vision is hardcoded `gpt-4o-mini` (`services/eischat/src/vision.ts:9`) while embeddings are configurable. My call.

**Q4 — `VectorStorePort` in v1.** **DECISION: OUT of v1.** Ship `EmbeddingProviderPort` (compute) only; leave vector storage/search to the app (eis-chat's tursodb `vector32`/`vector_distance_cos` hybrid retrieval in `packages/channel/mod.ts` is DB-specific). Coupling a core port to a concrete store is exactly the sagas/triggers engine-lock debt to avoid (user memory `plugin-core-depends-on-primitives.md`). **[PRODUCT SIGN-OFF]**: if a first-class KB becomes a framework goal, revisit as a separate `@netscript/ai/vector` subpath (pgvector/libsql/tursodb adapters) or a `plugins/ai-kb` — I recommend deferring until a second vector backend exists.

**Q5 — Chat-route authz.** eis-chat has **zero** authz on chat/stream/session routes (no ownership checks; `@workos-inc/node` import-mapped but unused). **DECISION: the durable-chat server helper + proxy recipe expose an `authorize(req, sessionId)` hook** (shown in §2.2), and the docs make the secure path the easy path — the proxy already holds the streams secret server-side, so session-ownership verification is a natural extension, composing `@netscript/plugin-auth` session middleware. The *seam* is my call (hook provided, secure-by-default docs). **[PRODUCT SIGN-OFF]**: whether authz is *hard-required* vs opt-out — some deployments are single-user/local — is a product choice; I recommend hook-provided + documented-required, not enforced-required.

**Q6 — Promote thinness + base-contract/base-service laws to written doctrine.** They currently live only in user memory + partial code (slice 172a-2), not in `docs/architecture/doctrine/`. **DECISION/recommendation: YES, promote both to a doctrine chapter** — a new stack that must be "checked against doctrine" needs them written and enforceable. **[PRODUCT SIGN-OFF]** — it is the user's doctrine to amend; I recommend it strongly and can draft the chapter.

---

## 7. Migration path for eis-chat (slices, smallest-first)

Ordering respects Archetype-5 discipline (contracts → runtime → verification → integration) and front-loads highest value / lowest cost.

- **Slice 0 (~15 LOC, ship now): #219 gzip fix** in `plugins/streams/services/src/main.ts` + regress test; delete the three `identity` workarounds. Proves the framework can own a streams-hop concern. No new packages.
- **Slice 1: `@netscript/fresh/ai`** (subpath, not a package/plugin). Wrap the transport + reuse the streams seam; migrate eis-chat `ChatPane.tsx`/`chat.ts`/`chat-stream.ts`/`stream-loaders.ts`. Highest value, lowest structural cost.
- **Slice 2: `@netscript/ai` engine** — `ModelProviderPort` + `@netscript/ai/anthropic` + `@netscript/ai/openai-compatible`, model registry, reasoning/token-cap normalization. Migrate eis-chat `buildChat`/`models.ts`/`llm.ts`; kill the `.env` scraper via `@netscript/config`. Then `./agent`, `./tools`, `./mcp`, `./openai-embeddings`; migrate the `chat()` call, KB tool, MCP pool, embeddings/vision.
- **Slice 3: fresh-ui `ai` registry additions** — `markdown`, `mcp-ui-widget` (+ the `@netscript/fresh/ai` `createMcpSandboxHandler` server helper), `paced-reveal`. Migrate eis-chat's `markdown.tsx`/`mcp-widget.tsx`/`mcp-sandbox.html.ts`/`paced-reveal.ts` back to `ui:add` items so the app re-derives from the registry.
- **Slice 4 (optional): `packages/plugin-ai-core` + `plugins/ai`** — only if/when a centralized multi-app AI gateway is wanted. `verify-plugin.ts`, contract re-export, `createPluginService` shell over `@netscript/ai`.
- **Slice 5 (optional): scaffold/dx** — `plugin add ai` + `ui:add` bundle recipe (auth adapter pattern).

Persistence/analytics stays app-owned (the durable stream is the transcript log; tursodb hybrid-KB + analytics are eis-chat domain data).

---

## 8. Doctrine conformance & quality bar

**Placement vs doctrine:** each home is justified by layering + thinness + the "consumers broader than one plugin ⇒ own package" rule (A9/A11). Dependency directions (all downward, acyclic): `@netscript/ai` → `@std/*` + `@tanstack/ai-*` only (peer to kv/sdk, zero `@netscript/*`); `@netscript/fresh/ai` → `@netscript/plugin-streams-core` + `@netscript/ai/contracts` (precedented — fresh already depends on plugin-streams-core, `create-stream-db.ts:18`); `plugin-ai-core` → `@netscript/ai` + `@netscript/plugin`; `plugins/ai` → `plugin-ai-core` + `@netscript/ai`; fresh-ui `ai` registry → standalone copy-source (no lib deps).

**Fitness gates:**
- **F-3 (layering):** `@netscript/ai` uses role folders `domain/ports/application/adapters`; no up-imports; avoid forbidden folder names `utils/helpers/common/lib`; do not copy workers-core's empty `application/` wart.
- **F-5 (public surface/JSDoc, "single most important"):** every export gets `@param/@returns/@example`; `@netscript/fresh/ai` `@module` leads with the shapes-vs-sessions table (§2.1); split surfaces into subpaths (kv/auth reference, ≤20 exports per mod.ts).
- **F-6 (JSR publishability):** explicit return types (root `isolatedDeclarations:true`), no `export default` in libs, no `any` in exported decls. **Target publish WITHOUT `--allow-slow-types`** (don't inherit the plugin-core T4 debt). Heavy provider/markdown/mcp deps stay off `@netscript/ai`'s and fresh-ui's *published* graphs — providers are opt-in subpaths, UI is copy-source. Heed JSR memory traps: relative self-imports, assets via `with {type:'text'}`.
- **F-13 (runtime declarations):** `AgentLoopPort` is a state machine with a terminal transition, threads `AbortSignal`, exposes `stop()`. Any `plugins/ai` embed/transcribe jobs use the workers `.id`-keyed registry code-gen discovery, not runtime FS scan; declaration types in `plugin-ai-core/runtime`.
- **`verify-plugin.ts`** modeled on `plugins/workers/verify-plugin.ts:21-96`.

**Quality bar:** emulate **workers** (multi-axis manifest, `extends BasePluginContract` + `...BASE_PLUGIN_CONTRACT_ROUTES`; `createPluginService`; `denoJson.version` single-source; registry code-gen; `AspireNSPluginContribution`). Emulate **auth** (contract-in-core re-exported by the plugin; base-contract extension; single-active named selection from env). Emulate **kv** (adapter-registration-by-subpath-import for the AI providers; runtime-agnostic core). **AVOID sagas/triggers** store/engine-lock coupling — no core port binds to a concrete store (drives Q4).

---

## Delegation record

| Investigation | Model tier | Feeds |
|---|---|---|
| Auth plugin architecture deep-dive | **Opus** (high) | §1.2, §5 |
| Streams seam + #219 gzip root cause (Deno 2.9.0 empirical repro) | **Opus** (high) | §2, §3 |
| eis-chat hand-rolled inventory (first pass) | **Opus** (high) | §1, §7 |
| Doctrine + Archetype-5 + fitness gates + base seam | **Opus** (high) | §5, §8 |
| Cross-plugin quality-bar (workers gold / sagas-triggers debt) | **Opus** (high) | §8 |
| `@durable-streams/tanstack-ai-transport` + `useChat` API surface | **Sonnet** (high) | §2.2 verified signatures |
| **Live eis-chat inventory diff @ HEAD 26e1b65** (mcp-ui theming, markdown pipeline, paced-reveal, new UI components) | **Opus** (high) | §0, §4, §6, §7 |
| **fresh-ui / fresh / kv / sdk placement survey** | **Sonnet** (high) | §0, §1, §2, §4 (the whole placement re-architecture) |

Two prior on-disk research files (`research/eis-chat-ai-stack-map.md`, `research/netscript-reference-patterns.md`) were read directly and corroborated.
Synthesis, the five-home placement re-architecture, all six resolved open questions, and this plan: **Fable 5**.



---

## Sub-issue DAG (rev.4)

Anchor bug **#239** (streams gzip-mislabel fix) ships first and standalone. Every AI-stack slice below was filed from the rev.4-E plan. Dependencies are resolved to real issue numbers; `wave` labels partition the release.

**Widest starting front (no deps):** #240 (E1), #249 (FA0), #253 (FB0), #263 (P6).

### Cluster: ENGINE — `@netscript/ai` (new peer core, adapters by subpath)

- [x] #240 **E1** — scaffold archetype-2 core · `wave:v1-min` · blocked by #239
- [x] #241 **E2** — anthropic + openai-compatible providers · `wave:v1-min` · deps #240
- [x] #242 **E3** — createAgentLoop() state machine · `wave:v1-min` · deps #240
- [x] #243 **E4** — tool system + render_ui · `wave:v1-min` · deps #240
- [x] #244 **E5** — McpTransportPort · `wave:v1` · deps #240, #243
- [x] #245 **E6** — embeddings + vision · `wave:v1` · deps #240
- [ ] #246 **E7** — SkillLoaderPort · `wave:v1` · deps #240
- [ ] #248 **E9** — OTel GenAI/MCP telemetry adapter · `wave:v1` · deps #240
- [ ] #247 **E8** — orchestration primitives · `wave:defer` · deps #240, #242

### Cluster: `@netscript/fresh/ai` (durable-chat client subpath)

- [x] #249 **FA0** — subpath skeleton + transport deps · `wave:v1-min` · blocked by #239
- [x] #250 **FA1** — chat connection + snapshot resume · `wave:v1-min` · deps #249, #239, #240
- [x] #251 **FA2** — single chat-stream proxy handler (#239 regression fence) · `wave:v1-min` · deps #249, #250, #239
- [x] #252 **FA3** — MCP sandbox handler · `wave:v1` · deps #249

### Cluster: fresh-ui `ai` registry

- [x] #253 **FB0** — register `ai` collection + chat primitives (**PREREQUISITE**) · `wave:v1-min` · no deps
- [x] #254 **FB1** — markdown item · `wave:v1-min` · deps #253
- [x] #255 **FB2** — chat-render item (RenderPart reload fidelity) · `wave:v1-min` · deps #253, #250
- [ ] #257 **FB4** — mcp-ui-widget · `wave:v1` · deps #253, #252
- [ ] #256 **FB3** — paced-reveal hooks · `wave:defer` · deps #253
- [ ] #258 **FB5** — generative-ui-renderer · `wave:defer` · deps #253, #243

### Cluster: `plugin-ai` accelerator + doctrine

- [x] #259 **P1** — `@netscript/plugin-ai-core` thin contract · `wave:v1-min` · deps #240
- [x] #260 **P2** — `@netscript/plugin-ai` manifest + scaffold + in-process emitters · `wave:v1-min` · deps #259, #240, #241, #242, #243, #244, #249, #250, #251, #253
- [x] #261 **P3** — `ai` runtime-registry codegen for `netscript generate` · `wave:v1-min` · deps #260
- [x] #263 **P6** — doctrine ch.11 (thinness + base-seam laws, SO-8) · `wave:v1-min` · no deps
- [ ] #262 **P5** — opt-in `--gateway` centralized service · `wave:defer` · deps #259, #260, #240

### Release waves

- **v1-min (14 + #239):** #239, #240, #241, #242, #243, #249, #250, #251, #253, #254, #255, #259, #260, #261, #263
- **v1 completion:** #244, #245, #246, #248, #252, #257
- **deferrable:** #247, #256, #258, #262


---

