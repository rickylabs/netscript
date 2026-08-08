export const meta = {
  name: 'd-design-packs',
  description: 'Stage D: milestone design packs — issue drafts, RFC drafts, amendments (drafts only)',
  phases: [
    { title: 'Packs', detail: 'seven drafting agents, one per remediation pack' },
  ],
}

const RUN = '/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed'
const PLAN = `${RUN}/fable-5-remediation-plan`

const COMMON = `You are an Opus drafting contributor in a planning-only NetScript seed run.
Worktree /home/codex/repos/netscript-fable5-remediation-plan (baseline == origin/main
fac9e339042c). HARD RULES:
- DRAFTS ONLY. Never mutate GitHub. Never edit repo source. Write ONLY inside your assigned
  output directory/files under ${PLAN}/. Every file's H1 line must end with
  " — DRAFT (no GitHub mutation; owner ratification pending)".
- READ FIRST (mandatory): ${PLAN}/SYNTHESIS.md (your pack's scope in §4/§6, adjudications §3,
  train §5), ${PLAN}/research/github-conventions.md (house title/body/label/acceptance shapes),
  ${PLAN}/research/github-board-open.md §7 dedup checklist + §4 umbrella map, and the corpus
  files named in your task. Verify load-bearing code claims against the worktree
  (file:line) before asserting them in a draft — the corpus is your map, the source is truth.
- EVERY issue draft uses this exact structure:
  # <house-shaped title per conventions §6> — DRAFT (…)
  **Draft-ID:** <pack>-<nn> · **Proposed milestone:** <one> · **Labels:** <type:… area:…
  priority:… status:triage> · **Depends on:** <draft-IDs / #issue numbers / none>
  ## Summary            (problem + why now, 2-4 sentences)
  ## Evidence           (cited: corpus file + repo file:line + issue numbers)
  ## Current surface    (what exists today, cited)
  ## Target contract    (the post-fix contract, concrete)
  ## Acceptance         (checkboxes; include NEGATIVE tests/gates; keep box text short+stable;
                         use [post-merge] marker only for post-publish facts)
  ## Boundaries         (non-goals + the adjacent owner issues you must NOT duplicate, by #)
  ## Docs/consumer proof (what docs/consumer evidence proves adoption)
  ## Provenance         (seed run plan-fable5-remediation-roadmap--seed, PR #1347, date 2026-08-08)
- Dedup law: check every draft against the §7 checklist; if an existing issue owns the gap,
  DO NOT draft it — record it for the amendments file instead (note in your return).
- Priorities: p0 only for runtime-correctness/data-loss/security; p1 default for seam/generation
  work; p2 docs-polish/nice-to-have.
- No praise, no filler. Each draft must be implementable by a stranger without this chat.
- RETURN: a compact manifest — one line per file written: path · draft-ID · title · milestone ·
  priority · depends-on. Plus any gaps you intentionally left undrafted and why.`

phase('Packs')

