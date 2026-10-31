**Verdict: PASS** (S2 source slice review; this does not cover S3–S6)

S2 is correct for what it claims: a byte-exact snapshot from the Plugin API, a lossless round trip through DTCG 2025.10, the code-owned name check, and MIT attribution. I found no defect that blocks the slice. I read the files without running anything, so the five passing tests rest on your report.

## What I verified

- **Licence.**
  - `LICENSE` contains the standard MIT text with "Copyright (c) 2023 Pavel Laptev".
  - `NOTICE` gives the upstream URL, the exact commit, the source file `upstream/normalize-rgba.ts` was derived from, and the local changes.
  - I couldn't compare `LICENSE` byte-for-byte with upstream without network access.
- **Snapshot export (`tools/figma-plugin/src/snapshot.ts`).**
  - Collection order is fixed and variables are sorted by UTF-16 name.
  - Fields come out in the fixture order. An empty WEB syntax and an empty description are omitted.
  - FLOAT values stay raw, so `-2.4000000953674316` is asserted. Colour channels use `Math.round(c*255)`, and alpha is no longer rounded to two decimals, which upstream did.
  - An alias to a variable outside the file fails, and so does a missing mode value.
  - The mock is seeded from the embedded NetScript snapshot but compared against the separate handoff fixture files. Its sorting doesn't depend on insertion order, and it asserts zero mutations.
- **DTCG round trip (`figma-round-trip.ts`, `parse-figma-round-trip.ts`).**
  - Colour is exact both ways: sRGB components are hex/255, and import rounds back with the same alpha rule.
  - Variable identities are index-based (`c<n>.v<n>`) and don't depend on Figma IDs.
  - Each mode gets its own document under one per-collection group. Multi-mode collections become resolver modifiers and Primitives is a set, so an alias resolves in the target collection's active mode, which is how Figma behaves.
  - The parser is strict throughout:
    - It rebuilds the resolver from the declared modes and requires the input's resolver to match exactly, so no extra or remote `$ref` can get in.
    - Every document must match its exact inventory with the right types.
    - The 0/1 boolean carrier is enforced.
    - Colours are range-checked.
    - Unknown aliases are rejected.
    - The reconstructed snapshot is checked again with `validateFigmaSnapshot` and the name check.
  - The `fontFamily` carrier for strings and the 0/1 number carrier for booleans are explicit decisions, and the original Figma type stays in the metadata.
- **Name check (`figma-token-names.ts`).** Every variable must match the code-owned inventory: same set, same type, same WEB syntax. Every WEB name, after name migrations, must be a key in the role manifest (keys are `--ns-*`, as I checked). Errors name the collection and variable.
- **Snapshot validation (`domain/figma-snapshot.ts`).** It checks complete modes for every variable, duplicate modes and variables, that each alias targets a variable of the same type, and the value encoding for each type.
- **Public surface.** The new exports in `tokens.ts` have explicit return types. `colorjs.io` and `zod` follow the package's existing dependency patterns.

## Recommended (none block S2)

1. **The alpha edge case doesn't round-trip.** An alpha in roughly (0.998, 1) produces `#rrggbbff`. That is literally what the README specifies, but DTCG import turns it into `#rrggbb`. In `snapshotValue`, drop the alpha byte when the rounded byte is 255, or make the parser keep `ff`, and add a test for it.
2. **Mode names and order aren't checked against the code inventory.** If a mode is removed or renamed, install fails loudly later (`resolveFigmaValue`: "Unknown mode"). An added mode is silently ignored. Add mode equality to `assertFigmaTokenNames` so S3's export refusal and S5's install both get one clear error.
3. **Order isn't enforced on import.** `parseFigmaTokenBundle` accepts collections and variables in any order, which would change serialized output and how identities are assigned. Require the canonical collection order and sorted variable names.
4. **Alias cycles aren't checked before writes.** `validateFigmaSnapshot` says it validates "before the first Figma write", but it doesn't detect cycles. Add a cycle check before S3's two-pass write into Figma, so the file can't be left half-written.
5. **The unknown-name test is weak in places.**
   - The second assertion adds a variable to `input[3]`, which is Theme B, not Scheme, and checks no message. Assert `Unknown Figma token name: Theme B/unknown/new`.
   - Add a test that converts bundle → snapshot → `snapshotFiles` and compares fixture bytes.
6. **Hygiene.**
   - Add an attribution line at the top of `upstream/normalize-rgba.ts`. Upstream appears to have no header to keep, so research's "existing licence header intact" is inaccurate, but a per-file line is cheap insurance for Cockpit's check.
   - `figma-round-trip.ts` and `parse-figma-round-trip.ts` import each other. It works at runtime today, but move the shared constants and helpers (`FIGMA_DTCG_SCHEMA`, `figmaModeFile`, `dtcgType`, the resolver builder) into a leaf module before S3 bundles them.

## For S3

`figma-token-names.ts` pulls in assets that use top-level await and `DecompressionStream`. Keep conversion and name checks in the UI iframe bundle, not in the plugin main thread.

OPENHANDS_VERDICT: PASS
