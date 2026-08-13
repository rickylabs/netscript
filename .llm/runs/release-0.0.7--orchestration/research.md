# Research — release 0.0.7

## Baseline snapshot

- `main`: `01e0960494c95ce56eb35892c211a095eb13e6ed`.
- GitHub milestone `0.0.7` is milestone `#27` with 61 open product issues at the initial capture.
  Issue #1564 was then admitted from `Backlog / Triage` as the 62nd committed issue because stale
  PR base SHAs can make path-native CI inspect foreign files and miss the PR's own changes.
- The intake sweep includes the target milestone, unmilestoned issues, `Backlog / Triage`, and all
  later open milestones. External scope is excluded by default unless it satisfies one admission
  predicate and is owner-ratified before freeze.
- GitHub authentication passed through `deno task agentic:gh-token check`.
- No prior `.llm/runs/release-0.0.7--orchestration/` run existed on the baseline.

## Step 0 status

Issue bodies, acceptance gates, dependency references, and existing-main evidence are being
classified. No implementation or evaluator session may dispatch until the frozen intake,
inventory, dependency DAG, and cluster state render and validate successfully.

The structural Step 0 artifacts currently validate with 62 active issues across `docs` (7),
`internals` (17), `fixes` (20), and `features` (18). The freeze remains provisional until the
independent stale/duplicate synthesis and composed PLAN-EVAL are recorded.
