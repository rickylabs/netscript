export const meta = {
  name: 'devtools-rfc-stage-b-discovery',
  description:
    'Stage-B discovery corpus for the DevTools contribution RFC: repo surfaces, prior RFCs, the dashboard board, doctrine, and a primary-source market study — every claim cited',
  phases: [
    { title: 'Discovery' },
  ],
}

// ---------------------------------------------------------------------------
// Inputs are embedded as consts, not passed via `args`.
// (`seed-run.md` § Landmines: Dynamic-Workflow `args` may not reach the script.)
// ---------------------------------------------------------------------------

const RUN_DIR = '.llm/runs/plan-devtools-contribution--seed'
const CORPUS = `${RUN_DIR}/research`
const BASELINE = '2256a67bf'
const WORKTREE = '/home/codex/repos/ns-rfc-devtools-contribution'

const CITATION_LAW = `
## Citation law (non-negotiable — the evaluator fails the plan on breaches)

Every finding, matrix row, and comparison claim MUST trace to one of:
  - a repo path + line range, e.g. \`packages/fresh/src/mod.ts:42-58\`
  - a \`deno doc\` surface you actually ran (quote the command)
  - a saved fetched artifact under \`${CORPUS}/sources/\` (you save it, then cite the path)
  - an external URL you actually fetched

An uncited claim is NOT a finding — drop it or mark it explicitly as \`inference\` with the
evidence it is inferred FROM. Never dress up an inference as an observation. If you could not
verify something, say "unverified" and say what would verify it. A smaller true corpus beats a
larger plausible one; the reader of this corpus is an adversarial evaluator, not a customer.
`

const SHARED_RULES = `
${CITATION_LAW}

## Ground rules

- Repo root / worktree: \`${WORKTREE}\`. Baseline: \`main\` @ \`${BASELINE}\`.
- **Read-only on source.** You are part of a planning-only RFC run. NEVER edit, create, or delete
  anything under \`packages/\`, \`plugins/\`, \`apps/\`, or \`docs/\` (except your own corpus file).
  NEVER mutate GitHub: no issue/PR/label/milestone creation, edit, comment, or close. \`gh\` is
  available and authenticated — use it for READS only (\`gh issue view\`, \`gh pr view\`,
  \`gh pr diff\`, \`gh api\`).
- Prefer \`deno doc <module>\` and \`deno doc --filter <symbol>\` over broad source reads when you
  need a package's PUBLIC surface — it is the cheapest accurate answer. Fall back to source for
  wiring and behavior.
- Prefix read-heavy \`git\`/\`gh\`/\`grep\`/\`ls\` with \`rtk\` to cut output (e.g. \`rtk grep <pat>\`).
- Do not speculate about what SHOULD exist. This stage records what DOES exist.

## Output contract

1. WRITE your full corpus file to the exact path given in your task. Markdown, well-structured,
   every claim cited inline. This file is the deliverable — be thorough in it.
2. RETURN the compact structured summary demanded by the schema. The return value is read by the
   supervisor to plan stage C; it is not a human-facing message. Keep it dense and factual.
`

const FINDING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['topic', 'corpus_path', 'summary', 'findings', 'open_questions'],
  properties: {
    topic: { type: 'string' },
    corpus_path: { type: 'string', description: 'path of the corpus file you wrote' },
    summary: {
      type: 'string',
      description: '4-10 sentences: what this surface actually is today, in load-bearing terms',
    },
    findings: {
      type: 'array',
      maxItems: 18,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['claim', 'evidence', 'kind', 'relevance'],
        properties: {
          claim: { type: 'string', description: 'one sentence, verifiable' },
          evidence: {
            type: 'string',
            description: 'path:line, deno doc command, saved artifact path, or URL',
          },
          kind: { type: 'string', enum: ['observed', 'inference', 'unverified'] },
          relevance: {
            type: 'string',
            description: 'which DevTools RFC question(s) Q1-Q12 this bears on, and how',
          },
        },
      },
    },
    contracts: {
      type: 'array',
      maxItems: 14,
      description: 'named types / APIs / schemas / commands that the RFC must consume or extend',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'shape', 'evidence'],
        properties: {
          name: { type: 'string' },
          shape: { type: 'string', description: 'terse signature or schema sketch' },
          evidence: { type: 'string' },
        },
      },
    },
    drift_candidates: {
      type: 'array',
      maxItems: 10,
      description:
        'places where a carried-in or documented claim no longer matches reality at the baseline',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['expected', 'actual', 'evidence', 'severity'],
        properties: {
          expected: { type: 'string' },
          actual: { type: 'string' },
          evidence: { type: 'string' },
          severity: { type: 'string', enum: ['minor', 'significant', 'architectural'] },
        },
      },
    },
    open_questions: {
      type: 'array',
      maxItems: 10,
      items: { type: 'string' },
    },
  },
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

