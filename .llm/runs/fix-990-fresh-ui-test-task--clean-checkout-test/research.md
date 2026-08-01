# Research — fix-990-fresh-ui-test-task--clean-checkout-test

## Re-baseline

- Carried-in source: issue #990 reproduction supplied by the owner.
- Re-derived against `main` at `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- The two reported failures reproduce. One detail differs: `--allow-env` is not required by the
  current tests; the first subprocess test passes with read/write/run and no env grant.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The checked-in task grants read only; the first Markdown test fails at `Deno.makeTempDir` with `NotCapable` for write. | Run that test with the task's permission flags. |
| 2 | Adding write exposes a second `NotCapable`, this time for run access to `Deno.execPath()`. | Run the first test with `--allow-read --allow-write`. |
| 3 | Read/write/run is empirically sufficient for the first subprocess test; env is not currently required. | Run the first test with `--allow-read --allow-write --allow-run`; it passes. |
| 4 | With `.llm/tmp` absent and `-A`, the second test fails at `makeTempDir({ dir })` with `NotFound: tmpdir`. | Remove the ignored parent and run only the second test with `-A`. |
| 5 | The existing in-repo `.llm/tmp` location is an owner-imposed constraint, not an empirically verified requirement. | Owner brief; preserve it as the lower-risk choice without promoting it to a repository finding. |
| 6 | Read/write/run is sufficient for both subprocess tests and the full 166-test suite; neither env nor net is required by the parent test process. | Clean-parent `deno task test`: `ok | 166 passed | 0 failed (5m59s)`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/fresh-ui/deno.json`; exports and publish include/exclude rules are
  unchanged by this run.
- Slow-type / surface risks: no new public symbols or entrypoints. Existing fresh-ui private-type
  doc-lint debt is baseline and unrelated.
- Deno accepts JSONC and `deno publish --dry-run --allow-dirty` completed successfully, but the
  opposite-family review found that repo release/readiness tools use plain `JSON.parse` for package
  manifests. The rationale therefore belongs in the affected test file, leaving `deno.json` strict
  JSON. Publish metadata and filters remain byte-for-byte unchanged.

## Open questions

- None. The owner externally locked the directory choice and validation commands; the reason for
  keeping `.llm/tmp` in-repo was not independently verified in this run.
