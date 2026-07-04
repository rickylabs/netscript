# F-ai: AI-stack architecture plan and current-vs-target delta

## 1. Correcting the task brief's premise: it is not a 6-slice plan

The task brief for this cell described the target as "`plugin-ai-core` + N provider adapters + thin
`plugins/ai` + `@netscript/fresh/ai`... documented ~6-slice migration plan (originally Fable #219)."
Deep search (source reads in `research/F-ai/01-*.md`, corroborated by the GitHub-state sibling cell
`research/F-ai/04-github-ai-program-state.md`) shows this premise needs two corrections, recorded
here as drift rather than silently reconciled:

1. **#219 is the anchor bug, not the plan.** #219 ("streams: no durable-CHAT integration") is a
   single root-cause issue (StreamDB shapes vs. durable Sessions confusion + a gzip-mislabel bug).
   The actual architecture plan is **Epic #238** ("NetScript AI Stack — first-class AI runtime,
   chat & plugin seams (anchor #219)"), which names #219 as its anchor, not its content.
2. **It is not 6 slices.** #238's body defines a **five-home architecture** decomposed into a
   **~30-item sub-issue DAG** across four labeled clusters (`E`-numbered engine slices, `FA`-numbered
   fresh/ai slices, `FB`-numbered fresh-ui registry slices, `P`-numbered plugin-ai slices), not six.
   The "6" in the task brief most plausibly under-counted one cluster (e.g. counting only the
   fresh/ai FA0–FA3 slice run, which genuinely is ~4-6 items) and generalized it to the whole plan.

This file treats Epic #238 as authoritative going forward.

## 2. The five-home architecture (Epic #238)

1. **NEW standalone `@netscript/ai` engine core** — providers/agent-loop/tools/MCP/embeddings,
   adapter-by-subpath like `@netscript/kv`. (= `packages/ai`, confirmed shipped, file 01 §2.)
2. **NEW `@netscript/fresh/ai` subpath** — durable-chat client/SSR/proxy runtime. (=
   `packages/fresh/src/runtime/ai`, confirmed shipped through FA2, file 01 §5.)
3. **Extended `@netscript/fresh-ui` `ai` registry** — presentational chat components. (Not directly
   read in this cell's source pass; status inferred from GitHub cluster state below.)
4. **Thin `packages/plugin-ai-core` contract package.** (Confirmed shipped, file 01 §3.)
5. **Optional `plugins/ai` centralized AI-gateway plugin.** (Partially shipped as a thin
   scaffolder/connector; the "centralized gateway" *topology* itself — P5/#262 — is still open.)

All five homes are grounded in a live dogfood consumer, `rickylabs/eis-chat` (external repo,
checked out locally at `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref` per the sibling
`context/F-ai/01-eis-chat-ai-usage-extraction.md` cell), whose hand-rolled AI stack is the design
input and migration target: seams land, eis-chat migrates onto them, and the bespoke code is
deleted slice by slice.

## 3. The sub-issue DAG (per `research/F-ai/04-github-ai-program-state.md` §1, rev.4/rev.5)

| Cluster | Range | Count | Landed (closed) | Open |
|---|---|---|---|---|
| ENGINE (`@netscript/ai`) | #240–#248, +#269/#270/#378/#380 | 13 | E1–E6 (#240–#245), E2b openrouter/ollama (#378) | E7 SkillLoaderPort (#246), E8 orchestration (#247), E9 OTel adapter (#248), E10 MemoryPort (#269, **re-prioritized up**), E11 RetrieverPort (#270, **re-prioritized up**), E15 system-prompt assembly (#380, new) |
| `@netscript/fresh/ai` | #249–#252, +#379 | 5 | FA0–FA2 (#249–#251) | FA3 MCP `ui://` sandbox (#252), FA4 `createMcpAppCallHandler` (#379, new) |
| fresh-ui `ai` registry | #253–#258, +#272 | 7 | FB0–FB2 (#253–#255) | FB3 paced-reveal (#256, deferred), FB4 mcp-ui-widget (#257), FB5 generative-ui-renderer (#258, deferred), FB6 interactive MCP-App bridge (#272, deferred to stable) |
| `plugin-ai` + doctrine | #259–#263, +#290/#388 | 6 | P1–P3, P6 doctrine (#259–#261, #263) | P5 `--gateway` (#262, moved up to beta.4), P2-follow `--mcp`/skill scaffolder (#290, moved up to beta.4), **#388 flagship parity (new, `priority:p1`)** |
| Deferred/track-only | #266, #271 | 2 | — | #266 usage/cost analytics (explicit track-only, not a framework seam), #271 skill-authoring approval-gate (deferred to stable) |

**Totals:** 21 closed, 18 open (including the umbrella #238 and anchor #219 themselves), plus the
adjacent process-guardrail #387 (not `epic:ai-stack`-labeled). See
`research/F-ai/04-github-ai-program-state.md` §3–§4 for the full per-issue table and the confirming
negative sweep (no orphan AI issue exists outside this label set).

## 4. Current-vs-target delta — top gaps

1. **Contract-bypass in the reference scaffold (highest-signal gap).** `plugin-ai-core`'s `/v1/ai`
   oRPC contract (file 01 §3) is fully typed and shipped, but the `plugins/ai` stream-proxy
   scaffolder (`plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts:16-64`) never
   constructs or binds `aiContractV1`/`AiRouter` — it hand-writes a raw `Request → Response` POST
   handler that calls `@netscript/ai/agent` directly. This is precisely the defect GitHub #388
   names: *"the contract exists in `plugin-ai-core` but is unexercised."* Confirmed here by direct
   source read (file 01 §4.2), not merely cited from the issue.
2. **Flagship parity is the single load-bearing open issue (#388).** Freshly filed 2026-07-04,
   `priority:p1`, scopes: an in-repo `/v1/ai` contract implementation + contract-soundness test, a
   `scaffold.runtime` e2e case for `ai` (default + `--persist-threads` + `--mcp`), a
   `verify-plugin.ts`, scaffolder golden tests for all 7 emitters, a `plugin doctor` test, and a
   recorded parity review vs. workers/sagas. See file 03 for the full flagship-mandate grounding.
3. **Telemetry adapter (E9/#248) does not exist yet.** `TelemetryPort` (file 01 §2.2) ships only a
   no-op default; the richer OTel GenAI/MCP-semconv adapter (`@netscript/ai/otel` subpath, per
   #248's title) is explicitly deferred and tracked as open, milestone beta.4. This is the direct
   seam Topic-B telemetry needs — see §5 below and the (optional) telemetry/dashboard seam note.
4. **fresh-ui `ai` component registry status is unverified from source in this pass.** Home #3 of
   the five-home architecture (`@netscript/fresh-ui` `ai` registry, FB0–FB6) is reported partially
   landed (FB0–FB2 closed) via the GitHub sweep only; this cell did not independently read
   `packages/fresh-ui` source to confirm which FB-slice components actually exist on disk. Flag for
   a follow-up source-level check before Stage-C planning locks in FB-cluster scope.
5. **Documentation lag vs. shipped/open state.** `packages/fresh/src/runtime/ai/README.md`'s slice
   table lists only FA0–FA3 and does not mention FA4 (#379, filed later from the epic-delta
   re-sweep). Similarly, `plugins/ai/README.md:3` still describes the plugin as "a **thin**
   NetScript plugin" without qualification — the exact phrasing #388's motivating comment (GitHub
   #238, comment 10) calls out as needing correction ("plugins/ai's missing e2e/hardening [was]
   treated... as acceptable because it is 'deliberately thin'"). Confirmed here: the README line
   still reads exactly that way as of this read; it has not yet been updated to reflect the
   flagship-parity correction.
6. **MemoryPort (#269/E10) and RetrieverPort (#270/E11) are re-prioritized up but not yet built.**
   Originally deferred, the epic-delta re-sweep (2026-07-04, per the GitHub-state cell) elevated
   both to beta.4 because eis-chat's real usage proved memory/retrieval are its *primary* context
   strategy, not a nicety — no `MemoryPort`/`RetrieverPort` interface exists yet under
   `packages/ai/src/ports/`.
7. **Interactive MCP-App bridge is split across two open issues with an explicit dependency order.**
   FA4 (#379, the ACT half: widget action → `tools/call`) must land before FB6 (#272, the bidirectional
   bridge, deferred to stable) can be built on top of it — FA3 (#252, the render-only MCP `ui://`
   sandbox) is itself still a skeleton in `packages/fresh/src/runtime/ai/`.

## 5. Telemetry and dashboard seams (Topic-B / Topic-A cross-reference)

- **GenAI span emission seam:** `TelemetryPort` (`packages/ai/src/ports/telemetry.ts:33`,
  `startSpan`/`recordEvent`) is the injection point where a real OTel GenAI-semconv adapter would
  attach; today it is a no-op by default, and the real adapter is E9/#248 (open, beta.4). Per the
  sibling `matrix/F-ai/external-resources-matrix.md`, the live eis-chat reference **already**
  exercises this exact pattern one level down the stack — `apps/dashboard/lib/otel.ts` uses
  `@tanstack/ai/middlewares/otel`'s `chatOtelMiddleware` to emit native `gen_ai.*`-semconv spans
  (`chat <model>` root span, `execute_tool <name>` per tool call) — meaning the wrapped
  TanStack-AI layer already knows how to emit correct GenAI spans; #248's job is to surface that
  through `@netscript/ai`'s own `TelemetryPort` seam rather than requiring every consumer to
  hand-wire the TanStack middleware directly, as eis-chat currently must.
- **Dashboard AI-invocation panel seam:** no direct evidence of a dashboard-consuming surface was
  found in this pass; the natural seam is downstream of #248 landing (a dashboard panel would
  subscribe to whatever span/metric shape the E9 adapter emits). This is recorded as an open
  question for Topic-A/Topic-B cross-referencing rather than answered here — no
  `packages/dashboard`-side AI panel code was located or read in this cell.

## Verification gaps

- `packages/fresh-ui` was not read in this pass; the FB-cluster landed/open split above is sourced
  entirely from the GitHub issue state (closed vs. open), not independently confirmed against
  `packages/fresh-ui` source. Flag for Stage-C.
- No dashboard/telemetry-consumer source (`packages/telemetry`, any dashboard app) was read in this
  cell to confirm or deny an existing AI-invocation panel; §5's dashboard note is a seam
  observation, not a confirmed absence.
- This file relies on `research/F-ai/04-github-ai-program-state.md` for the full sub-issue DAG
  (issue numbers, labels, milestones); that cell notes it read GitHub live via `wsl.exe -u codex`
  on 2026-07-04 — treat DAG membership as accurate as of that date, subject to further drift if the
  epic continues to evolve.
