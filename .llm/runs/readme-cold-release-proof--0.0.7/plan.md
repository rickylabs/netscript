# Bounded final release proof: #1881

## SKILL

Use netscript-harness, netscript-tools, netscript-pr and netscript-release. This is a bounded
release-workflow correction, not a new product architecture or PLAN-EVAL cycle.

## Contract and scope

The root README published quickstart must be the first application/runtime on a fresh hosted VM.
The prior workflow ran scaffold.runtime and quickstart.walk before readme.quickstart; that cannot
establish the first-application run. Its pinned NuGet SDK download cache is legitimate and retained:
downloaded prerequisites are not generated application state, under the owner-ratified policy.

Only .github/workflows/e2e-cli-prod.yml, the existing release-canary-workflow_test.ts, and the
root README prerequisite prose change. Owner explicitly ratified this narrow correction on
2026-09-03: normal image caches are supported; Docker requirements are configuration-specific.
Run artifacts remain committed by owner policy. No framework, template, README command, release
version, credential, lock, runtime assertion, cleanup implementation or canary admission is changed.

Retain the pinned NuGet package cache; install the maintainer Deno graph, assert a read-only zero
Aspire/container/volume/custom-network baseline for this dedicated hosted scenario, then execute the unchanged README suite
before globally installing the CLI or running any other scaffold. Each baseline command fails
closed before JSON construction; nonzero application-state counts fail without deleting anything.
Record the image count only as diagnostic evidence; cached images are not a failure. Docker is
required by this PostgreSQL/container-cache scenario, not universally by NetScript or Aspire.
Upload its JSON
with the existing ordered command transcript and both durable owned-cleanup receipts.

## Gates and close boundary

2026-09-03 measured diagnostic amendment: rehearsal33760126265 passed baseline and printed
commands1–10 but users readiness failed with exit18. CLI/AppHost logs do not contain the resource
console failure. Add one read-only, two-second, 40-line users-log snapshot to its FAILED child
receipt before cleanup; preserve the exact primary exit code, no retry/restart or hidden recovery.
Test both successful and failed diagnostic capture. This extends scope only to the private README
command runner and its existing regression file. No published framework/template change.

RED: the added workflow regression must reject the old warm order. GREEN: focused release workflow
tests, selected TypeScript check/lint/fmt, YAML parsing, independent bounded review and required CI.
The exact published-version runtime remains the final canary gate, not a local static claim.
This PR only Refs #1881: close #1881 after the real cold baseline, all 12 README commands and owned
cleanup pass. Then close parent #863 and Aspire epic #1712 against their remaining release evidence.

Primary coordinator owns this implementation and merge; an independent OpenRouter GLM 5.3 Flash
max reviewer owns IMPL-EVAL. No local runtime lease is requested. Native product authors continue
their own source/gates independently. Freeze final source only after those two PRs and this proof
correction are verified and merged; no unrelated source drift between the last canary and stable.
