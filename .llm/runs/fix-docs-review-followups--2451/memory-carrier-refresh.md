# Carrier refresh commands

On the clean merged source, run `deno task gen:agent-docs-prose`, `deno task gen:mcp-export-corpus`, `deno task gen:assets-barrel`, then `deno task gen:publish-assets`. All four succeeded without changing any tracked file at main 6a1d84a, including docs/site/deno.lock. No allow-dirty override was needed.

Enumerate every root `check:*` task from deno.json rather than assuming the four carrier checks are the full set. `check:review-threads` requires `-- --repo rickylabs/netscript --pr 2452 --pretty`. Use native gate receipts where catalogued; raw logs and receipts stay private because they contain machine paths. Public evidence contains repo-relative commands and result summaries only.

The pinned docs browser runner is Playwright 1.63.0 and uses Chromium/headless shell revision 1243. Read-only `npx playwright install --dry-run chromium` identifies the cached revision; do not assume the older memory's revision 1248 applies to this lock.
