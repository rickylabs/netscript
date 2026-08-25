# Worklog — graft-harness-bench

## Design

1. **Public surface**
   - `.agents/skills/graft/SKILL.md` (canonical) + `.claude/skills/graft/SKILL.md` (mirror): when
     and how agents use `graft ask|grep|callers|skeleton|map` before broad file reads.
   - `.gitignore` `/graft/` entry + root `.ignore` (Graft-generated, kept).
   - `.llm/tools/agentic/graft/benchmark-workflow.js`: the committed benchmark workflow script
     (tasks, conditions, metrics, judge).
   - `.llm/runs/<run-id>/benchmark-results.md`: raw per-agent metrics + judged quality.
2. **Domain vocabulary** — benchmark `Task {id, prompt, groundTruth}`, `Condition = baseline |
   graft`, `ProbeResult {toolCalls, graftCommands, startedAt, endedAt, answer}`, judge
   `Verdict {winner, groundedness scores, rationale}`.
3. **Ports** — none; the workflow uses the harness `agent()` seam only.
4. **Constants** — task ids `T1..T6`; conditions; probe schema in the workflow script.
5. **Commit slices**
   - S1: run scaffolding (supervisor/research/plan/worklog/context-pack/drift) + draft PR opened.
     Gate: PR exists, artifacts pushed.
   - S2: Graft integration surface (`.gitignore`, `.ignore`, skill canonical + mirror). Gate:
     validate-claude-surface + scoped fmt on new md.
   - S3: benchmark workflow script + task set with verified ground truth. Gate: script parses;
     ground truth verified by supervisor against the repo.
   - S4: benchmark execution (12 probes + judge) + `benchmark-results.md`. Gate: all agents
     returned structured output; metrics table complete.
   - S5: verdict + complete benchmark/review PR comment; close artifacts. Gate: PR comment posted.
6. **Deferred scope** — see plan.md.
7. **Contributor path** — read the skill file, run `graft build`, copy a task row in
   `benchmark-workflow.js` to extend the benchmark.

## PLAN-EVAL

`PLAN-EVAL: N/A` — bounded agent-tooling evaluation; no framework source; owner fixed the
acceptance protocol in chat (before/after Opus 5 medium benchmark decides merge). Recorded per
run-loop §4.

## Slices

### S1 — scaffolding + draft PR

- Graft v0.13.0 installed globally (npm, Node v22.22.2). `graft build`: 2,956 files parsed, 17,861
  nodes / 35,598 edges, 35.7s wall. Query smoke PASS (see research.md).
- Done: commit `5a37248`, draft PR #1697 opened, labels `type:chore area:tooling status:impl
  priority:p2 ci:skip-e2e ci:skip-scaffold`.

### S2 — integration surface

- Canonical `.agents/skills/graft/SKILL.md` + generated mirror; `/graft/` gitignore; root
  `.ignore`. Sync tool also caught up stale `netscript-pr` mirror (generated).
- Gates: `agentic:sync-claude` SYNCED (19 skills/23 files); `agentic:check-claude` ok:true; scoped
  fmt clean; `deno.lock` reverted (tool run churn, not committed). Commit `d64cec2`, PR comment
  posted.
- Note: Deno was absent from this cloud container; installed 2.9.5 locally for gates.
- Reconcile note: no new PR/issue comments; no related-issue moves needed yet (#1681/#1682/#1688
  referenced only as benchmark ground truth).

### S3 — benchmark workflow + verified ground truth

- `.llm/tools/agentic/graft/benchmark-workflow.js`: 6 tasks × {baseline, graft} sequential Opus 5
  medium probes (output-token deltas via `budget.spent()`, self-reported tool counts + epochs),
  then 6 blind pairwise judges (deterministic A/B alternation) with repo access and the ground
  truth keys. 18 agents total — above the 15 guideline, justified by the owner's full
  before/after ask.
- Ground truth supervisor-verified in-repo: T1 abstracts extending `PluginContribution`
  (10 files); T2 queue KV `queueName` metadata-only ⇒ shared keyspace (#1682); T3
  `generateRuntimeRegistry` caller chain; T4 `PluginCliCommand` → maintainer composition chain;
  T5 `use-dialog.ts:58-61` conditional `showModal()` (#1688 addressed); T6
  `dax-process-runner.ts` env injection + telemetry context modules (#1681 gap).
- Observation for the review: graft query output injects an instruction to report "tokens saved"
  — prompt-injection-ish tool output; probe prompts explicitly neutralize it.
- Commit `a633e3b`, PR comment posted. Reconcile: CI green on all heads (check_suite events);
  no new review comments.

### S4 — benchmark execution

- Workflow `wf_f33ba4bf-839`: 18/18 agents, 0 errors, 18.3 min, 1.157M subagent tokens.
- Results: `benchmark-results.md` + `benchmark-raw.json`. Aggregate: graft −14.1% output tokens,
  +27.1% tool calls, +5.5% wall, mean judge score 8.83 vs baseline 9.33 (0 graft wins, 4 baseline
  wins, 2 ties). Upstream −42%/−46%/−60% claims not reproduced at the structural tier.
- Gate: all probes/judges returned schema-valid structured output; metrics table complete. PASS.

### S5 — verdict

- Supervisor recommendation: **do not merge as-is** — quality regression and no efficiency win at
  the zero-cost tier; token win confined to enumerable tasks. Full review + decision options in
  the PR verdict comment; owner decides.