const jobs = [
  {
    label: 'pack:rfc-a',
    prompt: `PACK T1 — Typed extension architecture. Read also: research/repo-audit/services-sdk.md,
research/repo-audit/auth.md, research/external/orpc.md.
WRITE:
1. ${PLAN}/rfcs/RFC-A-sdk-client-composition.md — full RFC draft in the #1123 numbered-section
   shape (Abstract / Motivation / Guide-level / Reference-level / Drawbacks / Alternatives /
   Prior art (oRPC mechanisms, tRPC links) / Unresolved questions / Board plan). Core: a versioned
   SdkClientContribution / client-extension contract; contributions extend client construction,
   request context, headers/credentials, transport middleware/interceptors, procedure metadata
   (policy via oRPC $meta), response/error types, query factories and invalidation in ONE typed
   chain; mostly UNHIDE oRPC 1.14.6 machinery (RPCLink.headers, plugins, interceptors, typed
   errors) rather than invent; host-app usable WITHOUT plugins; compile/config-time failure for
   absence/version-mismatch/conflict; server/client env boundaries; auth = first dogfood, one
   non-auth second contribution proves generality; alignment notes vs #1093, #922/#928/#934,
   #884; oRPC v2 (verb restriction) forward-compat.
2. ${PLAN}/milestones/0.0.6-verification-docs-rfcs/T1-01-rfc-a-tracking-issue.md — RFC tracking
   issue draft (rfc: title form, labels rfc + type:feat + area:sdk area:plugins).
3. In ${PLAN}/milestones/0.0.7-typed-seams-generation/: T1-02 oRPC seam re-exposure (headers/
   interceptors/plugins/fetch/link export, ServiceClientContext generic, RPCHandlerConfig.plugins
   reachability); T1-03 typed-error repair (safe<TOutput> drops TError → isDefinedError narrows
   to never — executed-check-proven; baseContract oc.errors widening; docs example at
   services-sdk/sdk.md:199 must compile); T1-04 transport-policy consolidation pre-oRPC-v2 (GET
   method inference behind one NetScript-owned function); T1-05 auth contribution dogfood
   (authClient(…) through the typed chain; scaffold protects /api by default is NOT here — that
   is the auth pack's); T1-06 second non-auth contribution (pick: telemetry/trace-context or
   AI-headers contribution; justify choice). All depend on T1-01 ratification.`,
  },
  {
    label: 'pack:generation',
    prompt: `PACK T2 — Canonical vertical slice + generation. Read also:
research/repo-audit/mcp-cli.md, research/repo-audit/web-layer.md, research/external/eis-chat.md,
research/repo-audit/scaffold-doctrine.md (D1-D4).
WRITE into ${PLAN}/milestones/0.0.7-typed-seams-generation/:
T2-01 resource/route-slice generator (extend ui:add page: typed route contract + definePage root
+ route-local (_components)/(_islands)/(_shared)/(_lib) with ownership comments + contract-derived
cache-first loader + withResource + optional --form/--partial/--stream + state stubs from
app-owned Fresh-UI + tests rejecting any/raw-fetch/manual parsing; composable core-vs-full);
T2-02 contract-derived SDK/query/invalidation module generator (manifest-derived names, real
procedure/tag-derived keys — today keys collide on literal 'service' and bridgeInvalidation is a
proven no-op (services-sdk.md S-findings); installed contributions included; idempotent, drift-
reporting, second-run byte-identical; integrates with service add/generate); T2-03 fix
resolveProjectRoot app-root targeting (+ the E2E gate that encodes the wrong root, + the
nonexistent --app flag doc); T2-04 make ui:add page emit the advertised data-screen triad (kill
the useSignal(0) counter + empty queryLoaders); T2-05 /design registry sync gate (50-item
snapshot vs 66 live manifest, AI collection missing; add drift gate); T2-06 crudExample route
alias defect (appRoutes.crudExample aliases serviceExample; test asserts the bug); T2-07 wire
cachedAt→initialDataUpdatedAt through the canonical island (the #1265 seam is unexercised;
consumer migration note for eis-chat-class casts). Boundaries: #1333 owns the default-app
modernization acceptance (do NOT duplicate; T2 drafts are the generators/fixes it composes with);
#946 owns plugin frontend convention generation; #1335 owns the conformance inventory.
Dependencies: T2-01/T2-02 depend on RFC-A (T1-01) only for the contribution-inclusion part —
state partial independence explicitly.`,
  },
  {
    label: 'pack:service-command',
    prompt: `PACK T3 — Service architecture + production command slice. Read also:
research/repo-audit/services-sdk.md (S-findings on service folders), research/preplan-package.md
(items H + service-layout child), research/wave-6-runs.md (billing evidence).
WRITE:
1. ${PLAN}/rfcs/RFC-B-command-composition-kit.md — full RFC draft (#1123 shape): DB-adapter-
   neutral command composition seam — transaction/UoW boundary, expected-state/optimistic version
   condition, idempotency key + request hash + replay receipt, audit + outbox in the same commit,
   correlation/OTEL attributes, injected-failure testing, explicit compensation boundary; honest
   per-adapter capability limits if the portable boundary cannot exist; must NOT become a
   billing framework.
2. ${PLAN}/milestones/0.0.6-verification-docs-rfcs/T3-01-rfc-b-tracking-issue.md.
3. In ${PLAN}/milestones/0.0.8-runtime-truth-service-slice/: T3-02 service-layout child of #1335
   (collapsible domain/application/ports/adapters/routers/auth vocabulary; small services may
   collapse; service add-handler places into the slice; router stays thin adapter; generated
   multi-entity service proof: check/lint/fmt/test clean, no casts; decision table + migration
   path; 'Part of #1335' linkage); T3-03 command-kit implementation (depends RFC-B; generated
   representative non-CRUD command writing business state + audit/outbox + idempotent receipt
   atomically); T3-04 outbound webhook delivery recipe + worker template (adjudicated NOT a
   framework defect: docs recipe + generation, p2). Also fix in scope somewhere: the generated
   service 'test' task pointing at a nonexistent tests tree (services-sdk.md).`,
  },
  {
    label: 'pack:runtime-truth',
    prompt: `PACK T4 — Runtime truth. Read also: research/repo-audit/runtime-plugins.md (all),
research/repo-audit/observability-aspire.md (GAP-1..8), research/preplan-package.md (D/E/F).
WRITE into ${PLAN}/milestones/0.0.8-runtime-truth-service-slice/:
T4-01 (p0) saga publication receipts + endpoint discovery: publish returns a non-ignorable
discriminated result or fails per policy; kill the 127.0.0.1:8092 fallback under an AppHost
(saga-publisher.ts:294-307); fix the shipped sample job + its verbatim docs copy
(official-sample-configuration.ts:392-406, durable-workflows/sagas.md:418); correlation proof
from persisted state + OTEL; restart/duplicate/out-of-order/unavailable cases; OOM stays an
investigation row (state that). T4-02 (p1) plugin child liveness/health contract: every
declareHealthChecks today returns only the API resource; define child/process state, registry+
dependency readiness, last fatal error; crash-loop and wrapper-alive/child-dead explicit in
CLI/MCP/dashboard; distinct from blocked #1280 (Boundaries!). T4-03 (p1) streams durable-storage
semantics: STREAMS_DATA_DIR referenced by nothing — generated AppHost picks explicit persistent
volume OR names service ephemeral and refuses durable claims; restart proof; retention/
corruption/backup expectations; coordinate #1326/#1329 (Boundaries). T4-04 (p1) saga
compensation telemetry call-sites: 5 of 6 span factories have zero callers; SagaCompensator
takes no instrumentation; add netscript.correlation.id to saga spans; E2E asserts saga.* spans
(today deletable with green CI). T4-05 (p2) env-var name mismatches (WORKER_CONCURRENCY vs
WORKERS_CONCURRENCY documented-as-caveat; deploy.md:202) + always-throwing plugin-streams root
exports. T4-06 (p2) pre-randomization hardcoded ports in sagas/triggers/streams stubs + browser
consumer.stub.ts localhost:4437 (feeds #979 — Boundaries: #979 owns the E2E/docs port-resolution
prerequisites). T4-07 (verify-first, p1) BackgroundProcessors.*.ServiceReferences parsed but
never injected (wave-6 R2 claim; no board owner; draft demands current-canary repro as first
acceptance box). T4-08 (p1) E2E gates probe background children + streams health (scaffold-e2e-
test.ts:1240-1267 probes API only — the root enabler of #1325 shipping green); also cover
'compensating'-terminal-vs-COMPENSATED status mismatch (saga-engine.ts:489-496).`,
  },
  {
    label: 'pack:auth',
    prompt: `PACK Auth — product-grade auth on the generated path. Read also:
research/repo-audit/auth.md (G1-G16), research/repo-audit/services-sdk.md.
Boundaries law: #871 epic + 16 children own ENTERPRISE auth (org contracts #884, test kit #885,
vendor adapters); #942 owns auth frontend; T1-05 owns the SDK-side auth contribution. Your drafts
own the DEFECTS and the generated-path defaults only. WRITE into
${PLAN}/milestones/0.0.8-runtime-truth-service-slice/:
TA-01 (p0) scaffold protects /api by default: template omits auth and a framework test codifies
public routes ('defineService without auth leaves api routes public'); flip the default with an
explicit opt-out, coordinated with T1-05 client-side; TA-02 (p0) plugin services are unguardable:
createPluginService has no auth option, no first-party plugin calls withAuthn — add the seam +
deny-by-default posture aligned with #934's gateway (Boundaries); TA-03 (p1) session lifecycle
defects: unauthenticated POST signout accepts arbitrary sessionId (v1-handlers.ts:187-231); oRPC
signin/callback discard Set-Cookie (v1-helpers.ts:82-84, no outputStructure:'detailed'); __Host-
cookie + origin:'*' CORS blocks browser cookie auth — one issue or a small cluster, your call,
but each defect gets its own acceptance boxes + negative tests; TA-04 (p1) typed principal:
ctx.principal untyped, @netscript/plugin has no principal concept, zero $meta policy metadata —
define the typed principal/policy-metadata contract consumed by T1-05 and #934 (Boundaries vs
#884 which owns ORG-aware contracts — cite it); TA-05 (p2) auth docs debt: arch-debt anchors
cited by add-authentication.md do not exist; E2E's only auth gate is an unauthenticated 200 —
add authenticated + rejection proofs (may fold into TA-01 acceptance; your call, justify).
Also record (return note, not drafts): AUTH_API_SERVICE_NAME 'auth-api' vs 'auth' needs runtime
verification (G16); #1243 owns the hardcoded 4437 default.`,
  },
  {
    label: 'pack:docs-mcp',
    prompt: `PACK T5 — Docs & agent discovery. Read also: research/repo-audit/docs-quickstart.md
(full rewrite table), research/repo-audit/mcp-cli.md (#2-4, #12), research/wave-5-6-plans.md #17.
Boundaries law: #1208 owns tutorials-teach-page-builder phase 1 (0.0.5) and its phase 2 is
PROMISED but NOT YET AN ISSUE (do not draft it — note for amendments); #1210 owns per-API deep
dives + competitive benchmark (0.0.6); #1260 owns SDK prose in MCP corpus; #1201 owns export-
surface corpus; #1102 owns intent-aware retrieval; #1332 owns DB-schema-first docs. WRITE into
${PLAN}/milestones/0.0.6-verification-docs-rfcs/:
T5-01 (p0) one canonical client dialect: fix the four P0 docs breaks (client.ts vs lib/
api-clients.ts vs lib/example-service.ts; createQueryFactories vs createServiceQueryUtils fork
never named; --with-client invisible; quickstart names a CSS-import template as the typed
client) — docs AND the template naming must converge on ONE name + ONE query API story (pick and
justify; coordinate with #1333/#1335, cite as Boundaries); T5-02 (p1) compile-the-docs gate:
docs:accuracy is a fixed-string needle checker; add a type-checked docs-snippet gate (compile
extracted blocks against published entrypoints; the #1278 guard covers casts — Boundaries) +
pages.yml rebuild on packages/**; T5-03 (p1) MCP corpus wiring: emitted .mcp.json carries no
--docs-root so agent init's offline corpus is invisible; default corpus is 1-2 docs; wire
--docs-root + include bounded release-matched corpus (Boundaries: #1260 owns SDK prose choice,
#1201 export surface — this issue is the PLUMBING); T5-04 (p1) execute_command version pin:
spawns jsr:@netscript/cli@MCP_PACKAGE_VERSION even when hosted by a local CLI (spawn-command-
executor.ts:8-14) + list_commands 'version: current' + receipt-wrapping gap vs record_drift
gate (#1197 Boundaries); T5-05 (p2) reference completeness: 4 plugin-*-core packages have no
reference page; publish-gate path convention vs IA disagreement; stale package READMEs incl. the
JSR landing README teaching the wrong dialect; README.md hardcoded file counts; undocumented
verbs (agent drift, plugin ai, deploy desktop/package-cli/list, config list); fabricated aliases.`,
  },
  {
    label: 'pack:soundness-hygiene',
    prompt: `PACK T6 — Type soundness + board hygiene + EXISTING-ISSUE-AMENDMENTS. Read also:
research/repo-audit/web-layer.md, research/repo-audit/scaffold-doctrine.md (D5-D12),
research/github-board-open.md §4-§6 (read fully), research/github-board-history.md,
research/preplan-package.md.
WRITE:
1. Into ${PLAN}/milestones/0.0.6-verification-docs-rfcs/: T6-01 (p1) quality:scan extension —
   fail on new any in EXPORTED types + unregistered as-unknown-as, cover docs snippets, keep
   @ts-expect-error soundness tests exempt (this implements #1278 inventory C as its own
   trackable child — 'Part of #1278'); T6-02 (p1) fresh-ui joins root check+lint (excluded at
   deno.json:34,143, in no workflow) + its deno.lock self-mutation; T6-03 (p2) doctrine verdict
   refresh (10-codebase-verdict names deleted packages, omits 14 live units; engineering-
   reference §1-5/8-10 unwritten; arch:check:repo accepted-red since 2026-06-21 gets a closure
   plan; RFC practice divergence recorded).
2. ${PLAN}/EXISTING-ISSUE-AMENDMENTS.md — the charter deliverable: concrete comment/body
   amendment text (quotable verbatim by the owner) for: #1278 (fold #1276's measured numbers +
   tranches; close #1276 as superseded — include the full proposed comment for both); #1279/
   #1275 (same pattern); #1245 (rescope to remnant: @throws mismatch + regression tests +
   consumer migration note; cite merged #1265/77c034c33); #1333 (acceptance detail expansion
   from the pre-plan §1 list: contract-first route, cache-first SDK, withResource, typed params,
   route-local groups incl. (_shared)/(_lib), no-any consumer gate, four-seam distinction,
   states, /design links — as an additive comment, not a rewrite); #1335 (refresh sub-issue list:
   #1328 closed; add proposed children T3-02 + conformance rows); #1210 (add the cross-
   capability golden-recipe list from preplan §recipes); #1208 (record that phase 2 must be
   filed when phase 1 lands — do not let it vanish); #922 (body wave labels beta.13/15/17 vs
   actual milestones — additive clarification comment; #427/#432 re-baseline reminder); #301,
   #1126 (stale checkbox notes); #1325/#1326/#1329 (attach the wave-6 R2/R3 + audit evidence
   pointers, no scope change); #979 (attach runtime-plugins stub-port findings as additional
   evidence, T4-06 link); #1090/#1197 (attach wave-6 measured tool-call evidence); board-hygiene
   batch (exact list: #175 zero labels; #950/#1000 missing priority/status; #979/#980/#1000 no
   milestone; legacy rfc/documentation labels; labels.yml parity incl. missing live
   status:close-gate-override + docs-eval:skip; orphaned epic labels; #451/#453-455 double
   membership). Each amendment: target issue, amendment type (comment vs body edit), full
   proposed text, rationale, and what it prevents.`,
  },
]

const results = await parallel(jobs.map(j => () =>
  agent(`${COMMON}\n\nTASK:\n${j.prompt}`, { label: j.label, phase: 'Packs', model: 'opus' })))

return { packs: results.filter(Boolean) }
