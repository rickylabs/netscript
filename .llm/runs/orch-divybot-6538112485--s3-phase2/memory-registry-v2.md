# S2 registry integration

S2 merged as main6b7f152. Author registry.json, not registry.manifest.ts (now a
compatibility projection). Each new item needs protocol type/files, native
meta.netscript legacy fields, style-utility.meta.components mapping and a suitable
collection. Root gen:assets-barrel refreshes registry JSON embedding first.

The historical tests/registry/legacy-v1.json is frozen. Post-v1 identities are
explicit in tests/registry/post-v1-items.ts; existing entries must still match
exactly. Generic installed-source proof must assert that list to avoid a vacuous
pass. Native registry-v2 item count and registry.ts collection docs are also gates.
MCP corpus generator refuses a dirty read set; commit source first or use its
explicit --allow-dirty flag deliberately, then verify freshness at final head.
