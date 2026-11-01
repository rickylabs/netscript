# Release staging must include compressed registry carrier

Regenerating is not enough: stable/canary commits stage prepareRelease's returned file set. The consumed `packages/fresh-ui/src/registry/assets/registry.generated.ts` gzip carrier must be in PREPARED_RELEASE_GENERATED_OUTPUTS, because plain-text residue and specifier scans cannot inspect encoded pins. Regression must assert staging AND decode the production encoder output after bumping. A dry-run never proves commit staging on its own.
