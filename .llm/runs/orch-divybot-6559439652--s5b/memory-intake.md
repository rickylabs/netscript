# Intake memory

- Deno 2.9.7 is available; `rtk` is absent. Run native commands and preserve wrapper exit codes.
- Public contracts: `packages/fresh-ui/contracts.ts`; registry data: `freshUiRegistryJson` from `packages/fresh-ui/registry.ts`, not `registry-v2.ts`.
- Current baseline: 87 contracts, 66 marked shipped. Registry `style-utility.meta.components` owns source-item mapping. Alias-only contract names need explicit validated identity joins, never fuzzy name guesses. Runtime-only contracts have no copy-registry item yet.
- Token identity carrier: `packages/fresh-ui/src/tokens/assets/figma.generated.ts` exports `collections`. Theme-level bindings target Theme set, never Theme/Theme B. Contract token shorthand includes `SF:`, alternatives `|`, and numeric ranges.
- #2488 and #2538 remain OPEN at intake; reconcile after merge, do not modify S3 files.
- Owner's Refs-only, no-label/public-path/session-ID rules override generic closing-keyword instructions in the delivery template. #2418/#2412 remain open for editor and S3 acceptance.
- Previous memory consulted: NetScript repository memory index, design-system Figma facts, swarm dispatch and code export notes. Durable new notes stay here inside project layout.
