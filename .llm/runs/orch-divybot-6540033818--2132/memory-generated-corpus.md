# KV API documentation changes need corpus freshness

CI quality additionally runs check:mcp-export-corpus, beyond quality:gate. After committing KV
adapter/public JSDoc changes, run deno task gen:mcp-export-corpus. Its package/plugin dirty
source guard is intentional. Output is the existing compressed-row asset at
packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts.
For #2132 only the kv ./redis row changes; all15symbols remain, only the normalized adapter class signature changes. Do not hand-edit rows. Run native freshness, embedded-export-surface-corpus and
export-surface-flows consumer tests, plus asset/publish freshness gates that follow it in CI.

A stale committed corpus also makes test-4's generate-export-surface-corpus_test.ts fail:
the clean-tree fixture expects byte-identical generated data, and freshness-only mode expects0.
The giant compressed assertion can show RangeError: Array buffer allocation failed from @std's
diff allocator, obscuring the stale-data cause. Download the shard's structured test.report.json.
Those fixtures archive HEAD, so commit the generated correction before running their full suite.
