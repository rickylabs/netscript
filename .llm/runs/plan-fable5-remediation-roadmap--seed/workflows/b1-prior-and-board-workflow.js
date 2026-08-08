export const meta = {
  name: 'b1-prior-and-board',
  description: 'Stage B corpus: prior agent-wave evidence + live GitHub board audit (read-only)',
  phases: [
    { title: 'Waves', detail: 'read agent-posts archive + waves 3-6' },
    { title: 'Board', detail: 'read-only live GitHub issue/milestone/PR audit' },
  ],
}

const RUN = '/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed'
const POSTS = '/mnt/g/My Drive/DEV/Devocracy/Vault/Devocracy/website/blog/Netscript/agent-posts'

const COMMON = `You are an Opus research contributor in a planning-only NetScript seed run
(run dir ${RUN}). HARD RULES:
- READ-ONLY everywhere except your single assigned output file. Never edit repo source, never
  create/edit/label/close GitHub issues, milestones, or comments. GitHub reads only.
- Every load-bearing claim carries a citation: file path (+ line where useful), issue/PR number,
  or URL. Uncited claims are worthless to this run.
- Current GitHub state WINS over any carried-in report; note conflicts explicitly.
- Write your full findings as well-structured Markdown to your assigned output file (create parent
  dirs). Then RETURN ONLY: the output file path + a <=20-line abstract of your most important
  findings. Do not return the full document.
- Be concrete and dense; no praise, no filler. Distinguish facts from hypotheses.`

phase('Waves')

const waveJobs = [
  {
    label: 'waves:early',
    out: `${RUN}/fable-5-remediation-plan/research/prior-waves-early.md`,
    prompt: `Read ALL files in "${POSTS}/archive/" and "${POSTS}/wave-3/". These are the earliest
NetScript agent-experiment briefs/plans (waves 1-3 era). Extract: (1) what each wave tried to
prove, (2) framework gaps/defects found, with whether they look fixed/stale today, (3) harness/
supervision lessons, (4) recurring adoption failures by agents. Cite file names/sections.`,
  },
  {
    label: 'waves:wave4',
    out: `${RUN}/fable-5-remediation-plan/research/wave-4.md`,
    prompt: `Read ALL .md files in "${POSTS}/wave-4/". Focus hard on docs-investigation-REPORT.md
and docs-audit-gemini-REPORT.md plus the per-model run reports (01/02/03/03b). Extract framework +
docs + scaffold findings, per-model behavior differences, and which findings were docs/discovery
failures vs real defects. Cite files/sections.`,
  },
  {
    label: 'waves:wave5-6-plans',
    out: `${RUN}/fable-5-remediation-plan/research/wave-5-6-plans.md`,
    prompt: `Read ALL .md files directly in "${POSTS}/wave-5/", "${POSTS}/wave-6/" (top level), and
"${POSTS}/wave-6/projects/". Extract: the Wave-5/6 harness design (plan templates, rubric,
capability map, measured smoke method), the project catalog (billing-run, review-desk,
workflow-builder, planning-board, etc.) and what each project is meant to prove, the milestone-
orchestrator handover method, prior-runs caveat matrix, and supervision methods (Opus 5 / Kimi K3 /
loopback). Cite files/sections.`,
  },
  {
    label: 'waves:wave6-runs',
    out: `${RUN}/fable-5-remediation-plan/research/wave-6-runs.md`,
    prompt: `Read ALL .md files under "${POSTS}/wave-6/runs/" (review-desk-gemini-3.6-flash-high,
workflow-builder-kimi-k3-max, billing-run-grok-4.5-high-canary.16 — skip .jsonl/.png/.sha256).
Extract per-run: agent identity, product built, GO/NO-GO + scores, framework defects found (with
canary version), adoption failures (what NetScript surface the agent ignored or misused),
supervision interventions, and gap-audit rows. Build a cross-run recurrence table: which findings
appear in >=2 independent runs. Cite files/sections.`,
  },
]

