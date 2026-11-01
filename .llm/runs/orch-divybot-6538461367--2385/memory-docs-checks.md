# Docs command examples — durable memory

The plugin lifecycle table uses an HTML exampleTable in Markdown, not a shell fence. The existing docs:snippets walker reads all .md/.vto and is the correct shared gate extension point; fence-only command checks miss this bug. Site build emits Markdown twins consumed by the agent docs bundle. Stored CLI carrier regeneration writes packages/cli and requires scope authorization; do not silently weaken freshness checks to keep a docs-only lane green.
