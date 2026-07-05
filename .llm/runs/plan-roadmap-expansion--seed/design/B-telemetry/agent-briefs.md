# `telemetry-revamp` — per-slice WSL Codex implementation briefs (Opus-B)

One brief per sub-issue (T1..T9). Implementation lane = **WSL Codex daemon-attached subagent**
(mobile-visible, per `netscript-harness`). Each brief has a `## SKILL` chapter, model/effort, files,
validation, and an IMPL-EVAL note. Draft text — the supervisor launches these after PLAN-EVAL PASS.

Global rules for every slice: contract-first (types before impl before tests); revamp, don't
greenfield (map to the existing modules named in `proposal.md`); read the package via `deno doc`
before broad source reads; validate with the scoped wrappers (`.llm/tools/run-deno-check.ts --root
packages/telemetry --ext ts,tsx` etc.) never raw root CLI as verdict; targeted `deno check` includes
`--unstable-kv`; do not touch `deno.lock` beyond what the change requires; commit-push-comment per
slice (V3: the draft-PR commit list + per-slice PR comments are the commit trail — no `commits.md`).
IMPL-EVAL is OpenHands qwen-3.7-max, separate session.

---

## T1 — Convention (TC-1..14) + attribute-namespacing law
- **Model/effort:** Opus, **medium**. (Contract authoring + mechanical builder/const edits; no unclear
  failure to debug.)
- **## SKILL:** `netscript-harness` (run loop), `netscript-doctrine` (Archetype-1 contract, A1/A8,
  folder vocab), `netscript-deno-toolchain` (`deno doc --lint` bar, isolatedDeclarations),
  `netscript-tools` (scoped wrappers), `aspire` (only to confirm OTLP defaults). Read
  `docs/architecture/doctrine/02` + `05`, `research/B-telemetry/otel-semconv-w3c-state-of-art.md`.
- **Files:** `packages/telemetry/src/attributes/spans.ts` (extend `SpanNames`),
  `attributes/helpers.ts` (add `createSaga/Execution/GenAI Attributes` builders),
  new `domain/` namespacing module + the TC checklist doc under the package README/reference.
- **Validation:** `run-deno-check.ts` + `deno doc --lint` full export set; unit tests on builders.
- **IMPL-EVAL note:** verify the `netscript.*` single-root law + the deprecated-alias `dup` window are
  real (both keys emitted for one beta), and that semconv keys are used verbatim where a domain exists
  (spot-check messaging/rpc/genai against the semconv repo names — GenAI renames are a trap).

## T2 — Ports/adapters restructure
- **Model/effort:** Opus, **high**. (Structural refactor across the whole package + JSR rewrite-map +
  layering-import correctness; the kind of move where a wrong import silently breaks the publish
  graph.)
- **## SKILL:** `netscript-doctrine` (**primary** — Archetype-2 ports/adapters, layering, forbidden
  role folders, F-3/F-5/F-6, arch-debt closure), `netscript-deno-toolchain` (`deno publish --dry-run`,
  `deno doc --lint`, JSR self-referential-subpath trap), `netscript-tools` (scoped wrappers, lock
  hygiene), `netscript-harness`. Read `docs/architecture/doctrine/05` + `09`,
  `analysis/B-telemetry/arch-debt-and-doctrine-constraints.md`,
  `analysis/B-telemetry/telemetry-package-surface.md`.
- **Files:** move `src/core/*`→`domain/`+`application/`; delete `src/public/mod.ts`; new
  `ports/`, `adapters/otel-deno` skeleton, `adapters/aspire-query` skeleton, `testing/`; real
  `registry.ts` facade; `deno.json` export map (`./otel`, `./query`); `mod.ts` barrel completion;
  scaffold `workspace-mutator.ts:196-203` rewrite-map (all subpaths); env config Standard Schema.
- **Validation:** layering-import check (no `application`→`adapters`); `deno doc --lint` FULL export
  set; `deno publish --dry-run --allow-dirty` from the package dir; `deps:prod-install` (surface still
  installs); scaffold e2e smoke for the rewrite-map. **Consumers must still compile** — keep subpath
  compat.
