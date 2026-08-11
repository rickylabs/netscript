export const meta = {
  name: 'devtools-rfc-stage-h-filing-drafts',
  description:
    'Stage-H prep: draft epic + one-file-per-issue set + per-issue agent briefs + a one-shot filing manifest — DRAFT TEXT ONLY, zero board mutation',
  phases: [{ title: 'Draft' }],
}

const RUN = '.llm/runs/plan-devtools-contribution--seed'
const RFC = 'docs/architecture/rfc/rfc-0002-devtools-contribution.md'

const COMMON = `
You are drafting **GitHub board text** for the NetScript DevTools RFC seed run
(worktree \`/home/codex/repos/ns-rfc-devtools-contribution\`, baseline \`main\` @ \`2256a67bf\`,
draft PR #1450).

## SKILL
- \`netscript-pr\` — **read it fully.** It is the canonical GitHub process: branch naming, PR body
  shape, the closing-keyword law, the epic/sub-issue standard, the namespaced colon label taxonomy,
  and milestone rules. Your output must conform to it.
- \`netscript-harness\` — seed-run stage-D/H contracts.
- \`netscript-doctrine\` — any archetype/gate claim must match doctrine.

## ABSOLUTE BOUNDARY — read twice
**DRAFT TEXT ONLY. ZERO GITHUB MUTATION.** Do not create, edit, close, retitle, re-milestone,
label, or comment on any issue or PR. \`gh\` is **READS only** (\`gh issue view\`, \`gh issue list\`,
\`gh pr view\`, \`gh api\` GET). Nothing is filed until the owner ratifies. **Every file you write
starts with an H1 followed by the line:**
\`> **DRAFT — not filed. No GitHub mutation has occurred.**\`

Also: **read-only on source.** Never edit \`packages/\`, \`plugins/\`, \`apps/\`, \`docs/\`.
**Do not run commands that rewrite \`deno.lock\`.**

## REQUIRED READING
1. \`${RFC}\` — §13 (packages/archetypes/gates), **§14 (the 15-slice roadmap: W0-a … W6-b)**, §15 (owner forks).
2. \`${RUN}/plan.md\` — locked decisions L1–L14, the rework audit, the risk register.
3. \`${RUN}/design/T9-supersession/supersession-map.md\` — dispositions for #400 and children.
4. \`${RUN}/decision-brief.md\` — what is still owner-gated.

## Non-negotiable process rules (from \`netscript-pr\`)
- **Never** put a closing keyword (\`Closes\`/\`Fixes\`/\`Resolves\`) in an **issue** body, and **never**
  on an epic/umbrella. Sub-issues carry \`Part of #<epic>\` instead.
- Every issue carries at least one \`type:\` and one \`area:\` label, **exactly one** \`status:\`, a
  \`priority:\`, and a milestone.
- Labels must already exist in \`.github/labels.yml\` — **verify before using one.** If a label you
  want does not exist, say so explicitly rather than inventing it; creating labels is a board
  mutation the owner has not authorized.
- Acceptance criteria go under an **\`## Acceptance\`** heading, because that is what the close-gate
  reads. Anything not meant to gate merge must NOT live there.

## Milestone rule for this run
Do **not** invent a milestone. Per the supersession map and drift D-8, the dashboard children sit on
an **owner-ratified train**; new DevTools issues default to the same milestone as the epic unless the
map says otherwise. If you are unsure, write \`MILESTONE: OWNER-DECISION\` and say why.

Return ≤200 words: what you produced, any label/milestone you could not verify, and any conflict you
found with live board state.
`

