export const meta = {
  name: 'build-doc-site',
  description: 'Author the full NetScript documentation site, one grounded agent per page, build-verified',
  whenToUse: 'Pipeline step 4 (Claude authoring lane). Launch ONLY after PLAN-EVAL (minimax-m3) PASSES. Pass the approved page inventory as `args`.',
  phases: [
    { title: 'Author', detail: 'one authoring agent per page, grounded in ground-truth + anatomy + approved plan' },
    { title: 'Verify', detail: 'per-page accuracy + Vento-safety self-check as each page completes' },
    { title: 'Completeness', detail: 'critic pass: what zone/page/claim is missing or unverified' },
  ],
};

// ============================================================================
// build-doc-site.workflow.js — NetScript SOTA documentation authoring workflow
// ----------------------------------------------------------------------------
// LANE: Claude authoring workflow = PR #59 pipeline step 4. HARD-GATED: do not
// launch until PLAN-EVAL (OpenHands minimax-m3) returns PASS on the v2 plan.
// Touches ONLY docs/site/** (never docs/site/reference/**, packages/, plugins/).
//
// INVENTORY: passed as `args` = the approved plan's page list. Shape:
//   {
//     worktree: "<abs path to the docs worktree>",          // where files are written
//     planPath: ".llm/tmp/run/.../doc-architecture-v2.md",  // approved IA + per-page briefs
//     groundTruth: [".llm/tmp/run/.../ground-truth.md",
//                   ".llm/tmp/run/.../ground-truth-project-anatomy.md"],
//     zones: [
//       { zone: "tutorials", pages: [
//           { url: "/tutorials/build-a-service/", file: "docs/site/tutorials/build-a-service.md",
//             type: "tutorial", title: "Build a service",
//             prev: { label, href }, next: { label, href },
//             brief: "<what this page must teach, grounded sections, real commands/ports/code shapes>",
//             accuracyMarkers: ["localhost:3001", "defineService", "/rpc"] },
//           ...
//       ]},
//       ...
//     ]
//   }
// If `args` is undefined the script runs a tiny self-test inventory so a dry run
// doesn't fan out 60 agents by accident.
// ============================================================================

