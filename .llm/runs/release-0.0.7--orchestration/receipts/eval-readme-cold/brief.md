use harness

## SKILL

Use netscript-harness, netscript-tools, netscript-pr and netscript-release. Read the evaluator
protocol and the short author plan/worklog. Independent IMPL-EVAL of a two-file release workflow
correction; do not review unrelated historic run directories or change source.

## Exact scope

Evaluate commit 832e53720baf7a8d11e132d93582c48879a4628e in the isolated current worktree
007-eval-readme-cold against parent 0247471c89e381dd16e680bf0c10b6559caf36ee. Product paths:
.github/workflows/e2e-cli-prod.yml and .llm/tools/release/release-canary-workflow_test.ts only.
Author run .llm/runs/readme-cold-release-proof--0.0.7/ carries accepted scope and actual RED/GREEN.

Issue #1881 requires verbatim root README commands on a cold machine, no warm Docker images,
volumes, networks, generated project or Aspire AppHost artifacts, no manual recovery, owned
cleanup back to zero while preserving foreign resources. Previous workflow warmed it using
an Aspire NuGet cache plus two preceding runtime suites. This patch removes that cache and puts
the unchanged README suite first. Prerequisite CLI/tool and maintainer dependencies still install;
the README itself installs the exact published CLI before its first scaffold. A read-only baseline
fails closed on command failure or any nonzero apphost/container/image/volume/custom-network count,
and is uploaded alongside existing ordered command and cleanup receipts. No runtime waiver.

Review that the cold ordering is real, baseline command failures cannot be swallowed, GitHub
conditions retain mandatory published-runtime gates, and no duplicate/retry/undocumented command
is inserted into the README walk. Verify the focused workflow tests (8/0 expected) using the
structured wrapper; source check uses --file. Do not run host runtime, publish, broad suites,
write GitHub, commit or push. No credentials in output. Preserve owner-authorized harness artifacts.

GitHub scope permission currently blocks pushing this branch, not local independent evaluation.
Required CI and real exact-published-version runtime remain primary-owned gates; do not pretend
they have run. This is not a full fresh architectural review or a third old evaluation.

Write evaluate.md in the current isolated worktree with exact head, your actual model/session,
commands and results, severity-ranked findings and final PASS_IMPL or FAIL_FIX. Be concise and
concrete. Request no owner-only design decision for routine implementation judgment.
