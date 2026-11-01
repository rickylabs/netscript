# Generated freshness is a PR gate — 2026-10-31

The full quality job runs check:agent-docs-prose, check:mcp-export-corpus, check:assets-barrel and
check:publish-assets on PRs. A main-branch regeneration workflow does not waive those checks.
Refresh with gen:agent-docs-prose, gen:mcp-export-corpus, gen:assets-barrel and gen:publish-assets
as needed. Never hand-edit compressed carriers. check:assets-barrel uses git diff --exit-code,
so its final pass must be checked after the generated files are committed.