// NOTE: `args` injection proved unreliable for scriptPath launches in this
// harness — on both a fork-launched and a parent-launched run the `args` global
// arrived WITHOUT a usable `.zones`, so the script fell through to the self-test
// and authored nothing. The approved 27-page inventory (the pages from
// _data.ts navSections that have no source file yet) is therefore embedded here
// and used by default. An explicit `args` with `.zones` still overrides it.
const INVENTORY = {
  worktree: 'C:/Dev/repos/netscript-framework/.claude/worktrees/agent-a6564d6730edc2f15',
  planPath: '.llm/tmp/run/docs-content-architecture--impl/doc-architecture-v2.md',
  groundTruth: [
    '.llm/tmp/run/docs-content-architecture--impl/ground-truth.md',
    '.llm/tmp/run/docs-content-architecture--impl/ground-truth-project-anatomy.md',
  ],
  zones: [
    { zone: 'tutorials', pages: [
      { url: '/tutorials/build-a-service/', file: 'docs/site/tutorials/build-a-service.md', type: 'tutorial', title: 'Build a service', prev: { label: '1 · Your first workspace', href: '/tutorials/first-workspace/' }, next: { label: '3 · Add background jobs', href: '/tutorials/background-jobs/' }, brief: "Tutorial rung 2. Read the §4 brief for /tutorials/build-a-service/ in the plan. Teach a reader to add a typed service to the workspace from tutorial 1: define an @orpc/contract (zod input/output) + implement() it; show BOTH the one-shot defineService(...) form AND the fluent createService(...).serve() builder and say when to use each; run it and call it. Service listens on :3001 with the /rpc endpoint. End with a 'Next' to background-jobs and a 'Look it up' link to /reference/service/ and /reference/contracts/. Numbered, runnable steps with a verify step. Do not duplicate the generated API — link to it.", accuracyMarkers: ['defineService', 'createService', '@orpc/contract', 'implement(', ':3001', '/rpc', '/reference/service/'] },
      { url: '/tutorials/background-jobs/', file: 'docs/site/tutorials/background-jobs.md', type: 'tutorial', title: 'Add background jobs', prev: { label: '2 · Build a service', href: '/tutorials/build-a-service/' }, next: { label: '4 · A durable workflow', href: '/tutorials/durable-workflow/' }, brief: "Tutorial rung 3. Read the §4 brief for /tutorials/background-jobs/. Add the workers plugin and a job handler: defineJobHandler(...) + createJobTools(...); enqueue a job from the service; observe it run. Workers run on :8091; plugin lives at plugins/workers/. HONESTLY disclose that worker trace/progress reporting are currently no-op stubs. Verify step shows the job executing. Link to /reference/workers/. Next → durable-workflow.", accuracyMarkers: ['defineJobHandler', 'createJobTools', ':8091', 'plugins/workers/', '/reference/workers/'] },
      { url: '/tutorials/durable-workflow/', file: 'docs/site/tutorials/durable-workflow.md', type: 'tutorial', title: 'A durable workflow', prev: { label: '3 · Add background jobs', href: '/tutorials/background-jobs/' }, next: { label: '5 · Ingest a webhook', href: '/tutorials/ingest-webhook/' }, brief: "Tutorial rung 4. Read the §4 brief for /tutorials/durable-workflow/. Add the sagas plugin and build a durable saga with the fluent builder defineSaga(...).durability().state().on().build(). Wire the CONTINUOUS-APP fil d'Ariane end-to-end: the worker create-user-settings publishes UserSettingsCreated → the saga handles it and emits sagaComplete. Sagas run on :8092; plugin at plugins/sagas/. Link to /reference/sagas/ and /explanation/durable-workflows/. Next → ingest-webhook.", accuracyMarkers: ['defineSaga', '.durability()', '.state()', '.build()', ':8092', 'UserSettingsCreated', 'sagaComplete', '/reference/sagas/'] },
      { url: '/tutorials/ingest-webhook/', file: 'docs/site/tutorials/ingest-webhook.md', type: 'tutorial', title: 'Ingest a webhook', prev: { label: '4 · A durable workflow', href: '/tutorials/durable-workflow/' }, next: null, brief: "Tutorial rung 5 (final). Read the §4 brief for /tutorials/ingest-webhook/. Add the triggers plugin and define a webhook with defineWebhook(...). CRITICAL ground truth: triggers expose RAW Hono routes, NOT oRPC. Triggers run on :8093; plugin at plugins/triggers/. Close the continuous-app loop: the webhook handler calls enqueueJob(...) to enqueue a worker job. Link to /reference/triggers/. This is the last rung — point onward to How-to guides and Capabilities, no 'next' ladder link.", accuracyMarkers: ['defineWebhook', 'Hono', ':8093', 'plugins/triggers/', 'enqueueJob', '/reference/triggers/'] },
    ] },
    { zone: 'how-to', pages: [
      { url: '/how-to/add-a-service/', file: 'docs/site/how-to/add-a-service.md', type: 'how-to', title: 'Add a service', prev: { label: 'Add a plugin', href: '/how-to/add-a-plugin/' }, next: { label: 'Database & migration', href: '/how-to/database-migration/' }, brief: 'Task recipe. Follow the kept /how-to/add-a-plugin/ template: Goal → Prerequisites → numbered steps → Verify → Reference links. Goal: add a new typed service to an existing workspace. Use defineService / createService with an @orpc/contract; service on :3001 /rpc. Link to /tutorials/build-a-service/ for the learning version and /reference/service/ for the API.', accuracyMarkers: ['defineService', '@orpc/contract', ':3001', '/reference/service/'] },
      { url: '/how-to/database-migration/', file: 'docs/site/how-to/database-migration.md', type: 'how-to', title: 'Database & migration', prev: { label: 'Add a service', href: '/how-to/add-a-service/' }, next: { label: 'Queue / KV / cron', href: '/how-to/queue-kv-cron/' }, brief: 'Task recipe (Goal→prereqs→steps→verify→reference). CRITICAL ground truth: Aspire is step 2 — `cd aspire && aspire run` brings up Postgres/Garnet BEFORE any `netscript db` command; state that dependency explicitly. Steps: aspire run, then netscript db init / generate / seed / migrate (use the public `netscript` command form, never the vendored path). Prisma-backed. Link to /reference/database/ and /capabilities/database/.', accuracyMarkers: ['aspire run', 'netscript db', 'Prisma', '/reference/database/'] },
      { url: '/how-to/queue-kv-cron/', file: 'docs/site/how-to/queue-kv-cron.md', type: 'how-to', title: 'Queue / KV / cron', prev: { label: 'Database & migration', href: '/how-to/database-migration/' }, next: { label: 'Add OpenTelemetry', href: '/how-to/add-opentelemetry/' }, brief: 'Task recipe. Show enqueueing/consuming a queue message, reading/writing KV, and scheduling a cron job. Disclose the adapter choices: KV adapters DenoKV/Redis/memory; queue adapters KV/Redis/AMQP. Link to /reference/kv/, /reference/queue/, /reference/cron/ and /capabilities/kv-queues-cron/.', accuracyMarkers: ['queue', 'KV', 'cron', 'DenoKV', 'Redis', 'AMQP', '/reference/queue/'] },
      { url: '/how-to/add-opentelemetry/', file: 'docs/site/how-to/add-opentelemetry.md', type: 'how-to', title: 'Add OpenTelemetry', prev: { label: 'Queue / KV / cron', href: '/how-to/queue-kv-cron/' }, next: { label: 'Customize Fresh UI', href: '/how-to/customize-fresh-ui/' }, brief: 'Task recipe. OpenTelemetry is built into handlers — show how to enable/extend tracing and view traces in the Aspire dashboard at :18888. Honestly note worker trace/progress are no-op stubs today. Link to /reference/telemetry/, /reference/logger/, /capabilities/telemetry/, /explanation/observability/.', accuracyMarkers: ['OpenTelemetry', ':18888', '/reference/telemetry/'] },
      { url: '/how-to/customize-fresh-ui/', file: 'docs/site/how-to/customize-fresh-ui.md', type: 'how-to', title: 'Customize Fresh UI', prev: { label: 'Add OpenTelemetry', href: '/how-to/add-opentelemetry/' }, next: { label: 'Deploy', href: '/how-to/deploy/' }, brief: "Task recipe. Customize the scaffolded Fresh UI app — where the app lives, how to edit routes/islands/styling. Link to /reference/fresh-ui/, /reference/fresh/, /capabilities/fresh-ui/. Keep claims grounded in the scaffold's actual Fresh app structure (see anatomy file).", accuracyMarkers: ['Fresh', '/reference/fresh-ui/'] },
      { url: '/how-to/deploy/', file: 'docs/site/how-to/deploy.md', type: 'how-to', title: 'Deploy', prev: { label: 'Customize Fresh UI', href: '/how-to/customize-fresh-ui/' }, next: { label: 'Author a plugin', href: '/how-to/author-a-plugin/' }, brief: 'Task recipe. Deployment guidance grounded in what the scaffold actually supports — be honest about what is wired vs. aspirational. Cover building, env/config, and the Aspire AppHost role. Do NOT invent a deploy target that does not exist; if deployment is partly manual, say so. Link to /explanation/aspire/.', accuracyMarkers: ['aspire', 'AppHost'] },
      { url: '/how-to/author-a-plugin/', file: 'docs/site/how-to/author-a-plugin.md', type: 'how-to', title: 'Author a plugin', prev: { label: 'Deploy', href: '/how-to/deploy/' }, next: null, brief: 'Task recipe — the advanced companion to /how-to/add-a-plugin/ (which installs one). Show authoring a NEW plugin: canonical location plugins/<name>/, the contribution/manifest/registry shape, how it plugs into the kernel. Ground in the anatomy file plugin structure. Link to /explanation/plugin-model/ and /reference/plugin/.', accuracyMarkers: ['plugins/', 'manifest', 'registry', '/reference/plugin/'] },
    ] },
    { zone: 'explanation', pages: [
      { url: '/explanation/contracts/', file: 'docs/site/explanation/contracts.md', type: 'explanation', title: 'Contracts & type flow', prev: { label: 'Architecture', href: '/explanation/architecture/' }, next: { label: 'The plugin model', href: '/explanation/plugin-model/' }, brief: 'Conceptual explanation (understanding-oriented, not steps). Explain NetScript contracts-first model and end-to-end type flow: @orpc/contract + zod define the contract; implement() binds the handler; types flow from contract → service → client with no manual duplication. Explain WHY (the design rationale), with a diagram-in-prose of the type pipeline. Link to /capabilities/services/ and /reference/contracts/. Cross-link the glossary terms contract/oRPC.', accuracyMarkers: ['@orpc/contract', 'zod', 'implement(', 'contract'] },
      { url: '/explanation/durable-workflows/', file: 'docs/site/explanation/durable-workflows.md', type: 'explanation', title: 'Durable workflows', prev: { label: 'The plugin model', href: '/explanation/plugin-model/' }, next: { label: 'Observability', href: '/explanation/observability/' }, brief: 'Conceptual explanation. Explain durability: how sagas persist state across steps, the builder model (defineSaga(...).durability().state().on().build()), and how workers/sagas/triggers compose into a durable workflow. Use the continuous-app narrative (worker publishes UserSettingsCreated → saga handles + emits sagaComplete → trigger enqueues a worker job) as the worked conceptual example. Link to /capabilities/durable-sagas/, /tutorials/durable-workflow/, /reference/sagas/.', accuracyMarkers: ['defineSaga', 'durability', 'UserSettingsCreated', 'sagaComplete'] },
      { url: '/explanation/observability/', file: 'docs/site/explanation/observability.md', type: 'explanation', title: 'Observability', prev: { label: 'Durable workflows', href: '/explanation/durable-workflows/' }, next: { label: 'Orchestration with Aspire', href: '/explanation/aspire/' }, brief: 'Conceptual explanation. Explain NetScript observability model: OpenTelemetry instrumentation built into handlers, traces/logs/metrics, and the Aspire dashboard (:18888) as the viewing surface. Explain the design intent. Honestly disclose worker trace/progress are no-op stubs today. Link to /capabilities/telemetry/, /how-to/add-opentelemetry/, /reference/telemetry/.', accuracyMarkers: ['OpenTelemetry', ':18888', 'telemetry'] },
      { url: '/explanation/aspire/', file: 'docs/site/explanation/aspire.md', type: 'explanation', title: 'Orchestration with Aspire', prev: { label: 'Observability', href: '/explanation/observability/' }, next: null, brief: 'Conceptual explanation — a DEDICATED Aspire chapter (locked plan decision Q7). Explain Aspire role as the orchestrator: `cd aspire && aspire run` is step 2 of the workflow and brings up Postgres/Garnet BEFORE any db command; the Aspire AppHost; the dashboard at :18888. Make the `--no-aspire` escape hatch EXPLICIT (when and why you would opt out, and what you lose) — but VERIFY --no-aspire against packages/cli ground truth before asserting it; record drift if it differs. Link to /how-to/database-migration/, /how-to/deploy/, /reference/aspire/.', accuracyMarkers: ['aspire run', 'AppHost', ':18888', '--no-aspire'] },
    ] },
    { zone: 'capabilities', pages: [
      { url: '/capabilities/', file: 'docs/site/capabilities/index.md', type: 'capability-hub-index', title: 'Capabilities', prev: null, next: { label: 'Services & contracts', href: '/capabilities/services/' }, brief: "Capabilities ZONE LANDING. Read the §4 brief for /capabilities/ + the §3 page-type catalog. Explain what a 'capability' is (a composable slice of the framework), then a featureGrid or card grid linking ALL 9 hubs (services, background-jobs, durable-sagas, triggers, streams, database, kv-queues-cron, telemetry, fresh-ui) with a one-line each. This is the hub-of-hubs — orient the reader to the four composable plugins (workers/sagas/triggers/streams) plus the platform capabilities. Use tag-form callouts only.", accuracyMarkers: ['services', 'background-jobs', 'durable-sagas', 'triggers', 'streams'] },
      { url: '/capabilities/services/', file: 'docs/site/capabilities/services.md', type: 'capability-hub', title: 'Services & contracts', prev: { label: 'Capabilities', href: '/capabilities/' }, next: { label: 'Background jobs', href: '/capabilities/background-jobs/' }, brief: "Capability hub. Per §3 capability-hub type include: (1) one-sentence 'what it is'; (2) a 'use this when' callout in TAG FORM {{ comp callout {type:'tip', title:'Use this when'} }}…{{ /comp }}; (3) headline API in a tabbedCode with a SIMPLE tab (defineService one-shot) and an ADVANCED tab (createService(...).serve() fluent), code matching the anatomy; (4) a Learn/Do/Look up/Understand router card linking /tutorials/build-a-service/, /how-to/add-a-service/, /reference/service/, /explanation/contracts/. Contracts are @orpc/contract + zod + implement(); service on :3001 /rpc. Never duplicate the generated API.", accuracyMarkers: ['defineService', 'createService', '@orpc/contract', ':3001', '/reference/service/'] },
      { url: '/capabilities/background-jobs/', file: 'docs/site/capabilities/background-jobs.md', type: 'capability-hub', title: 'Background jobs', prev: { label: 'Services & contracts', href: '/capabilities/services/' }, next: { label: 'Durable sagas', href: '/capabilities/durable-sagas/' }, brief: 'Capability hub (§3 structure: what / use-this-when callout (tag form) / headline tabbedCode simple+advanced / Learn-Do-Lookup-Understand router card). The workers plugin: defineJobHandler + createJobTools; runs on :8091; plugins/workers/. HONESTLY disclose worker trace/progress are no-op stubs. Router links: /tutorials/background-jobs/, /how-to/queue-kv-cron/, /reference/workers/, /explanation/durable-workflows/.', accuracyMarkers: ['defineJobHandler', 'createJobTools', ':8091', 'plugins/workers/', '/reference/workers/'] },
      { url: '/capabilities/durable-sagas/', file: 'docs/site/capabilities/durable-sagas.md', type: 'capability-hub', title: 'Durable sagas', prev: { label: 'Background jobs', href: '/capabilities/background-jobs/' }, next: { label: 'Triggers & ingress', href: '/capabilities/triggers/' }, brief: 'Capability hub (§3 structure). The sagas plugin: fluent builder defineSaga(...).durability().state().on().build(); runs on :8092; plugins/sagas/. Show the continuous-app role: handles UserSettingsCreated, emits sagaComplete. tabbedCode simple (minimal saga) + advanced (durability + state + multiple on() handlers). Router links: /tutorials/durable-workflow/, /reference/sagas/, /explanation/durable-workflows/.', accuracyMarkers: ['defineSaga', '.durability()', '.state()', '.build()', ':8092', '/reference/sagas/'] },
      { url: '/capabilities/triggers/', file: 'docs/site/capabilities/triggers.md', type: 'capability-hub', title: 'Triggers & ingress', prev: { label: 'Durable sagas', href: '/capabilities/durable-sagas/' }, next: { label: 'Durable streams', href: '/capabilities/streams/' }, brief: 'Capability hub (§3 structure). The triggers plugin: defineWebhook(...); CRITICAL — triggers expose RAW Hono routes, NOT oRPC; runs on :8093; plugins/triggers/. Show enqueueJob from a webhook handler (closes the continuous-app loop). tabbedCode simple (one webhook) + advanced (validation + enqueue). Router links: /tutorials/ingest-webhook/, /reference/triggers/. Use lifted, runnable snippets.', accuracyMarkers: ['defineWebhook', 'Hono', ':8093', 'plugins/triggers/', 'enqueueJob'] },
      { url: '/capabilities/streams/', file: 'docs/site/capabilities/streams.md', type: 'capability-hub', title: 'Durable streams', prev: { label: 'Triggers & ingress', href: '/capabilities/triggers/' }, next: { label: 'Database & Prisma', href: '/capabilities/database/' }, brief: "Capability hub (§3 structure). The streams plugin: runs on :4437; plugins/streams/. HONESTLY DISCLOSE — producer/consumer are currently no-op STUBS and the topic APIs are deferred; do not present aspirational APIs as working. Frame the page around the intended model + current honest status (a 'status' callout in tag form). Router links: /reference/streams/. Keep code samples to what actually exists; mark stubs clearly.", accuracyMarkers: [':4437', 'plugins/streams/', 'stub'] },
      { url: '/capabilities/database/', file: 'docs/site/capabilities/database.md', type: 'capability-hub', title: 'Database & Prisma', prev: { label: 'Durable streams', href: '/capabilities/streams/' }, next: { label: 'KV, queues & cron', href: '/capabilities/kv-queues-cron/' }, brief: 'Capability hub (§3 structure). Prisma-backed database; Postgres + Garnet brought up by Aspire. CRITICAL: `cd aspire && aspire run` is step 2 BEFORE any `netscript db` command. Show netscript db init/generate/seed/migrate (public command form). tabbedCode for a model + query. Router links: /how-to/database-migration/, /reference/database/. Note prisma-adapter-mysql exists as an adapter.', accuracyMarkers: ['Prisma', 'aspire run', 'netscript db', '/reference/database/'] },
      { url: '/capabilities/kv-queues-cron/', file: 'docs/site/capabilities/kv-queues-cron.md', type: 'capability-hub', title: 'KV, queues & cron', prev: { label: 'Database & Prisma', href: '/capabilities/database/' }, next: { label: 'Telemetry & logging', href: '/capabilities/telemetry/' }, brief: 'Capability hub (§3 structure) — this hub SHOULD include an ADAPTER MATRIX. KV adapters: DenoKV / Redis / memory. Queue adapters: KV / Redis / AMQP. Cron scheduling. Use an apiTable or a matrix to show adapter × capability. tabbedCode for enqueue/consume + KV get/set + cron schedule. Router links: /how-to/queue-kv-cron/, /reference/kv/, /reference/queue/, /reference/cron/.', accuracyMarkers: ['DenoKV', 'Redis', 'AMQP', 'cron', '/reference/queue/'] },
      { url: '/capabilities/telemetry/', file: 'docs/site/capabilities/telemetry.md', type: 'capability-hub', title: 'Telemetry & logging', prev: { label: 'KV, queues & cron', href: '/capabilities/kv-queues-cron/' }, next: { label: 'Fresh UI & design', href: '/capabilities/fresh-ui/' }, brief: 'Capability hub (§3 structure). OpenTelemetry built into handlers; structured logging; Aspire dashboard at :18888 as the viewing surface. HONESTLY disclose worker trace/progress are no-op stubs. tabbedCode for instrumenting/logging. Router links: /how-to/add-opentelemetry/, /explanation/observability/, /reference/telemetry/, /reference/logger/.', accuracyMarkers: ['OpenTelemetry', ':18888', '/reference/telemetry/', '/reference/logger/'] },
      { url: '/capabilities/fresh-ui/', file: 'docs/site/capabilities/fresh-ui.md', type: 'capability-hub', title: 'Fresh UI & design', prev: { label: 'Telemetry & logging', href: '/capabilities/telemetry/' }, next: null, brief: 'Capability hub (§3 structure). The scaffolded Fresh UI app — what it provides, where it lives, how it integrates. Ground in the anatomy file Fresh app structure; do not invent UI features. tabbedCode for a route/island. Router links: /how-to/customize-fresh-ui/, /reference/fresh-ui/, /reference/fresh/.', accuracyMarkers: ['Fresh', '/reference/fresh-ui/', '/reference/fresh/'] },
    ] },
    { zone: 'resources', pages: [
      { url: '/glossary/', file: 'docs/site/glossary.md', type: 'reference-glossary', title: 'Glossary', prev: null, next: { label: 'CLI reference', href: '/cli-reference/' }, brief: 'Glossary (Resources). Read the §4 brief for /glossary/. A definition list of NetScript terms, each 1-3 sentences, grounded in ground truth, each linking to the canonical page where the term is taught. Cover at least: contract, oRPC, saga, trigger, stream, contribution, manifest, registry, archetype, composition root, Aspire AppHost, durable, capability, plugin. Alphabetize. This page lowers the cost of the Explanation lane — cross-link liberally.', accuracyMarkers: ['contract', 'oRPC', 'saga', 'trigger', 'manifest', 'registry', 'AppHost'] },
      { url: '/cli-reference/', file: 'docs/site/cli-reference.md', type: 'reference-curated', title: 'CLI reference', prev: { label: 'Glossary', href: '/glossary/' }, next: null, brief: 'Curated CLI reference (Resources) — a human-curated companion to the GENERATED /reference/cli/ (do NOT duplicate the generated surface; link to it for exhaustive flags). Group the most-used commands by task: install (deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts), scaffold/new, plugin add, db init/generate/seed/migrate, generate registries, doctor. Use the public `netscript <cmd>` form everywhere. Each command: one-line purpose + example. Note db commands require `aspire run` first.', accuracyMarkers: ['netscript', 'deno install --global', 'jsr:@netscript/cli', '/reference/cli/', 'aspire run'] },
    ] },
  ],
};

