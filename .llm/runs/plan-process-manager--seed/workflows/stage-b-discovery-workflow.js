export const meta = {
  name: 'pm-seed-stage-b-discovery',
  description: 'Stage-B discovery corpus for plan-process-manager--seed: repo seams + docs + market teardown',
  phases: [{ title: 'Discovery' }],
}

// Landmine: Workflow args may not thread — all inputs are consts (seed-run.md).
const WT = 'C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager'
const RUN = WT + '/.llm/runs/plan-process-manager--seed'
const OUT = RUN + '/research'

const PREAMBLE = `use harness

## SKILL
Read only what your topic needs; these are the relevant repo skills (read the SKILL.md directly):
- ${WT}/.agents/skills/netscript-doctrine/SKILL.md (package/plugin archetypes, thinness law)
- ${WT}/.agents/skills/netscript-cli/SKILL.md (CLI command surface)
- ${WT}/.agents/skills/netscript-deno-toolchain/SKILL.md (deno doc / deps inspection)

## Role
You are a Stage-B discovery agent for the seed run plan-process-manager--seed. The run subject:
a Deno-native, NetScript-native process manager (the pup/pm2 concept, 2026 state of the art),
shipped as a NetScript PLUGIN (core package + adapters), with TWO surfaces over one core —
(A) a Deno Desktop (Deno 2.9) admin-console UI and (B) a pure CLI — and wired in as the
BARE-METAL deployment target of epic #327. Charter: ${RUN}/charter.md (read it first).

## Evidence-citation gate (hard)
Every finding/claim must carry a citation: repo-relative file path + line (cite against the
worktree ${WT}), a deno doc surface, or a full external URL. An uncited claim is not a finding.

## Deliverable mechanics (hard)
Workflow agents cannot use the Write/Edit tools on the run worktree — write your corpus doc with
the Bash tool using a quoted heredoc, e.g.:
  mkdir -p '${OUT}' && cat > '${OUT}/<slug>.md' <<'CORPUS_EOF'
  ...markdown...
  CORPUS_EOF
Verify the write with: wc -c '${OUT}/<slug>.md'. Target 200–500 lines of dense, citation-backed
markdown (an H1, a findings section with citations, a feature/comparison matrix where relevant,
and a "relevance to NetScript process-manager plugin" section). Then RETURN only the structured
metadata (slug, wrotePath, bytes, headline, sources, driftCandidates, openQuestions).
`

const TOPIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'wrotePath', 'bytes', 'headline', 'sources', 'driftCandidates', 'openQuestions'],
  properties: {
    slug: { type: 'string' },
    wrotePath: { type: 'string' },
    bytes: { type: 'number' },
    headline: { type: 'string', description: '3-6 sentence summary of the load-bearing findings' },
    sources: { type: 'array', items: { type: 'string' } },
    driftCandidates: { type: 'array', items: { type: 'string' }, description: 'facts contradicting the charter, #327, or prior research' },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const TOPICS = [
  {
    slug: 'r1-plugin-architecture-seams',
    brief: `Repo teardown: what a NetScript PLUGIN gets for free and how a process-manager plugin would compose.
Study (in ${WT}): the plugin archetype (.llm/harness/archetypes/ — pick the plugin one), doctrine under
docs/architecture/doctrine/ (thinness law, core-centralization), packages/plugin (manifest/protocol/sdk —
use 'deno doc' where cheaper than reading source), the REFERENCE composition pattern: plugins/workers +
packages/plugin-workers-core, and plugins/auth + packages/plugin-auth-core + its adapter packages (names may
differ — verify). Map: plugin manifest surface, scaffold path ('plugin add'/'plugin new' in packages/cli),
registry generation, doctor, what routes/oRPC contracts a plugin exposes, how plugins ship background
services, how plugins get OTEL + config + db access. Also read the dev-dashboard design pack
.llm/runs/plan-roadmap-expansion--seed/design/ (find the dashboard topic folder): DashboardPanelContribution
/ plugin-dashboard-core plans — the process-manager admin console must be reconciled with that epic (#400).
Answer explicitly: what would 'plugins/process(-manager)' + 'packages/plugin-<x>-core' look like under the
thinness law, and which built-ins does it inherit with zero code.`,
  },
  {
    slug: 'r2-deploy-baremetal-seams',
    brief: `Repo teardown: the SHIPPED bare-metal deploy lane the plugin must reuse (charter: reuse is mandatory research).
Study (in ${WT}): packages/cli deploy surface — src/kernel/adapters/deploy/ (incl. servy-command.ts,
manifest-command.ts), src/kernel/adapters/windows/servy/* and windows/manifest/*, src/public/adapters/servy-cli.ts,
src/kernel/domain/deploy/*, src/public/ports/service-manifest-port.ts; find OsServicePort + SystemdAdapter
(#339), the 'deno compile' artifact command (#340), rollback/health-gate/OTEL/secrets hardening (#341), and
the deploy.targets.* config contract (#337) wherever it lives (packages/config?). Read
${RUN}/context/prior-deployment-architecture-spec.md + prior-decision-gap-tracker.md (prior research; SERVY
verdict=MODERNIZE) and ${RUN}/context/adjacent-issues.jsonl (open deploy scope #345/#346/#348, desktop
#451-#458). Map precisely: which seams (ports, adapters, domain types, CLI verbs) a process-manager plugin
can lift/wrap vs what must move INTO a plugin-core package, and where the current CLI-only design ends
(no daemon, no supervision loop, no restart policy — verify and cite). List every open issue whose scope
overlaps a process-manager plugin (supersession candidates).`,
  },
  {
    slug: 'r3-runtime-process-seams',
    brief: `Repo teardown: existing process/runtime execution seams a supervisor core could build on.
Study (in ${WT}): plugins/workers + packages/plugin-workers-core (especially src/executor/adapters/command-spec.ts
and any subprocess execution: Deno.Command usage, lifecycle, restart/retry semantics); packages/aspire (dev
orchestration: how 'netscript start'/aspire start supervises processes in dev, the generator, and what the
--no-aspire scaffold path leaves you with — verify what --no-aspire actually scaffolds in packages/cli);
packages/telemetry (+ the just-shipped T1 convention f88847d0 and T2 ports/adapters f91dc503 — netscript.*
namespace, how a plugin emits OTEL); the oRPC/service API seam (how a plugin exposes typed endpoints; find the
base contract/service seam in packages/plugin + @netscript/plugin base); KV usage conventions (@netscript/kv)
for daemon state. Answer explicitly: what process-execution primitives already exist (spawn, env, health,
logs), what supervision primitives are MISSING (daemon, IPC, restart policies, log rotation), and how a
process-manager core would slot beside workers without duplicating it (workers = jobs; pm = long-running
services — verify that framing against code).`,
  },
  {
    slug: 'r4-docs-scaffold-desktop-surface',
    brief: `Repo/docs teardown: user-facing surfaces the plugin must fit.
Study (in ${WT}): docs/ (deploy docs, dev-workflow docs, plugin docs — what the site promises about deploy +
dev process management; cite pages), the scaffold surface (packages/cli scaffold: --no-aspire flag semantics,
what dev-runner story exists without Aspire), the desktop Tier-4 plan (context/adjacent-issues.jsonl #451-#458
+ any design pack under .llm/runs/plan-roadmap-expansion--seed/design/ for desktop/E-topic), and the
dev-dashboard epic #400 issue body (same file) + its design pack (panels, Fresh shell, fresh-ui). Also survey
what exists for 'app admin UI' patterns in the repo: apps/, packages/fresh-ui (L0-L2), eis-chat references in
design docs. Answer explicitly: (a) how a Deno-Desktop admin console for the process manager relates to the
dev-dashboard plugin plans (shared shell? shared panel contract? separate app?), (b) what the --no-aspire dev
fallback story is today (cite), (c) which docs pages would need a process-manager chapter.`,
  },
  {
    slug: 'm1-pup-teardown',
    brief: `Market teardown: hexagon/pup — extract the CONCEPT (excellent) and the code lessons (imperfect).
Sources: https://github.com/hexagon/pup (README, source tree via raw.githubusercontent.com or the GitHub UI),
docs (try https://pup.56k.guru), jsr/deno.land package pages. Map its full feature surface: pup.json process
config, start policies (autostart/cron/watch), restart policies + watchdog, clustering + built-in load
balancer, telemetry IPC between processes, REST API, plugins system, CLI verbs (run/start/stop/status/logs...),
state persistence, log handling, "no third-party deps" philosophy, service installers (systemd/launchd/windows).
Assess: architecture (core Pup class, ProcessLoop?), what aged badly (unmaintained ~2y — verify last release/commit
date), which Deno APIs it used that are now legacy vs stable, what 2026 Deno (2.9: Deno.Command, OTEL_DENO,
deno compile, desktop) makes trivially better. End with: concept checklist a NetScript plugin should meet-or-exceed.`,
  },
  {
    slug: 'm2-pm2-teardown',
    brief: `Market teardown: pm2 — the feature bar and its 2026 critiques.
Sources: https://pm2.keymetrics.io/docs (+ GitHub Unitech/pm2). Map: daemon god-process model + RPC (axon),
ecosystem.config.js, cluster mode (node cluster — note Deno equivalence question), restart strategies
(exponential backoff, max-memory-restart, cron restart), watch mode, log management (rotation module),
startup script generation (systemd/launchd/windows), pm2-runtime (container mode, PM2 inside docker),
monitoring (pm2 monit, pm2.io SaaS, prometheus module pm2-metrics?), deployment system (pm2 deploy),
keymetrics telemetry. Critiques to verify via search: memory overhead, daemon fragility, closed-source
monitoring, node-lock-in. End with: the pm2 feature-parity matrix a 2026 NetScript plugin should hit, and the
anti-features to deliberately NOT copy (with rationale).`,
  },
  {
    slug: 'm3-servy-windows-systemd-native',
    brief: `Market teardown: OS-native service management the plugin must WRAP, not reinvent.
Sources: https://github.com/aelassas/servy (Servy, Windows; NetScript already ships a servy adapter — see
packages/cli/src/kernel/adapters/windows/servy/ in ${WT} for what we generate today; cite both sides), NSSM
(nssm.cc), WinSW (github.com/winsw/winsw), and the systemd state of the art 2026: unit hardening options,
Restart=/RestartSec, WatchdogSec + sd_notify(READY=1/WATCHDOG=1), socket activation, DynamicUser,
resource control (CPUQuota/MemoryMax cgroups v2), portable services, quadlet (podman), user services +
lingering; plus launchd basics for macOS parity. Answer explicitly: the wrap-don't-reinvent boundary — which
supervision duties belong to the OS layer (servy/systemd/launchd) vs the NetScript pm layer (app-level
orchestration, multi-process topology, health semantics, admin UI), and how sd_notify/watchdog integration
would look from Deno (env NOTIFY_SOCKET, unix datagram — cite Deno API feasibility).`,
  },
  {
    slug: 'm4-2026-landscape-deno-desktop',
    brief: `Market sweep: the 2026 process-manager landscape + the Deno 2.9 platform facts this design stands on.
Landscape (verify each is alive; cite): F1bonacc1/process-compose (compose-syntax PM, TUI — closest modern
analog), supervisord, s6/s6-overlay + s6-rc, runit, overmind/hivemind (Procfile), systemd-as-PM trend,
podman quadlet, dokku/kamal (deploy-adjacent), any NEW 2024-2026 entrants (search: "process manager" deno,
rust process manager pm2 alternative 2025/2026 — e.g. pmc, pm2-rs?, shoreman...). Deno platform facts (fetch
docs.deno.com; this is LOAD-BEARING, get it exact + cite): Deno 2.9 'deno desktop' (what it actually is: VFS,
webview?, Deno.autoUpdate, packaging targets, signing story), deno compile (cross-compile matrix, asset
embedding, --include), Deno.Command/ChildProcess (signals, stdio streaming, unref), OTEL_DENO built-in
telemetry (what's exported for subprocesses), Deno KV (daemon state), unix sockets/named pipes support
(Deno.listen({transport:'unix'}) — Windows named-pipe status), signal handling (Deno.addSignalListener,
Windows caveats), workers vs subprocess. End with: the 2026 SOTA technique list (things pup/pm2 don't do that
a new tool should: e.g. OTEL-native, declarative reconcile, socket activation, TUI+web+desktop parity,
supply-chain-safe zero-dep core) — each with a source.`,
  },
]

phase('Discovery')
log('Fanning 8 Sonnet discovery agents (4 repo, 4 market)')

const results = await parallel(TOPICS.map((t) => () =>
  agent(
    `${PREAMBLE}\n## Topic: ${t.slug}\n${t.brief}\n\nWrite the corpus doc to '${OUT}/${t.slug}.md' (Bash heredoc), verify bytes, then return the metadata object. slug must be '${t.slug}'.`,
    { label: t.slug, phase: 'Discovery', schema: TOPIC_SCHEMA, model: 'sonnet', effort: 'high' },
  )
))

const ok = results.filter(Boolean)
log(`Discovery done: ${ok.length}/${TOPICS.length} topics returned`)
return {
  topics: ok.map((r) => ({ slug: r.slug, wrotePath: r.wrotePath, bytes: r.bytes, headline: r.headline })),
  driftCandidates: ok.flatMap((r) => r.driftCandidates.map((d) => `[${r.slug}] ${d}`)),
  openQuestions: ok.flatMap((r) => r.openQuestions.map((q) => `[${r.slug}] ${q}`)),
  sources: ok.flatMap((r) => r.sources.map((s) => `[${r.slug}] ${s}`)),
  missing: TOPICS.filter((t) => !ok.some((r) => r.slug === t.slug)).map((t) => t.slug),
}
