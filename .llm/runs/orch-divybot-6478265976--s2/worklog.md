# Worklog

## Design

1. **Public surface:** JSON registry schema and `/registry-v2`; `ui:build`, `ui:init --preset`, `ui:add --diff`, `ui:update`, `ui:apply --preset --only`, `ui:view/search/list/docs/info`, `ui:registry add|validate`, `ui:preset decode|url`; four MCP registry tools. Existing page/island commands remain supported.
2. **Domain vocabulary:** Registry/RegistryItem/RegistryFile, item type, namespace, registry source, app config, preset, style component map, install plan, lock entry, file baseline, local edit and diff.
3. **Ports:** existing FileSystemPort and TokenEnginePort; new registry transport (network/env seam), MCP registry query port. Native Web APIs provide URL, Headers, crypto.subtle and AbortSignal; Ajv validates published JSON Schema. No DI container or new abstract class.
4. **Constants:** twelve item types; schema URIs/version; `components.json`, `fresh-ui.lock.json`; default aliases; Utility style; preset version and public create URL; namespaced tool/command names.
5. **Commit slices:** schema → ui:build → config/lockfile → commands → style/docs → MCP. Exact surfaces and per-slice gates are in plan.md. The current Cliffy factory pattern is preserved; no changes to the five existing CLI spine abstracts, registries or their type parameters.
6. **Deferred scope:** actual alternate component styles and ui:migrate belong to S3; no component source edits, merge/tag/release or three-way merge.
7. **Contributor path:** the registry-v2 README will describe registry.json authoring, style source maps, config/lock behavior and every public command; implementation entry is `/registry-v2` and the UI command composition feature list.

## Bootstrap

- Assignment read in full; issue body and comments read live. No orchid-triage report or duplicate S2 PR found.
- Memory consulted and local MCP find_guidance/search_docs queried before implementation.
- Feature routing resolved through the pinned matrix; exact owner evaluator override recorded in supervisor.md.
- RTK unavailable; direct noninteractive tools used. No locks/caches deleted or reloaded.
- Public notes omit private runtime identity and paths. Assignment-specific Refs-only/no-label constraints supersede generic GitHub templates.
- PLAN-EVAL pending; no implementation started.