const waveResults = await parallel(waveJobs.map(j => () =>
  agent(`${COMMON}\n\nOUTPUT FILE: ${j.out}\n\nTASK:\n${j.prompt}`, {
    label: j.label, phase: 'Waves', model: 'opus',
  })))

phase('Board')

const boardCommon = `${COMMON}\n\nFor GitHub reads: use ToolSearch to load GitHub MCP tools
(mcp__github__list_issues, mcp__github__search_issues, mcp__github__get_issue,
mcp__github__list_pull_requests, mcp__github__get_file_contents, mcp__github__list_commits) and
page through results. Repo: rickylabs/netscript. NEVER call any mutating GitHub tool.
Local git in /home/codex/repos/netscript-fable5-remediation-plan may be used read-only (prefix
"rtk"). Today is 2026-08-08.`

const boardJobs = [
  {
    label: 'board:open',
    out: `${RUN}/fable-5-remediation-plan/research/github-board-open.md`,
    prompt: `Snapshot the ENTIRE open board of rickylabs/netscript (~265 open issues, 11 open
milestones). Produce: (1) a per-milestone table (milestone title -> open issue numbers + titles,
epic/umbrella issues flagged, labels condensed); (2) a "no milestone / Backlog-Triage" table; (3)
detailed body summaries (contract, acceptance, dependencies) for these key issues named by the
pre-plan: 1333, 1335, 1210, 1208, 1260, 1245, 1249, 1278, 1276, 1325, 1326, 1327, 1328, 1329,
1332, 1343, 979, 1280, 922, 928, 934, 942, 946, 1093, 884, 885, 1090, 1102, 1197, 1201, 1184; (4)
note every open epic (type:umbrella / epic:* label) with its children. Be exhaustive on (1)-(2) —
this is THE dedup ground truth for a roadmap; missing issues cause duplicate filings later.`,
  },
  {
    label: 'board:history',
    out: `${RUN}/fable-5-remediation-plan/research/github-board-history.md`,
    prompt: `Audit the 0.0.5 release-train history of rickylabs/netscript: (1) the 0.0.5 milestone
(open+closed issues; what shipped vs slipped); (2) recently closed issues relevant to the
remediation topics (auth/SDK/scaffold/streams/sagas/workers/triggers/docs/MCP: e.g. 1065, 1184,
1190, 1325-1332, 1340-1346 PR train) — what exactly landed and in which canary; (3) how the
milestone-orchestrator grouped PRs into waves for 0.0.5 (inspect recent merged PRs, their bodies/
labels/linked issues, canary cadence 0.0.5-canary.x); (4) which prior milestones were shifted/
renamed historically, to learn the house pattern for milestone moves. Cite issue/PR numbers.`,
  },
  {
    label: 'board:conventions',
    out: `${RUN}/fable-5-remediation-plan/research/github-conventions.md`,
    prompt: `Document the exact live board conventions of rickylabs/netscript: (1) full milestone
list with numbers, titles, descriptions, due dates, open/closed counts (GitHub API via MCP); (2)
the label set from .github/labels.yml in the local worktree AND any live labels not in the file;
(3) issue-form templates in .github/ISSUE_TEMPLATE/ (fields, auto-labels); (4) the house issue
body shape by sampling 5 well-formed recent issues (e.g. 1325-1335 range): heading structure,
acceptance/gate checkbox conventions, "Part of #" epic linkage, wave labels; (5) RFC process from
rfcs/README.md + one existing RFC. This is the template ground truth for drafting new issues.`,
  },
]

const boardResults = await parallel(boardJobs.map(j => () =>
  agent(`${boardCommon}\n\nOUTPUT FILE: ${j.out}\n\nTASK:\n${j.prompt}`, {
    label: j.label, phase: 'Board', model: 'opus',
  })))

return {
  waves: waveResults.filter(Boolean),
  board: boardResults.filter(Boolean),
}