- **IMPL-EVAL note:** confirm NO forbidden role folder remains, orphan deleted, `./registry` no longer
  points straight at `src/runtime/mod.ts`, arch-debt Refactor entry closed with F-gate evidence, and
  the two new subpaths appear in both `deno.json` AND the scaffold rewrite-map (memory: rewrite-map
  gap). Watch `deno.lock` churn.

## T3 — Provider adapters (thin/SDK) + decouple `enabled`
- **Model/effort:** Opus, **high**. (Load-bearing design fork; must keep the default graph zero-dep
  while adding an opt-in heavy SDK adapter — easy to accidentally pull the SDK into the default path.)
- **## SKILL:** `netscript-doctrine` (composition root A10, ports), `netscript-deno-toolchain`
  (**critical** — catalog law `catalog:` npm-only, `deps:prod-install` to prove the SDK stays out of
  the default graph, `deno why`), `aspire` (OTLP 4318 http/protobuf defaults),
  `netscript-tools`, `netscript-harness`. Read `research/B-telemetry/otel-semconv-w3c-state-of-art.md`
  §5-6 (Deno-native limits + grpc friction), proposal §3.
- **Files:** `ports/*Port.ts`; `adapters/otel-deno/*` (bind `@opentelemetry/api` global — do NOT call
  `setGlobalTracerProvider`); `adapters/otel-sdk/*` (`@opentelemetry/sdk-trace-*` + HTTP-OTLP exporter,
  flush-on-exit); `src/config/environment.ts` (`enabled` union + `NETSCRIPT_TELEMETRY_ENABLED` +
  `NETSCRIPT_TELEMETRY_PROVIDER`); wire `InstrumentationRegistry` as the composition seam.
- **Validation:** `deps:prod-install` proves default surface has NO `@opentelemetry/sdk-*` runtime dep;
  unit test both `enabled` paths; SDK-adapter test asserts `supportsLinkAttributes=true` + link
  attributes present + observable-meter flush on SIGTERM.
- **IMPL-EVAL note:** the make-or-break check is that the SDK adapter is genuinely **opt-in** (default
  build zero-runtime-dep via `deps:prod-install`), and that HTTP-OTLP (not grpc) is used. Confirm
  `enabled` decoupled from `OTEL_DENO`.

## T4 — W3C hardening + triggers parenting bugfix
- **Model/effort:** Opus, **high**. (Correctness bug in async context propagation — the exact class of
  "unclear failure / choose among fixes" that warrants high.)
- **## SKILL:** `netscript-doctrine` (Archetype-5 plugin, plugin-core dependency law),
  `netscript-harness`, `netscript-tools`, `netscript-deno-toolchain`. Read
  `analysis/B-telemetry/plugin-instrumentation-grading.md` §triggers, proposal §4-triggers/§5;
  memory `db-init` unrelated. The bug: `plugin-triggers-core/src/runtime/create-trigger-ingress.ts`
  captures `traceparent`/`tracestate` (L156-157) but `#processAndRecord` (L171-189) calls
  `processor.process(...)` without the parent context.
- **Files:** `application` `extractContext` (tracestate fix + version-byte validation + test);
  `plugin-triggers-core/src/runtime/create-trigger-ingress.ts` (thread parent context into
  `#processAndRecord`/`processor.process`); add SERVER ingress span; wire `TriggerInstrumentation`
  core; converge processor off `getTracer('@netscript/triggers')` onto shared facade.
- **Validation:** regression test asserting ingress span + process span share `traceId`; tracestate
  round-trip test; triggers plugin check + the trigger slice of `scaffold.runtime`.
- **IMPL-EVAL note:** the regression test must FAIL against the pre-fix code (prove it catches the bug)
  and pass after. Confirm triggers no longer instantiates a private tracer (TC-13).

## T5 — Real fan-in span-links (streams zero + sagas)
- **Model/effort:** Opus, **high**. (First-instrumentation of streams + replacing mock links with real
  attributed links across two plugins; head-sampling link-at-creation subtlety.)
- **## SKILL:** `netscript-doctrine` (Archetype-5, plugin-thinness law — memory), `netscript-harness`,
  `netscript-tools`, `netscript-deno-toolchain`. Read `research/B-telemetry/otel-semconv-w3c-state-of-
  art.md` §3 (messaging links model), proposal §4-streams/§4-sagas/§5;
  `packages/database/prisma-tracing.ts` (the `addLinks`/`linkIds` reference to promote).
