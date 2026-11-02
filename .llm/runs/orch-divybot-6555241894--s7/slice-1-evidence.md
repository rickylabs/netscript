# Slice 1 evidence — final repaired tree

- Deno 2.9.7. Static build PASS; rendered output scans 316 HTML files with four existing documented-syntax allowances.
- Freshness PASS: 52 registry component/block pages, 24 published preset stylesheets; maximum component Markdown twin 5,013 UTF-8 bytes (<12,288).
- Generated examples and actual preview source type-check on every build through the structured wrapper. Scoped source check/lint/fmt PASS with complete file coverage using the generated tooling config; no inline suppression added.
- Four generator/codec/native-doc/freshness tests PASS, including changed-input and added-registry-entry controls.
- Browser PASS: 17 tests; three policy skips repeat the full registry census only on light/1280. All twelve required page × scheme × width cases pass (create, button, command-palette; 390/1280; light/dark). The census mounts all 52 actual registry examples. Buttons, layered Escape, shared-code reload/import validation and computed font/radius changes pass. Screenshots visually inspected against the locked Studio reference.
- Real negative control: replace the built Cloud stylesheet with the Utility stylesheet; the computed-token browser test fails (raw exit 1, one failed). Original output bytes restored in finally. Positive run is 17/0 and is distinct from this expected red control.
- Build and site links PASS: 33,127 internal links across 316 pages, zero unresolved.
- Repaired round-1 blocker: publish all 24 canonical preset CSS files and await selected stylesheet loading before mounting/announcing preview readiness. No palette values are duplicated. Normalize only browser font quote/comma serialization in assertions.
- Also repaired: actual preset density attribute, wrapping props/keyboard/APG content on mobile, removed loading placeholder before Preact mounting, actual init positional project name, neutral build output directory.
- Lock metadata delta: one workspace-dependency entry for already-resolved std/fs. No resolved version or integrity change.

No framework API/exports or registry sources changed. MCP routing, canonical carriers, #2410 and full CLI proof remain the declared later slices.
