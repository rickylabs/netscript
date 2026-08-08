export const meta = {
  name: 'b2-repo-and-external',
  description: 'Stage B corpus: deep repo/docs audit by domain + external comparisons (read-only)',
  phases: [
    { title: 'Repo', detail: 'domain-sliced audit of the NetScript worktree + published docs' },
    { title: 'External', detail: 'eis-chat, competing meta-frameworks, oRPC' },
  ],
}

const RUN = '/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed'
const WT = '/home/codex/repos/netscript-fable5-remediation-plan'

const COMMON = `You are an Opus research contributor in a planning-only NetScript seed run
(run dir ${RUN}). Worktree: ${WT} (branch plan/fable5-remediation-roadmap, baseline == origin/main
fac9e339042c, 2026-08-08). HARD RULES:
- READ-ONLY everywhere except your single assigned output file (create parent dirs). Never edit
  repo source; never mutate GitHub.
- Every load-bearing claim carries a citation: file path (+line), \`deno doc\` output, issue/PR
  number, or URL. Uncited claims are worthless.
- Audit CURRENT state; where docs claim something, verify against code. Prefer \`deno doc
  <module>\` / \`deno doc --filter <symbol>\` over broad file reads for public surfaces; prefix
  read-heavy git/grep/ls with "rtk".
- For each domain report BOTH: (a) what exists and works, (b) gaps classified as one of:
  docs/discovery failure | scaffold/generation failure | API/type-system seam | runtime
  correctness | plugin-composition failure | product-expectation outside framework scope.
- Write full findings as structured Markdown to your output file; RETURN ONLY the file path + a
  <=20-line abstract. Dense, concrete, no filler.`

phase('Repo')

