# Research

Re-baselined at c6bce8f86 (current checkout/main). No matching Figma implementation
PR or orchid-triage duplicate was found by live issue/PR search.

S1's importFigmaTokens already expands all nine collections using figmaModes and
resolveFigmaValue. Its script compacts shared contexts and writes eight DTCG
sources, including the existing resolver and authored component document. Expose
that composition as a shared pure function; the plugin must not fork resolution.
S2's registry client validates the published registry-item schema and resolves
inline/remote files. prepareUiRegistryInstall stages copies, hashes and lock
metadata. TokenEnginePort already accepts caller-supplied sources and compiles
through the public builder. applyUiPreset currently decodes URLs only as share
links; init currently has --from but no --preset.

The handoff fixtures define exact property ordering, UTF-16 name sorting, raw
FLOAT precision, WEB syntax omission rules and collection-order index metadata.
Code-owned role-manifest.json and name-migrations.json are independent of export.
Upstream TokensBrücke is https://github.com/tokens-bruecke/figma-plugin at
 ded44a2e1f825e82d4888dd27fc056062da642f7. Carry its MIT LICENSE verbatim and
fork its RGB/OKLCH conversion with its existing license header intact.

JSR planned-surface audit: only a typed shared Figma-to-source function and
Figma collection types widen the existing tokens entrypoint. No new package,
no JSON import attributes, no node-dependent builder bundled into Figma.
CLI uses existing injected filesystem/transport/token ports. Risks: slow types,
carrier freshness, and publish payload size; prove with doc-lint, release
preflight, audit and publish-size test. Existing CLI archetype 6 stays intact.
