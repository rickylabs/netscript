# Evidence — fix-cut-regenerates-agent-docs-prose--w6

This file records untruncated command output and exact exit codes for the discriminating pre-fix
tests, required gates, consecutive freshness checks, and disposable 0.0.7 cut rehearsal.

## Baseline

```text
branch: fix/cut-regenerates-agent-docs-prose
HEAD: bf4b877f17b5cf34a96b6b40a424f19ca5073ddf
origin/main: bf4b877f17b5cf34a96b6b40a424f19ca5073ddf
working tree: clean before run bootstrap
```

## Pre-fix discriminating reds

### 1. Prepared-release gate sequence omits `gen:agent-docs-prose`

Command: `deno test -A .llm/tools/release/prepare-release_test.ts --filter "stable gate sequence"`

Exit code: `1`

```text
Check .llm/tools/release/prepare-release_test.ts
running 1 test from ./.llm/tools/release/prepare-release_test.ts
shared release preparation runs the stable gate sequence in order ...
------- output -------
release:canary bumped 0.0.1-beta.10 -> 0.0.1-canary.1
release:canary gate: gen:publish-assets
release:canary gate: gen:mcp-export-corpus
release:canary gate: gen:assets-barrel
release:canary gate: publish:readiness
release:canary gate: publish:dry-run
release:canary gate: deno ci --prod
----- output end -----
shared release preparation runs the stable gate sequence in order ... FAILED (5ms)

 ERRORS

shared release preparation runs the stable gate sequence in order => ./.llm/tools/release/prepare-release_test.ts:17:6
error: AssertionError: Values are not equal.

    [Diff] Actual / Expected

    [
      "bump:0.0.1-canary.1:canary",
+     "deno task gen:agent-docs-prose",
      "deno task gen:publish-assets",
      "deno task gen:mcp-export-corpus",
      "deno task gen:assets-barrel",
      "residue:0.0.1-beta.10",
      "deno task publish:readiness",
      "deno task publish:dry-run",
      "deno ci --prod",
    ]

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-w6/.llm/tools/release/prepare-release_test.ts:45:3

 FAILURES

shared release preparation runs the stable gate sequence in order => ./.llm/tools/release/prepare-release_test.ts:17:6

FAILED | 0 passed | 1 failed | 2 filtered out (10ms)

error: Test failed
```

### 2. Prepared-release output ownership does not explicitly classify both corpus files

Command: `deno test -A .llm/tools/release/prepare-release_test.ts --filter "stages every generator-owned output"`

Exit code: `1`

```text
Check .llm/tools/release/prepare-release_test.ts
running 1 test from ./.llm/tools/release/prepare-release_test.ts
shared release preparation stages every generator-owned output ... FAILED (1ms)

 ERRORS

shared release preparation stages every generator-owned output => ./.llm/tools/release/prepare-release_test.ts:58:6
error: AssertionError: Values are not equal.

    [Diff] Actual / Expected

    [
-     ".llm/assets/agent-docs/prose.json.gz",
-     ".llm/assets/agent-docs/provenance.json",
      "packages/cli/src/kernel/assets/agent-tools.generated.ts",
      "packages/cli/src/kernel/assets/agent-docs.generated.ts",
      "packages/cli/src/kernel/assets/embedded.generated.ts",
      "packages/cli/src/kernel/assets/skills.generated.ts",
      "packages/plugin/src/kernel/assets/embedded.generated.ts",
      "packages/fresh-ui/registry.generated.ts",
      "packages/service/src/primitives/scalar.generated.ts",
      "packages/mcp/src/publish-assets.generated.ts",
      "packages/cli/src/kernel/assets/publish-assets.generated.ts",
      "packages/fresh-ui/src/package-metadata.generated.ts",
      "packages/plugin-sagas-core/src/package-metadata.generated.ts",
      "packages/plugin-streams-core/src/package-metadata.generated.ts",
      "plugins/ai/src/package-metadata.generated.ts",
      "plugins/auth/src/package-metadata.generated.ts",
      "plugins/sagas/src/package-metadata.generated.ts",
      "plugins/streams/src/package-metadata.generated.ts",
      "plugins/triggers/src/package-metadata.generated.ts",
      "plugins/workers/src/package-metadata.generated.ts",
      "packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts",
+     ".llm/assets/agent-docs/prose.json.gz",
+     ".llm/assets/agent-docs/provenance.json",
    ]

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-w6/.llm/tools/release/prepare-release_test.ts:59:3

 FAILURES

shared release preparation stages every generator-owned output => ./.llm/tools/release/prepare-release_test.ts:58:6

FAILED | 0 passed | 1 failed | 2 filtered out (6ms)

error: Test failed
```

Baseline nuance: both corpus paths were already present transitively at the head of
`PUBLISH_ASSET_OUTPUTS`. The failing assertion proves they were not independently classified by the
prepared-release set as the owner contract requested; the implementation makes that ownership
explicit without duplicating staged paths.

