# Local gate evidence — S1

| Command | Exit | Evidence |
| --- | --- | --- |
| `deno task --cwd docs/site verify` | 0 | Source format OK; 253 rendered HTML pages; 23,829 internal links resolve; 13 caveat markers resolve |
| `deno task docs:snippets` | 0 | 26 Tier-1 fences checked; 13 documented exemptions; no malformed fences |
| Structured test wrapper, `.llm/tools/docs/workflow-examples_test.ts` | 0 | 1 test; both new complete examples compile against public workspace exports; root lock unchanged |
| Same test with `DOCS_REVISION=ad252e8c8ce14b05390d70d94fa876ae81376958` | 1 (expected) | Missing complete worker example at the main-revision redirect stub |
| Structured test wrapper, existing compensation/projection/defer regressions | 0 | 33 passed; 0 failed, 0 ignored |
| `deno task docs:accuracy` | 0 | Published-source census, 111/111 public CLI commands and documented API checks pass |
| Structured check wrapper, workflow-examples_test.ts | 0 | 1 selected file; --unstable-kv; no findings |
| Structured lint wrapper, workflow-examples_test.ts, explicit root-rule config without excludes | 0 | 1 selected/processed file; no findings. Default config refuses .llm as all-excluded (exit 2), not counted as a pass |
| Structured fmt wrapper, workflow-examples_test.ts | 0 | 1 selected/processed file; no findings |
| `git diff --check` | 0 | No whitespace errors |
| `deno task check:publish-assets` through gate runner | 0 | Current embedded assets match the existing carrier. Recheck after coordinator refreshes prose; this pass does not prove site-to-carrier freshness |
| Agent prose freshness helper `build-agent-docs-bundle.ts --site-dir docs/site/_site --check` | 1 | `fresh: false`, stalePaths = [`agent-docs-prose.generated.ts`]. Same helper was fresh on unchanged baseline. Package carrier cannot change within this assignment |

The docs verification command builds the site, registry JSON artifacts, rendered-output checks, internal link checks and caveat checks. The focused snippet test closes the coverage gap left by the normal Tier-1 snippet gate for these two examples. Runtime tests are pre-existing and prove shipped source behavior; no runtime behavior is claimed as new. No local scaffold.runtime, AppHost or database resource was started.

## Raw structured test summaries (repository path normalized)

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all",".llm/tools/docs/workflow-examples_test.ts"],"cwd":"<repository>","exitCode":0,"durationMs":4924,"summary":{"passed":1,"failed":0,"ignored":0,"totalResults":1,"uniqueFailures":0},"failures":[]}
```

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all",".llm/tools/docs/workflow-examples_test.ts"],"cwd":"<repository>","exitCode":1,"durationMs":168,"summary":{"passed":0,"failed":1,"ignored":0,"totalResults":1,"uniqueFailures":1},"failures":[{"message":"AssertionError: tutorials/eis-chat/03-deliver-worker.md: missing complete example // workers/jobs/deliver-result.ts\n    at assert (https://jsr.io/@std/assert/1.0.19/assert.ts:<line>:<column>)\n    at file://<cwd>/.llm/tools/docs/workflow-examples_test.ts:<line>:<column>","count":1,"tests":[{"name":"worker stream and trigger retry examples compile against the workspace public exports","file":"./.llm/tools/docs/workflow-examples_test.ts","line":25}]}]}
```

```json
{"schemaVersion":1,"command":["deno","test","--reporter=tap","--allow-all","packages/plugin-sagas-core/tests/runtime/saga-compensation-persistence_test.ts","plugins/sagas/streams/producer_transition_test.ts","plugins/triggers/src/runtime/trigger-runtime-processor_test.ts"],"cwd":"<repository>","exitCode":0,"durationMs":5862,"summary":{"passed":33,"failed":0,"ignored":0,"totalResults":33,"uniqueFailures":0},"failures":[]}
```

```json
{"source":{"mode":"selection","cwd":"<repository>"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":1,"batches":1,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```


The full allowlisted `agent-docs-prose` gate was also measured through run-gate.ts: FAIL, exit 1, stale prose carrier. The allowlisted `publish-assets` gate was measured separately: PASS, exit 0 against the unchanged current carrier.

## Final preflight

- `deno task check:aspire-version-parity` initially failed manifest freshness because the restored worker page mentions Aspire. Its existing generator adds exactly that public-page row; rerun exits 0, manifestFresh true, no missing paths and zero failures. No scan rule or exclusion changes.
- On the evidence head before that one-row metadata follow-up: normal snippets pass with 26 compiled Tier-1 fences, the combined focused/source test wrapper passes 34/34, and the allowlisted docs-accuracy receipt passes. Source docs and test are unchanged.

## Coordinator-authorized carrier integration (S3)

| File | Canonical generator | Result |
| --- | --- | --- |
| packages/cli/src/kernel/assets/agent-docs-prose.generated.ts | `deno task gen:agent-docs-prose` | Exit 0; fresh corpus matches rendered docs, including restored worker lesson |
| packages/mcp/src/publish-assets.generated.ts | `deno task gen:publish-assets` | Exit 0; refreshed MCP documentation fallback |

Both files match the separately generated preview byte-for-byte; hashes and authorization are in generated-carriers.json. No authored package/plugin source or lock changes.

- Allowlisted agent-docs-prose after regeneration: PASS, exit 0. This supersedes the earlier stale-carrier failures without weakening the gate.
- `check:publish-assets`: initially reports exactly the MCP generated file stale after prose refresh; canonical regeneration fixes it; recheck exits 0.
- `check:assets-barrel`: its canonical generation produced no additional changed file, but the precommit task exits 1 because its final git diff detects the pending prose-carrier update. Rerun after commit for the authoritative verdict.
- Structured TS check of the two generated files: exit 0, 2 selected files, no findings.
- `quality:gate` (quality scan + architecture): exit 0; existing warning-only findings remain.

Current-main integration required a normal merge of 8902e1a, with one generated prose conflict. The saga reference auto-merge retains the incoming retention section and this audit's corrections. Regenerated the same two authorized carriers through the same canonical commands. Prior b902c3d clean-tree carrier gates passed; merged-head gates will be revalidated before final review. No authored package/plugin delta exists relative to the new main.
