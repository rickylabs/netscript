# Stage-C Synthesis — Fable 5 long-range remediation roadmap

Supervisor synthesis of the full Stage-B corpus (19 artifacts: `research/preplan-package.md`,
4 wave files, 3 board files, 8 repo-audit files, 3 external files). Every claim below traces to a
corpus file; corpus files carry the primary citations. Written by the Tier-A supervisor
(Fable 5 · high) after reviewing all corpus artifacts. **Draft — no board mutation.**

## 1. Answer to the core question

**What prevents NetScript from being a credible, differentiated production-grade meta-framework
is not missing capability — it is that the product surface (generated app + docs + typed seams +
runtime proof) contradicts the capability.** The corpus proves this four ways:

1. **The APIs exist and reach product quality when used.** eis-chat reaches the bar using only
   `packages/fresh` APIs on main — with zero `any` — by inventing six app-space conventions the
   scaffold does not generate (`research/external/eis-chat.md` §1–3). The framework's own example
   route uses `defineRouteContract`/`withResource`/forms (`research/repo-audit/mcp-cli.md` #9).
2. **The generated path contradicts the idiomatic path.** `ui:add page --island` — the verb the
   generated agent conventions tell agents to run — emits a `useSignal(0)` counter and an empty
   `queryLoaders = {}`, and writes to the wrong tree (`resolveProjectRoot` returns the workspace
   root while the app lives at `apps/<name>/`) (`repo-audit/mcp-cli.md` #7, #11). The default
   scaffold demonstrates none of the page-builder surface (`repo-audit/web-layer.md` §canonical).
3. **The typed seam is sealed exactly where products must extend it.** `CreateServiceClientOptions`
   is a closed 9-field record; no headers/interceptors/plugins/fetch/link/context seam;
   `createHttpClientLink` unexported; so the shipped auth plugin cannot ride the typed client and
   the scaffold leaves `/api` public — a framework test codifies it (`repo-audit/services-sdk.md`
   S-findings; `repo-audit/auth.md`). The oRPC pin is **not** the blocker: 1.14.6 vs 1.14.15
   public exports are identical; every gap is NetScript's own wrapper erasure
   (`research/external/orpc.md`).
4. **Runtime claims outrun runtime truth.** The shipped sample job discards the saga publish
   receipt (mirrored verbatim in docs); `STREAMS_DATA_DIR` is referenced by nothing so "durable"
   streams are always in-memory; background children have zero health checks; 5 of 6 saga span
   factories have zero callers so compensation is invisible in traces
   (`repo-audit/runtime-plugins.md` #4, #7, #8; `repo-audit/observability-aspire.md` GAP-1).

Six waves of measured agent runs corroborate the mechanism: capability present is not capability
activated (`#1090` thesis); docs/MCP discovery is structurally weak (0 MCP calls across six
consecutive measured runs, `github-board-open.md` §6.3/#1197); and the two GO-grade Wave-6 runs
still hand-rolled everything the missing generators should have emitted
(`research/wave-6-runs.md`, `research/preplan-package.md`).

**Direction (confirmed from the pre-plan, now evidence-hardened): generation over prose, types
over convention-only guidance, composable seams over one-off escape hatches — plus a fourth leg
the pre-plan under-weighted: runtime truth over green wrappers** (health/receipts/traces that fail
when the seam is removed).

## 2. Gap taxonomy (charter classes → evidence)

| Class | Signature findings (corpus refs) |
| --- | --- |
| Docs/discovery failure | 4 P0 docs breaks on one seam — three names for one client module, two query dialects both taught as canonical, `--with-client` cited once site-wide; `docs:accuracy` is a needle-checker; MCP default corpus is 1–2 documents and `agent init` emits `.mcp.json` without `--docs-root` (`repo-audit/docs-quickstart.md`, `repo-audit/mcp-cli.md` #2–3) |
| Scaffold/generation failure | counter-stub `ui:add page`; mis-rooted `resolveProjectRoot`; no second-service client/query generator; hardcoded `dashboard`/`users` names; `/design` gallery 50-item snapshot vs 66-item live registry; quality-runner `SOURCE_ROOTS` decoupled from workspace members (`repo-audit/mcp-cli.md`, `repo-audit/scaffold-doctrine.md` D1–D4) |
| API/type-system seam | closed SDK client record; `PluginContributions` has no client/SDK group and a closed `doctorChecks` literal; `safe<TOutput>` drops `TError` (`isDefinedError` → `never`, executed-check-proven); `ServiceRouter = Record<string, unknown>`; `$meta()` used zero times (`repo-audit/services-sdk.md`, `research/external/orpc.md` G1–G11) |
| Runtime correctness | discarded saga publish receipts + `127.0.0.1:8092` fallback; producer drops writes forever (#1326, open); always-in-memory streams; `WORKER_CONCURRENCY` vs `WORKERS_CONCURRENCY`; hardcoded pre-randomization ports in sagas/triggers/streams stubs (`repo-audit/runtime-plugins.md`) |
| Plugin-composition failure | first-party plugin services structurally unguardable (`createPluginService` has no auth option); discovery hardcodes official factory callees (#1093); Aspire `composeAppHost` seam is dead code (`repo-audit/auth.md`, `repo-audit/runtime-plugins.md` #5) |
| Harness/evaluation failure | E2E probes API health only, never background children or streams — why #1325 shipped green; no E2E asserts any `saga.*` span; `docs:accuracy`/`check-exports-drift` cover fractions (`repo-audit/runtime-plugins.md` #7, `repo-audit/observability-aspire.md` gap 3) |
| Product expectation outside framework scope | tenancy in a demo (#884/#885 own the framework leg); webhook dispatcher (no promised primitive — decide recipe vs template); mobile-action loss (→ #1333 acceptance) (`research/preplan-package.md` §verify-first) |

## 3. Adjudications of supervisor-delegated decisions

1. **Trigger Redis glue / `ServiceReferences` injection (Wave-6 R2 "D-class" vs R3 "docs").**
   Adjudicated **framework generation defects**. The triggers glue omission is proven at source
   (`runtime.stub.ts` emits no `@netscript/kv/redis` import — `repo-audit/runtime-plugins.md` #2)
   and owned by **#1325**. `ServiceReferences`-parsed-but-never-injected has **no board owner**
   found by the board sweep → new issue draft, flagged verify-on-current-canary first.
2. **#1276 vs #1278 (type-soundness duplicates).** Keep **#1278** (milestoned 0.0.6, inventory
   A–D + guard-rail shape) as the epic-of-record; propose folding #1276's unique measured numbers
   (56 `as unknown as`, 8 lint-ignores, 7 `quality:scan` allowances, tranche T1–T6 structure)
   into #1278 via amendment, then owner closes #1276 as superseded. Rationale: milestone
   assignment + richer acceptance shape live on #1278; #1276's tranches survive as #1278 phases.
3. **#1275 vs #1279 (migration-chapter duplicates).** Keep **#1279**; fold/close #1275. Propose
   moving #1279 out of 0.0.6 (migration docs are post-remediation marketing surface, not
   remediation) to the late train.
4. **#1245.** RESCOPE, do not re-implement: ~75% landed via merged #1265. Remnant =
   `getIslandQueryClient()` `@throws`-vs-body mismatch, regression tests, and a consumer
   migration note so eis-chat-class apps delete their six copied casts
   (`repo-audit/web-layer.md`; `external/eis-chat.md` #7).
5. **Webhook dispatch.** Not a framework defect. Disposition: first-party **recipe + worker
   template** (docs + generation), not a new plugin; p2 draft under the service/command pillar.
6. **Theme-island CORS, saga OOM, plugin-doctor layout.** Remain verify-first rows (repro on the
   current canary before filing); plugin-doctor routes through #1343's installed-consumer smoke.
7. **Divergent agent claims.** Where two corpus agents disagree, the domain agent with source
   citations wins (e.g. MCP tool count = 21 per `tool-types.ts:4-26`, over the external agent's
   abstention; wave-3 effort = Sol high per 3-of-4 sources).

## 4. Deep-dive topics (Stage-D design packs)

- **T1 — Typed extension architecture (RFC-A + oRPC re-exposure).** `SdkClientContribution`
  contract; reopen the erased oRPC seams (headers/interceptors/plugins/link/context/typed
  errors/`$meta` policy metadata); auth as first dogfood consumer + one non-auth contribution;
  transport-policy consolidation ahead of oRPC v2. Depends on nothing; unblocks T2/T5/auth.
- **T2 — Canonical vertical slice + generation.** Resource/route-slice generator; contract-derived
  client/query/invalidation generator; fix `resolveProjectRoot`; `ui:add page` triad made real;
  #1333 acceptance expansion; route-local groups; `/design` registry sync gate; dynamic app
  naming. Consumes T1's client contract.
- **T3 — Service architecture + production command slice.** #1335 service-layout child
  (collapsible `domain/application/ports/adapters`); command-composition kit RFC
  (transaction/idempotency/audit/outbox/optimistic-concurrency); `service add-handler` placement;
  webhook-delivery recipe/template.
- **T4 — Runtime truth.** Saga publish receipts + endpoint discovery (new p0); plugin child
  liveness/health contract (distinct from blocked #1280); stream durability semantics
  (`STREAMS_DATA_DIR`); saga compensation telemetry call-sites; env-var name mismatches;
  hardcoded-port stubs (feeds #979); E2E gates that probe children and assert `saga.*` spans.
- **T5 — Docs & agent discovery.** Tier-1 docs rewrite to ONE dialect of the canonical seam;
  compile-the-docs gate replacing the needle checker; MCP corpus wiring (`--docs-root` in emitted
  `.mcp.json`, #1260/#1201/#1102 chain intact); README/Quickstart truth; package reference pages.
- **T6 — Type soundness + board hygiene.** #1278-of-record amendment + fold plan; #1245 rescope;
  #1249; remaining-cast burn-down; `quality:scan` extension to exported types + docs snippets;
  board hygiene amendment pack (stale epic checkboxes #301/#1126/#1335, labels.yml parity,
  0.0.2 stragglers, unmilestoned #979/#980/#1000).
- **T7 — Wave-7 harness + measured adoption.** Thin: capability-map rows proved/simulated/absent/
  rejected; causal-trace rules; generated-slice-command usage or recorded rejection; measurement
  chain #1102/#1201 (build) → #1197 (re-measure) → #1090 (observe) untouched as owners.
- **T8 — Milestone train + program sequencing.** Rename-shift insertion per house pattern;
  epic-overlap normalization (#823⊂#327, #400↔#922 re-baseline, #892 vs #327/#830); every issue
  retained and moved with written reasons.

## 5. Milestone-train direction (to lock at Stage E)

Constraints from the corpus: 0.0.5 is mid-canary with 21 open issues incl. 4 p0 + #1338
(`status:impl`); 0.0.7 is entirely #922's critical path (9 p0s); 0.0.8/0.0.13 are the two big
forward buckets; the house shift pattern is rename-in-place highest→lowest then create the freed
title; canary-first release doctrine per `netscript-release`.

Working proposal (Stage E finalizes exact renames + per-issue moves):

1. **0.0.5 closes as re-scoped** — the undispatched W2–W5 remainder (streams pair #1326+#1329,
   #1333, #1208 phase 1, plus its existing tail) finishes the milestone; no new scope enters.
2. **0.0.6 stays the verification + docs/MCP + soundness cut** (#1343, #1210, #1260, #1201,
   #1278 amended, #1093), gaining only the docs P0-dialect fixes and the two RFC ratifications
   (RFC-A SDK composition; RFC command-kit) as *RFC tracking issues* — implementation stays out.
3. **Insert two remediation milestones** after 0.0.6 by the rename-shift pattern: new **0.0.7 =
   "Typed seams + generation"** (RFC-A implementation, client/query generator, route-slice
   generator, `resolveProjectRoot`, #1333 completion follow-ups) and new **0.0.8 = "Runtime truth
   + service slice"** (saga receipts, child liveness, stream durability, service layout + command
   kit). Current 0.0.7–0.0.13 shift to 0.0.9–0.0.15 wholesale, preserving every issue and
   internal ordering (#922's train moves intact; its stale beta.13/15/17 body labels get an
   amendment, not a rewrite).
4. **Wave-7 smoke** gates the exit of new-0.0.7/0.0.8 (a measured unfamiliar-agent run must show
   the generated path changes behavior before the train advances past remediation).

Open fork for the owner (carried to plan lock): whether #922 Wave-0 proofs (#923–#927) should
precede RFC-A implementation (contract-coherence argument: both define plugin contribution axes)
or run after new-0.0.8. Default proposal: RFC-A ratifies in 0.0.6 with #928's envelope reviewed
against it; #922 implementation stays at its shifted position (new 0.0.9).

## 6. New-issue surface (drafting input for Stage D)

Every candidate below was checked against the dedup checklist (`github-board-open.md` §7) and has
**no existing owner**; drafts must carry `## Boundaries` naming the adjacent owners. Grouped by
pack: T1: RFC-A tracking issue; oRPC seam re-exposure; typed-error repair (`safe`/`isDefinedError`,
`baseContract` widening); transport-policy consolidation (pre-oRPC-v2). T2: route-slice generator;
client/query/invalidation generator; `resolveProjectRoot` fix; `ui:add page` triad; `/design`
registry sync; `crudExample` alias bug; canonical island `initialDataUpdatedAt` wiring. T3:
service-layout child; command-kit RFC; webhook recipe. T4: saga receipt p0; plugin child liveness;
stream durability; saga-span call-sites; env-name mismatches; stub port hardcodes;
`ServiceReferences` injection (verify-first); E2E child/span gates. T5: Tier-1 docs rewrite;
compile-the-docs gate; MCP `--docs-root` wiring; `execute_command` version pin fix; package
reference pages. T6: `quality:scan` extension; fresh-ui inclusion in root check/lint; doctrine
verdict refresh (D6); `arch:check:repo` accepted-red closure plan (D8); board-hygiene amendments.
T7: Wave-7 rubric/harness issue(s). Auth (T1-adjacent, checked against #871's 16 children which
own *enterprise* scope, not these defects): plugin-service auth seam; signout-without-session
defect; oRPC Set-Cookie discard; scaffold `/api` protection default; principal typing.

## 7. Sharpest risks

1. **Duplicate filing** — 9 prose-only umbrellas + the #1208-phase-2 promised-but-nonexistent
   issue are the top traps; every draft carries `## Boundaries` + dedup row.
2. **Re-implementing landed work** — #1245 (75% landed), #1328/#1184 closed; drafts must cite
   current source, not wave-era observations.
3. **Board-shift blast radius** — renaming 7 milestones touches ~150 issues' display; mitigated
   by the house rename pattern (no per-issue mutation) + a written move ledger.
4. **RFC-A over-design** — the seam must stay host-app-usable without plugins; oRPC already
   provides the machinery; the RFC should mostly *unhide* it (`external/orpc.md` key negative
   result).
5. **0.0.5 scope creep** — remediation lands after 0.0.5 closes; only already-scoped W2–W5 work
   finishes there.
