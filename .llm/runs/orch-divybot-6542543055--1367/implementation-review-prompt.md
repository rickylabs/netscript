Independent IMPL-EVAL / slice supervisor review for #1367, PR #2520. Same reviewer session as plan;
read-only, blockers only; never edit, mutate Git/GitHub, launch agents or run full scaffold.runtime.
Review the current working diff from baseline 851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2, including
untracked source tests, and run artifacts at .llm/runs/orch-divybot-6542543055--1367/.
Verify actual generated AppHost provisioning, preserved ephemeral default, contribution option,
real producer write/restart proof, meaningful negatives, declared scope and inherited debt/doc-lint.
Local focused generated-project proof executed green/red/green; full E2E is intentionally CI-only
pending coordinator e2e-cli-gate, not claimed green or merge-ready. Evaluate implementation blockers
before making the PR ready so CI can run. This is not approval to merge, tag or release.
You may run focused read-only validation, but do not mutate files or start resources. If there are
blockers identify exact code and remedy; else report no blockers. This precommit slice evaluation
must end VERDICT: PASS or VERDICT: FAIL_FIX. A final exact pushed-head review follows after ready.

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools and netscript-pr, plus the assigned
leaf profile already supplied by dispatcher (do not read profiles/). Owner model/effort override is
recorded in supervisor.md. Independent reviewer must not self-certify implementation.
