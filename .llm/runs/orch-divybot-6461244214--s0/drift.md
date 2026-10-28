# Drift

- 2026-10-28: RTK absent; saved environment memory confirms plain commands are appropriate.
- 2026-10-28: Current private lock already contains `path-scurry@2.0.2 -> lru-cache@11.5.1`; investigate actual frozen-build behavior rather than apply the obsolete lock diagnosis.
- 2026-10-28: NetScript MCP tools are not connected to this tool host; use the local stdio server for the requested guidance before implementation.
- 2026-10-28: After current-main fast-forward, the reported LRUCache failure reproduces. Earlier successful reproduction applied only to the dispatcher’s old checkout, not the implementation baseline.
- 2026-10-28: Deno resolved the requested Style Dictionary upgrade but retained the malformed existing path-scurry edge. Repaired the edge explicitly with root-lock lru-cache 11.5.1 integrity, preserving jsonld 6.0.0. Transient root-lock changes from implicit workspace lock selection were restored; only the authorized private lock diff remains.
- 2026-10-28: Supplemental full-export doc-lint reports 123 existing interactive-surface diagnostics (96 private-type-ref, 27 missing-jsdoc). This slice changes no public runtime types; retain the failure explicitly rather than claiming a clean full documentation audit. JSR audit and publish dry-run results are recorded separately.