const REPO_TOPICS = [
  {
    slug: 'r1-fresh-host',
    label: 'repo:fresh-host',
    effort: 'low',
    task: `Map **\`packages/fresh\`** — the Fresh 2 / Vite host that any DevTools surface must compose with.

Answer, with citations:
- What does \`packages/fresh\` export publicly? (\`deno doc\` its entry point first.)
- How are routes, islands, and the app shell composed and mounted today? Is there a
  programmatic mount/compose API, or is composition file-system-convention only?
- How does a plugin's UI reach the host today — generated registry, manual import, route
  injection, zones/slots? Find the ACTUAL mechanism and name the files that implement it.
- Where is the dev-server / HMR / island-registration seam? What would a second mounted
  surface (a DevTools app) collide with?
- Is there any existing notion of a separate host, a mode flag, a dev-only route tree, or a
  \`/design\` or \`/_devtools\`-shaped path already scaffolded?
- Fresh 2 / Vite specifics: how is the Vite plugin chain assembled, who owns it, and is it
  extensible from a plugin today?`,
  },
  {
    slug: 'r2-fresh-ui-pipeline',
    label: 'repo:fresh-ui',
    effort: 'low',
    task: `Map **\`packages/fresh-ui\`** — the registry / component / style-dictionary pipeline (frontend contribution surface #2).

Answer, with citations:
- What is the registry format? Where does it live, what generates it, what consumes it?
- What are the actual \`fresh-ui\` CLI commands (name them exactly), and what does each do?
- How do registry items get generated or copied into a userland project? Is it copy-in
  (shadcn-style) or package-import, and where is that decided in code?
- What is the theme / token / style-dictionary pipeline, and what is its authority chain?
- Is there ANY existing hook by which a plugin could contribute a registry item today? If not,
  what is the nearest seam, and what would have to change?
- What would break if two sources contributed the same registry item name (collision behavior
  today)?`,
  },
  {
    slug: 'r3-plugin-contribution-axes',
    label: 'repo:plugin-axes',
    effort: 'low',
    task: `Map the **plugin manifest and its contribution axes** — the extension model a DevTools family would join.

Look at \`packages/plugin\`, \`packages/plugin-*-core\`, and the six \`plugins/*\`.

Answer, with citations:
- What is the plugin manifest type/schema? Give its real shape.
- Enumerate EVERY existing contribution axis (the named seams by which a plugin adds
  something to the host). For each: its type, who generates it, who consumes it, and whether
  it is versioned.
- Is there a versioned-envelope pattern in use (RFC #890's pattern)? Where, and what exactly
  does the envelope carry — version, kind, payload, capabilities?
- How does discovery work: how does the host find installed plugins and their contributions?
- What generated registries exist? Where are they written, by what command, and are writes
  transactional?
- What happens on: version mismatch, unknown contribution kind, duplicate identity, a plugin
  that throws at load? Find real code, not intentions. If a behavior is undefined, say so.`,
  },
  {
    slug: 'r4-cli-plugin-flows',
    label: 'repo:cli-flows',
    effort: 'low',
    task: `Map the **CLI plugin lifecycle** — install / sync / list / doctor / dev, and the generators.

Look at \`packages/cli\`.

Answer, with citations:
- The exact command surface for plugin lifecycle. Name each command and its real flags.
- What does \`plugin doctor\` actually diagnose today? Enumerate its checks.
- What does the registry/schema generation do (\`generate plugins\`, \`generate runtime-schemas\`,
  or whatever they are really called)? What files does it emit, and where?
- Is there a \`plugin dev\` loop? What does it watch and what does it regenerate?
- How are local-path vs JSR-published plugins resolved? Where does that branch in code?
- What is the update/remove path, and does it clean up generated artifacts?
- Where would a new contribution KIND have to be registered for the CLI to know about it?
  Name the files a contributor would edit.`,
  },
  {
    slug: 'r5-observability-boundary',
    label: 'repo:boundary',
    effort: 'low',
    task: `Map the **ownership boundary** surfaces: Aspire, telemetry, MCP, Scalar, and any scaffolded \`/design\` resources.

Look at \`packages/aspire\`, \`packages/telemetry\`, \`packages/mcp\`, \`packages/service\`,
\`packages/contracts\`, and the scaffold templates.

Answer, with citations:
- What EXACTLY does Aspire own today in a NetScript app: resources, process lifecycle, logs,
  traces, metrics, health? Name the integration points and the dashboard URL/deep-link seam.
- Is there an existing deep-link helper to the Aspire dashboard? To Scalar? Find it or say none.
- What telemetry contracts exist that a DevTools surface could CONSUME rather than reimplement
  (OTel resource attributes, span naming, correlation ids)?
- What does the MCP surface expose about the framework's own state (endpoint directories,
  generated schemas, receipts)? This is a candidate DevTools data source — characterize it.
- Where does Scalar get mounted and from what OpenAPI source?
- Is there a scaffolded \`/design\` route or resource in generated projects? What is it today?`,
  },
]

