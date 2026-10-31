# Legacy registry fixture and release residue

The legacy-v1 fixture lives in tests/registry, not a fixtures folder, and findVersionResidue intentionally reads JSON there. Use a non-release semver (`0.0.0-fixture`) rather than excluding tests broadly. registry-authoring.test.ts substitutes current package metadata only for first-party fixture dependencies; a separate assertion still checks all live first-party versions.