const TASKS = [
  {
    slug: 'epic',
    label: 'draft:epic',
    task: `Write the **epic** draft to \`${RUN}/filing/epic.md\`.

Title: \`Epic: DevTools contribution architecture\`. Labels: \`type:umbrella\` + an \`epic:\` slug +
\`area:\` set + \`priority:\` + milestone. **No closing keyword anywhere.**

Body must contain: the one-paragraph thesis; the **three normative acceptance lines** inherited from
#400 (non-duplication with the deep-link test, one-generator-two-callers, flow ≠ waterfall); the
sub-issue checklist (one line per slice W0-a…W6-b, to be filled with live numbers at filing);
the wave structure; the explicit **dependency notes** (F-1 and F-3 block W1/W2; RFC-A chain blocks
credentialed access; #1446 A2b/A3b/A2d block automation reads); and a **Relationship to existing
boards** section stating that #922's children are untouched and #400 is reconciled per the
supersession map.

Also state plainly, in the body, that the GLM design pass is outstanding (drift D-10) and that the
epic must not be filed before the owner rules on it.`,
  },
  {
    slug: 'issues-w0-w2',
    label: 'draft:issues-w0-w2',
    task: `Write **one file per issue** for slices **W0-a, W0-b, W1-a, W1-b, W1-c, W1-d, W2-a, W2-b**
into \`${RUN}/filing/issues/\` (e.g. \`W1-a-contracts-unit.md\`).

Each file: title \`[devtools W1-a] <slice>\`; the label/milestone block; \`Part of #<epic>\` (literal
placeholder); **Context** (2–4 sentences, citing the RFC section); **Scope** (files/roots from RFC
§14, verbatim); **Out of scope**; **\`## Acceptance\`** with checkboxes that are *mechanically
checkable* and name the proving command from §14; and **Dependencies**.

W0-a/W0-b are **disposable probes** — say so, and make their acceptance "the question is answered and
recorded in \`drift.md\`", not "the code ships". W1-d is **blocked on owner fork F-3** — mark it
\`status:triage\` and say which decision unblocks it.`,
  },
  {
    slug: 'issues-w3-w6',
    label: 'draft:issues-w3-w6',
    task: `Write **one file per issue** for slices **W3-a, W3-b, W4-a, W4-b, W5-a, W5-b, W6-a, W6-b**
into \`${RUN}/filing/issues/\`, same shape as the W0–W2 set (coordinate on format; do not restate the
epic).

Specifics to honor: **W3-b** is the dual production-exclusion e2e — its acceptance must assert *both*
mechanisms independently. **W5-b** promotes the shipped-but-unexported \`createSSEStream\` /
\`createKvWatchSSE\` and therefore changes a **public export map**, so it needs the consumer gate.
**W6-b** must assert the **degraded** contract-provenance state for \`plugins/streams\`, which has no
oRPC contract surface — that is a required state, not a bug.`,
  },
  {
    slug: 'agent-briefs',
    label: 'draft:agent-briefs',
    task: `Write **per-wave implementation agent briefs** to \`${RUN}/filing/briefs/\` — one per wave
(\`W0.md\`, \`W1.md\`, \`W2.md\`, \`W3.md\`, \`W4.md\`, \`W5.md\`, \`W6.md\`).

Every brief **must** begin with \`use harness\` and carry a \`## SKILL\` chapter naming the skills
that wave needs (\`netscript-harness\` always; plus \`netscript-doctrine\`, \`netscript-cli\`,
\`deno-fresh\`, \`fresh-ui-horizontal\`, \`netscript-deno-toolchain\`, \`aspire\` as applicable) —
this is a lane-policy requirement for every dispatched brief.

Each brief states: the wave's slices; the files each touches; the proving gate per slice; the
**hard dependencies** (including which owner forks must be resolved first); what the agent must
**not** do; and the definition of done. Point the agent at **GitHub and the RFC section**, not at
this run's chat history — an implementation lane must be launchable without reverse-engineering the
planning run.`,
  },
  {
    slug: 'filing-manifest',
    label: 'draft:manifest',
    task: `Write the **one-shot filing manifest** to \`${RUN}/filing/filing-manifest.md\`.

It is the executable-by-a-human ordered plan for filing *after* ratification. Sections:

1. **Preconditions** — PLAN-EVAL \`PASS\`, owner ratification of the §15 forks, and a decision on the
   outstanding GLM pass (drift D-10). State that filing must not begin while any is unmet.
2. **Label verification** — the exact labels used, each checked against \`.github/labels.yml\`.
   Report any that do **not** exist as a blocker, not as a to-create item.
3. **Milestone verification** — verify live; create nothing. Title-match is exact.
4. **Filing order** — epic first, then sub-issues in dependency order, each with \`Part of #<epic>\`.
5. **Reconciliation** — apply the supersession map's dispositions; **default to zero filing-time
   closes**; #922's children explicitly untouched.
6. **\`FILING-LOG.md\` template** — draft-ID → live issue number, to be committed after filing.

Run a **live-board dedup check** (\`gh\` reads only) for every proposed issue and record the result
per row: is there an existing issue that already covers this? Cite the number if so.`,
  },
]

phase('Draft')
log(`Stage-H prep: ${TASKS.length} draft producers — zero board mutation`)

const results = await parallel(
  TASKS.map((t) => () =>
    agent(`use harness\n\n${COMMON}\n\n## YOUR TASK\n\n${t.task}`, {
      label: t.label,
      phase: 'Draft',
      effort: 'medium',
    })
  ),
)

return {
  requested: TASKS.length,
  returned: results.filter(Boolean).length,
  failed: TASKS.filter((t, i) => !results[i]).map((t) => t.slug),
  summaries: TASKS.map((t, i) => ({ slug: t.slug, summary: results[i] ?? null })),
}