const RFC_TOPICS = [
  {
    slug: 'p1-rfc-890-frontend-contrib',
    label: 'prior:890-frontend',
    effort: 'medium',
    task: `Re-baseline **RFC PR #890 — Frontend Contribution Layer** (merged), epic #922, children #923-#946.

Sources: \`gh pr view 890\`, \`gh pr diff 890\`, \`gh issue view 922\`, the children, and the committed
run \`.llm/runs/plan-frontend-contrib--seed/\` (especially \`rfc.md\`, \`plan.md\`, \`design/\`).

Answer, with citations:
- What did #890 ACTUALLY ratify, normatively? Quote its contracts. Distinguish what it decided
  from what it merely sketched or deferred.
- Give the exact versioned-envelope + generated-registry pattern: envelope fields, family
  identity, version negotiation, registry generation, ordering, collision policy.
- Confirm the charter's assertion that it "principally ratified the userland \`app\` family" —
  agree or correct it, with evidence.
- Which of its decisions are IMPLEMENTED at baseline \`${BASELINE}\` versus still only planned?
  Cross-check the epic's children states. This is the load-bearing question: an RFC that assumes
  a shipped pattern which is actually unshipped is a plan defect.
- What did it explicitly DEFER that a DevTools RFC would now inherit?
- Which parts of its pattern are sound to reuse for a DevTools family, and which are
  app-family-specific payload that must NOT be copied blindly?`,
  },
  {
    slug: 'p2-rfc-1446-runtime-automation',
    label: 'prior:1446-runtime',
    effort: 'medium',
    task: `Consume **draft RFC PR #1446 — Runtime-Versioned Automation** at final evaluated head \`6cb79675c\`.

Primary source file:
\`/home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md\`
plus that worktree's evidence corpus under its \`.llm/runs/\`, plus \`gh pr view 1446\`.

**Its backend decisions are CLOSED. Do not reopen or critique them.** Your job is to extract what
DevTools must consume.

Answer, with citations:
- What exactly is its **P-6 DevTools dependency**? Quote it. What does it require of a DevTools
  surface, and what does it promise in return?
- Extract the normative **management contracts** (the stable typed management surface), the
  **audit/history** contract, the **convergence** contract, and the **OTel** contract. Give real
  type/route shapes, not summaries.
- What does it say about a production/admin console versus developer diagnostics? Quote it. This
  is the boundary the DevTools RFC must not violate.
- What entry criteria / sequencing does it impose on anything that depends on it?
- Note its RFC file location and numbering convention (\`docs/architecture/rfc/rfc-NNNN-*.md\`)
  and whether that directory exists on \`main\` at \`${BASELINE}\` — the DevTools RFC needs a home
  and must not collide.`,
  },
  {
    slug: 'p3-rfc-1390-sdk',
    label: 'prior:1390-sdk',
    effort: 'medium',
    task: `Consume **draft RFC PR #1390 — Typed SDK client contributions** and tracking issue **#1348**.

Sources: \`gh pr view 1390\`, \`gh pr diff 1390\`, \`gh issue view 1348\`, and the worktree
\`/home/codex/repos/ns-rfc-sdk-client\` if it holds the RFC text (locate the file first).
Also \`deno doc\` the current \`packages/sdk\` public surface for the as-is baseline.

**Do not design a second SDK extension mechanism.** Your job is to determine precisely what a
DevTools data-access layer would consume.

Answer, with citations:
- What is the proposed \`SdkClientContribution\` chain? Give its real shape: client construction,
  credentials, transport, policy metadata, query invalidation.
- How would a plugin-contributed DevTools panel obtain a typed client for its own plugin's
  service? Trace the intended path end to end.
- What does it say about auth/principal propagation, and about server-side versus client-side
  construction?
- What is its status: is it ratified, in review, or open? What is blocking it? A DevTools RFC
  that hard-depends on an unratified mechanism has a sequencing risk — characterize it precisely.
- What would DevTools need that #1390 does NOT currently provide?`,
  },
]

