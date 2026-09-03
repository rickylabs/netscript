use harness

# SKILL

Read and follow these repository instructions before acting:

- `.agents/skills/agent-milestone-orchestrator/SKILL.md`
- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.llm/harness/workflow/milestone-run.md`
- `.llm/harness/workflow/lane-policy.md`

# Role

You are a high-value Step 0 synthesis workflow for the 0.0.7 milestone coordinator. Use Claude
workflows/Ultracode only where it materially improves cross-issue classification. You are not an
implementer or evaluator, and you must not self-certify the eventual milestone plan.

# Immutable context

- Repository: `rickylabs/netscript`
- Worktree: `/home/codex/repos/netscript-547-lffix`
- Branch: `chore/release-0.0.7-orchestration`
- Baseline main SHA: `01e0960494c95ce56eb35892c211a095eb13e6ed`
- Target: GitHub milestone `0.0.7`, numeric id `27`, 61 open issues at capture.
- Coordinator PR: `#1641` (evidence-only draft; do not edit it).

# Objective

Independently audit the live 0.0.7 issue bodies and baseline repository to produce a compact,
evidence-linked recommendation for:

1. each target issue's disposition (`active`, `move`, `close-fixed`, `close-duplicate`, or
   `close-superseded`);
2. exactly one topic lane (`docs`, `internals`, `fixes`, `features`) for every active issue;
3. dependency edges using only `requires`, `rfc-prerequisite`, or `cross-epic-order`;
4. coherent implementation leaf groupings and topological waves;
5. any unmilestoned, Backlog, or later-milestone issue that is truly `release-critical`,
   `dependency-required`, or `high-value-coherent` enough to propose for owner admission;
6. false-positive/stale issues that appear already fixed on the baseline, with a concrete file,
   test, merged PR, or commit as proof.

Treat issue labels and prose as hypotheses. Check acceptance boxes, related-issue references,
existing code/tests, and merged history. Prefer exclusion over scope creep for external issues. Do
not reduce scope merely because it is large: recommend moving a target issue only for a specific
coherence/dependency/release-boundary reason.

# Authority and prohibitions

- Read-only for product code, configuration, GitHub issues/PRs/labels/milestones, git branches,
  worktrees, Docker, Aspire, and processes.
- Do not launch Codex, OpenHands, another Claude implementation session, tests, containers, or
  Aspire.
- Do not commit, push, open/update PRs, or mutate GitHub.
- The only permitted writes are the two output artifacts below. Do not touch other run files.
- Do not claim owner ratification; clearly mark proposed moves/admissions that require it.

# Output

Write:

- `.llm/runs/release-0.0.7--orchestration/step0-synthesis.md` — concise human decision record with
  evidence and explicit uncertainties.
- `.llm/runs/release-0.0.7--orchestration/step0-synthesis.json` — machine-readable object with
  arrays `targetIssues`, `externalCandidates`, `edges`, `waves`, and `leafGroups`. Every target
  issue number must occur exactly once. Every non-active target disposition needs `reason` and a
  non-empty `evidence` array. Every edge needs `from`, `to`, `kind`, and `evidence`.

Finish by printing a one-paragraph summary including counts by disposition/lane and the exact two
paths written. Missing evidence must be surfaced as uncertainty, never fabricated.
