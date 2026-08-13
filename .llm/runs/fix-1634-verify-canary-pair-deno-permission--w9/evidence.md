# Evidence — Slice W9 / #1634

## Pre-fix RED — focused discriminating tests

Command:

```text
deno test --allow-all .llm/tools/release/github-release_test.ts .llm/tools/release/release-canary-workflow_test.ts
```

Exit code: `1`.

```text
Check .llm/tools/release/github-release_test.ts
Check .llm/tools/release/release-canary-workflow_test.ts
running 32 tests from ./.llm/tools/release/github-release_test.ts
toVersion strips a single leading v; toTag re-adds it ... ok (1ms)
version-only diff accepts the complete release version surface only ... ok (1ms)
agent-docs provenance rejects forged sidecars for their own compressed blobs ... ok (11ms)
agent-docs provenance rejects impossible render metadata with honest blob lengths ... ok (4ms)
agent-docs provenance accepts writer-valid UTC timestamps with optional milliseconds ... ok (4ms)
generated release freshness checks semantic prose before downstream assets ... ok (459µs)
generated release freshness stops before downstream checks when semantic prose is stale ... ok (548µs)
version-only diff accepts a realistic coordinated release cut and rejects source drift ... ok (11ms)
green canary pair accepts current SHA or a version-only immediate parent ... ok (909µs)
parent canary evidence checks every release path and reproduces derived writer outputs ... ok (3ms)
parent canary evidence accepts a genuinely re-rendered version-derived corpus ... ok (86ms)
parent canary evidence refuses a freshness stub without semantic proof ... ok (80ms)
parent canary evidence rejects semantically drifted rebuilt corpus content ... ok (99ms)
parent canary evidence distinguishes permission failure from content drift ... FAILED (163ms)
parent canary evidence fails when derived writer outputs cannot be reproduced ... ok (6ms)
parent canary evidence rejects self-consistent non-version agent-docs injection ... ok (5ms)
parent canary evidence rejects writer-preserved non-version provenance injection ... ok (20ms)
canary pair gate fails closed for source drift and API failure ... ok (551µs)
parent canary evidence rejects seeded manifest drift inside a version file ... ok (286µs)
formatClosedIssues renders a bulleted list, empty when none ... ok (266µs)
composeReleaseBody orders intro, changelog, closed issues and drops blanks ... ok (216µs)
--prev-tag resolves a dated window and queries closed issues ... ok (769µs)
known previous tag with empty since fails loudly before reporting closed issues ... ok (443µs)
explicit previous tag uses release date with commit-date fallback ... ok (585µs)
parseArgs: version positional or flag, defaults to non-prerelease Latest ... ok (248µs)
parseArgs: --prerelease implies not-Latest; explicit --latest with it throws ... ok (656µs)
parseArgs: --no-latest overrides the default ... ok (132µs)
parseArgs: every documented release:publish invocation is accepted ... ok (1ms)
parseArgs: intro is required (the deliberate manual step) ... ok (9ms)
parseArgs: version is required ... ok (450µs)
parseArgs: notes-file and message are mutually exclusive ... ok (257µs)
parseArgs: unknown flag and missing value are rejected ... ok (542µs)
running 4 tests from ./.llm/tools/release/release-canary-workflow_test.ts
canary workflow reuses the publisher and records only an awaited green pair ... ok (1ms)
stable publisher uses composed readiness before provisioning and real publish ... ok (756µs)
stable canary-pair verifier has one exact executable grant ... FAILED (33ms)
production E2E waits for JSR propagation for explicit canary dispatches ... ok (615µs)

ERRORS

parent canary evidence distinguishes permission failure from content drift
AssertionError: Expected error message to include "Stable publication infrastructure failure: cannot execute generated-output freshness checks", but got "Stable publication blocked: agent-docs prose contains non-version changes, so the parent canary evidence cannot authorize this content.\nRequires run access to \"deno\", run again with the --allow-run flag".

stable canary-pair verifier has one exact executable grant
AssertionError: Values are not equal.
[Diff] Actual / Expected
[
+  "deno",
   "git",
]

FAILED | 34 passed | 2 failed (710ms)
error: Test failed
```

### Required pre-fix assertion mapping

