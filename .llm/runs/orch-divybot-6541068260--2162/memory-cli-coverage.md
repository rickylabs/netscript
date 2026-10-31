# CLI style coverage

Root lint/fmt excludes packages/cli. Structured wrappers correctly refuse partial coverage.
Copy root fmt/lint rule objects into a private explicit config, omitting only include/exclude,
then pass --config with explicit --file arguments. Expect selected == processed and no dropped
files. For writes, run the formatter wrapper with --write and --allow-write as well.
plugin install in the current maintainer CLI has no --ci option; it is already noninteractive.