Correction after independent RCA: the assertion above encoded the owner's original, retracted
instruction. Independent classification was not a missing property; `PUBLISH_ASSET_OUTPUTS` was
already the correct single owner. The superseding test below proves both paths are staged exactly
once without reclassifying them.

### 3. Real pre-fix cut path leaves the bumped corpus stale

Disposable root: `/tmp/netscript-w6-prefix.TQbM4q/repo`

Source commit: `1804c23ff` (production pre-fix; only harness bootstrap differs from the requested
base).

Command: `deno task release:cut -- 0.0.7 --dry-run`

Raw exit code: `0`

Terminal output (the command emitted 3,150 publish-simulation progress lines; no lines in this
terminal verdict are elided):

```text
Success Dry run complete
release:cut gate: deno ci --prod
release:cut dry-run complete; branch/commit/push/PR skipped.
RELEASE_EXIT=0
```

Immediate command in the same bumped disposable copy: `deno task check:agent-docs-prose`

Raw exit code: `1`

Terminal output (the preceding docs build completed successfully with `629 files generated`,
`Rendered output: OK (homepage semantics; 224 HTML files; 4 documented-syntax allowances)`):

```text
{"fresh":false,"stalePaths":["prose.json.gz","provenance.json"],"provenance":{"schemaVersion":1,"version":"0.0.7",...}}
error: Uncaught (in promise) Error: Agent docs prose is stale: prose.json.gz, provenance.json
        throw new Error(`Agent docs prose is stale: ${freshness.stalePaths.join(', ')}`);
              ^
    at file:///tmp/netscript-w6-prefix.TQbM4q/repo/.llm/tools/docs/build-agent-docs-bundle.ts:358:15
```

The provenance object contains the full 182-file corpus inventory; the decisive freshness fields
above are reproduced without alteration. This proves the real pre-fix cut path exits green while
violating the required post-cut freshness property.

## Gate output

All commands ran from `/home/codex/repos/ns006-w6`. Raw exit codes were `0`.

```text
$ deno test -A .llm/tools/release/prepare-release_test.ts
running 3 tests from ./.llm/tools/release/prepare-release_test.ts
shared release preparation runs the stable gate sequence in order ... ok
shared release preparation stages every generator-owned output ... ok
shared release preparation regenerates assets then stops when residue remains ... ok
ok | 3 passed | 0 failed
EXIT_CODE=0

$ rtk proxy deno task check
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-w6"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2915,"batches":25,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task test
ok | 3386 passed (624 steps) | 0 failed | 17 ignored (4m0s)
EXIT_CODE=0

$ rtk proxy deno task lint
Task lint deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)"
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-w6","exitCode":0},"selection":{"filesSelected":2034,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
EXIT_CODE=0

$ rtk proxy deno task fmt:check
Task fmt:check deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx --exclude "^(packages/(cli)|packages/mcp/tests/fixtures/doctor/|.*(?:^|/)\\.generated/|.*(?:^|/)node_modules/)" --ignore-line-endings
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-w6","mode":"check","summary":{"filesSelected":2034,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
EXIT_CODE=0
```

### Agent-docs freshness, twice consecutively

Both invocations built 629 files, reported rendered output OK, and returned the same semantic
freshness payload and hash:

```text
$ deno task check:agent-docs-prose
Rendered output: OK (homepage semantics; 224 HTML files; 4 documented-syntax allowances)
{"fresh":true,"stalePaths":[],"provenance":{"schemaVersion":1,"version":"0.0.5",...,"sha256":"6edddd572ce21179cec9939e67232ee931e33358f75a68389791f722f6d8a088"}}
EXIT_CODE=0

$ deno task check:agent-docs-prose
Rendered output: OK (homepage semantics; 224 HTML files; 4 documented-syntax allowances)
{"fresh":true,"stalePaths":[],"provenance":{"schemaVersion":1,"version":"0.0.5",...,"sha256":"6edddd572ce21179cec9939e67232ee931e33358f75a68389791f722f6d8a088"}}
EXIT_CODE=0
```

The omitted provenance middle is the identical 178-file inventory emitted on both runs; no verdict
or differing field is elided.

### Lock hygiene in the implementation worktree

Both commands emitted no diff and exited `0`:

```text
$ git diff --stat -- deno.lock packages/fresh-ui/deno.lock
EXIT_CODE=0

$ git diff --stat origin/main...HEAD -- deno.lock packages/fresh-ui/deno.lock
EXIT_CODE=0
```

## Disposable 0.0.7 dry-run proof

Disposable root: `/tmp/netscript-w6-postfix.9vF9Mh/repo`. The clone used branch commit `a42d3e707`
and overlaid only the reviewed `prepare-release.ts` and `prepare-release_test.ts` changes before the
cut. No live cut, branch, tag, push, PR, or publication occurred.

