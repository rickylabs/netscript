export const meta = {
  name: 'beta5-xref-reconciliation',
  description: 'Cross-reference beta.5 milestone issues/epics against seed-run design docs',
  phases: [
    { title: 'Audit', detail: 'one Sonnet-5-high agent per issue/epic', model: 'sonnet' },
    { title: 'Synthesize', detail: 'reconciliation map + lane order', model: 'sonnet' },
  ],
}

// Owner law (ROUTING-ADJUSTMENTS.md): never route stages to Fable 5. All agents: sonnet, high.
const REPO = 'C:/Dev/repos/netscript-framework'
const SEED = '.llm/runs/plan-roadmap-expansion--seed'

const ITEMS = [
  { n: 402, hint: 'telemetry T1 — design/B-telemetry/' },
  { n: 403, hint: 'telemetry T2 — design/B-telemetry/' },
  { n: 219, hint: 'AI-stack anchor — design/F-ai/' },
  { n: 479, hint: 'AI reference docs — design/F-ai/ + CD-docs' },
  { n: 303, hint: 'S2 enterprise maturation chore — road-to-stable #301 family' },
  { n: 305, hint: 'S4 doctrine revamp — road-to-stable' },
  { n: 306, hint: 'S5 harness+skills revamp — road-to-stable; harness V3 shipped recently' },
  { n: 307, hint: 'S6 stale-code elimination — road-to-stable' },
  { n: 389, hint: 'harness V3 umbrella — LIKELY DONE (V3 rollout finalized on main); check closeable' },
  { n: 327, hint: 'deployment epic' },
  { n: 345, hint: 'Deploy-S9 bare-metal hardening' },
  { n: 346, hint: 'Deploy-S10 k8s/azure/docker providers' },
  { n: 347, hint: 'Deploy-S11 CI/CD templates' },
  { n: 348, hint: 'Deploy-S12 one-click convergence' },
  { n: 399, hint: 'telemetry-revamp epic (check milestone assignment)' },
  { n: 301, hint: 'road-to-stable umbrella epic (check state vs S-slices)' },
  { n: 238, hint: 'ai-stack epic (check state, relation to #219/#479)' },
]

const AUDIT_SCHEMA = {
  type: 'object',
  required: ['issue', 'state', 'is_epic', 'body_current', 'milestone_right', 'deps_correct',
    'closeable', 'governing_docs', 'required_edits', 'implementation_readiness', 'notes'],
  properties: {
    issue: { type: 'number' },
    state: { type: 'string', description: 'open/closed + milestone as found live' },
    is_epic: { type: 'boolean' },
    body_current: { type: 'boolean', description: 'does live body match seed-run design of record' },
    milestone_right: { type: 'boolean' },
    deps_correct: { type: 'boolean', description: 'are blocking/blocked-by refs in body accurate vs design docs + live state' },
    closeable: { type: 'boolean', description: 'true if already satisfied by merged work — cite evidence' },
    governing_docs: { type: 'array', items: { type: 'string' }, description: 'repo-relative paths of design docs of record' },
    required_edits: { type: 'array', items: { type: 'string' }, description: 'concrete edits: body sections to update, milestone/label changes, comments to post. Empty if none.' },
    implementation_readiness: { type: 'string', description: 'ready | needs-body-fix | needs-decision | not-beta5' },
    notes: { type: 'string', description: 'scope summary, acceptance criteria location, recommended lane, evidence for closeable verdicts (commit SHAs, merged PR numbers)' },
  },
}

phase('Audit')
const audits = await parallel(ITEMS.map((it) => () =>
  agent(
    `use harness
## SKILL
netscript-harness, netscript-pr, netscript-doctrine, rtk — repo skills live under .agents/skills/.

You are a READ-ONLY auditor for rickylabs/netscript issue #${it.n} (${it.hint}).
Working dir: ${REPO}. NEVER edit issues, labels, or files — report only.

1. Fetch the live issue: ssh codex-wsl 'bash -lc "cd /tmp && gh issue view ${it.n} --repo rickylabs/netscript --json number,title,state,body,milestone,labels"'
   (gh works ONLY via that exact ssh+bash -lc form.)
2. Find its design-of-record in ${SEED}: grep for "#${it.n}" and related slice-IDs across
   ${SEED}/design/**, ${SEED}/analysis/**, ${SEED}/matrix/**, ${SEED}/plan.md,
   ${SEED}/FILING-LOG.md, ${SEED}/SUPERSESSION-MAP.md. Read the matched proposal.md /
   epic-and-issues.md / agent-briefs.md sections. NOTE: epic-and-issues.md files carry a
   "MILESTONE AUTHORITY" banner — GitHub milestones win where docs disagree.
3. Check whether merged main already satisfies it: rtk git log --oneline -40 and targeted greps.
   For #389 specifically, check whether harness V3 rollout commits (e.g. "finalize V3 rollout")
   complete the umbrella's checklist.
4. Verify dependency references in the body against live issue states (gh issue view the refs).
5. Return the structured verdict. In notes, include: one-paragraph scope, where acceptance
   criteria live, recommended implementation lane per ROUTING-ADJUSTMENTS.md (Opus-high for
   UI/complex/docs, WSL Codex high for source slices), and evidence SHAs/PRs for any closeable=true.`,
    { label: `audit:#${it.n}`, phase: 'Audit', schema: AUDIT_SCHEMA, model: 'sonnet', effort: 'high' },
  )
))

const found = audits.filter(Boolean)
log(`${found.length}/${ITEMS.length} audits returned`)

phase('Synthesize')
const map = await agent(
  `use harness
You are synthesizing a reconciliation map for the beta.5 implementation supervisor of
rickylabs/netscript (working dir ${REPO}). Input: per-issue audit JSON below.

Produce a markdown document with:
1. A summary table: issue | state | body_current | milestone_right | closeable | readiness | lane.
2. Per-issue sections listing required_edits verbatim (these will be applied by the supervisor
   via gh), governing docs, and evidence for any closeable verdict.
3. A recommended lane order for the run: chores wave first (#303/#305/#306/#307/#389-remnants),
   then features (T1 #402 → T2 #403 critical path; #219 AI; #345-348 deploy; #479 docs), flagging
   anything the audits say is not-beta5 or needs-decision (those become owner-batch items, not
   blockers).
4. A "conflicts & risks" section: disagreements between docs and GitHub (GitHub milestones win),
   missing deps, stale bodies.
Return ONLY the markdown document.

AUDITS:
${JSON.stringify(found, null, 2)}`,
  { label: 'synthesize:map', phase: 'Synthesize', model: 'sonnet', effort: 'high' },
)

return { map, audits: found }
