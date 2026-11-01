# Docs freshness / CI log recipe

Changes to docs/site/durable-workflows/sagas.md require regenerating the CLI-shipped
prose, just like the prior #2187 triggers page. Run gen:agent-docs-prose then
gen:publish-assets. Verify check:agent-docs-prose, check:mcp-export-corpus,
check:publish-assets and check:assets-barrel (last one compares committed output).
A quality failure at check:agent-docs-prose can occur after lint/format/examples
all pass. If the overall workflow is still running, use the completed job log via
`gh api --allow-escape-sequences repos/rickylabs/netscript/actions/jobs/<job>/logs`.
Repeated PR notifications for the same failed job do not represent new failures.
