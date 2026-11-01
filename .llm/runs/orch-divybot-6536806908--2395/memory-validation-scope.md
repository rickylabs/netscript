# Validation scope and real results

Whole queue suite after the fix: 131 passed, 2 CI sentinels ignored, exit 0, including real
Redis and Garnet Lua-on suites and a separate real Garnet Lua-off negative configuration.
Generator suite: 25 passed, exit 0. Quality+architecture/dependency gate receipt exit 0.

Root formatting/lint config explicitly excludes packages/cli. Passing --config to the member
still inherits workspace exclusions and returns no targets. Use a standalone temporary config
with the existing CLI style (100 columns, 2 spaces, single quotes, no semicolons) to let the
structured wrappers validate the two actual owned CLI files; retain full processed-file coverage.
Use existing bare @std imports in the changed test rather than inline jsr imports.

Full-export queue doc-lint also includes imported KV surfaces; compare the baseline before
attributing its WatchableKv private-type-ref diagnostic to this PR. Structured JSR audit's
slowTypeWarnings=1 is a banner false-positive when dry-run says OK; inspect the actual dry-run.
