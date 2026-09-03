# Bounded final release proof: #1881

## SKILL

Use netscript-harness, netscript-tools, netscript-pr and netscript-release. This is a bounded
release-workflow correction, not a new product architecture or PLAN-EVAL cycle.

## Contract and scope

The root README published quickstart must be the first application/runtime on a fresh hosted VM.
The prior workflow restored the Aspire NuGet cache and ran scaffold.runtime and quickstart.walk
before readme.quickstart; that cannot establish #1881's cold-machine acceptance.

Only .github/workflows/e2e-cli-prod.yml and the existing release-canary-workflow_test.ts change.
Run artifacts remain committed by owner policy. No framework, template, README command, release
version, credential, lock, runtime assertion, cleanup implementation or canary admission is changed.

Remove the warm AppHost cache restore; install the maintainer Deno graph, assert a read-only zero
Aspire/container/image/volume/custom-network baseline, then execute the unchanged README suite
before globally installing the CLI or running any other scaffold. Each baseline command fails
closed before JSON construction; nonzero counts fail without deleting anything. Upload its JSON
with the existing ordered command transcript and both durable owned-cleanup receipts.

## Gates and close boundary

RED: the added workflow regression must reject the old warm order. GREEN: focused release workflow
tests, selected TypeScript check/lint/fmt, YAML parsing, independent bounded review and required CI.
The exact published-version runtime remains the final canary gate, not a local static claim.
This PR only Refs #1881: close #1881 after the real cold baseline, all 12 README commands and owned
cleanup pass. Then close parent #863 and Aspire epic #1712 against their remaining release evidence.

Primary coordinator owns this implementation and merge; an independent OpenRouter GLM 5.3 Flash
max reviewer owns IMPL-EVAL. No local runtime lease is requested. Native product authors continue
their own source/gates independently. Freeze final source only after those two PRs and this proof
correction are verified and merged; no unrelated source drift between the last canary and stable.
