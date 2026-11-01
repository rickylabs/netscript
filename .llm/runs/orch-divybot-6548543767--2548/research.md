# Research

Baseline is recorded in supervisor.md. Issue comments contain no orchid-triage report; GitHub search found no existing PR covering #2548. Consulted retained site-build, carrier-followup, and environment memories before code research.

`coordinateVersionBump` in `.llm/tools/deps/bump-version.ts` discovers workspace manifests, plugin scaffolds, and tracked locks. The release helper already regenerates docs registry JSON and embedded/publish carriers before residue checking, but the canonical registry is absent from discovery. Its three first-party dependency pins currently match 0.0.8; leaving them behind during the bump breaks the cut.

`check:netscript-jsr-specifiers` already walks JSON in packages and compares exact pins to workspace manifests. Extend its explicit regression coverage for registry JSON rather than duplicate the scanner. The legacy-v1 fixture includes the same three release pins outside a fixtures directory, so use a valid non-release fixture version.

Doctrine: tooling Archetype 6; Fresh UI remains Archetype 4. No new exports, dependencies, runtime layers, or slow-type surface. Existing debt is not deepened.