```text
$ deno task release:cut -- 0.0.7 --dry-run
release:cut bumped 0.0.5 -> 0.0.7
release:cut gate: gen:agent-docs-prose
Docs source format: OK
[diagram] verified 21 diagram asset reference(s).
Site built into _site
629 files generated
Rendered output: OK (homepage semantics; 224 HTML files; 4 documented-syntax allowances)
release:cut gate: gen:publish-assets
release:cut gate: gen:mcp-export-corpus
release:cut gate: gen:assets-barrel
release:cut gate: publish:readiness
{"gate":"publish-readiness","ok":true,"version":"0.0.7"}
release:cut gate: publish:dry-run
Success Dry run complete
release:cut gate: deno ci --prod
release:cut dry-run complete; branch/commit/push/PR skipped.
RELEASE_EXIT=0
```

The dry-run's publish simulation emitted 3,150 file-progress lines; the complete terminal sequence
and every release gate are retained above.

Immediate post-cut freshness check in that same bumped copy:

```text
$ deno task check:agent-docs-prose
Docs source format: OK
[diagram] verified 21 diagram asset reference(s).
629 files generated
Rendered output: OK (homepage semantics; 224 HTML files; 4 documented-syntax allowances)
{"fresh":true,"stalePaths":[],"provenance":{"schemaVersion":1,"version":"0.0.7",...,"sha256":"c9268f6cb59e8b94b3c5f01afd1e2203034f38769f14e91eabe22464df3cf257"}}
EXIT_CODE=0
```

Direct corpus identity and residue proof:

```text
{"version":"0.0.7","sha256":"c9268f6cb59e8b94b3c5f01afd1e2203034f38769f14e91eabe22464df3cf257","files":178}
{"contains007":true,"contains005":false,"count007":162,"count005":0}
```

Coordinated version-only classifier over the 62 cut-created paths (excluding only the two known
implementation overlays):

```text
{"changed":62,"declared":68,"versionOnly":true}
```

The changed-path census contains only bumped `deno.json` / `scaffold.plugin.json` manifests, the two
release lockfiles, and writer-declared generated assets (including both agent-docs corpus files and
their CLI/MCP consumers). No source path is present.

## Corrected-RCA pre-fix evidence

These tests ran against production commit `3aed636a9`, before the semantic-freshness and inheritance
implementation. The run artifacts and tests were the only working-tree changes.

### Prepared sequence and existing staging ownership

Command: `deno test -A .llm/tools/release/prepare-release_test.ts`

Exit code: `1`

```text
running 3 tests from ./.llm/tools/release/prepare-release_test.ts
shared release preparation runs the stable gate sequence in order ... FAILED
shared release preparation stages every generator-owned output ... FAILED
shared release preparation regenerates assets then stops when residue remains ... FAILED

[Diff] Actual / Expected
  "deno task gen:assets-barrel",
+ "deno task check:agent-docs-prose",

[Diff] Actual / Expected
+ ".llm/assets/agent-docs/prose.json.gz",
+ ".llm/assets/agent-docs/provenance.json",
  "packages/cli/src/kernel/assets/agent-tools.generated.ts",
  ...
  "packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts",
- ".llm/assets/agent-docs/prose.json.gz",
- ".llm/assets/agent-docs/provenance.json",

FAILED | 0 passed | 3 failed
error: Test failed
```

The first and third failures prove the local semantic check was absent. The second proves the
temporary explicit-classification implementation moved paths that were already present through the
`PUBLISH_ASSET_OUTPUTS` spread; final behavior must restore that spread unchanged and assert each
path occurs once in `collectPreparedReleaseFiles`.

### Genuine-render inheritance

Command:
`deno test -A .llm/tools/release/github-release_test.ts --filter "genuinely re-rendered"`

Exit code: `1`

```text
running 1 test from ./.llm/tools/release/github-release_test.ts
parent canary evidence accepts a genuinely re-rendered version-derived corpus ... FAILED

error: Error: Stable publication blocked: agent-docs prose contains non-version changes, so the
parent canary evidence cannot authorize this content.
    at verifyGreenCanaryPair (.llm/tools/release/github-release.ts:233:19)

FAILED | 0 passed | 1 failed | 24 filtered out
error: Test failed
```

The fixture creates a real Git parent→HEAD pair and uses the production site-corpus builder. Before
calling inheritance it asserts the canonical uncompressed SHA-256 of `rebaseAgentDocsProse` output
differs from the genuine bumped render. The repository-scale 0.0.7 proof measured the same
differential across 20 files:

```text
literal rebase sha256: 18138d9daba98946ca33ce0b5a4eb7e96bad4406641a64167ac45b1fea268267
real render sha256:    c9268f6cb59e8b94b3c5f01afd1e2203034f38769f14e91eabe22464df3cf257
equal: false
changed files: 20
```

Companion command:
`deno test -A .llm/tools/release/github-release_test.ts --filter "semantically drifted"`

Exit code: `0`

```text
parent canary evidence rejects semantically drifted rebuilt corpus content ... ok
ok | 1 passed | 0 failed | 24 filtered out
```

The pre-fix code refuses both cases at the coarse literal-replacement boundary. The implementation
must accept the first only after semantic reproduction, while preserving rejection of the second.
