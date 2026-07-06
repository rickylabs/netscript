# Research — beta6-nondash--supervisor

Re-baseline + board verification, 2026-07-06. Sources: live GitHub board (WSL gh), issue bodies
snapshot (`issues/board-snapshot.md`, 79 KB, fetched 2026-07-06), origin/main `a1669f60`.

## 1. Re-baseline

- Local main was 2 commits behind; fast-forwarded to origin/main `a1669f60`
  (`feat(fresh-ui): registry-wide pixel polish pass 1`, `chore(run): process-manager seed run A-I`).
- Working tree clean except pre-existing untracked (`.llm/runs/beta4-cut--supervisor/`,
  `.playwright-mcp/`, `24h`) — not ours, left alone.
- T2 (#403) confirmed merged (`f91dc503`); beta.5 cut on main (`317e4b50`); AI plugin joined the
  release train (`e6a847db`).

## 2. Live board (verified 2026-07-06, matches charter snapshot)

Open `0.0.1-beta.6` non-dashboard issues: telemetry #404 #405 #406 #407 #408 #409 (+epic #399) ·
AI-stack #494 #463 #464 #379 #257 #258 · process-manager #511 · program #389 #303 #306 #307.
Dashboard #400 + #410–#431 open but **hard-excluded** (rescope PR #506 owns them).

## 3. Dependency verification (issue bodies vs live states)

| Cited dep | Issue | State | Consequence |
| --- | --- | --- | --- |
| T1 convention | #402 | CLOSED | T3–T8 unblocked on convention |
| T2 restructure | #403 | CLOSED (f91d) | T3–T8 unblocked on package shape |
| FB0 ai collection | #253 | CLOSED | #257/#258 manifest prerequisite met |
| E4 tool system (`render_ui`) | #243 | CLOSED | #258 schema input available |
| FA3 sandbox handler | #252 | CLOSED | #257 iframe origin + #379 display-half available |
| E5 McpTransportPort | #244 | CLOSED | #463 pools over existing transports |

**Finding — phantom FAI handles.** #464 (FAI-9 gate) cites deps "FAI-5, FAI-6, FAI-7, FAI-8"; #463
cites "Blocks: FAI-8, FAI-14". Only FAI-7 (#463) and FAI-9 (#464) exist as GitHub issues — FAI-5/6/8
were **never filed**; they are F-ai design-doc handles whose scope maps onto the filed beta.6 set:
generative-UI render (≈ FB5 #258 through FB0/E4), MCP widget round-trip (≈ FB4 #257 + FA4 #379 over
FAI-7 #463). Treatment: #464's effective dependency set = **{#494, #463, #257, #258, #379}** — i.e.
all beta.6 AI-stack slices land first. Recorded as drift D1.

**Related but not ours:** #495 (`createNetScriptMcpSandbox` throwing FA0 stub on published
`@netscript/fresh/ai/sandbox`) is milestoned `0.0.1-stable`; #257/#379 depend on the FA3 handler in
the *source* tree, which is real — no beta.6 blocker, but widget e2e must use local-source scaffold,
not the published stub.

## 4. Telemetry sequencing facts (from bodies)

- Epic critical path (post-T2): **T3 → T5 → T8**; T4/T6/T7 parallelize after T2.
- T3 #404: implements ports (`TracerProviderPort|PropagatorPort|MeterPort|SpanLinkPort`),
  `adapters/otel-deno` (default, zero-dep) + `adapters/otel-sdk` (opt-in, OF-5), provider selection
  via `NETSCRIPT_TELEMETRY_PROVIDER`, `enabled` decoupled from `OTEL_DENO`. **Load-bearing for
  T5/T6** per its own header (T5 needs SDK-adapter link attributes; T6 uses port surfaces).
- T4 #405: telemetry-core `extractContext` tracestate fix + `plugins/triggers` parenting bug +
  facade convergence. Surface: telemetry propagation + plugin-triggers-core — low file overlap with
  T3 (ports/adapters), parallelizable with care.
- T5 #406: needs T3 explicitly (SDK adapter for link attributes). Surface: telemetry
  application/`SpanLinkPort` + streams + sagas plugins.
- T6 #407: deps T1/T2 only. Surface: telemetry + sdk (oRPC CLIENT span) + `packages/ai` runtime
  (TelemetryPort invocation) + workers metrics. **Cross-lane overlap: `packages/ai` also edited by
  AI #494** — sequence the AI half of T6 after #494 merges (or rebase).
- T7 #408: deps T2 only. Surface: new `application/query` + `adapters/aspire-query` + `./query`
  subpath. Dashboard coupling = exception per charter; contract-first, no panel decisions.
- T8 #409: deps T4+T5+T6+T7; generalizes `otel-gates.ts` `BEHAVIOR_OTEL_TRACES` into Flow-B suite
  under `scaffold.runtime`; needs a real streams consumer wired. Epic merge gate — LAST.

## 5. AI-stack sequencing facts

- #494 (per-turn options): standalone in `packages/ai` (ports/chat-client, adapters ×3, new
  reasoning `AgentChunk`) + **lockstep zod schema in `plugin-ai-core`**. No open deps.
- #463 (FAI-7 pooling): pool over existing transports in `@netscript/ai` core (`/mcp` surface);
  no open deps. Upstream of #379 (pool shared by chat turns + widget calls).
- #257 (FB4 widget): deps FB0+FA3 both closed → startable now. Surface: fresh-ui
  `registry/islands/McpUiWidget.tsx` + `registry.manifest.ts` entry.
- #258 (FB5 renderer): deps FB0+E4 both closed → startable now. Size L. Surface: fresh-ui new
  renderer module + manifest entries. **Manifest overlap with #257** — coordinate: #257 (S-size)
  lands its manifest entry first; #258 rebases.
- #379 (FA4 call handler): deps FA3 (closed), E5 (closed), FB4 #257 (open) + pool from #463.
  Surface: `packages/fresh` ai subpath route factory. After #257 + #463.
- #464 (FAI-9 gate): last; extends the FAI-2 `ai` e2e `--mcp` variant with render + round-trip
  assertions.

## 6. Process-manager PM-0 (#511)

Independent fix-forward precursor (OF-4), no deps, blocks PM-18/PM-21 (beta.8). Surface:
`packages/cli` deploy router/target registry + `packages/config` resolution. Design source:
`research/design/d3-deploy-integration-os-adapters.md` §D3.2 + process-manager seed `plan.md` §4
(landed on main in `0882c62d`). Self-contained Tier-D slice.

## 7. Program/track lanes

- **#389 harness-v3 epic**: body shows all 13 slices landed via PR #390 (merged `eeaff336`),
  finalize #398 + closeout #396 merged. Beta.5 registry marked it "closed-n/a / stays OPEN as
  durable umbrella by design". Remaining work: verify acceptance vs main, then owner-batch a
  close/keep-open decision. Bookkeeping only (Tier A) — no implementation.
- **#303 S2**: beta.5 landed PR #483 (doc-lint sweep + publish dry-run cleanliness, `5baa0250`).
  Remaining per body: **172a-2-SOUND plugin-service type-soundness (beta gate)**, no
  `--allow-slow-types` carve-outs, `e2e-cli-prod` + `scaffold.runtime` green. Heavy; needs a scope
  audit before slicing (memory: root = phantom-typed base contract seam; fix 172a-2-SOUND first).
- **#306 S5**: 5 remaining bullets (doctrine-06 archetype-5 reconcile; release-gates wiring into
  evaluator/gate-matrix; fold JSR + OpenHands gotchas into skills; arch-debt reconcile + orphan
  docs; SCOPE-frontend `fresh/ai`). Doc/harness authoring → Tier B with Tier-A review.
- **#307 S6** (p2): beta.5 merged Waves 2+4 (PR #485); W3 blocked on #305 doctrine reconcile;
  W5 = owner-batch items. Remaining beta.6 scope ambiguous (W1 "CERTAIN dead code" state needs
  re-verification against main). Deprioritized per charter; audit-then-decide if capacity allows.

## 8. Cross-lane collision map

| Surface | Slices touching | Mitigation |
| --- | --- | --- |
| `packages/ai` | #494, #463, T6 #407 (AI half) | #494 ∥ #463 disjoint (chat vs mcp); T6 AI-half after #494 |
| `packages/fresh-ui/registry.manifest.ts` | #257, #258 | #257 first, #258 rebases |
| `packages/telemetry` core | T3, T4, T5, T7 | T3 owns ports/adapters; T4 propagation; T7 new query subpath; T5 after T3 |
| plugin cores (triggers/streams/sagas) | T4, T5, #303 type-soundness | #303 soundness slice scheduled after TEL waves 1–2 merge |
| `packages/cli` | #511 | isolated (deploy router) — no beta.6 contention |
| e2e suite (`otel-gates`, `ai` suite) | T8, #464 | separate suites; both LAST in their lanes |
