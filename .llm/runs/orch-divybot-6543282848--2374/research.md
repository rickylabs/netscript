# Research (current main 14816a409e31505bc528714332b0bf4670be2fcb)

NetScript MCP find_guidance(intent) then search_docs consulted. Plugin-system guidance makes generated static registries the declaration-to-runtime seam. Prior environment memory consulted; no covering PR found on live #2374.

`defineSagaConfig(id, entrypoint)` already owns the id and project-relative runtime entrypoint; the saga resource scaffolder emits a separate `.config.ts` with precisely that call. Use this existing declaration, not a new host config or manifest field. The manifest owns scan roots, suffix conventions and filename exclusions, not per-application saga identities.

The existing inspector scans .ts/.tsx under roots, recognizes builder ids by text, and omits factory exports. The generator excludes config modules and applies suffixes before shared selectRegistrySources. #2161 supplies the exact first-line ignore directive; #2509/#2162 permit empty output. Root generate plugins uses the plugin-owned protocol-2 renderer; root plugin doctor uses that same renderer and `checkRuntimeRegistryDrift` to compare expected source paths with actual imported-and-bound paths. This existing host check can prove doctor parity without adding filesystem effects to the thin plugin adapter (its port cannot list files).

The shared SDK AstExtractor extracts exported contribution symbols but does not extract call arguments; it cannot resolve this declaration. No parser dependency is needed: a bounded source lexer recognizes the existing direct-call declaration syntax while skipping comments/string contents. Do not broaden runtime builder heuristics.