const BOARD_TOPICS = [
  {
    slug: 'b1-dashboard-board',
    label: 'board:dashboard',
    effort: 'medium',
    task: `Reconstruct the **existing Dev Dashboard board** so it can be superseded honestly.

Sources: epic **#400**; merged design umbrella **#685**; draft visual PR **#780**; closed prototype
**#506**; issues **#410-#432**; any LATER dashboard-related issues you find (search, do not assume
the range is complete); and the committed run \`.llm/runs/dashboard-rescope--seed/\`.

This is research evidence, NOT ratified architecture. Treat it as such.

Produce, with citations:
- A per-issue inventory: number, title, state, milestone, labels, and a ONE-LINE statement of
  what it actually asks for. Cover #400 and every child/related issue you find.
- The **ownership thesis** the old dashboard work landed on (what NetScript owns versus Aspire
  versus Scalar). Quote it — the charter says this thesis is correct and must be preserved.
- What #685 (merged design umbrella) actually ratified, versus what #780 (draft visual PR)
  merely proposes. Be precise about which artifacts have authority.
- Why #506 was closed. What was learned.
- A first-pass **disposition recommendation** per issue: KEEP / AMEND / FOLD / SUPERSEDE /
  CLOSE-LATER, each with a one-line reason. Mark this as a RECOMMENDATION — the supervisor
  decides, and nothing is filed before owner ratification.
- Any file-level artifacts (design docs, prototypes, run dirs) that a supersession map must
  also cover.`,
  },
  {
    slug: 'b2-doctrine-and-live-board',
    label: 'board:doctrine',
    effort: 'medium',
    task: `Map **doctrine, debt, and the live board** the DevTools RFC must fit into.

Sources: \`docs/architecture/doctrine/\` (all of it — especially archetypes, layering rules,
folder vocabulary, anti-patterns, fitness gates, and \`10-codebase-verdict-and-handoff.md\`);
\`.llm/harness/debt/arch-debt.md\`; \`.llm/harness/archetypes/\`; \`rfcs/README.md\` and
\`rfcs/0000-template.md\`; live milestones and open issues via \`gh\`.

Answer, with citations:
- Which doctrine **archetype** would a DevTools host package be? Which for a DevTools plugin?
  Quote the archetype definitions and justify the mapping. Name the fitness gates each implies.
- What are the layering rules a new frontend host package must obey? What may it depend on?
- Which existing **anti-patterns** would a DevTools host be most at risk of committing?
- What is the current doctrine VERDICT (\`10-codebase-verdict-and-handoff.md\`) and its headline
  action? Does it constrain adding a new package right now?
- Open **arch-debt** entries relevant to fresh / fresh-ui / plugins / telemetry.
- **RFC home collision:** \`rfcs/\` exists on \`main\` with a template; \`docs/architecture/rfc/\`
  does NOT exist at \`${BASELINE}\` but is introduced by unmerged PR #1446. Establish exactly
  what each convention is, what \`rfcs/README.md\` says the process is, and lay out the options
  for where a new RFC should live. Do NOT decide — this is an owner fork.
- The **Fable 5 remediation roadmap** (\`.llm/runs/plan-fable5-remediation-roadmap--seed/\`):
  does it contain anything that constrains or overlaps DevTools work?
- Live milestone shape: which milestones are open, and which would plausibly own DevTools work.`,
  },
]