const repoJobs = [
  {
    label: 'repo:docs-quickstart',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/docs-quickstart.md`,
    prompt: `Audit the published documentation surface: locate the docs site source in the
worktree (look for www/, docs/, or a Lume site; check deno.json tasks), enumerate its page tree,
and deep-read Quickstart/getting-started, CLI reference, and conceptual pages. Assess: accuracy vs
the current CLI (packages/cli or tools), completeness of the documented golden path (init ->
scaffold -> plugins -> db -> run), what a first-time agent/human cannot discover, where docs teach
service-direct calls instead of the canonical SDK/query path. Also check README.md files at repo
root and per-package for staleness. List every page that would need rewriting for a
"canonical vertical slice" story.`,
  },
  {
    label: 'repo:mcp-cli',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/mcp-cli.md`,
    prompt: `Audit the MCP server and CLI generation surface. Find the NetScript MCP server
implementation (search for search_docs and MCP tool registrations) and list every MCP tool it
exposes + what docs corpus it searches, incl. release-matching. Then enumerate the FULL CLI
command tree (init, scaffold, service add/generate, ui:add page, plugin install/sync/doctor,
generate plugins/runtime-schemas, db, maintainer) from the CLI source. For each generation verb:
inputs, what files it emits, idempotency/drift behavior. Then name the MISSING generation seams
relative to: contract-derived SDK/query/invalidation module; resource/route-slice generator
(typed route contract + definePage + route-local groups + cache-first loader + withResource +
form/partial/stream + state stubs); service command slice. Cite exact source paths.`,
  },
  {
    label: 'repo:web-layer',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/web-layer.md`,
    prompt: `Audit the web layer: packages/fresh (or equivalent) and @netscript/fresh-ui. Use deno
doc + source. Cover: definePage, withResource, withForm, layers, partials, streams/QueryIsland,
createQueryFactories/query keys/invalidation, dehydration/hydration/cachedAt, typed route params +
search params helpers, route-local group conventions ((_components) etc.) if any exist, the
/design routes and generated design system/registry. Verify open defect claims #1245 (query
surface rejects documented cache/dehydration patterns) and #1249 (withForm control props/Zod)
against current code. Assess type-soundness of the public surface (any/casts, #1276/#1278 scope).
State precisely which pieces of the canonical route/resource slice EXIST vs are MISSING.`,
  },
  {
    label: 'repo:services-sdk',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/services-sdk.md`,
    prompt: `Audit the service/SDK layer: service definition + contracts (Zod), oRPC usage and
version, createServiceClient and the entire typed client construction path, request context,
transport middleware/interceptors, error typing, query factory bridge, and how a consumer app
wires service/router constants today. Answer precisely: (1) can a plugin or app extend client
construction/request context/headers/auth today, and how ugly is the escape hatch; (2) what typed
extension seams oRPC itself offers that NetScript does not re-expose; (3) where hand-authored
boilerplate (client+query+invalidation wiring) lives in generated/scaffolded apps; (4) service
internal folder conventions in scaffolded services vs none. Cite paths + deno doc surfaces.`,
  },
  {
    label: 'repo:auth',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/auth.md`,
    prompt: `Audit identity/auth: the auth plugin (plugins/auth or similar), session/credential
model, how scaffolded apps protect (or fail to protect) /api/rpc/*, server-side credential
forwarding, procedure-level policy metadata, tenancy seams (#884/#885 context), and how auth is
supposed to compose with the typed SDK client today. Reproduce in code-reading terms the Wave-6
finding: "createServiceClient cannot compose the shipped auth plugin; agents used raw fetch or
left RPC unauthenticated" — is that accurate against current main? What exact APIs exist/miss?`,
  },
  {
    label: 'repo:runtime-plugins',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/runtime-plugins.md`,
    prompt: `Audit the durable runtime plugins: workers, sagas, triggers, streams. Cover: runtime
architecture (wrapper/child processes), endpoint resolution between plugins under Aspire (any
fixed-port fallback like 127.0.0.1:8092 — search for hardcoded ports), publish/receipt typing
(can a publish failure be silently ignored?), saga correlation/compensation path, stream
persistence (STREAMS_DATA_DIR semantics, in-memory default), reconnect/retry semantics, health/
readiness reporting vs actual child liveness, and what #1325/#1326/#1327/#1329/#1332/#1184 landed
recently (check git log / issue references in commits). Classify surviving seams vs fixed ones.`,
  },
  {
    label: 'repo:observability-aspire',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/observability-aspire.md`,
    prompt: `Audit observability + Aspire integration: the TypeScript AppHost surface (how
scaffolded apps compose Aspire resources), OTEL wiring across web/services/plugins (trace
propagation, correlation ids through commands/sagas/streams), health-check surface (#1280 upstream
blockage), the Aspire dashboard/MCP surface, and what causal runtime proof an agent can actually
extract today (can you follow one request -> command -> saga -> compensation in traces?). Verify
docs claims about observability against real wiring. Cite paths.`,
  },
  {
    label: 'repo:scaffold-doctrine',
    out: `${RUN}/fable-5-remediation-plan/research/repo-audit/scaffold-doctrine.md`,
    prompt: `Audit (1) the scaffold/generated surface: what "netscript init" + plugin add produce
today (templates location, generated workspace layout, quality gates after PR #1342, generated
app folder conventions, /design routes, dynamic app naming state per #1333), and (2) the
governance layer: docs/architecture/doctrine/ (verdict file 10-codebase-verdict-and-handoff.md),
.llm/harness/debt/arch-debt.md open entries, rfcs/ state, and .agents/skills coverage. Report:
where scaffold output diverges from the doctrine target, which doctrine decisions are unsettled
(RFC-needing), and open debt relevant to a long-range remediation roadmap. Cite paths/sections.`,
  },
]

const repoResults = await parallel(repoJobs.map(j => () =>
  agent(`${COMMON}\n\nOUTPUT FILE: ${j.out}\n\nTASK:\n${j.prompt}`, {
    label: j.label, phase: 'Repo', model: 'opus',
  })))

phase('External')

const extJobs = [
  {
    label: 'ext:eis-chat',
    out: `${RUN}/fable-5-remediation-plan/research/external/eis-chat.md`,
    prompt: `Tear down rickylabs/eis-chat as the canonical product-quality frontend bar. Access:
try cloning read-only into /home/codex/repos/netscript-fable5-remediation-plan/.llm/tmp/eis-chat
(git clone https://github.com/rickylabs/eis-chat --depth 1); if clone fails use GitHub MCP
get_file_contents. Report: stack, route organization (route-local components/islands/shared/lib?),
data-fetch + cache strategy, form handling, auth composition, UI state coverage
(loading/error/empty/optimistic), design-system usage, type discipline (any/casts), folder
vocabulary. Extract the CONCRETE conventions NetScript's scaffold should generate to reach this
bar. Cite file paths.`,
  },
  {
    label: 'ext:meta-frameworks',
    out: `${RUN}/fable-5-remediation-plan/research/external/meta-frameworks.md`,
    prompt: `Competitive teardown: what makes a credible, differentiated production meta-framework
in 2026. Use web research (firecrawl_search / WebFetch via ToolSearch; cite URLs). Cover: Next.js
15/16, Nuxt 4, SvelteKit 2, TanStack Start, RedwoodSDK, AdonisJS 6, Encore.ts, Laravel (as the
full-stack bar), and Deno Fresh 2 itself. For each: scaffold/CLI generation depth, typed
end-to-end data story (server functions/RPC), auth story, background jobs/durable workflows story,
observability story, docs/AI-agent readiness (llms.txt, MCP), and the ONE thing users praise it
for. End with: the capability bar NetScript must clear per category, and where NetScript can be
genuinely differentiated (Deno+Aspire+plugins+generation+agent-native) vs table stakes it
currently misses.`,
  },
  {
    label: 'ext:orpc',
    out: `${RUN}/fable-5-remediation-plan/research/external/orpc.md`,
    prompt: `Deep-dive oRPC's extension model from primary docs (orpc.unnoq.com; cite exact URLs)
AND the version NetScript pins (check deno.json/imports in the worktree; read
.resources/deps-docs/ if an oRPC extract exists). Cover: middleware + context typing (initial/
execution context), interceptors (client+server), contract-first router extension, client links
(fetch link, plugins array), procedure metadata, error typing (type-safe errors), and the plugin
mechanisms of comparable stacks (tRPC links/middlewares as contrast). Then map each mechanism to
NetScript's needed plugin->SDK/client contribution seam (credential injection, headers, query
factories, invalidation, policy metadata): what oRPC gives for free, what NetScript must add,
what its pinned version cannot do (with upgrade implications).`,
  },
]

const extResults = await parallel(extJobs.map(j => () =>
  agent(`${COMMON}\n\nOUTPUT FILE: ${j.out}\n\nTASK:\n${j.prompt}`, {
    label: j.label, phase: 'External', model: 'opus',
  })))

return {
  repo: repoResults.filter(Boolean),
  external: extResults.filter(Boolean),
}
