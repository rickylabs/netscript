# Worklog — release specifier ranges (#973)

## Design

- **Public surface:** no new command or export; generated consumer import maps now receive exact
  release-train specifiers.
- **Domain vocabulary:** `NETSCRIPT_RELEASE_VERSION`, `PLUGIN_PACKAGE_VERSION`, and
  `FRESH_UI_PACKAGE_VERSION` are the owned release-version sources.
- **Ports:** none.
- **Constants:** reuse generated package metadata and `netscriptJsrSpecifier`; add generated Fresh
  UI metadata to the existing publish-assets pipeline.
- **Commit slice:** one mechanical slice covering policy, derived pins, the generated twin, and the
  enforcing regression guard.
- **Deferred scope:** scaffolded third-party plugin package version `0.0.1-alpha.0` is independent
  from first-party dependency resolution and remains unchanged.
- **Contributor path:** add an emitted `@netscript/*` dependency through the package version helper;
  `check:netscript-jsr-specifiers` rejects literal ranges and stale exact pins.

## Implementation

- Six plugin adapter install/update specifiers now derive from each plugin's generated version.
- Contracts generation uses `netscriptJsrSpecifier('contracts')`.
- Fresh UI registry dependencies derive from generated Fresh UI package metadata.
- Plugin skeleton rendering receives `netscriptReleaseVersion` from the CLI and regenerates its
  embedded asset.
- The release skill records exact coordinated pins as policy.
- The existing specifier guard promotes range occurrences from notes to failures.

## Regression proof

| State | Command | Result |
| --- | --- | --- |
| Temporarily reintroduced `plugin-workers@^0.0.1-alpha.12` | `deno task check:netscript-jsr-specifiers` | expected FAIL, exit 1; `FAIL JSR-NETSCRIPT-RANGE`, ranges=1, failures=1 |
| Restored derived exact pin | `deno task check:netscript-jsr-specifiers` | PASS; scanned=2212, ranges=0, failures=0 |

## Gate evidence

| Gate | Result |
| --- | --- |
| Guard unit tests | PASS — 7 passed, 0 failed |
| Targeted CLI scaffold/workspace/UI tests | PASS — 21 passed, 0 failed |
| Scoped fmt: CLI, plugin, Fresh UI, plugins | PASS — 0 failed batches/findings |
| Scoped lint: CLI, plugin, Fresh UI, plugins | PASS — 0 occurrences |
| Scoped check: CLI, plugin, Fresh UI, plugins | PASS — 0 failed batches/occurrences |
| `deno task check:publish-assets` | PASS |
| `deno task quality:gate` | PASS — no quality findings; doctrine gates have pre-existing warnings only |
| `deno task check:assets-barrel` | PASS after the intended generated twin was committed; no stale generated output |
| `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` | **FAIL**, exit 1 — 44 passed / 1 failed; `behavior.service-health` returned HTTP 503 because the generated users service database check was unhealthy; cleanup passed. All specifier-sensitive scaffold, plugin, Fresh UI, generated-registry, and generated-workspace type-check gates passed. |

## Reconcile

- Issue #973 framing and count are correct; only the generated-twin path description needed
  clarification, so no issue correction is required.
- PR #984 must remain draft and carry `Closes #973` plus acceptance evidence.
- IMPL-EVAL remains for the separate supervisor/evaluator session.
- The full runtime failure is not reclassified: retained log
  `.llm/tmp/cli-e2e/plugin-smoke-20260731-180738.log` records the Prisma database health failure.