const inv = (args && args.zones) ? args : INVENTORY;

const allPages = inv.zones.flatMap((z) => z.pages.map((p) => ({ ...p, zone: z.zone })));
log(`build-doc-site: ${inv.zones.length} zones, ${allPages.length} pages, worktree=${inv.worktree}`);

// ---- Shared grounding every authoring + verify agent receives ---------------
const GROUNDING = `
You are authoring ONE page of the NetScript documentation website. NetScript is a Deno-native,
contracts-first backend framework. This site is the production/enterprise-grade deliverable — be
exhaustive, concrete, and content-rich; never minimalistic.

AUTHORITY FILES (read them; never invent surface that contradicts them):
- Approved IA + per-page brief: ${inv.planPath}
- Ground truth (verified by running the scaffold): ${inv.groundTruth.join(', ')}
Every command, path, port, endpoint, and code shape MUST match those files. If the brief and ground
truth disagree, ground truth wins and you note the discrepancy in your return.

HARD DOC RULES:
1. Aspire is step 2, not an afterthought: \`cd aspire && aspire run\` brings up Postgres/Garnet BEFORE
   any \`netscript db\` command. DB commands require Aspire running first — state that dependency.
2. Use the public \`netscript <cmd>\` form. Never the vendored \`packages/cli/...\` path; install is
   \`deno install --global --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts\`.
3. Real endpoints/ports per capability (Workers :8091, Sagas :8092, Triggers :8093, Aspire :18888,
   example service :3001). Link to \`/reference/<unit>/\` for the full generated API — never duplicate it.
4. Canonical plugin location is \`plugins/<name>/\`. Triggers expose raw Hono routes, NOT oRPC. Streams
   producer/consumer are stubs (topic APIs deferred). Services use \`defineService(...)\` (one-shot) or
   the fluent \`createService(...).serve()\` builder. Contracts are \`@orpc/contract\` + zod with
   \`implement()\`. Match the anatomy file.

LUME/VENTO AUTHORING MODEL (the build aborts if violated):
- Front matter: \`layout: layouts/base.vto\`, a \`title\`, \`templateEngine: [vento, md]\`, and
  \`prev\`/\`next\` objects for the ladder. base.vto auto-injects breadcrumb + nextPrev for navSections pages.
- Body components: tag form \`{{ comp NAME { args } }}\` … body … \`{{ /comp }}\`, or self-close
  \`{{ comp NAME { args } /}}\`. No-body function form \`{{ comp.NAME({...}) }}\` returns a string.
- callout bodies are INLINE HTML (\`<strong>\`, \`<code>\`, \`<a>\`), not markdown.
- NEVER write the literal keyword \`function\` inside any comp-tag argument (it aborts the build) — use
  arrow/\`const\` form in code samples inside comps. The word \`function\` in page-level markdown prose is fine.
- Components available: hero, featureGrid, apiTable, tabbedCode, card, callout, learningPath
  (+ auto breadcrumb/nextPrev). Use any NEW components the approved plan introduced.

OUTPUT: write the file at its absolute path under ${inv.worktree} using the Write tool; if Write is
redirected away from that worktree, fall back to creating the file via a Bash heredoc at the absolute
path. Then return the structured manifest entry (do not paste the whole file).
`;

