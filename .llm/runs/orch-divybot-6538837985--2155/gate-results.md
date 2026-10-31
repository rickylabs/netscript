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