1. **Permission/contract distinction:** `parent canary evidence distinguishes permission failure from content drift` failed because the permission denial was rewritten to `Stable publication blocked: agent-docs prose contains non-version changes` instead of the expected infrastructure error.
2. **Real content guard:** the same discriminating test first asserted genuine drift still emitted `Stable publication blocked: agent-docs prose contains non-version changes`; that assertion passed, then the test went RED on the missing distinction. This orders the assertions so the test is RED on pre-fix code while proving the genuine guard baseline was exercised, not stubbed or weakened.
3. **Exact executable set:** `stable canary-pair verifier has one exact executable grant` failed because the task's actual set was `["git"]` and expected was `["deno", "git"]`.
4. **Immutable-tag recovery:** the original workflow delegated to `deno task release:verify-canary-pair`, so a dispatch checking out the immutable tag necessarily consumed its old `--allow-run=git` task. The executed negative control in `stable workflow recovery bypasses an immutable tag task and reaches a content verdict` reproduces that exact old task and receives `Requires run access to "deno"`. Therefore the pre-fix path would fail the test's required production content-verdict assertion before `verifyGreenCanaryPair` could emit it. The final sentence is a reasoned counterfactual based on the executed old-task stderr; no release workflow was dispatched.

## Immutable-tag correction iteration

The first correction run exposed a stale ordering assertion: `stable publisher uses composed readiness before provisioning and real publish` still located the canary gate by the removed literal `deno task release:verify-canary-pair`. That assertion was corrected to locate the production verifier entrypoint, which is the actual ordering contract. Exact command permissions are tested separately.

The next focused attempt reached the new recovery test but failed before the subprocess boundary because the temporary fixture replaced the complete manifest and therefore lacked the repository's `@std/path` import:

```text
stable workflow recovery bypasses an immutable tag task and reaches a content verdict ... FAILED (42ms)
AssertionError: Expected actual: "error: Import \"@std/path\" not a dependency
  hint: If you want to use the JSR package, try running `deno add jsr:@std/path`
    at file:///home/codex/repos/ns006-w9/.llm/tools/docs/generate-export-surface-corpus.ts:3:64
" to contain: "Requires run access to \"deno\"".
FAILED | 37 passed | 1 failed (625ms)
```

This was a fixture-construction error, not a product verdict. The fixture now preserves the real manifest imports and narrows only the immutable tag's verifier task back to `--allow-run=git`.

## Post-fix gates

### Final focused verifier/workflow suite — untruncated

```text
$ deno test --allow-all .llm/tools/release/release-canary-workflow_test.ts .llm/tools/release/github-release_test.ts .llm/tools/release/verify-canary-pair_test.ts
Check .llm/tools/release/release-canary-workflow_test.ts
Check .llm/tools/release/github-release_test.ts
Check .llm/tools/release/verify-canary-pair_test.ts
running 5 tests from ./.llm/tools/release/release-canary-workflow_test.ts
canary workflow reuses the publisher and records only an awaited green pair ... ok (1ms)
stable publisher uses composed readiness before provisioning and real publish ... ok (262µs)
stable canary-pair verifier has one exact executable grant ... ok (639µs)
stable workflow recovery bypasses an immutable tag task and reaches a content verdict ... ok (111ms)
production E2E waits for JSR propagation for explicit canary dispatches ... ok (516µs)
running 32 tests from ./.llm/tools/release/github-release_test.ts
toVersion strips a single leading v; toTag re-adds it ... ok (966µs)
version-only diff accepts the complete release version surface only ... ok (1ms)
agent-docs provenance rejects forged sidecars for their own compressed blobs ... ok (12ms)
agent-docs provenance rejects impossible render metadata with honest blob lengths ... ok (3ms)
agent-docs provenance accepts writer-valid UTC timestamps with optional milliseconds ... ok (3ms)
generated release freshness checks semantic prose before downstream assets ... ok (498µs)
generated release freshness stops before downstream checks when semantic prose is stale ... ok (719µs)
version-only diff accepts a realistic coordinated release cut and rejects source drift ... ok (10ms)
green canary pair accepts current SHA or a version-only immediate parent ... ok (566µs)
parent canary evidence checks every release path and reproduces derived writer outputs ... ok (2ms)
parent canary evidence accepts a genuinely re-rendered version-derived corpus ... ok (78ms)
parent canary evidence refuses a freshness stub without semantic proof ... ok (66ms)
parent canary evidence rejects semantically drifted rebuilt corpus content ... ok (70ms)
parent canary evidence distinguishes permission failure from content drift ... ok (88ms)
parent canary evidence fails when derived writer outputs cannot be reproduced ... ok (2ms)
parent canary evidence rejects self-consistent non-version agent-docs injection ... ok (4ms)
parent canary evidence rejects writer-preserved non-version provenance injection ... ok (4ms)
canary pair gate fails closed for source drift and API failure ... ok (883µs)
parent canary evidence rejects seeded manifest drift inside a version file ... ok (188µs)
formatClosedIssues renders a bulleted list, empty when none ... ok (173µs)
composeReleaseBody orders intro, changelog, closed issues and drops blanks ... ok (167µs)
--prev-tag resolves a dated window and queries closed issues ... ok (430µs)
known previous tag with empty since fails loudly before reporting closed issues ... ok (214µs)
explicit previous tag uses release date with commit-date fallback ... ok (329µs)
parseArgs: version positional or flag, defaults to non-prerelease Latest ... ok (139µs)
parseArgs: --prerelease implies not-Latest; explicit --latest with it throws ... ok (562µs)
parseArgs: --no-latest overrides the default ... ok (79µs)
parseArgs: every documented release:publish invocation is accepted ... ok (719µs)
parseArgs: intro is required (the deliberate manual step) ... ok (94µs)
parseArgs: version is required ... ok (72µs)
parseArgs: notes-file and message are mutually exclusive ... ok (112µs)
parseArgs: unknown flag and missing value are rejected ... ok (107µs)
running 1 test from ./.llm/tools/release/verify-canary-pair_test.ts
canary pair verifier parses an explicit repo and rejects malformed input ... ok (2ms)

ok | 38 passed | 0 failed (668ms)
```