const PAGE_SCHEMA = {
  type: 'object',
  required: ['file', 'written', 'headings', 'accuracyMarkersPresent', 'compTagsBalanced', 'functionKeywordInComp', 'notes'],
  properties: {
    file: { type: 'string' },
    written: { type: 'boolean', description: 'true if the file was created at the absolute worktree path' },
    headings: { type: 'integer', description: 'count of section headings authored' },
    accuracyMarkersPresent: { type: 'array', items: { type: 'string' }, description: 'which required accuracyMarkers actually appear in the page' },
    accuracyMarkersMissing: { type: 'array', items: { type: 'string' } },
    compTagsBalanced: { type: 'boolean', description: 'every {{ comp NAME {...} }} has a matching {{ /comp }} (or is self-closed)' },
    functionKeywordInComp: { type: 'boolean', description: 'true ONLY if the forbidden bare `function` keyword appears inside a comp arg (must be false)' },
    crossLinks: { type: 'array', items: { type: 'string' }, description: 'internal hrefs linked (fil dAriane / related pages)' },
    discrepancies: { type: 'array', items: { type: 'string' }, description: 'places the brief contradicted ground truth' },
    notes: { type: 'string' },
  },
};

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['file', 'accurate', 'buildSafe', 'verdict'],
  properties: {
    file: { type: 'string' },
    accurate: { type: 'boolean', description: 'commands/ports/endpoints/code shapes match ground truth' },
    buildSafe: { type: 'boolean', description: 'comp tags balanced AND no bare `function` keyword inside any comp arg' },
    depthOk: { type: 'boolean', description: 'page is exhaustive/enterprise-grade for its type, not a stub' },
    issues: { type: 'array', items: { type: 'string' } },
    verdict: { type: 'string', enum: ['PASS', 'FIX'] },
  },
};

