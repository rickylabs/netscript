export const meta = {
  name: 'devtools-rfc-stage-e-authoring',
  description:
    'Stage-E: draft the canonical DevTools RFC body sections from the committed stage-D packs — normative prose, real contracts, cited claims',
  phases: [{ title: 'Author' }],
}

// ---------------------------------------------------------------------------
// Inputs embedded as consts (seed-run landmine: `args` may not reach the script).
// Authoring lane per CLAUDE.md's documentation-authoring exception: generation
// only. Validation is the separate opposite-family stage-F/G pass; this
// workflow never self-certifies.
// ---------------------------------------------------------------------------

const RUN = '.llm/runs/plan-devtools-contribution--seed'
const OUT = `${RUN}/rfc-sections`

const COMMON = `
You are drafting ONE section of the canonical **NetScript DevTools Contribution Architecture RFC**
(run \`plan-devtools-contribution--seed\`, draft PR #1450, worktree
\`/home/codex/repos/ns-rfc-devtools-contribution\`, baseline \`main\` @ \`2256a67bf\`).

## SKILL
- \`netscript-harness\` — you are inside a harness seed run; its evidence rules bind you.
- \`netscript-doctrine\` — every archetype / layering / anti-pattern claim cites doctrine.
- \`netscript-deno-toolchain\` — \`deno doc\` before broad source reads.

## HARD RULES
- **PLANNING ONLY. Read-only on source and GitHub.** Never edit \`packages/\`, \`plugins/\`,
  \`apps/\`, or anything under \`docs/\`. Never mutate GitHub — \`gh\` is READS only. Your ONLY write
  is your own section file.
- **Do not run \`deno doc\`/\`deno check\` in a way that rewrites \`deno.lock\`.** If you must resolve a
  module, prefer reading source. Lock churn is a hygiene violation in this run.
- **Cite every load-bearing claim** — \`path:line\`, a corpus file, or a saved artifact under
  \`${RUN}/research/sources/\`. Mark \`inference\` and \`unverified\` honestly. An uncited claim is a
  PLAN-EVAL failure.
- **Never claim isolation, security, compatibility, performance, or production readiness without an
  executable gate or a citation.** If a property is desired but unproven, write it as an explicit
  open risk naming the gate that would prove it.

## REQUIRED READING (in order)
1. \`${RUN}/research.md\` — 26 cited findings F1–F26 and the five stage-C resolutions.
2. \`${RUN}/drift.md\` — **D-6/D-7/D-8 correct earlier claims. The drift entry wins over the corpus.**
3. Your source packs, named in your task.

## VOICE AND FORM
- This is a **normative architecture RFC**, not a summary. Write decisions, not options — every
  "should" is either a decision with rationale or an explicitly numbered owner fork.
- Real TypeScript in contract blocks. Real paths. Real route shapes. No pseudo-code placeholders.
- Tables where a table is clearer than prose. Diagrams as fenced \`mermaid\` blocks where structure
  matters.
- Start your file at heading level \`##\` (the RFC's H1 and front matter are the supervisor's).
- **Do not restate another section's content.** Cross-reference by section name instead.
- Prefer being shorter and true over longer and plausible.

## OUTPUT
Write ONLY your section file at the exact path in your task. Then RETURN ≤200 words: what you
decided, anything you could not verify, and any owner fork you surfaced. The return is read by the
supervisor for assembly — dense, factual, not a report.
`

