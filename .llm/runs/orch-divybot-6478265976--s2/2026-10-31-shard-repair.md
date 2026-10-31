# Coordinator repair — complete required CI

Prior READY at5e51beb38 is superseded. CI run41153807515's quality job passed but test-2 and test-5 failed, so required check-test failed. Both failures are branch regressions, not established main flakes. Downloaded atomic receipts/test reports are retained privately rather than publishing machine paths or huge logs.

## Failures and repair

- Test-2:1429 passed/1 failed/6 ignored; S-18 prior-release host/restart test in init-agent_test.ts expects22 MCP tools while the actual S2 catalog has26.
- Test-5:1625 passed/1 failed/3 ignored; actual CLI stdio smoke has the same obsolete22 count.
- Focused before-control: **30 passed/2 failed/0 ignored**, exit1, reproducing exactly both26-versus22 assertions.
- Replaced the obsolete cardinality-only assertions with exact name/order comparison against the public @netscript/mcp TOOL_NAMES contract. Prior-release fixture, generated pinned host specifier, restart behavior, OpenAPI triad and existing diagnostics/docs/export/denial assertions are unchanged.
- The stdio smoke now invokes list/search/view/add-command registry methods through the real CLI protocol. It checks bounded listing, a named search hit, exact copied cn.ts bytes and structured installation argv; all4 responses must be non-errors.
- Focused after-control: **32/0/0**, exit0. Structured check/lint/format process both files with zero findings/drops/refusals. Canonical release:preflight and root quality:gate pass. No production source, fixtures, task flags, timeouts, skips, shard assignment, manifests, locks or versions changed.

## Completion gate

This local source checkpoint is provisional until the retained separate exact native Opus reviewer signs off and EVERY required CI check is satisfied at the final pushed head. Verify the current non-draft run's actual shard jobs, quality and check-test aggregator all finish SUCCESS. A prior same-head draft-run SKIPPED check-test cannot certify the active test run. Inspect live enforced rules and report informational deps-report policy accurately; no policy change or flake waiver is introduced.

All final tracked review/evidence commits precede the decisive CI run. Do not move the checked head after green; record final run/shard/required-context proof externally and queue renewed canonical READY only then. Same PR2468, no labels, force push, new PR, self-merge, tag or release. Earlier Docker-unavailable runtime and component doc-lint limits remain disclosed.
