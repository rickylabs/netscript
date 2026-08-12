# W5-B corpus determinism evidence

Implementation-lane evidence only. Supervisor review, the required root gate set, and automatic
IMPL-EVAL remain pending.

## Pre-fix discriminating red

The baseline `check:agent-docs-prose` happened to pass once, so it is not used as defect evidence.
Before changing production code, the regression test below was added and run against the baseline
builder:

```text
$ deno test --allow-read --allow-write .llm/tools/docs/build-agent-docs-bundle_test.ts
Check .llm/tools/docs/build-agent-docs-bundle_test.ts
running 3 tests from ./.llm/tools/docs/build-agent-docs-bundle_test.ts
docs prose builder requires the #1068 task router and writes only its output root ... ok (14ms)
unchanged canonical corpus preserves byte-different gzip transport ... FAILED (5ms)
site rebuild replaces rendered pages and preserves externally owned corpus entries ... ok (6ms)

unchanged canonical corpus preserves byte-different gzip transport =>
./.llm/tools/docs/build-agent-docs-bundle_test.ts:43:6
error: AssertionError: Values are not equal: content-identical alternate gzip bytes must survive
unchanged regeneration

[Diff] Actual / Expected
Uint8Array(146) [
  31, 139, 8, 0,
+ 1,
  0, 0, 0,
- 0,
  255, ...
]

FAILED | 2 passed | 1 failed (30ms)
error: Test failed
```

The fixture changes only gzip header byte 4. Decompression still produces identical canonical JSON;
the failing assertion proves the baseline rewrites transport bytes for unchanged content.

## Implemented contract

- `sha256` is SHA-256 of the canonically serialized, uncompressed corpus bytes.
- Check mode builds the rendered docs, compares decompressed canonical bytes and semantic
  provenance, reports stale paths, and does not write the checked-in gzip or provenance.
- Normal generation reuses an existing valid gzip when its decompressed bytes equal the canonical
  corpus, and preserves source/extraction metadata for that unchanged content.
- CLI generation/runtime integrity, coordinated release provenance derivation, and publish-asset
  rebasing validate or emit the canonical content hash.

## Discriminating tests after the fix

```text
$ deno test -A .llm/tools/docs/build-agent-docs-bundle_test.ts \
    .llm/tools/generate-publish-assets_test.ts \
    .llm/tools/release/github-release_test.ts \
    packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts
running 4 tests from packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts
offline docs cover every export subpath at the exact installed version ... ok
lock evidence resolves a non-exact JSR range ... ok
workspace evidence resolves a local package version without a lock ... ok
missing lock evidence, version mismatch, and launch throws fail loudly ... ok
running 23 tests from .llm/tools/release/github-release_test.ts
23 passed
running 4 tests from .llm/tools/docs/build-agent-docs-bundle_test.ts
docs prose builder requires the #1068 task router and writes only its output root ... ok
unchanged canonical corpus preserves byte-different gzip transport ... ok
semantic freshness tolerates gzip variance, is non-mutating, and detects real input drift ... ok
site rebuild replaces rendered pages and preserves externally owned corpus entries ... ok
running 5 tests from .llm/tools/generate-publish-assets_test.ts
CLI corpus integrity follows canonical content across gzip transport variance ... ok
MCP fallback is generated from the locked release prose within 256 KiB ... ok
release asset regeneration removes prior-version provenance residue ... ok
top-level generation refreshes provenance before MCP reads it ... ok
release bump rebases one shared corpus before CLI and MCP consume it ... ok

ok | 36 passed | 0 failed (851ms)
```

The semantic freshness test first substitutes byte-different, content-identical gzip bytes and
asserts `fresh === true` plus byte-for-byte non-mutation. It then changes `site/index.md` and
asserts `fresh === false`, stale paths `['prose.json.gz', 'provenance.json']`, and continued
non-mutation. Thus the check cannot pass unconditionally.

## Official generation and double freshness run

The corpus was refreshed through `deno task gen:agent-docs-prose`, followed by the official CLI
barrel generator. The gzip did not change; the provenance changed only from compressed-byte SHA to
canonical-content SHA:

```text
files=178
uncompressedBytes=4720171
compressedBytes=1352791
canonical sha256=6edddd572ce21179cec9939e67232ee931e33358f75a68389791f722f6d8a088
gzip file sha256=fc121f9c0bb737e3776d64c03f6d940d7a5e1b14d5e35100c9923a3602a10da3
```

Actual consecutive check verdicts:

```text
$ deno task check:agent-docs-prose
{"fresh":true,"stalePaths":[],"provenance":{"schemaVersion":1,"files":178,"uncompressedBytes":4720171,"compressedBytes":1352791,"sha256":"6edddd572ce21179cec9939e67232ee931e33358f75a68389791f722f6d8a088"}}
exit 0

$ sha256sum .llm/assets/agent-docs/prose.json.gz .llm/assets/agent-docs/provenance.json
fc121f9c0bb737e3776d64c03f6d940d7a5e1b14d5e35100c9923a3602a10da3  .llm/assets/agent-docs/prose.json.gz
27b3a3f28a64f42e3e238026cd52a99f35fb67e9e7f27060221b6d8efe750b17  .llm/assets/agent-docs/provenance.json

$ deno task check:agent-docs-prose
{"fresh":true,"stalePaths":[],"provenance":{"schemaVersion":1,"files":178,"uncompressedBytes":4720171,"compressedBytes":1352791,"sha256":"6edddd572ce21179cec9939e67232ee931e33358f75a68389791f722f6d8a088"}}
exit 0

$ sha256sum .llm/assets/agent-docs/prose.json.gz .llm/assets/agent-docs/provenance.json
fc121f9c0bb737e3776d64c03f6d940d7a5e1b14d5e35100c9923a3602a10da3  .llm/assets/agent-docs/prose.json.gz
27b3a3f28a64f42e3e238026cd52a99f35fb67e9e7f27060221b6d8efe750b17  .llm/assets/agent-docs/provenance.json
```

The displayed provenance objects abbreviate the 178-element `files` array to its count; all other
reported values are verbatim. Each task's raw terminal output completed successfully.

## Focused static evidence

The scoped wrappers selected the eight changed handwritten TypeScript files:

```text
run-deno-check.ts: filesSelected=8, failedBatches=0, totalOccurrences=0
run-deno-lint.ts:  filesSelected=8, exitCode=0, totalOccurrences=0
run-deno-fmt.ts:   filesSelected=8, failedBatches=0, findings=0
gen:publish-assets --check: exit 0
```

`check:assets-barrel` currently reports the intentional generated `sha256` migration against HEAD;
that git-diff-based gate becomes meaningful after the supervisor's explicit-path commit. No lock
file changed.
