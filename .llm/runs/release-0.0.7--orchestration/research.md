# Research — release 0.0.7

## Baseline snapshot

- `main`: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- GitHub milestone `0.0.7` is milestone `#27`. The frozen post-audit execution set is 60 active
  issues: docs 1, internals 16, fixes 26, features 17. The 64 inspected targets also contain one
  moved issue (#1453) and three close-fixed issues (#1306, #1564, #1606).
- #1564 was provisionally admitted, then the composed plan review forced a seven-construct re-audit.
  All live changed-file consumers use three-dot merge-base semantics, the affected code-quality
  construct was already fixed by #1403, and remaining base-`deno.json` reads are conservative
  applicability comparisons. #1564 is therefore closed-fixed, not a release barrier.
- The intake sweep includes the target milestone, unmilestoned issues, `Backlog / Triage`, and all
  later open milestones. External scope is excluded by default unless it satisfies one admission
  predicate and is owner-ratified before freeze.
- GitHub authentication passed through `deno task agentic:gh-token check`.
- No prior `.llm/runs/release-0.0.7--orchestration/` run existed on the baseline.

## Step 0 status

Issue bodies, acceptance gates, dependency references, and existing-main evidence are being
classified. No implementation or evaluator session may dispatch until the frozen intake,
inventory, dependency DAG, and cluster state render and validate successfully.

The repaired structural Step 0 artifacts cover 60 active issues across `docs` (1), `internals`
(16), `fixes` (26), and `features` (17), grouped into 43 leaves and nine topological waves. #1360
is assigned to features with its grouped scaffold leaf. The independent synthesis is retained as
historical input; PLAN-EVAL cycle 1 requested changes and one bounded re-review remains.

The inventory is baseline-bounded. Issues #1108, #1201, #1260, and #1550 were already closed before
the baseline and are intentionally not active targets. Residual Aspire documentation from #1306 is
tracked outside this release by #1642.