Exit code: `0`.

The immutable-tag test is executed, not reasoned: its old task negative control reproduces the permission denial, while the workflow command runs against the same fixture tree, successfully spawns `git` and `deno`, and calls production `verifyGreenCanaryPair` with deterministic status/diff dependencies. The GitHub status response is fixture-backed rather than live; the fail-closed verdict text and branch are production code.

### Root check

```text
$ rtk proxy deno task check
Task check deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx --exclude "^(.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w9"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2917,"batches":25,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

Exit code: `0`.

### Root test

```text
$ rtk proxy deno task test
Task test deno test --allow-all
ok | 3403 passed (624 steps) | 0 failed | 17 ignored (3m56s)
```

Exit code: `0`. Deno emitted no failure section; the summary is the complete verdict line.

### Root lint

```text
$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w9","exitCode":0},"selection":{"filesSelected":2034,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
```

Exit code: `0`.

### Root format check

```text
$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w9","mode":"check","summary":{"filesSelected":2034,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
```

Exit code: `0`.

### Exact production-failing verifier command

The shell had no exported `GH_TOKEN`, so the already authenticated `gh` credential was bound only for this invocation. No token material was printed.

```text
$ GH_TOKEN="$(gh auth token)" deno task release:verify-canary-pair -- --repo rickylabs/netscript
Task release:verify-canary-pair deno run --allow-net=api.github.com --allow-env=GH_TOKEN --allow-run=git,deno --allow-read .llm/tools/release/verify-canary-pair.ts '--' '--repo' 'rickylabs/netscript'
[release:verify-canary-pair] token source: env:GH_TOKEN
error: Uncaught (in promise) Error: Stable publication blocked: agent-docs prose contains non-version changes, so the parent canary evidence cannot authorize this content.
```

The first authenticated attempt above was made before the slice commit and correctly reached content/freshness checking, but the dirty worktree prevented a final repository verdict. The command was therefore repeated after the slice commit from a clean tree:

```text
$ GH_TOKEN="$(gh auth token)" deno task release:verify-canary-pair -- --repo rickylabs/netscript
Task release:verify-canary-pair deno run --allow-net=api.github.com --allow-env=GH_TOKEN --allow-run=git,deno --allow-read .llm/tools/release/verify-canary-pair.ts '--' '--repo' 'rickylabs/netscript'
[release:verify-canary-pair] token source: env:GH_TOKEN
error: Uncaught (in promise) Error: Stable publication blocked: afa74329448c7d31e6d6e7728ae0e2c3a3cd24dc has no green release/canary-pair status, and the immediate parent cannot be used because the current commit contains non-version changes. Run a new canary pair for this exact content.
  throw new Error(
        ^
    at verifyGreenCanaryPair (file:///home/codex/repos/ns006-w9/.llm/tools/release/github-release.ts:283:9)
    at async main (file:///home/codex/repos/ns006-w9/.llm/tools/release/verify-canary-pair.ts:36:15)
    at async file:///home/codex/repos/ns006-w9/.llm/tools/release/verify-canary-pair.ts:40:23
```

Exit code: `1`, expected because the fix commit itself has no canary-pair status and is not a version-only child. This is the actual fail-closed repository verdict after authenticated status lookup; crucially, the task line proves the exact `git,deno` grant and the output contains no Deno permission or infrastructure error.

### Formatting and lock hygiene

```text
$ deno fmt --check .llm/tools/release/github-release.ts .llm/tools/release/github-release_test.ts .llm/tools/release/release-canary-workflow_test.ts
Checked 3 files
$ git diff --check
$ git diff --stat -- deno.lock packages/fresh-ui/deno.lock
```

All exit codes: `0`. Lock-file stat output is empty.
