# Drift

2026-11-01: After first PLAN-EVAL, used the owner's explicit continuation/fan-out authority
to bound PR #2577 to #2580 Northwind orders foundation. Parent #2571 retains unfinished
background/auth/durable chat/full runtime and full visual acceptance. Independent MCP
service discovery is #2581. This is a scoped tracker leaf, not completion of #2571.

The selector is existing --from northwind instead of introducing --example showcase.
The source review disproved assumed plugin-recipe placement and ready-made durable chat/
MCP server support. Revised plan removes those assumptions from this leaf, preserves all
parent requirements, and chooses an app-owned MCP server for the eventual composition.
No new architecture violation accepted. No external auth/AI or full showcase runtime claim.

S1 regression exposed an existing dry-run filesystem inconsistency: exists reported
preview-created directories, but readDir delegated to absent on-disk paths. Service
auth discovery therefore crashed for a new dry-run project. Extend readDir to merge
recorded children with existing entries; this is required for the preset's write-free
preview contract. Add focused coverage; normal on-disk scaffold output stays unchanged.
