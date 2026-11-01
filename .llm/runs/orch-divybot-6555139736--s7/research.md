# Research

Baseline 6a1d84a6 contains S8b's generated Design system group and S3 contracts. Issue #2420 has no orchid-triage comment and no existing PR found by issue search. Deno is exactly 2.9.7.

- `packages/fresh-ui/tokens.ts` exposes TOKEN_PRESETS: 24 presets. `TokenPreset` fixes every axis except scheme. The resolver orders density before preset, so independent accent/radius/font/density/menu controls would misrepresent installed output. Show effective values; Studio flavor selects a real preset. No registry font items exist. Icon library is a config string, not a supported renderer selector; do not invent visual options.
- `packages/cli/src/kernel/domain/ui/ui-preset.ts` is the existing browser-compatible ns1_ codec (Zod plus Web APIs). Its choices are version/theme/style/font/iconLibrary; style-utility is the default style item. Import it for the browser bundle; do not copy encoding logic.
- Registry JSON currently has 41 registry:component and 11 registry:block entries. Iterate metadata, never hardcode the page census. S3 component contracts supply keyboard, token roles, props behavior, planned-vs-shipped distinctions. Native `deno doc --json --private` supplies real signatures and local prop definitions, including unexported aliases.
- Lume builds static HTML and Markdown twins from `.page.ts`. Existing generated design pages establish layout and navigation. Site config is independent from root; Preact previews must be bundled under the Fresh UI config, not site's React JSX config.
- Use isolated iframe preview documents to prevent preview token CSS from restyling docs chrome. Bundle actual registry TSX and interactions; preserve desktop/MCP capability boundaries with truthful examples.
- `ai-tooling.ts` already guards base-prefixed root links; expand regression coverage to xref-produced links. `renderCallout` currently leaves backticks in its content string. Fix at the shared renderer and test real Vento plus twins.
- The agent-docs generator consumes built Markdown twins; publish generation embeds selected pages. Keep each component page below 12,288 bytes and test corpus retrieval, including newly added component metadata.
- Prior S8/S8b memory confirms site build, links, structured wrapper config, carrier order and browser recipes. No dependency changes are planned.
