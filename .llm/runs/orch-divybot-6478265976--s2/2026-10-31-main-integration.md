# Main integration and process-probe repair — 2026-10-31

Coordinator requires normal merge of origin/main4aa734e2b6ca93119462ec2e0cd34b729df51bfd into the existing branch/PR2468. Upstream workers retry/dead-letter production, runtime-registry generation and async health behavior are preserved byte-for-byte relative to main. Our test-only shared process-termination probe remains; no production runner or retry/DLQ behavior is overridden.

Only conflict files were generated agent-docs prose and MCP publish assets. Resolve by regenerating combined prose, CLI assets, publish assets and MCP export corpus from preserved sources in dependency order; never permanently choose one side's generated data. Export corpus includes the upstream workers public retry surface.

Combined focused tests after merge: **123 passed/0 failed/4 ignored**, exit0 across eleven files: prior MCP init/restart and stdio, both executor regression suites, upstream retry policy/retry/dead-letter/dispatcher, async child-health and both workers registry generators. Four pre-existing environment-conditional ignores remain; no new ignore/skip or timeout added. Five-file structured check/lint/fmt: zero findings, all five processed, no dropped paths/refusals. Canonical release preflight PASS/zero forbidden-import findings; root quality/architecture PASS. These are local source checks, not final remote readiness.

Next: source merge commit and push; clean exact-source durable carrier/publication/quality gates and retained separate native Opus5.5 High read-only review. Final run-evidence commit precedes non-draft CI scheduling. Renew READY only after every current required context is satisfied and all actual eight shards plus check-test and quality and the full CI workflow succeed at that final head. Report policy-skipped deps-report distinctly. No further push after green. Cockpit owns merge; no labels, force push, new PR, self-merge or release. Docker-dependent scaffold-runtime proof remains unproven as previously disclosed.

## Source sign-off

Clean source4ba1c3043 has all six durable receipts PASS/exit0, exact gitHead=actualGitHead. Retained separate native Opus5.5 High review PASS; full response in2026-10-31-main-integration-eval.md. Publication was still running at the review read, then passed at the identical head before final evidence commit. Review-thread gate0 unanswered. Supervisor signs off this bounded merge/test repair. Record every actual required final-head CI job externally after success so evidence publishing cannot invalidate that head.
