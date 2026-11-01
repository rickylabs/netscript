# Research

- MCP guidance favors statically generated registries and regeneration, with shared selection between writing and inspection.
- Triggers reads every eligible root TypeScript file; workers uses the same scan for local jobs, schedules and plugin-provided jobs; sagas discovers definition-call text recursively and filters manifest excludes afterward.
- Protocol 2 uses each plugin renderer in a read-only subprocess and strictly validates registryPath/sourceFiles/content. Doctor consumes that selection. Optional exclusion evidence must be validated and forwarded without changing existing bytes or producer compatibility when no directive exists.
- Choose the issue's module-level opt-out: an exact first-line comment can be read without importing factory modules or evaluating project config under doctor sandbox restrictions. It travels with the source and applies consistently without plugin-name coupling in the CLI.
- New exported selector has explicit types and JSDoc on the existing @netscript/plugin/cli subpath. No dependency/export-map or permissions changes; JSR audit and doc lint will verify the additive surface.
- Archetypes: plugin CLI support (5), shared plugin tooling and host CLI (6). Existing ProjectFiles and process ports remain the boundaries; no spine/abstract/composition changes.
