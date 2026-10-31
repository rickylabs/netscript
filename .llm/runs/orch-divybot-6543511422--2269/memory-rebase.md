# One-time owner-authorized rebase

This run initially forbade rebase/force-push; a later explicit owner instruction authorized both
for PR 2529's merge conflict. That is a scoped override, not general permission for future runs.
Protect the rewrite with an exact expected remote SHA in --force-with-lease. Two conflict stops
were both MCP publish metadata; run gen:publish-assets against the combined moved page carrier
rather than choosing ours/theirs and losing upstream authored prose. Per-row page and export
carriers merged upstream auth/saga changes normally. Re-run all carrier freshness and consumer
fixtures, refresh citation evidence and obtain a new exact-head independent verdict after rewriting.
