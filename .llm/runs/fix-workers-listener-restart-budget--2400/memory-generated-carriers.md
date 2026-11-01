# Required generated carriers

Worker public API changes stale the MCP export-surface corpus. Tuning guide changes
stale the CLI/MCP prose bundle. Run gen:agent-docs-prose and gen:mcp-export-corpus,
then their check tasks. The export generator requires a committed packages/plugins
read set by default; --allow-dirty is its supported preview path while a reviewed
main merge is pending. Review the emitted corpus and commit the source and its
carrier together; regression tests that clone HEAD run after the commit.
The actual corpus output lives at
packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts.
