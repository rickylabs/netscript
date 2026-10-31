# Independent IMPL-EVAL

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools, netscript-pr, jsr-audit and the docs overlay. Follow the supplied leaf profile; do not read repository profiles/ files.

You are the separate Anthropic evaluator for issue 2144. Read-only: no source or tracked-file edits, no commits, no GitHub mutations, no labels/milestones, no local scaffold.runtime. stdin is closed. Blockers only. Test execution with temporary state and no lock writes is permitted. Inspect the exact HEAD and compare it with the pushed branch before reviewing; record the full SHA. Read the run plan, plan-eval, worklog, context pack, drift, negative-controls, s1/s2 validation summaries and all slice reviews in .llm/runs/orch-divybot-6536190825--2144/.

The three slices are complete: one canonical bounded job retry executor surrounds both runtime choices; policy survives handler/config/metadata/builder and both generators; retries count additional attempts including zero; terminal job failures go to a canonical KV-default job DLQ before acknowledgment; outages requeue after releasing claims; timeout/cancel/shutdown differ as locked in plan.md; durable health includes real depth; docs cover the handler declaration and extension/replay seams. Listener-supervisor and lock files are untouched.

Review actual code, not only reported results. Independently run focused regressions using the structured wrapper with --allow-all --unstable-kv --no-lock for job-retry-policy_test.ts, job-retry_test.ts, job-dead-letters_test.ts and run-child-health-process_test.ts. The full generator suite already has 135 passing tests and four unavailable local Redis cases; Redis integrations remain enabled through the existing CI URL contract. Check the three compiled docs examples and debt entries. New documentation private-type references were fixed; the two inherited workers.contract-types.ts references remain. Both package JSR audits/dry-runs and quality:gate pass.

External merge gates stay truthful: owner forbids local scaffold.runtime and asks the coordinator to arm e2e-cli-gate in READY; Redis/full E2E and pending CI results must not be claimed proven. Earlier command-postgres runs failed on main due to an OpenTelemetry logs-export mismatch; main's subsequent #2476 correction is incorporated without local lock churn. S2 also exposed a direct-consumer context compatibility regression, corrected by a lazy canonical KV default with an omitted injection field; read compatibility-review.md and its real-KV regression. See ci-baseline.md for provenance. Inspect current CI state separately from older heads; only the coordinator may merge.

Report only concrete blocking findings in this implementation or evidence. Distinguish code approval from pending external CI gates. End with exactly one final line using the exact pushed full SHA: VERDICT: MERGE <sha> or VERDICT: CHANGES <sha>.
