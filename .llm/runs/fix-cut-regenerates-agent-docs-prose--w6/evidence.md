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

shared release preparation runs the stable gate sequence in order => ./.llm/tools/release/prepare-release_test.ts:16:6
error: AssertionError: Values are not equal.

    [Diff] Actual / Expected

    [
      "bump:0.0.1-canary.1:canary",
      "deno task gen:publish-assets",
      "deno task gen:mcp-export-corpus",
+     "deno task gen:agent-docs-prose",
      "deno task gen:assets-barrel",
      "residue:0.0.1-beta.10",
      "deno task publish:readiness",
      "deno task publish:dry-run",
      "deno ci --prod",
    ]

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/1.0.19/equals.ts:67:9)
    at file:///home/codex/repos/ns006-w6/.llm/tools/release/prepare-release_test.ts:44:3

 FAILURES

shared release preparation runs the stable gate sequence in order => ./.llm/tools/release/prepare-release_test.ts:16:6

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

### 3. Real pre-fix cut path

Pending disposable 0.0.7 rehearsal from the pre-fix commit.

## Gate output

Pending implementation.

## Disposable 0.0.7 dry-run proof

Pending implementation.