const SECTIONS = [
  {
    slug: '03-current-state',
    label: 'rfc:current-state',
    task: `Section: **"Current state — what exists, what does not"** (the cited current-state matrix).

Packs/corpus: \`${RUN}/research.md\` (primary), \`${RUN}/research/r1-fresh-host.md\`,
\`r2-fresh-ui-pipeline.md\`, \`r3-plugin-contribution-axes.md\`, \`r4-cli-plugin-flows.md\`,
\`r5-observability-boundary.md\`.

Write the honest as-is picture the rest of the RFC rests on. Lead with the fact that **there is no
plugin→UI channel of any kind** and that the real mechanism today is three hardcoded Vite aliases.
Cover: the plugin manifest's two disjoint shapes; the contribution-axis model and its provable
closedness (\`cli.doctorChecks: readonly 'auth-backend'[]\`, dead axes, uninvoked lifecycle hooks,
silent duplicate-identity collapse); the two divergent registry generators and the regex
"AstExtractor"; non-transactional writes; the \`/design\` precedent; and the data-plane assets that
already exist and must be consumed rather than rebuilt (\`TelemetryQueryPort\`, 22 typed MCP tools,
\`openapi-projection\`, \`netscript.correlation.id\`, the unexported SSE helpers).

Include a compact **"what a contributor must edit today to add a kind"** list (six framework files) —
it is the motivation in concrete form. End with a short table: capability → exists / partial / absent,
with a citation per row.`,
  },
  {
    slug: '04-surfaces-map',
    label: 'rfc:surfaces',
    task: `Section: **"The five frontend contribution surfaces"** — the mandatory framing map.

Packs/corpus: \`${RUN}/research.md\`, \`research/p1-rfc-890-frontend-contrib.md\`,
\`p2-rfc-1446-runtime-automation.md\`, \`p3-rfc-1390-sdk.md\`, \`design/T7-build-dev/proposal.md\`,
\`design/T8-ia-and-staging/proposal.md\`.

Model the five seams as **distinct**, with dependencies and proven non-overlap: (1) userland
frontend code — #890/#922; (2) Fresh UI registry/component/style-dictionary contributions;
(3) Vite plugin contributions; (4) **DevTools contributions — this RFC**; (5) SDK contributions —
#1390/#1348.

For each: current owner, current state, what this RFC does with it (own / consume / bound against /
defer), and the **explicit non-overlap argument**. Quote #1446's own five-surface enumeration
(RFC:497-502) — the taxonomy is the owner's, not ours.

Be precise about the two hard dependencies: #890's spine is **unbuilt** (a co-dependency, not reuse),
and RFC-A does not close the host→panel loop but its "separate named extension axes" sentence
licenses one. Include a \`mermaid\` dependency diagram.`,
  },
  {
    slug: '05-host',
    label: 'rfc:host',
    task: `Section: **"The DevTools host"** — Q1.

Primary pack: \`${RUN}/design/T1-host-shape/proposal.md\`. Also \`design/T6-trust-model/proposal.md\`
(exposure tiers) and \`research/m1-nuxt-vite.md\`.

Write the host decision normatively: separate first-party host process; CLI-generated root; own Vite
process, own port, loopback-bound; own route tree. State **local dev**, **deployed production**, and
**remote exposure** behavior unambiguously.

Production posture must be **two independent mechanisms** and stricter than upstream — say why,
citing that Vite DevTools ships into production builds with client auth disabled, and note the
fail-safe polarity (\`!== 'development'\`, not \`=== 'production'\`).

Carry the closed research question as a **decided fact**: NetScript is in the documented
\`transformIndexHtml\` no-op bucket — no \`index.html\` in the scaffold, zero \`transformIndexHtml\`
repo-wide — so a Vite-injection mount is unavailable. Also state the Vite-7-vs-8 position as an
explicit non-goal with a re-entry condition, and record the \`/design\` route group as an existing
ungated surface (same defect class) without fixing it here.`,
  },
  {
    slug: '06-family',
    label: 'rfc:family',
    task: `Section: **"The DevTools contribution family"** — Q2. This is the RFC's normative core.

Primary pack: \`${RUN}/design/T2-contribution-family/proposal.md\`. Also
\`research/p1-rfc-890-frontend-contrib.md\` (contracts C1–C9), \`r3-plugin-contribution-axes.md\`,
\`m2-tanstack-grafana.md\`, \`m3-admin-consoles.md\`.

Specify, in real TypeScript: the envelope; family/major identity and negotiation; discovery; the
generated registry; host capabilities/descriptor; **ordering**; collision; quarantine; budgets; and
install/update/remove.

Non-negotiables to honor and say so:
- The **#890 dependency decision** stated as a reversible, numbered owner fork — not smuggled.
- **Ordering is net-new design** (no surveyed system solved it): host-curated anchors first, then a
  deterministic sort, with out-of-band \`order\` a generate-time error.
- **Collision is largely a non-problem** under a host-owned zone vocabulary — say why (Medusa's
  vocabulary is closed; plugin-minted zones are Strapi's model), and do not overspend on it.
- **AP-3 guard**: the envelope validates nothing about the payload; only the registered family schema
  does. **AP-24 guard**: a typed registry, never \`switch (contribution.kind)\`.
- **Drift D-6 binds you**: the installer manifest schema is \`.strict()\`, so any manifest-visible
  pointer needs an explicit **schema-evolution precondition slice**. #890's "older CLIs ignore it"
  claim is false — say so plainly and cite it.
- Quarantine rides the existing \`plugin doctor\` contributed-check path; note its binary-\`ok\`
  limitation honestly.`,
  },
  {
    slug: '07-kinds',
    label: 'rfc:kinds',
    task: `Section: **"Contribution kinds"** — Q3.

Primary pack: \`${RUN}/design/T3-contribution-kinds/proposal.md\`. Also \`research/m1-nuxt-vite.md\`
(the six dock types and their isolation postures; \`json-render\`; launcher) and
\`m2-tanstack-grafana.md\`.

Specify the **v1 set** and defend its smallness. For each retained kind: real TS payload, host
behavior, failure behavior, and its **named first-party consumer**. The charter's bar is explicit —
a kind without a real consumer is rejected or staged, and a single union covering everything is
AP-3.

Include the full evaluation table (kind → real consumer → host behavior → KEEP-v1 / STAGE / REJECT →
reason) covering pages/routes, zones/panels, inspectors, visualizers, actions/commands,
diagnostics/data sources, navigation, external deep-links, and setup/onboarding — so a reader sees
every candidate was considered, not just the survivors.

State the **read-only-by-default** posture and what would change it. Note that \`ai-tool\` is rejected
because MCP is the agent surface, citing Aspire's own 13.3 Copilot-removal precedent.`,
  },
  {
    slug: '08-data-plane',
    label: 'rfc:data',
    task: `Section: **"The data plane"** — Q6.

Primary pack: \`${RUN}/design/T5-data-plane/proposal.md\`. Also \`research/p3-rfc-1390-sdk.md\`,
\`r5-observability-boundary.md\`, \`p2-rfc-1446-runtime-automation.md\`.

Specify in real TS: the host→panel server and client context contracts; the transport decision
(same-origin oRPC + one-directional SSE; MCP composed **in-process**, read-kind only, **not** exposed
over HTTP; no WebSocket; no MessagePort) with the reason each alternative was rejected; live updates;
caching/invalidation; OTel correlation via \`netscript.correlation.id\`.

State plainly **how the confused-deputy shape is removed**: no URL-shaped input exists anywhere,
because serviceName→origin resolution happens server-side through the identity-bound endpoint
directory.

Carry the **auth sequencing dependency** honestly: \`createServiceClient\` cannot send
\`Authorization\` or \`x-api-key\` today, so credential-bearing access is blocked on the RFC-A chain
(including an **unfiled** metadata child). Present the staged panel set (principal-less v1 →
credentialed v2 → automation v3) as the mitigation. Include a "consume vs build" table, and name the
unexported \`createSSEStream\`/\`createKvWatchSSE\` promotion as a slice, not new design.`,
  },
  {
    slug: '09-trust',
    label: 'rfc:trust',
    task: `Section: **"Trust, security, and the threat model"** — Q7.

Primary pack: \`${RUN}/design/T6-trust-model/proposal.md\`. Also \`research/m3-admin-consoles.md\`,
\`m2-tanstack-grafana.md\`, \`r2-fresh-ui-pipeline.md\`, \`p1-rfc-890-frontend-contrib.md\`.

**The charter's bar is strictest here: no isolation/security/production-readiness claim without an
executable gate or a citation.** Every mitigation is labelled either *proven by <gate>* or
**UNPROVEN**, and none of these gates exists at baseline — say so.

Specify: exposure-graded trust tiers; read-only default and what escalates it; CSRF/origin; auth;
local-only default and production enablement; secrets; plugin trust; auditability.

Two invariants must be normative, each with the test that proves it:
- **Containment** — every filesystem target a contribution names must resolve strictly inside the
  project root. Cite the live primitive: \`resolveTarget\` returns
  \`isAbsolute(target) ? target : resolve(projectRoot, target)\` with **no containment assertion**.
- **Generator scoping** — cite **drift D-7**: the spawn uses bare \`--allow-read\`/\`--allow-write\`
  with no \`=<path>\`, i.e. a **whole-filesystem** grant (no \`--allow-net\`/\`--allow-env\`, so
  default-deny blocks exfiltration).

**Declines must carry their cited antecedent**, not just be omitted: sandboxing, signing,
per-contribution RBAC, capability grammars, host semver load-gates, module federation, and #890's
parked T1/T2 iframe tiers — **closed here, not inherited**, because iframe ≠ sandbox. Include the
TanStack \`install-devtools\` anti-precedent as the reason there is no generic command channel.`,
  },
  {
    slug: '10-build-dev',
    label: 'rfc:build',
    task: `Section: **"Build and development mechanics"** — Q8 and frontend surface #3.

Primary pack: \`${RUN}/design/T7-build-dev/proposal.md\`. Also \`research/r1-fresh-host.md\`,
\`r4-cli-plugin-flows.md\`, \`r3-plugin-contribution-axes.md\`, \`m1-nuxt-vite.md\`,
\`m2-tanstack-grafana.md\`.

Specify: how contributions enter the build; island registration and source maps; local-vs-JSR
resolution; the **registry transaction** (enumerate → stage in host-owned staging → \`deno check\` a
\`*.check.ts\` importing every referenced module → atomic swap or rollback; deterministic empty
emissions; byte-identical regen skips); install/update/remove **including the artifact leak fix**;
and doctor diagnostics wired to the contribution taxonomy.

Argue the transaction **from the shipped defect class** — non-transactional per-target writes, only
file *existence* asserted, two divergent generators at different paths, a regex \`AstExtractor\`,
walker registries not cleaned on remove — not from deference to #890.

Give the **dev-loop verdict** (is a watch loop required for v1?) and the **Vite-contribution verdict**
with real entry criteria if deferred, addressing ordering, trust, build determinism, resolution and
failure containment either way. A vague deferral is a plan failure.`,
  },
  {
    slug: '11-ia',
    label: 'rfc:ia',
    task: `Section: **"Information architecture"** — Q9, plus the ownership boundary (Q5).

Primary pack: \`${RUN}/design/T8-ia-and-staging/proposal.md\`. Also \`research/m4-aspire-scalar.md\`
(the boundary table and the real deep-link grammars), \`b1-dashboard-board.md\` (#400's three
acceptance lines), \`r5-observability-boundary.md\`.

Adopt **#400's three acceptance lines as normative criteria**, quoted: non-duplication (with the
"why can't this deep-link to Aspire/Scalar?" test recorded per panel), one-generator-two-callers, and
flow ≠ waterfall. Include #400's killed-surfaces list as explicit non-goals so they cannot creep back.

Give the route tree (AP-21-safe, vertical per R-FOLD-LAYERING-MODE which names dashboard pages
explicitly), the **ownership boundary table** (capability → Aspire / Scalar / DevTools, **and whether
a deep-link is actually possible** given the URL evidence), and worked first-party examples for
workers, sagas, triggers, streams, contracts/SDK, plugin registry, generated artifacts, and runtime
automation — each saying what only NetScript can show and where it links out.

The **state matrix is mandatory**: loading, empty, degraded, incompatible, unauthorized, failure for
each surface. Model the two honest degradations: \`plugins/streams\` has **no oRPC contract surface**,
so a provenance panel renders a labelled degraded state; and filtered Aspire views are **not**
externally deep-linkable (\`?filters=\` is opaque). Links build from a configurable base, never
hardcoded localhost.`,
  },
  {
    slug: '12-market',
    label: 'rfc:market',
    task: `Section: **"Prior art and market architecture study"**.

Corpus: \`${RUN}/research/m1-nuxt-vite.md\`, \`m2-tanstack-grafana.md\`, \`m3-admin-consoles.md\`,
\`m4-aspire-scalar.md\`, plus saved artifacts under \`${RUN}/research/sources/\`.

Write the comparative architecture study — **architecture, not features**. Keep the three categories
**separate**, which is the charter's requirement: developer tooling (Nuxt/Vite DevTools, TanStack,
vite-plugin-inspect), production admin consoles (Medusa, Directus, Strapi, Backstage, Grafana), and
the upstream surfaces NetScript deep-links to (Aspire Dashboard, Scalar).

Lead with the headline: **Nuxt DevTools deleted its own shell in v4** and became a dock inside Vite
DevTools, deprecating all five of its bespoke subsystems — and that ecosystem needs **Vite 8** while
NetScript pins **7.2.2**, so the conclusion is *imitate the contracts, implement natively*.

Include: a comparison table (system → mount model → contribution unit → versioning → isolation →
production behavior → ordering); the three overturned assumptions (devtools are not stripped
upstream; iframe ≠ sandboxed; \`transformIndexHtml\` silently no-ops); the **separation verdict**
(admin consoles pay for untrusted code in a long-lived RBAC-governed production-data surface — a
condition DevTools does not satisfy); and the correction that **"inspired by Medusa zones" is wrong
about Medusa** (closed core-owned vocabulary; the plugin-minted model is Strapi's).

Close with an explicit **adopt / adapt / decline** table, each row citing its source.`,
  },
]

phase('Author')

log(`Stage E: drafting ${SECTIONS.length} RFC body sections from the committed stage-D packs`)

const results = await parallel(
  SECTIONS.map((s) => () =>
    agent(
      `use harness\n\n${COMMON}\n\n## YOUR SECTION\n\n${s.task}\n\n## WRITE TO\n\n\`${OUT}/${s.slug}.md\``,
      { label: s.label, phase: 'Author', effort: 'medium' },
    )
  ),
)

const ok = results.filter(Boolean)
log(`Stage E: ${ok.length}/${SECTIONS.length} sections drafted`)

return {
  requested: SECTIONS.length,
  returned: ok.length,
  failed: SECTIONS.filter((s, i) => !results[i]).map((s) => s.slug),
  sections: SECTIONS.map((s, i) => ({ slug: s.slug, summary: results[i] ?? null })),
}