// ---- Phase Author + Verify: pipeline so each page verifies as it completes ---
const authored = await pipeline(
  allPages,
  (p) => agent(
    `${GROUNDING}\n\n=== THIS PAGE ===\nzone: ${p.zone}\ntype: ${p.type}\nurl: ${p.url}\nabsolute target: ${inv.worktree}/${p.file}\ntitle: ${p.title}\nprev: ${JSON.stringify(p.prev || null)}\nnext: ${JSON.stringify(p.next || null)}\nrequired accuracy markers: ${JSON.stringify(p.accuracyMarkers || [])}\n\nBRIEF:\n${p.brief}`,
    { label: `author:${p.zone}/${p.title}`, phase: 'Author', schema: PAGE_SCHEMA },
  ),
  (res, p) => res && res.written
    ? agent(
        `Adversarially verify the page just authored at ${inv.worktree}/${p.file}.\nRead the file and the authority files (${inv.groundTruth.join(', ')}). Check: (1) every command/path/port/endpoint/code shape matches ground truth; (2) Lume build-safety — every \`{{ comp NAME {...} }}\` has a matching \`{{ /comp }}\` or is self-closed, and the bare keyword \`function\` does NOT appear inside any comp arg; (3) the page is exhaustive for a "${p.type}" page (not a stub) and carries the fil-dAriane (breadcrumb-eligible front matter, prev/next, related cross-links). Required accuracy markers: ${JSON.stringify(p.accuracyMarkers || [])}. Return the verdict.`,
        { label: `verify:${p.zone}/${p.title}`, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).then((v) => ({ page: p, author: res, verdict: v }))
    : { page: p, author: res, verdict: { file: p.file, accurate: false, buildSafe: false, verdict: 'FIX', issues: ['not written'] } },
);

const results = authored.filter(Boolean);
const failing = results.filter((r) => !r.verdict || r.verdict.verdict !== 'PASS');
log(`authored ${results.length}/${allPages.length}; ${failing.length} need a fix pass`);

// ---- Phase Completeness: critic over the whole manifest ---------------------
const manifest = results.map((r) => ({
  zone: r.page.zone, url: r.page.url, file: r.page.file,
  pass: r.verdict && r.verdict.verdict === 'PASS',
  issues: (r.verdict && r.verdict.issues) || [],
}));

const critique = await agent(
  `You are the completeness critic for the NetScript documentation build. The approved IA is at ${inv.planPath}. Here is the authored manifest:\n${JSON.stringify(manifest, null, 2)}\n\nAgainst the approved IA and the ground-truth feature set, identify: (1) any planned page/zone NOT authored or NOT PASS; (2) any capability/feature with no page or no working code sample; (3) any wayfinding gap (a page not reachable via sidebar/breadcrumb/prev-next/related links); (4) any claim that is unverified against ground truth. Return a prioritized backlog of concrete follow-ups (page+what's missing).`,
  { label: 'completeness-critic', phase: 'Completeness',
    schema: { type: 'object', required: ['backlog'], properties: {
      coveredPages: { type: 'integer' }, passPages: { type: 'integer' },
      backlog: { type: 'array', items: { type: 'object', required: ['item', 'priority'], properties: {
        item: { type: 'string' }, priority: { type: 'string', enum: ['P0', 'P1', 'P2'] }, page: { type: 'string' } } } },
    } } },
);

return {
  zones: inv.zones.length,
  pages: allPages.length,
  authored: results.length,
  passed: manifest.filter((m) => m.pass).length,
  failing: failing.map((r) => ({ file: r.page.file, issues: (r.verdict && r.verdict.issues) || [] })),
  manifest,
  completeness: critique,
  note: 'After this run: supervisor runs `deno task --cwd docs/site build`, reconciles any leaked edits per the workflow-subagent-worktree-pin lesson, commits per zone, pushes, comments PR #59, appends commits.md. Then IMPL-EVAL (minimax-m3). NEVER merge PR #59 without explicit authorization.',
};
