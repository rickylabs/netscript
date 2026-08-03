# Slice 2 adversarial review — read only

Review the current uncommitted slice 2 diff in `/home/codex/repos/ns004-agenttools`. Do not edit,
format, commit, push, or run mutating commands. This is the harness Tier-A opposite-family review.

Read issue #1061 in full, plus the run's `plan.md`, `plan-eval.md`, and slice-1 commit boundary.
Inspect the implementation and focused tests, including the generated docs asset/source archive.

Challenge especially:

1. whether `--with-docs` is genuinely optional and all generation failures occur before project
   writes;
2. whether project evidence resolution is correct for exact pins, lock-resolved ranges, workspace
   packages, absent locks, subpath imports, duplicates, and mixed versions;
3. whether API generation covers every export subpath of every detected installed package and
   accurately records version/provenance;
4. whether `Deno.Command` launch throws and non-zero/empty output fail loudly;
5. whether decompression/hash/path handling is safe and all generated local references resolve;
6. whether the release-built prose demonstrably includes #1068's task router and the new flag docs;
7. whether the 1.18 MB gzip source / 1.6 MB generated TypeScript asset is reproducible,
   freshness-gated, included in CLI publication, and likely to satisfy JSR/doc-lint constraints;
8. whether symptom discovery and the several-megabyte size disclosure satisfy #1061 without
   naming an absent path in a no-flag initialization.

Focused evidence already observed: 35 tests pass; docs site build emits 589 files; a temp real CLI
install emitted 168 docs files with router=true, version=true, and 4/4 `@netscript/config` export
sections. Verify claims against code rather than trusting this summary.

Return findings ordered by severity with exact file/line references. End with exactly one line:
`SLICE_REVIEW: PASS` if there are no actionable findings, otherwise
`SLICE_REVIEW: CHANGES_REQUIRED`.
