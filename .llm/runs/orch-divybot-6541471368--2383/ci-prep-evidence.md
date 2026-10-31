# CI Garnet prerequisite repair

## Failed hosted verdict and baseline comparison

[Failed attempt 1](https://github.com/rickylabs/netscript/actions/runs/41189386045/attempts/1): PostgreSQL runtime reaches runtime.aspire-start, then Garnet exits with dotnet's missing restored-tool message. It never reaches saga behavior gates. Core shards, command-postgres, code quality and the sibling SQLite/Garnet runtime tier pass. Latest main e2e run 40539973506 has both runtime tiers green (the separate desktop lane fails); its PostgreSQL tier reports 120 passed. Predecessor #2499's run 41180265201 also has both runtime tiers green.

The generated helper performs best-effort dotnet tool restore under a ten-second bound with output suppressed. CI restores NuGet package files but does not explicitly restore the executable tool before the suite. Missing tool resolution is proven; a cold/failed helper restore is inferred, and its exact discarded error cannot be recovered.

## Repair and focused gates

The existing preparation entrypoint now calls exported prepareRuntimeTier, which restores the existing SCAFFOLD_VERSIONS.GARNET_TOOL pin from a dedicated root manifest before any image pull. This prepares both package files and the local-tool resolver cache for either runtime tier. The command has a separate 120-second bound, inherits stdout/stderr, and propagates every nonzero exit/timeout/kill without retries. No runtime assertion, suite command, readiness limit, workflow, product generator, version pin or lock changes.

Structured prep tests: **11 passed / 0 failed / 0 ignored**. Both tier orchestration tests verify exact dotnet restore argv, isolated root manifest, the shared pin, inherited output and timeout; fake image pulls refuse to run before tool preparation. Nonzero, timeout and killed-child cases each fail once before any image pull/report. Original image-pull tests remain green.

Negative control omits the preflight from the orchestration while keeping the helper and tests. Both tier preparation tests fail specifically because the executable tool has not been restored: **0 passed / 2 failed**, exit 1. See ci-prep-negative.patch. This proves the tests cover entrypoint orchestration, not only a standalone helper.

Structured check/lint/fmt pass on both changed TS files with no dropped selections. Root lint excludes .llm; the lint wrapper uses a temporary config preserving root lint rules without its exclusions. Quality:gate passes. Earlier compensation provider source remains unchanged and retains its 291-test evidence.

## Actual isolated SDK/tool proof

A fresh DOTNET_CLI_HOME and NUGET_PACKAGES were created for this proof; no existing caches were deleted. A consumer B with only the pinned root manifest first fails `dotnet tool run garnet-server -- --help`: exit **1**, exact missing-tool restore message. The production restoration function restores the tool in independent preparation directory A using the real .NET SDK. B then runs the identical command successfully, exit **0**, without restoring B. Tool pin **2.2.1** came from the scaffold catalog; actual restore took **7179 ms**. This proves the resolver cache prepared in A is sufficient for the generated consumer's separate manifest.

Hosted repaired-head runtime CI remains required. An external unchanged attempt 2 was observed live; it was not restarted or cancelled by this run.

Aspire scan-scope/version parity also passes after the repair; no inventory or version edits are necessary because only existing prep paths changed. The ci-prep-evidence-manifest.json records exact validated source hashes.
