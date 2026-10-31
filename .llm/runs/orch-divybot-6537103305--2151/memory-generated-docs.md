# Generated documentation and dependency metadata

After public export/reference changes, regenerate `gen:mcp-export-corpus --allow-dirty`, `gen:agent-docs-prose`, then `gen:publish-assets` in that order. The explicit dirty flag is needed before the source commit; generation checks have no such flag. Re-run the generators after merging another leaf so both carrier updates survive. Run the assets-barrel git-diff freshness gate after committing intended generated changes.

Adding existing dependency declarations still updates four lockfiles: root, expo-streams, desktop fixture, and fresh-ui private lock. Use the native resolver in the right context and the desktop refresh task. Keep the computed workspace metadata and restore unrelated peer-key normalization. This run adds no versions or integrity changes.

JSR audit's “Checking for slow types...” banner count is not an actual slow-type failure; use native publish dry-run as the verdict. Baseline private-type doc-lint debt must be compared by file and count, not silently described as green.