const MARKET_TOPICS = [
  {
    slug: 'm1-nuxt-vite',
    label: 'market:nuxt-vite',
    effort: 'low',
    task: `Primary-source **architecture** teardown: **Nuxt DevTools** and the **Vite DevTools / vite-plugin-inspect** ecosystem.

These are the closest true analogues — a framework-owned devtools surface that third-party
modules extend. Go to their docs AND their source/RFCs. Save each fetched artifact under
\`${CORPUS}/sources/\` and cite the saved path.

For EACH, answer:
- **How is it mounted?** Separate app, injected overlay/iframe, route on the dev server, browser
  extension? What is the exact mechanism, and is it dev-only by construction?
- **What is the contribution API** by which a module adds a tab/panel/view? Give the real
  type/hook names and a real code example.
- **How does a contributed view get its data?** RPC channel, direct import, server functions,
  websocket? Is there a typed contract? How is it versioned?
- **Isolation and trust:** does a contributed view run in the same JS context as the devtools
  shell? iframe? separate process? What happens when a contribution throws?
- **Production behavior:** what happens in a production build? Stripped, disabled, or shippable?
- **What did they get WRONG** or later change? Look for issues/RFCs/migration notes admitting a
  design mistake. This is the most valuable evidence in the whole teardown — a competitor's
  regret is a cheap lesson.

Finish with an explicit **applicability verdict** for NetScript: what transfers, what does not,
and why. NetScript is Deno + Fresh 2 + Vite + Aspire, not Node + Nuxt — do not transfer
mechanisms that assume the other stack.`,
  },
  {
    slug: 'm2-tanstack-grafana',
    label: 'market:tanstack-grafana',
    effort: 'low',
    task: `Primary-source **architecture** teardown: **TanStack Devtools** and **Grafana plugin extensions**.

Two different lessons: TanStack is a library-level devtools panel model; Grafana is a mature,
versioned, capability-negotiated plugin-extension system with a real trust story. Go to docs AND
source/RFCs. Save fetched artifacts under \`${CORPUS}/sources/\` and cite the saved path.

**TanStack Devtools** — answer:
- How is the panel embedded, and how do multiple TanStack libraries each contribute their own
  panel to one shell? Give the real registration API.
- How is it excluded from production builds? Exact mechanism.
- What is the data channel between the instrumented library and the panel?

**Grafana plugin extensions** — answer:
- The **extension point** model: how does a host declare an extension point, and how does a
  plugin target it? Give real API names and a real example.
- **Versioning and compatibility negotiation**: how does Grafana stop an incompatible plugin
  from breaking the host? What is the failure mode when negotiation fails?
- **Capabilities / permissions**: what can an extension do, and what gates that?
- **Isolation**: sandboxing story, and what they learned from not having one.
- **Ordering and collisions** when multiple plugins target the same extension point.

Finish with an explicit **applicability verdict** for a NetScript DevTools contribution family:
which of Grafana's mechanisms are worth adopting at NetScript's scale, and which are enterprise
overhead that a framework at this stage should not pay for.`,
  },
  {
    slug: 'm3-admin-consoles',
    label: 'market:admin',
    effort: 'low',
    task: `Primary-source **architecture** teardown: **Medusa admin zones/extensions**, **Directus**, **Strapi**, and **Backstage**.

These are **production admin consoles**, not developer devtools. The charter requires that this
distinction be held, not averaged — your teardown must make the difference architecturally
concrete. Go to docs AND source. Save fetched artifacts under \`${CORPUS}/sources/\` and cite them.

For **Medusa** specifically (RFC #890 was inspired by its zones):
- The exact admin **zone/injection-zone** model: how a plugin declares where its UI goes, how
  the zone identity is namespaced, and what happens on collision or unknown zone.
- How admin extensions are built and bundled, and how they get their data.

For **Directus** and **Strapi**:
- Their extension/plugin UI model, and how it is versioned and validated.
- How they handle auth/RBAC for extension-contributed surfaces — this is the production-console
  concern that developer devtools usually skip.

For **Backstage**:
- The plugin architecture and why it became notoriously heavy. What is the actual cost of its
  model, and what did the project change in response? Be specific and evidence-based.

Finish with the required **separation verdict**: enumerate the architectural properties that
differ between a production admin console and a developer diagnostics tool (trust model,
lifetime, auth, data freshness, build inclusion, failure tolerance, audience). This verdict
feeds RFC question Q4 directly — make it sharp and citable.`,
  },
  {
    slug: 'm4-aspire-scalar',
    label: 'market:aspire-scalar',
    effort: 'low',
    task: `Primary-source **boundary** teardown: the **Aspire Dashboard** and **Scalar**.

These are not competitors — they are the two upstream surfaces NetScript DevTools must DEEP-LINK
to rather than clone. The RFC's ownership thesis (Q5) stands or falls on how precisely their
territory is characterized. Go to primary docs AND source. Save fetched artifacts under
\`${CORPUS}/sources/\` and cite them.

**Aspire Dashboard** — answer:
- Exactly what it owns and displays: resources, console logs, structured logs, traces, metrics,
  health, process lifecycle, resource commands. Enumerate its real surface.
- Its **deep-link / URL scheme**: can an external tool link to a specific resource, trace, span,
  or log-filtered view? Give real URL shapes if they exist; say so plainly if they do not.
- Its extensibility: can anything be contributed INTO the Aspire dashboard? What are the limits?
- Its auth/exposure model, and its local-versus-deployed story.

**Scalar** — answer:
- What it owns: API reference rendering, schema display, try-it. Its mount/config model.
- Its deep-link scheme to a specific operation/tag/schema — real anchor/URL shapes.
- Its theming/extension surface, and the limits of it.

Finish with a **boundary table**: for each candidate DevTools capability (resource state, logs,
traces, metrics, health, process control, API schema, try-it, framework contribution wiring,
generated-artifact drift, contract provenance, runtime-domain journeys, framework actions), state
whether Aspire owns it, Scalar owns it, or NetScript DevTools owns it — and for the upstream-owned
ones, whether a deep-link is actually POSSIBLE given the URL evidence you found. A capability we
cannot deep-link to is a real design constraint, not a detail.`,
  },
]

