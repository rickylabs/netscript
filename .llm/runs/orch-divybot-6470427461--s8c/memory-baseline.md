# Baseline and existing delivery

RTK is unavailable in this worker. Use focused commands and native structured Deno wrappers. No matching persistent NetScript memories were found; prior tracked S8/S8b memory notes were consulted.

At baseline d6dfab0, #2451 is marked complete in its issue but its implementation PR #2452 (b0d5a16) is still open, not merged. Reuse its reviewed fixes in slice 5 instead of assuming main contains them. #2457 documents semantic colour rules and does not implement S8c.

Docs tasks run from docs/site (`deno task --cwd docs/site verify`). Lume source/rendered checks, links and caveats remain mandatory. Browser suite uses tools/fresh-ui-browser/docs.playwright.config.ts. The local MCP works via packages/mcp/cli.ts; find_guidance takes intent and search_docs takes query. Changes to rendered Markdown twins require the native agent-docs-prose and publish-assets generators and freshness gates.
