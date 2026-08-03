use harness

# Adversarial review (eval of record) — PR #1161, the three #1120 artifacts

You are the opposite-family adversarial reviewer (lane `review_claude`: Codex · GPT-5.6 Sol ·
xhigh) for Claude-authored doctrine. You are the merge gate: the owner has directed that a green
verdict from this pass merges the PR. Be adversarial — your value is in what you refute.

**Read-only session.** Findings only. Do not fix, commit, push, edit labels, or merge. Do not run
expensive gates (no AppHost, no docker, no scaffold/E2E) — the machine is shared with live agents.
Static reads, `git log`/`git show`, targeted greps, and `gh` reads are your instruments. You MAY
post the one PR comment specified at the end, and nothing else.

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md` §"Key Concepts" for vocabulary if needed. The
sources of record for this review (read in this order, in this worktree):

1. `gh issue view 1120 --repo rickylabs/netscript` — the epic: ratified decisions D1–D3, the
   non-duplication table, the acceptance criteria. This is the bar.
2. `.llm/harness/design/milestone-orchestrator-and-canary-cadence.md` — the merged, owner-ratified
   design doc the PR claims to implement.
3. `.llm/runs/release-0.0.4--orchestration/cut-trace.md` — the empirical trace every `[observed]`
   marker must be backed by.

## Under review

The diff of PR #1161 (this worktree is checked out at its head, `aa11f0b33`; base is
`origin/main`). The three artifacts:

- `.agents/skills/agent-milestone-orchestrator/SKILL.md` (+ generated mirror under
  `.claude/skills/` — mirror must equal source)
- `.llm/harness/workflow/milestone-run.md`
- `.llm/harness/workflow/canary-cadence.md`

Also in the diff: run artifacts under `.llm/runs/feat-milestone-orchestrator-artifacts--authoring/`
(hold to honesty, not to doctrine quality), and regenerated mirrors for `aspire`/`netscript-release`
(verify they equal their `.agents/skills/` sources; the sync tool is
`.llm/tools/agentic/claude/sync-claude-skills.ts`).

## Attack surface — check each, cite evidence for every finding

1. **Duplication (the epic's stated main failure mode).** Any paragraph appearing in two of the
   three artifacts; any restatement of `netscript-release` publish mechanics, `lane-policy.md`
   routing, archetype content, or `canary-label.ts` tool internals. Ownership pointers are
   allowed; restated content is a finding.
2. **Promoted assertions.** Verify every `[observed]` marker against the cut-trace (and the design
   doc's own markers). A rule presented as earned that the trace does not support is a major
   finding. Conversely, `[asserted]` content phrased as settled rule is a finding.
3. **Dead-predicate risk.** For every gate the artifacts specify: is its negative case actually
   evidenced, and is its did-not-run state truthfully distinguishable from a pass? The 0.0.4
   precedent is two guards whose predicate could never be true. Attack the gates the same way.
4. **Mechanism drift.** Claims about `release:canary-label` behaviour must match
   `.llm/tools/release/canary-label.ts` as implemented (label derivation, note rendering,
   idempotency, empty payload, refusal on unpublished versions, the five pre-allocated check
   records, drift check). Verify against the source, not the PR's claims.
5. **#1119 collision.** Anything that deepens the release-canary vs model-rollout-canary naming
   collision.
6. **Reference integrity.** Every file path, task name, issue/PR number, and cross-reference in
   the three artifacts must exist and say what the citing text claims.
7. **Fitness for purpose.** Could a fresh orchestrator actually run a milestone from the skill +
   profile + cadence alone, without this run's chat history? Name any load-bearing gap.
8. **Acceptance mapping.** The PR's `## Acceptance evidence` comment maps #1120's boxes to
   evidence — check each mapping is truthful, including that the observational criterion is
   routed to #1163 rather than claimed.

## Output contract

1. Write `.llm/runs/feat-milestone-orchestrator-artifacts--authoring/sol-eval.md` **in this
   worktree** (do not commit it), formatted:

   ```
   VERDICT: PASS | CHANGES_REQUESTED

   ## Findings
   - [C|M|m]<n> <file>:<line> — <claim> — <evidence>
   ```

   Severity: C critical (false claim, dead gate, restated mechanics), M major (duplication,
   promoted assertion, broken reference), m minor (prose/precision). **Bar: any C or M finding →
   CHANGES_REQUESTED. Only m findings → PASS with notes. No findings → PASS.**

2. Post exactly one PR comment:
   `gh pr comment 1161 --repo rickylabs/netscript --body-file <the same content>` with the first
   line `**[PHASE: REVIEW] [VERDICT: <verdict>]**` followed by the findings. This comment is the
   verdict of record.

Your final turn message should be the verdict line plus a one-paragraph summary.
