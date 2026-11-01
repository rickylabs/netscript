# R3 native regeneration

Only the generated CLI prose carrier conflicts when merging main f683946 into
dfa2502be. Preserve the tuning guide auto-merge, take ours provisionally for the
carrier, then run gen:agent-docs-prose, gen:publish-assets and gen:mcp-export-corpus
--allow-dirty. Run all three check tasks without --allow-dirty. Stage the final
regenerated carrier explicitly: resolving the index before generation can leave
an old staged payload. Child-health docs, provenance and policy output were stable.
Read the complete combined page: scheduler ownership, retry/DLQ, restart budget,
Redis polling and abort guidance address distinct concerns without contradiction.
