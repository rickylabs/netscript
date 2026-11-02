# Carrier and CI recipes

Deno 2.9.7 is installed. RTK is absent on this host. Carrier order: `gen:agent-docs-prose`, `gen:mcp-export-corpus --allow-dirty`, `gen:assets-barrel`, `gen:publish-assets`. Assets check compares the working tree to HEAD, so check after committing generated carriers. Draft policy skips PR workflows; manual e2e-cli workflow_dispatch runs the full Docker runtime on a branch without labels.
