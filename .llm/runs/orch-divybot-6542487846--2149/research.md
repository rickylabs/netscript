# Research

Re-baselined against main `851d1ce92d91352aa0d7b9c29ba6e3e4ee39bae2`; remote main matches. Issue 2149 has no literal Acceptance boxes and no triage comment. No existing PR found.

NetScript MCP `find_guidance` then `search_docs` recommended plugin-owned composition and declarative manifests. Existing public and local install paths resolve static `scaffold.plugin.json` before registering providers and planning DB provisioning. Auth declares SQL in provider.defaultRequiresDb, infrastructureRequires, officialSource.requiresDb and adapter.install.prismaContract. Its runtime manifest currently declares no dbSchemas. Runtime defaults to kv-oauth. CLI auth configuration persists backend to .env and appsettings.

Public install fetches all published schema fragments when DB detection requires SQL. Local plugin-owned install currently looks only in the generated plugins directory, although auth emits userland under auth/ and keeps the schema in the source package. Negative-control proof must cover that source-backed path too.

Doctrine verdict: CLI Archetype 6, auth Archetype 5, plugin core manifest contract. Preserve core conventions and plugin-owned data. Relevant existing debt AUTH-BACKEND-ENV-CENTRALIZATION concerns backend runtime construction; this work neither expands nor resolves it.

JSR surface scan: existing explicit exports/typed adapter entrypoints; add one optional, strictly validated installer metadata field with explicit exported interfaces. No inference-heavy builder API, dependency/version bump, or runtime service changes. Existing consumers without the optional declaration retain behavior.
