# Current baseline research

Baseline ad252e8c8 is the assignment's main snapshot. Source PR #2493 at dd442e82794c4b960e51529f1c7ac534afda75ea remains open; it exports values only, and no listed open/merged PR implements S1b. The branch copies its exact nine-collection snapshot. Read fresh README and PR notes. Read prior S1/S2 memory notes before source.

Load-bearing code: importFigmaTokens iterates every collection and overwrites values[name]; adding Theme B unchanged would overwrite active routing. figmaModes lacks Theme set/B. Shadow and geometry read Theme directly. applyPresetOverlay still supplies Bloom/Liquid values from old node docs; Theme B now owns those values, so remove old scalar overrides and use the router values. Existing pack aliases can remain only where they express a consumer mapping and agree with new Figma ownership; all new core role values must follow Scheme/Theme set. Four name migrations already exist and are retained.

The registry independently lists names/types; 277 new WEB names need explicit additions. Theme set routing does not add three copies per shared name. Source FLOAT opacity requires a unitless number rather than the old catch-all dimension conversion. Faithful modes exist in Theme B but require full resolver proof. Theme modes Ledger, Signal and Glass also deserve independent presets, beyond Studio flavor aliases.

Architecture: existing Fresh UI Archetype 4; existing domain/adapters token seam, no new port necessary. CLI stays Archetype 6. No new exports/functions planned; additive TokenPreset fields and TokenContrastPair scheme filtering are documented types. Use explicit return/declaration types. JSR risks: import attributes forbidden in publishable modules, enlarged raw source payload; mitigate via existing gzip TypeScript embeddings and native publish-size test, release preflight, doc lint and package audit. No dependencies or lock changes planned.

DTCG bundled schema has no string/fontStyle token type. Preserve Italic using fontWeight carrier + exact css and figmaStyle extensions, propagated through BuiltToken to Figma round-trip; no vendored schema edits.
