# Registry release discovery

Stable and canary share prepareRelease → coordinateVersionBump in `.llm/tools/deps/bump-version.ts`. Add a live release asset to discoverVersionFiles, not to the residue exclusion list. prepareRelease already builds docs-site registry and refreshes generated carriers before residue validation. The emitted-specifier scanner already includes JSON; registry-specific tests pin this behavior.
