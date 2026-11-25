# Changelog

## Unreleased (0.0.10)

- Introduce `@netscript/plugin-directory-core` with the provider-neutral `DirectoryPort` contract
  (`searchUsers`, `searchGroups`, `getUser`, `memberOfAny`, `health`), `DirectoryRef`, bounded
  `Page<T>` with mandatory capped `limit` and `truncated`, and consistency metadata (`evaluatedAt`,
  `consistency`).
- Add typed directory errors (`DirectoryUnavailable`, `DirectoryUnauthorized`, `DirectoryTimeout`,
  `DirectoryUnsupported`) and `isDirectoryError`, following the
  `AuthBackendOperationUnsupportedError` pattern.
- Add the `./testing` export with `createDeterministicClock`, `createInMemoryDirectoryPort`,
  `DIRECTORY_CONFORMANCE_DATASET`, `runDirectoryConformanceSuite`, and `verifyDirectoryConformance`.