- **Files:** shared `ports/SpanLinkPort` + `application` `createFanInLinks`; `plugin-streams-core`
  producer/consumer instrumentation (new `application/instrumentation/streams` facade + wire-in);
  `plugins/sagas/src/telemetry/*` (converge off `otel-saga-tracer.ts`, lift 7 meter instruments to
  shared, real-by-default facade, real cascade links replacing the `publish-trace-linkage_test.ts`
  mock no-ops).
- **Validation:** streams unit tests assert PRODUCER/CONSUMER spans + links with attributes (SDK
  adapter); sagas cascade test asserts real links (not mock); streams+sagas slices of `scaffold.
  runtime`.
- **IMPL-EVAL note:** verify links are attached **at span creation** (not post-hoc), carry per-message
  attributes, and that the sagas "fan-in links" are now real (the prior claim was a test-mock no-op).
  Runs under `NETSCRIPT_TELEMETRY_PROVIDER=sdk` for the link-attribute assertions.

## T6 — oRPC span-creation + AI port invocation
- **Model/effort:** Opus, **medium**. (Well-scoped fixes across service/sdk/ai; the fix shape is clear
  from the grading.)
- **## SKILL:** `netscript-doctrine` (plugin-service type-unsoundness memory — do not deepen the
  phantom-typed seam; Archetype-2/5), `netscript-harness`, `netscript-tools`. Read
  `analysis/B-telemetry/telemetry-package-surface.md` §5 (TracingPlugin enrich-only),
  `plugin-instrumentation-grading.md` §ai/§services, proposal §4-services/§4-ai.
- **Files:** `packages/telemetry/adapters/orpc/*` (create span when none active; `rpc.*` semconv +
  shared `SpanNames`); `packages/sdk/src/client/service-client.ts` (client-side CLIENT span, not just
  header copy); `packages/ai/src/runtime/mod.ts` (invoke the injected `TelemetryPort` — minimal real
  span); workers metrics via TC-11; resolve `createJobTools` no-op.
- **Validation:** unit test oRPC plugin produces a span with Deno HTTP auto-instr OFF; AI runtime test
  asserts a span through the port; service + workers slices of `scaffold.runtime`.
- **IMPL-EVAL note:** the key check is that the oRPC plugin is no longer a **silent no-op** — a span
  exists even without `OTEL_DENO` HTTP auto-instrumentation — and that the AI `TelemetryPort` is
  actually called (grading found zero `telemetry.` calls in the AI runtime). Do NOT add new `any`
  casts to the service seam (E2E type-soundness memory: only the 2 accepted casts).

## T7 — Dashboard query/export surface (`@netscript/telemetry/query`)
- **Model/effort:** Opus, **medium**. (Generalize existing reference code over a documented HTTP API;
  clear shape.)
- **## SKILL:** `aspire` (**primary** — `/api/telemetry/*`, `--isolated` ephemeral ports, dashboard
  api-key/anonymous mode; note `aspire otel` CLI is broken, use HTTP), `netscript-doctrine`
  (Archetype-2 adapter), `netscript-deno-toolchain` (`deno doc --lint`), `netscript-tools`,
  `netscript-harness`. Read `research/B-telemetry/aspire-otlp-ingestion-and-query-api-landscape.md`,
  `context/A-dashboard/01-telemetry-consumer-seam.md`, proposal §7;
  `packages/cli/.../telemetry/(_shared)/telemetry-trace.ts.template` (the reader to generalize) +
  `otel-gates.ts` (endpoint resolution precedent).
- **Files:** `application/query/*` (typed `TelemetryTrace/Span/Log/Resource` + query fns),
  `adapters/aspire-query/*` (HTTP reader, `?follow` NDJSON, `?resource` filter, endpoint+api-key
  resolver), `./query` export; `exportTraces`→OTLP-JSON.
- **Validation:** integration test resolves the live Aspire base URL from `.netscript/e2e/aspire-
  start.json` and returns a grouped `TelemetryTrace`; degradation test with no local Aspire; runs
  inside `scaffold.runtime` (Aspire started).
