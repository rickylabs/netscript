# Research

Baseline: `9a31e879c32a8066c50946a57976f3da34ba43a6`, current main at assignment checkout. No PR implementing S2 found by issue and registry searches; S1 tokens v2 merged as #2435. #2463 establishes styles over the shared component contract.

NetScript MCP was queried via its local newline stdio transport: `find_guidance` with `intent` and `search_docs`. It recommends Customize Fresh UI, the Fresh UI reference, token commands, and GUIDELINES §2.4. The tool requires `intent`, not `task`.

Existing public registry is `packages/fresh-ui/registry.ts`, backed by `registry.manifest.ts` and embedded content. Existing CLI use cases live in `kernel/application/ui/registry.ts`; public command factories and root command tree compose them. The installer rewrites copied relative imports, assembles CSS imports, and merges Deno import mappings; these behaviors must survive. Existing registry kinds include island/support, which will map to component/file in the protocol while retaining compatibility metadata.

`buildAppTokens` already owns app token compilation, semantic overrides, preset validation and generated outputs. `FreshUiTokenEngine` is injected at composition. S2 reuses this flow for apply; it must not duplicate token compilation.

Upstream consulted on 2026-10-28: https://ui.shadcn.com/schema/registry.json, https://ui.shadcn.com/schema/registry-item.json, https://ui.shadcn.com/docs/registry/registry-json, https://ui.shadcn.com/docs/cli. The twelve `registry:*` item types and the published draft-07 schemas are the compatibility reference. Exact downloaded schema hashes will identify the matched snapshot; no mutable latest-version claim.

Environment memory consulted before implementation. RTK is absent; direct commands are the available fallback. CLI formatter/linter wrappers need an explicit temporary config when repository exclusions would drop CLI files. MCP embedded docs have a budget; new public instructions belong in a dedicated page rather than enlarging embedded pages.

Doctrine: CLI Archetype 6, registry contract Archetype 1 inside existing Fresh UI, MCP Archetype 2. Current doctrine verdict is Keep for all three. Public exports stay explicit, functions have declared types/JSDoc, effects stay injected. No new dependency version or lockfile change is planned; Ajv 8.20.0 is already used by the token schema validator.

Exact upstream reference: shadcn CLI `4.23.0`, Git commit `96da9cc7f1aa10580a3741664e2a77c721206c00`. Schema snapshot SHA-256: registry `e716ebe595bbc189db2627cb75f0484cd765a09eb397a89b1f1c49074220d4bb`, item `cdf0fba75a26ebf594018264eff2d55407ec14deb3071d0fce0e2b20848e5d44`. Existing registry contains 85 items and 8 collections. Baseline focused wrapper tests: 18 passed, 0 failed, 0 skipped. Baseline quality and architecture tasks exit 0 (existing warnings remain).
