# Docs edits require embedded prose refresh

CI quality runs check:agent-docs-prose, which builds the rendered site then compares compressed
CLI consumer prose. Editing docs/site/durable-workflows/streams.md requires native
`deno task gen:agent-docs-prose` then `deno task gen:publish-assets`. Do not hand-edit compressed
rows. Parse carrier rows with parseAgentDocsPages to confirm semantic delta: this task changes
only pages/durable-workflows/streams/index.md and removes no entries. Check with
`deno task check:agent-docs-prose` and `deno task check:publish-assets`; check:assets-barrel's git
freshness verdict must follow the commit. No runtime-source rework or lock churn is needed.
