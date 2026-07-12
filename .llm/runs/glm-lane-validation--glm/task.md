You are GLM 5.2 running as a bounded validation agent in the NetScript repo worktree
/home/codex/repos/ns-fix-agentic-lanes on branch glm/lane-validation (based on main after the
OpenRouter lane-repair merge, PR #696). Your job is a small self-contained test-and-fix pass —
touch NOTHING outside the two paths named below.

1. TEST: run these and capture their outcomes:
   - deno task agentic:provider-canary --all --worktree /home/codex/repos/ns-fix-agentic-lanes
   - deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/agentic --ext ts
2. FIX (docs only): read .llm/tools/agentic/README.md and fix anything now stale or missing
   after the lane repair: the OpenRouter preset table (claude-design-glm-5-2 preset; the
   codex-design-glm-5-2 lane being structurally unsupported for agentic turns —
   codex-native-namespace-tool incompatibility; the static-by-default + --live canary modes;
   the claude-print bounded print-mode lane). Keep edits minimal and factual; match the
   file's existing style. If the README is already accurate, say so and change nothing.
3. REPORT: write .llm/runs/glm-lane-validation--glm/report.md — what you ran, raw outcomes
   (exit codes, canary status line), what you changed in the README and why (or why nothing),
   and one paragraph honestly assessing your own experience running as an agent through this
   lane (tool reliability, anything awkward).
4. Commit your changes on branch glm/lane-validation with message
   "chore(agentic): GLM lane-validation pass — canary/check evidence + README refresh" and
   push the branch to origin. Do not open a PR. Do not touch packages/, plugins/, or any
   other path.