// ---------------------------------------------------------------------------
// Execution — one wide discovery fan-out; each agent writes its own corpus file.
// ---------------------------------------------------------------------------

phase('Discovery')

const ALL = [...REPO_TOPICS, ...RFC_TOPICS, ...BOARD_TOPICS, ...MARKET_TOPICS]

log(`Stage B: ${ALL.length} discovery agents over repo, prior RFCs, board, doctrine, and market`)

const results = await parallel(
  ALL.map((t) => () =>
    agent(
      `use harness

You are a Stage-B discovery agent for the **NetScript DevTools Contribution Architecture RFC**
(seed run \`plan-devtools-contribution--seed\`, draft PR #1450). The run is PLANNING-ONLY.

## SKILL

Activate and follow, as relevant to your topic:
- \`netscript-harness\` — you are inside a harness seed run; stage-B evidence rules bind you.
- \`netscript-doctrine\` — for any package/plugin architecture claim.
- \`netscript-deno-toolchain\` — use \`deno doc\` for public surfaces before broad source reads.
- \`netscript-tools\` — canonical evidence and verification surfaces; \`rtk\` for compact reads.
- \`netscript-cli\`, \`deno-fresh\`, \`fresh-ui-horizontal\`, \`aspire\` — where your topic touches them.

${SHARED_RULES}

## Your topic: ${t.label}

${t.task}

## Write your corpus file to

\`${CORPUS}/${t.slug}.md\`

Structure it: \`# <topic>\` → \`## Summary\` → \`## Findings\` (each with inline citation) →
\`## Contracts\` → \`## Drift candidates\` → \`## Open questions\` → \`## Sources\`.

Then return the structured summary.`,
      {
        label: t.label,
        phase: 'Discovery',
        effort: t.effort,
        schema: FINDING_SCHEMA,
      },
    )
  ),
)

const ok = results.filter(Boolean)
log(`Stage B complete: ${ok.length}/${ALL.length} agents returned`)

return {
  baseline: BASELINE,
  requested: ALL.length,
  returned: ok.length,
  failed: ALL.filter((t, i) => !results[i]).map((t) => t.slug),
  topics: ok,
}
