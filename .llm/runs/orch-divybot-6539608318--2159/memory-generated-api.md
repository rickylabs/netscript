# Public API metadata refresh

After adding public atomic saga capability symbols, `check:mcp-export-corpus` correctly reports
staleness. Commit the package/plugin source first, then use `deno task gen:mcp-export-corpus` on that
clean read set and commit the generated corpus with run updates. The generator guards its read set;
do not bypass it. Its regression tests use committed HEAD, so run them after the artifact commit.