- **IMPL-EVAL note:** confirm the dashboard-facing contract is NetScript-owned types (not raw Aspire
  JSON leaking through), that endpoint discovery handles ephemeral/`--isolated` ports + api-key, and
  graceful `--no-aspire` degradation. **Coordinate co-land with Opus-A's dashboard data layer.**

## T8 — Real (non-mocked) grouped-trace e2e — Flow B
- **Model/effort:** Opus, **high**. (Multi-process real-trace assertions against a live dashboard API;
  flaky-surface engineering — must be deterministic, no span mocks.)
- **## SKILL:** `netscript-cli` (e2e suite structure, `scaffold.runtime`), `aspire` (query API),
  `netscript-harness`, `netscript-tools`. Read `analysis/B-telemetry/native-polyglot-and-aspire-
  orchestration.md`, proposal §6; `packages/cli/e2e/src/application/gates/scaffold/otel-gates.ts`
  (`BEHAVIOR_OTEL_TRACES` to generalize).
- **Files:** extend `otel-gates.ts` into the Flow-B assertion suite (single trace_id; parent/child
  edges; fan-in link; no-severed-trace guard; attribute floor); wire a **real streams consumer** for
  the fan-in leg (not eis-chat's inert scaffold).
- **Validation:** `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` green with the new
  assertions; each assertion maps to a TC and to T4/T5/T6 behavior.
- **IMPL-EVAL note:** assertions must run against **real processes + the real Aspire `/api/telemetry`
  API** (no span mocks). Verify the no-severed-trace guard would go red if the T4 triggers fix were
  reverted, and the callback-parenting assertion red if the T6 oRPC fix were reverted (the guards must
  bite). This is the **epic merge-gate**; expensive — run at merge-readiness, not every loop.

## T9 — AI OTel adapter (GenAI semconv) + Flow A cross-language — STABLE
- **Model/effort:** **Fable 5, high** — deliberately a single heavy sub-agent (flagship-AI mandate +
  GenAI-semconv correctness + cross-language shim is the "extremely complex single-threaded" case the
  cost policy reserves Fable 5 for). NOT a workflow fan-out.
- **## SKILL:** `netscript-doctrine` (AI plugin flagship-quality mandate + AI-stack architecture
  memories — meet-or-exceed reference bar), `netscript-harness`, `netscript-deno-toolchain`,
  `aspire`, `netscript-tools`. Read `research/B-telemetry/otel-semconv-w3c-state-of-art.md` §1 (GenAI
  renames), the semantic-conventions GenAI spans doc directly, proposal §4-ai/§5/§6-FlowA.
- **Files:** `adapters/otel` AI `TelemetryPort` impl (GenAI-semconv spans, `gen_ai.*`, token-usage
  observable metrics, `gen_ai_latest_experimental` gate); Deno-side `Deno.Command` span + `TRACEPARENT`
  inject for the duckdb hop; per-language trace shim (`netscript-trace` helper); MCP HTTP-transport
  propagation confirm/wire; rich AI trace views (with Opus-A).
- **Validation:** GenAI span names verified against the semconv repo; token metrics flush on exit (SDK
  adapter); Flow-A e2e shows the duckdb hop as a real span in the parent trace.
- **IMPL-EVAL note:** GenAI attribute/span names MUST match the current semconv (the rename trap:
  `gen_ai.system`→`provider.name`, `prompt_tokens`→`input_tokens`); redaction on by default
  (captureContent=false, TC-8); duckdb child continuation honest (Deno-side span minimum; true child
  via the shim is the stretch). Stable-tier — not a beta.6 blocker.

---

## Launch sequencing note (for the supervisor)
Launch T1+T2 first (beta.5). After T2 lands the ports/adapters skeleton, fan out T3, T4, T6, T7 in
parallel (T4/T6/T7 depend only on T1+T2; T5 waits on T3's SDK adapter). T8 launches last (gates on
T4/T5/T6/T7) and is the epic merge-gate. T9 is post-beta.6, stable-tier, single Fable-5 sub-agent.
Each slice: WSL Codex daemon-attached, commit-push-comment, then next (V3: the draft-PR commit
list + per-slice PR comments are the commit trail — no `commits.md`).
