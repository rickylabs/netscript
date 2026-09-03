use harness

## SKILL

Use netscript-harness, netscript-tools, netscript-pr and netscript-release. Resume your existing
independent session0039d1ad-72eb-4047-964c-8b326ff65902 for a bounded delta review only.

## Owner ruling supersedes the original cache clause

Owner explicitly rejected the blanket no-image-cache requirement: normal Docker image caches are
supported, and Docker is required only by configurations using container resources. NetScript and
Aspire can use non-container resources without Docker. Issue1881 was rewritten in place accordingly.
Do not reevaluate or reopen this accepted policy. Fresh application/project state, no manual
recovery, unchanged README commands and exact owned cleanup still apply.

## Review scope

Current checkout4092014cfbf02f208dd16e320b35734d7b6b92f6, prior evaluated832e53720.
Only new source changes: e2e-cli-prod.yml changes its jq predicate to the four application-state
fields while preserving image count as diagnostic; existing release-canary-workflow_test.ts tests
that policy; root README prerequisite prose now distinguishes its PostgreSQL/container-cache
walkthrough from universal framework requirements. Author plan/worklog records this ruling.
No new daemon or Docker setup, no image prune, no resource deletion, no version change.

Inspect only this delta and its immediate integration. Re-run the8 focused workflow tests plus
selected check/format as useful. Use structured wrappers and --file. Do not rerun broad suites,
host runtime, Docker/Aspire lifecycle, PLAN-EVAL, publication, or quota probes. Required CI and
hosted rehearsal remain coordinator-owned, not your verdict. No GitHub writes, commit or push.

Write a NEW .llm/runs/readme-cold-release-proof--0.0.7/evaluate-cache-delta.md, preserve your
original evaluate.md. Give exact head/session/model, actual results, findings and PASS_IMPL or
FAIL_FIX. Scope judgment to correctness under the owner-ratified contract, not an empty-image rule.
Keep this proportional review brief; do not reread unrelated run history or duplicate the old audit.
