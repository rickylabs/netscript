use harness
## SKILL
netscript-harness, netscript-tools. Read-only same-session independent S3 slice review,
Claude Opus high, blockers only. No edits/mutations/full E2E/agents. Review current diff after
048856c7e7ca3ec3a364d11dc613b912837071b1. CI static gate failed solely because the
package-backed-plugin-doctor-fixture.ts expected the old 'is non-empty' check title; this task
changed it to 'is initialized'. Diff updates that exact expectation, retaining healthy status,
registry-content, registration, permissions and forbidden-diagnostic assertions.
Actual package-backed fixture rerun now prints PACKAGE_BACKED_PLUGIN_DOCTOR_PASS, exit 0.
Structured check/lint/fmt of the changed fixture and quality:gate pass. No runtime code changed.
Classify the old title assertion as stale if appropriate, then review that the fix preserves all
behavioral gate obligations. End VERDICT: PASS or VERDICT: CHANGES. Exact pushed-head review
will follow the commit. This is a bounded CI-fix review, not a new plan decision.
