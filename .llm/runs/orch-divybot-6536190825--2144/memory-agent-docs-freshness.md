# Rendered docs and the shared CLI/MCP carrier

Editing a docs/site recipe also requires `deno task gen:agent-docs-prose`. It renders the site and refreshes `packages/cli/src/kernel/assets/agent-docs-prose.generated.ts`; CLI and MCP share this carrier. Source-format, links and compiled snippets do not prove carrier freshness. Ready-state CI quality runs `deno task check:agent-docs-prose`, so include that gate for recipe changes. The generator owns deterministic output; never hand-edit compressed pages. Inspect its diff and avoid committing lock changes.

Update a PR's final checklist before marking it ready. close-gate reads the live body quickly; rerunning a finished job is forbidden while its parent workflow remains active. A new source head supersedes obsolete-check reruns.
