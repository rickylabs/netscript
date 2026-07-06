export const meta = {
  name: 'eischat-seam-usage-analysis',
  description: 'Analyze rickylabs/eis-chat production usage of NetScript seams; find further leverage + docs/tutorial input (owner addendum 1)',
  phases: [
    { title: 'Audit', detail: 'one Sonnet-5-high agent per seam domain', model: 'sonnet' },
    { title: 'Synthesize', detail: 'seam-usage report + leverage map + docs input pack', model: 'sonnet' },
  ],
}

// Owner law (ROUTING-ADJUSTMENTS.md): never route stages to Fable 5. All agents: sonnet, high.
// eis-chat clone (read-only for agents): C:/Dev/repos/eis-chat @ a08ebe5
// framework repo (read-only reference): C:/Dev/repos/netscript-framework @ origin/main 1c175990
const EIS = 'C:/Dev/repos/eis-chat'
const FW = 'C:/Dev/repos/netscript-framework'

const DOMAINS = [
  { key: 'contracts-services', paths: 'contracts/**, services/** (incl. services/_shared/plugin-service-context.ts)', focus: 'contract-first usage: versioned contracts (v1), how services extend the base plugin-service seam, router wiring, type-soundness in practice (any casts? workarounds?), error/Result handling' },
  { key: 'plugins-composition', paths: 'plugins/** (channel-sync), netscript.config.ts, .netscript/', focus: 'plugin composition + registry generation: how a userland plugin is authored/registered, what glue was hand-written that the framework could generate, config surface friction' },
  { key: 'workers-jobs', paths: 'workers/** (runtime, job-definitions, jobs/*, tasks/*)', focus: 'background-processing seam: job definitions, scheduling, retries, how transcribe-image/embed-document use framework primitives vs hand-rolled glue' },
  { key: 'streams-realtime', paths: 'streams/**, any SSE/WebSocket usage in services + apps', focus: 'streams seam: notifications-stream authoring, subscription plumbing to the frontend, backpressure/reconnect handling — framework-provided vs hand-rolled' },
  { key: 'ai-seams', paths: 'services/eischat/src/** (embeddings, vision, skills, builtin-skills, channel-client), apps/** chat UI wiring', focus: 'CRITICAL: usage of @netscript AI seams — createNetScriptChatConnection (FA1 #250), createChatStreamProxyHandler (FA2 #251), and ALL remaining `Accept-Encoding: identity` workaround sites (grep for them — count + file:line; their removability is the #219 closing criterion). Also embeddings/vision/skills patterns worth first-classing' },
  { key: 'frontend-freshui', paths: 'apps/** (dashboard routes, islands, design system usage)', focus: 'fresh-ui leverage: which @netscript/fresh-ui components are used (DataGrid? forms? prompt-input? dropzone?), what was custom-built that fresh-ui should provide, design-system integration (.design-sync/), routes/(design) usage' },
  { key: 'db-aspire-deploy', paths: 'database/**, aspire/**, appsettings.json, scripts/, tools/', focus: 'DB layer usage (prisma sqlite + zod gen — friction vs the framework db seam), Aspire apphost usage, deployment/ops glue (desktop CEF shell counts), scaffold drift: what did they change from scaffold output and why' },
  { key: 'docs-and-story', paths: 'docs/** (ARCHITECTURE.md, PHASE-1..7, BUILD-PLAN, SKILL.md, design/**), README.md', focus: 'the production developer story: what THEY documented (their mental model, phase sequencing, decisions) = raw material for the docs-frontend/tutorial revamp; mismatches between their understanding and framework doctrine' },
]

const AUDIT_SCHEMA = {
  type: 'object',
  required: ['domain', 'seams_used', 'friction', 'push_further', 'docs_input', 'issue_candidates'],
  properties: {
    domain: { type: 'string' },
    seams_used: { type: 'array', items: { type: 'string' }, description: 'each: seam/API + file:line evidence + one-line how-used' },
    friction: { type: 'array', items: { type: 'string' }, description: 'workarounds, hand-rolled glue, casts, copy-paste from framework internals — each with file:line' },
    push_further: { type: 'array', items: { type: 'string' }, description: 'concrete opportunities where eis-chat could leverage existing NetScript seams MORE (or where a small framework addition would delete eis-chat code) — each with evidence + which framework package' },
    docs_input: { type: 'array', items: { type: 'string' }, description: 'patterns worth showcasing in docs/tutorials (production-grade usage examples), each with file path' },
    issue_candidates: { type: 'array', items: { type: 'string' }, description: 'framework defects/gaps found — title + evidence, for supervisor to file' },
  },
}

phase('Audit')
const audits = await parallel(DOMAINS.map((d) => () =>
  agent(
    `use harness
## SKILL
netscript-harness, netscript-doctrine, deno-fresh — repo skills under ${FW}/.agents/skills/.

You are a READ-ONLY production-usage auditor for the domain "${d.key}" of the eis-chat app —
a real production NetScript consumer. NEVER edit any file in either repo.

App repo: ${EIS} (@ a08ebe5). Focus paths: ${d.paths}
Framework repo (reference for what seams EXIST): ${FW} (@ 1c175990). Use
\`deno doc <module>\` / targeted greps against packages/ + plugins/ there to check what the
framework offers before calling something "hand-rolled by necessity".

Focus: ${d.focus}

Method: read the focus paths in the app; for every NetScript touchpoint identify the seam used,
then cross-check the framework surface for a richer/underused capability. Distinguish
(a) seam used well, (b) seam used sub-optimally (could push further), (c) missing seam the app
had to hand-roll, (d) framework defect. Cite file:line for everything.

Return the structured verdict only.`,
    { label: `audit:${d.key}`, phase: 'Audit', schema: AUDIT_SCHEMA, model: 'sonnet', effort: 'high' },
  )
))

const found = audits.filter(Boolean)
log(`${found.length}/${DOMAINS.length} domain audits returned`)

phase('Synthesize')
const report = await agent(
  `use harness
You are synthesizing the eis-chat production seam-usage analysis for the beta.5 supervisor of
rickylabs/netscript (owner directive: docs-frontend/tutorial authoring must be preceded by this;
"good leverage — could be pushed even further — your job to find out").

Input: per-domain audit JSON below. Produce ONE markdown document with:
1. **Seam-usage map** — table: framework seam | how eis-chat uses it | quality (well/sub-optimal/hand-rolled) | evidence.
2. **Push-further opportunities** — ranked list: what eis-chat (or the framework) should change so
   the app leverages NetScript seams harder; mark each as app-side, framework-side, or docs-side.
3. **#219 closing-criterion status** — the Accept-Encoding: identity workaround sites found
   (count, file:line each) and whether FA1/FA2 seams are consumed.
4. **Docs/tutorial input pack** — the concrete production patterns the docs-frontend/tutorial
   revamp should showcase (per pattern: source file, what it demonstrates, suggested doc home).
5. **Issue candidates** — deduped framework defects/gaps with evidence, ready to file.
Return ONLY the markdown document.

AUDITS:
${JSON.stringify(found, null, 2)}`,
  { label: 'synthesize:report', phase: 'Synthesize', model: 'sonnet', effort: 'high' },
)

return { report, audits: found }
