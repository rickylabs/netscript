# Research

- #2497 is merged in baseline; its body explicitly defers empty registry semantics to #2162.
- Protocol 2 saga/trigger renderers already emit typed empty maps. Workers instead emits null
  for absent/empty primary source folders, removing its registry; this also skips pluginDirs.
- Legacy/protocol 1 installed generator throws EmptyPluginRegistryError before invoking its
  declared generator. Preserve the exported error class for API compatibility but stop throwing
  solely for zero source files.
- Shared host doctor compares generator-selected sources and already distinguishes missing or
  stale outputs. A valid zero-source registry can become warning here for all plugins without
  introducing severity fields into the boolean adapter DoctorReport contract.
- Saga/worker adapter checks separately reject zero declarations and must accept complete empty
  exports. Missing/incomplete registries must remain errors. Triggers has no equivalent extra check.
- Saga supervisor already registers an empty list, starts dependencies and reports definitionCount
  and child readiness. Prove current production startup instead of changing lifecycle speculatively.
- Public API scan: preserve exports, no dependency/version changes planned, no slow-type risk from
  additive exports. Existing package metadata/doc findings remain baseline unless changed here.
- Consulted prior #2161 run memory: use claude-print.ts with closed stdin; keep raw evaluator
  logs private; init local-source fixture beneath checkout with Aspire files present; no full
  runtime smoke locally. Use isolated KV for focused startup, workers needs a streams dependency.
