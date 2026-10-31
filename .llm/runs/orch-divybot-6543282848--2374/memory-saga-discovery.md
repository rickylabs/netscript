# Saga generation and doctor seams

Canonical explicit saga declaration is existing defineSagaConfig(id, project-relative entrypoint), in scanned .config.ts companions or root netscript.config.ts. Runtime entrypoints can be outside conventional scan roots (documented plugins/sagas form). Keep config discovery static; no config/application imports.

Root generate plugins uses plugin-owned protocol-2 rendering; dry-run plugin doctor reuses selected source paths through checkRuntimeRegistryDrift. Frozen inspection requires an existing consumer lock; prepare it with ordinary generation in fixtures before invoking dry-run. A stale empty registry with declarations must report a missing generator-selected source. The adapter's FileSystemPort cannot list files; do not introduce filesystem scans there.
